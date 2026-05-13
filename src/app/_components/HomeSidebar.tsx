
import { SidebarSkeleton } from "./HomeSkeletons";
import { Suspense } from "react";
import { SidebarContent } from "./SidebarContent";

export async function HomeSidebar({ searchParams }: { searchParams: any }) {
  return (
    <aside className="hidden lg:flex w-80 flex-col p-8 gap-10 glass rounded-3xl h-fit max-h-[calc(100vh-10rem)] overflow-y-auto no-scrollbar sticky top-32 shadow-xl">
      <Suspense fallback={<SidebarSkeleton />}>
        {/* @ts-expect-error Server Component */}
        <SidebarContent searchParams={searchParams} />
      </Suspense>
    </aside>
  );
}
