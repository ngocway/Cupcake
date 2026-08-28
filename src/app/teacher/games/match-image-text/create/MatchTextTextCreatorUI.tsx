"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Plus, 
  Trash2, 
  Upload, 
  Save, 
  ArrowLeft, 
  FileText, 
  Check, 
  X, 
  Volume2, 
  VolumeX, 
  AlertCircle, 
  AlertTriangle, 
  Layers, 
  Loader2, 
  ArrowRightLeft, 
  Sparkles, 
  Type
} from "lucide-react";
import { toast } from "sonner";
import { saveMatchImageTextGameAction, getMatchImageTextGameDetailsAction } from "@/actions/match-image-text-actions";
import { uploadMedia } from "@/actions/upload-actions";

export type AudioMode = "NONE" | "AUTO_TTS" | "CUSTOM_FILE";

export interface TextCardPair {
  id: string;
  wordA: string;
  audioUrlA?: string;
  audioFileNameA?: string;
  audioFileA?: File;

  labelB: string;
  audioUrlB?: string;
  audioFileNameB?: string;
  audioFileB?: File;
}

export interface GameRound {
  id: string;
  title: string;
  pairs: TextCardPair[];
}

const MAX_PAIRS_PER_ROUND = 7;
const MAX_ROUNDS = 10;
const MAX_BULK_WORDS = 70;
const MAX_TEXT_WORDS = 12;

