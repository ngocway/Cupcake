"use client";

import { useEffect, useState, useTransition } from "react";
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
  Puzzle
} from "lucide-react";
import { getTeacherMatchGamesAction, deleteTeacherMatchGameAction } from "@/actions/teacher-match-games";
import { MatchGamePreviewModal, PreviewGameTopic } from "./MatchGamePreviewModal";
import { toast } from "sonner";

export function MyMatchGamesList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewTopic, setPreviewTopic] = useState<PreviewGameTopic | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchGames = async () => {
    setLoading(true);
    const res = await getTeacherMatchGamesAction();
    if (res.success && res.topics) {
      setTopics(res.topics);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleDelete = async (topicId: string, topicName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài tập "${topicName}" không?`)) return;

    setDeletingId(topicId);
    const res = await deleteTeacherMatchGameAction(topicId);
    setDeletingId(null);

    if (res.success) {
      toast.success(`Đã xóa bài tập "${topicName}"!`);
      setTopics(topics.filter(t => t.id !== topicId));
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
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Tạo bài tập mới ngay</span>
          </button>
        </div>
      ) : (
        /* Games Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group p-5 gap-4"
            >
              {/* Top Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/50">
                    {topic.game?.name || "Game Nối Cặp"}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{topic.items?.length || 0} cặp thẻ</span>
                  </div>
                </div>

                <h3 className="font-headline font-black text-lg text-slate-800 dark:text-white line-clamp-2 leading-snug">
                  {topic.name}
                </h3>
              </div>

              {/* Sample Cards Thumbnail Strip */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {topic.items?.slice(0, 4).map((item: any) => (
                  <div 
                    key={item.id}
                    className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shrink-0 p-1 flex items-center justify-center overflow-hidden"
                    title={item.word}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.word} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[9px] font-black text-slate-500 truncate">{item.word}</span>
                    )}
                  </div>
                ))}
                {(topic.items?.length || 0) > 4 && (
                  <div className="w-8 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 font-bold text-xs flex items-center justify-center shrink-0">
                    +{(topic.items?.length || 0) - 4}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setPreviewTopic(topic)}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Xem và chơi thử game"
                >
                  <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>Xem thử</span>
                </button>

                <Link
                  href="/teacher/games/match-image-text/create"
                  className="py-2 px-3 bg-slate-100 hover:bg-purple-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer border border-slate-200/60 dark:border-slate-700"
                  title="Chỉnh sửa bài tập"
                >
                  <Edit3 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Sửa</span>
                </Link>

                <button
                  onClick={() => handleDelete(topic.id, topic.name)}
                  disabled={deletingId === topic.id}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-400 flex items-center justify-center transition-all cursor-pointer shrink-0 border border-slate-200/60 dark:border-slate-700"
                  title="Xóa bài tập này"
                >
                  <Trash2 className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
            </div>
          ))}

          {/* Add New Game Card (Last item in grid) */}
          <div
            onClick={handleCreateNew}
            className="min-h-[220px] rounded-3xl border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/40 hover:bg-purple-50 dark:bg-slate-900/40 dark:hover:bg-slate-900 transition-all duration-300 flex flex-col items-center justify-center text-center p-6 cursor-pointer group hover:-translate-y-1 shadow-sm hover:shadow-md"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md shadow-purple-600/30">
              <Plus className="w-7 h-7 stroke-[3]" />
            </div>
            <span className="font-headline font-black text-base text-slate-800 dark:text-white">
              Tạo bài tập mới
            </span>
            <span className="text-xs font-semibold text-slate-400 mt-1">
              Thêm game Nối Cặp Ảnh - Chữ
            </span>
          </div>
        </div>
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
