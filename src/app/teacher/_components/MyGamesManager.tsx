"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  FolderOpen,
  LayoutGrid,
  Copy,
  Calculator,
  Layers,
  HelpCircle,
  Lock,
  Play,
  Edit3,
  Trash2,
  Share2,
  Calendar,
  Loader2,
  Sparkles,
  Search,
  X,
  Users,
  User,
  ChevronDown,
} from "lucide-react";

import { useTeacherLocale, withLangParam, TeacherLocaleSwitch } from "@/i18n/teacher-locale";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

import { deleteTeacherMatchGameAction } from "@/actions/teacher-match-games";
import { deleteTeacherChoiceGameAction } from "@/actions/teacher-choice-games";
import { deleteChoiceShooterGame } from "@/lib/choice-shooter-storage";
import { deleteChoiceEggGame } from "@/lib/choice-egg-storage";

import { MatchGameShareModal } from "./MatchGameShareModal";
import { ChoiceGameShareModal } from "./ChoiceGameShareModal";

export type MyGamesSubTab = "all" | "match" | "choice" | "flip" | "quiz" | "fill";

export interface UnifiedGameCardItem {
  id: string;
  code?: string;
  title: string;
  type: "match" | "choice" | "flip" | "quiz";
  createdAt: string;
  count: number;
  countUnit: "pairs" | "questions";
  gameMode?: string;
  gameType?: "shooter" | "egg";
  isImageImage?: boolean;
  isTextText?: boolean;
  playUrl: string;
  editUrl: string;
  shareGamePath?: string;
  items?: Array<{
    id: string;
    word: string;
    imageUrl?: string | null;
    imageBUrl?: string | null;
    labelB?: string | null;
  }>;
  sampleQuestions?: Array<{
    id: string;
    q: string;
    a: string;
  }>;
  raw: any;
}

interface CategoryCounts {
  all: number;
  match: number;
  choice: number;
  flip: number;
  quiz: number;
}

interface MyGamesManagerProps {
  initialSubTab?: MyGamesSubTab;
}

const PAGE_SIZE = 24;
const CACHE_PREFIX = "cached_teacher_my_games_v2_";

function clearMyGamesCache() {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (
        k &&
        (k.startsWith(CACHE_PREFIX) ||
          k === "cached_teacher_unified_games" ||
          k === "cached_teacher_match_games" ||
          k === "cached_teacher_choice_games" ||
          k === "cached_teacher_flip_games" ||
          k === "cached_teacher_quiz_games")
      ) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {}
}

