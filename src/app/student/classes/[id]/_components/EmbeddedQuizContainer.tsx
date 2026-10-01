'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import KidTeenQuizRunner from '@/app/student/assignments/[id]/run/quiz/KidTeenQuizRunner';
import { getStudentQuizRunnerData, ensureStudentSubmission } from '@/app/student/assignments/[id]/run/actions';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { getCachedQuizData, setCachedQuizData, fetchQuizDataWithCache } from '../_utils/assignmentCache';

interface EmbeddedQuizContainerProps {
  assignmentId: string;
  autoStart?: boolean;
  classId?: string;
  groupId?: string;
  onComplete?: (score: number, assignmentId: string) => void;
}

export function EmbeddedQuizContainer({
  assignmentId,
  autoStart = false,
  classId,
  groupId,
  onComplete,
}: EmbeddedQuizContainerProps) {
  const cacheKey = `${assignmentId}_${classId || ''}_${groupId || ''}`;
  const cached = getCachedQuizData(cacheKey) || getCachedQuizData(assignmentId);
  const [data, setData] = useState<any>(cached || null);
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const loadData = useCallback(async (forceNew = false) => {
    const existing = getCachedQuizData(cacheKey) || getCachedQuizData(assignmentId);
    if (!forceNew && existing) {
      setData(existing);
      setIsLoading(false);
      // If preloaded without a submissionId and not review mode, ensure submission in background JIT
      if (!existing.submissionId && !existing.isReviewMode) {
        try {
          const sub = await ensureStudentSubmission(assignmentId, classId, groupId);
          if (sub?.id) {
            const updated = { ...existing, submissionId: sub.id, submissionScore: sub.score };
            setCachedQuizData(cacheKey, updated);
            setData(updated);
          }
        } catch (e) {
          console.error('Failed to ensure submission JIT:', e);
        }
      }
      return;
    }
    if (!existing) setIsLoading(true);
    setError(null);
    try {
      let res = await fetchQuizDataWithCache(assignmentId, forceNew, false, classId, groupId);
      if (res && !res.submissionId && !res.isReviewMode) {
        const sub = await ensureStudentSubmission(assignmentId, classId, groupId);
        if (sub?.id) {
          res = { ...res, submissionId: sub.id, submissionScore: sub.score };
          setCachedQuizData(cacheKey, res);
        }
      }
      setData(res);
    } catch (err: any) {
      console.error('Failed to load quiz runner data:', err);
      setError(err?.message || 'Không thể tải bài tập. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadData(false);
  }, [loadData, retryKey]);

  const handleRetry = useCallback(() => {
    loadData(true);
  }, [loadData]);

  // Stable memoized promises for React.use() / Suspense inside KidTeenQuizRunner
  const extraDataPromise = useMemo(() => {
    return data?.extraData ? Promise.resolve(data.extraData) : Promise.resolve(null);
  }, [data?.extraData]);

  const questionTranslationsPromise = useMemo(() => {
    return data?.questionTranslations ? Promise.resolve(data.questionTranslations) : Promise.resolve({});
  }, [data?.questionTranslations]);

  const assignmentTranslationsPromise = useMemo(() => {
    return data?.assignmentTranslations !== undefined ? Promise.resolve(data.assignmentTranslations) : Promise.resolve(null);
  }, [data?.assignmentTranslations]);

  const relatedAssignmentsPromise = useMemo(() => {
    return Promise.resolve([]);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[580px] lg:min-h-[660px] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-150">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
            <Sparkles className="w-6 h-6 animate-spin text-blue-500" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              Đang chuẩn bị câu hỏi bài tập
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Bài tập tải tức thì qua kết nối dữ liệu trực tiếp...
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-full animate-pulse" />
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
              Không thể tải bài tập
            </h3>
            <p className="text-xs text-rose-500 font-semibold mt-1">
              {error || 'Đã có lỗi xảy ra khi nạp câu hỏi.'}
            </p>
          </div>
          <button
            onClick={() => setRetryKey(k => k + 1)}
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
    <div className="w-full h-full min-h-[580px] lg:min-h-[660px] relative bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      <KidTeenQuizRunner
        key={`${assignmentId}_${data.submissionId}`}
        assignment={data.assignment}
        submissionId={data.submissionId}
        questions={data.questions}
        cefrLevel={data.assignment.level || 'a1'}
        initialAnswers={data.initialAnswers}
        extraDataPromise={extraDataPromise}
        relatedAssignmentsPromise={relatedAssignmentsPromise}
        questionTranslationsPromise={questionTranslationsPromise}
        assignmentTranslationsPromise={assignmentTranslationsPromise}
        isGuest={false}
        isReviewMode={data.isReviewMode}
        submissionScore={data.submissionScore}
        isFromClass={true}
        autoStart={autoStart}
        onComplete={onComplete}
        onRetry={handleRetry}
        isEmbeddedInCanvas={true}
      />
    </div>
  );
}
