import React from 'react';

export default function StudentLoading() {
  return (
    <div className="p-8 lg:p-12 space-y-12 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
      </div>

      {/* Grid Skeleton (Lessons/Assignments Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            {/* Thumbnail Placeholder */}
            <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-800 animate-pulse" />
            
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                <div className="h-6 w-full bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
              </div>
              
              <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                </div>
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
