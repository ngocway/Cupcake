'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Layers, AlertCircle, RefreshCw } from 'lucide-react';
import { FlashcardsClient } from '@/app/flashcards/FlashcardsClient';
import {
  getCachedFlashcardData,
  fetchFlashcardDataWithCache,
  setCachedFlashcardData,
} from '../_utils/assignmentCache';

interface EmbeddedFlashcardContainerProps {
  assignment: {
    id: string;
    title: string;
    instructions?: string | null;
    materialType?: string;
  };
  onComplete?: (score: number | null, assignmentId: string) => void;
  isActive?: boolean;
}

export function EmbeddedFlashcardContainer({
  assignment,
  onComplete,
  isActive = true,
}: EmbeddedFlashcardContainerProps) {
  // Extract topicId and initialMode from assignment.instructions or fallback to assignment.id
  const { topicId, initialMode } = React.useMemo(() => {
    let tId = assignment.id;
    let mode: 'hint' | 'scramble' | 'type' = 'hint';
    if (assignment.instructions) {
      try {
        const meta = JSON.parse(assignment.instructions);
        if (meta.topicId) {
          tId = meta.topicId;
        } else if (meta.playUrl) {
          const url = new URL(meta.playUrl, 'http://localhost');
          const param = url.searchParams.get('topic');
          if (param) tId = param;
        }

        if (meta.mode && ['hint', 'scramble', 'type'].includes(meta.mode)) {
          mode = meta.mode;
        } else if (meta.gameMode === 'puzzle') {
          mode = 'scramble';
        } else if (meta.gameMode === 'type') {
          mode = 'type';
        } else if (meta.playUrl) {
          const url = new URL(meta.playUrl, 'http://localhost');
          const m = url.searchParams.get('mode') as any;
          if (m && ['hint', 'scramble', 'type'].includes(m)) {
            mode = m;
          }
        }
      } catch {}
    }
    return { topicId: tId, initialMode: mode };
  }, [assignment.id, assignment.instructions]);

  const cached = getCachedFlashcardData(topicId) || getCachedFlashcardData(assignment.id);
  const [cards, setCards] = useState<any[]>(cached || []);
  const [isLoading, setIsLoading] = useState<boolean>(!cached || cached.length === 0);
  const [error, setError] = useState<string | null>(null);

  const loadCards = useCallback(async (force = false) => {
    const existing = getCachedFlashcardData(topicId) || getCachedFlashcardData(assignment.id);
    if (!force && existing && existing.length > 0) {
      setCards(existing);
      setIsLoading(false);
      return;
    }

    if (!existing || existing.length === 0) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const fetched = await fetchFlashcardDataWithCache(topicId, force);
      if (fetched && fetched.length > 0) {
        setCachedFlashcardData(assignment.id, fetched);
        setCachedFlashcardData(topicId, fetched);
        setCards(fetched);
      } else {
        setError('Chủ đề này chưa có thẻ từ vựng nào.');
      }
    } catch (err: any) {
      console.error('Failed to load flashcard data:', err);
      setError(err?.message || 'Không thể tải dữ liệu flashcard.');
    } finally {
      setIsLoading(false);
    }
  }, [topicId, assignment.id]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

function shuffleCards<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

  // Xáo trộn ngẫu nhiên danh sách thẻ cho từng bài học riêng biệt
  const shuffledCards = React.useMemo(() => {
    if (!cards || cards.length === 0) return [];
    return shuffleCards(cards);
  }, [cards, topicId, initialMode, assignment.id]);

  // Pre-warm first 3 card images as soon as shuffled cards are available
  useEffect(() => {
    if (shuffledCards && shuffledCards.length > 0 && typeof window !== 'undefined') {
      for (let i = 0; i < Math.min(3, shuffledCards.length); i++) {
        if (shuffledCards[i]?.imageUrl) {
          const img = new Image();
          img.src = shuffledCards[i].imageUrl;
        }
      }
    }
  }, [shuffledCards]);

  if (isLoading && (!cards || cards.length === 0)) {
    return (
      <div className="w-full h-full min-h-[580px] lg:min-h-[660px] bg-gradient-to-tr from-amber-50 via-pink-50/50 to-sky-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-150 rounded-b-[1.75rem]">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 border-2 border-amber-200/80 shadow-lg text-center space-y-4 backdrop-blur-md">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Layers className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-black text-amber-900 dark:text-amber-100">
              Đang nạp 20 thẻ từ vựng sinh động
            </h3>
            <p className="text-xs text-amber-700/80 font-semibold mt-1">
              Chuẩn bị hình ảnh minh họa 2D & giọng đọc phát âm chuẩn...
            </p>
          </div>
          <div className="w-32 h-1.5 bg-amber-100 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-amber-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error && (!cards || cards.length === 0)) {
    return (
      <div className="w-full h-full min-h-[580px] lg:min-h-[660px] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 rounded-b-[1.75rem]">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-red-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
            Không thể tải Flashcard
          </h3>
          <p className="text-xs text-slate-500">{error}</p>
          <button
            onClick={() => loadCards(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <FlashcardsClient
      key={`${topicId}_${initialMode}_${assignment.id}`}
      initialTopicId={topicId}
      initialCards={shuffledCards}
      isEmbedded={true}
      assignmentId={assignment.id}
      initialMode={initialMode}
      lockMode={true}
      onComplete={onComplete}
      isActive={isActive}
    />
  );
}
