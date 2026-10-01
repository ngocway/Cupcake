'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getStudentBookData } from '@/app/student/classes/actions';
import BookReaderClient from '@/app/student/books/[bookId]/BookReaderClient';
import { BookText, AlertCircle, RefreshCw } from 'lucide-react';
import { getCachedBookData, setCachedBookData, fetchBookDataWithCache } from '../_utils/assignmentCache';

interface EmbeddedBookContainerProps {
  assignmentId: string;
  onComplete?: (score: number | null, assignmentId: string) => void;
}

export function EmbeddedBookContainer({
  assignmentId,
  onComplete,
}: EmbeddedBookContainerProps) {
  const cached = getCachedBookData(assignmentId);
  const [data, setData] = useState<any>(cached || null);
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (force = false) => {
    const existing = getCachedBookData(assignmentId);
    if (!force && existing) {
      setData(existing);
      setIsLoading(false);
      return;
    }
    if (!existing) setIsLoading(true);
    setError(null);
    try {
      const res = await fetchBookDataWithCache(assignmentId, force);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load book reader data:', err);
      setError(err?.message || 'Không thể tải nội dung bài đọc.');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[580px] lg:min-h-[660px] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-150">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
            <BookText className="w-6 h-6 animate-pulse text-emerald-500" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              Đang mở sách đọc & luyện nói
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Đang nạp hình ảnh và giọng đọc mẫu...
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full w-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.book) {
    return (
      <div className="w-full h-full min-h-[580px] lg:min-h-[660px] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              Không thể tải sách đọc
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
    <div className="w-full h-full min-h-[580px] lg:min-h-[660px] relative bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <BookReaderClient
        book={data.book}
        assignmentId={assignmentId}
        onComplete={onComplete}
        isEmbeddedInCanvas={true}
      />
    </div>
  );
}
