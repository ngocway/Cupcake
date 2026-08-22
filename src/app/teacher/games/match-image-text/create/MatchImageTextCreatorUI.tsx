"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Trash2, 
  Search, 
  Upload, 
  Volume2, 
  VolumeX,
  Save, 
  X, 
  Check, 
  Image as ImageIcon, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  Play,
  Headphones
} from "lucide-react";
import { searchImagesAction } from "@/actions/image-search-actions";
import { uploadMedia } from "@/actions/upload-actions";
import { saveMatchImageTextGameAction } from "@/actions/match-image-text-actions";
import { toast } from "sonner";

export type AudioMode = "NONE" | "AUTO_TTS" | "CUSTOM";

export interface CardPair {
  id: string;
  word: string;
  imageUrl?: string;
  imageFileName?: string;
  imageFile?: File;
  audioUrl?: string;
  audioFileName?: string;
  audioFile?: File;
}

const MAX_PAIRS = 15;

const INITIAL_PAIRS: CardPair[] = [
  { id: "pair-1", word: "" },
];

export function MatchImageTextCreatorUI({ gameType }: { gameType: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("english");
  const [gradeLevel, setGradeLevel] = useState("kids-2-5");
  const [description, setDescription] = useState("");
  
  const [pairs, setPairs] = useState<CardPair[]>(INITIAL_PAIRS);
  const [audioMode, setAudioMode] = useState<AudioMode>("NONE");

  // --- Modal States ---
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState("");

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activePairIdForSearch, setActivePairIdForSearch] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [imageSearchStyle, setImageSearchStyle] = useState<"CARTOON" | "REALISTIC">("CARTOON");
  const [isSearching, startSearchTransition] = useTransition();

  // Hidden file input refs for dynamic triggering
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [activePairIdForUpload, setActivePairIdForUpload] = useState<string | null>(null);
  const [dragActivePairId, setDragActivePairId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [playingTTSPairId, setPlayingTTSPairId] = useState<string | null>(null);

  // --- Handlers ---
  const handleAddPair = () => {
    if (pairs.length >= MAX_PAIRS) {
      toast.error(`Tối đa chỉ được tạo ${MAX_PAIRS} cặp thẻ cho mỗi game!`);
      return;
    }
    const newPair: CardPair = {
      id: `pair-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      word: "",
    };
    setPairs([...pairs, newPair]);
  };

  const handleRemovePair = (id: string) => {
    if (pairs.length <= 1) {
      toast.error("Bài tập cần ít nhất 1 cặp thẻ!");
      return;
    }
    setPairs(pairs.filter(p => p.id !== id));
  };

  const handleUpdateWord = (id: string, word: string) => {
    setPairs(pairs.map(p => p.id === id ? { ...p, word } : p));
  };

  // --- Bulk Paste Handler ---
  const handleProcessBulkPaste = () => {
    if (!pasteContent.trim()) {
      toast.error("Vui lòng nhập danh sách từ vựng vào ô!");
      return;
    }

    // Split by commas or line breaks
    const words = pasteContent
      .split(/[\n,]+/)
      .map(word => word.trim())
      .filter(word => word.length > 0);

    if (words.length === 0) {
      toast.error("Không tìm thấy từ vựng hợp lệ nào.");
      return;
    }

    if (words.length > MAX_PAIRS) {
      toast.error(`Bạn đã nhập ${words.length} từ. Tối đa chỉ được tạo ${MAX_PAIRS} thẻ cùng lúc!`);
      return;
    }

    // Create fresh cards list (clearing previous images/audios)
    const newPairs: CardPair[] = words.map((word, idx) => ({
      id: `pair-bulk-${Date.now()}-${idx}`,
      word: word,
      imageUrl: undefined,
      audioUrl: undefined,
    }));

    setPairs(newPairs);
    setShowPasteModal(false);
    setPasteContent("");
    toast.success(`Đã tạo mới thành công danh sách ${newPairs.length} thẻ từ vựng!`);
  };

  // --- Internet Image Search ---
  const handleOpenSearchModal = (pair: CardPair) => {
    setActivePairIdForSearch(pair.id);
    setSearchQuery(pair.word || "");
    setSearchResults([]);
    setShowSearchModal(true);

    if (pair.word.trim()) {
      const termToSearch = imageSearchStyle === "CARTOON" 
        ? `${pair.word.trim()} cartoon illustration` 
        : pair.word.trim();

      startSearchTransition(async () => {
        try {
          const results = await searchImagesAction(termToSearch);
          setSearchResults(results || []);
        } catch (e: any) {
          toast.error(e?.message || "Không thể tìm kiếm ảnh.");
        }
      });
    }
  };

  const handlePerformSearch = (forceStyle?: "CARTOON" | "REALISTIC") => {
    if (!searchQuery.trim()) return;
    const styleToUse = forceStyle || imageSearchStyle;
    const termToSearch = styleToUse === "CARTOON" 
      ? `${searchQuery.trim()} cartoon illustration` 
      : searchQuery.trim();

    startSearchTransition(async () => {
      try {
        const results = await searchImagesAction(termToSearch);
        setSearchResults(results || []);
      } catch (e: any) {
        toast.error(e?.message || "Lỗi tìm kiếm ảnh.");
      }
    });
  };

  const handleStyleChange = (newStyle: "CARTOON" | "REALISTIC") => {
    setImageSearchStyle(newStyle);
    if (searchQuery.trim()) {
      handlePerformSearch(newStyle);
    }
  };

  const handleSelectSearchImage = (url: string) => {
    if (!activePairIdForSearch) return;
    setPairs(pairs.map(p => p.id === activePairIdForSearch ? { ...p, imageUrl: url } : p));
    setShowSearchModal(false);
    setActivePairIdForSearch(null);
    toast.success("Đã áp dụng ảnh từ Internet!");
  };

  // --- Local Upload Handlers ---
  const handleTriggerImageUpload = (pairId: string) => {
    setActivePairIdForUpload(pairId);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
      imageInputRef.current.click();
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePairIdForUpload) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng file ảnh tối đa là 5MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPairs(pairs.map(p => p.id === activePairIdForUpload ? { 
      ...p, 
      imageUrl: previewUrl,
      imageFileName: file.name,
      imageFile: file
    } : p));
    toast.success(`Đã tải lên ảnh: ${file.name}`);
  };

  // --- Drag & Drop Handlers ---
  const handleDragOver = (e: React.DragEvent, pairId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActivePairId(pairId);
  };

  const handleDragLeave = (e: React.DragEvent, pairId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragActivePairId === pairId) {
      setDragActivePairId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, pairId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActivePairId(null);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh!");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng file ảnh tối đa là 5MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPairs(pairs.map(p => p.id === pairId ? { 
      ...p, 
      imageUrl: previewUrl,
      imageFileName: file.name,
      imageFile: file
    } : p));
    toast.success(`Đã chọn ảnh: ${file.name}`);
  };

  const handleTriggerAudioUpload = (pairId: string) => {
    setActivePairIdForUpload(pairId);
    if (audioInputRef.current) {
      audioInputRef.current.value = "";
      audioInputRef.current.click();
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePairIdForUpload) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Dung lượng file âm thanh tối đa là 10MB.");
      return;
    }

    const audioPreviewUrl = URL.createObjectURL(file);
    setPairs(pairs.map(p => p.id === activePairIdForUpload ? { 
      ...p, 
      audioUrl: audioPreviewUrl,
      audioFileName: file.name,
      audioFile: file
    } : p));
    toast.success(`Đã tải âm thanh: ${file.name}`);
  };

  const handlePlayAudio = (url: string) => {
    try {
      const audio = new Audio(url);
      audio.play().catch(() => toast.error("Không thể phát file âm thanh."));
    } catch (e) {
      toast.error("Lỗi phát âm thanh.");
    }
  };

  // --- Deepgram Real-time Streaming TTS Preview ---
  const handlePlayTTSSpeech = async (pairId: string, text: string) => {
    if (!text || !text.trim()) {
      toast.error("Vui lòng nhập Chữ/Từ vựng trước khi nghe thử!");
      return;
    }

    try {
      setPlayingTTSPairId(pairId);
      
      // 1. Stream real-time Deepgram TTS
      const res = await fetch("/api/tts/deepgram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!res.ok) {
        throw new Error("Deepgram TTS API failed");
      }

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);

      audio.onended = () => setPlayingTTSPairId(null);
      audio.onerror = () => {
        setPlayingTTSPairId(null);
        toast.error("Lỗi khi phát audio Deepgram.");
      };

      await audio.play();
    } catch (error) {
      setPlayingTTSPairId(null);
      
      // Fallback: Web Speech Synthesis if Deepgram API fails
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.trim());
        utterance.lang = subject === "english" ? "en-US" : "vi-VN";
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      } else {
        toast.error("Không thể phát âm thanh AI Deepgram.");
      }
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Vui lòng nhập Tên bài tập / Game!");
      return;
    }

    const emptyWords = pairs.filter(p => !p.word.trim());
    if (emptyWords.length > 0) {
      toast.error("Vui lòng điền đầy đủ Chữ/Từ vựng cho tất cả các cặp thẻ!");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Đang xử lý và lưu bài tập (Deepgram TTS & Upload R2)...");

    try {
      const updatedPairs = await Promise.all(
        pairs.map(async (pair) => {
          let finalImageUrl = pair.imageUrl;
          let finalAudioUrl = pair.audioUrl;

          // 1. Upload custom image file if present
          if (pair.imageFile) {
            const formData = new FormData();
            formData.append("file", pair.imageFile);
            const res = await uploadMedia(formData);
            if (res.success && res.url) {
              finalImageUrl = res.url;
            } else {
              throw new Error(`Lỗi tải ảnh cho từ "${pair.word}": ${res.error}`);
            }
          }

          // 2. Upload custom audio file if present
          if (pair.audioFile) {
            const formData = new FormData();
            formData.append("file", pair.audioFile);
            const res = await uploadMedia(formData);
            if (res.success && res.url) {
              finalAudioUrl = res.url;
            } else {
              throw new Error(`Lỗi tải file âm thanh cho từ "${pair.word}": ${res.error}`);
            }
          }

          // 3. AUTO_TTS Mode: Generate Deepgram audio & upload to R2
          if (audioMode === "AUTO_TTS" && !finalAudioUrl) {
            try {
              const res = await fetch("/api/tts/deepgram", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: pair.word.trim() }),
              });

              if (res.ok) {
                const arrayBuffer = await res.arrayBuffer();
                if (arrayBuffer.byteLength > 0) {
                  const ttsFile = new File(
                    [arrayBuffer], 
                    `deepgram-${pair.word.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.mp3`, 
                    { type: "audio/mpeg" }
                  );

                  const formData = new FormData();
                  formData.append("file", ttsFile);
                  const uploadRes = await uploadMedia(formData);

                  if (uploadRes.success && uploadRes.url) {
                    finalAudioUrl = uploadRes.url;
                  }
                }
              }
            } catch (err) {
              console.warn(`[Auto TTS Upload] Failed for "${pair.word}":`, err);
            }
          }

          return {
            id: pair.id,
            word: pair.word.trim(),
            imageUrl: finalImageUrl,
            audioUrl: finalAudioUrl,
          };
        })
      );

      setPairs(updatedPairs);

      // Save game topic and items to Prisma database
      const saveDbRes = await saveMatchImageTextGameAction({
        title,
        subject,
        gradeLevel,
        description,
        pairs: updatedPairs.map(p => ({
          word: p.word,
          imageUrl: p.imageUrl,
          audioUrl: p.audioUrl,
        })),
      });

      if (!saveDbRes.success) {
        throw new Error(saveDbRes.error || "Không thể lưu bài tập vào Cơ sở dữ liệu");
      }

      toast.dismiss(toastId);
      toast.success("Lưu bài tập Nối Cặp thành công vào Cơ sở dữ liệu!");
      router.push("/teacher");
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.message || "Đã xảy ra lỗi khi lưu bài tập!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full py-6 space-y-8 animate-in fade-in duration-300">
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={imageInputRef} 
        onChange={handleImageFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={audioInputRef} 
        onChange={handleAudioFileChange} 
        accept="audio/*" 
        className="hidden" 
      />

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-primary/10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link 
            href="/teacher" 
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 transition-all hover:scale-105 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Nối Cặp Ảnh - Chữ
              </span>
              <span className="text-xs font-semibold text-slate-400">Thiết kế bài tập</span>
            </div>
            <h1 className="font-headline font-black text-2xl md:text-3xl text-slate-800 dark:text-white mt-1">
              Tạo Game Nối Cặp Ảnh - Chữ
            </h1>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? "Đang lưu..." : "Lưu bài tập"}</span>
          </button>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-primary/10 p-6 md:p-8 shadow-sm space-y-4">
        <h2 className="font-headline font-black text-lg text-slate-800 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>1. Thông tin bài tập</span>
        </h2>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tên bài tập / Game <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Nhập tên bài tập (VD: Bài tập Nối Cặp Ảnh - Chữ)..."
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
          />
        </div>
      </div>

      {/* Pairs Editor Section */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-primary/10 p-6 md:p-8 shadow-sm space-y-6">
        {/* Editor Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-headline font-black text-lg text-slate-800 dark:text-white">
              2. Danh sách các cặp thẻ Nối (Ảnh - Chữ)
            </h2>
          </div>

          {/* Add Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Audio Mode Segmented Control (3 Options) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setAudioMode("NONE")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  audioMode === "NONE" 
                    ? "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm" 
                    : "text-slate-400 hover:text-slate-700 dark:text-slate-400"
                }`}
                title="Bài tập không phát âm thanh đọc chữ"
              >
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span>Không đọc</span>
              </button>

              <button
                type="button"
                onClick={() => setAudioMode("AUTO_TTS")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  audioMode === "AUTO_TTS" 
                    ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm" 
                    : "text-slate-400 hover:text-slate-700 dark:text-slate-400"
                }`}
                title="Hệ thống tự động đọc bằng công nghệ AI phát âm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Hệ thống tự đọc</span>
              </button>

              <button
                type="button"
                onClick={() => setAudioMode("CUSTOM")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  audioMode === "CUSTOM" 
                    ? "bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-sm" 
                    : "text-slate-400 hover:text-slate-700 dark:text-slate-400"
                }`}
                title="Giáo viên tự tải file ghi âm audio cho từng từ vựng"
              >
                <Volume2 className="w-3.5 h-3.5 text-sky-500" />
                <span>Tải lên Audio</span>
              </button>
            </div>

            {/* Bulk Paste Trigger Button */}
            <button
              onClick={() => setShowPasteModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-purple-600/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Nhập nhanh nhiều từ</span>
            </button>
          </div>
        </div>

        {/* Pair Items Grid (4 Columns Layout - Reference Screenshot Design) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {pairs.map((pair, index) => (
            <div 
              key={pair.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden p-3 gap-3"
            >
              {/* 1. Top Image Box (Inset Rounded Frame with Drag & Drop) */}
              <div 
                onDragOver={(e) => handleDragOver(e, pair.id)}
                onDragLeave={(e) => handleDragLeave(e, pair.id)}
                onDrop={(e) => handleDrop(e, pair.id)}
                className={`relative aspect-[4/3] w-full bg-slate-50 dark:bg-slate-800/80 rounded-xl border transition-all overflow-hidden group/img shrink-0 p-2 flex items-center justify-center ${
                  dragActivePairId === pair.id 
                    ? "border-2 border-dashed border-purple-500 bg-purple-50/80 dark:bg-purple-950/60 scale-[0.99]" 
                    : "border-slate-200/80 dark:border-slate-700/80"
                }`}
              >
                {dragActivePairId === pair.id && (
                  <div className="absolute inset-0 bg-purple-600/20 backdrop-blur-[1px] z-40 flex flex-col items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-xs gap-1 pointer-events-none">
                    <Upload className="w-6 h-6 animate-bounce" />
                    <span>Thả file ảnh vào đây</span>
                  </div>
                )}
                {pair.imageUrl ? (
                  <img 
                    src={pair.imageUrl} 
                    alt={pair.word || `Pair #${index+1}`} 
                    className="w-full h-full object-contain group-hover/img:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 p-3 text-center bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center border border-purple-200/50">
                      <ImageIcon className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Chưa chọn ảnh</span>
                  </div>
                )}

                {/* STT Badge - Top Left Overlay */}
                <div className="absolute top-2.5 left-2.5 z-30 pointer-events-none">
                  <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 text-white font-black text-xs flex items-center justify-center shadow-md shadow-purple-600/30">
                    {index + 1}
                  </span>
                </div>

                {/* Delete Pair Button - Top Right Overlay */}
                <div className="absolute top-2.5 right-2.5 z-30">
                  <button
                    onClick={() => handleRemovePair(pair.id)}
                    className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md hover:bg-rose-50 text-slate-500 hover:text-rose-600 shadow-md flex items-center justify-center transition-all cursor-pointer border border-slate-100"
                    title="Xóa cặp thẻ này"
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                  </button>
                </div>

                {/* Hover Action Overlay - 2 Buttons side-by-side at bottom of image */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-end p-2.5 z-20">
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={() => handleOpenSearchModal(pair)}
                      className="flex-1 py-2 px-2.5 bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white font-bold text-[11px] rounded-xl shadow-md transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer truncate"
                      title="Tìm ảnh Internet"
                    >
                      <Search className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Tìm ảnh</span>
                    </button>

                    <button
                      onClick={() => handleTriggerImageUpload(pair.id)}
                      className="flex-1 py-2 px-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-[11px] rounded-xl shadow-md transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer truncate"
                      title="Tải từ máy"
                    >
                      <Upload className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="truncate">Tải từ máy</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Padded Content Container for Text and Audio */}
              <div className="flex flex-col justify-between flex-1 gap-3 pt-1">
                {/* 2. Middle Section: Bold Centered Word Input & Decorative Purple Line */}
                <div className="w-full space-y-1.5">
                  <input
                    type="text"
                    value={pair.word}
                    onChange={e => handleUpdateWord(pair.id, e.target.value)}
                    placeholder="Elephant"
                    className="w-full bg-transparent border-none text-center font-black text-xl md:text-2xl text-slate-800 dark:text-white focus:ring-0 outline-none placeholder:text-slate-300 p-0"
                  />

                  {/* Decorative purple line with center dot */}
                  <div className="flex items-center justify-center">
                    <div className="h-[1px] w-14 bg-purple-200 dark:bg-purple-800 relative">
                      <div className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {/* 3. Audio Section (Renders based on audioMode) */}
                {audioMode === "AUTO_TTS" && (
                  <div className="w-full">
                    <button
                      type="button"
                      onClick={() => handlePlayTTSSpeech(pair.id, pair.word)}
                      disabled={playingTTSPairId === pair.id}
                      className="w-full py-2.5 px-3.5 bg-purple-50/80 dark:bg-purple-950/40 hover:bg-purple-100/90 border border-purple-200 dark:border-purple-800/80 rounded-2xl flex items-center justify-between gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-75"
                      title="Nghe phát âm phát trực tiếp bằng Deepgram TTS"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-6 h-6 rounded-full bg-purple-200/80 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                          {playingTTSPairId === pair.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-current" />
                          )}
                        </div>
                        <span className="truncate">
                          {playingTTSPairId === pair.id ? "Đang phát..." : "Nghe thử giọng đọc AI"}
                        </span>
                      </div>
                      <Volume2 className={`w-3.5 h-3.5 text-purple-500 shrink-0 ${playingTTSPairId === pair.id ? "animate-pulse" : ""}`} />
                    </button>
                  </div>
                )}

                {audioMode === "CUSTOM" && (
                  <div className="w-full">
                    {pair.audioUrl ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(pair.audioUrl!)}
                          className="flex-1 py-2.5 px-3 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100/80 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-center justify-between gap-2.5 text-sky-700 dark:text-sky-300 font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer truncate"
                          title="Nghe file phát âm giáo viên đã tải lên"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-5 h-5 rounded-full bg-sky-200 dark:bg-sky-900 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
                              <Volume2 className="w-3 h-3 fill-current" />
                            </div>
                            <span className="truncate">Phát file audio</span>
                          </div>

                          {/* Audio Waveform Indicator */}
                          <div className="flex items-end gap-[2px] h-3.5 text-sky-500 shrink-0">
                            <span className="w-[2px] h-1.5 bg-sky-400 rounded-full animate-bounce" />
                            <span className="w-[2px] h-3.5 bg-sky-600 rounded-full animate-bounce [animation-delay:0.15s]" />
                            <span className="w-[2px] h-2.5 bg-sky-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPairs(pairs.map(p => p.id === pair.id ? { ...p, audioUrl: undefined, audioFileName: undefined, audioFile: undefined } : p))}
                          className="px-2 py-2 text-xs text-rose-500 hover:underline font-bold shrink-0"
                        >
                          Xóa
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTriggerAudioUpload(pair.id)}
                        className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-sky-300 rounded-2xl flex items-center justify-between gap-2 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
                            <Upload className="w-3.5 h-3.5" />
                          </div>
                          <span>Tải file audio</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">.mp3</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Dashed Add New Pair Card inside Grid */}
          <button
            type="button"
            onClick={handleAddPair}
            disabled={pairs.length >= MAX_PAIRS}
            className={`rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-6 text-center group min-h-[260px] ${
              pairs.length >= MAX_PAIRS
                ? "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 cursor-not-allowed opacity-60"
                : "border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/30 hover:bg-emerald-50/80 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 text-emerald-700 dark:text-emerald-300 cursor-pointer"
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 ${
              pairs.length >= MAX_PAIRS 
                ? "bg-slate-200 dark:bg-slate-800 text-slate-400" 
                : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 shadow-md shadow-emerald-500/10"
            }`}>
              <Plus className="w-7 h-7 stroke-[2.5]" />
            </div>

            <div className="mt-4 space-y-1">
              <span className="font-headline font-black text-sm block">
                {pairs.length >= MAX_PAIRS ? "Đã đạt tối đa 15 cặp" : "Thêm 1 cặp"}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 block">
                {pairs.length >= MAX_PAIRS 
                  ? "Không thể tạo thêm" 
                  : `Tạo cặp thẻ thứ ${pairs.length + 1}`}
              </span>
            </div>
          </button>
        </div>

        {/* Warning Badge when max limit reached */}
        {pairs.length >= MAX_PAIRS && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs font-bold">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
            <span>Đã đạt tối đa {MAX_PAIRS} cặp thẻ cho game này. Bạn có thể chỉnh sửa các cặp hiện có hoặc xóa bớt để thêm mới.</span>
          </div>
        )}
      </div>

      {/* --- BULK PASTE MODAL --- */}
      {showPasteModal && (() => {
        const parsedWords = pasteContent
          .split(/[\n,]+/)
          .map(w => w.trim())
          .filter(w => w.length > 0);
        const isOverLimit = parsedWords.length > MAX_PAIRS;

        return (
          <div className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-primary/10 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-headline font-black text-lg text-slate-800 dark:text-white">
                      Nhập nhanh nhiều từ vựng
                    </h3>
                    <p className="text-xs font-medium text-slate-400">
                      Phân cách từ vựng bằng dấu phẩy (,) hoặc xuống dòng
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPasteModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Overwrite Warning Badge when existing cards exist */}
              {pairs.length > 0 && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-2.5 text-amber-800 dark:text-amber-300 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Cảnh báo: Tạo mới sẽ thay thế toàn bộ {pairs.length} cặp thẻ hiện tại.</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Nhập/dán danh sách từ vựng vào đây:
                </label>
                <textarea
                  rows={6}
                  value={pasteContent}
                  onChange={e => setPasteContent(e.target.value)}
                  placeholder={`Elephant, Tiger, Monkey, Dog, Cat, Fish, Lion`}
                  className={`w-full p-4 bg-slate-50 dark:bg-slate-800/80 border rounded-2xl text-sm font-bold focus:ring-4 outline-none transition-all resize-none ${
                    isOverLimit 
                      ? "border-rose-400 focus:ring-rose-500/10 focus:border-rose-500" 
                      : "border-slate-200 dark:border-slate-700 focus:ring-purple-500/10 focus:border-purple-500"
                  }`}
                />

                {/* Real-time word count & limit warning */}
                <div className="flex items-center justify-between text-xs font-bold pt-1">
                  <span className="text-slate-500">
                    Số từ nhận diện:{" "}
                    <span className={isOverLimit ? "text-rose-600 font-black text-sm" : "text-purple-600 font-black"}>
                      {parsedWords.length} / {MAX_PAIRS} từ
                    </span>
                  </span>
                  {isOverLimit && (
                    <span className="text-rose-600 text-[11px] font-extrabold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Vượt quá tối đa 15 từ!
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowPasteModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleProcessBulkPaste}
                  disabled={isOverLimit || parsedWords.length === 0}
                  className={`px-6 py-2.5 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2 ${
                    isOverLimit || parsedWords.length === 0
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/25 active:scale-95 cursor-pointer"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Tạo danh sách thẻ</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- INTERNET IMAGE SEARCH SLIDE-OVER DRAWER --- */}
      {showSearchModal && (
        <div className="fixed inset-0 z-[200] overflow-hidden flex justify-end">
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setShowSearchModal(false)}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
          />

          {/* Right Slide-Over Panel (Anchored to Right Side, 50% Screen Width) */}
          <div className="relative z-10 w-full md:w-1/2 h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Square Close Button X (Flush attached to top-left outer edge of slider) */}
            <button
              onClick={() => setShowSearchModal(false)}
              className="absolute right-full top-0 w-11 h-11 bg-white dark:bg-slate-900 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-300 shadow-md border-l border-t border-b border-slate-200 dark:border-slate-800 flex items-center justify-center transition-all cursor-pointer rounded-l-2xl"
              title="Đóng thanh tìm kiếm"
            >
              <X className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Drawer Body: Search Bar & Style Switch */}
            <div className="p-6 space-y-4 flex-1 overflow-y-auto flex flex-col">
                <div className="flex flex-col gap-3 shrink-0">
                  <div className="relative flex-1">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handlePerformSearch()}
                      placeholder="Nhập từ khóa tìm kiếm ảnh..."
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 shrink-0">
                    {/* Style Filter Switch */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 flex-1">
                      <button
                        type="button"
                        onClick={() => handleStyleChange("CARTOON")}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          imageSearchStyle === "CARTOON"
                            ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                        }`}
                        title="Tìm ảnh minh họa dạng vẽ tay / hoạt hình"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Hoạt hình</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStyleChange("REALISTIC")}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          imageSearchStyle === "REALISTIC"
                            ? "bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                        }`}
                        title="Tìm ảnh chụp thực tế"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                        <span>Ảnh thật</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePerformSearch()}
                      disabled={isSearching}
                      className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      {isSearching ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      <span>Tìm kiếm</span>
                    </button>
                  </div>
                </div>

                {/* Image Grid Results inside Drawer */}
                <div className="flex-1 overflow-y-auto min-h-[300px] p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  {isSearching ? (
                    <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-400">
                      <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold">Đang tìm kiếm ảnh...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {searchResults.map((imgItem, i) => (
                        <div
                          key={imgItem.id || i}
                          onClick={() => handleSelectSearchImage(imgItem.url)}
                          className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border-2 border-transparent hover:border-sky-500 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-200"
                        >
                          <img 
                            src={imgItem.thumb || imgItem.url} 
                            alt="Search result" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          />
                          <div className="absolute inset-0 bg-sky-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-3 py-1.5 bg-sky-500 text-white font-black text-xs rounded-full shadow-lg">
                              Chọn ảnh
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <ImageIcon className="w-10 h-10 stroke-1" />
                      <span className="text-xs font-bold text-center px-4">Nhập từ khóa và bấm Tìm kiếm để xem kết quả hình ảnh</span>
                    </div>
                  )}
                </div>
              </div>

          </div>
        </div>
      )}
    </div>
  );
}