export function MyGamesManager({ initialSubTab = "all" }: MyGamesManagerProps) {
  const { locale, t } = useTeacherLocale();
  const [activeSubTab, setActiveSubTab] = useState<MyGamesSubTab>(
    initialSubTab === "fill" ? "all" : initialSubTab
  );

  // Unified paginated state
  const [games, setGames] = useState<UnifiedGameCardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalFiltered, setTotalFiltered] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Search & Admin scope
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [scope, setScope] = useState<"all" | "mine">("all");

  // Category counts for tab badges
  const [counts, setCounts] = useState<CategoryCounts | null>(null);

  // Share Modals state
  const [shareTopic, setShareTopic] = useState<{
    id: string;
    name: string;
    gamePath: string;
  } | null>(null);
  const [shareChoiceGame, setShareChoiceGame] = useState<{
    title: string;
    code: string;
    directPath: string;
  } | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync initialSubTab when parent changes
  useEffect(() => {
    if (initialSubTab && initialSubTab !== "fill") {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Core fetch function hitting single unified paginated GET API
  const fetchGames = useCallback(
    async (opts: {
      category: MyGamesSubTab;
      pageNum: number;
      query: string;
      scopeVal: "all" | "mine";
      append?: boolean;
      silent?: boolean;
    }) => {
      const { category, pageNum, query, scopeVal, append = false, silent = false } = opts;
      const safeCat = category === "fill" ? "all" : category;

      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      if (append) {
        setLoadingMore(true);
      } else if (!silent) {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams({
          category: safeCat,
          page: String(pageNum),
          limit: String(PAGE_SIZE),
          scope: scopeVal,
          includeCounts: pageNum === 1 ? "1" : "0",
        });
        if (query) params.set("q", query);

        const res = await fetch(`/api/teacher/my-games?${params.toString()}`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to load games");

        const incoming: UnifiedGameCardItem[] = Array.isArray(data.games) ? data.games : [];

        if (typeof data.isAdmin === "boolean") {
          setIsAdmin(data.isAdmin);
        }
        if (data.counts) {
          setCounts(data.counts);
        }
        if (data.pagination) {
          setTotalFiltered(data.pagination.total || 0);
          setHasMore(Boolean(data.pagination.hasMore));
          setPage(data.pagination.page || pageNum);
        } else {
          setTotalFiltered(incoming.length);
          setHasMore(false);
        }

        if (append) {
          setGames((prev) => {
            const seen = new Set(prev.map((g) => g.id));
            return [...prev, ...incoming.filter((g) => !seen.has(g.id))];
          });
        } else {
          setGames(incoming);
          // Cache lightweight page 1 (only ~15 KB) when no search query
          if (pageNum === 1 && !query && typeof window !== "undefined") {
            try {
              const cacheKey = `${CACHE_PREFIX}${scopeVal}_${safeCat}`;
              sessionStorage.setItem(
                cacheKey,
                JSON.stringify({
                  games: incoming,
                  counts: data.counts,
                  isAdmin: data.isAdmin,
                  pagination: data.pagination,
                })
              );
            } catch {}
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("Failed to fetch teacher games:", err);
      } finally {
        if (abortRef.current === controller) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    []
  );

  // Trigger fetch whenever tab, search query, or admin scope changes
  useEffect(() => {
    const safeCat = activeSubTab === "fill" ? "all" : activeSubTab;
    let hydrated = false;

    if (!debouncedQuery && typeof window !== "undefined") {
      try {
        const cacheKey = `${CACHE_PREFIX}${scope}_${safeCat}`;
        const raw = sessionStorage.getItem(cacheKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.games)) {
            setGames(parsed.games);
            if (parsed.counts) setCounts(parsed.counts);
            if (typeof parsed.isAdmin === "boolean") setIsAdmin(parsed.isAdmin);
            if (parsed.pagination) {
              setTotalFiltered(parsed.pagination.total || parsed.games.length);
              setHasMore(Boolean(parsed.pagination.hasMore));
              setPage(1);
            }
            setLoading(false);
            hydrated = true;
          }
        }
      } catch {}
    }

    fetchGames({
      category: safeCat,
      pageNum: 1,
      query: debouncedQuery,
      scopeVal: scope,
      append: false,
      silent: hydrated,
    });

    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [activeSubTab, debouncedQuery, scope, fetchGames]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchGames({
      category: activeSubTab,
      pageNum: page + 1,
      query: debouncedQuery,
      scopeVal: scope,
      append: true,
    });
  };

  // Handle Delete for unified game card
  const handleDeleteUnified = async (item: UnifiedGameCardItem) => {
    if (!confirm(t.myGames.confirmDelete.replace("{name}", item.title))) return;

    setDeletingId(item.id);
    const toastId = toast.loading(t.myGames.deletingToast.replace("{name}", item.title));

    try {
      if (item.type === "choice") {
        await deleteTeacherChoiceGameAction(item.id);
        if (item.gameType === "egg") {
          deleteChoiceEggGame(item.id);
        } else {
          deleteChoiceShooterGame(item.id);
        }
      } else {
        await deleteTeacherMatchGameAction(item.id);
      }

      clearMyGamesCache();
      toast.success(t.myGames.deletedToast.replace("{name}", item.title));
      setGames((prev) => prev.filter((g) => g.id !== item.id));
      setTotalFiltered((prev) => Math.max(0, prev - 1));
      setCounts((prev) =>
        prev
          ? {
              ...prev,
              all: Math.max(0, prev.all - 1),
              [item.type]: Math.max(0, prev[item.type] - 1),
            }
          : prev
      );
    } catch (e) {
      toast.error(t.myGames.deleteErrorToast);
    } finally {
      toast.dismiss(toastId);
      setDeletingId(null);
    }
  };

  // Handle Share for unified game card
  const handleShareUnified = (item: UnifiedGameCardItem) => {
    trackEvent("teacher_my_game_action", {
      action: "share",
      gameType: item.type,
      gameTitle: item.title,
      gameId: item.id,
    });

    if (item.type === "choice") {
      setShareChoiceGame({
        title: item.title,
        code: item.code || item.raw?.code || item.id,
        directPath: item.playUrl,
      });
    } else {
      const gamePath =
        item.shareGamePath ||
        (item.gameMode === "train"
          ? "/student/game/train"
          : item.gameMode === "cut-rope"
            ? "/student/game/cut-rope"
            : item.gameMode === "conveyor-drop"
              ? "/student/game/conveyor-drop"
              : item.gameMode?.startsWith("flip")
                ? "/game/memory-flip"
                : item.gameMode === "shooter-quiz"
                  ? "/game/shooter-quiz"
                  : item.gameMode === "treasure-hunt"
                    ? "/game/treasure-grid"
                    : item.gameMode === "candy-quiz"
                      ? "/student/game/candy-quiz"
                      : "/student/game/flashcard-match");

      setShareTopic({
        id: item.id,
        name: item.title,
        gamePath,
      });
    }
  };

  // Helper to get category badge info
  const getCategoryBadge = (type: "match" | "choice" | "flip" | "quiz") => {
    switch (type) {
      case "match":
        return {
          label: locale === "vi" ? "Nối Cặp" : "Matching",
          colorClass: "bg-sky-500 text-white shadow-sky-500/30",
          borderClass:
            "border-sky-300/80 dark:border-sky-700/80 hover:border-sky-400 shadow-sky-500/5 hover:shadow-sky-500/15",
          titleClass: "text-sky-800 dark:text-sky-200",
          btnGradient:
            "from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-sky-500/20",
        };
      case "choice":
        return {
          label: locale === "vi" ? "Toán Học" : "Math",
          colorClass: "bg-emerald-500 text-white shadow-emerald-500/30",
          borderClass:
            "border-emerald-300/80 dark:border-emerald-700/80 hover:border-emerald-400 shadow-emerald-500/5 hover:shadow-emerald-500/15",
          titleClass: "text-emerald-800 dark:text-emerald-200",
          btnGradient:
            "from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20",
        };
      case "flip":
        return {
          label: locale === "vi" ? "Lật Ảnh" : "Flip Cards",
          colorClass: "bg-rose-500 text-white shadow-rose-500/30",
          borderClass:
            "border-rose-300/80 dark:border-rose-700/80 hover:border-rose-400 shadow-rose-500/5 hover:shadow-rose-500/15",
          titleClass: "text-rose-800 dark:text-rose-200",
          btnGradient:
            "from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-500/20",
        };
      case "quiz":
        return {
          label: locale === "vi" ? "Trắc Nghiệm" : "Quizzes",
          colorClass: "bg-amber-500 text-white shadow-amber-500/30",
          borderClass:
            "border-amber-300/80 dark:border-amber-700/80 hover:border-amber-400 shadow-amber-500/5 hover:shadow-amber-500/15",
          titleClass: "text-amber-800 dark:text-amber-200",
          btnGradient:
            "from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/20",
        };
    }
  };

  // Helper for specific game format badge
  const getSubBadgeLabel = (item: UnifiedGameCardItem) => {
    if (item.type === "choice") {
      return item.gameType === "egg" ? t.myGames.badges.eggSmash : t.myGames.badges.shooter;
    }
    if (item.type === "quiz") {
      if (item.gameMode === "shooter-quiz") return t.myGames.badges.shooterQuiz;
      if (item.gameMode === "treasure-hunt") return t.myGames.badges.treasureHunt;
      return t.myGames.badges.candyQuiz;
    }
    if (item.type === "flip") {
      return item.isImageImage || item.raw?.isImageImage
        ? t.myGames.badges.flipImageImage
        : t.myGames.badges.flipImageText;
    }
    if (item.type === "match") {
      if (item.gameMode === "train") return t.myGames.badges.train;
      if (item.gameMode === "cut-rope") return t.myGames.badges.cutRope;
      if (item.gameMode === "conveyor-drop") return t.myGames.badges.conveyor;
      if (item.gameMode === "line") return t.myGames.badges.lineMatch;
      if (item.isImageImage || item.raw?.isImageImage) return t.myGames.badges.imageImage;
      if (item.isTextText || item.raw?.isTextText) return t.myGames.badges.textText;
      return t.myGames.badges.imageText;
    }
    return null;
  };

  // Tab definitions
  const tabsList = [
    {
      id: "all" as const,
      label: t.myGames.tabs?.all || (locale === "vi" ? "Tất cả game" : "All games"),
      icon: LayoutGrid,
      count: counts ? counts.all : null,
      color: "purple",
    },
    {
      id: "match" as const,
      label: t.myGames.tabs?.match || (locale === "vi" ? "Nối cặp đã tạo" : "Created Matching"),
      icon: Copy,
      count: counts ? counts.match : null,
      color: "sky",
    },
    {
      id: "choice" as const,
      label: t.myGames.tabs?.math || (locale === "vi" ? "Toán học đã tạo" : "Created Math"),
      icon: Calculator,
      count: counts ? counts.choice : null,
      color: "emerald",
    },
    {
      id: "flip" as const,
      label: t.myGames.tabs?.flip || (locale === "vi" ? "Lật ảnh đã tạo" : "Created Flip Cards"),
      icon: Layers,
      count: counts ? counts.flip : null,
      color: "rose",
    },
    {
      id: "quiz" as const,
      label: t.myGames.tabs?.quiz || (locale === "vi" ? "Trắc nghiệm đã tạo" : "Created Quizzes"),
      icon: HelpCircle,
      count: counts ? counts.quiz : null,
      color: "amber",
    },
    {
      id: "fill" as const,
      label: t.myGames.tabs?.fill || (locale === "vi" ? "Điền ô trống" : "Created Fill in Blanks"),
      icon: Lock,
      count: null,
      disabled: true,
      color: "slate",
    },
  ];

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      {/* 1. Header with Language Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <FolderOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h2 className="font-headline font-black text-2xl sm:text-3xl text-slate-800 dark:text-white tracking-tight">
              {t.sidebar.createdTitle}
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-1 pl-11">
            {t.myGames.tabs?.allGamesDesc ||
              (locale === "vi"
                ? "Tất cả các trò chơi và bài tập do chính bạn tạo"
                : "All games and exercises created by you")}
          </p>
        </div>
        <div className="shrink-0 self-start sm:self-center">
          <TeacherLocaleSwitch />
        </div>
      </div>

      {/* 2. Horizontal Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        {tabsList.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;

          if (tab.disabled) {
            return (
              <button
                key={tab.id}
                type="button"
                disabled
                title={t.myGames.tabs?.comingSoon || t.sidebar.comingSoonTooltip}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-headline font-black bg-slate-100/70 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border border-dashed border-slate-300/60 dark:border-slate-700/60 opacity-60 cursor-not-allowed select-none shrink-0"
              >
                <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700/50 text-slate-500 font-bold">
                  🔒
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveSubTab(tab.id);
                trackEvent("teacher_my_games_tab_change", { tab: tab.id });
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-headline font-black transition-all cursor-pointer select-none shrink-0 border ${
                isActive
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 border-transparent scale-[1.02]"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-white" : "text-slate-500 dark:text-slate-400"
                }`}
              />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Search Bar & Admin Scope Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={
              locale === "vi" ? "Tìm tên trò chơi đã tạo..." : "Search your games by title..."
            }
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all shadow-xs"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          {!loading && totalFiltered > 0 && (
            <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
              {locale === "vi"
                ? `Hiển thị ${games.length} / ${totalFiltered} game`
                : `Showing ${games.length} of ${totalFiltered} games`}
            </span>
          )}

          {isAdmin && (
            <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setScope("all")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  scope === "all"
                    ? "bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{locale === "vi" ? "Tất cả GV" : "All Teachers"}</span>
              </button>
              <button
                type="button"
                onClick={() => setScope("mine")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  scope === "mine"
                    ? "bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{locale === "vi" ? "Chỉ của tôi" : "Only Mine"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Unified Paginated Games Grid */}
      <div className="w-full space-y-6">
        {loading && games.length === 0 ? (
          /* Fast Shimmer Skeleton Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 p-4 sm:p-5 space-y-4 animate-pulse shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-16 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <div className="h-5 w-14 rounded-lg bg-slate-100 dark:bg-slate-800/80" />
                  </div>
                  <div className="h-4 w-12 rounded-md bg-slate-100 dark:bg-slate-800" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-4/5 rounded-lg bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3.5 w-1/2 rounded-md bg-slate-100 dark:bg-slate-800/80" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800" />
                  <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800" />
                  <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800" />
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <div className="h-9 flex-1 rounded-xl bg-slate-200 dark:bg-slate-800" />
                  <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
                  <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
                  <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="w-full py-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-primary/10 p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center border border-purple-200/50 shadow-inner">
              <Sparkles className="w-8 h-8 stroke-[1.8]" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="font-headline font-black text-xl text-slate-800 dark:text-white">
                {debouncedQuery
                  ? locale === "vi"
                    ? "Không tìm thấy trò chơi phù hợp"
                    : "No matching games found"
                  : t.myGames.tabs?.emptyAllTitle ||
                    (locale === "vi" ? "Bạn chưa tạo game nào" : "No games created yet")}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {debouncedQuery
                  ? locale === "vi"
                    ? `Không có trò chơi nào chứa từ khóa "${debouncedQuery}".`
                    : `No games match "${debouncedQuery}".`
                  : t.myGames.tabs?.emptyAllDesc ||
                    (locale === "vi"
                      ? "Hãy chọn một dạng bài tập ở menu bên trái để bắt đầu tạo nhé!"
                      : "Choose a format on the left to start creating!")}
              </p>
            </div>
            {debouncedQuery && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                {locale === "vi" ? "Xóa bộ lọc tìm kiếm" : "Clear search"}
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 transition-opacity duration-200 ${
                loading ? "opacity-60" : "opacity-100"
              }`}
            >
              {games.map((item) => {
                const catBadge = getCategoryBadge(item.type);
                const subBadge = getSubBadgeLabel(item);

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className={`rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group p-4 sm:p-5 gap-3.5 sm:gap-4 bg-white dark:bg-slate-900 border ${catBadge.borderClass}`}
                  >
                    {/* Top Details & Badges */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 shadow-xs ${catBadge.colorClass}`}
                          >
                            {catBadge.label}
                          </span>

                          {subBadge && (
                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 shrink-0">
                              {subBadge}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                          <Layers className="w-3.5 h-3.5" />
                          <span>
                            {item.count}{" "}
                            {item.countUnit === "pairs"
                              ? t.common.pairsCount
                              : t.common.questionsCount}
                          </span>
                        </div>
                      </div>

                      {/* Title & Date */}
                      <div>
                        <h3
                          className={`font-headline font-black text-base sm:text-lg line-clamp-2 leading-snug ${catBadge.titleClass}`}
                          title={item.title}
                        >
                          {item.title}
                        </h3>

                        {item.createdAt && (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 mt-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{format(new Date(item.createdAt), "dd/MM/yyyy HH:mm")}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preview Strip: Choice sample chips OR Match/Flip/Quiz thumbnails */}
                    {item.type === "choice" &&
                    item.sampleQuestions &&
                    item.sampleQuestions.length > 0 ? (
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {item.sampleQuestions.map((q) => (
                          <div
                            key={q.id}
                            className="px-2 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300 shrink-0 flex items-center gap-1"
                          >
                            <span>{q.q}</span>
                            {q.a && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-black">
                                ({q.a})
                              </span>
                            )}
                          </div>
                        ))}
                        {item.count > item.sampleQuestions.length && (
                          <span className="px-2 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] shrink-0">
                            +{item.count - item.sampleQuestions.length}
                          </span>
                        )}
                      </div>
                    ) : item.items && item.items.length > 0 ? (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {item.items.slice(0, 4).map((subItem, idx) => (
                          <div
                            key={subItem.id || idx}
                            className="h-11 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 shrink-0 p-1 flex items-center justify-center overflow-hidden gap-1 text-center"
                            title={subItem.word}
                          >
                            {subItem.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={subItem.imageUrl}
                                alt={subItem.word || ""}
                                loading="lazy"
                                decoding="async"
                                className="w-9 h-9 object-contain rounded-lg"
                              />
                            ) : (
                              <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 px-1 truncate max-w-[68px]">
                                {subItem.word}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {/* Card Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                      {/* Play/Preview Button */}
                      <a
                        href={withLangParam(item.playUrl, locale)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          trackEvent("teacher_my_game_action", {
                            action: "preview",
                            gameType: item.type,
                            gameTitle: item.title,
                            gameId: item.id,
                          })
                        }
                        className={`flex-1 py-2 px-2.5 bg-gradient-to-r text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer ${catBadge.btnGradient}`}
                        title={t.common.previewTooltip}
                      >
                        <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                        <span>{t.common.preview}</span>
                      </a>

                      {/* Edit Button */}
                      <Link
                        href={withLangParam(item.editUrl, locale)}
                        className="p-2 font-bold text-xs rounded-xl transition-all flex items-center justify-center active:scale-95 cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700"
                        title={t.common.editTooltip}
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      </Link>

                      {/* Share Button */}
                      <button
                        type="button"
                        onClick={() => handleShareUnified(item)}
                        className="p-2 font-bold text-xs rounded-xl transition-all flex items-center justify-center active:scale-95 cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700"
                        title={t.common.shareTooltip}
                      >
                        <Share2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteUnified(item)}
                        disabled={deletingId === item.id}
                        className="p-2 font-bold text-xs rounded-xl transition-all flex items-center justify-center active:scale-95 cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200/60 dark:border-slate-700 hover:border-rose-200"
                        title={t.common.deleteTooltip}
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Pagination Bar */}
            {hasMore && (
              <div className="flex flex-col items-center justify-center pt-2 gap-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-headline font-black text-xs sm:text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 active:scale-95"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{locale === "vi" ? "Đang tải thêm..." : "Loading more..."}</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>
                        {locale === "vi"
                          ? `Xem thêm trò chơi (${totalFiltered - games.length} còn lại)`
                          : `Load more games (${totalFiltered - games.length} remaining)`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Share Modal for Match, Flip, Quiz */}
      {shareTopic && (
        <MatchGameShareModal
          isOpen={Boolean(shareTopic)}
          onClose={() => setShareTopic(null)}
          topicName={shareTopic.name}
          topicId={shareTopic.id}
          gamePath={shareTopic.gamePath}
        />
      )}

      {/* Share Modal for Math / Choice */}
      {shareChoiceGame && (
        <ChoiceGameShareModal
          isOpen={Boolean(shareChoiceGame)}
          onClose={() => setShareChoiceGame(null)}
          gameTitle={shareChoiceGame.title}
          gameCode={shareChoiceGame.code}
          directPath={shareChoiceGame.directPath}
        />
      )}
    </div>
  );
}
