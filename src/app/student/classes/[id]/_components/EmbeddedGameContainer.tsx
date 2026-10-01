'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { completeClassActivityAction } from '@/actions/activity-completion-actions';

interface EmbeddedGameContainerProps {
  assignment: any;
  onComplete?: (score: number | null, assignmentId: string) => void;
}

export function resolveDirectGameUrl(rawUrl: string, assignment?: any): string {
  let url = rawUrl;
  if (assignment?.instructions) {
    try {
      const meta = JSON.parse(assignment.instructions);
      if (meta.playUrl) url = meta.playUrl;
    } catch {}
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
    return `/games/cut-rope/index.html${queryStr}`;
  }
  if (basePath.includes('/student/game/flashcard-quiz')) {
    return `/games/flashcard-quiz/index.html${queryStr}`;
  }

  if (basePath.startsWith('/games/')) {
    return `${basePath}${queryStr}`;
  }

  return url;
}

export function EmbeddedGameContainer({
  assignment,
  onComplete,
}: EmbeddedGameContainerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

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

  useEffect(() => {
    const handleGameMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      if (
        data.type === 'MATCH_GAME_PROGRESS' ||
        data.type === 'GAME_PROGRESS' ||
        data.type === 'CANDY_GAME_PROGRESS' ||
        data.type === 'ACTIVITY_COMPLETED'
      ) {
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

  return (
    <div className="w-full h-full min-h-[580px] lg:min-h-[660px] relative bg-slate-900 rounded-b-[1.75rem] overflow-hidden flex flex-col">
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
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={gameDirectUrl}
        onLoad={() => setIsLoading(false)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; microphone; fullscreen"
        className={`w-full h-full border-0 flex-1 min-h-[580px] lg:min-h-[660px] transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        title={assignment?.title || 'Interactive Game'}
      />
    </div>
  );
}
