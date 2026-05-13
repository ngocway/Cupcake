import React from 'react';

export default function AssignmentLobbyLoading() {
  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden relative bg-slate-50 dark:bg-slate-950">
      {/* Skeleton Header */}
      <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse" />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Skeleton */}
        <div className="w-[70%] p-8 lg:p-12 pl-32 lg:pl-40 space-y-12">
          <div className="space-y-4">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-12 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>

          <div className="space-y-6">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="w-[30%] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 space-y-12">
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
