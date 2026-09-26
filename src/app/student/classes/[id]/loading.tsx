import React from 'react';

export default function StudentClassDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-pulse pt-2 sm:pt-4">
      {/* Header Banner Skeleton */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-blue-600/80 to-indigo-700/80 p-10 md:p-14 text-white shadow-lg">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex gap-2">
            <div className="h-4 w-16 bg-white/30 rounded-md" />
            <div className="h-4 w-4 bg-white/20 rounded-md" />
            <div className="h-4 w-16 bg-white/30 rounded-md" />
          </div>
          <div className="h-10 md:h-12 w-3/4 max-w-md bg-white/40 rounded-2xl" />
          <div className="h-5 w-48 bg-white/30 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Assignment Groups Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-7 w-56 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>

          {/* Group Card Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-6 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                  <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                  <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                </div>
                <div className="h-9 w-full bg-slate-100 dark:bg-slate-700/60 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Class Info Skeleton */}
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="h-6 w-36 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-7 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
