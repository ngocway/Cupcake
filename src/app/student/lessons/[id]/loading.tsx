import React from 'react';

export default function StudentLessonDetailLoading() {
  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden relative bg-[#F4EFE6] dark:bg-slate-950 font-body">
      {/* Fake Header */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse" />
      
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Main Column */}
        <div className="w-full lg:w-[70%] p-8 lg:p-12 space-y-8 overflow-y-auto no-scrollbar">
          {/* Back button skeleton */}
          <div className="h-10 w-24 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
          
          {/* Video Placeholder */}
          <div className="aspect-video w-full bg-slate-200 dark:bg-slate-800 rounded-[2.5rem] animate-pulse" />
          
          {/* Details Card */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[3.5rem] p-10 space-y-6 shadow-xl border border-primary/5">
            <div className="h-10 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
            </div>
            <div className="h-40 w-full bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse" />
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="hidden lg:block lg:w-[30%] border-l border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-10 space-y-8 overflow-y-auto no-scrollbar">
          <div className="h-60 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <div className="h-60 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        </div>
      </div>

      {/* Centered Loading Spinner Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-3 border border-slate-200/50 dark:border-slate-800/50 pointer-events-auto">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">
            Đang mở bài học...
          </span>
        </div>
      </div>
    </div>
  );
}
