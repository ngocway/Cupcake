"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  FolderOpen,
  LayoutGrid,
  Copy,
  Calculator,
  Layers,
  HelpCircle,
  ClipboardList,
  Lock,
  Play,
  Edit3,
  Trash2,
  Share2,
  Calendar,
  Loader2,
  Sparkles,
  Puzzle,
} from "lucide-react";

import { useTeacherLocale, withLangParam, TeacherLocaleSwitch } from "@/i18n/teacher-locale";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

import { MyMatchGamesList } from "./MyMatchGamesList";
import { MyChoiceGamesList } from "./MyChoiceGamesList";
import { MyFlipGamesList } from "./MyFlipGamesList";
import { MyQuizGamesList } from "./MyQuizGamesList";

import {
  getTeacherMatchGamesAction,
  getTeacherFlipGamesAction,
  deleteTeacherMatchGameAction,
} from "@/actions/teacher-match-games";
import {
  getTeacherChoiceGamesAction,
  deleteTeacherChoiceGameAction,
} from "@/actions/teacher-choice-games";
import { getTeacherQuizGamesAction } from "@/actions/candy-quiz-actions";
import {
  deleteChoiceShooterGame,
} from "@/lib/choice-shooter-storage";
import {
  deleteChoiceEggGame,
} from "@/lib/choice-egg-storage";

import { MatchGamePreviewModal, PreviewGameTopic } from "./MatchGamePreviewModal";
import { MatchTextTextPreviewModal } from "./MatchTextTextPreviewModal";
import { MatchGameShareModal } from "./MatchGameShareModal";
import { ChoiceGameShareModal } from "./ChoiceGameShareModal";

export type MyGamesSubTab = "all" | "match" | "choice" | "flip" | "quiz" | "fill";

export interface UnifiedGameCardItem {
  id: string;
  title: string;
  type: "match" | "choice" | "flip" | "quiz";
  createdAt: string;
  count: number;
  countUnit: "pairs" | "questions";
  gameMode?: string;
  gameType?: "shooter" | "egg";
  playUrl: string;
  editUrl: string;
  items?: any[];
  raw: any;
}

interface MyGamesManagerProps {
  initialSubTab?: MyGamesSubTab;
}

