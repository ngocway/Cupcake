export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-6 md:p-10 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-48" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-96" />
      </div>

      {/* Filter Skeleton */}
      <div className="max-w-7xl mx-auto flex gap-4">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-full w-32" />
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-full w-32" />
      </div>

      {/* Grid Skeleton */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 space-y-4 border border-slate-100 dark:border-slate-800">
            <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
          </div>
        ))}
      </div>

      {/* Centered Loading Spinner Overlay */}
      <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-3xl shadow-2xl flex flex-col items-center justify-center border border-slate-200/50 dark:border-slate-800/50 pointer-events-auto">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  )
}
