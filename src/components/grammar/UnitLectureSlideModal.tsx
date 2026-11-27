"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Download,
  StickyNote,
  Timer,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  Pointer,
  Presentation,
  Mic,
  Lightbulb,
} from "lucide-react";
import type { UnitLectureDeck } from "@/data/global-success-grammar/lecture-slides";

function playTimerChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [880, 1174.66];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.14;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.38);
    });
  } catch {
    // AudioContext blocked or unavailable
  }
}

export function getSlideSyncChannelName(grade: number, unit: number): string {
  return `dolcake-slide-sync-g${grade}-u${unit}`;
}

interface SyncMessage {
  type: "SLIDE_CHANGE";
  slideIndex: number; // 0-based
}

/**
 * Clean standalone stage view opened via "Tách cửa sổ trình chiếu" for Zoom screen-sharing
 * without showing Teacher Speaker Notes. Syncs slide index with the teacher console via BroadcastChannel.
 */
export function PresenterStageWindow({
  deck,
  initialSlide = 0,
}: {
  deck: UnitLectureDeck;
  initialSlide?: number;
}) {
  const total = deck.slides.length;
  const [currentIdx, setCurrentIdx] = useState(() =>
    Math.min(Math.max(0, initialSlide), Math.max(0, total - 1))
  );
  const [laserOn, setLaserOn] = useState(false);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stageContainerRef = useRef<HTMLDivElement>(null);

  const slide = deck.slides[currentIdx] || deck.slides[0];

  const broadcastSlide = useCallback(
    (idx: number) => {
      if (typeof BroadcastChannel === "undefined") return;
      try {
        const ch = new BroadcastChannel(getSlideSyncChannelName(deck.grade, deck.unit));
        const msg: SyncMessage = { type: "SLIDE_CHANGE", slideIndex: idx };
        ch.postMessage(msg);
        ch.close();
      } catch {}
    },
    [deck.grade, deck.unit]
  );

  const goToSlide = useCallback(
    (idx: number) => {
      const clamped = Math.min(Math.max(0, idx), total - 1);
      setCurrentIdx(clamped);
      broadcastSlide(clamped);
    },
    [total, broadcastSlide]
  );

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(getSlideSyncChannelName(deck.grade, deck.unit));
    ch.onmessage = (ev: MessageEvent<SyncMessage>) => {
      if (ev.data?.type === "SLIDE_CHANGE" && typeof ev.data.slideIndex === "number") {
        setCurrentIdx(Math.min(Math.max(0, ev.data.slideIndex), total - 1));
      }
    };
    return () => ch.close();
  }, [deck.grade, deck.unit, total]);

  const toggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      stageContainerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        goToSlide(currentIdx + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goToSlide(currentIdx - 1);
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIdx, goToSlide, toggleFullscreen]);

  // Preload adjacent slides
  useEffect(() => {
    [currentIdx + 1, currentIdx - 1].forEach((idx) => {
      if (idx >= 0 && idx < total) {
        const img = new Image();
        img.src = deck.slides[idx].imageUrl;
      }
    });
  }, [currentIdx, total, deck.slides]);

  return (
    <div
      ref={stageContainerRef}
      className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-2 sm:p-4 select-none"
    >
      <div
        className={`relative w-full max-w-[1440px] aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-2xl border border-white/10 ${
          laserOn ? "cursor-none" : ""
        }`}
        onMouseMove={(e) => {
          if (!laserOn) return;
          const rect = e.currentTarget.getBoundingClientRect();
          setPointerPos({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
          });
        }}
        onMouseLeave={() => setPointerPos(null)}
      >
        <img
          src={slide.imageUrl}
          alt={`Slide ${slide.index}: ${slide.title}`}
          className="w-full h-full object-contain bg-[#F5FAFF]"
          draggable={false}
        />

        {laserOn && pointerPos && (
          <div
            className="pointer-events-none absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-rose-500 shadow-[0_0_16px_5px_rgba(244,63,94,0.85)] ring-2 ring-white/80"
            style={{ left: `${pointerPos.x}%`, top: `${pointerPos.y}%` }}
          />
        )}

        {/* Subtle bottom-right hover bar */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/75 backdrop-blur-md border border-white/15 opacity-80 hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => goToSlide(currentIdx - 1)}
            disabled={currentIdx === 0}
            className="p-1.5 rounded-lg hover:bg-white/15 disabled:opacity-35 cursor-pointer"
            title="Previous (←)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-black tabular-nums px-1.5">
            {currentIdx + 1} / {total}
          </span>
          <button
            type="button"
            onClick={() => goToSlide(currentIdx + 1)}
            disabled={currentIdx === total - 1}
            className="p-1.5 rounded-lg hover:bg-white/15 disabled:opacity-35 cursor-pointer"
            title="Next (→)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/20 mx-0.5" />
          <button
            type="button"
            onClick={() => setLaserOn((v) => !v)}
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
              laserOn ? "bg-rose-500 text-white" : "hover:bg-white/15 text-white/80"
            }`}
            title="Laser Pointer"
          >
            <Pointer className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-white/15 text-white/80 cursor-pointer"
            title="Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UnitLectureSlideModal({
  isOpen,
  onClose,
  deck,
  isLoading = false,
  isVi,
  canViewTeacherTools,
}: {
  isOpen: boolean;
  onClose: () => void;
  deck: UnitLectureDeck | null;
  isLoading?: boolean;
  isVi: boolean;
  canViewTeacherTools: boolean;
}) {
  if (!isOpen) return null;

  if (isLoading || !deck) {
    return (
      <div className="fixed inset-0 z-[240] bg-slate-950/92 backdrop-blur-md flex items-center justify-center p-4 text-white">
        <div className="bg-slate-900 border border-white/10 rounded-3xl px-8 py-7 text-center space-y-4 max-w-sm w-full shadow-2xl">
          {isLoading ? (
            <div className="w-10 h-10 rounded-full border-4 border-violet-400/30 border-t-violet-400 animate-spin mx-auto" />
          ) : null}
          <p className="font-headline font-bold text-sm">
            {isLoading
              ? isVi
                ? "Đang tải bài giảng..."
                : "Loading lecture slides..."
              : isVi
                ? "Không thể tải bài giảng cho Unit này."
                : "Could not load lecture slides for this unit."}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
          >
            {isVi ? "Đóng" : "Close"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <UnitLectureSlideModalInner
      isOpen={isOpen}
      onClose={onClose}
      deck={deck}
      isVi={isVi}
      canViewTeacherTools={canViewTeacherTools}
    />
  );
}

function UnitLectureSlideModalInner({
  isOpen,
  onClose,
  deck,
  isVi,
  canViewTeacherTools,
}: {
  isOpen: boolean;
  onClose: () => void;
  deck: UnitLectureDeck;
  isVi: boolean;
  canViewTeacherTools: boolean;
}) {
  const total = deck.slides.length;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showNotes, setShowNotes] = useState(canViewTeacherTools);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [laserOn, setLaserOn] = useState(false);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);

  // 30s countdown timer state
  const defaultDuration = deck.slides[currentIdx]?.timerSeconds ?? 30;
  const [timeLeft, setTimeLeft] = useState(defaultDuration);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerVisible, setTimerVisible] = useState(false);

  const modalRootRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const slide = deck.slides[currentIdx] || deck.slides[0];

  // Ensure Speaker Notes stays hidden if user lacks teacher permissions
  useEffect(() => {
    if (!canViewTeacherTools) {
      setShowNotes(false);
    }
  }, [canViewTeacherTools]);

  // Reset slide index when deck changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIdx(0);
      setTimerRunning(false);
      setTimeLeft(deck.slides[0]?.timerSeconds ?? 30);
    }
  }, [isOpen, deck]);

  // Broadcast slide changes to any detached Presenter Stage window
  const broadcastSlide = useCallback(
    (idx: number) => {
      if (typeof BroadcastChannel === "undefined") return;
      try {
        const ch = new BroadcastChannel(getSlideSyncChannelName(deck.grade, deck.unit));
        const msg: SyncMessage = { type: "SLIDE_CHANGE", slideIndex: idx };
        ch.postMessage(msg);
        ch.close();
      } catch {}
    },
    [deck.grade, deck.unit]
  );

  // Listen if detached stage window navigates slides
  useEffect(() => {
    if (!isOpen || typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(getSlideSyncChannelName(deck.grade, deck.unit));
    ch.onmessage = (ev: MessageEvent<SyncMessage>) => {
      if (ev.data?.type === "SLIDE_CHANGE" && typeof ev.data.slideIndex === "number") {
        setCurrentIdx(Math.min(Math.max(0, ev.data.slideIndex), total - 1));
      }
    };
    return () => ch.close();
  }, [isOpen, deck.grade, deck.unit, total]);

  const goToSlide = useCallback(
    (idx: number) => {
      const clamped = Math.min(Math.max(0, idx), total - 1);
      setCurrentIdx(clamped);
      broadcastSlide(clamped);
      const nextDur = deck.slides[clamped]?.timerSeconds ?? 30;
      setTimerRunning(false);
      setTimeLeft(nextDur);
    },
    [total, broadcastSlide, deck.slides]
  );

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (!isOpen || !thumbsRef.current) return;
    const el = thumbsRef.current.querySelector<HTMLElement>(`[data-thumb-idx="${currentIdx}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [currentIdx, isOpen]);

  // Preload adjacent HD slide PNGs
  useEffect(() => {
    if (!isOpen) return;
    [currentIdx + 1, currentIdx + 2, currentIdx - 1].forEach((idx) => {
      if (idx >= 0 && idx < total) {
        const img = new Image();
        img.src = deck.slides[idx].imageUrl;
      }
    });
  }, [currentIdx, isOpen, total, deck.slides]);

  // Countdown tick
  useEffect(() => {
    if (!isOpen || !timerRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          playTimerChime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, timerRunning]);

  const toggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      modalRootRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Keyboard shortcuts while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        goToSlide(currentIdx + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goToSlide(currentIdx - 1);
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === "n" && canViewTeacherTools) {
        e.preventDefault();
        setShowNotes((v) => !v);
      } else if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        setTimerVisible(true);
        setTimerRunning((v) => !v);
      } else if (e.key === "Escape" && !document.fullscreenElement) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, currentIdx, goToSlide, toggleFullscreen, canViewTeacherTools, onClose]);

  const handleOpenStageWindow = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = `/student/unit-grammar?grade=${deck.grade}&unit=${deck.unit}&presenterStage=1&slide=${currentIdx}`;
    window.open(url, `dolcake-stage-g${deck.grade}-u${deck.unit}`, "width=1280,height=760");
  }, [deck.grade, deck.unit, currentIdx]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRootRef}
      className="fixed inset-0 z-[240] bg-slate-950/92 backdrop-blur-md flex flex-col text-white animate-in fade-in duration-150"
    >
      {/* Top Control Header */}
      <div className="shrink-0 px-3 sm:px-5 py-2.5 bg-slate-900/95 border-b border-white/10 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
            <Presentation className="w-4 h-4 text-white" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/25 text-violet-200 border border-violet-400/30">
                {deck.subtitle}
              </span>
              <span className="text-xs font-black tabular-nums text-slate-300">
                Slide {currentIdx + 1} / {total}
              </span>
            </div>
            <h2 className="font-headline font-bold text-xs sm:text-sm text-white truncate">
              {slide.title}
            </h2>
          </div>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* 30s Countdown Timer */}
          <div className="inline-flex items-center gap-1 rounded-xl bg-slate-800/90 border border-white/10 px-2 py-1">
            <button
              type="button"
              onClick={() => {
                if (!timerVisible) {
                  setTimerVisible(true);
                  setTimerRunning(true);
                } else {
                  setTimerRunning((v) => !v);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg text-xs font-black tabular-nums cursor-pointer transition-colors ${
                timeLeft === 0
                  ? "bg-rose-500/25 text-rose-300"
                  : timerRunning && timeLeft <= 5
                    ? "bg-amber-500/25 text-amber-300 animate-pulse"
                    : timerRunning
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "text-slate-200 hover:text-white"
              }`}
              title={isVi ? "Đồng hồ đếm ngược (phím T)" : "Countdown timer (T)"}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>{String(timeLeft).padStart(2, "0")}s</span>
              {timerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                setTimeLeft(defaultDuration);
              }}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              title={isVi ? "Đặt lại đồng hồ" : "Reset timer"}
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Laser pointer */}
          <button
            type="button"
            onClick={() => setLaserOn((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              laserOn
                ? "bg-rose-500/25 border-rose-400/50 text-rose-200"
                : "bg-slate-800 hover:bg-slate-700 border-white/10 text-slate-200"
            }`}
            title={isVi ? "Con trỏ laser khi giảng" : "Laser pointer"}
          >
            <Pointer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isVi ? "Laser" : "Laser"}</span>
          </button>

          {/* Teacher-only controls */}
          {canViewTeacherTools && (
            <>
              <button
                type="button"
                onClick={() => setShowNotes((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  showNotes
                    ? "bg-amber-500/20 border-amber-400/50 text-amber-200"
                    : "bg-slate-800 hover:bg-slate-700 border-white/10 text-slate-200"
                }`}
                title={isVi ? "Ẩn/hiện kịch bản giáo viên (phím N)" : "Toggle Speaker Notes (N)"}
              >
                <StickyNote className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isVi ? "Ghi chú GV" : "Speaker Notes"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleOpenStageWindow}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                title={
                  isVi
                    ? "Mở cửa sổ trình chiếu riêng cho Zoom (không hiện ghi chú)"
                    : "Open detached stage window for Zoom (hides notes)"
                }
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">
                  {isVi ? "Tách màn chiếu" : "Stage Window"}
                </span>
              </button>

              <a
                href={deck.pptxUrl}
                download={deck.pptxFileName}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all"
                title={isVi ? "Tải file PowerPoint (.pptx)" : "Download PowerPoint (.pptx)"}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">.pptx</span>
              </a>
            </>
          )}

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-bold transition-all cursor-pointer"
            title={isVi ? "Toàn màn hình (phím F)" : "Fullscreen (F)"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-600/80 border border-white/10 text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title={isVi ? "Đóng (Esc)" : "Close (Esc)"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area: Stage + Optional Speaker Notes */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Slide Canvas */}
        <div className="flex-1 min-h-0 flex items-center justify-center p-2 sm:p-5 relative">
          <div
            className={`relative w-full h-full max-w-[1320px] flex items-center justify-center ${
              laserOn ? "cursor-none" : ""
            }`}
          >
            <div
              className="relative aspect-video max-h-full max-w-full w-full rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-[#F5FAFF]"
              onMouseMove={(e) => {
                if (!laserOn) return;
                const rect = e.currentTarget.getBoundingClientRect();
                setPointerPos({
                  x: ((e.clientX - rect.left) / rect.width) * 100,
                  y: ((e.clientY - rect.top) / rect.height) * 100,
                });
              }}
              onMouseLeave={() => setPointerPos(null)}
            >
              <img
                src={slide.imageUrl}
                alt={`Slide ${slide.index}: ${slide.title}`}
                className="w-full h-full object-contain select-none"
                draggable={false}
              />

              {/* Red laser dot */}
              {laserOn && pointerPos && (
                <div
                  className="pointer-events-none absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-rose-500 shadow-[0_0_16px_5px_rgba(244,63,94,0.85)] ring-2 ring-white/80"
                  style={{ left: `${pointerPos.x}%`, top: `${pointerPos.y}%` }}
                />
              )}

              {/* Floating countdown pill inside slide corner when running or < default */}
              {(timerVisible || timerRunning) && (
                <div
                  className={`absolute top-3 right-3 px-3 py-1.5 rounded-full font-black text-sm tabular-nums shadow-lg border backdrop-blur-md flex items-center gap-1.5 ${
                    timeLeft === 0
                      ? "bg-rose-600/90 border-rose-300 text-white animate-bounce"
                      : timeLeft <= 5
                        ? "bg-amber-500/90 border-amber-200 text-slate-950"
                        : "bg-slate-900/80 border-white/25 text-white"
                  }`}
                >
                  <Timer className="w-4 h-4" />
                  <span>{String(timeLeft).padStart(2, "0")}s</span>
                </div>
              )}

              {/* Left / Right overlay navigation buttons */}
              <button
                type="button"
                onClick={() => goToSlide(currentIdx - 1)}
                disabled={currentIdx === 0}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/55 hover:bg-slate-900/85 text-white flex items-center justify-center backdrop-blur-sm border border-white/15 disabled:opacity-20 transition-all cursor-pointer"
                title={isVi ? "Slide trước (←)" : "Previous slide (←)"}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => goToSlide(currentIdx + 1)}
                disabled={currentIdx === total - 1}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/55 hover:bg-slate-900/85 text-white flex items-center justify-center backdrop-blur-sm border border-white/15 disabled:opacity-20 transition-all cursor-pointer"
                title={isVi ? "Slide tiếp theo (→)" : "Next slide (→)"}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Teacher Speaker Notes Side/Bottom Panel */}
        {canViewTeacherTools && showNotes && (
          <aside className="shrink-0 lg:w-96 max-h-[34vh] lg:max-h-none bg-slate-900/95 border-t lg:border-t-0 lg:border-l border-white/10 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-400" />
                <span className="font-headline font-black text-xs uppercase tracking-wider text-amber-300">
                  {isVi ? "Speaker Notes · Kịch bản GV" : "Teacher Speaker Notes"}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {currentIdx + 1}/{total}
              </span>
            </div>

            {slide.notes && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-400/25 p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-300">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{isVi ? "Điều phối lớp học" : "Classroom Cue"}</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-50/95 leading-relaxed whitespace-pre-line">
                  {slide.notes}
                </p>
              </div>
            )}

            {slide.narration && (
              <div className="rounded-2xl bg-indigo-500/10 border border-indigo-400/25 p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-indigo-300">
                  <Mic className="w-3.5 h-3.5" />
                  <span>{isVi ? "Lời giảng gợi ý" : "Suggested Script"}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-line">
                  {slide.narration}
                </p>
              </div>
            )}

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isVi
                ? "Phím tắt: ← / → chuyển slide • F toàn màn hình • N ẩn/hiện ghi chú • T bật/tạm dừng đếm ngược"
                : "Shortcuts: ← / → navigate • F fullscreen • N toggle notes • T timer"}
            </p>
          </aside>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="shrink-0 bg-slate-900/95 border-t border-white/10 px-3 py-2">
        <div
          ref={thumbsRef}
          className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-thin"
        >
          {deck.slides.map((s, idx) => {
            const active = idx === currentIdx;
            return (
              <button
                key={s.index}
                type="button"
                data-thumb-idx={idx}
                onClick={() => goToSlide(idx)}
                className={`group relative shrink-0 w-24 sm:w-28 aspect-video rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  active
                    ? "border-violet-400 ring-2 ring-violet-400/40 scale-[1.03]"
                    : "border-white/15 opacity-70 hover:opacity-100 hover:border-white/40"
                }`}
                title={`${s.index}. ${s.title}`}
              >
                <img
                  src={s.imageUrl}
                  alt={`Slide ${s.index}`}
                  className="w-full h-full object-cover bg-[#F5FAFF]"
                  loading="lazy"
                />
                <span
                  className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-black tabular-nums ${
                    active ? "bg-violet-600 text-white" : "bg-slate-950/75 text-slate-200"
                  }`}
                >
                  {s.index}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
