
import React from 'react';

export function SidebarSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
      <div className="space-y-3 pt-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-full" />
        ))}
      </div>
      <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24 mb-6" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-8 bg-slate-100 dark:bg-slate-800/50 rounded-lg w-16" />
          ))}
        </div>
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
