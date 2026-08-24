"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Trash2, 
  Upload, 
  Search, 
  Sparkles, 
  Save, 
  ArrowLeft, 
  FileText, 
  Image as ImageIcon,
  Check,
  X,
  Volume2,
  VolumeX,
  Wand2,
  AlertCircle,
  AlertTriangle,
  MoveRight,
  Layers,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { searchImagesAction } from "@/actions/image-search-actions";
import { saveMatchImageTextGameAction } from "@/actions/match-image-text-actions";
import { uploadMedia } from "@/actions/upload-actions";

export type AudioMode = "NONE" | "AUTO_TTS" | "CUSTOM_FILE";

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

export interface GameRound {
  id: string;
  title: string;
  pairs: CardPair[];
}

const MAX_PAIRS_PER_ROUND = 7;
const MAX_BULK_WORDS = 50;

const INITIAL_ROUNDS: GameRound[] = [
  {
    id: "round-1",
    title: "Vòng 1",
    pairs: [{ id: "pair-1", word: "" }],
  },
];

export function MatchImageTextCreatorUI({ gameType }: { gameType: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [subject, setSubject] = useState("english");
  const [gradeLevel, setGradeLevel] = useState("kids-2-5");
  const [description, setDescription] = useState("");
  
  // Multi-Round State
  const [rounds, setRounds] = useState<GameRound[]>(INITIAL_ROUNDS);
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);

  const currentRound = rounds[activeRoundIndex] || rounds[0];
  const pairs = currentRound?.pairs || [];

  const [audioMode, setAudioMode] = useState<AudioMode>("AUTO_TTS");

  // Warm-up TTS API & Edge WebSocket connection on component mount
  useEffect(() => {
    fetch("/api/tts/edge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "a", voice: "en-US-AnaNeural", forceEdge: true }),
    }).catch(() => {
      // Ignore background warm-up errors
    });
  }, []);

  // Track unsaved changes
  const isDirty = Boolean(title.trim() || rounds.some(r => r.pairs.some(p => p.word.trim() || p.imageUrl || p.audioUrl)));
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // --- Modal States ---
  const [validationModalMessage, setValidationModalMessage] = useState<string | null>(null);
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

  // Warn teacher before closing browser tab or reloading if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSaving) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isSaving]);

  // --- Round Management Handlers ---
  const handleAddRound = () => {
    const newRound: GameRound = {
      id: `round-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `Vòng ${rounds.length + 1}`,
      pairs: [{ id: `pair-${Date.now()}-0`, word: "" }],
    };
    setRounds([...rounds, newRound]);
    setActiveRoundIndex(rounds.length);
    toast.success(`Đã tạo ${newRound.title}!`);
  };

  const handleRemoveRound = (index: number) => {
    if (rounds.length <= 1) {
      toast.error("Bài tập cần ít nhất 1 Vòng chơi!");
      return;
    }
    const roundTitle = rounds[index].title;
    const updated = rounds.filter((_, i) => i !== index);
    setRounds(updated);
    if (activeRoundIndex >= updated.length) {
      setActiveRoundIndex(updated.length - 1);
    }
    toast.success(`Đã xóa ${roundTitle}!`);
  };

  const handleAddPair = () => {
    if (pairs.length >= MAX_PAIRS_PER_ROUND) {
      toast.error(`Vòng ${activeRoundIndex + 1} đã đạt tối đa 7 cặp thẻ. Vui lòng bấm [+ Thêm Vòng Mới] để tạo vòng tiếp theo!`);
      return;
    }
    const newPair: CardPair = {
      id: `pair-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      word: "",
    };
    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      pairs: [...pairs, newPair],
    };
    setRounds(updatedRounds);
  };

  const handleRemovePair = (id: string) => {
    if (pairs.length <= 1 && rounds.length <= 1) {
      toast.error("Bài tập cần ít nhất 1 cặp thẻ!", { position: "top-center" });
      return;
    }
    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      pairs: pairs.filter(p => p.id !== id),
    };
    setRounds(updatedRounds);
  };

  const handleUpdateWord = (id: string, word: string) => {
    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      pairs: pairs.map(p => p.id === id ? { ...p, word } : p),
    };
    setRounds(updatedRounds);
  };

  const handleMovePairToRound = (pairId: string, targetRoundIndex: number) => {
    if (targetRoundIndex === activeRoundIndex) return;
    const targetRound = rounds[targetRoundIndex];
    if (!targetRound) return;

    if (targetRound.pairs.length >= MAX_PAIRS_PER_ROUND) {
      toast.error(`${targetRound.title} đã có 7 cặp thẻ (đã đầy)!`, { position: "top-center" });
      return;
    }

    const pairToMove = pairs.find(p => p.id === pairId);
    if (!pairToMove) return;

    const updatedRounds = rounds.map((r, rIdx) => {
      if (rIdx === activeRoundIndex) {
        return { ...r, pairs: r.pairs.filter(p => p.id !== pairId) };
      }
      if (rIdx === targetRoundIndex) {
        return { ...r, pairs: [...r.pairs, pairToMove] };
      }
      return r;
    });

    setRounds(updatedRounds);
    toast.success(`Đã chuyển thẻ "${pairToMove.word || 'từ'}" sang ${targetRound.title}!`, { position: "top-center" });
  };

  // Upload & Search Image Handlers
  const handleOpenImageUpload = (pairId: string) => {
    setActivePairIdForUpload(pairId);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
      imageInputRef.current.click();
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePairIdForUpload) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh hợp lệ!");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      pairs: pairs.map(p => {
        if (p.id === activePairIdForUpload) {
          return {
            ...p,
            imageUrl: objectUrl,
            imageFileName: file.name,
            imageFile: file,
          };
        }
        return p;
      }),
    };
    setRounds(updatedRounds);
    toast.success("Tải ảnh lên thành công!");
  };

  const handleOpenImageSearch = (pair: CardPair) => {
    setActivePairIdForSearch(pair.id);
    setSearchQuery(pair.word || "");
    setSearchResults([]);
    setShowSearchModal(true);

    if (pair.word.trim()) {
      executeImageSearch(pair.word, imageSearchStyle);
    }
  };

  const executeImageSearch = (query: string, style: "CARTOON" | "REALISTIC") => {
    if (!query.trim()) return;
    startSearchTransition(async () => {
      const res = await searchImagesAction(query, style);
      const imageList = Array.isArray(res) ? res : (res?.images || []);
      if (imageList.length > 0) {
        setSearchResults(imageList);
      } else {
        toast.error("Không tìm thấy hình ảnh phù hợp!");
      }
    });
  };

  const handleSelectSearchImage = (imageUrl: string) => {
    if (!activePairIdForSearch) return;

    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      pairs: pairs.map(p => {
        if (p.id === activePairIdForSearch) {
          return {
            ...p,
            imageUrl,
            imageFile: undefined,
            imageFileName: undefined,
          };
        }
        return p;
      }),
    };
    setRounds(updatedRounds);

    setShowSearchModal(false);
    toast.success("Đã chọn hình ảnh cho từ vựng!");
  };

  const handleRemoveImage = (pairId: string) => {
    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      pairs: pairs.map(p => {
        if (p.id === pairId) {
          return {
            ...p,
            imageUrl: undefined,
            imageFile: undefined,
            imageFileName: undefined,
          };
        }
        return p;
      }),
    };
    setRounds(updatedRounds);
  };

  // Drag & Drop Image Handling
  const handleDragOver = (e: React.DragEvent, pairId: string) => {
    e.preventDefault();
    setDragActivePairId(pairId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActivePairId(null);
  };

  const handleDropImage = (e: React.DragEvent, pairId: string) => {
    e.preventDefault();
    setDragActivePairId(null);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Vui lòng thả file hình ảnh hợp lệ!");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      pairs: pairs.map(p => {
        if (p.id === pairId) {
          return {
            ...p,
            imageUrl: objectUrl,
            imageFileName: file.name,
            imageFile: file,
          };
        }
        return p;
      }),
    };
    setRounds(updatedRounds);
    toast.success("Đã nạp hình ảnh thành công!");
  };

  // Audio Upload & Test Handling
  const handleOpenAudioUpload = (pairId: string) => {
    setActivePairIdForUpload(pairId);
    if (audioInputRef.current) {
      audioInputRef.current.value = "";
      audioInputRef.current.click();
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePairIdForUpload) return;

    if (!file.type.startsWith("audio/")) {
      toast.error("Vui lòng chọn file âm thanh hợp lệ (MP3, WAV, M4A)!");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      pairs: pairs.map(p => {
        if (p.id === activePairIdForUpload) {
          return {
            ...p,
            audioUrl: objectUrl,
            audioFileName: file.name,
            audioFile: file,
          };
        }
        return p;
      }),
    };
    setRounds(updatedRounds);
    toast.success("Tải file âm thanh lên thành công!");
  };

  const fallbackWebSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 1.0;
      u.pitch = 1.0;
      u.onend = () => setPlayingTTSPairId(null);
      u.onerror = () => setPlayingTTSPairId(null);
      window.speechSynthesis.speak(u);
    } else {
      setPlayingTTSPairId(null);
      toast.error("Trình duyệt của bạn không hỗ trợ đọc tự động Web Speech!");
    }
  };

  const handleTestTTS = async (pair: CardPair) => {
    if (!pair.word.trim()) {
      toast.error("Vui lòng nhập từ vựng trước khi nghe đọc!");
      return;
    }

    setPlayingTTSPairId(pair.id);

    try {
      // 1. Try Edge TTS real-time synthesis (en-US-AnaNeural, child voice)
      const res = await fetch("/api/tts/edge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pair.word.trim(), voice: "en-US-AnaNeural", forceEdge: true }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.onended = () => setPlayingTTSPairId(null);
        audio.onerror = () => {
          setPlayingTTSPairId(null);
          fallbackWebSpeech(pair.word);
        };
        await audio.play();
        return;
      }
      throw new Error(`Edge TTS API status ${res.status}`);
    } catch (err) {
      console.warn("Deepgram TTS preview failed, falling back to Web Speech API:", err);
      fallbackWebSpeech(pair.word);
    }
  };

  // Bulk Paste Handler with Auto Multi-Round Split (Max 50 words)
  const handleProcessBulkPaste = () => {
    if (!pasteContent.trim()) {
      toast.error("Vui lòng nhập danh sách từ vựng vào ô!");
      return;
    }

    const words = pasteContent
      .split(/[\n,]+/)
      .map(w => w.trim())
      .filter(w => w.length > 0);

    if (words.length === 0) {
      toast.error("Không tìm thấy từ vựng hợp lệ nào.");
      return;
    }

    if (words.length > MAX_BULK_WORDS) {
      toast.error(`Bạn đã nhập ${words.length} từ. Tối đa cho phép nhập ${MAX_BULK_WORDS} từ cùng lúc!`);
      return;
    }

    // Auto calculate number of rounds (7 cards per round max)
    const newRounds: GameRound[] = [];
    const totalRounds = Math.ceil(words.length / MAX_PAIRS_PER_ROUND);

    for (let r = 0; r < totalRounds; r++) {
      const roundWords = words.slice(r * MAX_PAIRS_PER_ROUND, (r + 1) * MAX_PAIRS_PER_ROUND);
      const roundPairs: CardPair[] = roundWords.map((word, idx) => ({
        id: `pair-bulk-${r}-${idx}-${Date.now()}`,
        word,
      }));
      newRounds.push({
        id: `round-bulk-${r}-${Date.now()}`,
        title: `Vòng ${r + 1}`,
        pairs: roundPairs,
      });
    }

    setRounds(newRounds);
    setActiveRoundIndex(0);
    setShowPasteModal(false);
    setPasteContent("");
    toast.success(`Đã tự động tạo ${newRounds.length} Vòng chơi cho ${words.length} từ vựng!`);
  };

  const handleBackClick = (e: React.MouseEvent) => {
    if (isDirty && !isSaving) {
      e.preventDefault();
      setShowExitConfirmModal(true);
    } else {
      router.push("/teacher");
    }
  };

  // Save Game Handler
  // Save Game Handler
  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError(true);
      if (titleInputRef.current) {
        titleInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        titleInputRef.current.focus();
      }
      setValidationModalMessage("Vui lòng nhập Tên bài tập / Game!");
      return;
    }

    // Verification 1: Check minimum 2 pairs per round
    for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
      const r = rounds[rIdx];
      if (r.pairs.length < 2) {
        setActiveRoundIndex(rIdx);
        setValidationModalMessage(`${r.title} phải có ít nhất 2 cặp thẻ để học sinh nối. Vui lòng bấm [+ Thêm 1 cặp]!`);
        return;
      }
    }

    // Verification 2: Check for empty words in rounds
    for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
      const r = rounds[rIdx];
      const emptyIdx = r.pairs.findIndex(p => !p.word.trim());
      if (emptyIdx !== -1) {
        setActiveRoundIndex(rIdx);
        setValidationModalMessage(`${r.title}, Cặp thẻ thứ #${emptyIdx + 1} chưa nhập Chữ/Từ vựng!`);
        return;
      }
    }

    // Verification 2: Check for missing images in rounds
    for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
      const r = rounds[rIdx];
      const missingImgIdx = r.pairs.findIndex(p => !p.imageUrl);
      if (missingImgIdx !== -1) {
        setActiveRoundIndex(rIdx);
        const pairName = r.pairs[missingImgIdx].word.trim();
        setValidationModalMessage(`${r.title}, Cặp thẻ thứ #${missingImgIdx + 1} ("${pairName}") chưa có hình ảnh. Vui lòng chọn ảnh trước khi lưu!`);
        return;
      }
    }

    // Verification 3: Check for missing audio files in CUSTOM_FILE mode
    if (audioMode === "CUSTOM_FILE") {
      for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
        const r = rounds[rIdx];
        const missingAudioIdx = r.pairs.findIndex(p => !p.audioUrl && !p.audioFile);
        if (missingAudioIdx !== -1) {
          setActiveRoundIndex(rIdx);
          const pairName = r.pairs[missingAudioIdx].word.trim() || `thẻ #${missingAudioIdx + 1}`;
          setValidationModalMessage(`${r.title}, Cặp thẻ thứ #${missingAudioIdx + 1} ("${pairName}") chưa có file âm thanh. Vui lòng tải file audio trước khi lưu!`);
          return;
        }
      }
    }

    // Verification 4: Check for duplicate words across all rounds
    const allPairs = rounds.flatMap(r => r.pairs);
    const wordList = allPairs.map(p => p.word.trim().toLowerCase());
    const duplicateWord = wordList.find((w, idx) => wordList.indexOf(w) !== idx);
    if (duplicateWord) {
      const originalWord = allPairs.find(p => p.word.trim().toLowerCase() === duplicateWord)?.word.trim();
      setValidationModalMessage(`Từ vựng "${originalWord}" đang bị trùng lặp. Vui lòng đổi tên các từ vựng khác nhau!`);
      return;
    }

    setIsSaving(true);
    const loadingMessage = 
      audioMode === "CUSTOM_FILE" 
        ? "Đang xử lý và tải lên file âm thanh..." 
        : audioMode === "AUTO_TTS" 
          ? "Đang xử lý và tạo âm thanh bài tập..." 
          : "Đang xử lý và lưu bài tập...";
    const toastId = toast.loading(loadingMessage);

    try {
      // Parallel batch processing: process all pairs simultaneously, and process image upload + audio TTS upload in parallel for each pair
      const updatedPairs = await Promise.all(
        allPairs.map(async (pair) => {
          const [finalImageUrl, finalAudioUrl] = await Promise.all([
            // Task A: Process Custom Image File
            (async () => {
              if (pair.imageFile) {
                const formData = new FormData();
                formData.append("file", pair.imageFile);
                const uploadData = await uploadMedia(formData);
                if (uploadData.success && uploadData.url) {
                  return uploadData.url;
                }
              }
              return pair.imageUrl;
            })(),

            // Task B: Process Audio File or Synthesize Edge TTS Child Voice
            (async () => {
              if (pair.audioFile) {
                const formData = new FormData();
                formData.append("file", pair.audioFile);
                const uploadData = await uploadMedia(formData);
                if (uploadData.success && uploadData.url) {
                  return uploadData.url;
                }
              } else if (audioMode === "AUTO_TTS" && pair.word.trim()) {
                try {
                  const edgeRes = await fetch("/api/tts/edge", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: pair.word.trim(), voice: "en-US-AnaNeural", forceEdge: true }),
                  });

                  if (edgeRes.ok) {
                    const audioBlob = await edgeRes.blob();
                    if (audioBlob && audioBlob.size > 0) {
                      const audioFile = new File([audioBlob], `tts-${pair.word.trim()}-${Date.now()}.mp3`, { type: "audio/mpeg" });
                      const formData = new FormData();
                      formData.append("file", audioFile);
                      const uploadData = await uploadMedia(formData);
                      if (uploadData.success && uploadData.url) {
                        return uploadData.url;
                      }
                    }
                  }
                } catch (err) {
                  console.warn("TTS synthesis & R2 upload error:", err);
                }
              }
              return pair.audioUrl;
            })(),
          ]);

          return {
            word: pair.word.trim(),
            imageUrl: finalImageUrl,
            audioUrl: finalAudioUrl,
          };
        })
      );

      const res = await saveMatchImageTextGameAction({
        title: title.trim(),
        subject,
        gradeLevel,
        description,
        pairs: updatedPairs,
      });

      toast.dismiss(toastId);

      if (!res.success) {
        setValidationModalMessage(res.error || "Không thể lưu bài tập!");
        return;
      }

      toast.success("Lưu bài tập Nối Cặp thành công vào Cơ sở dữ liệu!", { position: "top-center" });
      router.push("/teacher");
    } catch (error: any) {
      toast.dismiss(toastId);
      setValidationModalMessage(error.message || "Đã xảy ra lỗi khi lưu bài tập!");
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
          <button 
            type="button"
            onClick={handleBackClick}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 transition-all hover:scale-105 shrink-0 cursor-pointer"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
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
      </div>

      {/* Main Settings Card */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-primary/10 p-6 md:p-8 shadow-sm space-y-4">
        <h2 className="font-headline font-black text-lg text-slate-800 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>1. Thông tin bài tập</span>
        </h2>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Tên bài tập / Game <span className="text-rose-500">*</span></span>
            {titleError && (
              <span className="text-xs font-bold text-rose-500 flex items-center gap-1 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" /> Bắt buộc nhập tên bài tập
              </span>
            )}
          </label>
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={e => {
              setTitle(e.target.value);
              if (titleError && e.target.value.trim()) setTitleError(false);
            }}
            placeholder="Nhập tên bài tập (VD: Bài tập Nối Cặp Ảnh - Chữ)..."
            className={`w-full px-4 py-3 text-sm font-bold rounded-2xl outline-none transition-all ${
              titleError
                ? "bg-rose-50/60 dark:bg-rose-950/30 border-2 border-rose-500 text-rose-900 dark:text-rose-200 placeholder:text-rose-300 ring-4 ring-rose-500/15"
                : "bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary"
            }`}
          />
          {titleError && (
            <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5 pt-1 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Vui lòng nhập Tên bài tập / Game trước khi lưu!</span>
            </p>
          )}
        </div>
      </div>

      {/* Pairs Editor Section */}
      <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-primary/10 p-6 md:p-8 shadow-sm space-y-3.5">
        {/* Editor Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
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
                onClick={() => setAudioMode("AUTO_TTS")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  audioMode === "AUTO_TTS" 
                    ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm" 
                    : "text-slate-400 hover:text-slate-700 dark:text-slate-400"
                }`}
                title="Tự động phát âm bằng giọng đọc AI chuẩn Mỹ khi nhấp thẻ"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Hệ thống tự đọc</span>
              </button>

              <button
                type="button"
                onClick={() => setAudioMode("CUSTOM_FILE")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  audioMode === "CUSTOM_FILE" 
                    ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm" 
                    : "text-slate-400 hover:text-slate-700 dark:text-slate-400"
                }`}
                title="Giáo viên tải file thu âm trực tiếp cho từng từ vựng"
              >
                <Volume2 className="w-3.5 h-3.5 text-sky-500" />
                <span>Tải lên Audio</span>
              </button>

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
            </div>

            <button
              onClick={() => setShowPasteModal(true)}
              className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-2xl shadow-md shadow-sky-500/20 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Nhập nhanh nhiều từ</span>
            </button>
          </div>
        </div>

        {/* --- ROUND TABS NAVIGATION BAR --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex items-center gap-2 flex-wrap">
            {rounds.map((round, rIdx) => {
              const isSelected = rIdx === activeRoundIndex;
              const isFull = round.pairs.length >= MAX_PAIRS_PER_ROUND;
              return (
                <div key={round.id} className="flex items-center group">
                  <button
                    type="button"
                    onClick={() => setActiveRoundIndex(rIdx)}
                    className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
                      isSelected
                        ? "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/20 scale-[1.02]"
                        : "bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/80 dark:border-slate-700"
                    }`}
                  >
                    <span>{round.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : isFull
                          ? "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}>
                      {round.pairs.length}/7
                    </span>
                  </button>
                  {rounds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRound(rIdx)}
                      className="ml-1 p-1 text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      title={`Xóa ${round.title}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={handleAddRound}
              className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-dashed border-sky-300 dark:border-sky-800 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Vòng Mới</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
            <Layers className="w-4 h-4 text-sky-500" />
            <span>Tổng cộng: <strong className="text-sky-600 dark:text-sky-400 font-black">{rounds.reduce((sum, r) => sum + r.pairs.length, 0)} thẻ</strong> ({rounds.length} Vòng)</span>
          </div>
        </div>

        {/* Teacher Guidance Note Banner */}
        <div className="py-2 px-3.5 bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/80 rounded-2xl flex items-start sm:items-center gap-2 text-[11px] md:text-xs text-sky-900 dark:text-sky-200 font-medium">
          <Info className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5 sm:mt-0" />
          <span>
            <strong>💡 Hướng dẫn phân bổ Vòng chơi:</strong> Mỗi Vòng chứa <strong>tối đa 7 cặp thẻ</strong> để Học sinh nối trực quan không bị rối mắt. Khi Học sinh nối hết toàn bộ thẻ của Vòng 1, game sẽ tự động chuyển tiếp sang Vòng 2!
          </span>
        </div>

        {/* Cards Grid for Currently Selected Active Round */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {pairs.map((pair, index) => {
            const isDragOver = dragActivePairId === pair.id;

            return (
              <div
                key={pair.id}
                onDragOver={e => handleDragOver(e, pair.id)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDropImage(e, pair.id)}
                className={`group relative bg-white dark:bg-slate-800 rounded-3xl border-2 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col p-4 space-y-3 ${
                  isDragOver 
                    ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 scale-105" 
                    : pair.imageUrl 
                      ? "border-slate-200/80 dark:border-slate-700" 
                      : "border-slate-200 dark:border-slate-700 hover:border-sky-400"
                }`}
              >
                {/* Number Badge & Delete Action */}
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-full bg-sky-500 text-white font-black text-xs flex items-center justify-center shadow-md shadow-sky-500/20">
                    {index + 1}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemovePair(pair.id)}
                    className="w-7 h-7 rounded-full hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-400 flex items-center justify-center transition-all cursor-pointer"
                    title="Xóa cặp thẻ này"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2]" />
                  </button>
                </div>

                {/* Image Upload / Drop Display Box */}
                <div className="relative aspect-square w-full rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700/80 overflow-hidden flex flex-col items-center justify-center group/img transition-all">
                  {pair.imageUrl ? (
                    <>
                      <img 
                        src={pair.imageUrl} 
                        alt={pair.word || "Card Image"} 
                        className="w-full h-full object-contain p-2 group-hover/img:scale-105 transition-transform duration-300"
                      />
                      {/* Image Action Overlay */}
                      <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-[2px] flex items-center justify-center gap-2 p-2">
                        <button
                          type="button"
                          onClick={() => handleOpenImageSearch(pair)}
                          className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Đổi ảnh</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(pair.id)}
                          className="w-8 h-8 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-3 space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center border border-purple-200/50">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Chưa chọn ảnh
                      </span>

                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenImageSearch(pair)}
                          className="px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-white font-bold text-[11px] rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Search className="w-3 h-3" />
                          <span>Tìm ảnh</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenImageUpload(pair.id)}
                          className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Tải file</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Word Input */}
                <div className="space-y-1">
                  <input
                    type="text"
                    value={pair.word}
                    onChange={e => handleUpdateWord(pair.id, e.target.value)}
                    placeholder="Nhập Chữ/Từ..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-center focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                  />
                </div>

                {/* Optional Custom Audio Controls */}
                {audioMode === "CUSTOM_FILE" && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span className="truncate max-w-[100px]">
                      {pair.audioFileName || (pair.audioUrl ? "Audio đã có" : "Chưa có audio")}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenAudioUpload(pair.id)}
                      className="px-2 py-1 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 hover:bg-sky-100 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{pair.audioUrl ? "Đổi" : "Tải MP3"}</span>
                    </button>
                  </div>
                )}

                {/* Optional Test TTS Button */}
                {audioMode === "AUTO_TTS" && (
                  <div className="pt-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleTestTTS(pair)}
                      className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 text-[10px] font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className={`w-3 h-3 ${playingTTSPairId === pair.id ? "animate-bounce text-purple-600" : ""}`} />
                      <span>{playingTTSPairId === pair.id ? "Đang đọc..." : "Nghe thử đọc"}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add New Pair Card inside current active round */}
          <div
            onClick={handleAddPair}
            className={`min-h-[200px] rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center p-4 cursor-pointer group shadow-sm ${
              pairs.length >= MAX_PAIRS_PER_ROUND
                ? "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 opacity-60"
                : "border-sky-300 hover:border-sky-500 bg-sky-50/40 hover:bg-sky-50 dark:bg-slate-900/40 dark:hover:bg-slate-900 hover:-translate-y-1 hover:shadow-md"
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-md shadow-sky-500/30">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>
            <span className="font-headline font-black text-xs text-slate-800 dark:text-white">
              Thêm 1 cặp
            </span>
            <span className="text-[11px] font-bold text-slate-400 mt-0.5">
              {pairs.length >= MAX_PAIRS_PER_ROUND 
                ? `Đã đủ ${MAX_PAIRS_PER_ROUND}/7 cặp cho ${currentRound.title}`
                : `Tạo cặp thứ ${pairs.length + 1} cho ${currentRound.title}`}
            </span>
          </div>
        </div>

        {/* Sticky Floating Save Action Button inside Card */}
        <div className="sticky bottom-6 flex justify-end z-[40] pointer-events-none pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="pointer-events-auto px-6 py-3 sm:px-7 sm:py-3.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-900 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-full shadow-xl shadow-blue-900/40 hover:shadow-blue-900/60 border border-white/30 backdrop-blur-md transition-all duration-300 flex items-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group hover:scale-105"
            title="Lưu bài tập"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5 group-hover:scale-110 transition-transform stroke-[2.5]" />
            )}
            <span>{isSaving ? "Đang lưu..." : "Lưu bài tập"}</span>
          </button>
        </div>
      </div>

      {/* --- BULK PASTE MODAL --- */}
      {showPasteModal && (() => {
        const parsedWords = pasteContent
          .split(/[\n,]+/)
          .map(w => w.trim())
          .filter(w => w.length > 0);
        const isOverLimit = parsedWords.length > MAX_BULK_WORDS;
        const autoRoundsCount = Math.ceil(parsedWords.length / MAX_PAIRS_PER_ROUND);

        return (
          <div className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-primary/10 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-headline font-black text-lg text-slate-800 dark:text-white">
                      Nhập nhanh nhiều từ vựng
                    </h3>
                    <p className="text-xs font-medium text-slate-400">
                      Tối đa 50 từ. Hệ thống tự động chia thành các Vòng chơi (Mỗi vòng 7 từ).
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

              {/* Info badge when words exist */}
              {parsedWords.length > 0 && !isOverLimit && (
                <div className="p-3.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-center gap-2.5 text-sky-900 dark:text-sky-300 text-xs font-bold">
                  <Sparkles className="w-4 h-4 shrink-0 text-sky-600" />
                  <span>Tự động tạo <strong>{autoRoundsCount} Vòng chơi</strong> cho {parsedWords.length} từ vựng vừa nhập.</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Nhập/dán danh sách từ vựng vào đây (ngăn cách bởi dấu phẩy hoặc xuống dòng):
                </label>
                <textarea
                  rows={6}
                  value={pasteContent}
                  onChange={e => setPasteContent(e.target.value)}
                  placeholder={`Elephant, Tiger, Monkey, Dog, Cat, Fish, Lion, Bear, Pig, Cow, Duck, Frog, Sheep, Rabbit, Zebra, Panda...`}
                  className={`w-full p-4 bg-slate-50 dark:bg-slate-800/80 border rounded-2xl text-sm font-bold focus:ring-4 outline-none transition-all resize-none ${
                    isOverLimit 
                      ? "border-rose-400 focus:ring-rose-500/10 focus:border-rose-500" 
                      : "border-slate-200 dark:border-slate-700 focus:ring-sky-500/10 focus:border-sky-500"
                  }`}
                />

                {/* Real-time word count & limit warning */}
                <div className="flex items-center justify-between text-xs font-bold pt-1">
                  <span className="text-slate-500">
                    Số từ nhận diện:{" "}
                    <span className={isOverLimit ? "text-rose-600 font-black text-sm" : "text-sky-600 font-black"}>
                      {parsedWords.length} / {MAX_BULK_WORDS} từ
                    </span>
                  </span>
                  {isOverLimit && (
                    <span className="text-rose-600 text-[11px] font-extrabold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Vượt quá tối đa 50 từ!
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
                  className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs rounded-2xl shadow-lg shadow-sky-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Tạo danh sách các Vòng chơi
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- IMAGE SEARCH DRAWER / MODAL --- */}
      {showSearchModal && (
        <div className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full h-[85vh] p-6 md:p-8 shadow-2xl border border-primary/10 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline font-black text-lg text-slate-800 dark:text-white">
                    Tìm kiếm ảnh minh họa
                  </h3>
                  <p className="text-xs font-medium text-slate-400">
                    Kho hình ảnh chuẩn từ vựng Tiếng Anh cho Học sinh
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSearchModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Style Selector */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setImageSearchStyle("CARTOON");
                    executeImageSearch(searchQuery, "CARTOON");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    imageSearchStyle === "CARTOON"
                      ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Hoạt hình Cartoon</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImageSearchStyle("REALISTIC");
                    executeImageSearch(searchQuery, "REALISTIC");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    imageSearchStyle === "REALISTIC"
                      ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Chân thực</span>
                </button>
              </div>

              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && executeImageSearch(searchQuery, imageSearchStyle)}
                  placeholder="Nhập từ khóa tiếng Anh (VD: Dog, Apple, Teacher)..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => executeImageSearch(searchQuery, imageSearchStyle)}
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
      )}

      {/* Validation Error Popup Modal */}
      {validationModalMessage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl border border-rose-200 dark:border-rose-900/50 space-y-5 animate-in zoom-in-95 duration-200 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/10 shrink-0">
              <AlertCircle className="w-7 h-7 stroke-[2.2]" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="font-headline font-black text-lg md:text-xl text-slate-800 dark:text-white">
                Thông báo
              </h3>
              <p className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
                {validationModalMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setValidationModalMessage(null)}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-black text-xs md:text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-headline font-black text-lg text-slate-800 dark:text-white">Cảnh báo rời khỏi trang</h3>
                <p className="text-xs text-slate-400 font-medium">Thay đổi chưa được lưu</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Bạn chưa lưu các thay đổi của bài tập này. Nếu rời khỏi trang bây giờ, toàn bộ thông tin vừa nhập sẽ bị mất.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirmModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl transition-all cursor-pointer"
              >
                Hủy, ở lại trang
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirmModal(false);
                  router.push("/teacher");
                }}
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-2xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
              >
                Rời khỏi trang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
