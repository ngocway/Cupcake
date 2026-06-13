import React from 'react';

export default function SentenceBuilderSelectLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-16 md:pt-8 pb-12 font-body relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 space-y-10">
        {/* Fake Back Button */}
        <div className="h-10 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full animate-pulse shadow-sm" />

        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row items-center gap-6 animate-pulse">
          <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-[28px]" />
          <div className="space-y-3 flex-1">
            <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[32px] p-0 overflow-hidden shadow-sm flex flex-col h-[380px] animate-pulse">
              {/* Thumbnail Placeholder */}
              <div className="w-full h-44 bg-slate-200 dark:bg-slate-800" />
              
              {/* Details placeholder */}
              <div className="p-6 flex flex-col flex-1 justify-between">
                <div className="space-y-3">
                  <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
                <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-5 flex items-center justify-between">
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Centered Loading Spinner Overlay */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-3xl shadow-2xl flex flex-col items-center justify-center border border-slate-200/50 dark:border-slate-800/50 pointer-events-auto">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