function countWords(str: string): number {
  if (!str || !str.trim()) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

const INITIAL_ROUNDS: GameRound[] = [
  {
    id: "round-1",
    title: "Vòng 1",
    pairs: [{ id: "pair-1", wordA: "", labelB: "" }],
  },
];

export function MatchTextTextCreatorUI() {
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

  // Multi-Round State
  const [rounds, setRounds] = useState<GameRound[]>(INITIAL_ROUNDS);
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);

  const currentRound = rounds[activeRoundIndex] || rounds[0];
  const pairs = currentRound?.pairs || [];

  const [audioMode, setAudioMode] = useState<AudioMode>("NONE");

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

          roundIndices.forEach((rIdx, i) => {
            const roundItems = roundsMap[rIdx];
            const roundPairs: TextCardPair[] = roundItems.map((item, idx) => ({
              id: item.id || `pair-loaded-${i}-${idx}`,
              wordA: item.word || "",
              audioUrlA: item.audioUrl || undefined,
              labelB: item.labelB || "",
              audioUrlB: item.audioBUrl || undefined,
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
  const isDirty = Boolean(title.trim() || rounds.some(r => r.pairs.some(p => p.wordA.trim() || p.labelB.trim())));
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // --- Modal States ---
  const [validationModalMessage, setValidationModalMessage] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [playingTTSPairId, setPlayingTTSPairId] = useState<string | null>(null);

  // Hidden audio file input refs
  const audioInputRefA = useRef<HTMLInputElement>(null);
  const audioInputRefB = useRef<HTMLInputElement>(null);
  const [activeUploadTarget, setActiveUploadTarget] = useState<{ pairId: string; side: "A" | "B" } | null>(null);

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
      pairs: [{ id: `pair-${Date.now()}-0`, wordA: "", labelB: "" }],
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
    const newPair: TextCardPair = {
      id: `pair-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      wordA: "",
      labelB: "",
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
      toast.error("Bài tập cần ít nhất 1 cặp thẻ!");
      return;
    }
    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      pairs: pairs.filter(p => p.id !== id),
    };
    setRounds(updatedRounds);
  };

  const handleSwapPair = (pairId: string) => {
    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      pairs: pairs.map(p => {
        if (p.id === pairId) {
          return {
            ...p,
            wordA: p.labelB,
            labelB: p.wordA,
            audioUrlA: p.audioUrlB,
            audioUrlB: p.audioUrlA,
            audioFileA: p.audioFileB,
            audioFileB: p.audioFileA,
            audioFileNameA: p.audioFileNameB,
            audioFileNameB: p.audioFileNameA,
          };
        }
        return p;
      }),
    };
    setRounds(updatedRounds);
    toast.success("Đã đảo vị trí Vế A ↔ Vế B!");
  };

  const handleUpdatePairText = (id: string, side: "A" | "B", value: string) => {
    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      pairs: pairs.map(p => {
        if (p.id === id) {
          return side === "A" ? { ...p, wordA: value } : { ...p, labelB: value };
        }
        return p;
      }),
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
    toast.success(`Đã chuyển cặp thẻ sang ${targetRound.title}!`, { position: "top-center" });
  };

  // TTS Play Preview Handler
  const handlePlayTTS = async (pairId: string, text: string) => {
    if (!text.trim()) {
      toast.error("Vui lòng nhập văn bản trước khi nghe thử!");
      return;
    }

    setPlayingTTSPairId(pairId);
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.trim());
        utterance.lang = "en-US";
        utterance.rate = 0.85;
        utterance.onend = () => setPlayingTTSPairId(null);
        utterance.onerror = () => setPlayingTTSPairId(null);
        window.speechSynthesis.speak(utterance);
      } else {
        toast.error("Trình duyệt không hỗ trợ đọc âm thanh tự động!");
        setPlayingTTSPairId(null);
      }
    } catch (e) {
      setPlayingTTSPairId(null);
    }
  };

  // Bulk Paste Text Import Handler
  const handleProcessBulkPaste = () => {
    if (!pasteContent.trim()) {
      toast.error("Vui lòng dán danh sách cặp chữ!");
      return;
    }

    const lines = pasteContent.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast.error("Không tìm thấy dòng chữ hợp lệ!");
      return;
    }

    const violatingLines: { lineNum: number; countA: number; countB: number }[] = [];
    lines.forEach((line, idx) => {
      const parts = line.split(/[-:=|\t]/);
      const wordA = parts[0]?.trim() || line;
      const labelB = parts.slice(1).join("-").trim() || "";

      const countA = countWords(wordA);
      const countB = countWords(labelB);
      if (countA > MAX_TEXT_WORDS || countB > MAX_TEXT_WORDS) {
        violatingLines.push({ lineNum: idx + 1, countA, countB });
      }
    });

    if (violatingLines.length > 0) {
      const details = violatingLines
        .slice(0, 3)
        .map(v => `• Dòng ${v.lineNum}: ${v.countA > MAX_TEXT_WORDS ? `Vế A (${v.countA} từ)` : `Vế B (${v.countB} từ)`}`)
        .join("\n");
      toast.error(`Phát hiện ${violatingLines.length} dòng vượt quá 12 từ:\n${details}\nVui lòng rút gọn lại các dòng này!`, { duration: 6000 });
      return;
    }

    const newPairs: TextCardPair[] = [];
    lines.slice(0, MAX_BULK_WORDS).forEach((line, idx) => {
      // Split line by separator: '-', ':', '=', or Tab
      const parts = line.split(/[-:=|\t]/);
      const wordA = parts[0]?.trim() || line;
      const labelB = parts.slice(1).join("-").trim() || "";

      newPairs.push({
        id: `pair-bulk-${Date.now()}-${idx}`,
        wordA,
        labelB,
      });
    });

    // Distribute pairs into rounds (Max 10 rounds)
    const newRounds: GameRound[] = [];
    const totalRounds = Math.min(Math.ceil(newPairs.length / MAX_PAIRS_PER_ROUND), MAX_ROUNDS);

    for (let r = 0; r < totalRounds; r++) {
      const roundPairs = newPairs.slice(r * MAX_PAIRS_PER_ROUND, (r + 1) * MAX_PAIRS_PER_ROUND);
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
    toast.success(`Đã phân tích ${newPairs.length} cặp chữ và tự động tạo ${newRounds.length} Vòng chơi!`);
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
        setValidationModalMessage(`${r.title} phải có ít nhất 2 cặp chữ để học sinh nối. Vui lòng bấm [+ Thêm 1 cặp]!`);
        return;
      }
    }

    // Verification 2: Check missing text in Vế A or Vế B
    for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
      const r = rounds[rIdx];
      const missingWordAIdx = r.pairs.findIndex(p => !p.wordA.trim());
      if (missingWordAIdx !== -1) {
        setActiveRoundIndex(rIdx);
        setValidationModalMessage(`${r.title}, Cặp thẻ thứ #${missingWordAIdx + 1} chưa nhập Văn bản cho Vế A. Vui lòng kiểm tra lại!`);
        return;
      }
      const missingLabelBIdx = r.pairs.findIndex(p => !p.labelB.trim());
      if (missingLabelBIdx !== -1) {
        setActiveRoundIndex(rIdx);
        setValidationModalMessage(`${r.title}, Cặp thẻ thứ #${missingLabelBIdx + 1} chưa nhập Văn bản cho Vế B. Vui lòng kiểm tra lại!`);
        return;
      }
    }

    // Verification 3: Check word count > 12
    for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
      const r = rounds[rIdx];
      for (let pIdx = 0; pIdx < r.pairs.length; pIdx++) {
        const p = r.pairs[pIdx];
        const countA = countWords(p.wordA);
        if (countA > MAX_TEXT_WORDS) {
          setActiveRoundIndex(rIdx);
          setValidationModalMessage(`${r.title}, Cặp thẻ thứ #${pIdx + 1} Vế A đang có ${countA} từ (vượt quá 12 từ). Vui lòng rút gọn!`);
          return;
        }
        const countB = countWords(p.labelB);
        if (countB > MAX_TEXT_WORDS) {
          setActiveRoundIndex(rIdx);
          setValidationModalMessage(`${r.title}, Cặp thẻ thứ #${pIdx + 1} Vế B đang có ${countB} từ (vượt quá 12 từ). Vui lòng rút gọn!`);
          return;
        }
      }
    }

    setIsSaving(true);
    toast.loading("Đang lưu bài tập Nối Cặp Chữ - Chữ...", { id: "save-game-toast" });

    try {
      const allPairsToSave = rounds.flatMap((round, roundIndex) =>
        round.pairs.map((pair) => ({
          roundIndex,
          word: pair.wordA.trim(),
          labelB: pair.labelB.trim(),
          audioUrl: pair.audioUrlA,
          audioBUrl: pair.audioUrlB,
        }))
      );

      const res = await saveMatchImageTextGameAction({
        topicId: topicId || undefined,
        title: title.trim(),
        subject,
        gradeLevel,
        description: description.trim(),
        audioMode,
        gameType: "text-text",
        pairs: allPairsToSave,
      });

      if (res.success) {
        if (typeof window !== "undefined") {
          try {
            sessionStorage.removeItem("cached_teacher_match_games");
          } catch (e) {}
        }
        toast.success("Lưu bài tập Nối Cặp Chữ - Chữ thành công!", { id: "save-game-toast" });
        router.push("/teacher?tab=my-match-games");
      } else {
        toast.error(res.error || "Không thể lưu bài tập!", { id: "save-game-toast" });
        setIsSaving(false);
      }
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Đã xảy ra lỗi khi lưu bài tập!", { id: "save-game-toast" });
      setIsSaving(false);
    }
  };

  if (isLoadingTopic) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Đang tải dữ liệu bài tập Nối Cặp...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackClick}
            className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all shrink-0"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500 text-white text-[11px] font-black uppercase tracking-wider">
                Nối Cặp Chữ - Chữ
              </span>
              <span className="text-xs text-slate-400 font-semibold">• Tạo bài tập ghép từ vựng, nghĩa & định nghĩa</span>
            </div>
            <h1 className="text-xl font-headline font-black text-slate-800 dark:text-white tracking-tight mt-0.5">
              {topicId ? "Chỉnh sửa Game Nối Cặp Chữ - Chữ" : "Tạo mới Game Nối Cặp Chữ - Chữ"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPasteModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-sky-500" />
            <span>Dán danh sách hàng loạt</span>
          </button>
        </div>
      </div>

      {/* Game Title & Settings Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
            Tên bài tập / Tiêu đề game <span className="text-rose-500">*</span>
          </label>
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(false);
            }}
            placeholder="VD: Từ vựng Tiếng Anh ↔ Nghĩa tiếng Việt Bài 1..."
            className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium transition-all ${
              titleError 
                ? "border-rose-500 bg-rose-50/30 focus:ring-rose-500" 
                : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:border-sky-500 focus:bg-white"
            }`}
          />
          {titleError && (
            <p className="text-xs font-semibold text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Vui lòng nhập tên bài tập
            </p>
          )}
        </div>
      </div>

      {/* Multi-Round Tabs & Text Pair Items Grid */}
      <div className="space-y-4">
        {/* Round Header Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {rounds.map((round, idx) => (
              <button
                key={round.id}
                onClick={() => setActiveRoundIndex(idx)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeRoundIndex === idx
                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{round.title}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                  {round.pairs.length} cặp
                </span>
              </button>
            ))}

            <button
              onClick={handleAddRound}
              className="px-3.5 py-2 rounded-2xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border border-sky-200/60 dark:border-sky-800/40"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              <span>Thêm Vòng Mới</span>
            </button>
          </div>

          {rounds.length > 1 && (
            <button
              onClick={() => handleRemoveRound(activeRoundIndex)}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1"
              title="Xóa vòng hiện tại"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa {currentRound.title}</span>
            </button>
          )}
        </div>

        {/* Text Pair Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pairs.map((pair, pIdx) => {
            const countA = countWords(pair.wordA);
            const countB = countWords(pair.labelB);
            const isErrorA = countA > MAX_TEXT_WORDS;
            const isErrorB = countB > MAX_TEXT_WORDS;

            return (
              <div
                key={pair.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:border-sky-300 dark:hover:border-sky-900 flex flex-col justify-between"
              >
                {/* Pair Header Bar */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 text-[11px] flex items-center justify-center font-bold">
                      #{pIdx + 1}
                    </span>
                    Cặp Chữ #{pIdx + 1}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Move Pair to another Round */}
                    {rounds.length > 1 && (
                      <select
                        value={activeRoundIndex}
                        onChange={(e) => handleMovePairToRound(pair.id, Number(e.target.value))}
                        className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold border-none"
                      >
                        {rounds.map((r, rIdx) => (
                          <option key={r.id} value={rIdx}>Chuyển sang {r.title}</option>
                        ))}
                      </select>
                    )}

                    {/* Delete Pair */}
                    <button
                      onClick={() => handleRemovePair(pair.id)}
                      className="w-7 h-7 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-all"
                      title="Xóa cặp thẻ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Dual Text Inputs Layout */}
                <div className="space-y-3">
                  {/* Vế A (Text A) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                        Vế A
                      </label>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold ${isErrorA ? "text-rose-600" : "text-slate-400"}`}>
                          {countA}/12 từ
                        </span>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={pair.wordA}
                      onChange={(e) => handleUpdatePairText(pair.id, "A", e.target.value)}
                      placeholder="VD: Cat / Apple / Beautiful..."
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        isErrorA
                          ? "border-rose-500 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-sky-500 focus:bg-white"
                      }`}
                    />
                    {isErrorA && (
                      <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        Vế A vượt quá 12 từ (Hiện tại: {countA} từ). Vui lòng rút gọn!
                      </p>
                    )}
                  </div>

                  {/* Vế B (Text B / Meaning) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                        Vế B
                      </label>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold ${isErrorB ? "text-rose-600" : "text-slate-400"}`}>
                          {countB}/12 từ
                        </span>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={pair.labelB}
                      onChange={(e) => handleUpdatePairText(pair.id, "B", e.target.value)}
                      placeholder="VD: Con mèo / Quả táo / Xinh đẹp..."
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        isErrorB
                          ? "border-rose-500 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-purple-500 focus:bg-white"
                      }`}
                    />
                    {isErrorB && (
                      <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        Vế B vượt quá 12 từ (Hiện tại: {countB} từ). Vui lòng rút gọn!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Pair Card Cell */}
          <div 
            onClick={handleAddPair}
            className={`group border-2 border-dashed border-sky-300 dark:border-sky-800/80 hover:border-sky-500 bg-sky-50/40 dark:bg-sky-950/20 hover:bg-sky-50/80 dark:hover:bg-sky-950/40 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-2 transition-all cursor-pointer min-h-[180px] shadow-sm ${
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

        {/* Sticky Floating Save Action Button */}
        <div className="sticky bottom-6 flex justify-end z-[40] pointer-events-none pt-2 w-full h-fit">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="pointer-events-auto h-auto min-h-0 w-fit max-w-fit px-6 py-3 sm:px-7 sm:py-3.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-900 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-full shadow-xl shadow-blue-900/40 hover:shadow-blue-900/60 border border-white/30 backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group hover:scale-105"
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

      {/* --- MODAL 1: Bulk Paste Text Modal --- */}
      {showPasteModal && (() => {
        const parsedPairs = pasteContent
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        const autoRoundsCount = Math.min(Math.ceil(parsedPairs.length / MAX_PAIRS_PER_ROUND), MAX_ROUNDS);
        const isOverLimit = parsedPairs.length > MAX_BULK_WORDS;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-500" />
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">Dán danh sách cặp chữ hàng loạt</h3>
                </div>
                <button
                  onClick={() => setShowPasteModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Info badge when pairs exist */}
              {parsedPairs.length > 0 && !isOverLimit && (
                <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-center gap-2.5 text-sky-900 dark:text-sky-300 text-xs font-bold">
                  <Sparkles className="w-4 h-4 shrink-0 text-sky-600" />
                  <span>Tự động tạo <strong>{autoRoundsCount} Vòng chơi</strong> cho {parsedPairs.length} cặp chữ vừa nhập.</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                  💡 <strong>Ghi chú</strong>: Mỗi dòng là 1 cặp (ngăn cách bởi dấu <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sky-600 font-mono">-</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sky-600 font-mono">:</code> hoặc phím <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sky-600 font-mono">Tab</code>):
                </label>
                <textarea
                  rows={7}
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder={"Apple - Quả táo\nBanana - Quả chuối\nCat - Con mèo\nDog - Con chó..."}
                  className={`w-full p-4 rounded-2xl border bg-slate-50/60 dark:bg-slate-800/80 text-xs font-mono focus:outline-none focus:ring-4 transition-all resize-none ${
                    isOverLimit 
                      ? "border-rose-400 focus:ring-rose-500/10 focus:border-rose-500" 
                      : "border-slate-200 dark:border-slate-700 focus:ring-sky-500/10 focus:border-sky-500"
                  }`}
                />

                {/* Real-time pair count & limit warning */}
                <div className="flex items-center justify-between text-xs font-bold pt-1">
                  <span className="text-slate-500">
                    Số cặp nhận diện:{" "}
                    <span className={isOverLimit ? "text-rose-600 font-black text-sm" : "text-sky-600 font-black text-sm"}>
                      {parsedPairs.length} / {MAX_BULK_WORDS} cặp
                    </span>
                  </span>
                  {isOverLimit && (
                    <span className="text-rose-600 text-[11px] font-extrabold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Vượt quá tối đa 70 cặp!
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  onClick={handleProcessBulkPaste}
                  disabled={isOverLimit || parsedPairs.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Phân tích & Tự động tạo Vòng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- MODAL 2: Validation Error Modal --- */}
      {validationModalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-500 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Cần hoàn thiện thông tin bài tập</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {validationModalMessage}
            </p>
            <button
              onClick={() => setValidationModalMessage(null)}
              className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              Đồng ý, tôi sẽ kiểm tra
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Exit Confirmation Modal --- */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-500 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Thoát khỏi trang tạo bài tập?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có dữ liệu chưa lưu. Nếu thoát bây giờ, các cặp chữ vừa soạn sẽ bị mất.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowExitConfirmModal(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all"
              >
                Ở lại tiếp tục
              </button>
              <button
                onClick={() => router.push("/teacher")}
                className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all"
              >
                Thoát không lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
