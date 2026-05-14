export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-pulse">
      {/* Title & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-4">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-64" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-96" />
        </div>
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl w-48" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="space-y-4">
            <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-3xl" />
            <div className="space-y-2">
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
