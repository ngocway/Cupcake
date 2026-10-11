'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { InstructionsBlock } from '@/components/common/InstructionsBlock';
import { BookOpen, RefreshCw, AlertCircle } from 'lucide-react';
import { getCachedGrammarData, fetchGrammarDataWithCache } from '../_utils/assignmentCache';

interface EmbeddedGrammarContainerProps {
  assignmentId: string;
  classId?: string;
  groupId?: string;
  initialInstructions?: string | null;
  initialInstructionsTranslations?: any;
  onComplete?: (score: number, assignmentId: string) => void;
  onNextActivity?: () => void;
}

export function EmbeddedGrammarContainer({
  assignmentId,
  classId,
  groupId,
  initialInstructions,
  initialInstructionsTranslations,
  onComplete,
  onNextActivity,
}: EmbeddedGrammarContainerProps) {
  const cached = getCachedGrammarData(assignmentId);
  const isValidCached = cached?.instructions && !String(cached.instructions).trim().startsWith('{');

  const cleanInitialInstructions = (initialInstructions && !initialInstructions.trim().startsWith('{'))
    ? initialInstructions
    : null;

  const initialPayload = isValidCached ? cached : (cleanInitialInstructions ? {
    assignmentId,
    instructions: cleanInitialInstructions,
    instructionsTranslations: initialInstructionsTranslations || null,
  } : null);

  const [data, setData] = useState<any>(initialPayload);
  const [isLoading, setIsLoading] = useState(!initialPayload);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (force = false) => {
    const existing = getCachedGrammarData(assignmentId);
    const hasValidExisting = existing?.instructions && !String(existing.instructions).trim().startsWith('{');
    if (!force && hasValidExisting) {
      setData(existing);
      setIsLoading(false);
      return;
    }
    // If we don't have valid HTML instructions, show loading screen
    if (!hasValidExisting && !cleanInitialInstructions) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const res = await fetchGrammarDataWithCache(assignmentId, force);
      setData(res);
    } catch (err: any) {
      if (!cleanInitialInstructions && !data?.instructions) {
        console.error('Failed to load grammar lesson data:', err);
        setError(err?.message || 'Không thể tải nội dung bài học.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, cleanInitialInstructions, data?.instructions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[580px] lg:min-h-[660px] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-150">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs">
            <BookOpen className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              Đang nạp bài giảng lý thuyết
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Chuẩn bị công thức & ví dụ trực quan...
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full h-full min-h-[580px] lg:min-h-[660px] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              Không thể tải bài lý thuyết
            </h3>
            <p className="text-xs text-rose-500 font-semibold mt-1">
              {error || 'Đã có lỗi xảy ra.'}
            </p>
          </div>
          <button
            onClick={() => loadData(true)}
            className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[580px] lg:min-h-[660px] bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar px-4 sm:px-8 md:px-10 lg:px-12 py-5 sm:py-7 pb-16 animate-in fade-in duration-200">
      <div className="w-full space-y-8">
        {/* Lesson Theory Body - Full Width & Borderless */}
        <div className="w-full">
          {data.instructions ? (
            <InstructionsBlock
              instructions={data.instructions}
              instructionsTranslations={data.instructionsTranslations}
              isLoggedIn={true}
              togglePlacement="inside-corner"
              proseClassName="prose prose-slate max-w-none dark:prose-invert
                [&_h2]:text-orange-500 [&_h2]:font-black [&_h2]:text-sm [&_h2]:uppercase [&_h2]:tracking-widest [&_h2]:mt-6 [&_h2]:mb-2
                [&_p]:text-slate-700 [&_p]:dark:text-slate-300 [&_p]:leading-relaxed
                [&_ul]:space-y-1.5 [&_li]:text-slate-700 [&_li]:dark:text-slate-300
                [&_div]:rounded-lg [&_[style*='padding:_24px']]:!p-3 sm:[&_[style*='padding:_24px']]:!p-4 [&_[style*='margin-bottom:_32px']]:!mb-4"
            />
          ) : (
            <div className="p-12 text-center text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 stroke-[1.5]" />
              <p className="font-bold text-sm">Nội dung bài học đang được cập nhật.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
