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
  AlertCircle,
  AlertTriangle,
  MoveRight,
  Layers,
  Info,
  Loader2,
  ArrowRightLeft,
  Images,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { searchImagesAction } from "@/actions/image-search-actions";
import { saveMatchImageTextGameAction, getMatchImageTextGameDetailsAction } from "@/actions/match-image-text-actions";
import { uploadMedia } from "@/actions/upload-actions";

export interface ImageCardPair {
  id: string;
  // Image A
  imageAUrl?: string;
  imageAFileName?: string;
  imageAFile?: File;
  labelA?: string;

  // Image B
  imageBUrl?: string;
  imageBFileName?: string;
  imageBFile?: File;
  labelB?: string;
}

export interface GameRound {
  id: string;
  title: string;
  pairs: ImageCardPair[];
}

const MAX_PAIRS_PER_ROUND = 7;
const MAX_ROUNDS = 10;

const INITIAL_ROUNDS: GameRound[] = [
  {
    id: "round-1",
    title: "Vòng 1",
    pairs: [{ id: "pair-1" }],
  },
];

export function MatchImageImageCreatorUI() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = searchParams?.get("topicId") || null;
  const gameMode = searchParams?.get("gameMode") || "match";

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
            const roundPairs: ImageCardPair[] = roundItems.map((item, idx) => ({
              id: item.id || `pair-loaded-${i}-${idx}`,
              imageAUrl: item.imageUrl || undefined,
              labelA: item.word || undefined,
              imageBUrl: item.imageBUrl || undefined,
              labelB: item.labelB || undefined,
            }));
            loadedRounds.push({
              id: `round-${i + 1}`,
              title: `Vòng ${i + 1}`,
              pairs: roundPairs,
            });
          });

          setRounds(loadedRounds);
          setActiveRoundIndex(0);
        }
      } else {
        toast.error(res.error || "Không thể tải thông tin bài tập!");
      }
      setIsLoadingTopic(false);
    }

    loadTopicDetails();
  }, [topicId]);

  // Track unsaved changes
  const isDirty = Boolean(title.trim() || rounds.some(r => r.pairs.some(p => p.imageAUrl || p.imageBUrl || p.labelA || p.labelB)));
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // --- Modal States ---
  const [validationModalMessage, setValidationModalMessage] = useState<string | null>(null);

  // Image Search Modal States
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activeSearchTarget, setActiveSearchTarget] = useState<{ pairId: string; side: "A" | "B" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [imageSearchStyle, setImageSearchStyle] = useState<"CARTOON" | "REALISTIC">("CARTOON");
  const [isSearching, startSearchTransition] = useTransition();

  // Hidden file input refs
  const singleImageInputRef = useRef<HTMLInputElement>(null);
  const bulkImageInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadTarget, setActiveUploadTarget] = useState<{ pairId: string; side: "A" | "B" } | null>(null);
  const [dragActiveTarget, setDragActiveTarget] = useState<{ pairId: string; side: "A" | "B" } | null>(null);
  const [dragSource, setDragSource] = useState<{ pairId: string; side: "A" | "B" } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
      setValidationModalMessage(`Bài tập tối đa chỉ được tạo ${MAX_ROUNDS} Vòng chơi!`);
      return;
    }
    const newRound: GameRound = {
      id: `round-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `Vòng ${rounds.length + 1}`,
      pairs: [{ id: `pair-${Date.now()}-0` }],
    };
    setRounds([...rounds, newRound]);
    setActiveRoundIndex(rounds.length);
    toast.success(`Đã tạo ${newRound.title}!`);
  };

  const handleRemoveRound = (index: number) => {
    if (rounds.length <= 1) {
      setValidationModalMessage("Bài tập cần ít nhất 1 Vòng chơi!");
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
      setValidationModalMessage(`Vòng ${activeRoundIndex + 1} đã đạt tối đa 7 cặp thẻ. Vui lòng bấm [+ Thêm Vòng Mới] để tạo vòng tiếp theo!`);
      return;
    }
    const newPair: ImageCardPair = {
      id: `pair-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
      setValidationModalMessage("Bài tập cần ít nhất 1 cặp thẻ!");
      return;
    }
    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      pairs: pairs.filter(p => p.id !== id),
    };
    setRounds(updatedRounds);
  };

  const handleSwapPairImages = (pairId: string) => {
    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      pairs: pairs.map(p => {
        if (p.id === pairId) {
          return {
            ...p,
            imageAUrl: p.imageBUrl,
            imageAFileName: p.imageBFileName,
            imageAFile: p.imageBFile,
            labelA: p.labelB,

            imageBUrl: p.imageAUrl,
            imageBFileName: p.imageAFileName,
            imageBFile: p.imageAFile,
            labelB: p.labelA,
          };
        }
        return p;
      }),
    };
    setRounds(updatedRounds);
    toast.success("Đã đảo vị trí 2 hình ảnh!");
  };

  const handleUpdateLabel = (id: string, side: "A" | "B", val: string) => {
    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      pairs: pairs.map(p => {
        if (p.id === id) {
          return side === "A" ? { ...p, labelA: val } : { ...p, labelB: val };
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

  // Upload & Search Image Handlers
  const handleOpenImageUpload = (pairId: string, side: "A" | "B") => {
    setActiveUploadTarget({ pairId, side });
    if (singleImageInputRef.current) {
      singleImageInputRef.current.value = "";
      singleImageInputRef.current.click();
    }
  };

  const handleSingleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadTarget) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh hợp lệ!");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const { pairId, side } = activeUploadTarget;

    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      pairs: pairs.map(p => {
        if (p.id === pairId) {
          return side === "A"
            ? { ...p, imageAUrl: objectUrl, imageAFileName: file.name, imageAFile: file }
            : { ...p, imageBUrl: objectUrl, imageBFileName: file.name, imageBFile: file };
        }
        return p;
      }),
    };
    setRounds(updatedRounds);
    toast.success(`Đã tải ảnh vế ${side} lên thành công!`);
  };

  // Bulk Upload Images Handler
  const handleOpenBulkImageUpload = () => {
    if (bulkImageInputRef.current) {
      bulkImageInputRef.current.value = "";
      bulkImageInputRef.current.click();
    }
  };

  const handleBulkImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
    if (files.length === 0) {
      toast.error("Không tìm thấy file hình ảnh hợp lệ!");
      return;
    }

    // Group selected files into pairs of 2
    const newPairs: ImageCardPair[] = [];
    for (let i = 0; i < files.length; i += 2) {
      const fileA = files[i];
      const fileB = files[i + 1];

      newPairs.push({
        id: `pair-bulk-${Date.now()}-${i}`,
        imageAUrl: fileA ? URL.createObjectURL(fileA) : undefined,
        imageAFileName: fileA?.name,
        imageAFile: fileA,
        labelA: fileA ? fileA.name.replace(/\.[^/.]+$/, "") : undefined,

        imageBUrl: fileB ? URL.createObjectURL(fileB) : undefined,
        imageBFileName: fileB?.name,
        imageBFile: fileB,
        labelB: fileB ? fileB.name.replace(/\.[^/.]+$/, "") : undefined,
      });
    }

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
    toast.success(`Đã tải lên ${files.length} ảnh và tự động tạo ${newRounds.length} Vòng chơi!`);
  };

  const handleOpenImageSearch = (pair: ImageCardPair, side: "A" | "B") => {
    setActiveSearchTarget({ pairId: pair.id, side });
    const initialQuery = side === "A" ? pair.labelA || "" : pair.labelB || "";
    setSearchQuery(initialQuery);
    setSearchResults([]);
    setShowSearchModal(true);

    if (initialQuery.trim()) {
      executeImageSearch(initialQuery, imageSearchStyle);
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
    if (!activeSearchTarget) return;
    const { pairId, side } = activeSearchTarget;

    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      pairs: pairs.map(p => {
        if (p.id === pairId) {
          return side === "A"
            ? { ...p, imageAUrl: imageUrl, imageAFile: undefined, imageAFileName: undefined }
            : { ...p, imageBUrl: imageUrl, imageBFile: undefined, imageBFileName: undefined };
        }
        return p;
      }),
    };
    setRounds(updatedRounds);
    setShowSearchModal(false);
    toast.success(`Đã chọn hình ảnh cho vế ${side}!`);
  };

  const handleRemoveImage = (pairId: string, side: "A" | "B") => {
    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      pairs: pairs.map(p => {
        if (p.id === pairId) {
          return side === "A"
            ? { ...p, imageAUrl: undefined, imageAFile: undefined, imageAFileName: undefined }
            : { ...p, imageBUrl: undefined, imageBFile: undefined, imageBFileName: undefined };
        }
        return p;
      }),
    };
    setRounds(updatedRounds);
  };

  // Drag & Drop Image Handling (Supports both External Files & Internal Slot Swapping/Moving)
  const handleDragOver = (e: React.DragEvent, pairId: string, side: "A" | "B") => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragActiveTarget({ pairId, side });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActiveTarget(null);
  };

  const handleDropImage = (e: React.DragEvent, targetPairId: string, targetSide: "A" | "B") => {
    e.preventDefault();
    setDragActiveTarget(null);

    // Case 1: Drop external desktop image file
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const objectUrl = URL.createObjectURL(file);
      const updatedRounds = [...rounds];
      updatedRounds[activeRoundIndex] = {
        ...currentRound,
        pairs: pairs.map(p => {
          if (p.id === targetPairId) {
            return targetSide === "A"
              ? { ...p, imageAUrl: objectUrl, imageAFileName: file.name, imageAFile: file }
              : { ...p, imageBUrl: objectUrl, imageBFileName: file.name, imageBFile: file };
          }
          return p;
        }),
      };
      setRounds(updatedRounds);
      toast.success(`Đã nạp hình ảnh vế ${targetSide} thành công!`);
      setDragSource(null);
      return;
    }

    // Case 2: Drop internal image dragged from another card slot
    let source = dragSource;
    if (!source) {
      try {
        const rawData = e.dataTransfer.getData("text/plain");
        if (rawData) source = JSON.parse(rawData);
      } catch (err) {}
    }

    if (source) {
      if (source.pairId === targetPairId && source.side === targetSide) {
        setDragSource(null);
        return;
      }

      const { pairId: srcPairId, side: srcSide } = source;
      const srcPair = pairs.find(p => p.id === srcPairId);
      const tgtPair = pairs.find(p => p.id === targetPairId);

      if (!srcPair || !tgtPair) {
        setDragSource(null);
        return;
      }

      const srcData = srcSide === "A"
        ? { url: srcPair.imageAUrl, fileName: srcPair.imageAFileName, file: srcPair.imageAFile, label: srcPair.labelA }
        : { url: srcPair.imageBUrl, fileName: srcPair.imageBFileName, file: srcPair.imageBFile, label: srcPair.labelB };

      const tgtData = targetSide === "A"
        ? { url: tgtPair.imageAUrl, fileName: tgtPair.imageAFileName, file: tgtPair.imageAFile, label: tgtPair.labelA }
        : { url: tgtPair.imageBUrl, fileName: tgtPair.imageBFileName, file: tgtPair.imageBFile, label: tgtPair.labelB };

      const updatedRounds = [...rounds];
      updatedRounds[activeRoundIndex] = {
        ...currentRound,
        pairs: pairs.map(p => {
          let updated = { ...p };

          if (p.id === srcPairId) {
            if (srcSide === "A") {
              updated.imageAUrl = tgtData.url;
              updated.imageAFileName = tgtData.fileName;
              updated.imageAFile = tgtData.file;
              updated.labelA = tgtData.label;
            } else {
              updated.imageBUrl = tgtData.url;
              updated.imageBFileName = tgtData.fileName;
              updated.imageBFile = tgtData.file;
              updated.labelB = tgtData.label;
            }
          }

          if (p.id === targetPairId) {
            if (targetSide === "A") {
              updated.imageAUrl = srcData.url;
              updated.imageAFileName = srcData.fileName;
              updated.imageAFile = srcData.file;
              updated.labelA = srcData.label;
            } else {
              updated.imageBUrl = srcData.url;
              updated.imageBFileName = srcData.fileName;
              updated.imageBFile = srcData.file;
              updated.labelB = srcData.label;
            }
          }

          return updated;
        }),
      };

      setRounds(updatedRounds);
      setDragSource(null);
      toast.success("Đã di chuyển / tráo đổi vị trí ảnh thành công!");
    }
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

    // Verification 1: Check minimum 2 pairs per round
    for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
      const r = rounds[rIdx];
      if (r.pairs.length < 2) {
        setActiveRoundIndex(rIdx);
        setValidationModalMessage(`${r.title} phải có ít nhất 2 cặp ảnh để học sinh nối. Vui lòng bấm [+ Thêm 1 cặp]!`);
        return;
      }
    }

    // Verification 2: Check missing Image A or Image B in rounds
    for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
      const r = rounds[rIdx];
      const missingImgAIdx = r.pairs.findIndex(p => !p.imageAUrl);
      if (missingImgAIdx !== -1) {
        setActiveRoundIndex(rIdx);
        setValidationModalMessage(`${r.title}, Cặp thẻ thứ #${missingImgAIdx + 1} chưa chọn Hình ảnh cho Thẻ A. Vui lòng chọn ảnh trước khi lưu!`);
        return;
      }
      const missingImgBIdx = r.pairs.findIndex(p => !p.imageBUrl);
      if (missingImgBIdx !== -1) {
        setActiveRoundIndex(rIdx);
        setValidationModalMessage(`${r.title}, Cặp thẻ thứ #${missingImgBIdx + 1} chưa chọn Hình ảnh cho Thẻ B. Vui lòng chọn ảnh trước khi lưu!`);
        return;
      }
    }

    setIsSaving(true);
    toast.loading("Đang lưu bài tập Nối Cặp Ảnh - Ảnh...", { id: "save-game-toast" });

    try {
      // Upload all local image files across rounds concurrently in parallel
      const allPairsToSave = await Promise.all(
        rounds.flatMap((round, roundIndex) => round.pairs.map((pair) => ({ pair, roundIndex }))).map(async ({ pair, roundIndex }) => {
          const [finalImageAUrl, finalImageBUrl] = await Promise.all([
            // Task A: Process Image A file
            (async () => {
              if (pair.imageAFile) {
                const formDataA = new FormData();
                formDataA.append("file", pair.imageAFile);
                const uploadResA = await uploadMedia(formDataA);
                if (uploadResA.url) {
                  return uploadResA.url;
                } else {
                  throw new Error(`Không thể tải ảnh vế A cho cặp thẻ "${pair.labelA || 'ảnh'}"!`);
                }
              }
              return pair.imageAUrl;
            })(),

            // Task B: Process Image B file
            (async () => {
              if (pair.imageBFile) {
                const formDataB = new FormData();
                formDataB.append("file", pair.imageBFile);
                const uploadResB = await uploadMedia(formDataB);
                if (uploadResB.url) {
                  return uploadResB.url;
                } else {
                  throw new Error(`Không thể tải ảnh vế B cho cặp thẻ "${pair.labelB || 'ảnh'}"!`);
                }
              }
              return pair.imageBUrl;
            })(),
          ]);

          return {
            roundIndex,
            word: pair.labelA || "Image A",
            imageUrl: finalImageAUrl,
            imageBUrl: finalImageBUrl,
            labelB: pair.labelB || "Image B",
          };
        })
      );

      const res = await saveMatchImageTextGameAction({
        topicId: topicId || undefined,
        title: title.trim(),
        subject,
        gradeLevel,
        description: description.trim(),
        gameType: "image-image",
        gameMode,
        pairs: allPairsToSave,
      });

      if (res.success) {
        if (typeof window !== "undefined") {
          try {
            sessionStorage.removeItem("cached_teacher_match_games");
          } catch (e) {}
        }
        toast.success("Lưu bài tập Nối Cặp Ảnh - Ảnh thành công!", { id: "save-game-toast" });
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
      {/* Hidden File Inputs */}
      <input
        ref={singleImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSingleImageFileChange}
      />
      <input
        ref={bulkImageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleBulkImageFileChange}
      />

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
                Nối Cặp Ảnh - Ảnh
              </span>
              <span className="text-xs text-slate-400 font-semibold">• Tạo bài tập ghép 2 hình ảnh</span>
            </div>
            <h1 className="text-xl font-headline font-black text-slate-800 dark:text-white tracking-tight mt-0.5">
              {topicId ? "Chỉnh sửa Game Nối Cặp Ảnh - Ảnh" : "Tạo mới Game Nối Cặp Ảnh - Ảnh"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenBulkImageUpload}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2"
          >
            <Images className="w-4 h-4 text-sky-500" />
            <span>Tải bộ ảnh hàng loạt</span>
          </button>
        </div>
      </div>

      {/* Game Title Input Card (Single Column Layout) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
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
          placeholder="VD: Nhận biết động vật & bóng tương ứng..."
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

      {/* Main Single Column Content: Multi-Round Tabs & Pair Items */}
      <div className="space-y-4">
          {/* Round Header Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
            {/* Rounds Tab Navigation */}
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

          {/* Pair Items 3-Column Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pairs.map((pair, pIdx) => {
              const isDragA = dragActiveTarget?.pairId === pair.id && dragActiveTarget?.side === "A";
              const isDragB = dragActiveTarget?.pairId === pair.id && dragActiveTarget?.side === "B";

              return (
                <div
                  key={pair.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:border-sky-200 dark:hover:border-sky-900 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 text-[11px] flex items-center justify-center font-bold">
                        #{pIdx + 1}
                      </span>
                      Cặp Ảnh #{pIdx + 1}
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

                  {/* Pair Dual Card Layout */}
                  <div className="grid grid-cols-2 gap-3 items-stretch">
                    {/* --- Side A Card --- */}
                    <div className="space-y-1.5 flex flex-col justify-between">
                      {pair.imageAUrl && (
                        <div className="flex items-center justify-end px-0.5">
                          <button
                            onClick={() => handleRemoveImage(pair.id, "A")}
                            className="text-[10px] font-bold text-rose-500 hover:underline"
                          >
                            Xóa
                          </button>
                        </div>
                      )}

                      {/* Image Preview Box for A (Square 1:1) */}
                      <div
                        onDragOver={(e) => handleDragOver(e, pair.id, "A")}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDropImage(e, pair.id, "A")}
                        className={`relative aspect-square w-full rounded-[4px] border-2 border-dashed overflow-hidden flex flex-col items-center justify-center transition-all ${
                          isDragA 
                            ? "border-sky-500 bg-sky-50/80 scale-[1.01]" 
                            : pair.imageAUrl 
                              ? "border-sky-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" 
                              : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900"
                        }`}
                      >
                        {pair.imageAUrl ? (
                          <div 
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", JSON.stringify({ pairId: pair.id, side: "A" }));
                              e.dataTransfer.effectAllowed = "move";
                              setDragSource({ pairId: pair.id, side: "A" });
                            }}
                            onDragEnd={() => {
                              setDragSource(null);
                              setDragActiveTarget(null);
                            }}
                            className="relative w-full h-full group cursor-grab active:cursor-grabbing"
                            title="Kéo thả sang ô khác để di chuyển hoặc tráo đổi vị trí ảnh"
                          >
                            <img
                              src={pair.imageAUrl}
                              alt="Vế A"
                              className="w-full h-full object-contain p-1.5 pointer-events-none select-none"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 backdrop-blur-[2px]">
                              <button
                                onClick={() => handleOpenImageUpload(pair.id, "A")}
                                className="w-full py-1 rounded-lg bg-white text-slate-800 text-[10px] font-bold shadow-md hover:bg-slate-100"
                              >
                                Tải file mới
                              </button>
                              <button
                                onClick={() => handleOpenImageSearch(pair, "A")}
                                className="w-full py-1 rounded-lg bg-sky-500 text-white text-[10px] font-bold shadow-md hover:bg-sky-600"
                              >
                                Tìm kiếm
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 text-center space-y-1.5">
                            <div className="w-8 h-8 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-500 mx-auto flex items-center justify-center">
                              <Upload className="w-4 h-4" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">
                              Chọn ảnh Vế A
                            </p>
                            <div className="flex items-center justify-center gap-1 pt-0.5">
                              <button
                                onClick={() => handleOpenImageUpload(pair.id, "A")}
                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[10px] font-bold transition-all flex items-center gap-0.5"
                              >
                                <Upload className="w-3 h-3" /> Tải file
                              </button>
                              <button
                                onClick={() => handleOpenImageSearch(pair, "A")}
                                className="px-2 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-bold transition-all flex items-center gap-0.5 shadow-sm"
                              >
                                <Search className="w-3 h-3" /> Tìm ảnh
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* --- Side B Card --- */}
                    <div className="space-y-1.5 flex flex-col justify-between">
                      {pair.imageBUrl && (
                        <div className="flex items-center justify-end px-0.5">
                          <button
                            onClick={() => handleRemoveImage(pair.id, "B")}
                            className="text-[10px] font-bold text-rose-500 hover:underline"
                          >
                            Xóa
                          </button>
                        </div>
                      )}

                      {/* Image Preview Box for B (Square 1:1) */}
                      <div
                        onDragOver={(e) => handleDragOver(e, pair.id, "B")}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDropImage(e, pair.id, "B")}
                        className={`relative aspect-square w-full rounded-[4px] border-2 border-dashed overflow-hidden flex flex-col items-center justify-center transition-all ${
                          isDragB 
                            ? "border-purple-500 bg-purple-50/80 scale-[1.01]" 
                            : pair.imageBUrl 
                              ? "border-purple-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" 
                              : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900"
                        }`}
                      >
                        {pair.imageBUrl ? (
                          <div 
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", JSON.stringify({ pairId: pair.id, side: "B" }));
                              e.dataTransfer.effectAllowed = "move";
                              setDragSource({ pairId: pair.id, side: "B" });
                            }}
                            onDragEnd={() => {
                              setDragSource(null);
                              setDragActiveTarget(null);
                            }}
                            className="relative w-full h-full group cursor-grab active:cursor-grabbing"
                            title="Kéo thả sang ô khác để di chuyển hoặc tráo đổi vị trí ảnh"
                          >
                            <img
                              src={pair.imageBUrl}
                              alt="Vế B"
                              className="w-full h-full object-contain p-1.5 pointer-events-none select-none"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 backdrop-blur-[2px]">
                              <button
                                onClick={() => handleOpenImageUpload(pair.id, "B")}
                                className="w-full py-1 rounded-lg bg-white text-slate-800 text-[10px] font-bold shadow-md hover:bg-slate-100"
                              >
                                Tải file mới
                              </button>
                              <button
                                onClick={() => handleOpenImageSearch(pair, "B")}
                                className="w-full py-1 rounded-lg bg-purple-500 text-white text-[10px] font-bold shadow-md hover:bg-purple-600"
                              >
                                Tìm kiếm
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 text-center space-y-1.5">
                            <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-500 mx-auto flex items-center justify-center">
                              <Upload className="w-4 h-4" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">
                              Chọn ảnh Vế B
                            </p>
                            <div className="flex items-center justify-center gap-1 pt-0.5">
                              <button
                                onClick={() => handleOpenImageUpload(pair.id, "B")}
                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[10px] font-bold transition-all flex items-center gap-0.5"
                              >
                                <Upload className="w-3 h-3" /> Tải file
                              </button>
                              <button
                                onClick={() => handleOpenImageSearch(pair, "B")}
                                className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold transition-all flex items-center gap-0.5 shadow-sm"
                              >
                                <Search className="w-3 h-3" /> Tìm ảnh
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add New Pair Card Cell inside 2-Column Grid */}
            <div 
              onClick={handleAddPair}
              className={`group border-2 border-dashed border-sky-300 dark:border-sky-800/80 hover:border-sky-500 bg-sky-50/40 dark:bg-sky-950/20 hover:bg-sky-50/80 dark:hover:bg-sky-950/40 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-2 transition-all cursor-pointer min-h-[220px] shadow-sm ${
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

      {/* --- MODAL 1: Search Image Modal --- */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-500" />
                <h3 className="font-bold text-slate-800 dark:text-white text-base">
                  Tìm kiếm hình ảnh cho Vế {activeSearchTarget?.side}
                </h3>
              </div>
              <button
                onClick={() => setShowSearchModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && executeImageSearch(searchQuery, imageSearchStyle)}
                  placeholder="Nhập từ khóa tìm kiếm tiếng Anh (VD: cat, dog, apple)..."
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 text-xs font-semibold focus:border-sky-500"
                />
                <button
                  onClick={() => executeImageSearch(searchQuery, imageSearchStyle)}
                  disabled={isSearching}
                  className="px-5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Tìm</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Phong cách ảnh:</span>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      setImageSearchStyle("CARTOON");
                      if (searchQuery) executeImageSearch(searchQuery, "CARTOON");
                    }}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      imageSearchStyle === "CARTOON" ? "bg-white dark:bg-slate-700 text-sky-600 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Hoạt hình (Cartoon)
                  </button>
                  <button
                    onClick={() => {
                      setImageSearchStyle("REALISTIC");
                      if (searchQuery) executeImageSearch(searchQuery, "REALISTIC");
                    }}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      imageSearchStyle === "REALISTIC" ? "bg-white dark:bg-slate-700 text-sky-600 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Chân thực (Realistic)
                  </button>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="flex-1 overflow-y-auto min-h-[220px] p-2 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 scrollbar-thin">
              {isSearching ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                  <Loader2 className="w-8 h-8 text-sky-500 animate-spin mb-2" />
                  <span className="text-xs font-semibold">Đang tìm kiếm hình ảnh phù hợp...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {searchResults.map((img: any, i: number) => {
                    const url = img.urls?.small || img.src?.medium || img.url;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectSearchImage(url)}
                        className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:scale-105 transition-all shadow-sm bg-slate-900"
                      >
                        <img src={url} alt="Result" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Check className="w-6 h-6 text-white drop-shadow-md" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 text-center">
                  <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">Nhập từ khóa tiếng Anh và nhấn "Tìm" để xem gợi ý ảnh đẹp!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
              Bạn có dữ liệu chưa lưu. Nếu thoát bây giờ, các cặp ảnh vừa soạn sẽ bị mất.
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
