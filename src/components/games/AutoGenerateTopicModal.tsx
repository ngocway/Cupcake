"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Loader2,
  BookOpen,
  Image as ImageIcon,
  Flame,
  Check,
  AlertCircle,
  Hash,
  Sliders,
  UploadCloud,
  Camera,
  Layers,
  FileText,
  Scan,
} from "lucide-react";
import { toast } from "sonner";
import { searchImagesClient } from "@/lib/image-search-client";
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
  const [inputMode, setInputMode] = useState<"TEXT" | "IMAGE">("TEXT");
  const [topic, setTopic] = useState(initialTopic);
  const [level, setLevel] = useState<TopicDifficultyLevel>("BASIC");
  const [count, setCount] = useState<number>(pairsPerRound);

  // Cập nhật số lượng mặc định khi mở modal hoặc pairsPerRound thay đổi
  useEffect(() => {
    if (isOpen) {
      setCount(pairsPerRound);
    }
  }, [isOpen, pairsPerRound]);

  const presetCounts = pairsPerRound === 4 
    ? [4, 8, 12] 
    : [pairsPerRound, pairsPerRound * 2, pairsPerRound * 3];

  const [imageStyle, setImageStyle] = useState<"CARTOON" | "REALISTIC">("CARTOON");
  
  // Image Upload & Vision State
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<AnalyzeImageForTopicResult | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generation & Progress State
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState<"IDLE" | "AI_WORDS" | "SEARCHING_IMAGES">("IDLE");
  const [imageProgress, setImageProgress] = useState({ current: 0, total: 0 });

  // Xử lý file ảnh được chọn hoặc kéo thả
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng tải lên file định dạng hình ảnh (PNG, JPG, WebP)!");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File ảnh quá lớn (tối đa 10MB)!");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      setImagePreviewUrl(dataUrl);
      setInputMode("IMAGE");
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

  if (!isOpen) return null;

  const handleStartGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTopic = topic.trim();
    if (!cleanTopic) {
      toast.error("Vui lòng nhập hoặc chọn ảnh để xác định chủ đề từ vựng!");
      return;
    }

    if (count < 1 || count > 70) {
      toast.error("Số lượng từ hợp lệ từ 1 đến 70 từ.");
      return;
    }

    try {
      setIsGenerating(true);
      setProgressStep("AI_WORDS");

      // 1. Gọi AI sinh danh sách từ vựng tiếng Anh
      const res = await generateTopicVocabulariesAction({
        topic: cleanTopic,
        count,
        level,
      });

      if (!res.success || !res.items || res.items.length === 0) {
        toast.error(res.error || "AI không thể tạo từ vựng cho chủ đề này. Vui lòng thử lại!");
        setIsGenerating(false);
        setProgressStep("IDLE");
        return;
      }

      // 2. Tìm ảnh tự động cho từng từ
      setProgressStep("SEARCHING_IMAGES");
      const total = res.items.length;
      setImageProgress({ current: 0, total });

      const finalPairs: GeneratedPairResult[] = [];
      let completedCount = 0;

      // Xử lý song song theo batches để tốc độ cực nhanh mà không bị nghẽn
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
              // Chế độ 2 ảnh: Vế A là Tranh vẽ (Cartoon), Vế B là Ảnh thật (Realistic)
              const [cartoonRes, realisticRes] = await Promise.all([
                searchImagesClient(query, "CARTOON"),
                searchImagesClient(query, "REALISTIC"),
              ]);

              if (cartoonRes && cartoonRes.length > 0) {
                selectedImageAUrl = cartoonRes[0].url;
              } else {
                const fbA = await searchImagesClient(item.word, "CARTOON");
                if (fbA && fbA.length > 0) selectedImageAUrl = fbA[0].url;
              }

              if (realisticRes && realisticRes.length > 0) {
                const distinctB = realisticRes.find(r => r.url !== selectedImageAUrl) || realisticRes[0];
                selectedImageBUrl = distinctB.url;
              } else {
                const fbB = await searchImagesClient(item.word, "REALISTIC");
                if (fbB && fbB.length > 0) {
                  const distinctB = fbB.find(r => r.url !== selectedImageAUrl) || fbB[0];
                  selectedImageBUrl = distinctB.url;
                }
              }

              selectedImageUrl = selectedImageAUrl;
            } else {
              // Chế độ 1 ảnh thông thường (Ảnh - Chữ)
              let results = await searchImagesClient(query, imageStyle);
              if (!results || results.length === 0) {
                results = await searchImagesClient(item.word, imageStyle);
              }
              if (results && results.length > 0) {
                selectedImageUrl = results[0].url;
              }
            }
          } catch {
            // Bỏ qua lỗi ảnh riêng lẻ
          }
          completedCount++;
          setImageProgress({ current: completedCount, total });
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

      // 3. Hoàn tất & Nạp dữ liệu vào danh sách thẻ ngoài giao diện
      onApply({
        pairs: finalPairs,
        suggestedTitle: imageAnalysisResult?.suggestedTitle || res.suggestedTitle,
      });

      toast.success(
        `Đã tạo thành công ${finalPairs.length} cặp thẻ cho chủ đề "${cleanTopic}"!`
      );
      onClose();
    } catch (err: any) {
      console.error("Lỗi khi tự động tạo theo chủ đề:", err);
      toast.error(err?.message || "Đã xảy ra lỗi trong quá trình tạo.");
    } finally {
      setIsGenerating(false);
      setProgressStep("IDLE");
    }
  };

  const handleClearImage = () => {
    setImagePreviewUrl(null);
    setImageAnalysisResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Tạo Cặp Thẻ Tự Động Bằng AI</h3>
                <p className="text-xs text-purple-100 font-medium mt-0.5">
                  Nhập chủ đề hoặc tải ảnh lên để AI phân tích & tạo trọn bộ cặp thẻ
                </p>
              </div>
            </div>
            {!isGenerating && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 mt-4 p-1 bg-black/15 backdrop-blur-md rounded-2xl">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setInputMode("TEXT")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                inputMode === "TEXT"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>✍️ Gõ chủ đề</span>
            </button>
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setInputMode("IMAGE")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                inputMode === "IMAGE"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>📸 Tải / Dán ảnh (AI nhận diện)</span>
            </button>
          </div>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleStartGenerate} className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
          {/* TAB 1: Gõ chủ đề văn bản */}
          {inputMode === "TEXT" && (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                Chủ đề từ vựng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={isGenerating}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="VD: Planets, Mammals, Birds, Sea Animals, Jobs, Fruits..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1.5 font-medium">
                Gợi ý: Bạn có thể gõ tiếng Anh hoặc tiếng Việt (hoặc bấm sang tab 📸 Tải ảnh / dán Ctrl+V để AI tự tìm chủ đề).
              </p>
            </div>
          )}

          {/* TAB 2: Upload / Dán ảnh (AI Vision Analysis) */}
          {inputMode === "IMAGE" && (
            <div className="space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processImageFile(file);
                }}
              />

              {!imagePreviewUrl ? (
                /* Dropzone khi chưa có ảnh */
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
                  className={`p-6 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                    isDraggingOver
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-950/40 scale-[1.01]"
                      : "border-purple-200 dark:border-slate-700 hover:border-purple-400 bg-purple-50/40 dark:bg-slate-800/40"
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-300">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                      Bấm để tải ảnh hoặc Kéo thả ảnh vào đây
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      Hỗ trợ chụp màn hình và nhấn <span className="font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-1.5 py-0.5 rounded-md">Ctrl + V</span> để dán ảnh trực tiếp
                    </p>
                  </div>
                </div>
              ) : (
                /* Preview ảnh đã tải & Trạng thái phân tích AI */
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreviewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      {isAnalyzingImage && (
                        <div className="absolute inset-0 bg-purple-900/60 backdrop-blur-[2px] flex items-center justify-center text-white">
                          <Scan className="w-5 h-5 animate-pulse" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                          Ảnh nguồn phân tích
                        </span>
                        {!isAnalyzingImage && !isGenerating && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                            >
                              Đổi ảnh
                            </button>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <button
                              type="button"
                              onClick={handleClearImage}
                              className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                            >
                              Xóa
                            </button>
                          </div>
                        )}
                      </div>

                      {isAnalyzingImage ? (
                        <div className="flex items-center gap-2 mt-2 text-xs font-bold text-purple-600 dark:text-purple-300">
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                          <span>AI đang quan sát ảnh & đọc chữ...</span>
                        </div>
                      ) : (
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                            <span className="text-emerald-600 dark:text-emerald-400 font-black">✓ Đã nhận diện:</span>
                            <span className="truncate">{imageAnalysisResult?.topic || topic}</span>
                          </div>
                          {imageAnalysisResult?.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {imageAnalysisResult.description}
                            </p>
                          )}
                          {imageAnalysisResult?.keyObjects && imageAnalysisResult.keyObjects.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {imageAnalysisResult.keyObjects.slice(0, 4).map((obj, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-semibold bg-purple-100/70 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-md"
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

                  {/* Cho phép giáo viên tinh chỉnh lại tên chủ đề nếu muốn */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Tên chủ đề được trích xuất (có thể sửa lại nếu muốn):
                    </label>
                    <input
                      type="text"
                      disabled={isGenerating || isAnalyzingImage}
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Chủ đề từ vựng..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cấp độ từ vựng */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-500" />
              Cấp độ từ vựng
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DIFFICULTY_LEVELS.map((lvl) => {
                const isSelected = level === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    disabled={isGenerating || isAnalyzingImage}
                    onClick={() => setLevel(lvl.id)}
                    className={`py-2.5 px-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950/40 shadow-sm ring-1 ring-purple-500 text-purple-700 dark:text-purple-300 font-black"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-bold"
                    }`}
                  >
                    <span className="text-xs">{lvl.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Số lượng từ vựng */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-purple-500" />
                Số lượng từ vựng
              </label>
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                {count <= pairsPerRound 
                  ? `1 Vòng chơi (tối đa ${pairsPerRound} từ/vòng)` 
                  : `${Math.ceil(count / pairsPerRound)} Vòng chơi (tối đa ${pairsPerRound} từ/vòng)`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                disabled={isGenerating || isAnalyzingImage}
                min={1}
                max={70}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(70, parseInt(e.target.value) || 1)))}
                className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-center text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
                {presetCounts.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={isGenerating || isAnalyzingImage}
                    onClick={() => setCount(preset)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      count === preset
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {preset} từ ({Math.round(preset / pairsPerRound)} vòng)
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Phong cách hình ảnh hoặc Thông báo chế độ Ghép Tranh vẽ & Ảnh thật */}
          {mode === "IMAGE_IMAGE" ? (
            <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 rounded-2xl border border-purple-200/60 dark:border-purple-800/60 flex items-start gap-2.5 text-xs text-purple-900 dark:text-purple-200">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black text-purple-800 dark:text-purple-300">Cơ chế ghép cặp: Hình vẽ & Ảnh thật</strong>
                <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5 leading-relaxed">
                  AI sẽ tự động gán <strong>Tranh vẽ hoạt hình (Cartoon) cho Vế A</strong> và <strong>Ảnh chụp thực tế (Realistic) cho Vế B</strong> để học sinh tìm ghép cặp tương ứng.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                Phong cách hình ảnh
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isGenerating || isAnalyzingImage}
                  onClick={() => setImageStyle("CARTOON")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    imageStyle === "CARTOON"
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-950/40 ring-1 ring-purple-500"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800/60"
                  }`}
                >
                  <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-base shrink-0">
                    🎨
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-800 dark:text-slate-100">
                      Hoạt hình / Tranh vẽ
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Clipart, Vector (phù hợp cho trẻ nhỏ)
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isGenerating || isAnalyzingImage}
                  onClick={() => setImageStyle("REALISTIC")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    imageStyle === "REALISTIC"
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-950/40 ring-1 ring-purple-500"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800/60"
                  }`}
                >
                  <div className="w-7 h-7 rounded-xl bg-sky-100 dark:bg-sky-900/60 flex items-center justify-center text-base shrink-0">
                    📸
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-800 dark:text-slate-100">
                      Ảnh chụp thực tế
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Hình ảnh chân thực, khoa học
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Loading Progress State */}
          {isGenerating && (
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2.5 text-xs font-bold text-purple-800 dark:text-purple-300">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span>
                  {progressStep === "AI_WORDS" && "Đang gửi yêu cầu đến AI để sinh danh sách từ vựng..."}
                  {progressStep === "SEARCHING_IMAGES" &&
                    `Đang tự động tìm ảnh minh họa nét đẹp (${imageProgress.current}/${imageProgress.total})...`}
                </span>
              </div>
              {progressStep === "SEARCHING_IMAGES" && imageProgress.total > 0 && (
                <div className="w-full bg-purple-200 dark:bg-purple-900/60 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.round((imageProgress.current / imageProgress.total) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isGenerating || isAnalyzingImage}
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isGenerating || isAnalyzingImage || !topic.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-md shadow-purple-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Bắt đầu tạo tự động</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
