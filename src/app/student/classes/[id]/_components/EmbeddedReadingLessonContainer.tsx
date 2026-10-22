'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Globe, BookText, RefreshCw, AlertCircle, Layers } from 'lucide-react';
import { getCachedReadingData, fetchReadingDataWithCache } from '../_utils/assignmentCache';
import { CustomAudioPlayer } from '@/components/common/CustomAudioPlayer';
import { InteractiveReadingContent } from '@/components/common/InteractiveReadingContent';
import { LessonInlineQuiz } from '@/components/lessons/LessonInlineQuiz';

interface EmbeddedReadingLessonContainerProps {
  assignmentId: string;
  classId?: string;
  groupId?: string;
  onComplete?: (score: number | null, assignmentId: string) => void;
  isActive?: boolean;
  onOpenStations?: () => void;
}

export function EmbeddedReadingLessonContainer({
  assignmentId,
  classId,
  groupId,
  onComplete,
  isActive = true,
  onOpenStations,
}: EmbeddedReadingLessonContainerProps) {
  const cached = getCachedReadingData(assignmentId);
  const [data, setData] = useState<any>(cached || null);
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (force = false) => {
    const existing = getCachedReadingData(assignmentId);
    if (!force && existing) {
      setData(existing);
      setIsLoading(false);
      return;
    }
    if (!existing) setIsLoading(true);
    setError(null);
    try {
      const res = await fetchReadingDataWithCache(assignmentId, force, classId, groupId);
      if (!res) {
        setError('Không tìm thấy dữ liệu bài đọc.');
      } else {
        setData(res);
      }
    } catch (err: any) {
      console.error('Failed to load reading lesson data:', err);
      setError(err?.message || 'Không thể tải nội dung bài đọc.');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, classId, groupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const displayLevel = React.useMemo(() => {
    if (!data?.level) return 'Pre-A1 / A1';
    const unique = [...new Set(String(data.level).split(',').map(s => s.trim()))].filter(Boolean);
    if (unique.length === 0) return 'Pre-A1 / A1';
    return unique.map(s => s.replace(/pre-a1-a1/gi, 'Pre-A1 / A1').replace(/-/g, ' ')).join(' / ').toUpperCase();
  }, [data?.level]);

  if (isLoading) {
    return (
      <div className="w-full h-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-150">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
            <BookText className="w-6 h-6 animate-pulse text-emerald-500" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              Đang mở bài đọc & câu hỏi đọc hiểu
            </h3>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">
              Đang tải nội dung văn bản và âm thanh...
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-2/3 animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300 max-w-sm mb-4">
          {error || 'Không tìm thấy dữ liệu bài đọc.'}
        </p>
        <button
          onClick={() => loadData(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Thử tải lại
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 p-4 sm:p-6 md:p-8 animate-in fade-in duration-300">
      {/* Main Lesson Card (Exact Middle Column styling) */}
      <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 md:p-10 shadow-xl shadow-emerald-500/5 border-2 border-emerald-100 dark:border-slate-800 max-w-full overflow-hidden">
        {/* Top bar: Level badge + Tap word to translate */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
          <div className="flex items-center gap-2">
            {onOpenStations && (
              <button
                type="button"
                onClick={onOpenStations}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 text-amber-900 shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Mở danh sách các trạm học trong ngày"
              >
                <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Vào trạm</span>
              </button>
            )}
            <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow">
              {displayLevel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 select-none bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 rounded-full px-3 py-1">
            <Globe className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Tap word to translate
            </span>
          </div>
        </div>

        {/* Title */}
        <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase leading-tight">
          {data.title}
        </h2>

        {/* Audio Player */}
        {data.audioUrl && (
          <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <CustomAudioPlayer 
              src={data.audioUrl} 
              title="Nghe bài đọc" 
              subtitle="Audio Lesson (Aura-2 Thalia)" 
            />
          </div>
        )}

        {/* Reading Content */}
        {data.readingText && (
          <div className="mt-8 animate-in fade-in duration-500">
            <div className="prose prose-slate text-lg font-medium leading-loose text-on-surface-variant max-w-none dark:prose-invert [&_p]:text-lg [&_p]:font-medium [&_p]:leading-loose">
              <InteractiveReadingContent html={data.readingText} isLoggedIn={true} />
            </div>
          </div>
        )}
      </div>

      {/* Practice Questions Section (8 questions) */}
      {data.questions && data.questions.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <LessonInlineQuiz
            assignmentId={data.assignmentId}
            assignmentTitle={data.title}
            questions={data.questions}
            isLoggedIn={true}
            classId={classId}
            groupId={groupId}
            onComplete={onComplete}
          />
        </div>
      )}
    </div>
  );
}
