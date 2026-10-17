"use client";

import React, { useState, useEffect } from "react";
import { X, MessageCircle, ExternalLink } from "lucide-react";

interface FloatingZaloWidgetProps {
  zaloGroupUrl?: string | null;
  classNameTitle?: string;
  isQuizActive?: boolean;
}

export function FloatingZaloWidget({
  zaloGroupUrl,
  classNameTitle = "Hỗ trợ lớp học",
  isQuizActive = false,
}: FloatingZaloWidgetProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    // Check if dismissed in this session
    try {
      const dismissed = sessionStorage.getItem("zalo_widget_dismissed");
      if (dismissed === "true") {
        setIsDismissed(true);
      }
    } catch {}
  }, []);

  if (!hasMounted || !zaloGroupUrl || isDismissed) {
    return null;
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDismissed(true);
    try {
      sessionStorage.setItem("zalo_widget_dismissed", "true");
    } catch {}
  };

  return (
    <aside
      aria-label="Hỗ trợ qua Zalo"
      className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center select-none transition-all duration-300 font-['Baloo_2',_'Nunito',_sans-serif] ${
        isQuizActive ? "opacity-45 hover:opacity-100 scale-90" : "opacity-100"
      }`}
    >
      {/* Tooltip / Expanded Bubble on Desktop */}
      <div
        className={`hidden sm:flex items-center gap-2 mr-2.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 border border-blue-200/80 dark:border-blue-900/80 shadow-lg shadow-blue-500/10 backdrop-blur-md transition-all duration-300 pointer-events-none ${
          isHovered
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-3 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-[#0068FF] animate-pulse" />
        <div className="flex flex-col text-left leading-tight">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#0068FF]">
            Nhóm Zalo hỗ trợ
          </span>
          <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
            {classNameTitle}
          </span>
        </div>
        <ExternalLink className="w-3 h-3 text-[#0068FF] shrink-0 ml-0.5" />
      </div>

      {/* Main Floating Zalo Button Container */}
      <div 
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Dismiss Button (nút X thu gọn) */}
        <button
          type="button"
          onClick={handleDismiss}
          title="Tạm ẩn icon Zalo"
          aria-label="Tạm ẩn icon Zalo"
          className="absolute -top-1 -left-1 z-10 w-5 h-5 rounded-full bg-slate-700/90 hover:bg-rose-500 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all shadow-md cursor-pointer hover:scale-110 active:scale-95"
        >
          <X className="w-3 h-3 stroke-[2.5px]" />
        </button>

        {/* Zalo Link Anchor */}
        <a
          href={zaloGroupUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Tham gia nhóm Zalo: ${classNameTitle}`}
          className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#0055D4] via-[#0068FF] to-[#2684FF] text-white shadow-xl shadow-slate-900/20 hover:shadow-2xl border-2 border-white/90 dark:border-slate-800 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        >
          {/* Zalo Vector Icon */}
          <svg
            className="w-9 h-9 sm:w-11 sm:h-11 fill-white drop-shadow-xs transition-transform group-hover:scale-105"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Zalo speech bubble silhouette */}
            <path
              d="M48.5 12C28.3 12 12 26.5 12 44.5c0 10.3 5.4 19.5 14 25.4-1.2 5.1-3.6 11.2-6.5 15.3-.6.9-.1 2 .9 2 .4 0 .9-.1 1.2-.3 7.8-4.5 15.4-7.4 19.8-8.9 2.3.4 4.7.6 7.1.6 20.2 0 36.5-14.5 36.5-32.5S68.7 12 48.5 12z"
              fill="currentColor"
              opacity="0.22"
            />
            <text
              x="50%"
              y="59%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontFamily="'Nunito', 'Segoe UI', Arial, sans-serif"
              fontWeight="900"
              fontSize="36"
              letterSpacing="-1.5"
            >
              Zalo
            </text>
          </svg>
        </a>
      </div>
    </aside>
  );
}
