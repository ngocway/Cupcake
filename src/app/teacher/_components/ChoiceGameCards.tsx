"use client";

import { useState } from "react";
import { Play, Plus, Video } from "lucide-react";
import Link from "next/link";
import { GameVideoModal, VideoModalGame } from "./GameVideoModal";

interface GameCard {
  id: string;
  title: string;
  badge: string;
  badgeBg: string;
  desc: string;
  videoId: string;
  guideVideoId?: string;
  imageUrl?: string;
}

const CHOICE_GAMES: GameCard[] = [
  {
    id: "shooter",
    title: "Bắn Súng Toán Học",
    badge: "BẮN SÚNG",
    badgeBg: "bg-emerald-500 text-white",
    desc: "Học sinh điều khiển tháp pháo bắn phá các khối cầu mang đáp án đúng để ghi điểm và tích lũy combo trong không gian Neon Sci-Fi.",
    videoId: "vyQ8QBQ1m4E",
  },
  {
    id: "egg-crack",
    title: "Đập Trứng Toán Học",
    badge: "ĐẬP TRỨNG",
    badgeBg: "bg-amber-500 text-white",
    desc: "Học sinh đập vỡ các quả trứng mang đáp án đúng để tích lũy xu thưởng, nhân sao và chinh phục bảng xếp hạng.",
    videoId: "R6fn9PnMmog",
  },
];

function getChoiceHref(game: GameCard) {
  if (game.id === "egg-crack") {
    return "/teacher/games/choice-egg/create";
  }
  return "/teacher/games/choice-shooter/create";
}

function ChoiceGameCardItem({
  game,
  onPlayVideo,
}: {
  game: GameCard;
  onPlayVideo: (videoGame: VideoModalGame) => void;
}) {
  const href = getChoiceHref(game);
  const hasVideo = Boolean(game.videoId);
  const activeGuideVideoId = game.guideVideoId;
  const hasGuide = Boolean(activeGuideVideoId);

  const handleOpenDemo = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (hasVideo && onPlayVideo && game.videoId) {
      onPlayVideo({
        id: game.id,
        title: game.title,
        badge: game.badge,
        badgeBg: game.badgeBg,
        videoId: game.videoId,
        createHref: href,
        videoType: "demo",
      });
    }
  };

  const handleOpenGuide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (hasGuide && onPlayVideo && activeGuideVideoId) {
      onPlayVideo({
        id: game.id,
        title: `${game.title} (Hướng dẫn tạo bài)`,
        badge: "HƯỚNG DẪN",
        badgeBg: "bg-gradient-to-r from-sky-500 to-blue-600 text-white",
        videoId: activeGuideVideoId,
        createHref: href,
        videoType: "guide",
      });
    }
  };

  return (
    <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-primary/10 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col group">
      {/* Top 16:9 Thumbnail Frame */}
      <div className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden shrink-0">
        <div
          onClick={hasVideo ? handleOpenDemo : undefined}
          className={`relative w-full h-full ${hasVideo ? "cursor-pointer group/thumb" : ""}`}
          title={hasVideo ? "Xem video giới thiệu game" : undefined}
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
            className="w-full h-full object-cover scale-[1.18] group-hover/thumb:scale-[1.25] transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/20 to-transparent" />

          {/* Play Button Overlay (Cinema Mode Trigger) - only visible when demo video is available */}
          {hasVideo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-20 h-20 rounded-full bg-emerald-500/30 animate-ping opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="w-16 h-16 rounded-full bg-white/95 dark:bg-slate-900/95 text-emerald-500 flex items-center justify-center shadow-2xl border-2 border-white/80 group-hover/thumb:scale-115 group-hover/thumb:bg-emerald-500 group-hover/thumb:text-white transition-all duration-300">
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

        {/* Bottom-right Guide Button */}
        <div className="absolute bottom-3 right-3 z-20">
          {hasGuide ? (
            <button
              type="button"
              onClick={handleOpenGuide}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-500 hover:bg-white text-white hover:text-sky-600 border-2 border-sky-500 text-xs font-bold shadow-md shadow-sky-500/30 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 group/guide"
              title="Xem video hướng dẫn"
            >
              <Video className="w-3.5 h-3.5 text-white group-hover/guide:text-sky-600 transition-colors" />
              <span>Hướng dẫn</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-500/30 text-white/60 border border-sky-500/30 text-xs font-medium shadow-sm cursor-not-allowed opacity-80 select-none"
              title="Chưa có video hướng dẫn (Sắp cập nhật)"
            >
              <Video className="w-3.5 h-3.5 text-white/40" />
              <span>Hướng dẫn</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Content Container */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-white dark:bg-slate-900">
        <div>
          <h3 className="font-headline font-black text-base sm:text-lg mb-1.5 leading-snug line-clamp-2 text-emerald-700 dark:text-emerald-300">
            {game.title}
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">
            {game.desc}
          </p>
        </div>

        {/* Footer CTA Button */}
        <Link
          href={href}
          prefetch={true}
          className="w-full py-3 px-3.5 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 group/btn text-center"
        >
          <Plus className="w-4 h-4 stroke-[3px] group-hover/btn:rotate-90 transition-transform duration-300" />
          <span>Tạo bài tập</span>
        </Link>
      </div>
    </div>
  );
}

export function ChoiceGameCards() {
  const [activeVideoGame, setActiveVideoGame] = useState<VideoModalGame | null>(null);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline font-black text-2xl text-slate-800 dark:text-white tracking-tight">
            Tạo Game Chọn Đáp Án
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Chọn dạng game chọn đáp án bạn muốn tạo cho học sinh làm bài
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
        {CHOICE_GAMES.map((game) => (
          <ChoiceGameCardItem
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
