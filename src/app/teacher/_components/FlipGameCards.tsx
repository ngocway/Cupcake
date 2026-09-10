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

const FLIP_GAMES: GameCard[] = [
  {
    id: "flip-image-image",
    title: "Lật Ảnh-Ảnh",
    badge: "Ảnh - Ảnh",
    badgeBg: "bg-emerald-500 text-white",
    desc: "Học sinh lật các thẻ bài để tìm và ghép các cặp hình ảnh tương đồng hoặc có mối liên quan trực quan với nhau.",
    videoId: "ZgE2PaGdvFU",
  },
  {
    id: "flip-image-text",
    title: "Lật Ảnh-Chữ",
    badge: "Ảnh - Chữ",
    badgeBg: "bg-orange-500 text-white",
    desc: "Học sinh lật các thẻ bài để tìm và ghép cặp giữa hình ảnh minh họa với từ vựng / câu bằng chữ tương ứng.",
    videoId: "30Ov93AvLwY",
  },
];

function getFlipHref(game: GameCard) {
  if (game.id === "flip-image-image") {
    return "/teacher/games/flip/create?type=image-image";
  }
  return "/teacher/games/flip/create?type=image-text";
}

function FlipGameCardItem({
  game,
  onPlayVideo,
}: {
  game: GameCard;
  onPlayVideo: (videoGame: VideoModalGame) => void;
}) {
  const href = getFlipHref(game);
  const activeGuideVideoId = game.guideVideoId;
  const hasGuide = Boolean(activeGuideVideoId);

  const handleOpenGuide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (hasGuide && onPlayVideo && activeGuideVideoId) {
      onPlayVideo({
        id: game.id,
        title: game.title,
        badge: game.badge,
        badgeBg: game.badgeBg,
        videoId: activeGuideVideoId,
        createHref: href,
      });
    }
  };

  return (
    <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-primary/10 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col group">
      {/* Top 16:9 Thumbnail Frame */}
      <div className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden shrink-0">
        <div
          onClick={hasGuide ? handleOpenGuide : undefined}
          className={`relative w-full h-full ${hasGuide ? "cursor-pointer group/thumb" : ""}`}
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

          {/* Play Button Overlay (Cinema Mode Trigger) - only visible when guide video is available */}
          {hasGuide && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-20 h-20 rounded-full bg-rose-500/30 animate-ping opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="w-16 h-16 rounded-full bg-white/95 dark:bg-slate-900/95 text-rose-500 flex items-center justify-center shadow-2xl border-2 border-white/80 group-hover/thumb:scale-115 group-hover/thumb:bg-rose-500 group-hover/thumb:text-white transition-all duration-300">
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
            <span className="material-symbols-rounded text-[18px]">style</span>
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
      <div className="p-6 flex-1 flex flex-col justify-between bg-white dark:bg-slate-900">
        <div>
          <h3
            className={`font-headline font-black text-lg sm:text-xl mb-2 leading-tight ${
              game.id === "flip-image-image"
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-orange-700 dark:text-orange-300"
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
          className="w-full py-3.5 px-4 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 group/btn text-center"
        >
          <Plus className="w-4 h-4 stroke-[3px] group-hover/btn:rotate-90 transition-transform duration-300" />
          <span>Tạo bài tập</span>
        </Link>
      </div>
    </div>
  );
}

export function FlipGameCards() {
  const [activeVideoGame, setActiveVideoGame] = useState<VideoModalGame | null>(null);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline font-black text-2xl text-slate-800 dark:text-white tracking-tight">
            Tạo Game Lật Ảnh
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Chọn dạng game lật ảnh bạn muốn tạo cho học sinh làm bài
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {FLIP_GAMES.map((game) => (
          <FlipGameCardItem
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
