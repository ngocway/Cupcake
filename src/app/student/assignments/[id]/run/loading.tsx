import React from "react";

export default function AssignmentRunLoading() {
  return (
    <div className="min-h-screen font-body flex flex-col items-center justify-center p-6 w-full relative bg-[#8cd2f6]">
      {/* Start Card Skeleton */}
      <div className="bg-white/95 dark:bg-slate-900/95 rounded-[3rem] border-4 border-white dark:border-slate-800 shadow-xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden flex flex-col items-center space-y-6">
        {/* Top colored strip */}
        <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-500" />

        {/* Teacher avatar placeholder */}
        <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-950/40 animate-pulse border-4 border-white shadow-md shrink-0" />

        {/* Tag line placeholder */}
        <div className="h-4 w-32 bg-purple-100 dark:bg-purple-950/40 rounded-full animate-pulse" />

        {/* Title placeholder */}
        <div className="h-10 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />

        {/* Meta badges placeholder */}
        <div className="flex flex-wrap items-center justify-center gap-4 w-full">
          <div className="h-10 w-36 bg-purple-50 dark:bg-purple-950/40 rounded-2xl animate-pulse" />
          <div className="h-10 w-36 bg-purple-50 dark:bg-purple-950/40 rounded-2xl animate-pulse" />
        </div>

        {/* Mode selection buttons placeholder */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-lg justify-center pt-2">
          <div className="h-14 w-full sm:w-1/2 rounded-3xl bg-purple-100 dark:bg-purple-950/40 animate-pulse" />
          <div className="h-14 w-full sm:w-1/2 rounded-3xl bg-orange-200 dark:bg-amber-950/40 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

