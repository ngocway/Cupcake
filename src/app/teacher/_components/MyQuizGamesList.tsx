"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Edit3,
  Trash2,
  Plus,
  Layers,
  Loader2,
  Play,
  Share2,
  Link2,
} from "lucide-react";
import { getTeacherQuizGamesAction } from "@/actions/candy-quiz-actions";
import { deleteTeacherMatchGameAction } from "@/actions/teacher-match-games";
import { MatchGameShareModal } from "./MatchGameShareModal";
import { toast } from "sonner";

export function MyQuizGamesList({ initialTopics }: { initialTopics?: any[] }) {
  const router = useRouter();

  const [topics, setTopics] = useState<any[]>(() => {
    if (initialTopics && initialTopics.length >= 0) return initialTopics;
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("cached_teacher_quiz_games");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (initialTopics && initialTopics.length >= 0) return false;
    if (typeof window !== "undefined" && sessionStorage.getItem("cached_teacher_quiz_games"))
      return false;
    return true;
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [shareTopic, setShareTopic] = useState<any | null>(null);

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
    fetchGames(Boolean(initialTopics && initialTopics.length >= 0));
  }, [initialTopics]);

  const handleDelete = async (topicId: string, topicName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài tập "${topicName}" không?`)) return;

    setDeletingId(topicId);
    const toastId = toast.loading(`Đang xử lý xóa bài tập "${topicName}"...`);
    const res = await deleteTeacherMatchGameAction(topicId);
    toast.dismiss(toastId);
    setDeletingId(null);

    if (res.success) {
      toast.success(`Đã xóa bài tập "${topicName}" thành công!`);
      const updatedTopics = topics.filter((t) => t.id !== topicId);
      setTopics(updatedTopics);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("cached_teacher_quiz_games", JSON.stringify(updatedTopics));
        } catch (e) {}
      }
    } else {
      toast.error(res.error || "Không thể xóa bài tập!");
    }
  };

  const handleCreateNew = () => {
    router.push("/teacher?tab=quiz");
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-primary/10 p-8 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold text-slate-500">Đang tải danh sách bài tập Trắc nghiệm...</span>
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
              Bạn chưa tạo bài tập Trắc nghiệm nào
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Hãy tạo bài tập Trắc nghiệm đầu tiên (Kẹo Ngọt hoặc Truy tìm Kho báu) để học sinh ôn luyện với giao diện hấp dẫn!
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateNew}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-pink-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tạo bài tập mới</span>
          </button>
        </div>
      ) : (
        /* Topics Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => {
            const isTreasure = topic.gameMode === "treasure-hunt";
            const isShooter = topic.gameMode === "shooter-quiz";
            const gameTitle = isShooter ? "Bắn súng Trắc nghiệm" : isTreasure ? "Truy tìm Kho báu" : "Trắc nghiệm Kẹo Ngọt";
            const playUrl = isShooter ? `/game/shooter-quiz?topicId=${topic.id}` : isTreasure ? `/game/treasure-grid?topicId=${topic.id}` : `/student/game/candy-quiz?topicId=${topic.id}`;
            const editUrl = isShooter ? `/teacher/games/shooter-quiz/create?topicId=${topic.id}` : isTreasure ? `/teacher/games/treasure-hunt/create?topicId=${topic.id}` : `/teacher/games/candy-quiz/create?topicId=${topic.id}`;

            return (
              <div
                key={topic.id}
                className={`rounded-3xl shadow-md hover:shadow-xl backdrop-blur-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group p-5 gap-4 bg-white dark:bg-slate-900 border ${
                  isShooter
                    ? "border-cyan-200/80 dark:border-cyan-800/60 shadow-cyan-500/5 hover:shadow-cyan-500/15 hover:border-cyan-400"
                    : isTreasure
                    ? "border-amber-200/80 dark:border-amber-800/60 shadow-amber-500/5 hover:shadow-amber-500/15 hover:border-amber-400"
                    : "border-pink-200/80 dark:border-pink-800/60 shadow-pink-500/5 hover:shadow-pink-500/15 hover:border-pink-400"
                }`}
              >
                {/* Top Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-white shadow-sm ${
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
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {format(new Date(topic.createdAt), "dd/MM/yyyy HH:mm")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{topic.totalItems || topic.items?.length || 0} câu</span>
                    </div>
                  </div>

                  <h3
                    className={`font-headline font-black text-lg line-clamp-2 leading-snug ${
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
                    href={playUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 py-2 px-3 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                      isShooter
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-cyan-500/20"
                        : isTreasure
                        ? "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-amber-500/20"
                        : "bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-pink-500/20"
                    }`}
                    title="Chơi thử game trong tab mới"
                  >
                    <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                    <span>Xem thử</span>
                  </a>

                  <Link
                    href={editUrl}
                    className={`py-2 px-3 font-bold text-xs rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer border bg-slate-50 dark:bg-slate-800 ${
                      isTreasure
                        ? "hover:bg-amber-50 text-amber-800 dark:text-amber-200 border-amber-200/60 dark:border-amber-700"
                        : "hover:bg-pink-50 text-pink-800 dark:text-pink-200 border-pink-200/60 dark:border-pink-700"
                    }`}
                    title="Chỉnh sửa bài tập"
                  >
                    <Edit3 className={`w-3.5 h-3.5 shrink-0 ${isTreasure ? "text-amber-600" : "text-pink-600"}`} />
                    <span>Sửa</span>
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
                    title={deletingId === topic.id ? "Đang xóa bài tập..." : "Xóa bài tập này"}
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
                    onClick={() => setShareTopic({ ...topic, customGamePath: playUrl })}
                    className={`px-3 py-1.5 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0 ${
                      isTreasure
                        ? "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-amber-500/20"
                        : "bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-pink-500/20"
                    }`}
                    title="Chia sẻ bài tập & mã QR cho học sinh"
                  >
                    <Share2 className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>Chia sẻ</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add New Game Card (Last item in grid) */}
          <div
            onClick={handleCreateNew}
            className="min-h-[220px] rounded-3xl border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/40 hover:bg-sky-50 dark:bg-slate-900/40 dark:hover:bg-slate-900 transition-all duration-300 flex flex-col items-center justify-center text-center p-6 cursor-pointer group hover:-translate-y-1 shadow-sm hover:shadow-md"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md shadow-sky-500/30">
              <Plus className="w-7 h-7 stroke-[3]" />
            </div>
            <span className="font-headline font-black text-base text-slate-800 dark:text-white">
              Tạo bài tập mới
            </span>
            <span className="text-xs font-semibold text-slate-400 mt-1">
              Chọn game Kẹo Ngọt hoặc Truy tìm Kho báu
            </span>
          </div>
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
