"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  Edit3,
  Trash2,
  Plus,
  Layers,
  Share2,
  Link2,
} from "lucide-react";
import {
  ChoiceShooterGame,
  getChoiceShooterGames,
  deleteChoiceShooterGame,
} from "@/lib/choice-shooter-storage";
import {
  ChoiceEggGame,
  getChoiceEggGames,
  deleteChoiceEggGame,
} from "@/lib/choice-egg-storage";
import { ChoiceGameShareModal } from "./ChoiceGameShareModal";
import { toast } from "sonner";

export interface UnifiedGameItem {
  id: string;
  code: string;
  title: string;
  questionCount: number;
  createdAt: string;
  questions: any[];
  gameType: "shooter" | "egg";
}

export function MyChoiceGamesList() {
  const router = useRouter();
  const [games, setGames] = useState<UnifiedGameItem[]>([]);
  const [shareGame, setShareGame] = useState<UnifiedGameItem | null>(null);
  const [loading, setLoading] = useState(true);

  const loadGames = () => {
    const shooters: UnifiedGameItem[] = getChoiceShooterGames().map((g) => ({
      ...g,
      gameType: "shooter" as const,
    }));

    const eggs: UnifiedGameItem[] = getChoiceEggGames().map((g) => ({
      ...g,
      gameType: "egg" as const,
    }));

    // Merge and sort newest first
    const combined = [...shooters, ...eggs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setGames(combined);
    setLoading(false);
  };

  useEffect(() => {
    loadGames();
  }, []);

  const handleDelete = (game: UnifiedGameItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài tập "${game.title}" không?`)) return;

    const ok =
      game.gameType === "egg"
        ? deleteChoiceEggGame(game.id)
        : deleteChoiceShooterGame(game.id);

    if (ok) {
      toast.success(`Đã xóa bài tập "${game.title}"!`);
      loadGames();
    } else {
      toast.error("Không thể xóa bài tập này!");
    }
  };

  const handleCreateNew = () => {
    router.push("/teacher/games/choice-shooter/create");
  };

  const getPlayPath = (game: UnifiedGameItem) => {
    return game.gameType === "egg"
      ? `/game/egg-smash/${game.code}`
      : `/game/shooter/${game.code}`;
  };

  const getEditPath = (game: UnifiedGameItem) => {
    return game.gameType === "egg"
      ? `/teacher/games/choice-egg/create?id=${game.id}`
      : `/teacher/games/choice-shooter/create?id=${game.id}`;
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-emerald-500/10 p-8 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold text-slate-500">
          Đang tải danh sách bài tập Chọn đáp án...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Content Area */}
      {games.length === 0 ? (
        /* Empty State */
        <div className="w-full py-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-emerald-500/10 p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center border border-emerald-200/50 shadow-inner text-2xl font-bold">
            🎯
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="font-headline font-black text-xl text-slate-800 dark:text-white">
              Bạn chưa tạo bài tập Chọn đáp án nào
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Hãy tạo các bài tập Chọn đáp án (Bắn súng, Đập trứng...) để học sinh rèn luyện tính nhẩm tốc độ!
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateNew}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Tạo bài tập mới ngay</span>
          </button>
        </div>
      ) : (
        /* Games Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => {
            const playPath = getPlayPath(game);
            const editPath = getEditPath(game);

            return (
              <div
                key={game.id}
                className="rounded-3xl shadow-md hover:shadow-xl backdrop-blur-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group p-5 gap-4 bg-white dark:bg-slate-900 border border-emerald-300/80 dark:border-emerald-700/80 shadow-emerald-500/5 hover:shadow-emerald-500/15 hover:border-emerald-400"
              >
                {/* Top Header Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {game.gameType === "egg" ? (
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                          🥚 Đập Trứng
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-xs">
                          🎯 Bắn Súng
                        </span>
                      )}

                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {format(new Date(game.createdAt), "dd/MM/yyyy")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{game.questionCount || game.questions?.length || 0} câu</span>
                    </div>
                  </div>

                  <h3 className="font-headline font-black text-lg line-clamp-2 leading-snug text-slate-800 dark:text-white group-hover:text-emerald-600 transition-colors">
                    {game.title}
                  </h3>
                </div>

                {/* Sample Question Chips Strip */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {game.questions?.slice(0, 3).map((q) => (
                    <div
                      key={q.id}
                      className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0 flex items-center gap-1"
                    >
                      <span>{q.q}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black">({q.a})</span>
                    </div>
                  ))}
                  {(game.questions?.length || 0) > 3 && (
                    <span className="px-2 py-1 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] shrink-0">
                      +{(game.questions?.length || 0) - 3}
                    </span>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <Link
                    href={playPath}
                    target="_blank"
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    title="Xem thử bài tập trong tab mới"
                  >
                    <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                    <span>Xem thử</span>
                  </Link>

                  <Link
                    href={editPath}
                    className="py-2 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                    title="Chỉnh sửa bài tập này"
                  >
                    <Edit3 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span>Sửa</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(game)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    title="Xóa bài tập này"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2]" />
                  </button>
                </div>

                {/* Game URL Display & Share Button Row */}
                <div className="pt-2.5 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex-1 min-w-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-slate-50/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700">
                    <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      {playPath}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShareGame(game)}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
                    title="Chia sẻ link làm bài cho học sinh"
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
            className="min-h-[220px] rounded-3xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 dark:bg-slate-900/40 dark:hover:bg-slate-900 transition-all duration-300 flex flex-col items-center justify-center text-center p-6 cursor-pointer group hover:-translate-y-1 shadow-sm hover:shadow-md"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md shadow-emerald-500/30">
              <Plus className="w-7 h-7 stroke-[3]" />
            </div>
            <span className="font-headline font-black text-base text-slate-800 dark:text-white">
              Tạo bài tập mới
            </span>
            <span className="text-xs font-semibold text-slate-400 mt-1">
              Thêm game Chọn đáp án
            </span>
          </div>
        </div>
      )}

      {/* Share Modal Popup */}
      {shareGame && (
        <ChoiceGameShareModal
          isOpen={Boolean(shareGame)}
          onClose={() => setShareGame(null)}
          gameTitle={shareGame.title}
          gameCode={shareGame.code}
          directPath={getPlayPath(shareGame)}
        />
      )}
    </div>
  );
}
