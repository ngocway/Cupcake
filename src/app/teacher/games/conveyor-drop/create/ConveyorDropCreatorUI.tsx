"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  Info,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { searchImagesAction } from "@/actions/image-search-actions";
import { saveMatchImageTextGameAction, getMatchImageTextGameDetailsAction } from "@/actions/match-image-text-actions";
import { uploadMedia } from "@/actions/upload-actions";
import { uploadImageFast } from "@/lib/direct-upload";

export type AudioMode = "NONE" | "AUTO_TTS" | "CUSTOM_FILE";

export interface CardPair {
  id: string;
  word: string;
  imageUrl?: string;
  imageFileName?: string;
  imageFile?: File;
  isUploadingImage?: boolean;
  audioUrl?: string;
  audioFileName?: string;
  audioFile?: File;
}

export interface GameRound {
  id: string;
  title: string;
  pairs: CardPair[];
}

const MAX_PAIRS_PER_ROUND = 15;
const MAX_ROUNDS = 10;
const MAX_BULK_WORDS = 150;
const MAX_TEXT_WORDS = 5;

function countWords(str: string): number {
  if (!str || !str.trim()) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

const INITIAL_ROUNDS: GameRound[] = [
  {
    id: "round-1",
    title: "Vòng 1",
    pairs: [{ id: "pair-1", word: "" }],
  },
];

export function ConveyorDropCreatorUI() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = searchParams?.get("topicId") || null;

  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [subject, setSubject] = useState("english");
  const [gradeLevel, setGradeLevel] = useState("kids-2-5");
  const [description, setDescription] = useState("");
  const [isLoadingTopic, setIsLoadingTopic] = useState(Boolean(topicId));
  const currentGameMode = "conveyor-drop";
  
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

  // Load existing topic details when in Edit mode (topicId is present)
  useEffect(() => {
    if (!topicId) return;

    async function loadTopicDetails() {
      setIsLoadingTopic(true);
      const res = await getMatchImageTextGameDetailsAction(topicId!);
      if (res.success && res.topic) {
        setTitle(res.topic.title || "");
        if (res.topic.gradeLevel) setGradeLevel(res.topic.gradeLevel);

        const items = res.topic.items || [];
        if (items.length > 0) {
          const roundsMap: Record<number, typeof items> = {};
          items.forEach((item) => {
            const rIdx = item.roundIndex ?? 0;
            if (!roundsMap[rIdx]) roundsMap[rIdx] = [];
            roundsMap[rIdx].push(item);
          });
          const roundIndices = Object.keys(roundsMap).map(Number).sort((a, b) => a - b);
          const loadedRounds: GameRound[] = [];

          roundIndices.forEach((rIdx, i) => {
            const roundItems = roundsMap[rIdx];
            const roundPairs: CardPair[] = roundItems.map((item, idx) => ({
              id: item.id || `pair-loaded-${i}-${idx}`,
              word: item.word || "",
              imageUrl: item.imageUrl || undefined,
              audioUrl: item.audioUrl || undefined,
            }));
            loadedRounds.push({
              id: `round-${i + 1}`,
              title: `Vòng ${i + 1}`,
              pairs: roundPairs,
            });
          });

          setRounds(loadedRounds);
          setActiveRoundIndex(0);

          if (res.topic.audioMode) {
            setAudioMode(res.topic.audioMode as AudioMode);
          }
        }
      } else {
        toast.error(res.error || "Không thể tải thông tin bài tập!");
      }
      setIsLoadingTopic(false);
    }

    loadTopicDetails();
  }, [topicId]);

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
  const [dragSourcePairId, setDragSourcePairId] = useState<string | null>(null);
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
    if (rounds.length >= MAX_ROUNDS) {
      toast.error(`Bài tập tối đa chỉ được tạo ${MAX_ROUNDS} Vòng chơi!`);
      return;
    }
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
    const updated = rounds
      .filter((_, i) => i !== index)
      .map((r, i) => ({
        ...r,
        title: `Vòng ${i + 1}`,
      }));
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

  // Upload & Search Image Handlers
  const handleOpenImageUpload = (pairId: string) => {
    setActivePairIdForUpload(pairId);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
      imageInputRef.current.click();
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePairIdForUpload) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh hợp lệ!");
      return;
    }

    const pairId = activePairIdForUpload;
    const tempUrl = URL.createObjectURL(file);

    setRounds(prev => prev.map((r, rIdx) => rIdx !== activeRoundIndex ? r : {
      ...r,
      pairs: r.pairs.map(p => p.id === pairId ? { ...p, imageUrl: tempUrl, imageFile: file, isUploadingImage: true } : p)
    }));

    try {
      const finalUrl = await uploadImageFast(file);
      setRounds(prev => prev.map((r, rIdx) => rIdx !== activeRoundIndex ? r : {
        ...r,
        pairs: r.pairs.map(p => p.id === pairId ? { ...p, imageUrl: finalUrl, imageFile: undefined, isUploadingImage: false } : p)
      }));
      toast.success("Tải & nén ảnh thành công!");
    } catch (err: any) {
      toast.error(`Tải ảnh thất bại: ${err.message}`);
      setRounds(prev => prev.map((r, rIdx) => rIdx !== activeRoundIndex ? r : {
        ...r,
        pairs: r.pairs.map(p => p.id === pairId ? { ...p, isUploadingImage: false } : p)
      }));
    }
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

  // Drag & Drop Image Handling
  const handleDragOver = (e: React.DragEvent, pairId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragActivePairId(pairId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActivePairId(null);
  };

  const handleDropImage = (e: React.DragEvent, targetPairId: string) => {
    e.preventDefault();
    setDragActivePairId(null);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const objectUrl = URL.createObjectURL(file);
      const updatedRounds = [...rounds];
      updatedRounds[activeRoundIndex] = {
        ...currentRound,
        pairs: pairs.map(p => {
          if (p.id === targetPairId) {
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
      setDragSourcePairId(null);
      return;
    }

    let srcPairId = dragSourcePairId;
    if (!srcPairId) {
      try {
        srcPairId = e.dataTransfer.getData("text/plain");
      } catch (err) {}
    }

    if (srcPairId) {
      if (srcPairId === targetPairId) {
        setDragSourcePairId(null);
        return;
      }

      const srcPair = pairs.find(p => p.id === srcPairId);
      const tgtPair = pairs.find(p => p.id === targetPairId);

      if (!srcPair || !tgtPair) {
        setDragSourcePairId(null);
        return;
      }

      const srcImgData = { url: srcPair.imageUrl, fileName: srcPair.imageFileName, file: srcPair.imageFile };
      const tgtImgData = { url: tgtPair.imageUrl, fileName: tgtPair.imageFileName, file: tgtPair.imageFile };

      const updatedRounds = [...rounds];
      updatedRounds[activeRoundIndex] = {
        ...currentRound,
        pairs: pairs.map(p => {
          if (p.id === srcPairId) {
            return { ...p, imageUrl: tgtImgData.url, imageFileName: tgtImgData.fileName, imageFile: tgtImgData.file };
          }
          if (p.id === targetPairId) {
            return { ...p, imageUrl: srcImgData.url, imageFileName: srcImgData.fileName, imageFile: srcImgData.file };
          }
          return p;
        }),
      };

      setRounds(updatedRounds);
      setDragSourcePairId(null);
      toast.success("Đã di chuyển / tráo đổi vị trí ảnh thành công!");
    }
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
      console.warn("TTS preview failed, falling back to Web Speech API:", err);
      fallbackWebSpeech(pair.word);
    }
  };

  // Bulk Paste Handler
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

    const violatingWords: { word: string; count: number; index: number }[] = [];
    words.forEach((w, idx) => {
      const c = countWords(w);
      if (c > MAX_TEXT_WORDS) {
        violatingWords.push({ word: w, count: c, index: idx + 1 });
      }
    });

    if (violatingWords.length > 0) {
      const details = violatingWords
        .slice(0, 3)
        .map(v => `• Mục #${v.index} ("${v.word.slice(0, 20)}..."): ${v.count} từ`)
        .join("\n");
      toast.error(`Phát hiện ${violatingWords.length} từ vựng/câu vượt quá 5 từ:\n${details}\nVui lòng rút gọn lại các từ/câu này không quá 5 từ!`, { duration: 6000 });
      return;
    }

    const newRounds: GameRound[] = [];
    const totalRounds = Math.min(Math.ceil(words.length / MAX_PAIRS_PER_ROUND), MAX_ROUNDS);

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

    // Verification 1: Minimum 2 pairs per round
    for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
      const r = rounds[rIdx];
      if (r.pairs.length < 2) {
        setActiveRoundIndex(rIdx);
        setValidationModalMessage(`${r.title} phải có ít nhất 2 cặp thẻ để học sinh làm bài. Vui lòng bấm [+ Thêm 1 cặp]!`);
        return;
      }
    }

    // Verification 2: Check missing word or image
    for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
      const r = rounds[rIdx];
      const missingWordIdx = r.pairs.findIndex(p => !p.word.trim());
      if (missingWordIdx !== -1) {
        setActiveRoundIndex(rIdx);
        setValidationModalMessage(`${r.title}, Cặp thẻ thứ #${missingWordIdx + 1} chưa nhập từ vựng. Vui lòng kiểm tra lại!`);
        return;
      }
      const missingImgIdx = r.pairs.findIndex(p => !p.imageUrl);
      if (missingImgIdx !== -1) {
        setActiveRoundIndex(rIdx);
        setValidationModalMessage(`${r.title}, Cặp thẻ thứ #${missingImgIdx + 1} ("${r.pairs[missingImgIdx].word}") chưa chọn hình ảnh. Vui lòng bấm [Tìm ảnh] hoặc [Tải file]!`);
        return;
      }
    }

    // Verification 3: Check word count > 5
    for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
      const r = rounds[rIdx];
      for (let pIdx = 0; pIdx < r.pairs.length; pIdx++) {
        const p = r.pairs[pIdx];
        const count = countWords(p.word);
        if (count > MAX_TEXT_WORDS) {
          setActiveRoundIndex(rIdx);
          setValidationModalMessage(`${r.title}, Cặp thẻ thứ #${pIdx + 1} ("${p.word.slice(0, 20)}...") đang có ${count} từ (vượt quá 5 từ cho game Băng Chuyền Thả Khối). Vui lòng rút gọn!`);
          return;
        }
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
    const allPairs = rounds.flatMap((r, rIdx) => r.pairs.map(p => ({ ...p, roundIndex: rIdx })));
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
      const updatedPairs = await Promise.all(
        allPairs.map(async (pair) => {
          const [finalImageUrl, finalAudioUrl] = await Promise.all([
            (async () => {
              if (pair.imageFile) {
                try {
                  return await uploadImageFast(pair.imageFile);
                } catch (e) {}
              }
              return pair.imageUrl;
            })(),

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
            roundIndex: pair.roundIndex,
            word: pair.word.trim(),
            imageUrl: finalImageUrl,
            audioUrl: finalAudioUrl,
          };
        })
      );

      const res = await saveMatchImageTextGameAction({
        topicId: topicId || undefined,
        title: title.trim(),
        subject,
        gradeLevel,
        description,
        audioMode,
        gameType: "conveyor-drop",
        gameMode: "conveyor-drop",
        pairs: updatedPairs,
      });

      toast.dismiss(toastId);

      if (!res.success) {
        setValidationModalMessage(res.error || "Không thể lưu bài tập!");
        return;
      }

      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("cached_teacher_match_games");
        } catch (e) {}
      }

      toast.success("Lưu bài tập Băng Chuyền Thả Khối thành công vào Cơ sở dữ liệu!", { position: "top-center" });
      router.push("/teacher?tab=my-match-games");
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
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                Băng Chuyền Thả Khối
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {topicId ? "Chỉnh sửa bài tập" : "Thiết kế bài tập"}
              </span>
            </div>
            <h1 className="font-headline font-black text-2xl md:text-3xl text-slate-800 dark:text-white mt-1">
              {topicId 
                ? "Chỉnh sửa Game Băng Chuyền Thả Khối"
                : "Tạo Game Băng Chuyền Thả Khối"}
            </h1>
          </div>
        </div>
      </div>

      {/* Loading Skeleton state when fetching existing topic data */}
      {isLoadingTopic ? (
        <div className="w-full min-h-[420px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-primary/10 p-12 flex flex-col items-center justify-center text-center shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 flex items-center justify-center shadow-inner">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            </div>
            <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="font-headline font-black text-lg text-slate-800 dark:text-slate-100">
              Đang tải dữ liệu bài tập...
            </h3>
            <p className="text-xs text-slate-400 font-medium max-w-sm">
              Hệ thống đang đồng bộ toàn bộ nội dung và danh sách các cặp thẻ từ CSDL
            </p>
          </div>
        </div>
      ) : (
        <>
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
                placeholder="Nhập tên bài tập (VD: Bài tập Băng Chuyền Thả Khối)..."
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
                  2. Danh sách các cặp thẻ Băng Chuyền (Ảnh - Chữ)
                </h2>
              </div>

              {/* Segmented Control for Audio Mode */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setAudioMode("AUTO_TTS")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    audioMode === "AUTO_TTS"
                      ? "bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Hệ thống tự đọc</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAudioMode("CUSTOM_FILE")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    audioMode === "CUSTOM_FILE"
                      ? "bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5 text-sky-500" />
                  <span>Tải lên Audio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAudioMode("NONE")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    audioMode === "NONE"
                      ? "bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span>Không đọc</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowPasteModal(true)}
                className="px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-2xl shadow-md shadow-sky-500/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
              >
                <FileText className="w-4 h-4 stroke-[2]" />
                <span>Nhập nhanh nhiều từ</span>
              </button>
            </div>

            {/* Rounds Tab Strip */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full">
                {rounds.map((r, idx) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveRoundIndex(idx)}
                    className={`group/tab relative px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      activeRoundIndex === idx
                        ? "bg-sky-500 text-white shadow-md shadow-sky-500/30 scale-105"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>{r.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      activeRoundIndex === idx ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                    }`}>
                      {r.pairs.length}/{MAX_PAIRS_PER_ROUND}
                    </span>

                    {rounds.length > 1 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveRound(idx);
                        }}
                        className="w-4 h-4 rounded-full bg-black/10 hover:bg-rose-600 hover:text-white flex items-center justify-center text-[10px] ml-0.5 transition-all cursor-pointer"
                        title={`Xóa ${r.title}`}
                      >
                        <X className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleAddRound}
                  className="px-3 py-2 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-100 rounded-2xl text-xs font-bold border border-cyan-200 dark:border-cyan-800 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Vòng Mới</span>
                </button>
              </div>

              {/* Total Stats Badge */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-400 shrink-0">
                <Layers className="w-4 h-4 text-cyan-500" />
                <span>Tổng cộng: <strong className="text-slate-700 dark:text-slate-200">{rounds.reduce((acc, r) => acc + r.pairs.length, 0)} thẻ</strong> ({rounds.length} Vòng)</span>
              </div>
            </div>

            {/* Instruction Tip Banner */}
            <div className="p-3.5 bg-sky-50/70 dark:bg-sky-950/30 rounded-2xl border border-sky-200/60 dark:border-sky-800/60 flex items-start gap-2.5 text-xs text-sky-800 dark:text-sky-200">
              <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Hướng dẫn phân bổ Vòng chơi:</strong> Mỗi Vòng chứa tối đa <strong>15 cặp thẻ</strong> để Học sinh thả trực quan không bị rối mắt. Khi Học sinh hoàn thành hết toàn bộ thẻ của Vòng 1, game sẽ tự động chuyển tiếp sang Vòng 2!
              </p>
            </div>

            {/* Card Pairs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
              {pairs.map((pair, index) => (
                <div 
                  key={pair.id}
                  className="group relative bg-white dark:bg-slate-800/90 rounded-2xl border-2 border-slate-200/80 dark:border-slate-700 p-4 space-y-3 shadow-sm hover:border-cyan-300 dark:hover:border-cyan-600 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  {/* Pair Header & Delete */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
                    <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-black text-xs flex items-center justify-center shadow-sm">
                      {index + 1}
                    </span>
                    {pairs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePair(pair.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Xóa cặp thẻ này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Image Slot / Preview Dropzone */}
                  <div 
                    onDragOver={e => handleDragOver(e, pair.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDropImage(e, pair.id)}
                    className={`relative aspect-square rounded-[4px] bg-slate-50 dark:bg-slate-900 border-2 border-dashed overflow-hidden flex items-center justify-center transition-all ${
                      dragActivePairId === pair.id 
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-950/60 scale-[1.02]" 
                        : "border-slate-200/80 dark:border-slate-700"
                    }`}
                  >
                    {pair.imageUrl ? (
                      <div
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData("text/plain", pair.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDragSourcePairId(pair.id);
                        }}
                        onDragEnd={() => {
                          setDragSourcePairId(null);
                          setDragActivePairId(null);
                        }}
                        className="relative w-full h-full group/img cursor-grab active:cursor-grabbing"
                        title="Kéo thả ảnh sang thẻ khác để di chuyển hoặc tráo đổi vị trí"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={pair.imageUrl} 
                          alt={pair.word || "Card image"} 
                          className="w-full h-full object-cover pointer-events-none select-none"
                        />
                        <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenImageSearch(pair)}
                            className="p-2 bg-white/90 hover:bg-white text-slate-800 rounded-xl shadow-lg transition-transform hover:scale-110 cursor-pointer"
                            title="Đổi ảnh khác"
                          >
                            <Search className="w-4 h-4 text-sky-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenImageUpload(pair.id)}
                            className="p-2 bg-white/90 hover:bg-white text-slate-800 rounded-xl shadow-lg transition-transform hover:scale-110 cursor-pointer"
                            title="Tải ảnh khác từ máy"
                          >
                            <Upload className="w-4 h-4 text-cyan-600" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-3 text-center space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-500 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chưa chọn ảnh</span>
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenImageSearch(pair)}
                            className="px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                          >
                            <Search className="w-3 h-3" />
                            <span>Tìm ảnh</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenImageUpload(pair.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
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
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-bold text-slate-400">Từ vựng / Câu</span>
                      <span className={`text-[10px] font-extrabold ${countWords(pair.word) > MAX_TEXT_WORDS ? "text-rose-600" : "text-slate-400"}`}>
                        {countWords(pair.word)}/5 từ
                      </span>
                    </div>
                    <input
                      type="text"
                      value={pair.word}
                      onChange={e => handleUpdateWord(pair.id, e.target.value)}
                      placeholder="Nhập Chữ/Từ..."
                      className={`w-full px-3 py-2 border rounded-xl text-xs font-black text-center focus:ring-2 outline-none transition-all ${
                        countWords(pair.word) > MAX_TEXT_WORDS
                          ? "border-rose-500 bg-rose-50/40 text-rose-900 focus:ring-rose-500/20 focus:border-rose-500"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-cyan-500/20 focus:border-cyan-500"
                      }`}
                    />
                    {countWords(pair.word) > MAX_TEXT_WORDS && (
                      <p className="text-[10px] font-bold text-rose-500 flex items-center justify-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        Vượt quá 5 từ ({countWords(pair.word)}/5 từ). Vui lòng rút gọn!
                      </p>
                    )}
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
                        disabled={!pair.word.trim()}
                        className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 disabled:opacity-30 disabled:no-underline cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Nghe thử đọc</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add New Pair Card in Current Round */}
              <div 
                onClick={handleAddPair}
                className={`group border-2 border-dashed border-sky-300 dark:border-sky-800 hover:border-sky-500 bg-sky-50/40 dark:bg-sky-950/20 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-2 transition-all cursor-pointer min-h-[260px] ${
                  pairs.length >= MAX_PAIRS_PER_ROUND ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 stroke-[3]" />
                </div>
                <span className="font-headline font-black text-sm text-sky-900 dark:text-sky-200">Thêm 1 cặp</span>
                <span className="text-[11px] font-bold text-sky-600/70 dark:text-sky-400/70">
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
        </>
      )}

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
