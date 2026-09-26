import React from 'react';

export default function StudentClassesLoading() {
  return (
    <div className="max-w-[1440px] w-full mx-auto pt-2 sm:pt-4 space-y-8 animate-in fade-in duration-300">
      {/* 4-Column Grid Skeleton matching exact class cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="bg-white/90 dark:bg-slate-800/90 rounded-[28px] sm:rounded-[32px] border-2 border-slate-100 dark:border-slate-700/80 overflow-hidden shadow-xs flex flex-col justify-between"
          >
            {/* Playful Banner Header Skeleton */}
            <div className="h-28 sm:h-32 w-full bg-slate-200 dark:bg-slate-700 animate-pulse p-4 sm:p-5 flex items-start justify-between">
              <div className="h-6 w-20 bg-white/40 dark:bg-slate-600/40 rounded-full" />
              <div className="h-6 w-24 bg-white/40 dark:bg-slate-600/40 rounded-full" />
            </div>

            {/* Content Skeleton */}
            <div className="p-5 sm:p-6 space-y-5">
              <div className="space-y-2">
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-700/60 rounded-md animate-pulse" />
              </div>

              {/* Stat Chips Skeleton */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="h-16 bg-slate-100 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
                <div className="h-16 bg-slate-100 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
              </div>

              {/* Button Skeleton */}
              <div className="h-11 w-full bg-slate-200 dark:bg-slate-700 rounded-xl sm:rounded-2xl animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
