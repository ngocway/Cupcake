import { Skeleton } from "@/components/ui/Skeleton";

export default function LessonLoading() {
  return (
    <div className="min-h-screen bg-transparent flex flex-col h-screen overflow-hidden">
      {/* Header Placeholder */}
      <div className="h-20 border-b border-white/20 bg-white/40 backdrop-blur-md shrink-0" />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main Column */}
        <div className="w-[70%] flex flex-col bg-transparent overflow-y-auto no-scrollbar">
          <div className="px-8 lg:px-12 pt-7 pb-12 space-y-12 max-w-5xl mx-auto w-full">
            {/* Video Player Skeleton */}
            <Skeleton className="aspect-video rounded-3xl shadow-2xl" />

            {/* Content Details Skeleton */}
            <div className="glass rounded-3xl p-10 lg:p-12 space-y-12 border border-white/40">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <Skeleton className="h-6 w-32" />
                   <div className="flex gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-10 w-24 rounded-full" />
                   </div>
                </div>
                <Skeleton className="h-10 w-3/4" />
              </div>

              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>

              {/* Assignment Block Skeleton */}
              <Skeleton className="h-40 w-full rounded-3xl" />
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="w-[30%] p-10 space-y-10 border-l border-white/20">
           {/* Teacher Card Skeleton */}
           <div className="glass rounded-3xl p-8 flex flex-col items-center space-y-6">
              <Skeleton className="w-28 h-28 rounded-full" />
              <div className="space-y-2 w-full flex flex-col items-center">
                 <Skeleton className="h-6 w-1/2" />
                 <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-12 w-full rounded-full" />
           </div>

           {/* Related Items Skeleton */}
           <div className="glass rounded-3xl p-8 space-y-6">
              <Skeleton className="h-4 w-32" />
              <div className="space-y-4">
                 {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4">
                       <Skeleton className="w-20 h-14 rounded-md shrink-0" />
                       <div className="flex-1 space-y-2">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
