"use client";

import { useState } from "react";
import { Play, Plus } from "lucide-react";
import Link from "next/link";
import { GameVideoModal, VideoModalGame } from "./GameVideoModal";

interface GameCard {
  id: string;
  title: string;
  badge: string;
  badgeBg: string;
  desc: string;
  videoId?: string;
  imageUrl?: string;
  createHref?: string;
  titleColor?: string;
}

const QUIZ_GAMES: GameCard[] = [
  {
    id: "candy-quiz",
    title: "Trắc nghiệm Kẹo Ngọt",
    badge: "KẸO NGỌT",
    badgeBg: "bg-gradient-to-r from-pink-500 to-rose-500 text-white",
    desc: "Học sinh tham gia trả lời các câu hỏi và 4 đáp án dạng câu văn dài trên giao diện Xứ sở Kẹo Ngọt (Candy World) đầy màu sắc và âm thanh vui nhộn.",
    imageUrl: "/images/games/candy-quiz.jpg",
    videoId: "swQq7b0V68E",
    createHref: "/teacher/games/candy-quiz/create",
    titleColor: "text-pink-600 dark:text-pink-400",
  },
  {
    id: "treasure-hunt",
    title: "Truy tìm Kho báu",
    badge: "KHO BÁU",
    badgeBg: "bg-gradient-to-r from-amber-500 to-yellow-600 text-white",
    desc: "Học sinh tham gia trả lời các câu hỏi trắc nghiệm để mở khóa các ô bí ẩn trên bản đồ hải tặc kỳ bí và thu thập các rương vàng quý giá.",
    imageUrl: "/games/mystery-treasure-grid-assets/assets/webp/background-stage.webp",
    createHref: "/teacher/games/treasure-hunt/create",
    titleColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "shooter-quiz",
    title: "Bắn súng Trắc nghiệm",
    badge: "BẮN SÚNG",
    badgeBg: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white",
    desc: "Học sinh điều khiển nòng pháo không gian, bắn đạn laser neon vào các quả cầu năng lượng chứa đáp án đúng giữa vũ trụ huyền ảo.",
    imageUrl: "/images/games/shooter-quiz.jpg",
    videoId: "eWAlcTjJvrU",
    createHref: "/teacher/games/shooter-quiz/create",
    titleColor: "text-cyan-600 dark:text-cyan-400",
  },
];

function QuizGameCardItem({
  game,
  onPlayVideo,
}: {
  game: GameCard;
  onPlayVideo?: (videoGame: VideoModalGame) => void;
}) {
  const href = game.createHref || `/teacher/games/${game.id}/create`;
  const hasVideo = Boolean(game.videoId);

  return (
    <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-primary/10 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col group">
      {/* Top 16:9 Thumbnail Frame */}
      <div className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden shrink-0">
        <div
          onClick={() => {
            if (hasVideo && onPlayVideo && game.videoId) {
              onPlayVideo({
                id: game.id,
                title: game.title,
                badge: game.badge,
                badgeBg: game.badgeBg,
                videoId: game.videoId,
                createHref: href,
              });
            }
          }}
          className={`relative w-full h-full ${hasVideo ? "cursor-pointer group/thumb" : ""}`}
        >
          {/* Cover Image (Prioritize YouTube HD maxresdefault, fallback to hqdefault, then default image) */}
          <img
            src={
              game.videoId
                ? `https://img.youtube.com/vi/${game.videoId}/maxresdefault.jpg`
                : (game.imageUrl || "/images/games/flashcard-quiz.png")
            }
            onError={(e) => {
              const target = e.currentTarget;
              if (game.videoId && !target.dataset.fallback) {
                target.dataset.fallback = "1";
                target.src = `https://img.youtube.com/vi/${game.videoId}/hqdefault.jpg`;
              } else if (game.imageUrl && target.src !== game.imageUrl) {
                target.src = game.imageUrl;
              }
            }}
            alt={game.title}
            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/20 to-transparent" />

          {/* Play Button Overlay (Cinema Mode Trigger) */}
          {hasVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                {/* Outer pulsing ring on hover */}
                <div className="absolute w-20 h-20 rounded-full bg-pink-500/30 dark:bg-cyan-500/30 animate-ping opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="w-16 h-16 rounded-full bg-white/95 dark:bg-slate-900/95 text-pink-600 dark:text-cyan-400 flex items-center justify-center shadow-2xl border-2 border-white/80 group-hover/thumb:scale-115 group-hover/thumb:bg-gradient-to-tr group-hover/thumb:from-pink-500 group-hover/thumb:to-rose-600 group-hover/thumb:text-white transition-all duration-300">
                  <Play className="w-7 h-7 ml-1 fill-current" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top-left Format Badge */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md ${game.badgeBg}`}
          >
            {game.badge}
          </span>
        </div>

        {/* Top-right Game Icon */}
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-slate-900/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-md">
            <span className="material-symbols-rounded text-[18px]">sports_esports</span>
          </div>
        </div>
      </div>

      {/* Bottom Content Container */}
      <div className="p-6 flex-1 flex flex-col justify-between bg-white dark:bg-slate-900">
        <div>
          <h3
            className={`font-headline font-black text-lg sm:text-xl mb-2 leading-tight ${
              game.titleColor || "text-pink-600 dark:text-pink-400"
            }`}
          >
            {game.title}
          </h3>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            {game.desc}
          </p>
        </div>

        {/* Footer CTA Button */}
        <Link
          href={href}
          prefetch={true}
          className="w-full py-3.5 px-4 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 group/btn text-center"
        >
          <Plus className="w-4 h-4 stroke-[3px] group-hover/btn:rotate-90 transition-transform duration-300" />
          <span>Tạo bài tập</span>
        </Link>
      </div>
    </div>
  );
}

export function QuizGameCards() {
  const [activeVideoGame, setActiveVideoGame] = useState<VideoModalGame | null>(null);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline font-black text-2xl text-slate-800 dark:text-white tracking-tight">
            Tạo Game Trắc Nghiệm
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Chọn dạng game trắc nghiệm bạn muốn tạo cho học sinh làm bài
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {QUIZ_GAMES.map((game) => (
          <QuizGameCardItem
            key={game.id}
            game={game}
            onPlayVideo={(vg) => setActiveVideoGame(vg)}
          />
        ))}
      </div>

      {/* Reusable Cinema Video Modal */}
      <GameVideoModal
        game={activeVideoGame}
        onClose={() => setActiveVideoGame(null)}
      />
    </div>
  );
}