export function MyGamesManager({ initialSubTab = "all" }: MyGamesManagerProps) {
  const { locale, t } = useTeacherLocale();
  const [activeSubTab, setActiveSubTab] = useState<MyGamesSubTab>(initialSubTab);

  // Unified All Games State
  const [allGames, setAllGames] = useState<UnifiedGameCardItem[]>([]);
  const [loadingAll, setLoadingAll] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modals state
  const [previewTopic, setPreviewTopic] = useState<PreviewGameTopic | null>(null);
  const [shareTopic, setShareTopic] = useState<any | null>(null);
  const [shareChoiceGame, setShareChoiceGame] = useState<{ title: string; code: string; directPath: string } | null>(null);

  // Category counts for tab badges
  const [counts, setCounts] = useState<{
    match: number | null;
    choice: number | null;
    flip: number | null;
    quiz: number | null;
  }>({ match: null, choice: null, flip: null, quiz: null });

  // Fetch all games in parallel
  const fetchAllCategories = async (isBackground = false) => {
    if (!isBackground && allGames.length === 0) {
      setLoadingAll(true);
    }

    try {
      const [matchRes, choiceRes, flipRes, quizRes] = await Promise.allSettled([
        getTeacherMatchGamesAction(),
        getTeacherChoiceGamesAction(),
        getTeacherFlipGamesAction(),
        getTeacherQuizGamesAction(),
      ]);

      const unified: UnifiedGameCardItem[] = [];

      // 1. Process Match Games
      if (matchRes.status === "fulfilled" && matchRes.value.success && matchRes.value.topics) {
        const topics = matchRes.value.topics;
        setCounts((prev) => ({ ...prev, match: topics.length }));
        topics.forEach((topic: any) => {
          const isTrain = topic.gameMode === "train";
          const isCutRope = topic.gameMode === "cut-rope";
          const isConveyorDrop =
            topic.gameMode === "conveyor-drop" || topic.game?.name?.includes("Băng Chuyền");
          const isImageImage = !isConveyorDrop && !isTrain && !isCutRope && topic.isImageImage;
          const isTextText =
            !isConveyorDrop &&
            !isTrain &&
            !isCutRope &&
            !isImageImage &&
            (topic.game?.name?.includes("Chữ - Chữ") ||
              topic.items?.some((i: any) => Boolean(i.labelB && !i.imageUrl && !i.imageBUrl)));
          const isLineDraw = !isConveyorDrop && !isTrain && !isCutRope && topic.gameMode === "line";

          const playUrl = isTrain
            ? `/student/game/train?topicId=${topic.id}`
            : isCutRope
            ? `/student/game/cut-rope?topicId=${topic.id}`
            : isConveyorDrop
            ? `/student/game/conveyor-drop?topicId=${topic.id}`
            : isLineDraw || isTextText
            ? `/student/game/match-text-text?topicId=${topic.id}`
            : `/student/game/flashcard-match?topicId=${topic.id}`;

          const editUrl = isTrain
            ? `/teacher/games/match-image-text/create?type=image-text&gameMode=train&topicId=${topic.id}`
            : isCutRope
            ? `/teacher/games/match-image-text/create?type=image-text&gameMode=cut-rope&topicId=${topic.id}`
            : isConveyorDrop
            ? `/teacher/games/conveyor-drop/create?topicId=${topic.id}`
            : isImageImage
            ? `/teacher/games/match-image-text/create?type=image-image${isLineDraw ? "&gameMode=line" : ""}&topicId=${topic.id}`
            : isTextText
            ? `/teacher/games/match-image-text/create?type=text-text&topicId=${topic.id}`
            : `/teacher/games/match-image-text/create?${isLineDraw ? "gameMode=line&" : ""}topicId=${topic.id}`;

          unified.push({
            id: topic.id,
            title: topic.name,
            type: "match",
            createdAt: topic.createdAt,
            count: topic.totalItems || topic.items?.length || 0,
            countUnit: "pairs",
            gameMode: topic.gameMode,
            playUrl,
            editUrl,
            items: topic.items,
            raw: topic,
          });
        });
      }

      // 2. Process Math / Choice Games
      if (choiceRes.status === "fulfilled" && choiceRes.value.success && choiceRes.value.games) {
        const games = choiceRes.value.games;
        setCounts((prev) => ({ ...prev, choice: games.length }));
        games.forEach((game: any) => {
          const isEgg = game.gameType === "egg";
          const playUrl = isEgg ? `/game/egg-smash/${game.code}` : `/game/shooter/${game.code}`;
          const editUrl = isEgg
            ? `/teacher/games/choice-egg/create?id=${game.id}`
            : `/teacher/games/choice-shooter/create?id=${game.id}`;

          unified.push({
            id: game.id,
            title: game.title,
            type: "choice",
            createdAt: game.createdAt,
            count: game.questionCount || game.questions?.length || 0,
            countUnit: "questions",
            gameType: game.gameType,
            playUrl,
            editUrl,
            raw: game,
          });
        });
      }

      // 3. Process Flip Games
      if (flipRes.status === "fulfilled" && flipRes.value.success && flipRes.value.topics) {
        const topics = flipRes.value.topics;
        setCounts((prev) => ({ ...prev, flip: topics.length }));
        topics.forEach((topic: any) => {
          const playUrl = `/game/memory-flip?topicId=${topic.id}`;
          const editUrl = `/teacher/games/flip-image-image/create?topicId=${topic.id}`;

          unified.push({
            id: topic.id,
            title: topic.name,
            type: "flip",
            createdAt: topic.createdAt,
            count: topic.totalItems || topic.items?.length || 0,
            countUnit: "pairs",
            gameMode: topic.gameMode,
            playUrl,
            editUrl,
            items: topic.items,
            raw: topic,
          });
        });
      }

      // 4. Process Quiz Games
      if (quizRes.status === "fulfilled" && quizRes.value.success && quizRes.value.topics) {
        const topics = quizRes.value.topics;
        setCounts((prev) => ({ ...prev, quiz: topics.length }));
        topics.forEach((topic: any) => {
          const isTreasure = topic.gameMode === "treasure-hunt";
          const isShooter = topic.gameMode === "shooter-quiz";
          const playUrl = isShooter
            ? `/game/shooter-quiz?topicId=${topic.id}`
            : isTreasure
            ? `/game/treasure-grid?topicId=${topic.id}`
            : `/student/game/candy-quiz?topicId=${topic.id}`;
          const editUrl = isShooter
            ? `/teacher/games/shooter-quiz/create?topicId=${topic.id}`
            : isTreasure
            ? `/teacher/games/treasure-hunt/create?topicId=${topic.id}`
            : `/teacher/games/candy-quiz/create?topicId=${topic.id}`;

          unified.push({
            id: topic.id,
            title: topic.name,
            type: "quiz",
            createdAt: topic.createdAt,
            count: topic.totalItems || topic.items?.length || 0,
            countUnit: "questions",
            gameMode: topic.gameMode,
            playUrl,
            editUrl,
            raw: topic,
          });
        });
      }

      // Sort newest first
      unified.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setAllGames(unified);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("cached_teacher_unified_games", JSON.stringify(unified));
        } catch {}
      }
    } catch (e) {
      console.error("Error fetching all categories:", e);
    } finally {
      setLoadingAll(false);
    }
  };

  useEffect(() => {
    // Try to hydrate from cache
    try {
      const cached = sessionStorage.getItem("cached_teacher_unified_games");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllGames(parsed);
          setLoadingAll(false);
        }
      }
    } catch {}

    fetchAllCategories(true);
  }, []);

  // Sync initialSubTab when parent changes
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

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
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("cached_teacher_choice_games");
        }
      } else {
        await deleteTeacherMatchGameAction(item.id);
        if (typeof window !== "undefined") {
          if (item.type === "match") sessionStorage.removeItem("cached_teacher_match_games");
          if (item.type === "flip") sessionStorage.removeItem("cached_teacher_flip_games");
          if (item.type === "quiz") sessionStorage.removeItem("cached_teacher_quiz_games");
        }
      }

      toast.success(t.myGames.deletedToast.replace("{name}", item.title));
      setAllGames((prev) => prev.filter((g) => g.id !== item.id));
      setCounts((prev) => ({
        ...prev,
        [item.type]: prev[item.type] !== null ? Math.max(0, (prev[item.type] || 1) - 1) : null,
      }));
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
        code: item.raw.code || item.id,
        directPath: item.playUrl,
      });
    } else {
      setShareTopic(item.raw);
    }
  };

  // Helper to get category badge info
  const getCategoryBadge = (type: "match" | "choice" | "flip" | "quiz") => {
    switch (type) {
      case "match":
        return {
          label: locale === "vi" ? "Nối Cặp" : "Matching",
          colorClass: "bg-sky-500 text-white shadow-sky-500/30",
          borderClass: "border-sky-300/80 dark:border-sky-700/80 hover:border-sky-400 shadow-sky-500/5 hover:shadow-sky-500/15",
          titleClass: "text-sky-800 dark:text-sky-200",
          btnGradient: "from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-sky-500/20",
        };
      case "choice":
        return {
          label: locale === "vi" ? "Toán Học" : "Math",
          colorClass: "bg-emerald-500 text-white shadow-emerald-500/30",
          borderClass: "border-emerald-300/80 dark:border-emerald-700/80 hover:border-emerald-400 shadow-emerald-500/5 hover:shadow-emerald-500/15",
          titleClass: "text-emerald-800 dark:text-emerald-200",
          btnGradient: "from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20",
        };
      case "flip":
        return {
          label: locale === "vi" ? "Lật Ảnh" : "Flip Cards",
          colorClass: "bg-rose-500 text-white shadow-rose-500/30",
          borderClass: "border-rose-300/80 dark:border-rose-700/80 hover:border-rose-400 shadow-rose-500/5 hover:shadow-rose-500/15",
          titleClass: "text-rose-800 dark:text-rose-200",
          btnGradient: "from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-500/20",
        };
      case "quiz":
        return {
          label: locale === "vi" ? "Trắc Nghiệm" : "Quizzes",
          colorClass: "bg-amber-500 text-white shadow-amber-500/30",
          borderClass: "border-amber-300/80 dark:border-amber-700/80 hover:border-amber-400 shadow-amber-500/5 hover:shadow-amber-500/15",
          titleClass: "text-amber-800 dark:text-amber-200",
          btnGradient: "from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/20",
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
      return item.raw.isImageImage ? t.myGames.badges.flipImageImage : t.myGames.badges.flipImageText;
    }
    if (item.type === "match") {
      if (item.gameMode === "train") return t.myGames.badges.train;
      if (item.gameMode === "cut-rope") return t.myGames.badges.cutRope;
      if (item.gameMode === "conveyor-drop") return t.myGames.badges.conveyor;
      if (item.gameMode === "line") return t.myGames.badges.lineMatch;
      if (item.raw.isImageImage) return t.myGames.badges.imageImage;
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
      count: allGames.length,
      color: "purple",
    },
    {
      id: "match" as const,
      label: t.myGames.tabs?.match || (locale === "vi" ? "Nối cặp đã tạo" : "Created Matching"),
      icon: Copy,
      count: counts.match,
      color: "sky",
    },
    {
      id: "choice" as const,
      label: t.myGames.tabs?.math || (locale === "vi" ? "Toán học đã tạo" : "Created Math"),
      icon: Calculator,
      count: counts.choice,
      color: "emerald",
    },
    {
      id: "flip" as const,
      label: t.myGames.tabs?.flip || (locale === "vi" ? "Lật ảnh đã tạo" : "Created Flip Cards"),
      icon: Layers,
      count: counts.flip,
      color: "rose",
    },
    {
      id: "quiz" as const,
      label: t.myGames.tabs?.quiz || (locale === "vi" ? "Trắc nghiệm đã tạo" : "Created Quizzes"),
      icon: HelpCircle,
      count: counts.quiz,
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
    <div className="w-full space-y-6 animate-in fade-in duration-300">
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
            {t.myGames.tabs?.allGamesDesc || (locale === "vi" ? "Tất cả các trò chơi và bài tập do chính bạn tạo" : "All games and exercises created by you")}
          </p>
        </div>
        <div className="shrink-0 self-start sm:self-center">
          <TeacherLocaleSwitch />
        </div>
      </div>

      {/* 2. Horizontal Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
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
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
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

      {/* 3. Tab Content Panes */}
      <div className="w-full">
        {/* TAB 1: ALL GAMES */}
        {activeSubTab === "all" && (
          <div className="w-full space-y-6 animate-in fade-in duration-300">
            {loadingAll && allGames.length === 0 ? (
              <div className="w-full h-96 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-primary/10 p-8 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                <span className="text-sm font-bold text-slate-500">
                  {locale === "vi" ? "Đang tổng hợp tất cả game của bạn..." : "Loading all your games..."}
                </span>
              </div>
            ) : allGames.length === 0 ? (
              <div className="w-full py-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-primary/10 p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center border border-purple-200/50 shadow-inner">
                  <Sparkles className="w-8 h-8 stroke-[1.8]" />
                </div>
                <div className="space-y-1 max-w-md">
                  <h3 className="font-headline font-black text-xl text-slate-800 dark:text-white">
                    {t.myGames.tabs?.emptyAllTitle || (locale === "vi" ? "Bạn chưa tạo game nào" : "No games created yet")}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {t.myGames.tabs?.emptyAllDesc || (locale === "vi" ? "Hãy chọn một dạng bài tập ở menu bên trái để bắt đầu tạo nhé!" : "Choose a format on the left to start creating!")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                {allGames.map((item) => {
                  const catBadge = getCategoryBadge(item.type);
                  const subBadge = getSubBadgeLabel(item);

                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className={`rounded-3xl shadow-md hover:shadow-xl backdrop-blur-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group p-4 sm:p-5 gap-3.5 sm:gap-4 bg-white dark:bg-slate-900 border ${catBadge.borderClass}`}
                    >
                      {/* Top Details & Badges */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          {/* Category Badge */}
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

                          {/* Count Badge */}
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

                      {/* Sample Cards Thumbnail Strip (if match or flip items exist) */}
                      {item.items && item.items.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                          {item.items.slice(0, 4).map((subItem: any, idx: number) => (
                            <div
                              key={subItem.id || idx}
                              className="h-11 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 shrink-0 p-1 flex items-center justify-center overflow-hidden gap-1 text-center"
                              title={subItem.word}
                            >
                              {subItem.imageUrl ? (
                                <img
                                  src={subItem.imageUrl}
                                  alt={subItem.word || ""}
                                  className="w-9 h-9 object-contain rounded-lg"
                                />
                              ) : (
                                <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 px-1 truncate max-w-[60px]">
                                  {subItem.word}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

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
            )}
          </div>
        )}

        {/* TAB 2: CREATED MATCHING */}
        {activeSubTab === "match" && (
          <div className="w-full space-y-4 animate-in fade-in duration-300">
            <MyMatchGamesList />
          </div>
        )}

        {/* TAB 3: CREATED MATH */}
        {activeSubTab === "choice" && (
          <div className="w-full space-y-4 animate-in fade-in duration-300">
            <MyChoiceGamesList />
          </div>
        )}

        {/* TAB 4: CREATED FLIP CARDS */}
        {activeSubTab === "flip" && (
          <div className="w-full space-y-4 animate-in fade-in duration-300">
            <MyFlipGamesList />
          </div>
        )}

        {/* TAB 5: CREATED QUIZZES */}
        {activeSubTab === "quiz" && (
          <div className="w-full space-y-4 animate-in fade-in duration-300">
            <MyQuizGamesList />
          </div>
        )}
      </div>

      {/* Share Modal for Match, Flip, Quiz */}
      {shareTopic && (
        <MatchGameShareModal
          isOpen={Boolean(shareTopic)}
          onClose={() => setShareTopic(null)}
          topicName={shareTopic.name}
          topicId={shareTopic.id}
          gamePath={
            shareTopic.gameMode === "train"
              ? "/student/game/train"
              : shareTopic.gameMode === "cut-rope"
              ? "/student/game/cut-rope"
              : shareTopic.gameMode === "conveyor-drop"
              ? "/student/game/conveyor-drop"
              : shareTopic.gameMode?.startsWith("flip")
              ? "/game/memory-flip"
              : shareTopic.gameMode === "shooter-quiz"
              ? "/game/shooter-quiz"
              : shareTopic.gameMode === "treasure-hunt"
              ? "/game/treasure-grid"
              : shareTopic.gameMode === "candy-quiz"
              ? "/student/game/candy-quiz"
              : "/student/game/flashcard-match"
          }
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
