import React from "react";

export default function PublicLessonDetailLoading() {
  return (
    <div className="min-h-screen font-body relative bg-[#e2f0e7] text-foreground">
      {/* Lightweight background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-gradient-to-tr from-[#e6fcf0] via-[#f2faf5] to-[#cbf9e2]" />

      {/* Lightweight Header Placeholder */}
      <div className="h-16 border-b border-white/40 bg-white/90 px-6 flex items-center justify-between">
        <div className="w-32 h-8 bg-emerald-200/60 rounded-xl animate-pulse" />
        <div className="w-48 h-8 bg-emerald-100/60 rounded-xl animate-pulse hidden sm:block" />
        <div className="w-24 h-8 bg-emerald-200/60 rounded-full animate-pulse" />
      </div>

      {/* 3-column layout skeleton */}
      <div className="pt-8 pb-16 px-4 sm:px-6 md:px-10 max-w-[1600px] mx-auto">
        <div className="w-full flex flex-col lg:flex-row items-start gap-8">

          {/* LEFT SIDEBAR: Key Vocabulary Skeleton */}
          <aside className="w-full lg:w-[300px] shrink-0">
            <div className="bg-white/90 dark:bg-slate-900/90 rounded-[28px] p-6 space-y-4 border border-emerald-100 shadow-sm">
              <div className="h-5 w-36 bg-emerald-200/60 rounded-full animate-pulse" />
              <div className="space-y-3 pt-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-emerald-50/80 rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT: Lesson Text & Media Skeleton */}
          <main className="flex-1 min-w-0 space-y-8 w-full">
            {/* Video Placeholder */}
            <div className="aspect-video w-full bg-slate-800/90 rounded-[28px] animate-pulse shadow-md" />

            {/* Main Lesson Card Skeleton */}
            <div className="bg-white/90 dark:bg-slate-900/90 rounded-[28px] p-6 md:p-10 space-y-6 border-2 border-emerald-100 shadow-md">
              {/* Badge & Action buttons */}
              <div className="flex justify-between items-center">
                <div className="h-6 w-24 bg-emerald-500/30 rounded-full animate-pulse" />
                <div className="h-8 w-32 bg-amber-100/60 rounded-full animate-pulse" />
              </div>

              {/* Title */}
              <div className="h-10 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />

              {/* Audio player placeholder */}
              <div className="h-16 w-full bg-emerald-50 rounded-2xl animate-pulse border border-emerald-100" />

              {/* Reading Content Paragraphs Skeleton */}
              <div className="space-y-4 pt-4">
                <div className="h-5 w-full bg-slate-200/80 rounded-lg animate-pulse" />
                <div className="h-5 w-11/12 bg-slate-200/80 rounded-lg animate-pulse" />
                <div className="h-5 w-4/5 bg-slate-200/80 rounded-lg animate-pulse" />
                <div className="h-5 w-full bg-slate-200/80 rounded-lg animate-pulse" />
                <div className="h-5 w-3/4 bg-slate-200/80 rounded-lg animate-pulse" />
              </div>
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}

