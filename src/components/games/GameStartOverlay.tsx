"use client";

import React, { useState, useEffect } from "react";
import { Play, Volume2, ArrowLeft, Sparkles } from "lucide-react";

interface GameStartOverlayProps {
  isOpen: boolean;
  title: string;
  gameMode?: string | null;
  ageGroup?: string | null;
  questionCount?: number;
  thumbnailUrl?: string | null;
  onStart: () => void;
  onClose?: () => void;
}

export function GameStartOverlay({
  isOpen,
  title,
  gameMode = "game",
  ageGroup,
  questionCount,
  thumbnailUrl,
  onStart,
  onClose,
}: GameStartOverlayProps) {
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen) return null;

  const mode = (gameMode || "game").toLowerCase();

  // Mode-based Theme configuration
  const getTheme = () => {
    if (mode.includes("candy")) {
      return {
        bgGradient: "from-pink-900/90 via-purple-950/95 to-sky-950/90",
        accent: "from-pink-500 via-rose-500 to-amber-400",
        glowColor: "rgba(244, 63, 94, 0.6)",
        badgeBg: "bg-pink-500/20 border-pink-400/40 text-pink-300",
        icon: "🍬",
        typeLabel: "Trắc Nghiệm Kẹo Ngọt",
      };
    }
    if (mode.includes("treasure")) {
      return {
        bgGradient: "from-amber-950/90 via-slate-950/95 to-sky-950/90",
        accent: "from-amber-400 via-yellow-500 to-orange-500",
        glowColor: "rgba(245, 158, 11, 0.6)",
        badgeBg: "bg-amber-500/20 border-amber-400/40 text-amber-300",
        icon: "🗺️",
        typeLabel: "Truy Tìm Kho Báu",
      };
    }
    if (mode.includes("egg")) {
      return {
        bgGradient: "from-emerald-950/90 via-slate-950/95 to-amber-950/90",
        accent: "from-amber-400 via-emerald-500 to-teal-500",
        glowColor: "rgba(16, 185, 129, 0.6)",
        badgeBg: "bg-emerald-500/20 border-emerald-400/40 text-emerald-300",
        icon: "🥚",
        typeLabel: "Đập Trứng Chọn Đáp Án",
      };
    }
    if (mode.includes("flip")) {
      return {
        bgGradient: "from-blue-950/90 via-indigo-950/95 to-cyan-950/90",
        accent: "from-cyan-400 via-blue-500 to-indigo-500",
        glowColor: "rgba(6, 182, 212, 0.6)",
        badgeBg: "bg-cyan-500/20 border-cyan-400/40 text-cyan-300",
        icon: "🌊",
        typeLabel: "Lật Thẻ Trí Nhớ Đại Dương",
      };
    }
    if (mode.includes("train")) {
      return {
        bgGradient: "from-teal-950/90 via-slate-950/95 to-emerald-950/90",
        accent: "from-teal-400 via-emerald-500 to-cyan-500",
        glowColor: "rgba(20, 184, 166, 0.6)",
        badgeBg: "bg-teal-500/20 border-teal-400/40 text-teal-300",
        icon: "🚂",
        typeLabel: "Đoàn Tàu Từ Vựng",
      };
    }
    if (mode.includes("rope") || mode.includes("tree")) {
      return {
        bgGradient: "from-emerald-950/90 via-slate-950/95 to-lime-950/90",
        accent: "from-lime-400 via-emerald-500 to-green-500",
        glowColor: "rgba(34, 197, 94, 0.6)",
        badgeBg: "bg-emerald-500/20 border-emerald-400/40 text-emerald-300",
        icon: "🌳",
        typeLabel: "Cây Phép Thuật Nối Từ",
      };
    }
    // Default match
    return {
      bgGradient: "from-sky-950/90 via-slate-950/95 to-indigo-950/90",
      accent: "from-sky-400 via-blue-500 to-indigo-500",
      glowColor: "rgba(56, 189, 248, 0.6)",
      badgeBg: "bg-sky-500/20 border-sky-400/40 text-sky-300",
      icon: "🧩",
      typeLabel: "Nối Từ Vựng Tương Tác",
    };
  };

  const theme = getTheme();

  const handleStart = () => {
    // Unlock AudioContext for mobile browsers
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {}

    setIsClosing(true);
    setTimeout(() => {
      onStart();
    }, 250);
  };

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 select-none transition-all duration-300 ${
        isClosing ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{
        background: `radial-gradient(circle at center, rgba(15, 23, 42, 0.85) 0%, rgba(2, 6, 23, 0.96) 100%)`,
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Top Exit button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white/90 text-xs font-bold transition-all cursor-pointer backdrop-blur-md border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Thoát</span>
        </button>
      )}

      {/* Main Center Card */}
      <div className="relative max-w-lg w-full flex flex-col items-center text-center space-y-5 px-6 py-8 md:py-10 rounded-[2.5rem] border border-white/15 bg-white/[0.04] shadow-[0_20px_70px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        {/* Game Icon / Mascot Badge */}
        <div className="relative">
          <div
            className={`w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-tr ${theme.accent} p-1 flex items-center justify-center shadow-2xl transition-transform hover:scale-105`}
            style={{ boxShadow: `0 0 45px ${theme.glowColor}` }}
          >
            <div className="w-full h-full rounded-[22px] bg-slate-950/80 flex items-center justify-center text-5xl md:text-6xl overflow-hidden">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={title}
                  className="w-full h-full object-cover rounded-[22px]"
                />
              ) : (
                <span>{theme.icon}</span>
              )}
            </div>
          </div>
          <span className="absolute -bottom-2 -right-2 text-xl filter drop-shadow">✨</span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${theme.badgeBg}`}>
            {theme.typeLabel}
          </span>
          {ageGroup && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-200 border border-white/10">
              {ageGroup === "2-5" ? "Bé 2-5 tuổi" : ageGroup === "6-12" ? "Lớp 1-5" : ageGroup}
            </span>
          )}
          {typeof questionCount === "number" && questionCount > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-200 border border-white/10">
              {questionCount} câu hỏi
            </span>
          )}
        </div>

        {/* Game Title */}
        <div className="space-y-1 max-w-md">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-wide leading-tight drop-shadow-md">
            {title}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Sẵn sàng rèn luyện phản xạ và tiếng Anh cùng Dolcake!
          </p>
        </div>

        {/* Big Pulsing Play Button */}
        <div className="pt-2 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleStart}
            className={`group relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-tr ${theme.accent} p-1 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer`}
            style={{ boxShadow: `0 0 50px ${theme.glowColor}` }}
          >
            {/* Outer Ripple Ring */}
            <span
              className="absolute inset-0 rounded-full border-2 border-white/60 animate-ping pointer-events-none"
              style={{ animationDuration: "2s" }}
            />

            {/* Inner Disc */}
            <span className="w-full h-full rounded-full bg-slate-950/90 flex items-center justify-center group-hover:bg-slate-950/70 transition-colors border border-white/30">
              <Play className="w-10 h-10 md:w-12 md:h-12 text-white ml-1.5 group-hover:scale-110 transition-transform drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
            </span>
          </button>

          <span className="font-black text-sm md:text-base text-white tracking-widest uppercase drop-shadow animate-pulse">
            BẮT ĐẦU CHƠI
          </span>
        </div>
      </div>
    </div>
  );
}
