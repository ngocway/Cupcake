"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { GameVideoModal, VideoModalGame } from "@/app/teacher/_components/GameVideoModal";
import { useTeacherLocale } from "@/i18n/teacher-locale";

export interface GameDemoVideoButtonProps {
  gameId: string;
  titleVi: string;
  titleEn: string;
  badgeVi: string;
  badgeEn: string;
  badgeBg?: string;
  videoId: string;
  className?: string;
}

export function GameDemoVideoButton({
  gameId,
  titleVi,
  titleEn,
  badgeVi,
  badgeEn,
  badgeBg = "bg-gradient-to-r from-sky-500 to-blue-600 text-white",
  videoId,
  className = "",
}: GameDemoVideoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { locale } = useTeacherLocale();
  const isVi = locale !== "en";

  if (!videoId) return null;

  const videoModalData: VideoModalGame = {
    id: gameId,
    title: isVi ? titleVi : titleEn,
    badge: isVi ? badgeVi : badgeEn,
    badgeBg,
    videoId,
    createHref: "",
    videoType: "demo",
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 border border-sky-200/90 dark:border-sky-800 text-sky-600 dark:text-sky-300 font-extrabold text-[11px] shadow-2xs hover:shadow-sm transition-all duration-150 active:scale-95 cursor-pointer shrink-0 group/demo ${className}`}
        title={isVi ? `Xem video mẫu: ${titleVi}` : `Watch demo video: ${titleEn}`}
      >
        <span className="w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center group-hover/demo:scale-110 transition-transform">
          <Play className="w-2.5 h-2.5 ml-0.5 fill-current" />
        </span>
        <span>{isVi ? "Xem game mẫu" : "Watch Demo"}</span>
      </button>

      {isOpen && (
        <GameVideoModal
          game={videoModalData}
          hideCreateButton
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
