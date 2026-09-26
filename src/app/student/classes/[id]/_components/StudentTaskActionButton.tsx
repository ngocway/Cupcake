"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, RotateCcw, ArrowRight } from 'lucide-react';
import { markLessonViewedAction } from '@/actions/material-actions';

interface StudentTaskActionButtonProps {
  assignmentId: string;
  targetUrl: string;
  isSubmitted: boolean;
  kind: string;
}

export function StudentTaskActionButton({
  assignmentId,
  targetUrl,
  isSubmitted,
  kind,
}: StudentTaskActionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // Navigate directly without instant completion - 30s reading timer handles completion
  };

  const buttonText = isSubmitted
    ? (kind === 'LESSON' ? 'Xem lại lý thuyết' : (kind === 'GAME' ? 'Chơi lại' : 'Xem lại bài làm'))
    : (kind === 'LESSON' ? 'Học lý thuyết' : (kind === 'GAME' ? 'Chơi ngay' : 'Làm bài tập'));

  return (
    <a
      href={targetUrl}
      onClick={handleClick}
      className={`px-4 py-2 font-bold text-xs rounded-xl transition-all active:scale-95 shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0 ${
        isSubmitted
          ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-600'
          : kind === 'LESSON'
            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-600/20 shadow-md'
            : kind === 'GAME'
              ? 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-pink-600/20 shadow-md'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-600/20 shadow-md'
      }`}
    >
      {loading ? (
        <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : isSubmitted ? (
        <RotateCcw className="w-3.5 h-3.5 opacity-70" />
      ) : (
        <Play className="w-3 h-3 fill-current" />
      )}
      <span>{buttonText}</span>
    </a>
  );
}
