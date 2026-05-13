import React from 'react';

export default function LessonLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col h-screen overflow-hidden">
      {/* Skeleton Header */}
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse" />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Skeleton */}
        <div className="w-[70%] p-8 lg:p-12 space-y-12 overflow-y-auto">
          <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-3/4 animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full animate-pulse" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full animate-pulse" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3 animate-pulse" />
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="w-[30%] p-10 space-y-10 border-l border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <div className="space-y-6">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 animate-pulse" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-20 h-14 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full animate-pulse" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
