
import React from 'react';

export function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse w-full">
      <div className="h-3 w-24 bg-amber-950/10 dark:bg-slate-700/50 rounded-sm mb-1" />
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-11 bg-amber-950/10 dark:bg-slate-700/50 rounded-[14px] w-full" />
        ))}
      </div>
    </div>
  );
}

export function ContentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="space-y-4 animate-pulse">
          <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
