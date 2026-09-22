"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Loader2,
  BookOpen,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Sliders,
  UploadCloud,
  Camera,
  Layers,
  FileText,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Settings2,
  HelpCircle,
  FolderPlus,
} from "lucide-react";
import { toast } from "sonner";
import { searchImagesClient, SearchImageResult } from "@/lib/image-search-client";
import {
  generateCandyQuizQuestionsAction,
  analyzeImageForQuizAction,
  QuizDifficulty,
  QuizQuestionType,
  GeneratedQuizQuestionItem,
} from "@/actions/candy-quiz-ai-actions";
import type { QuizQuestion, QuizQuestionOption } from "@/types/candy-quiz";

export interface AutoGenerateCandyQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: {
    questions: QuizQuestion[];
    suggestedTitle?: string;
    allocationMode: "CURRENT_ROUND" | "NEW_ROUNDS";
    questionsPerRound: number;
  }) => void;
  initialTopic?: string;
  currentRoundQuestionCount?: number;
}

export function AutoGenerateCandyQuizModal({
  isOpen,
  onClose,
  onApply,
  initialTopic = "",
  currentRoundQuestionCount = 0,
}: AutoGenerateCandyQuizModalProps) {
  // Step state: "CONFIG" | "GENERATING" | "REVIEW"
  const [step, setStep] = useState<"CONFIG" | "GENERATING" | "REVIEW">("CONFIG");

  // Input Mode: TEXT (topic/passage) or IMAGE (Vision AI)
  const [inputMode, setInputMode] = useState<"TEXT" | "IMAGE">("TEXT");
  const [topicOrText, setTopicOrText] = useState(initialTopic);

  // Configuration State
  // Required: "Dễ", "Trung bình", "Khó"
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("MEDIUM");
  const [questionType, setQuestionType] = useState<QuizQuestionType>("ALL");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [imageMode, setImageMode] = useState<"CARTOON" | "REALISTIC" | "NONE">("CARTOON");
  const allocationMode: "CURRENT_ROUND" = "CURRENT_ROUND";
  const questionsPerRound: number = 5;

  // Vision AI Upload State
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Progress State
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [imageProgress, setImageProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  // Generated Result State
  const [suggestedTitle, setSuggestedTitle] = useState<string>("");
  const [reviewQuestions, setReviewQuestions] = useState<
    (GeneratedQuizQuestionItem & { id: string; imageUrl?: string; cachedResults?: SearchImageResult[] })[]
  >([]);

  // Image search sub-modal for changing individual images
  const [activeImagePickerQIndex, setActiveImagePickerQIndex] = useState<number | null>(null);
  const [imageSearchQuery, setImageSearchQuery] = useState("");
  const [imageSearchResults, setImageSearchResults] = useState<SearchImageResult[]>([]);
  const [isSearchingImage, setIsSearchingImage] = useState(false);

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialTopic && !topicOrText) {
        setTopicOrText(initialTopic);
      }
    } else {
      // Reset temporary states on close
      setStep("CONFIG");
      setProgressStatus("");
    }
  }, [isOpen, initialTopic]);

  // Handle image upload & Vision AI
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

      try {
        const res = await analyzeImageForQuizAction({
          imageBase64: dataUrl,
          mimeType: file.type || "image/jpeg",
        });

        if (res.success && (res.topic || res.extractedContext)) {
          const detectedTopic = res.topicVi ? `${res.topic} (${res.topicVi})` : res.topic;
          let combinedPrompt = res.topic || "";
          if (res.extractedContext && res.extractedContext.trim()) {
            combinedPrompt += `\n\nNội dung trích xuất từ ảnh:\n${res.extractedContext}`;
          }
          setTopicOrText(combinedPrompt);
          if (res.suggestedTitle) {
            setSuggestedTitle(res.suggestedTitle);
          }
          toast.success(`Đã nhận diện: ${detectedTopic || "Thành công"}`);
        } else {
          toast.error(res.error || "Không thể nhận diện nội dung từ ảnh. Thầy/cô có thể tự gõ chủ đề bên dưới.");
        }
      } catch (err) {
        console.error("Lỗi khi phân tích ảnh:", err);
        toast.error("Lỗi khi gửi ảnh lên AI phân tích.");
      } finally {
        setIsAnalyzingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Support Ctrl + V to paste image directly
  useEffect(() => {
    if (!isOpen || step !== "CONFIG") return;

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
  }, [isOpen, step]);

  if (!isOpen) return null;

  // Handle generating questions
  const handleStartGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = topicOrText.trim();
    if (!cleanInput) {
      toast.error("Vui lòng nhập chủ đề, đoạn văn hoặc dán ảnh bài tập!");
      return;
    }

    try {
      setStep("GENERATING");
      setProgressStatus("AI đang thiết kế câu hỏi trắc nghiệm tiếng Anh...");

      // 1. Call AI Action to generate questions
      const res = await generateCandyQuizQuestionsAction({
        topicOrText: cleanInput,
        count: questionCount,
        difficulty,
        questionType,
      });

      if (!res.success || !res.questions || res.questions.length === 0) {
        toast.error(res.error || "AI không thể tạo câu hỏi cho nội dung này. Vui lòng thử lại!");
        setStep("CONFIG");
        return;
      }

      if (res.suggestedTitle) {
        setSuggestedTitle(res.suggestedTitle);
      }

      const generatedQuestions = res.questions;

      // 2. Search images if requested
      const questionsWithMedia: (GeneratedQuizQuestionItem & {
        id: string;
        imageUrl?: string;
        cachedResults?: SearchImageResult[];
      })[] = [];

      if (imageMode !== "NONE") {
        setProgressStatus("Đang tự động tìm kiếm hình ảnh minh họa cho câu hỏi...");
        setImageProgress({ current: 0, total: generatedQuestions.length });

        for (let i = 0; i < generatedQuestions.length; i++) {
          const q = generatedQuestions[i];
          const query = q.searchKeyword || q.question.split(" ").slice(0, 4).join(" ");
          let imageUrl: string | undefined = undefined;
          let cachedResults: SearchImageResult[] = [];

          try {
            const results = await searchImagesClient(query, imageMode === "REALISTIC" ? "REALISTIC" : "CARTOON");
            if (results.length > 0) {
              imageUrl = results[0].url;
              cachedResults = results;
            }
          } catch (imgErr) {
            console.warn(`Lỗi tìm ảnh cho câu "${query}":`, imgErr);
          }

          questionsWithMedia.push({
            ...q,
            id: `q-ai-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
            imageUrl,
            cachedResults,
          });

          setImageProgress({ current: i + 1, total: generatedQuestions.length });
        }
      } else {
        // Text-only questions
        for (let i = 0; i < generatedQuestions.length; i++) {
          const q = generatedQuestions[i];
          questionsWithMedia.push({
            ...q,
            id: `q-ai-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
            imageUrl: undefined,
          });
        }
      }

      setReviewQuestions(questionsWithMedia);
      setStep("REVIEW");
      toast.success(`Đã tạo thành công ${questionsWithMedia.length} câu hỏi!`);
    } catch (err: any) {
      console.error("Lỗi tạo câu hỏi AI:", err);
      toast.error("Có lỗi xảy ra trong quá trình tạo câu hỏi. Vui lòng thử lại!");
      setStep("CONFIG");
    }
  };

  // Review Edit Handlers
  const handleUpdateQuestionText = (index: number, text: string) => {
    const updated = [...reviewQuestions];
    updated[index].question = text;
    setReviewQuestions(updated);
  };

  const handleUpdateOptionText = (qIndex: number, optIndex: number, text: string) => {
    const updated = [...reviewQuestions];
    updated[qIndex].options[optIndex].text = text;
    setReviewQuestions(updated);
  };

  const handleSelectCorrectOption = (qIndex: number, optIndex: number) => {
    const updated = [...reviewQuestions];
    updated[qIndex].options = updated[qIndex].options.map((opt, idx) => ({
      ...opt,
      isCorrect: idx === optIndex,
    }));
    setReviewQuestions(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    if (reviewQuestions.length <= 1) {
      toast.error("Cần giữ lại ít nhất 1 câu hỏi!");
      return;
    }
    const updated = reviewQuestions.filter((_, i) => i !== index);
    setReviewQuestions(updated);
  };

  const handleRemoveImage = (index: number) => {
    const updated = [...reviewQuestions];
    updated[index].imageUrl = undefined;
    setReviewQuestions(updated);
  };

  // Open individual image picker
  const handleOpenImagePicker = (index: number) => {
    const q = reviewQuestions[index];
    setActiveImagePickerQIndex(index);
    setImageSearchQuery(q.searchKeyword || q.question.split(" ").slice(0, 3).join(" "));
    setImageSearchResults(q.cachedResults || []);
  };

  const handlePerformImageSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!imageSearchQuery.trim()) return;

    setIsSearchingImage(true);
    try {
      const results = await searchImagesClient(
        imageSearchQuery.trim(),
        imageMode === "REALISTIC" ? "REALISTIC" : "CARTOON"
      );
      setImageSearchResults(results);
    } catch (err) {
      toast.error("Không thể tìm ảnh lúc này.");
    } finally {
      setIsSearchingImage(false);
    }
  };

  const handleSelectSearchedImage = (url: string) => {
    if (activeImagePickerQIndex !== null) {
      const updated = [...reviewQuestions];
      updated[activeImagePickerQIndex].imageUrl = url;
      setReviewQuestions(updated);
      setActiveImagePickerQIndex(null);
      toast.success("Đã cập nhật ảnh cho câu hỏi!");
    }
  };

  // Final Apply to Game
  const handleApplyToGame = () => {
    if (reviewQuestions.length === 0) {
      toast.error("Không có câu hỏi nào để áp dụng!");
      return;
    }

    const finalQuestions: QuizQuestion[] = reviewQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      imageUrl: q.imageUrl,
      options: q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
    }));

    onApply({
      questions: finalQuestions,
      suggestedTitle: suggestedTitle || undefined,
      allocationMode,
      questionsPerRound,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-pink-50/40 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-pink-950/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/25">
              <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline font-black text-lg text-slate-800 dark:text-white leading-tight">
                  Tạo Câu Hỏi Bằng AI
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                  Game Kẹo Ngọt
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {step === "CONFIG" && "Tạo tự động câu hỏi trắc nghiệm từ chủ đề hoặc ảnh chụp bài tập"}
                {step === "GENERATING" && "Đang xử lý tạo câu hỏi và tìm hình ảnh minh họa..."}
                {step === "REVIEW" && `Xem trước và chỉnh sửa ${reviewQuestions.length} câu hỏi trước khi chèn`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-all cursor-pointer shadow-xs border border-slate-200 dark:border-slate-700"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* MODAL CONTENT CONTAINER */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {/* ================= STEP 1: CONFIGURATION ================= */}
          {step === "CONFIG" && (
            <form onSubmit={handleStartGenerate} className="space-y-6">
              {/* Input Mode Selector */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/60 max-w-md">
                <button
                  type="button"
                  onClick={() => setInputMode("TEXT")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    inputMode === "TEXT"
                      ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Chủ đề / Bài đọc</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("IMAGE")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    inputMode === "IMAGE"
                      ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Quét ảnh bài tập / SGK</span>
                  <span className="px-1.5 py-0.2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] font-black rounded-full">
                    Vision
                  </span>
                </button>
              </div>

              {/* Mode 1: Text Prompt / Reading Text */}
              {inputMode === "TEXT" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-headline font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Chủ đề hoặc Đoạn văn bài học: <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      <span>Có thể gõ tiếng Việt hoặc tiếng Anh</span>
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    value={topicOrText}
                    onChange={(e) => setTopicOrText(e.target.value)}
                    placeholder="Ví dụ: 'Daily Routines', 'Wild Animals', 'Comparative adjectives', 'Thì quá khứ đơn' hoặc dán cả đoạn văn bài đọc để AI trích xuất câu hỏi đọc hiểu..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
              )}

              {/* Mode 2: Vision Image Upload / Ctrl+V */}
              {inputMode === "IMAGE" && (
                <div className="space-y-3">
                  <label className="block font-headline font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Ảnh chụp trang sách / bài tập:
                  </label>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-3xl p-6 text-center transition-all cursor-pointer ${
                      imagePreviewUrl
                        ? "border-purple-400 bg-purple-50/20 dark:bg-purple-950/20"
                        : "border-slate-300 dark:border-slate-700 hover:border-purple-400 bg-slate-50/50 dark:bg-slate-800/30"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processImageFile(file);
                      }}
                    />

                    {imagePreviewUrl ? (
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <img
                          src={imagePreviewUrl}
                          alt="Uploaded worksheet"
                          className="w-28 h-28 object-cover rounded-2xl shadow-md border border-purple-200 dark:border-purple-800"
                        />
                        <div className="text-left space-y-1">
                          <div className="flex items-center gap-2">
                            {isAnalyzingImage ? (
                              <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold text-xs">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Gemini Vision đang phân tích ảnh...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Đã phân tích nội dung ảnh thành công!</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">Nhấp vào đây để đổi ảnh khác hoặc nhấn Ctrl + V</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-sm text-slate-700 dark:text-slate-200">
                          Kéo thả ảnh vào đây, hoặc click để chọn ảnh
                        </p>
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                          💡 Mẹo: Có thể nhấn <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[11px] font-mono font-bold">Ctrl + V</kbd> để dán ảnh chụp màn hình ngay lập tức!
                        </p>
                      </div>
                    )}
                  </div>

                  {topicOrText && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Nội dung AI đã trích xuất từ ảnh (có thể chỉnh sửa thêm):
                      </label>
                      <textarea
                        rows={2}
                        value={topicOrText}
                        onChange={(e) => setTopicOrText(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Grid Options: Trình độ (Dễ, Trung bình, Khó) & Dạng câu hỏi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                {/* 1. TRÌNH ĐỘ: Dễ, Trung bình, Khó (Per User Exact Requirement) */}
                <div className="space-y-2.5">
                  <label className="block font-headline font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Trình độ câu hỏi:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        id: "EASY" as QuizDifficulty,
                        label: "Dễ",
                        badge: "A1",
                        desc: "Từ vựng & câu ngắn cơ bản",
                        color: "emerald",
                      },
                      {
                        id: "MEDIUM" as QuizDifficulty,
                        label: "Trung bình",
                        badge: "A2-B1",
                        desc: "Ngữ pháp thông dụng",
                        color: "amber",
                      },
                      {
                        id: "HARD" as QuizDifficulty,
                        label: "Khó",
                        badge: "B2+",
                        desc: "Cấu trúc nâng cao & tư duy",
                        color: "rose",
                      },
                    ].map((lvl) => {
                      const isSelected = difficulty === lvl.id;
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setDifficulty(lvl.id)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 ring-2 ring-purple-500/20 shadow-xs"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-headline font-black text-sm text-slate-800 dark:text-white">
                              {lvl.label}
                            </span>
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                                lvl.id === "EASY"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : lvl.id === "MEDIUM"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              }`}
                            >
                              {lvl.badge}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-1">
                            {lvl.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. DẠNG CÂU HỎI */}
                <div className="space-y-2.5">
                  <label className="block font-headline font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Dạng câu hỏi:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "ALL" as QuizQuestionType, label: "🌟 Đa dạng (Kết hợp)" },
                      { id: "VOCABULARY" as QuizQuestionType, label: "📖 Từ vựng & Định nghĩa" },
                      { id: "FILL_BLANK" as QuizQuestionType, label: "✏️ Điền vào chỗ trống" },
                      { id: "READING_CONTEXT" as QuizQuestionType, label: "💬 Hội thoại & Ngữ cảnh" },
                    ].map((qt) => {
                      const isSelected = questionType === qt.id;
                      return (
                        <button
                          key={qt.id}
                          type="button"
                          onClick={() => setQuestionType(qt.id)}
                          className={`p-2.5 rounded-2xl border text-left font-bold text-xs transition-all cursor-pointer ${
                            isSelected
                              ? "border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 ring-2 ring-purple-500/20"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/60"
                          }`}
                        >
                          {qt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row: Số lượng câu hỏi & Tùy chọn ảnh minh họa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                {/* Số lượng câu */}
                <div className="space-y-2">
                  <label className="block font-headline font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Số lượng câu hỏi:
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuestionCount(num)}
                        className={`flex-1 py-2 rounded-xl font-black text-xs transition-all cursor-pointer ${
                          questionCount === num
                            ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tìm kiếm ảnh minh họa */}
                <div className="space-y-2">
                  <label className="block font-headline font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Hình ảnh minh họa:
                  </label>
                  <select
                    value={imageMode}
                    onChange={(e) => setImageMode(e.target.value as any)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold focus:outline-none"
                  >
                    <option value="CARTOON">🎨 Hoạt hình / Tranh vẽ (Đẹp cho bé)</option>
                    <option value="REALISTIC">📸 Ảnh chụp thực tế (Sắc nét)</option>
                    <option value="NONE">🚫 Không dùng ảnh (Chỉ chữ)</option>
                  </select>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>Tạo Ngay Bằng AI</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 2: GENERATING PROGRESS ================= */}
          {step === "GENERATING" && (
            <div className="py-16 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-3xl bg-purple-500/20 animate-ping" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-purple-500/30">
                  <Sparkles className="w-10 h-10 text-amber-200 animate-spin" />
                </div>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="font-headline font-black text-lg text-slate-800 dark:text-white">
                  {progressStatus || "AI đang làm việc..."}
                </h4>
                <p className="text-xs text-slate-400">
                  Hệ thống đang kết nối Gemini AI để tạo câu hỏi chuẩn sư phạm và tìm kiếm hình ảnh minh họa phù hợp...
                </p>

                {imageProgress.total > 0 && (
                  <div className="pt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                      <span>Tìm kiếm ảnh minh họa</span>
                      <span>{imageProgress.current}/{imageProgress.total}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 rounded-full"
                        style={{
                          width: `${(imageProgress.current / imageProgress.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 3: REVIEW & EDIT ================= */}
          {step === "REVIEW" && (
            <div className="space-y-5">
              {/* Review Alert bar */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
                <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    Thầy/cô có thể <strong>chỉnh sửa câu hỏi, đáp án hoặc click chọn lại đáp án đúng</strong> trước khi áp dụng vào game.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("CONFIG")}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cấu hình lại</span>
                </button>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {reviewQuestions.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 relative group transition-all hover:border-purple-300 dark:hover:border-purple-700"
                  >
                    {/* Header: Question Number & Delete */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                          {qIdx + 1}
                        </span>
                        <span className="font-headline font-bold text-xs text-slate-700 dark:text-slate-300">
                          Câu hỏi {qIdx + 1}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(qIdx)}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center transition-all cursor-pointer"
                        title="Xóa câu hỏi này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Question text & Image preview */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Image Preview Box */}
                      {q.imageUrl ? (
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group/img shrink-0">
                          <img
                            src={q.imageUrl}
                            alt="Illustration"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-all flex flex-col items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenImagePicker(qIdx)}
                              className="px-2 py-0.5 rounded bg-white text-slate-800 text-[10px] font-bold shadow-xs cursor-pointer"
                            >
                              Đổi ảnh
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(qIdx)}
                              className="text-[10px] text-rose-300 hover:text-rose-200 font-bold cursor-pointer"
                            >
                              Xóa ảnh
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenImagePicker(qIdx)}
                          className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-400 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-purple-600 transition-all shrink-0 cursor-pointer"
                          title="Thêm ảnh minh họa cho câu hỏi"
                        >
                          <ImageIcon className="w-5 h-5" />
                          <span className="text-[10px] font-bold">+ Thêm ảnh</span>
                        </button>
                      )}

                      {/* Question Textarea */}
                      <div className="flex-1 space-y-1">
                        <textarea
                          rows={2}
                          value={q.question}
                          onChange={(e) => handleUpdateQuestionText(qIdx, e.target.value)}
                          placeholder="Nội dung câu hỏi (100% tiếng Anh)..."
                          className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Options Grid (A, B, C, D) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-2 p-2 rounded-2xl border transition-all ${
                            opt.isCorrect
                              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 ring-2 ring-emerald-400/20"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {/* Correct Radio Badge */}
                          <button
                            type="button"
                            onClick={() => handleSelectCorrectOption(qIdx, optIdx)}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all cursor-pointer ${
                              opt.isCorrect
                                ? "bg-emerald-500 text-white shadow-xs"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-700"
                            }`}
                            title={opt.isCorrect ? "Đáp án ĐÚNG" : "Bấm để chọn làm đáp án ĐÚNG"}
                          >
                            {opt.isCorrect ? <Check className="w-4 h-4 stroke-[3]" /> : opt.id}
                          </button>

                          {/* Option Input */}
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => handleUpdateOptionText(qIdx, optIdx, e.target.value)}
                            placeholder={`Đáp án ${opt.id}...`}
                            className="flex-1 bg-transparent text-slate-800 dark:text-white font-semibold text-xs focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep("CONFIG")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại cấu hình</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyToGame}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Áp Dụng Vào Game ({reviewQuestions.length} câu)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= SUB-MODAL: CHANGE IMAGE ================= */}
      {activeImagePickerQIndex !== null && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-headline font-bold text-sm text-slate-800 dark:text-white">
                Chọn hình ảnh minh họa
              </h4>
              <button
                type="button"
                onClick={() => setActiveImagePickerQIndex(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              <form onSubmit={handlePerformImageSearch} className="flex gap-2">
                <input
                  type="text"
                  value={imageSearchQuery}
                  onChange={(e) => setImageSearchQuery(e.target.value)}
                  placeholder="Gõ từ khóa tìm ảnh (tiếng Anh)..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSearchingImage}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isSearchingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Tìm</span>
                </button>
              </form>

              <div className="grid grid-cols-3 gap-2 pt-2">
                {imageSearchResults.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => handleSelectSearchedImage(img.url)}
                    className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:scale-105 transition-all cursor-pointer group"
                  >
                    <img src={img.thumb || img.url} alt="Option" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-purple-600/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white font-bold text-xs">
                      Chọn
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
