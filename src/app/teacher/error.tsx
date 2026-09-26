'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, LayoutGrid } from 'lucide-react';

export default function TeacherError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[TeacherError]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-5 text-center p-8 bg-white dark:bg-slate-800 rounded-3xl border border-red-100 dark:border-red-900/30 shadow-sm max-w-lg mx-auto my-8 animate-in fade-in duration-200">
      <div className="size-16 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shadow-inner">
        <AlertCircle className="w-8 h-8 stroke-[2.5px]" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Đã có lỗi xảy ra
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Hệ thống gặp sự cố khi tải dữ liệu. Vui lòng thử tải lại hoặc quay về bảng điều khiển.
        </p>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <Link
          href="/teacher/dashboard"
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm transition-all"
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Bảng điều khiển</span>
        </Link>
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Thử lại</span>
        </button>
      </div>
    </div>
  );
}
