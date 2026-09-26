export default function ClassDetailLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-56 bg-slate-200 dark:bg-slate-700 rounded-md" />
          <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded-md" />
          <div className="h-9 w-9 bg-slate-200 dark:bg-slate-700 rounded-md" />
        </div>
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-md border border-slate-100 dark:border-slate-700 p-4 flex flex-col gap-2">
            <div className="h-3 w-16 bg-slate-100 dark:bg-slate-700 rounded" />
            <div className="h-7 w-10 bg-slate-200 dark:bg-slate-600 rounded" />
          </div>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-1 border-b border-slate-100 dark:border-slate-800">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-24 bg-slate-100 dark:bg-slate-800 rounded-t-md" />
        ))}
      </div>

      {/* Assignment group skeletons */}
      <div className="flex flex-col gap-4">
        {[1, 2].map((g) => (
          <div key={g} className="bg-white dark:bg-slate-800 rounded-md border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
              <div className="h-5 w-48 bg-slate-200 dark:bg-slate-600 rounded" />
              <div className="h-5 w-16 bg-slate-100 dark:bg-slate-700 rounded" />
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {[1, 2, 3].map((r) => (
                <div key={r} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-4 w-3/5 bg-slate-200 dark:bg-slate-600 rounded" />
                    <div className="h-3 w-1/3 bg-slate-100 dark:bg-slate-700 rounded" />
                  </div>
                  <div className="h-6 w-24 bg-slate-100 dark:bg-slate-700 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
