"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Plus, X, RotateCcw, Volume2, VolumeX, Sparkles } from "lucide-react";
import Link from "next/link";

export interface VideoModalGame {
  id: string;
  title: string;
  badge: string;
  badgeBg: string;
  videoId: string;
  createHref: string;
}

interface GameVideoModalProps {
  game: VideoModalGame | null;
  onClose: () => void;
}

export function GameVideoModal({ game, onClose }: GameVideoModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Send control commands to YouTube iframe via postMessage (Iframe API protocol)
  const sendCommand = (func: string, args: any[] = []) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "*"
      );
    }
  };

  // Reset playback state whenever video changes
  useEffect(() => {
    if (game) {
      setIsPlaying(true);
      setIsMuted(false);
    }
  }, [game?.videoId]);

  // Force YouTube player to switch to highest HD resolution (1080p / highres)
  useEffect(() => {
    if (!game?.videoId) return;

    const enforceHdQuality = () => {
      sendCommand("setPlaybackQuality", ["hd1080"]);
      sendCommand("setPlaybackQualityRange", ["hd1080", "highres"]);
    };

    // Staggered triggers as YouTube player initializes its buffer
    const timers = [
      setTimeout(enforceHdQuality, 250),
      setTimeout(enforceHdQuality, 700),
      setTimeout(enforceHdQuality, 1500),
      setTimeout(enforceHdQuality, 2500),
      setTimeout(enforceHdQuality, 4000),
    ];

    // Listen for YouTube iframe API readiness
    const handleWindowMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.event === "onReady" || data?.info?.playerState !== undefined) {
          enforceHdQuality();
        }
      } catch {}
    };

    window.addEventListener("message", handleWindowMessage);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("message", handleWindowMessage);
    };
  }, [game?.videoId]);

  // Keyboard shortcut (ESC to close) and body scroll lock
  useEffect(() => {
    if (!game) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [game, onClose]);

  if (!game || !game.videoId) return null;

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isPlaying) {
      sendCommand("pauseVideo");
      setIsPlaying(false);
    } else {
      sendCommand("playVideo");
      setIsPlaying(true);
    }
  };

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    sendCommand("seekTo", [0, true]);
    sendCommand("setPlaybackQuality", ["hd1080"]);
    sendCommand("playVideo");
    setIsPlaying(true);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMuted) {
      sendCommand("unMute");
      setIsMuted(false);
    } else {
      sendCommand("mute");
      setIsMuted(true);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 md:p-8 animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl flex flex-col gap-3 sm:gap-4 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md shrink-0 ${game.badgeBg}`}
            >
              {game.badge}
            </span>
            <h3 className="font-headline font-black text-lg sm:text-xl truncate text-white drop-shadow-md">
              {game.title}
            </h3>
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sparkles className="w-3 h-3" />
              HD 1080p
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={game.createHref}
              onClick={onClose}
              className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-sky-500/25 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              <span className="hidden sm:inline">Tạo bài tập này</span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border border-white/20 active:scale-95"
              title="Đóng video (Phím ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video 16:9 Cinema Frame with CSS Crop & Scale */}
        <div
          onClick={togglePlay}
          className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.8)] group/player cursor-pointer select-none"
        >
          {/* 
            Optimized Crop & Scale:
            - w-[118%] h-[118%] -top-[9%] -left-[9%]: Minimizes zoom distortion while cleanly pushing YouTube header & controls outside the viewport.
            - vq=hd1080: Forces YouTube embed to initialize at 1080p resolution.
            - pointer-events-none: Prevents YouTube from rendering internal hover titles, settings, or pause overlays.
          */}
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${game.videoId}?autoplay=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&enablejsapi=1&playsinline=1&vq=hd1080`}
            title={game.title}
            className="absolute w-[118%] h-[118%] -top-[9%] -left-[9%] border-0 pointer-events-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />

          {/* Center Play Indicator when Paused */}
          {!isPlaying && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
              <div className="w-20 h-20 rounded-full bg-white/95 dark:bg-slate-900/95 text-sky-500 flex items-center justify-center shadow-2xl border-2 border-white/80 scale-100 hover:scale-110 transition-transform">
                <Play className="w-9 h-9 ml-1 fill-current" />
              </div>
            </div>
          )}

          {/* Custom Minimalist Controls Bar on Hover */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-20 flex items-center justify-between pointer-events-auto opacity-0 group-hover/player:opacity-100 transition-opacity duration-300 bg-slate-950/75 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 shadow-xl"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title={isPlaying ? "Tạm dừng" : "Phát tiếp"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5 fill-current" />
                )}
              </button>

              <button
                type="button"
                onClick={handleReplay}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Phát lại từ đầu"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <span className="text-xs text-slate-300 font-medium hidden sm:inline select-none">
                {isPlaying ? "Đang phát video demo (HD 1080p)" : "Đã tạm dừng"}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 font-medium select-none">
              Nhấp vào video để {isPlaying ? "tạm dừng" : "tiếp tục"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
