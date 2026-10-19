"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Loader2,
  Image as ImageIcon,
  Check,
  Hash,
  SlidersHorizontal,
  UploadCloud,
  Camera,
  FileText,
  Palette,
  Scan,
} from "lucide-react";
import { toast } from "sonner";
import { searchImagesClient } from "@/lib/image-search-client";
import { uploadExternalImageUrlFast } from "@/lib/direct-upload";
import {
  generateTopicVocabulariesAction,
  analyzeImageForTopicAction,
  TopicDifficultyLevel,
  AnalyzeImageForTopicResult,
} from "@/actions/topic-game-ai-actions";

export interface GeneratedPairResult {
  word: string;
  imageUrl?: string;
  imageAUrl?: string;
  imageBUrl?: string;
}

export interface AutoGenerateTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: {
    pairs: GeneratedPairResult[];
    suggestedTitle?: string;
  }) => void;
  initialTopic?: string;
  mode?: "IMAGE_TEXT" | "IMAGE_IMAGE";
  pairsPerRound?: number;
}

const DIFFICULTY_LEVELS: {
  id: TopicDifficultyLevel;
  label: string;
}[] = [
  { id: "BASIC", label: "Căn bản" },
  { id: "INTERMEDIATE", label: "Trung bình" },
  { id: "UPPER_INTERMEDIATE", label: "Tương đối cao" },
  { id: "ADVANCED", label: "Cao" },
];

