export default function Loading() {
  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-50">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="space-y-2">
          <div className="w-48 h-8 bg-slate-200 rounded animate-pulse" />
          <div className="w-32 h-5 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl animate-pulse" />
              <div className="space-y-2">
                <div className="w-20 h-3 bg-slate-100 rounded animate-pulse" />
                <div className="w-12 h-6 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="h-12 bg-slate-100 rounded-2xl w-96 animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-50 p-8 rounded-[2rem] animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-24 h-4 bg-slate-200 rounded animate-pulse" />
                <div className="w-20 h-4 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="w-full h-5 bg-slate-200 rounded animate-pulse mb-2" />
              <div className="w-32 h-4 bg-slate-200 rounded animate-pulse mb-4" />
              <div className="w-full h-16 bg-slate-200 rounded animate-pulse mb-4" />
              <div className="w-20 h-4 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Centered Loading Spinner Overlay */}
      <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-3xl shadow-2xl flex flex-col items-center justify-center border border-slate-200/50 dark:border-slate-800/50 pointer-events-auto">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
