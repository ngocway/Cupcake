"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Gamepad2,
  Eye,
  Trash2,
  Layers,
  Search,
  Sparkles,
  Check,
  X,
  Edit3,
  Loader2,
  ArrowRight,
  Image as ImageIcon,
  Copy,
  Save,
} from "lucide-react";
import {
  getTeacherLibrarySetsAction,
  renameTeacherLibrarySetAction,
  deleteTeacherLibrarySetAction,
  duplicateTeacherLibrarySetAction,
  updateTeacherLibrarySetAction,
  LibraryCategory,
  LibrarySetItem,
  LibraryQuestionItem,
  LibrarySubType,
} from "@/actions/teacher-library-actions";
import { useTeacherLocale, withLangParam } from "@/i18n/teacher-locale";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

interface CompatibleGameOption {
  id: string;
  titleVi: string;
  titleEn: string;
  badgeVi: string;
  badgeEn: string;
  badgeColor: string;
  descVi: string;
  descEn: string;
  buildHref: (setId: string) => string;
}

function getCompatibleGamesForSubType(subType: LibrarySubType): CompatibleGameOption[] {
  if (subType === "image-text") {
    return [
      {
        id: "match-image-text",
        titleVi: "Nối Cặp Ảnh - Chữ (Thẻ bài)",
        titleEn: "Match Image - Word (Cards)",
        badgeVi: "Nối cặp",
        badgeEn: "Matching",
        badgeColor: "bg-orange-500",
        descVi: "Học sinh lật/chọn ghép thẻ hình ảnh với từ vựng tương ứng.",
        descEn: "Students pair illustration cards with matching words.",
        buildHref: (id) => `/teacher/games/match-image-text/create?type=image-text&gameMode=match&librarySetId=${id}`,
      },
      {
        id: "line-image-text",
        titleVi: "Nối Dây Ảnh - Chữ",
        titleEn: "Line Match Image - Word",
        badgeVi: "Nối dây",
        badgeEn: "Line Match",
        badgeColor: "bg-violet-500",
        descVi: "Học sinh kẻ dây nối từ hình ảnh sang từ vựng tương ứng.",
        descEn: "Students draw lines connecting images to matching words.",
        buildHref: (id) => `/teacher/games/match-image-text/create?type=image-text&gameMode=line&librarySetId=${id}`,
      },
      {
        id: "cut-rope-image-text",
        titleVi: "Cắt Dây Ảnh - Chữ",
        titleEn: "Cut the Rope Image - Word",
        badgeVi: "Cắt dây",
        badgeEn: "Cut Rope",
        badgeColor: "bg-rose-500",
        descVi: "Học sinh chém đứt dây thừng để thả ảnh rơi trúng từ vựng.",
        descEn: "Students slice ropes to drop images onto matching words.",
        buildHref: (id) => `/teacher/games/match-image-text/create?type=image-text&gameMode=cut-rope&librarySetId=${id}`,
      },
      {
        id: "train-vocab",
        titleVi: "Đoàn Tàu Từ Vựng",
        titleEn: "Vocabulary Train",
        badgeVi: "Đoàn tàu",
        badgeEn: "Train",
        badgeColor: "bg-amber-500",
        descVi: "Học sinh kéo thả từ vựng lên đúng toa tàu mang hình ảnh.",
        descEn: "Students load vocabulary cards onto matching train carriages.",
        buildHref: (id) => `/teacher/games/match-image-text/create?type=image-text&gameMode=train&librarySetId=${id}`,
      },
      {
        id: "conveyor-drop",
        titleVi: "Băng Chuyền Thả Khối",
        titleEn: "Conveyor Drop",
        badgeVi: "Băng chuyền",
        badgeEn: "Conveyor",
        badgeColor: "bg-cyan-500",
        descVi: "Học sinh thả khối hình rơi xuống đúng ô trên băng chuyền đang chạy.",
        descEn: "Students drop blocks onto matching slots along a moving conveyor belt.",
        buildHref: (id) => `/teacher/games/conveyor-drop/create?librarySetId=${id}`,
      },
      {
        id: "flip-image-text",
        titleVi: "Lật Ảnh - Chữ (Memory Flip)",
        titleEn: "Flip Image - Word (Memory)",
        badgeVi: "Lật ảnh",
        badgeEn: "Flip Cards",
        badgeColor: "bg-pink-500",
        descVi: "Học sinh lật mở các ô thẻ úp để tìm cặp Hình ảnh và Từ vựng trùng khớp.",
        descEn: "Students flip memory cards to pair illustrations with words.",
        buildHref: (id) => `/teacher/games/flip/create?type=FLIP_IMAGE_TEXT&gameMode=flip-image-text&librarySetId=${id}`,
      },
    ];
  }

  if (subType === "image-image") {
    return [
      {
        id: "match-image-image",
        titleVi: "Nối Cặp Ảnh - Ảnh",
        titleEn: "Match Image - Image",
        badgeVi: "Nối cặp",
        badgeEn: "Matching",
        badgeColor: "bg-emerald-500",
        descVi: "Học sinh ghép 2 hình ảnh giống nhau hoặc liên quan với nhau.",
        descEn: "Students match 2 identical or visually related images.",
        buildHref: (id) => `/teacher/games/match-image-text/create?type=image-image&gameMode=match&librarySetId=${id}`,
      },
      {
        id: "line-image-image",
        titleVi: "Nối Dây Ảnh - Ảnh",
        titleEn: "Line Match Image - Image",
        badgeVi: "Nối dây",
        badgeEn: "Line Match",
        badgeColor: "bg-violet-500",
        descVi: "Học sinh kẻ đường nối giữa 2 hàng hình ảnh tương ứng.",
        descEn: "Students draw lines to connect matching images between rows.",
        buildHref: (id) => `/teacher/games/match-image-text/create?type=image-image&gameMode=line&librarySetId=${id}`,
      },
      {
        id: "conveyor-drop",
        titleVi: "Băng Chuyền Thả Khối",
        titleEn: "Conveyor Belt Drop",
        badgeVi: "Băng chuyền",
        badgeEn: "Conveyor",
        badgeColor: "bg-cyan-500",
        descVi: "Học sinh canh thời gian thả kiện hàng hình ảnh trên băng chuyền xuống ống đích.",
        descEn: "Students drop moving image crates from a conveyor belt into target tubes.",
        buildHref: (id) => `/teacher/games/conveyor-drop/create?librarySetId=${id}`,
      },
      {
        id: "flip-image-image",
        titleVi: "Lật Ảnh - Ảnh (Memory Flip)",
        titleEn: "Flip Image - Image (Memory)",
        badgeVi: "Lật ảnh",
        badgeEn: "Flip Cards",
        badgeColor: "bg-rose-500",
        descVi: "Học sinh lật thẻ rèn trí nhớ để tìm 2 hình ảnh khớp nhau.",
        descEn: "Students flip memory cards to find matching image pairs.",
        buildHref: (id) => `/teacher/games/flip/create?type=FLIP_IMAGE_IMAGE&gameMode=flip-image-image&librarySetId=${id}`,
      },
    ];
  }

  if (subType === "quiz") {
    return [
      {
        id: "candy-quiz",
        titleVi: "Trắc Nghiệm Kẹo Ngọt",
        titleEn: "Candy World Quiz",
        badgeVi: "Kẹo ngọt",
        badgeEn: "Candy World",
        badgeColor: "bg-pink-500",
        descVi: "Trả lời câu hỏi trắc nghiệm 4 đáp án trong thế giới kẹo ngọt rực rỡ.",
        descEn: "Answer 4-option multiple choice questions in a lively Candy World.",
        buildHref: (id) => `/teacher/games/candy-quiz/create?librarySetId=${id}`,
      },
      {
        id: "treasure-hunt",
        titleVi: "Truy Tìm Kho Báu",
        titleEn: "Mystery Treasure Hunt",
        badgeVi: "Kho báu",
        badgeEn: "Treasure",
        badgeColor: "bg-amber-500",
        descVi: "Trả lời câu hỏi trắc nghiệm để lật mở ô bí ẩn trên bản đồ kho báu.",
        descEn: "Answer quiz questions to unlock mystery tiles and find gold chests.",
        buildHref: (id) => `/teacher/games/treasure-hunt/create?librarySetId=${id}`,
      },
      {
        id: "shooter-quiz",
        titleVi: "Bắn Súng Trắc Nghiệm",
        titleEn: "Space Shooter Quiz",
        badgeVi: "Bắn súng",
        badgeEn: "Shooter",
        badgeColor: "bg-cyan-500",
        descVi: "Điều khiển pháo năng lượng bắn vào quả cầu mang đáp án trắc nghiệm đúng.",
        descEn: "Fire neon lasers at energy orbs carrying the correct quiz answer.",
        buildHref: (id) => `/teacher/games/shooter-quiz/create?librarySetId=${id}`,
      },
    ];
  }

  if (subType === "choice") {
    return [
      {
        id: "choice-shooter",
        titleVi: "Bắn Máy Bay Toán Học",
        titleEn: "Math Space Shooter",
        badgeVi: "Bắn súng",
        badgeEn: "Shooter",
        badgeColor: "bg-emerald-500",
        descVi: "Ngắm bắn các quả cầu mang kết quả phép tính đúng trong không gian Sci-Fi.",
        descEn: "Aim and shoot energy orbs carrying the right math answers.",
        buildHref: (id) => `/teacher/games/choice-shooter/create?librarySetId=${id}`,
      },
      {
        id: "choice-egg",
        titleVi: "Đập Trứng Khủng Long",
        titleEn: "Math Egg Smash",
        badgeVi: "Đập trứng",
        badgeEn: "Egg Smash",
        badgeColor: "bg-amber-500",
        descVi: "Đập vỡ những quả trứng mang đáp án đúng để nhận xu và sao.",
        descEn: "Crack open eggs showing the correct math answers to earn coins.",
        buildHref: (id) => `/teacher/games/choice-egg/create?librarySetId=${id}`,
      },
    ];
  }

  return [
    {
      id: "match-text-text",
      titleVi: "Nối Cặp Chữ - Chữ",
      titleEn: "Match Word - Word",
      badgeVi: "Nối chữ",
      badgeEn: "Word Match",
      badgeColor: "bg-sky-500",
      descVi: "Ghép 2 từ vựng hoặc câu tương ứng với nhau.",
      descEn: "Match corresponding words or sentences together.",
      buildHref: (id) => `/teacher/games/match-image-text/create?type=text-text&gameMode=match&librarySetId=${id}`,
    },
  ];
}

