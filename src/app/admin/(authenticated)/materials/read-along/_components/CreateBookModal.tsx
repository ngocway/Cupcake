"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────
type Method = "lesson" | "images" | null;

interface LessonItem {
  id: string;
  title: string;
  thumbnail: string | null;
  slug: string | null;
  audioSegmentCount: number;
  hasBook: boolean;
}

interface CreateBookModalProps {
  open: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────
export function CreateBookModal({ open, onClose }: CreateBookModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<"pick-method" | "lesson" | "images">("pick-method");
  const [loading, setLoading] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);

  // Lesson method state
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [lessonSearch, setLessonSearch] = useState("");
  const [selectedLesson, setSelectedLesson] = useState<LessonItem | null>(null);

  // Image method state
  const [imageTitle, setImageTitle] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [confirmStep, setConfirmStep] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("pick-method");
        setSelectedLesson(null);
        setLessonSearch("");
        setImageTitle("");
        setImageFiles([]);
        setImagePreviews([]);
        setConfirmStep(false);
        setLoading(false);
      }, 300);
    }
  }, [open]);

  // Fetch lessons when entering lesson step
  useEffect(() => {
    if (step === "lesson" && lessons.length === 0) {
      setLoadingLessons(true);
      fetch("/api/admin/read-along/lessons")
        .then(r => r.json())
        .then(data => {
          if (data.success) setLessons(data.lessons);
          else toast.error("Không thể tải danh sách bài học.");
        })
        .catch(() => toast.error("Lỗi kết nối."))
        .finally(() => setLoadingLessons(false));
    }
  }, [step]);

  // Build image previews when files change
  useEffect(() => {
    const urls = imageFiles.map(f => URL.createObjectURL(f));
    setImagePreviews(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [imageFiles]);

  const filteredLessons = lessons.filter(l =>
    l.title.toLowerCase().includes(lessonSearch.toLowerCase())
  );

  // ── Submit: Lesson method ────────────────────────────────
  const submitLesson = async () => {
    if (!selectedLesson) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("method", "lesson");
      fd.append("lessonId", selectedLesson.id);

      const res = await fetch("/api/admin/read-along", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Tạo sách thất bại.");
        return;
      }
      toast.success(`Đã tạo sách "${selectedLesson.title}" với ${selectedLesson.audioSegmentCount} trang!`);
      onClose();
      router.push(`/admin/materials/read-along/${data.book.id}`);
      router.refresh();
    } catch {
      toast.error("Lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  };

  // ── Submit: Images method ────────────────────────────────
  const submitImages = async () => {
    if (!imageTitle.trim() || imageFiles.length === 0) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("method", "images");
      fd.append("title", imageTitle.trim());
      imageFiles.forEach(f => fd.append("images", f));

      const res = await fetch("/api/admin/read-along", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Tạo sách thất bại.");
        return;
      }
      toast.success(`Đã tạo sách "${imageTitle}" với ${imageFiles.length} trang!`);
      onClose();
      router.push(`/admin/materials/read-along/${data.book.id}`);
      router.refresh();
    } catch {
      toast.error("Lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-neutral-800">
          <div>
            <h2 className="text-lg font-black text-white">Thêm Sách Mới</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              {step === "pick-method" && "Chọn phương thức tạo sách"}
              {step === "lesson" && "Tạo từ Bài Học có sẵn"}
              {step === "images" && (confirmStep ? "Xác nhận trước khi tạo" : "Tạo từ ảnh upload")}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-7">

          {/* ── STEP: pick-method ── */}
          {step === "pick-method" && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setStep("lesson")}
                className="group flex flex-col items-center gap-4 p-8 bg-neutral-800/50 hover:bg-blue-950/40 border border-neutral-700 hover:border-blue-500/60 rounded-2xl transition-all duration-200 text-left"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-500/15 group-hover:bg-blue-500/25 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-blue-400 text-3xl">menu_book</span>
                </div>
                <div>
                  <div className="font-black text-white text-base mb-1">Từ Bài Học</div>
                  <div className="text-xs text-neutral-400 leading-relaxed">
                    Chọn bài học có sẵn. Hệ thống tự tạo trang từ các đoạn audio trong bài.
                  </div>
                </div>
              </button>

              <button
                onClick={() => setStep("images")}
                className="group flex flex-col items-center gap-4 p-8 bg-neutral-800/50 hover:bg-emerald-950/40 border border-neutral-700 hover:border-emerald-500/60 rounded-2xl transition-all duration-200 text-left"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 group-hover:bg-emerald-500/25 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-emerald-400 text-3xl">photo_library</span>
                </div>
                <div>
                  <div className="font-black text-white text-base mb-1">Upload Ảnh</div>
                  <div className="text-xs text-neutral-400 leading-relaxed">
                    Upload nhiều ảnh từ máy tính. Mỗi ảnh tạo một trang, thêm text/audio sau.
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* ── STEP: lesson ── */}
          {step === "lesson" && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutral-500 text-lg">search</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm bài học..."
                  value={lessonSearch}
                  onChange={e => setLessonSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Lesson list */}
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {loadingLessons && (
                  <div className="text-center py-10 text-neutral-500 text-sm">Đang tải...</div>
                )}
                {!loadingLessons && filteredLessons.length === 0 && (
                  <div className="text-center py-10 text-neutral-500 text-sm">Không tìm thấy bài học nào có audio.</div>
                )}
                {filteredLessons.map(lesson => (
                  <button
                    key={lesson.id}
                    onClick={() => !lesson.hasBook && setSelectedLesson(lesson)}
                    disabled={lesson.hasBook}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      lesson.hasBook
                        ? "bg-neutral-800/20 border-neutral-800 opacity-60 cursor-not-allowed"
                        : selectedLesson?.id === lesson.id
                          ? "bg-blue-500/15 border-blue-500/50 ring-1 ring-blue-500/30"
                          : "bg-neutral-800/50 border-neutral-700 hover:border-neutral-600"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-700 flex-shrink-0">
                      {lesson.thumbnail ? (
                        <img src={lesson.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-neutral-500 text-xl">menu_book</span>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm truncate">{lesson.title}</div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        {lesson.audioSegmentCount} đoạn audio → {lesson.audioSegmentCount} trang sách
                      </div>
                    </div>
                    {/* Status badge */}
                    {lesson.hasBook ? (
                      <div className="flex items-center gap-1 px-2 py-1 bg-emerald-900/40 border border-emerald-800/50 rounded-lg flex-shrink-0">
                        <span className="material-symbols-outlined text-emerald-400 text-sm">auto_stories</span>
                        <span className="text-[10px] font-bold text-emerald-400">Đã tạo sách</span>
                      </div>
                    ) : selectedLesson?.id === lesson.id ? (
                      <span className="material-symbols-outlined text-blue-400 flex-shrink-0">check_circle</span>
                    ) : null}
                  </button>
                ))}
              </div>

              {/* Selected preview */}
              {selectedLesson && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-400">info</span>
                  <span className="text-sm text-blue-200">
                    Sẽ tạo sách <strong>&quot;{selectedLesson.title}&quot;</strong> với <strong>{selectedLesson.audioSegmentCount} trang</strong>. Tiêu đề lấy từ tên bài học.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: images (upload) ── */}
          {step === "images" && !confirmStep && (
            <div className="space-y-5">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-neutral-300">
                  Tiêu đề sách <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: The Mango Tree"
                  value={imageTitle}
                  onChange={e => setImageTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl outline-none focus:border-emerald-500 text-white transition-colors text-sm"
                />
              </div>

              {/* Image upload */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-neutral-300">
                  Ảnh các trang <span className="text-red-500">*</span>
                </label>
                <label className="relative flex flex-col items-center justify-center gap-3 border-2 border-dashed border-neutral-600 hover:border-emerald-500/60 rounded-2xl p-8 cursor-pointer transition-colors bg-neutral-800/30">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={e => {
                      if (e.target.files) setImageFiles(Array.from(e.target.files));
                    }}
                  />
                  <span className="material-symbols-outlined text-neutral-400 text-4xl">cloud_upload</span>
                  <div className="text-center">
                    <p className="text-sm font-bold text-neutral-300">
                      {imageFiles.length > 0 ? `${imageFiles.length} ảnh đã chọn` : "Kéo thả hoặc nhấn để chọn ảnh"}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">Mỗi ảnh = 1 trang sách. Thứ tự ảnh = thứ tự trang.</p>
                  </div>
                </label>
              </div>

              {/* Preview grid */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto custom-scrollbar">
                  {imagePreviews.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-neutral-800 group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5 font-bold">
                        {i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP: images confirm ── */}
          {step === "images" && confirmStep && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-800/60 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
                  Xác nhận thông tin
                </div>
                <div className="text-sm text-neutral-300">
                  Tiêu đề: <span className="font-bold text-white">{imageTitle}</span>
                </div>
                <div className="text-sm text-neutral-300">
                  Số trang: <span className="font-bold text-white">{imageFiles.length} trang</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                {imagePreviews.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-neutral-800">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-end">
                      <div className="w-full bg-black/60 text-white text-[10px] text-center py-0.5 font-bold">
                        Trang {i + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-300 flex gap-2">
                <span className="material-symbols-outlined text-amber-400 text-sm flex-shrink-0">info</span>
                Sau khi tạo, bạn có thể thêm text và audio cho từng trang trong màn hình quản lý sách.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-7 py-5 border-t border-neutral-800 bg-neutral-900/80">
          {/* Back button */}
          <button
            onClick={() => {
              if (confirmStep) { setConfirmStep(false); return; }
              if (step !== "pick-method") setStep("pick-method");
              else onClose();
            }}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-bold text-neutral-400 hover:text-white transition-colors disabled:opacity-40"
          >
            {step === "pick-method" ? "Hủy" : "← Quay lại"}
          </button>

          {/* Action button */}
          {step === "lesson" && (
            <button
              onClick={submitLesson}
              disabled={!selectedLesson || loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang tạo...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">auto_stories</span>
                  Tạo Sách
                </>
              )}
            </button>
          )}

          {step === "images" && !confirmStep && (
            <button
              onClick={() => setConfirmStep(true)}
              disabled={!imageTitle.trim() || imageFiles.length === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
            >
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
              Tiếp tục
            </button>
          )}

          {step === "images" && confirmStep && (
            <button
              onClick={submitImages}
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang upload & tạo...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">cloud_upload</span>
                  Xác nhận & Tạo Sách
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