export function AutoGenerateTopicModal({
  isOpen,
  onClose,
  onApply,
  initialTopic = "",
  mode = "IMAGE_TEXT",
  pairsPerRound = 7,
}: AutoGenerateTopicModalProps) {
  const [activeTab, setActiveTab] = useState<"topic" | "image">("topic");
  const [topic, setTopic] = useState(initialTopic);
  const [level, setLevel] = useState<TopicDifficultyLevel>("BASIC");
  const [count, setCount] = useState<number>(pairsPerRound);
  const [imageStyle, setImageStyle] = useState<"CARTOON" | "REALISTIC">("CARTOON");

  // Image Upload & Vision State
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<AnalyzeImageForTopicResult | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  // Cập nhật số lượng mặc định và đồng bộ khi mở modal hoặc pairsPerRound thay đổi
  useEffect(() => {
    if (isOpen) {
      setCount(pairsPerRound);
      if (initialTopic) setTopic(initialTopic);
      setError("");
    }
  }, [isOpen, pairsPerRound, initialTopic]);

  // Danh sách 4 mốc chọn nhanh dựa theo số từ/vòng của từng game (1, 2, 3, 4 vòng)
  const presetCounts = [
    pairsPerRound * 1,
    pairsPerRound * 2,
    pairsPerRound * 3,
    pairsPerRound * 4,
  ];

  // Xử lý file ảnh được chọn hoặc kéo thả
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng tải lên file định dạng hình ảnh (PNG, JPG, WebP)!");
      toast.error("Vui lòng tải lên file định dạng hình ảnh hợp lệ!");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Dung lượng ảnh không được vượt quá 10MB.");
      toast.error("Dung lượng ảnh quá lớn (tối đa 10MB)!");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      setImagePreviewUrl(dataUrl);
      setActiveTab("image");
      setIsAnalyzingImage(true);
      setImageAnalysisResult(null);

      try {
        const res = await analyzeImageForTopicAction({
          imageBase64: dataUrl,
          mimeType: file.type || "image/jpeg",
        });

        if (res.success && res.topic) {
          const preferredTopic = res.topicVi || res.topic;
          setTopic(preferredTopic);
          setImageAnalysisResult(res);
          toast.success(`Đã nhận diện chủ đề: "${preferredTopic}"`);
        } else {
          toast.error(res.error || "Không thể nhận diện chủ đề từ ảnh. Bạn có thể tự gõ chủ đề bên dưới.");
        }
      } catch (err: any) {
        console.error("Lỗi khi phân tích ảnh:", err);
        toast.error("Lỗi khi gửi ảnh lên AI phân tích.");
      } finally {
        setIsAnalyzingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Hỗ trợ nhấn Ctrl + V để dán ảnh trực tiếp từ clipboard
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            setActiveTab("image");
            toast.info("Đã nhận ảnh từ Clipboard! Đang phân tích...");
            processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => {
      window.removeEventListener("paste", handleGlobalPaste);
    };
  }, [isOpen]);

  // Khóa cuộn trang và xử lý phím Escape
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isGenerating) {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, isGenerating, onClose]);

  const handleClearImage = () => {
    setImagePreviewUrl(null);
    setImageAnalysisResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleStartGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanTopic = topic.trim();
    if (!cleanTopic) {
      const msg = "Vui lòng nhập chủ đề từ vựng hoặc tải ảnh để AI phân tích.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (count < 1 || count > 70) {
      const msg = "Số lượng từ hợp lệ từ 1 đến 70 từ.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      // 1. Gọi AI sinh danh sách từ vựng
      const res = await generateTopicVocabulariesAction({
        topic: cleanTopic,
        count,
        level,
      });

      if (!res.success || !res.items || res.items.length === 0) {
        toast.error(res.error || "AI không thể tạo từ vựng cho chủ đề này. Vui lòng thử lại!");
        setIsGenerating(false);
        return;
      }

      // 2. Tự động tìm kiếm hình ảnh tương ứng
      const finalPairs: GeneratedPairResult[] = [];
      const isDualImageMode = mode === "IMAGE_IMAGE";
      const BATCH_SIZE = isDualImageMode ? 3 : 4;

      for (let i = 0; i < res.items.length; i += BATCH_SIZE) {
        const batch = res.items.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (item) => {
          let selectedImageUrl: string | undefined = undefined;
          let selectedImageAUrl: string | undefined = undefined;
          let selectedImageBUrl: string | undefined = undefined;

          try {
            const query = item.searchKeyword || item.word;

            if (isDualImageMode) {
              const [cartoonRes, realisticRes] = await Promise.all([
                searchImagesClient(query, "CARTOON"),
                searchImagesClient(query, "REALISTIC"),
              ]);

              const cartoonPool = cartoonRes && cartoonRes.length > 0 ? cartoonRes : await searchImagesClient(item.word, "CARTOON");
              if (cartoonPool && cartoonPool.length > 0) {
                selectedImageAUrl = await uploadExternalImageUrlFast(cartoonPool.slice(0, 4).map((r) => r.url));
              }

              const realisticPool = realisticRes && realisticRes.length > 0 ? realisticRes : await searchImagesClient(item.word, "REALISTIC");
              if (realisticPool && realisticPool.length > 0) {
                const candidatesB = realisticPool.filter((r) => r.url !== selectedImageAUrl).slice(0, 4).map((r) => r.url);
                selectedImageBUrl = await uploadExternalImageUrlFast(candidatesB.length > 0 ? candidatesB : realisticPool.slice(0, 4).map((r) => r.url));
              }

              selectedImageUrl = selectedImageAUrl;
            } else {
              let results = await searchImagesClient(query, imageStyle);
              if (!results || results.length === 0) {
                results = await searchImagesClient(item.word, imageStyle);
              }
              if (results && results.length > 0) {
                const candidateUrls = results.slice(0, 4).map((r) => r.url);
                selectedImageUrl = await uploadExternalImageUrlFast(candidateUrls);
              }
            }
          } catch {
            // Bỏ qua lỗi ảnh riêng lẻ
          }

          return {
            word: item.word,
            imageUrl: selectedImageUrl,
            imageAUrl: selectedImageAUrl,
            imageBUrl: selectedImageBUrl,
          };
        });

        const batchResults = await Promise.all(batchPromises);
        finalPairs.push(...batchResults);
      }

      // 3. Hoàn tất & Nạp dữ liệu vào game
      onApply({
        pairs: finalPairs,
        suggestedTitle: imageAnalysisResult?.suggestedTitle || res.suggestedTitle,
      });

      const failedWords = isDualImageMode
        ? finalPairs.filter((p) => !p.imageAUrl || !p.imageBUrl).map((p) => p.word)
        : finalPairs.filter((p) => !p.imageUrl).map((p) => p.word);

      if (failedWords.length > 0) {
        toast.warning(
          `⚠️ Có ${failedWords.length} thẻ chưa lấy được ảnh: ${failedWords.join(", ")}. Vui lòng chọn ảnh bổ sung!`,
          { duration: 8000 }
        );
      } else {
        toast.success(
          `Đã tạo thành công ${finalPairs.length} cặp thẻ cho chủ đề "${cleanTopic}" với đầy đủ hình ảnh!`
        );
      }

      onClose();
    } catch (err: any) {
      console.error("Lỗi khi tự động tạo theo chủ đề:", err);
      toast.error(err?.message || "Đã xảy ra lỗi trong quá trình tạo.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const pillBase =
    "inline-flex items-center justify-center gap-1.5 " +
    "rounded-full border px-4 py-2 text-xs font-semibold " +
    "transition-all duration-200 hover:-translate-y-0.5 " +
    "focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-violet-400 focus-visible:ring-offset-2";

  const sectionLabel =
    "flex items-center gap-2 text-[11px] font-bold " +
    "uppercase tracking-wider text-slate-600 dark:text-slate-300";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[3px] sm:p-6 animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isGenerating && !isAnalyzingImage) {
          onClose();
        }
      }}
    >
      {/* Modal container */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-modal-title"
        tabIndex={-1}
        className="flex w-full max-w-[620px] max-h-[94dvh] flex-col overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 shadow-2xl shadow-slate-950/20 outline-none border border-slate-100 dark:border-slate-800"
      >
        {/* ===== HEADER ===== */}
        <header className="shrink-0 bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 px-5 pb-4 pt-5 text-white sm:px-7 sm:pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <Sparkles size={22} className="text-amber-300 animate-pulse" />
            </div>

            <div className="min-w-0 flex-1">
              <h2
                id="ai-modal-title"
                className="text-lg font-bold leading-tight tracking-tight sm:text-xl"
              >
                Tạo Cặp Thẻ Tự Động Bằng AI
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-violet-100 sm:text-[13px]">
                Nhập chủ đề hoặc tải ảnh lên để AI phân tích &amp; tạo trọn bộ cặp thẻ
              </p>
            </div>

            <button
              type="button"
              aria-label="Đóng modal"
              disabled={isGenerating || isAnalyzingImage}
              onClick={onClose}
              className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20 disabled:opacity-50 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Segmented tabs */}
          <div
            role="tablist"
            aria-label="Nguồn tạo thẻ"
            className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-white/15 p-1"
          >
            {[
              {
                id: "topic" as const,
                label: "Gõ chủ đề",
                icon: FileText,
              },
              {
                id: "image" as const,
                label: "Tải / Dán ảnh (AI nhận diện)",
                icon: Camera,
              },
            ].map(({ id, label, icon: Icon }) => {
              const selected = activeTab === id;

              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  disabled={isGenerating}
                  aria-selected={selected}
                  onClick={() => {
                    setActiveTab(id);
                    setError("");
                  }}
                  className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    selected
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-white/85 hover:bg-white/10"
                  }`}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* ===== SCROLLABLE BODY ===== */}
        <form
          onSubmit={handleStartGenerate}
          className="space-y-5 overflow-y-auto px-5 py-5 sm:px-7 flex-1"
        >
          {/* Topic / Image input */}
          {activeTab === "topic" ? (
            <section className="space-y-2">
              <label htmlFor="ai-topic" className={sectionLabel}>
                CHỦ ĐỀ TỪ VỰNG
                <span className="text-rose-500">*</span>
              </label>

              <input
                id="ai-topic"
                disabled={isGenerating}
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  setError("");
                }}
                placeholder="VD: Planets, Mammals, Birds, Sea Animals, Jobs, Fruits..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                autoFocus
              />

              <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                Gợi ý: Nhập tiếng Anh hoặc tiếng Việt. Hoặc chuyển sang tab Tải ảnh / dán Ctrl+V để AI tự tìm chủ đề.
              </p>
            </section>
          ) : (
            <section className="space-y-2">
              <p className={sectionLabel}>
                <ImageIcon size={15} />
                HÌNH ẢNH ĐẦU VÀO
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processImageFile(file);
                  e.target.value = "";
                }}
              />

              {!imagePreviewUrl ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processImageFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`rounded-2xl border-2 border-dashed p-5 text-center transition-all cursor-pointer ${
                    isDraggingOver
                      ? "border-violet-500 bg-violet-100/50 scale-[1.01]"
                      : "border-violet-200 dark:border-slate-700 bg-violet-50/50 dark:bg-slate-800/40 hover:bg-violet-50 dark:hover:bg-slate-800/70"
                  }`}
                >
                  <div className="space-y-2">
                    <UploadCloud size={30} className="mx-auto text-violet-500" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Kéo thả hoặc dán ảnh vào đây
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Hỗ trợ chụp màn hình và nhấn <span className="font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/60 px-1.5 py-0.5 rounded">Ctrl + V</span> · Tối đa 10MB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="mt-3 rounded-lg border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-violet-700 dark:text-violet-300 transition hover:bg-violet-100 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Chọn ảnh từ thiết bị
                  </button>
                </div>
              ) : (
                <div className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreviewUrl}
                        alt="Ảnh phân tích"
                        className="h-full w-full object-cover"
                      />
                      {isAnalyzingImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-violet-900/60 text-white backdrop-blur-[2px]">
                          <Scan className="h-5 w-5 animate-pulse" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Ảnh nguồn phân tích
                        </span>
                        {!isAnalyzingImage && !isGenerating && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                            >
                              Đổi ảnh
                            </button>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <button
                              type="button"
                              onClick={handleClearImage}
                              className="font-semibold text-rose-500 hover:underline cursor-pointer"
                            >
                              Xóa
                            </button>
                          </div>
                        )}
                      </div>

                      {isAnalyzingImage ? (
                        <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400">
                          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                          <span>AI đang quan sát ảnh & trích xuất chủ đề...</span>
                        </div>
                      ) : (
                        <div className="mt-1.5 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">✓ Đã nhận diện:</span>
                            <span className="truncate">{imageAnalysisResult?.topic || topic}</span>
                          </div>
                          {imageAnalysisResult?.description && (
                            <p className="line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">
                              {imageAnalysisResult.description}
                            </p>
                          )}
                          {imageAnalysisResult?.keyObjects && imageAnalysisResult.keyObjects.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {imageAnalysisResult.keyObjects.slice(0, 4).map((obj, i) => (
                                <span
                                  key={i}
                                  className="rounded-md bg-violet-100 dark:bg-violet-950/70 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 dark:text-violet-300"
                                >
                                  {obj}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tùy chỉnh chủ đề sau khi phân tích */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Tên chủ đề trích xuất (có thể sửa lại nếu muốn):
                    </label>
                    <input
                      type="text"
                      disabled={isGenerating || isAnalyzingImage}
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Chủ đề từ vựng..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                </div>
              )}
            </section>
          )}

          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* ===== VOCABULARY LEVEL ===== */}
          <section className="space-y-3">
            <h3 className={sectionLabel}>
              <SlidersHorizontal size={15} />
              CẤP ĐỘ TỪ VỰNG
            </h3>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DIFFICULTY_LEVELS.map((item) => {
                const selected = level === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isGenerating || isAnalyzingImage}
                    aria-pressed={selected}
                    onClick={() => setLevel(item.id)}
                    className={`${pillBase} ${
                      selected
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 shadow-sm"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-violet-300"
                    } cursor-pointer`}
                  >
                    {selected && <Check size={14} strokeWidth={3} className="shrink-0" />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* ===== QUANTITY ===== */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className={sectionLabel}>
                <Hash size={15} />
                SỐ LƯỢNG TỪ VỰNG
              </h3>

              <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                1 Vòng chơi (tối đa {pairsPerRound} từ/vòng)
              </span>
            </div>

            {/* 4 Mốc chọn nhanh theo số vòng của từng game */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {presetCounts.map((countPreset) => {
                const selected = count === countPreset;
                const roundNum = Math.round(countPreset / pairsPerRound);

                return (
                  <button
                    key={countPreset}
                    type="button"
                    disabled={isGenerating || isAnalyzingImage}
                    aria-pressed={selected}
                    onClick={() => setCount(countPreset)}
                    className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 cursor-pointer ${
                      selected
                        ? "border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-200 dark:shadow-none font-bold"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-violet-300"
                    }`}
                  >
                    {countPreset} từ ({roundNum} vòng)
                  </button>
                );
              })}
            </div>

            {/* Ô nhập số lượng tùy ý */}
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-medium">Hoặc tự nhập số lượng:</span>
              <input
                type="number"
                min={1}
                max={70}
                disabled={isGenerating || isAnalyzingImage}
                value={count}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    setCount(Math.max(1, Math.min(70, val)));
                  }
                }}
                className="w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-center font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
              <span className="text-[11px] text-slate-400">
                (tương đương ~{Math.ceil(count / pairsPerRound)} vòng)
              </span>
            </div>
          </section>

          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* ===== IMAGE STYLE ===== */}
          <section className="space-y-3">
            <h3 className={sectionLabel}>
              <ImageIcon size={15} />
              PHONG CÁCH HÌNH ẢNH
            </h3>

            {mode === "IMAGE_IMAGE" ? (
              <div className="flex items-start gap-2.5 rounded-2xl border border-violet-200/80 dark:border-violet-800/60 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 p-3.5 text-xs text-violet-900 dark:text-violet-200">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                <div>
                  <strong className="block font-bold text-violet-800 dark:text-violet-300">
                    Cơ chế ghép cặp: Hình vẽ & Ảnh thật
                  </strong>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-violet-700 dark:text-violet-400">
                    AI sẽ tự động gán <strong>Tranh vẽ hoạt hình (Cartoon) cho Vế A</strong> và <strong>Ảnh chụp thực tế (Realistic) cho Vế B</strong> để học sinh tìm ghép cặp tương ứng.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  {
                    id: "CARTOON" as const,
                    icon: Palette,
                    title: "Hoạt hình / Tranh vẽ",
                    desc: "Clipart, Vector (phù hợp cho trẻ nhỏ)",
                  },
                  {
                    id: "REALISTIC" as const,
                    icon: Camera,
                    title: "Ảnh chụp thực tế",
                    desc: "Hình ảnh chân thực, khoa học",
                  },
                ].map((item) => {
                  const selected = imageStyle === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isGenerating || isAnalyzingImage}
                      aria-pressed={selected}
                      onClick={() => setImageStyle(item.id)}
                      className={`relative rounded-2xl border-2 p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 cursor-pointer ${
                        selected
                          ? "border-violet-500 bg-violet-50/70 dark:bg-violet-950/40"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-200"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div
                          className={`rounded-xl p-2 ${
                            selected
                              ? "bg-violet-100 dark:bg-violet-900/60 text-violet-600 dark:text-violet-300"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
                          }`}
                        >
                          <Icon size={18} />
                        </div>

                        {selected && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Validation Error Message */}
          {error && (
            <p role="alert" className="rounded-lg bg-rose-50 dark:bg-rose-950/50 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-300">
              {error}
            </p>
          )}

          {/* Hidden submit trigger for keyboard form submission */}
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>

        {/* ===== FOOTER ===== */}
        <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 sm:px-7">
          <button
            type="button"
            disabled={isGenerating || isAnalyzingImage}
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-50 cursor-pointer"
          >
            Hủy
          </button>

          <button
            type="button"
            disabled={isGenerating || isAnalyzingImage || !topic.trim()}
            onClick={() => handleStartGenerate()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-200 dark:shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-lg hover:shadow-violet-300 active:translate-y-0 disabled:cursor-wait disabled:opacity-60 cursor-pointer"
          >
            {isGenerating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            <span>{isGenerating ? "Đang tạo..." : "Bắt đầu tạo tự động"}</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
