'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Loader2, Sparkles, RefreshCw, Maximize2, Minimize2, Play } from 'lucide-react';
import { completeClassActivityAction } from '@/actions/activity-completion-actions';

interface EmbeddedGameContainerProps {
  assignment: any;
  onComplete?: (score: number | null, assignmentId: string) => void;
  isActive?: boolean;
  onOpenStations?: () => void;
}

export function resolveDirectGameUrl(rawUrl: string, assignment?: any): string {
  let url = rawUrl;
  if (assignment?.instructions) {
    try {
      const meta = JSON.parse(assignment.instructions);
      if (typeof meta.playUrl === 'string') url = meta.playUrl;
    } catch {}
  }

  if (!url || !url.trim()) {
    return '';
  }

  const [basePath, search] = url.split('?');
  const params = new URLSearchParams(search || '');
  if (assignment?.id) {
    params.set('assignmentId', assignment.id);
  }

  const queryStr = params.toString() ? `?${params.toString()}` : '';

  if (basePath.includes('/student/game/flashcard-match')) {
    return `/games/flashcard-match/index.html${queryStr}`;
  }
  if (basePath.includes('/student/game/candy-quiz')) {
    return `/games/candy-grammar-sugar-jelly/index.html${queryStr}`;
  }
  if (basePath.includes('/student/game/egg-smash-quiz')) {
    return `/games/egg-smash-quiz-premium-ambient/index.html${queryStr}`;
  }
  if (basePath.includes('/student/game/conveyor-drop')) {
    return `/games/conveyor-drop/index.html${queryStr}`;
  }
  if (basePath.includes('/student/game/match-words')) {
    return `/games/match-words/index.html${queryStr}`;
  }
  if (basePath.includes('/student/game/match-text-text')) {
    return `/games/match-text-text/index.html${queryStr}`;
  }
  if (basePath.includes('/student/game/sentence-builder')) {
    return `/games/sentence-builder/index.html${queryStr}`;
  }
  if (basePath.includes('/student/game/flashcard-sentence-builder')) {
    return `/games/flashcard-sentence-builder/index.html${queryStr}`;
  }
  if (basePath.includes('/student/game/robot-chat')) {
    return `/games/robot-chat/index.html${queryStr}`;
  }
  if (basePath.includes('/student/game/train')) {
    return `/games/Doan-tau-tu-vung/index.html${queryStr}`;
  }
  if (basePath.includes('/student/game/treasure-hunt')) {
    return `/games/mystery-treasure-grid-assets/index.html${queryStr}`;
  }
  if (basePath.includes('/student/game/cut-rope')) {
    return `/games/magic_tree_matching_game_v3/index.html${queryStr}`;
  }
  if (basePath.includes('/student/game/flashcard-quiz')) {
    return `/games/flashcard-quiz/index.html${queryStr}`;
  }

  if (basePath.startsWith('/games/')) {
    return `${basePath}${queryStr}`;
  }

  if (basePath.startsWith('/flashcards')) {
    return `${basePath}${queryStr}`;
  }

  return url;
}

