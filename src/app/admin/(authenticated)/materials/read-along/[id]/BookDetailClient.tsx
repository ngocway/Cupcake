"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";

interface Slide {
  id: string;
  slideNumber: string;
  imageName: string;
  imageUrl: string;
  text: string;
  audioUrl: string | null;
  orderIndex: number;
}

interface Book {
  id: string;
  bookId: string;
  title: string;
  description: string | null;
  slides: Slide[];
}

interface BatchProgress {
  current: number;
  total: number;
  status: "idle" | "running" | "complete" | "error";
  slideStatuses: Record<string, "pending" | "generating" | "done" | "error" | "skip">;
  successCount: number;
  skipCount: number;
}

interface Props {
  bookId: string;
}

export function BookDetailClient({ bookId }: Props) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  // Single slide audio generation state
  const [generatingSlideId, setGeneratingSlideId] = useState<string | null>(null);

  // Playing audio
  const [playingSlideId, setPlayingSlideId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Batch generation state
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    current: 0,
    total: 0,
    status: "idle",
    slideStatuses: {},
    successCount: 0,
    skipCount: 0,
  });

  // Text editing state: slideId -> draft text
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingSlideId, setSavingSlideId] = useState<string | null>(null);

  // Confirm overwrite modal
  const [confirmModal, setConfirmModal] = useState<{
    type: "single" | "batch";
    slideId?: string;
  } | null>(null);

  const fetchBook = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/read-along/${bookId}`);
      const data = await res.json();
      if (data.success) setBook(data.book);
      else toast.error(data.error || "Không thể tải thông tin sách.");
    } catch {
      toast.error("Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  // --- Audio playback ---
  const handlePlayAudio = (slide: Slide) => {
    if (!slide.audioUrl) return;

    if (playingSlideId === slide.id) {
      audioRef.current?.pause();
      setPlayingSlideId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(slide.audioUrl);
    audioRef.current = audio;
    audio.playbackRate = 0.75;
    audio.play();
    setPlayingSlideId(slide.id);
    audio.onended = () => setPlayingSlideId(null);
    audio.onerror = () => {
      toast.error("Không thể phát audio.");
      setPlayingSlideId(null);
    };
  };

  // --- Text editing ---
  const startEditing = (slide: Slide) => {
    setEditingSlideId(slide.id);
    setEditingText(slide.text);
  };

  const cancelEditing = () => {
    setEditingSlideId(null);
    setEditingText("");
  };

  const saveText = async (slideId: string) => {
    setSavingSlideId(slideId);
    try {
      const res = await fetch(`/api/admin/read-along/${bookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideId, text: editingText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi lưu text.");

      setBook((prev) =>
        prev
          ? {
              ...prev,
              slides: prev.slides.map((s) =>
                s.id === slideId ? { ...s, text: editingText } : s
              ),
            }
          : prev
      );
      toast.success("Đã lưu nội dung trang.");
      setEditingSlideId(null);
    } catch (err: any) {
      toast.error(err.message || "Lưu thất bại.");
    } finally {
      setSavingSlideId(null);
    }
  };

  // --- Single slide audio generation ---
  const generateSingleAudio = async (slideId: string, overwrite = false) => {
    setGeneratingSlideId(slideId);
    setConfirmModal(null);
    try {
      const res = await fetch(`/api/admin/read-along/${bookId}/audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideId, overwrite }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setConfirmModal({ type: "single", slideId });
        return;
      }

      if (!res.ok) throw new Error(data.error || "Lỗi tạo audio.");

      toast.success(`✅ Đã tạo audio cho slide ${book?.slides.find((s) => s.id === slideId)?.slideNumber}`);

      setBook((prev) =>
        prev
          ? {
              ...prev,
              slides: prev.slides.map((s) =>
                s.id === slideId ? { ...s, audioUrl: data.audioUrl } : s
              ),
            }
          : prev
      );
    } catch (err: any) {
      toast.error(err.message || "Tạo audio thất bại.");
    } finally {
      setGeneratingSlideId(null);
    }
  };

  // --- Batch audio generation via SSE ---
  const startBatchGeneration = async (overwrite = false) => {
    setConfirmModal(null);
    if (!book) return;

    const hasExisting = book.slides.some((s) => s.audioUrl);
    if (hasExisting && !overwrite) {
      setConfirmModal({ type: "batch" });
      return;
    }

    setBatchProgress({
      current: 0,
      total: book.slides.length,
      status: "running",
      slideStatuses: {},
      successCount: 0,
      skipCount: 0,
    });

    try {
      const res = await fetch(`/api/admin/read-along/${bookId}/audio/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overwrite }),
      });

      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            handleBatchEvent(event);
          } catch {}
        }
      }
    } catch (err: any) {
      toast.error("Tạo audio hàng loạt thất bại: " + err.message);
      setBatchProgress((p) => ({ ...p, status: "error" }));
    }
  };

  const handleBatchEvent = (event: any) => {
    switch (event.type) {
      case "start":
        setBatchProgress((p) => ({ ...p, total: event.total, status: "running" }));
        break;
      case "progress":
        setBatchProgress((p) => ({
          ...p,
          current: event.current,
          slideStatuses: { ...p.slideStatuses, [event.slideId]: event.status },
          successCount: event.status === "done" ? p.successCount + 1 : p.successCount,
        }));
        if (event.status === "done" && event.audioUrl) {
          setBook((prev) =>
            prev
              ? {
                  ...prev,
                  slides: prev.slides.map((s) =>
                    s.id === event.slideId ? { ...s, audioUrl: event.audioUrl } : s
                  ),
                }
              : prev
          );
        }
        break;
      case "skip":
        setBatchProgress((p) => ({
          ...p,
          current: event.current,
          slideStatuses: { ...p.slideStatuses, [event.slideId]: "skip" },
          skipCount: p.skipCount + 1,
        }));
        break;
      case "complete":
        setBatchProgress((p) => ({
          ...p,
          status: "complete",
          successCount: event.successCount,
          skipCount: event.skipCount,
        }));
        toast.success(`🎉 Hoàn thành! Đã tạo ${event.successCount} audio, bỏ qua ${event.skipCount} slide.`);
        break;
      case "error":
        toast.error("Lỗi: " + event.message);
        setBatchProgress((p) => ({ ...p, status: "error" }));
        break;
    }
  };

  const slidesWithAudio = book?.slides.filter((s) => s.audioUrl).length ?? 0;
  const totalSlides = book?.slides.length ?? 0;
  const isBatchRunning = batchProgress.status === "running";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-neutral-400 text-sm font-medium">Đang tải thông tin sách...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-neutral-600 mb-4 block">error</span>
          <p className="text-neutral-400">Không tìm thấy sách.</p>
          <Link href="/admin/materials/read-along" className="text-blue-400 hover:text-blue-300 text-sm mt-4 inline-block">
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/materials/read-along"
              className="w-9 h-9 bg-neutral-800 hover:bg-neutral-700 rounded-xl flex items-center justify-center transition-all border border-neutral-700 shrink-0"
            >
              <span className="material-symbols-outlined text-neutral-400 text-lg">arrow_back</span>
            </Link>
            <div>
              <div className="text-xs text-neutral-500 font-mono mb-0.5">ID: {book.bookId}</div>
              <h1 className="text-xl font-bold text-white">{book.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 px-3 py-1.5 rounded-xl">
              <span className="material-symbols-outlined text-sm text-green-400">graphic_eq</span>
              <span className="text-sm font-bold text-white">
                {slidesWithAudio}<span className="text-neutral-500 font-normal">/{totalSlides}</span>
              </span>
              <span className="text-xs text-neutral-500">audio</span>
            </div>

            <button
              onClick={() => startBatchGeneration(false)}
              disabled={isBatchRunning}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_4px_20px_rgba(139,92,246,0.3)] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBatchRunning ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang tạo...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">record_voice_over</span>
                  Tạo tất cả audio
                </>
              )}
            </button>
          </div>
        </div>

        {/* Batch progress bar */}
        {(isBatchRunning || batchProgress.status === "complete") && (
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-neutral-300 font-medium">
                {isBatchRunning
                  ? `Đang tạo: ${batchProgress.current}/${batchProgress.total}`
                  : `✅ Xong: ${batchProgress.successCount} tạo mới, ${batchProgress.skipCount} bỏ qua`}
              </span>
              <span className="text-neutral-500 tabular-nums">
                {batchProgress.total > 0 ? Math.round((batchProgress.current / batchProgress.total) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: batchProgress.total > 0 ? `${(batchProgress.current / batchProgress.total) * 100}%` : "0%",
                  background: batchProgress.status === "complete"
                    ? "linear-gradient(90deg, #22c55e, #16a34a)"
                    : "linear-gradient(90deg, #8b5cf6, #6366f1)",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Slides Grid — 5 per row */}
      <div className="grid grid-cols-5 gap-3">
        {book.slides.map((slide) => {
          const batchStatus = batchProgress.slideStatuses[slide.id];
          const isGenerating = generatingSlideId === slide.id || batchStatus === "generating";
          const isPlaying = playingSlideId === slide.id;
          const hasAudio = !!slide.audioUrl;
          const isEditing = editingSlideId === slide.id;
          const isSaving = savingSlideId === slide.id;

          return (
            <div
              key={slide.id}
              className={`bg-neutral-900 border rounded-2xl overflow-hidden transition-all shadow-md flex flex-col ${
                batchStatus === "done" || (hasAudio && !batchStatus)
                  ? "border-green-900/40"
                  : batchStatus === "error"
                  ? "border-red-900/40"
                  : isEditing
                  ? "border-blue-700/60"
                  : "border-neutral-800"
              }`}
            >
              {/* Slide image */}
              <div className="relative aspect-[4/3] bg-neutral-950 overflow-hidden shrink-0">
                {slide.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={slide.imageUrl} alt={`Slide ${slide.slideNumber}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-700">
                    <span className="material-symbols-outlined text-3xl">image</span>
                  </div>
                )}

                {/* Slide number */}
                <div className="absolute top-1.5 left-1.5 bg-neutral-950/90 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[10px] font-bold text-blue-400 border border-neutral-700">
                  {slide.slideNumber}
                </div>

                {/* Audio status */}
                <div
                  className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-lg text-[10px] font-bold border backdrop-blur-sm flex items-center gap-0.5 ${
                    isGenerating
                      ? "bg-yellow-950/80 text-yellow-400 border-yellow-900/50"
                      : batchStatus === "error"
                      ? "bg-red-950/80 text-red-400 border-red-900/50"
                      : hasAudio
                      ? "bg-green-950/80 text-green-400 border-green-900/50"
                      : "bg-neutral-800/80 text-neutral-500 border-neutral-700/50"
                  }`}
                >
                  {isGenerating ? (
                    <svg className="animate-spin h-2.5 w-2.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : hasAudio ? (
                    <span className="material-symbols-outlined text-[10px]">check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined text-[10px]">radio_button_unchecked</span>
                  )}
                  {isGenerating ? "" : hasAudio ? "Audio" : "Chưa"}
                </div>
              </div>

              {/* Text area */}
              <div className="p-2.5 flex-1 flex flex-col gap-2">
                {isEditing ? (
                  /* Edit mode */
                  <div className="flex flex-col gap-1.5">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={3}
                      autoFocus
                      className="w-full text-xs text-white bg-neutral-800 border border-blue-600 rounded-lg px-2 py-1.5 resize-none outline-none focus:border-blue-500 leading-relaxed"
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => saveText(slide.id)}
                        disabled={isSaving}
                        className="flex-1 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 transition-all disabled:opacity-50"
                      >
                        {isSaving ? (
                          <svg className="animate-spin h-2.5 w-2.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <span className="material-symbols-outlined text-[11px]">check</span>
                        )}
                        Lưu
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded-lg text-[10px] font-bold transition-all"
                      >
                        <span className="material-symbols-outlined text-[11px]">close</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div className="group/text relative">
                    <p className="text-neutral-300 text-[11px] leading-relaxed line-clamp-3 min-h-[3rem] pr-5">
                      {slide.text || <span className="text-neutral-600 italic">Không có text</span>}
                    </p>
                    <button
                      onClick={() => startEditing(slide)}
                      className="absolute top-0 right-0 w-5 h-5 bg-neutral-700 hover:bg-blue-700 rounded-md flex items-center justify-center opacity-0 group-hover/text:opacity-100 transition-all"
                      title="Chỉnh sửa text"
                    >
                      <span className="material-symbols-outlined text-[11px] text-neutral-300">edit</span>
                    </button>
                  </div>
                )}

                {/* Audio action buttons */}
                {!isEditing && (
                  <div className="flex gap-1 mt-auto">
                    <button
                      onClick={() => handlePlayAudio(slide)}
                      disabled={!hasAudio || isGenerating}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 transition-all border ${
                        hasAudio && !isGenerating
                          ? isPlaying
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-blue-950/30 border-blue-900/40 text-blue-400 hover:bg-blue-950/60"
                          : "bg-neutral-800/50 border-neutral-700/50 text-neutral-600 cursor-not-allowed"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[12px]">
                        {isPlaying ? "pause" : "play_arrow"}
                      </span>
                      {isPlaying ? "Dừng" : "Nghe"}
                    </button>

                    <button
                      onClick={() => {
                        if (hasAudio) setConfirmModal({ type: "single", slideId: slide.id });
                        else generateSingleAudio(slide.id, false);
                      }}
                      disabled={isGenerating || isBatchRunning}
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 transition-all border bg-purple-950/30 border-purple-900/40 text-purple-400 hover:bg-purple-950/60 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <svg className="animate-spin h-2.5 w-2.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <span className="material-symbols-outlined text-[12px]">mic</span>
                      )}
                      {isGenerating ? "..." : hasAudio ? "Tạo lại" : "Tạo"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Overwrite Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-yellow-950/40 rounded-full flex items-center justify-center mx-auto mb-5 border border-yellow-900/40">
              <span className="material-symbols-outlined text-yellow-400 text-2xl">warning</span>
            </div>
            <h3 className="text-white font-bold text-center text-lg mb-2">
              {confirmModal.type === "batch" ? "Audio đã tồn tại" : "Tạo lại audio?"}
            </h3>
            <p className="text-neutral-400 text-sm text-center mb-6 leading-relaxed">
              {confirmModal.type === "batch"
                ? "Một số slide đã có audio. Bạn có muốn tạo lại tất cả không?"
                : "Slide này đã có audio. Tạo lại sẽ ghi đè file cũ."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-2xl text-sm font-bold transition-all border border-neutral-700"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (confirmModal.type === "single" && confirmModal.slideId) {
                    generateSingleAudio(confirmModal.slideId, true);
                  } else {
                    startBatchGeneration(true);
                  }
                }}
                className="py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-2xl text-sm font-bold transition-all"
              >
                Ghi đè
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
