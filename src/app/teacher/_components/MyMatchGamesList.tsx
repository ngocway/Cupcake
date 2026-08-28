"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  Play, 
  Edit3, 
  Trash2, 
  Plus, 
  Layers, 
  Sparkles, 
  Calendar,
  AlertCircle,
  Puzzle,
  Share2,
  Link2,
  Copy,
  Check,
  Loader2
} from "lucide-react";
import { getTeacherMatchGamesAction, deleteTeacherMatchGameAction } from "@/actions/teacher-match-games";
import { MatchGamePreviewModal, PreviewGameTopic } from "./MatchGamePreviewModal";
import { MatchTextTextPreviewModal } from "./MatchTextTextPreviewModal";
import { MatchGameShareModal } from "./MatchGameShareModal";
import { toast } from "sonner";

export function MyMatchGamesList({ initialTopics }: { initialTopics?: any[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Optimization 3: Browser SessionStorage Cache + Instant Initial State
  const [topics, setTopics] = useState<any[]>(() => {
    if (initialTopics && initialTopics.length >= 0) return initialTopics;
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("cached_teacher_match_games");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (initialTopics && initialTopics.length >= 0) return false;
    if (typeof window !== "undefined" && sessionStorage.getItem("cached_teacher_match_games")) return false;
    return true;
  });

  const [previewTopic, setPreviewTopic] = useState<PreviewGameTopic | null>(null);
  const [shareTopic, setShareTopic] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchGames = async (isBackground = false) => {
    if (!isBackground && topics.length === 0) setLoading(true);
    const res = await getTeacherMatchGamesAction();
    if (res.success && res.topics) {
      setTopics(res.topics);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("cached_teacher_match_games", JSON.stringify(res.topics));
        } catch (e) {}
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    // If initialTopics was provided by server, do silent background revalidation
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
      const updatedTopics = topics.filter(t => t.id !== topicId);
      setTopics(updatedTopics);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("cached_teacher_match_games", JSON.stringify(updatedTopics));
        } catch (e) {}
      }
    } else {
      toast.error(res.error || "Không thể xóa bài tập!");
    }
  };

  const handleCreateNew = () => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("tab", "match");
    router.push(`${pathname}?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-primary/10 p-8 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold text-slate-500">Đang tải danh sách bài tập Nối Cặp...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Content Area */}
      {topics.length === 0 ? (
        /* Empty State */
        <div className="w-full py-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-primary/10 p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center border border-purple-200/50 shadow-inner">
            <Puzzle className="w-8 h-8 stroke-[1.8]" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="font-headline font-black text-xl text-slate-800 dark:text-white">
              Bạn chưa tạo bài tập Nối cặp nào
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Hãy tạo các bộ thẻ Nối Cặp Ảnh - Chữ hoặc Chữ - Chữ đầu tiên để học sinh thực hành!
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-sky-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Tạo bài tập mới ngay</span>
          </button>
        </div>
      ) : (
        /* Games Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => {
            const isConveyorDrop = topic.gameMode === "conveyor-drop" || topic.game?.name?.includes("Băng Chuyền");
            const isImageImage = !isConveyorDrop && topic.isImageImage;
            const isTextText = !isConveyorDrop && !isImageImage && (topic.game?.name?.includes("Chữ - Chữ") || topic.items?.some((i: any) => Boolean(i.labelB && !i.imageUrl && !i.imageBUrl)));
            const isLineDraw = !isConveyorDrop && topic.gameMode === "line";

            const gamePath = isConveyorDrop
              ? "/student/game/conveyor-drop"
              : isLineDraw || isTextText
                ? "/student/game/match-text-text"
                : "/student/game/flashcard-match";

            return (
              <div
                key={topic.id}
                className={`rounded-3xl shadow-md hover:shadow-xl backdrop-blur-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group p-5 gap-4 bg-white dark:bg-slate-900 ${
                  isConveyorDrop
                    ? "border border-cyan-300/80 dark:border-cyan-700/80 shadow-cyan-500/5 hover:shadow-cyan-500/15 hover:border-cyan-400"
                    : isLineDraw
                      ? "border border-violet-300/80 dark:border-violet-700/80 shadow-violet-500/5 hover:shadow-violet-500/15 hover:border-violet-400"
                      : isImageImage
                        ? "border border-emerald-300/80 dark:border-emerald-700/80 shadow-emerald-500/5 hover:shadow-emerald-500/15 hover:border-emerald-400"
                        : isTextText
                          ? "border border-sky-300/80 dark:border-sky-700/80 shadow-sky-500/5 hover:shadow-sky-500/15 hover:border-sky-400"
                          : "border border-orange-300/80 dark:border-orange-700/80 shadow-orange-500/5 hover:shadow-orange-500/15 hover:border-orange-400"
                }`}
              >
                {/* Top Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                        isConveyorDrop
                          ? "bg-cyan-500 text-white shadow-sm shadow-cyan-500/30"
                          : isLineDraw
                            ? "bg-violet-500 text-white shadow-sm shadow-violet-500/30"
                            : isImageImage 
                              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30" 
                              : isTextText
                                ? "bg-sky-500 text-white shadow-sm shadow-sky-500/30" 
                                : "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
                      }`}>
                        {isConveyorDrop ? "Băng Chuyền" : isLineDraw ? "Nối Dây" : isImageImage ? "Ảnh - Ảnh" : isTextText ? "Chữ - Chữ" : "Ảnh - Chữ"}
                      </span>

                      {topic.createdAt && (
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {format(new Date(topic.createdAt), "dd/MM/yyyy HH:mm")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{topic.totalItems || topic.items?.length || 0} cặp thẻ</span>
                    </div>
                  </div>

                  <h3 className={`font-headline font-black text-lg line-clamp-2 leading-snug ${
                    isConveyorDrop
                      ? "text-cyan-700 dark:text-cyan-300"
                      : isLineDraw
                        ? "text-violet-700 dark:text-violet-300"
                        : isImageImage 
                          ? "text-emerald-700 dark:text-emerald-300" 
                          : isTextText
                            ? "text-sky-700 dark:text-sky-300" 
                            : "text-orange-700 dark:text-orange-300"
                  }`}>
                    {topic.name}
                  </h3>
                </div>

                {/* Sample Cards Thumbnail Strip */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {topic.items?.slice(0, 4).map((item: any) => (
                    <div 
                      key={item.id}
                      className={`h-12 rounded-xl border shrink-0 p-1 flex items-center justify-center overflow-hidden gap-1 ${
                        isConveyorDrop
                          ? "bg-cyan-50/80 dark:bg-cyan-950/30 border-cyan-200/80 dark:border-cyan-800/60"
                          : isImageImage 
                            ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60" 
                            : isTextText
                              ? "bg-sky-50/80 dark:bg-sky-950/30 border-sky-200/80 dark:border-sky-800/60"
                              : "bg-orange-50/80 dark:bg-orange-950/30 border-orange-200/80 dark:border-orange-800/60"
                      }`}
                      title={item.word}
                    >
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.word} className="w-10 h-10 object-contain rounded-lg" />
                      ) : (
                        <div className="flex flex-col items-center justify-center px-1">
                          <span className="text-[9px] font-black text-slate-700 dark:text-slate-200 truncate">{item.word}</span>
                          {item.labelB && (
                            <span className="text-[8px] font-bold text-sky-600 dark:text-sky-400 truncate">↔ {item.labelB}</span>
                          )}
                        </div>
                      )}
                      {isImageImage && item.imageBUrl && (
                        <img src={item.imageBUrl} alt="Image B" className="w-10 h-10 object-contain rounded-lg" />
                      )}
                    </div>
                  ))}
                  {(topic.totalItems || topic.items?.length || 0) > 4 && (
                    <div className={`w-8 h-12 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                      isConveyorDrop
                        ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300"
                        : isImageImage 
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" 
                          : isTextText
                            ? "bg-sky-500/20 text-sky-700 dark:text-sky-300"
                            : "bg-orange-500/20 text-orange-700 dark:text-orange-300"
                    }`}>
                      +{(topic.totalItems || topic.items?.length || 0) - 4}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className={`pt-3 border-t flex items-center justify-between gap-2 ${
                  isConveyorDrop
                    ? "border-cyan-200/50 dark:border-cyan-800/50"
                    : isLineDraw
                      ? "border-violet-200/50 dark:border-violet-800/50"
                      : isImageImage 
                        ? "border-emerald-200/50 dark:border-emerald-800/50" 
                        : isTextText
                          ? "border-sky-200/50 dark:border-sky-800/50"
                          : "border-orange-200/50 dark:border-orange-800/50"
                }`}>
                  <a
                    href={`${gamePath}?topicId=${topic.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    title="Chơi thử game trong tab mới"
                  >
                    <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                    <span>Xem thử</span>
                  </a>

                  <Link
                    href={
                      isConveyorDrop
                        ? `/teacher/games/conveyor-drop/create?topicId=${topic.id}`
                        : isImageImage 
                          ? `/teacher/games/match-image-text/create?type=image-image${isLineDraw ? '&gameMode=line' : ''}&topicId=${topic.id}`
                          : isTextText
                            ? `/teacher/games/match-image-text/create?type=text-text&topicId=${topic.id}`
                            : `/teacher/games/match-image-text/create?${isLineDraw ? 'gameMode=line&' : ''}topicId=${topic.id}`
                    }
                    className={`py-2 px-3 font-bold text-xs rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer border ${
                      isConveyorDrop
                        ? "bg-slate-50 dark:bg-slate-800 hover:bg-cyan-50 text-cyan-800 dark:text-cyan-200 border-cyan-200/60 dark:border-cyan-700"
                        : isLineDraw
                          ? "bg-slate-50 dark:bg-slate-800 hover:bg-violet-50 text-violet-800 dark:text-violet-200 border-violet-200/60 dark:border-violet-700"
                          : isImageImage 
                            ? "bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 text-emerald-800 dark:text-emerald-200 border-emerald-200/60 dark:border-emerald-700" 
                            : isTextText
                              ? "bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 text-sky-800 dark:text-sky-200 border-sky-200/60 dark:border-sky-700"
                              : "bg-slate-50 dark:bg-slate-800 hover:bg-orange-50 text-orange-800 dark:text-orange-200 border-orange-200/60 dark:border-orange-700"
                    }`}
                    title="Chỉnh sửa bài tập"
                  >
                    <Edit3 className={`w-3.5 h-3.5 shrink-0 ${isConveyorDrop ? "text-cyan-600" : isLineDraw ? "text-violet-600" : isImageImage ? "text-emerald-600" : isTextText ? "text-sky-600" : "text-orange-600"}`} />
                    <span>Sửa</span>
                  </Link>

                  <button
                    onClick={() => handleDelete(topic.id, topic.name)}
                    disabled={deletingId === topic.id}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 border ${
                      deletingId === topic.id
                        ? "bg-rose-50 dark:bg-rose-950/50 border-rose-200 text-rose-500 cursor-not-allowed opacity-90"
                        : isConveyorDrop
                          ? "bg-slate-50 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-400 border-cyan-200/60 dark:border-cyan-700 cursor-pointer"
                          : isLineDraw
                            ? "bg-slate-50 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-400 border-violet-200/60 dark:border-violet-700 cursor-pointer"
                            : isImageImage
                              ? "bg-slate-50 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-400 border-emerald-200/60 dark:border-emerald-700 cursor-pointer"
                              : "bg-slate-50 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-400 border-orange-200/60 dark:border-orange-700 cursor-pointer"
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
                <div className={`pt-2.5 flex items-center gap-2 border-t ${
                  isConveyorDrop
                    ? "border-cyan-200/50 dark:border-cyan-800/50"
                    : isLineDraw
                      ? "border-violet-200/50 dark:border-violet-800/50"
                      : isImageImage 
                        ? "border-emerald-200/50 dark:border-emerald-800/50" 
                        : "border-orange-200/50 dark:border-orange-800/50"
                }`}>
                  <div className={`flex-1 min-w-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                    isConveyorDrop
                      ? "bg-cyan-50/60 dark:bg-slate-800/60 border-cyan-200/60 dark:border-cyan-700/60"
                      : isLineDraw
                        ? "bg-violet-50/60 dark:bg-slate-800/60 border-violet-200/60 dark:border-violet-700/60"
                        : isImageImage 
                          ? "bg-emerald-50/60 dark:bg-slate-800/60 border-emerald-200/60 dark:border-emerald-700/60" 
                          : "bg-orange-50/60 dark:bg-slate-800/60 border-orange-200/60 dark:border-orange-700/60"
                  }`}>
                    <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      {`${gamePath}?topicId=${topic.id}`}
                    </span>
                  </div>

                  <button
                    onClick={() => setShareTopic({ ...topic, customGamePath: gamePath })}
                    className="px-3 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
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
              Thêm game Nối Cặp
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
          gamePath={
            shareTopic.customGamePath ||
            (shareTopic.gameMode === "conveyor-drop" || shareTopic.game?.name?.includes("Băng Chuyền")
              ? "/student/game/conveyor-drop"
              : shareTopic.gameMode === "line" || (!shareTopic.isImageImage && shareTopic.game?.name?.includes("Chữ - Chữ"))
                ? "/student/game/match-text-text"
                : "/student/game/flashcard-match")
          }
        />
      )}

      {/* Preview Modal */}
      {previewTopic && (
        <MatchGamePreviewModal
          topic={previewTopic}
          onClose={() => setPreviewTopic(null)}
        />
      )}
    </div>
  );
}
