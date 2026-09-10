"use client";

import { useState } from "react";
import { Video } from "lucide-react";
import { GameVideoModal, VideoModalGame } from "./GameVideoModal";

export interface TeacherGameGuideButtonProps {
  game: {
    id: string;
    title: string;
    badge: string;
    badgeBg: string;
    videoId?: string;
    createHref?: string;
  };
  className?: string;
}

export function TeacherGameGuideButton({ game, className = "" }: TeacherGameGuideButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasVideo = Boolean(game.videoId);

  const videoModalData: VideoModalGame = {
    id: game.id,
    title: game.title,
    badge: game.badge,
    badgeBg: game.badgeBg,
    videoId: game.videoId || "",
    createHref: game.createHref || "",
  };

  return (
    <>
      {hasVideo ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`h-11 px-4 rounded-2xl bg-sky-500 hover:bg-white dark:hover:bg-slate-900 text-white hover:text-sky-600 dark:hover:text-sky-400 border-2 border-sky-500 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/20 transition-all duration-200 active:scale-95 cursor-pointer shrink-0 group/guide ${className}`}
          title="Xem video hướng dẫn tạo bài tập"
        >
          <div className="w-6 h-6 rounded-lg bg-white/20 group-hover/guide:bg-sky-500/15 text-white group-hover/guide:text-sky-600 dark:group-hover/guide:text-sky-400 flex items-center justify-center transition-colors">
            <Video className="w-3.5 h-3.5" />
          </div>
          <span>Hướng dẫn</span>
        </button>
      ) : (
        <button
          type="button"
          disabled
          className={`h-11 px-4 rounded-2xl bg-sky-500/30 dark:bg-sky-950/30 border-2 border-sky-500/30 dark:border-sky-800/30 text-white/60 dark:text-white/40 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-not-allowed opacity-75 select-none shrink-0 ${className}`}
          title="Chưa có video hướng dẫn (Sắp cập nhật)"
        >
          <div className="w-6 h-6 rounded-lg bg-white/10 text-white/50 flex items-center justify-center">
            <Video className="w-3.5 h-3.5" />
          </div>
          <span>Hướng dẫn</span>
        </button>
      )}

      {/* Cinema Mode Popup */}
      {hasVideo && isOpen && (
        <GameVideoModal
          game={videoModalData}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