function getEditStudioHref(setItem: LibrarySetItem, category: LibraryCategory | "all"): string {
  const returnTab = `lib-${category}`;
  if (setItem.subType === "image-image") {
    return `/teacher/games/match-image-text/create?type=image-image&editLibrarySetId=${setItem.id}&returnTab=${returnTab}`;
  }
  if (setItem.subType === "quiz") {
    return `/teacher/games/candy-quiz/create?editLibrarySetId=${setItem.id}&returnTab=${returnTab}`;
  }
  if (setItem.subType === "choice") {
    return `/teacher/games/choice-shooter/create?editLibrarySetId=${setItem.id}&returnTab=${returnTab}`;
  }
  return `/teacher/games/match-image-text/create?type=${setItem.subType}&editLibrarySetId=${setItem.id}&returnTab=${returnTab}`;
}

export function MyLibraryList({ category }: { category: LibraryCategory | "all" }) {
  const router = useRouter();
  const { locale, isVi, t } = useTeacherLocale();
  const [sets, setSets] = useState<LibrarySetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subTypeFilter, setSubTypeFilter] = useState<string>("all");

  // Modals state
  const [selectedSetForGame, setSelectedSetForGame] = useState<LibrarySetItem | null>(null);
  const [selectedSetForView, setSelectedSetForView] = useState<LibrarySetItem | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingItems, setEditingItems] = useState<LibraryQuestionItem[]>([]);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [redirectModal, setRedirectModal] = useState<{
    title: string;
    subtitle: string;
  } | null>(null);

  const cacheSetForInstantStudioLoad = (setObj: LibrarySetItem) => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(`cached_library_set_${setObj.id}`, JSON.stringify(setObj));
    } catch {}
  };

  const cacheKey = `cached_teacher_library_${category}`;

  const syncCacheAndNotify = (updatedSets: LibrarySetItem[]) => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(updatedSets));
      if (category === "match") {
        const flipCompatible = updatedSets.filter(
          (s) => s.subType === "image-text" || s.subType === "image-image"
        );
        sessionStorage.setItem("cached_teacher_library_flip", JSON.stringify(flipCompatible));
      } else if (category === "flip" && !sessionStorage.getItem("cached_teacher_library_match")) {
        sessionStorage.setItem("cached_teacher_library_match", JSON.stringify(updatedSets));
      }
      window.dispatchEvent(new CustomEvent("teacher-library-updated"));
    } catch {}
  };

  const fetchLibrary = async (isBackground = false) => {
    if (!isBackground && sets.length === 0) setLoading(true);
    const res = await getTeacherLibrarySetsAction(category);
    if (res.success && Array.isArray(res.sets)) {
      setSets(res.sets);
      syncCacheAndNotify(res.sets);
    }
    setLoading(false);
  };

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSets(parsed);
          setLoading(false);
        }
      }
    } catch {}

    fetchLibrary(false);
  }, [category]);

  const handleOpenViewModal = (setItem: LibrarySetItem) => {
    setSelectedSetForView(setItem);
    setEditingName(setItem.name);
    setEditingItems((setItem.items || []).map((it) => ({ ...it })));
  };

  const handleSaveSetChanges = async (): Promise<LibrarySetItem | null> => {
    if (!selectedSetForView) return null;
    const trimmed = editingName.trim();
    if (!trimmed) return null;
    if (editingItems.length === 0) {
      toast.warning(t.library.minOneItemWarning);
      return null;
    }

    setIsSavingChanges(true);
    setIsSavingName(true);
    const res = await updateTeacherLibrarySetAction({
      setId: selectedSetForView.id,
      name: trimmed,
      items: editingItems,
    });
    setIsSavingChanges(false);
    setIsSavingName(false);

    if (res.success && res.set) {
      toast.success(t.library.savedChangesToast);
      const updated = sets.map((s) => (s.id === res.set!.id ? res.set! : s));
      setSets(updated);
      setSelectedSetForView(res.set);
      setEditingName(res.set.name);
      setEditingItems(res.set.items.map((it) => ({ ...it })));
      syncCacheAndNotify(updated);
      return res.set;
    } else {
      toast.error(res.error || "Error");
      return null;
    }
  };

  const handleDuplicate = async (setItem: LibrarySetItem) => {
    trackEvent("teacher_library_action", {
      action: "duplicate_set",
      setId: setItem.id,
      subType: setItem.subType,
    });
    setDuplicatingId(setItem.id);
    const res = await duplicateTeacherLibrarySetAction(setItem.id, t.library.copySuffix);
    setDuplicatingId(null);

    if (res.success && res.set) {
      toast.success(t.library.duplicatedToast.replace("{name}", setItem.name));
      const updated = [res.set, ...sets];
      setSets(updated);
      syncCacheAndNotify(updated);
    } else {
      toast.error(res.error || "Error");
    }
  };

  const handleEditItemWord = (index: number, newWord: string) => {
    setEditingItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, word: newWord } : item))
    );
  };

  const handleEditItemLabelB = (index: number, newLabelB: string) => {
    setEditingItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, labelB: newLabelB } : item))
    );
  };

  const handleRemoveItemInModal = (index: number) => {
    if (editingItems.length <= 1) {
      toast.warning(t.library.minOneItemWarning);
      return;
    }
    setEditingItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleDelete = async (setItem: LibrarySetItem) => {
    if (!confirm(t.library.confirmDelete.replace("{name}", setItem.name))) return;

    setDeletingId(setItem.id);
    const res = await deleteTeacherLibrarySetAction(setItem.id);
    setDeletingId(null);

    if (res.success) {
      toast.success(t.library.deletedToast.replace("{name}", setItem.name));
      const updated = sets.filter((s) => s.id !== setItem.id);
      setSets(updated);
      syncCacheAndNotify(updated);
    } else {
      toast.error(res.error || t.myGames.deleteErrorToast);
    }
  };

  const filteredSets = sets.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSub =
      subTypeFilter === "all" ||
      s.subType === subTypeFilter ||
      (subTypeFilter === "match" &&
        (s.subType === "image-text" || s.subType === "image-image" || s.subType === "text-text"));
    return matchSearch && matchSub;
  });

  const showSubTypeFilter = category === "match" || category === "flip";

  const getSubTypeBadge = (subType: LibrarySubType) => {
    switch (subType) {
      case "image-image":
        return {
          label: t.library.imageImageBadge,
          cls: "bg-emerald-500 text-white shadow-emerald-500/30",
          borderCls: "border-emerald-200/80 dark:border-emerald-800/60 hover:border-emerald-400",
          titleCls: "text-emerald-700 dark:text-emerald-300",
        };
      case "text-text":
        return {
          label: t.library.textTextBadge,
          cls: "bg-sky-500 text-white shadow-sky-500/30",
          borderCls: "border-sky-200/80 dark:border-sky-800/60 hover:border-sky-400",
          titleCls: "text-sky-700 dark:text-sky-300",
        };
      case "quiz":
        return {
          label: t.library.quizBadge,
          cls: "bg-amber-500 text-white shadow-amber-500/30",
          borderCls: "border-amber-200/80 dark:border-amber-800/60 hover:border-amber-400",
          titleCls: "text-amber-700 dark:text-amber-300",
        };
      case "choice":
        return {
          label: t.library.choiceBadge,
          cls: "bg-teal-500 text-white shadow-teal-500/30",
          borderCls: "border-teal-200/80 dark:border-teal-800/60 hover:border-teal-400",
          titleCls: "text-teal-700 dark:text-teal-300",
        };
      default:
        return {
          label: t.library.imageTextBadge,
          cls: "bg-orange-500 text-white shadow-orange-500/30",
          borderCls: "border-orange-200/80 dark:border-orange-800/60 hover:border-orange-400",
          titleCls: "text-orange-700 dark:text-orange-300",
        };
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-primary/10 p-8 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold text-slate-500">{t.library.loading}</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      {/* Top Filter & Compatibility Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.library.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {category === "all" ? (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSubTypeFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  subTypeFilter === "all"
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.library.allSubTypes}
              </button>
              <button
                type="button"
                onClick={() => setSubTypeFilter("match")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  subTypeFilter === "match"
                    ? "bg-sky-500 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.sidebar.libraryMatchTitle}
              </button>
              <button
                type="button"
                onClick={() => setSubTypeFilter("quiz")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  subTypeFilter === "quiz"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.sidebar.libraryQuizTitle}
              </button>
              <button
                type="button"
                onClick={() => setSubTypeFilter("choice")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  subTypeFilter === "choice"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.sidebar.libraryMathTitle}
              </button>
            </div>
          ) : showSubTypeFilter ? (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSubTypeFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  subTypeFilter === "all"
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.library.allSubTypes}
              </button>
              <button
                type="button"
                onClick={() => setSubTypeFilter("image-text")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  subTypeFilter === "image-text"
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.library.imageTextBadge}
              </button>
              <button
                type="button"
                onClick={() => setSubTypeFilter("image-image")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  subTypeFilter === "image-image"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.library.imageImageBadge}
              </button>
            </div>
          ) : null}

          {(category === "match" || category === "flip") && (
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{t.library.compatibleNote}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sets Grid */}
      {filteredSets.length === 0 ? (
        <div className="w-full py-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-primary/10 p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center border border-amber-200/50 shadow-inner">
            <BookOpen className="w-8 h-8 stroke-[1.8]" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="font-headline font-black text-xl text-slate-800 dark:text-white">
              {t.library.emptyTitle}
            </h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              {t.library.emptyDesc}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {filteredSets.map((setItem) => {
            const badge = getSubTypeBadge(setItem.subType);
            const isPairs =
              setItem.subType === "image-text" ||
              setItem.subType === "image-image" ||
              setItem.subType === "text-text";

            return (
              <div
                key={setItem.id}
                className={`rounded-3xl shadow-md hover:shadow-xl backdrop-blur-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group p-4 gap-3.5 bg-white dark:bg-slate-900 border ${badge.borderCls}`}
              >
                {/* Header */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm shrink-0 ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                      {setItem.updatedAt && (
                        <span className="text-[10px] font-semibold text-slate-400 truncate">
                          {format(new Date(setItem.updatedAt), "dd/MM/yyyy")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 shrink-0">
                      <Layers className="w-3.5 h-3.5" />
                      <span>
                        {setItem.totalItems}{" "}
                        {isPairs ? t.common.pairsCount : t.common.questionsCount}
                      </span>
                    </div>
                  </div>

                  <h3
                    className={`font-headline font-black text-base sm:text-lg line-clamp-2 leading-snug ${badge.titleCls}`}
                  >
                    {setItem.name}
                  </h3>
                </div>

                {/* Preview Strip */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {setItem.items.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="h-12 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 shrink-0 p-1 flex items-center justify-center overflow-hidden gap-1"
                      title={item.word}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.word}
                          className="w-10 h-10 object-contain rounded-lg"
                        />
                      ) : (
                        <div className="px-2 max-w-[100px] flex flex-col items-center justify-center">
                          <span className="text-[9px] font-black text-slate-700 dark:text-slate-200 truncate w-full text-center">
                            {item.word}
                          </span>
                        </div>
                      )}
                      {setItem.subType === "image-image" && item.imageBUrl && (
                        <img
                          src={item.imageBUrl}
                          alt="B"
                          className="w-10 h-10 object-contain rounded-lg"
                        />
                      )}
                    </div>
                  ))}
                  {setItem.totalItems > 4 && (
                    <div className="w-8 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                      +{setItem.totalItems - 4}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent("teacher_library_action", {
                        action: "open_create_game_modal",
                        setId: setItem.id,
                        subType: setItem.subType,
                      });
                      setSelectedSetForGame(setItem);
                    }}
                    className="flex-1 h-8 px-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer"
                  >
                    <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{t.library.createGameBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      cacheSetForInstantStudioLoad(setItem);
                      setRedirectModal({
                        title: isVi ? "Đang mở trang chỉnh sửa..." : "Opening question set editor...",
                        subtitle: setItem.name,
                      });
                      trackEvent("teacher_library_action", {
                        action: "edit_set_in_studio",
                        setId: setItem.id,
                        subType: setItem.subType,
                      });
                      router.push(withLangParam(getEditStudioHref(setItem, category), locale));
                    }}
                    className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-sky-500 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center transition-all shrink-0 active:scale-95 cursor-pointer"
                    title={t.library.viewEditBtn}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicate(setItem)}
                    disabled={duplicatingId === setItem.id}
                    className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 text-slate-500 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center transition-all shrink-0 active:scale-95 cursor-pointer disabled:opacity-50"
                    title={t.library.duplicateBtn}
                  >
                    {duplicatingId === setItem.id ? (
                      <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(setItem)}
                    disabled={deletingId === setItem.id}
                    className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 text-slate-400 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center transition-all shrink-0 active:scale-95 cursor-pointer disabled:opacity-50"
                    title={t.library.deleteBtn}
                  >
                    {deletingId === setItem.id ? (
                      <Loader2 className="w-3.5 h-3.5 text-rose-500 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: SELECT COMPATIBLE GAME TO CREATE */}
      {selectedSetForGame && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedSetForGame(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-black uppercase tracking-wider mb-2">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>{selectedSetForGame.name}</span>
                </div>
                <h3 className="font-headline font-black text-xl text-slate-800 dark:text-white">
                  {t.library.selectGameTitle}
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  {t.library.selectGameDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSetForGame(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1">
              {getCompatibleGamesForSubType(selectedSetForGame.subType).map((gameOpt) => (
                <button
                  key={gameOpt.id}
                  type="button"
                  onClick={() => {
                    cacheSetForInstantStudioLoad(selectedSetForGame);
                    const targetUrl = withLangParam(
                      gameOpt.buildHref(selectedSetForGame.id),
                      locale
                    );
                    const pickedName = selectedSetForGame.name;
                    const pickedGameTitle = isVi ? gameOpt.titleVi : gameOpt.titleEn;
                    setSelectedSetForGame(null);
                    setRedirectModal({
                      title: isVi
                        ? `Đang mở ${pickedGameTitle}...`
                        : `Opening ${pickedGameTitle}...`,
                      subtitle: pickedName,
                    });
                    router.push(targetUrl);
                  }}
                  className="text-left p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-400 bg-slate-50/70 hover:bg-emerald-50/40 dark:bg-slate-800/60 dark:border-slate-700 dark:hover:border-emerald-500 transition-all group flex flex-col justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-black text-white uppercase tracking-wider ${gameOpt.badgeColor}`}
                      >
                        {isVi ? gameOpt.badgeVi : gameOpt.badgeEn}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <h4 className="font-headline font-black text-sm text-slate-800 dark:text-white group-hover:text-emerald-700">
                      {isVi ? gameOpt.titleVi : gameOpt.titleEn}
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                      {isVi ? gameOpt.descVi : gameOpt.descEn}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW, RENAME & QUICK EDIT SET DETAILS */}
      {selectedSetForView && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedSetForView(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-headline font-black text-xl text-slate-800 dark:text-white">
                  {t.library.viewSetTitle} ({editingItems.length})
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {t.library.editItemHint}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDuplicate(selectedSetForView)}
                  disabled={duplicatingId === selectedSetForView.id}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  {duplicatingId === selectedSetForView.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{t.library.duplicateBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSetForView(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Rename Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                {t.library.renameLabel}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={handleSaveSetChanges}
                  disabled={isSavingChanges || !editingName.trim()}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  {isSavingChanges ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{t.library.saveChangesBtn}</span>
                </button>
              </div>
            </div>

            {/* Editable Items List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 border-t border-slate-100 dark:border-slate-800 pt-3">
              {editingItems.map((item, idx) => {
                let extraDisplay = "";
                if (selectedSetForView.subType === "quiz" && item.labelB) {
                  try {
                    const parsed = JSON.parse(item.labelB);
                    if (Array.isArray(parsed.options)) {
                      const correctOpt = parsed.options.find((o: any) => o.isCorrect);
                      if (correctOpt) extraDisplay = `✓ ${correctOpt.text}`;
                    }
                  } catch {}
                } else if (selectedSetForView.subType === "choice" && item.labelB) {
                  try {
                    const parsed = JSON.parse(item.labelB);
                    if (parsed.a) extraDisplay = `= ${parsed.a}`;
                  } catch {}
                } else if (selectedSetForView.subType !== "text-text" && item.labelB) {
                  extraDisplay = item.labelB;
                }

                return (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between gap-2.5 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-[11px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.word}
                          className="w-10 h-10 rounded-lg object-contain bg-white border border-slate-200 shrink-0"
                        />
                      )}
                      {selectedSetForView.subType === "image-image" && item.imageBUrl && (
                        <>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <img
                            src={item.imageBUrl}
                            alt="B"
                            className="w-10 h-10 rounded-lg object-contain bg-white border border-slate-200 shrink-0"
                          />
                        </>
                      )}

                      {selectedSetForView.subType !== "image-image" && (
                        <input
                          type="text"
                          value={item.word || ""}
                          onChange={(e) => handleEditItemWord(idx, e.target.value)}
                          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-400"
                        />
                      )}

                      {selectedSetForView.subType === "text-text" && (
                        <>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={item.labelB || ""}
                            onChange={(e) => handleEditItemLabelB(idx, e.target.value)}
                            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-400"
                          />
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {extraDisplay && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-black shrink-0 max-w-[170px] truncate">
                          {extraDisplay}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveItemInModal(idx)}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center transition-all cursor-pointer shrink-0"
                        title={t.library.removeItemTooltip}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleSaveSetChanges}
                disabled={isSavingChanges || !editingName.trim()}
                className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                {isSavingChanges ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{t.library.saveChangesBtn}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const saved = await handleSaveSetChanges();
                  const target = saved || selectedSetForView;
                  setSelectedSetForView(null);
                  setSelectedSetForGame(target);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md whitespace-nowrap cursor-pointer"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>{t.library.createGameBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REDIRECT LOADING POPUP */}
      {redirectModal && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-emerald-200/80 dark:border-slate-700 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="relative w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1.5 -right-1.5 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-headline font-black text-lg text-slate-800 dark:text-white">
                {redirectModal.title}
              </h3>
              <p className="text-xs font-semibold text-slate-400">
                {redirectModal.subtitle}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
