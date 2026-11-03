"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  Edit3,
  Trash2,
  Layers,
  Loader2,
  Play,
  Share2,
  Link2,
} from "lucide-react";
import { getTeacherQuizGamesAction } from "@/actions/candy-quiz-actions";
import { deleteTeacherMatchGameAction } from "@/actions/teacher-match-games";
import { MatchGameShareModal } from "./MatchGameShareModal";
import { toast } from "sonner"; import { trackEvent } from "@/lib/analytics";
import { useTeacherLocale } from "@/i18n/teacher-locale";

export function MyQuizGamesList({ initialTopics }: { initialTopics?: any[] }) {
  const [topics, setTopics] = useState<any[]>(initialTopics || []);
  const [loading, setLoading] = useState<boolean>(!initialTopics || initialTopics.length === 0);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [shareTopic, setShareTopic] = useState<any | null>(null);
  const { t } = useTeacherLocale();

  const fetchGames = async (isBackground = false) => {
    if (!isBackground && topics.length === 0) setLoading(true);
    const res = await getTeacherQuizGamesAction();
    if (res.success && res.topics) {
      setTopics(res.topics);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("cached_teacher_quiz_games", JSON.stringify(res.topics));
        } catch (e) {}
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    // Read cached data immediately on client mount after hydration
    try {
      const cached = sessionStorage.getItem("cached_teacher_quiz_games");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTopics(parsed);
          setLoading(false);
        }
      }
    } catch (e) {}

    fetchGames(Boolean(initialTopics && initialTopics.length >= 0));
  }, [initialTopics]);

  const handleDelete = async (topicId: string, topicName: string) => {
    if (!confirm(t.myGames.confirmDelete.replace("{name}", topicName))) return;

    setDeletingId(topicId);
    const toastId = toast.loading(t.myGames.deletingToast.replace("{name}", topicName));
    const res = await deleteTeacherMatchGameAction(topicId);
    toast.dismiss(toastId);
    setDeletingId(null);

    if (res.success) {
      toast.success(t.myGames.deletedToast.replace("{name}", topicName));
      const updatedTopics = topics.filter((t) => t.id !== topicId);
      setTopics(updatedTopics);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("cached_teacher_quiz_games", JSON.stringify(updatedTopics));
        } catch (e) {}
      }
    } else {
      toast.error(res.error || t.myGames.deleteErrorToast);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-primary/10 p-8 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold text-slate-500">{t.myGames.loadingQuiz}</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {topics.length === 0 ? (
        /* Empty State */
        <div className="w-full py-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-primary/10 p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 flex items-center justify-center border border-pink-200/50 shadow-inner">
            <span className="material-symbols-outlined text-[36px]">quiz</span>
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="font-headline font-black text-xl text-slate-800 dark:text-white">
              {t.myGames.emptyQuizTitle}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {t.myGames.emptyQuizDesc}
            </p>
          </div>
        </div>
      ) : (
        /* Topics Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {topics.map((topic) => {
            const isTreasure = topic.gameMode === "treasure-hunt";
            const isShooter = topic.gameMode === "shooter-quiz";
            const gameTitle = isShooter ? t.myGames.badges.shooterQuiz : isTreasure ? t.myGames.badges.treasureHunt : t.myGames.badges.candyQuiz;
            const playUrl = isShooter ? `/game/shooter-quiz?topicId=${topic.id}` : isTreasure ? `/game/treasure-grid?topicId=${topic.id}` : `/student/game/candy-quiz?topicId=${topic.id}`;
            const editUrl = isShooter ? `/teacher/games/shooter-quiz/create?topicId=${topic.id}` : isTreasure ? `/teacher/games/treasure-hunt/create?topicId=${topic.id}` : `/teacher/games/candy-quiz/create?topicId=${topic.id}`;

            return (
              <div
                key={topic.id}
                className={`rounded-3xl shadow-md hover:shadow-xl backdrop-blur-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group p-4 sm:p-5 gap-3.5 sm:gap-4 bg-white dark:bg-slate-900 border ${
                  isShooter
                    ? "border-cyan-200/80 dark:border-cyan-800/60 shadow-cyan-500/5 hover:shadow-cyan-500/15 hover:border-cyan-400"
                    : isTreasure
                    ? "border-amber-200/80 dark:border-amber-800/60 shadow-amber-500/5 hover:shadow-amber-500/15 hover:border-amber-400"
                    : "border-pink-200/80 dark:border-pink-800/60 shadow-pink-500/5 hover:shadow-pink-500/15 hover:border-pink-400"
                }`}
              >
                {/* Top Details */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-white shadow-sm shrink-0 ${
                          isShooter
                            ? "bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/30"
                            : isTreasure
                            ? "bg-gradient-to-r from-amber-500 to-yellow-600 shadow-amber-500/30"
                            : "bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/30"
                        }`}
                      >
                        {gameTitle}
                      </span>

                      {topic.createdAt && (
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                          {format(new Date(topic.createdAt), "dd/MM/yyyy HH:mm")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{topic.totalItems || topic.items?.length || 0} {t.common.questionsCount}</span>
                    </div>
                  </div>

                  <h3
                    className={`font-headline font-black text-base sm:text-lg line-clamp-2 leading-snug ${
                      isShooter
                        ? "text-cyan-800 dark:text-cyan-300"
                        : isTreasure
                        ? "text-amber-800 dark:text-amber-300"
                        : "text-pink-700 dark:text-pink-300"
                    }`}
                  >
                    {topic.name}
                  </h3>
                </div>

                {/* Sample Questions Thumbnail Strip */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {topic.items?.slice(0, 4).map((item: any) => (
                    <div
                      key={item.id}
                      className={`h-12 rounded-xl border shrink-0 p-1 flex items-center justify-center overflow-hidden gap-1 ${
                        isShooter
                          ? "bg-cyan-50/80 dark:bg-cyan-950/30 border-cyan-200/80 dark:border-cyan-800/60"
                          : isTreasure
                          ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/60"
                          : "bg-pink-50/80 dark:bg-pink-950/30 border-pink-200/80 dark:border-pink-800/60"
                      }`}
                      title={item.word}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.word}
                          className="w-10 h-10 object-contain rounded-lg"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center px-2 max-w-[110px]">
                          <span
                            className={`text-[9px] font-black truncate w-full text-center ${
                              isShooter
                                ? "text-cyan-900 dark:text-cyan-200"
                                : isTreasure
                                ? "text-amber-900 dark:text-amber-200"
                                : "text-pink-900 dark:text-pink-200"
                            }`}
                          >
                            {item.word}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {(topic.totalItems || topic.items?.length || 0) > 4 && (
                    <div
                      className={`w-8 h-12 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                        isShooter
                          ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300"
                          : isTreasure
                          ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                          : "bg-pink-500/20 text-pink-700 dark:text-pink-300"
                      }`}
                    >
                      +{(topic.totalItems || topic.items?.length || 0) - 4}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div
                  className={`pt-3 border-t flex items-center justify-between gap-2 ${
                    isShooter
                      ? "border-cyan-200/50 dark:border-cyan-800/50"
                      : isTreasure
                      ? "border-amber-200/50 dark:border-amber-800/50"
                      : "border-pink-200/50 dark:border-pink-800/50"
                  }`}
                >
                  <a
                    href={playUrl} onClick={() => trackEvent("teacher_my_game_action", { action: "preview", gameType: "quiz", gameTitle: topic.name, gameId: topic.id })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 py-2 px-3 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                      isShooter
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-cyan-500/20"
                        : isTreasure
                        ? "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-amber-500/20"
                        : "bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-pink-500/20"
                    }`}
                    title={t.common.previewTooltip}
                  >
                    <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                    <span>{t.common.preview}</span>
                  </a>

                  <Link
                    href={editUrl}
                    className={`py-2 px-3 font-bold text-xs rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer border bg-slate-50 dark:bg-slate-800 ${
                      isTreasure
                        ? "hover:bg-amber-50 text-amber-800 dark:text-amber-200 border-amber-200/60 dark:border-amber-700"
                        : "hover:bg-pink-50 text-pink-800 dark:text-pink-200 border-pink-200/60 dark:border-pink-700"
                    }`}
                    title={t.common.editTooltip}
                  >
                    <Edit3 className={`w-3.5 h-3.5 shrink-0 ${isTreasure ? "text-amber-600" : "text-pink-600"}`} />
                    <span>{t.common.edit}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(topic.id, topic.name)}
                    disabled={deletingId === topic.id}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 border bg-slate-50 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-400 cursor-pointer disabled:opacity-50 ${
                      isTreasure
                        ? "border-amber-200/60 dark:border-amber-700"
                        : "border-pink-200/60 dark:border-pink-700"
                    }`}
                    title={deletingId === topic.id ? t.common.deletingTooltip : t.common.deleteTooltip}
                  >
                    {deletingId === topic.id ? (
                      <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 stroke-[2]" />
                    )}
                  </button>
                </div>

                {/* Game URL Display & Share Button Row */}
                <div
                  className={`pt-2.5 flex items-center gap-2 border-t ${
                    isTreasure
                      ? "border-amber-200/50 dark:border-amber-800/50"
                      : "border-pink-200/50 dark:border-pink-800/50"
                  }`}
                >
                  <div
                    className={`flex-1 min-w-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                      isTreasure
                        ? "bg-amber-50/60 dark:bg-slate-800/60 border-amber-200/60 dark:border-amber-700/60"
                        : "bg-pink-50/60 dark:bg-slate-800/60 border-pink-200/60 dark:border-pink-700/60"
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      {playUrl}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => { trackEvent("teacher_my_game_action", { action: "share_open", gameType: "quiz", gameTitle: topic.name, gameId: topic.id }); setShareTopic({ ...topic, customGamePath: playUrl }); }}
                    className={`px-3 py-1.5 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0 ${
                      isTreasure
                        ? "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-amber-500/20"
                        : "bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-pink-500/20"
                    }`}
                    title={t.common.shareTooltip}
                  >
                    <Share2 className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>{t.common.share}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share & QR Code Modal */}
      {shareTopic && (
        <MatchGameShareModal
          isOpen={Boolean(shareTopic)}
          onClose={() => setShareTopic(null)}
          topicName={shareTopic.name}
          topicId={shareTopic.id}
          gamePath={shareTopic.customGamePath || "/student/game/candy-quiz"}
        />
      )}
    </div>
  );
}