export function EmbeddedGameContainer({
  assignment,
  onComplete,
  isActive = true,
  onOpenStations,
}: EmbeddedGameContainerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showBypassBtn, setShowBypassBtn] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Stop/pause all game audio inside the iframe whenever this game is not active
  useEffect(() => {
    if (!isActive && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({ action: 'pause_audio', type: 'STOP_ALL_AUDIO' }, '*');
        iframeRef.current.contentWindow.postMessage({ action: 'stop_audio', type: 'STOP_ALL_AUDIO' }, '*');
      } catch {}
    }
  }, [isActive]);

  // Stop all audio on unmount
  useEffect(() => {
    return () => {
      if (iframeRef.current?.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage({ action: 'pause_audio', type: 'STOP_ALL_AUDIO' }, '*');
          iframeRef.current.contentWindow.postMessage({ action: 'stop_audio', type: 'STOP_ALL_AUDIO' }, '*');
        } catch {}
      }
    };
  }, []);

  const rawUrl = assignment?.instructions
    ? (() => {
        try {
          return JSON.parse(assignment.instructions)?.playUrl || '';
        } catch {
          return '';
        }
      })()
    : '';

  const gameDirectUrl = resolveDirectGameUrl(rawUrl, assignment);

  // Watchdog & readyState monitor: Ensure the loading overlay NEVER hangs forever
  useEffect(() => {
    setIsLoading(true);
    setShowBypassBtn(false);

    // 1. Show manual bypass button if still loading after 1.2s
    const bypassTimer = setTimeout(() => {
      setShowBypassBtn(true);
    }, 1200);

    // 2. Absolute safety watchdog: dismiss loading after at most 2.2s
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2200);

    // 3. Polling check for iframe readyState (especially when loaded from cache)
    const checkReady = () => {
      try {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentDocument) {
          const state = iframe.contentDocument.readyState;
          if (state === 'complete' || state === 'interactive') {
            setIsLoading(false);
          }
        }
      } catch {}
    };

    checkReady();
    const interval = setInterval(checkReady, 200);

    const iframe = iframeRef.current;
    const onNativeLoad = () => {
      setIsLoading(false);
    };

    if (iframe) {
      iframe.addEventListener('load', onNativeLoad);
    }

    return () => {
      clearTimeout(bypassTimer);
      clearTimeout(safetyTimer);
      clearInterval(interval);
      if (iframe) {
        iframe.removeEventListener('load', onNativeLoad);
      }
    };
  }, [gameDirectUrl]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleGameMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      // When game announces it's ready, immediately clear loading
      if (data.type === 'GAME_READY') {
        setIsLoading(false);
        return;
      }

      if (
        data.type === 'MATCH_GAME_PROGRESS' ||
        data.type === 'GAME_PROGRESS' ||
        data.type === 'CANDY_GAME_PROGRESS' ||
        data.type === 'ACTIVITY_COMPLETED'
      ) {
        setIsLoading(false);
        const { isCompleted: done, isPass, matchedCount, totalCount, accuracy, score } = data;
        const reachedTarget = 
          done || 
          isPass || 
          (totalCount > 0 && matchedCount / totalCount >= 0.8) ||
          (typeof accuracy === 'number' && accuracy >= 0.8);

        if (reachedTarget && !isCompleted) {
          setIsCompleted(true);
          const finalScore = typeof score === 'number' ? score : 10;
          if (onComplete && assignment?.id) {
            onComplete(finalScore, assignment.id);
          }
          if (assignment?.id) {
            completeClassActivityAction({ assignmentId: assignment.id, score: finalScore }).catch(err => {
              console.error('Failed to complete game assignment:', err);
            });
          }
        }
      }
    };

    window.addEventListener('message', handleGameMessage);
    return () => window.removeEventListener('message', handleGameMessage);
  }, [assignment?.id, isCompleted, onComplete]);

  if (!gameDirectUrl) {
    return (
      <div className="w-full h-full bg-transparent rounded-b-[1.75rem]" />
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full relative bg-slate-900 rounded-b-[1.75rem] overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-[9999] rounded-none !min-h-screen' : ''
      }`}
    >


      {/* Floating Fullscreen Toggle Button */}
      <button
        type="button"
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white/90 hover:text-white backdrop-blur-md border border-white/20 text-xs font-black transition-all shadow-lg active:scale-95 cursor-pointer"
        title={isFullscreen ? 'Thu nhỏ màn hình (Esc)' : 'Phóng to toàn màn hình'}
      >
        {isFullscreen ? (
          <>
            <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Thu nhỏ</span>
          </>
        ) : (
          <>
            <Maximize2 className="w-3.5 h-3.5 text-sky-300" />
            <span className="hidden sm:inline">Toàn màn hình</span>
          </>
        )}
      </button>

      {isLoading && (
        <div className="absolute inset-0 z-20 bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
          <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mb-4">
            <Gamepad2 className="w-7 h-7 animate-bounce" />
          </div>
          <p className="text-sm font-black text-white uppercase tracking-wider">
            Đang khởi động trò chơi tương tác
          </p>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Nạp môi trường đồ họa game 60 FPS...
          </p>
          <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-4">
            <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 h-full w-full animate-pulse" />
          </div>

          {showBypassBtn && (
            <div className="mt-5 flex items-center gap-3 animate-in fade-in duration-200">
              <button
                type="button"
                onClick={() => setIsLoading(false)}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Vào trò chơi ngay
              </button>
              <button
                type="button"
                onClick={() => {
                  if (iframeRef.current) {
                    iframeRef.current.src = gameDirectUrl;
                  }
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                title="Tải lại khung game"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Tải lại
              </button>
            </div>
          )}
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={gameDirectUrl}
        onLoad={() => setIsLoading(false)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; microphone; fullscreen"
        className={`w-full h-full border-0 flex-1 transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        title={assignment?.title || 'Interactive Game'}
      />
    </div>
  );
}
