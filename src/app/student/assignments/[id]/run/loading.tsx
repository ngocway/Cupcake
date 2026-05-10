import { Skeleton } from "@/components/ui/Skeleton";

export default function AssignmentLoading() {
  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Header Skeleton */}
      <div className="h-12 border-b border-outline-variant/20 bg-white dark:bg-slate-900 flex items-center px-6 shrink-0">
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content (70%) */}
        <div className="w-[70%] flex flex-col border-r border-outline-variant/30">
          <div className="flex-1 p-8 lg:p-12 pl-32 lg:pl-40 space-y-12">
            <div className="space-y-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-16 w-3/4" />
              <div className="flex gap-3 items-center">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>

            {/* Content Blocks */}
            <div className="space-y-6">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          </div>

          {/* Bottom Bar Skeleton */}
          <div className="h-20 border-t border-outline-variant/20 bg-white dark:bg-slate-900 flex items-center justify-center gap-24 px-6">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-12 w-48 rounded-xl" />
          </div>
        </div>

        {/* Sidebar (30%) */}
        <div className="w-[30%] p-10 space-y-12 bg-white dark:bg-slate-900">
          <div className="space-y-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
