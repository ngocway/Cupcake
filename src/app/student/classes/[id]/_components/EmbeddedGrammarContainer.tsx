'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getStudentGrammarLessonData, completeGrammarLesson } from '@/app/student/classes/actions';
import { InstructionsBlock } from '@/components/common/InstructionsBlock';
import { BookOpen, CheckCircle2, ArrowRight, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { CEFR_LEVELS, CefrLevel } from '@/lib/grammar-taxonomy';
import { getCachedGrammarData, setCachedGrammarData, fetchGrammarDataWithCache } from '../_utils/assignmentCache';

interface EmbeddedGrammarContainerProps {
  assignmentId: string;
  classId?: string;
  groupId?: string;
  onComplete?: (score: number, assignmentId: string) => void;
  onNextActivity?: () => void;
}

export function EmbeddedGrammarContainer({
  assignmentId,
  classId,
  groupId,
  onComplete,
  onNextActivity,
}: EmbeddedGrammarContainerProps) {
  const cached = getCachedGrammarData(assignmentId);
  const [data, setData] = useState<any>(cached || null);
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadData = useCallback(async (force = false) => {
    const existing = getCachedGrammarData(assignmentId);
    if (!force && existing) {
      setData(existing);
      setIsLoading(false);
      return;
    }
    if (!existing) setIsLoading(true);
    setError(null);
    try {
      const res = await fetchGrammarDataWithCache(assignmentId, force);
      setData(res);
      // If already submitted in past, notify parent
      if (res.isSubmitted && onComplete && res.score !== null) {
        onComplete(res.score, assignmentId);
      }
    } catch (err: any) {
      console.error('Failed to load grammar lesson data:', err);
      setError(err?.message || 'Không thể tải nội dung bài học.');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, onComplete]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkComplete = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await completeGrammarLesson(assignmentId, classId, groupId);
      if (res.success) {
        const updated = { ...data, isSubmitted: true, score: 10 };
        setData(updated);
        setCachedGrammarData(assignmentId, updated);
        if (onComplete) {
          onComplete(10, assignmentId);
        }
      } else {
        setSubmitError('Không thể hoàn thành bài học. Vui lòng thử lại.');
      }
    } catch (err: any) {
      console.error('Failed to complete grammar lesson:', err);
      setSubmitError(err?.message || 'Có lỗi xảy ra khi hoàn thành bài học.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const lvlCfg = CEFR_LEVELS.find((l) => l.id === (data.level as CefrLevel)) ?? CEFR_LEVELS[0];

  return (
    <div className="w-full h-full min-h-[580px] lg:min-h-[660px] bg-slate-50 dark:bg-slate-950 overflow-y-auto custom-scrollbar p-3 sm:p-6 lg:p-8 animate-in fade-in duration-200">
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Header Banner */}
        <div className="p-5 sm:p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${lvlCfg.bg} ${lvlCfg.color} border ${lvlCfg.border}`}>
                {lvlCfg.label}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <BookOpen className="w-3 h-3 text-indigo-500" />
                {data.topicLabel}
              </span>
              {data.isSubmitted && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-extrabold text-[10px] border border-emerald-200/60">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Đã hoàn thành lý thuyết
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 font-headline tracking-tight">
              {data.lessonLabel}
            </h1>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {data.isSubmitted ? (
              <div className="px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-black text-xs inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>10.0 / 10.0</span>
              </div>
            ) : (
              <button
                onClick={handleMarkComplete}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs tracking-wide shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>{isSubmitting ? 'Đang lưu...' : 'Đã hiểu bài (+10 điểm)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Lesson Theory Body */}
        <div className="p-5 sm:p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
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

        {submitError && (
          <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Bottom Completion Card */}
        <div className="p-6 rounded-[2rem] bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                {data.isSubmitted ? 'Bạn đã hoàn thành phần lý thuyết này!' : 'Đã nắm vững kiến thức ngữ pháp này?'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {data.isSubmitted ? 'Hãy làm các bài tập trắc nghiệm & trò chơi để củng cố ghi nhớ.' : 'Bấm hoàn thành để ghi nhận điểm và sẵn sàng làm bài tập.'}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2.5">
            {!data.isSubmitted ? (
              <button
                onClick={handleMarkComplete}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>{isSubmitting ? 'Đang lưu...' : 'Hoàn thành lý thuyết (+10đ)'}</span>
              </button>
            ) : onNextActivity ? (
              <button
                onClick={onNextActivity}
                className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2"
              >
                <span>Chuyển sang bài tiếp theo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
