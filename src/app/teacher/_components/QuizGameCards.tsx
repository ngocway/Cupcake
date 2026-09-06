"use client";

import { useState } from "react";
import { Play, Pause, Volume2, VolumeX, Plus } from "lucide-react";
import Link from "next/link";

interface GameCard {
  id: string;
  title: string;
  badge: string;
  badgeBg: string;
  desc: string;
  videoId?: string;
  imageUrl?: string;
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
  },
];

function QuizGameCardItem({ game }: { game: GameCard }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const handlePlayToggle = () => {
    if (game.videoId) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const getHref = () => {
    return `/teacher/games/candy-quiz/create`;
  };

  return (
    <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-primary/10 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col group">
      {/* Top 16:9 Thumbnail Frame */}
      <div className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden shrink-0">
        {isPlaying && game.videoId ? (
          <div className="relative w-full h-full">
            <iframe
              src={`https://www.youtube.com/embed/${game.videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&enablejsapi=1&controls=1`}
              title={game.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            {/* Inline controls overlay */}
            <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
              <button
                onClick={handleMuteToggle}
                className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md text-white flex items-center justify-center transition-all border border-white/20 shadow-md"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={handlePlayToggle}
                className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 backdrop-blur-md text-white flex items-center justify-center transition-all border border-white/20 shadow-md"
                title="Pause Video"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={handlePlayToggle}
            className="relative w-full h-full cursor-pointer group/thumb"
          >
            {/* Cover Image */}
            <img
              src={game.imageUrl || (game.videoId ? `https://img.youtube.com/vi/${game.videoId}/hqdefault.jpg` : "/images/games/flashcard-quiz.png")}
              alt={game.title}
              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/20 to-transparent" />

            {/* Play Button Overlay */}
            {game.videoId && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/90 dark:bg-slate-900/90 text-pink-500 flex items-center justify-center shadow-2xl border-2 border-white/80 group-hover/thumb:scale-115 group-hover/thumb:bg-pink-500 group-hover/thumb:text-white transition-all duration-300">
                  <Play className="w-6 h-6 ml-1 fill-current" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top-left Format Badge */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md ${game.badgeBg}`}>
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
          <h3 className="font-headline font-black text-lg sm:text-xl mb-2 leading-tight text-pink-600 dark:text-pink-400">
            {game.title}
          </h3>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            {game.desc}
          </p>
        </div>

        {/* Footer CTA Button */}
        <Link
          href={getHref()}
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
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
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
          <QuizGameCardItem key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
