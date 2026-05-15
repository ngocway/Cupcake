
import { SidebarSkeleton } from "./HomeSkeletons";
import { Suspense } from "react";
import { SidebarContent } from "./SidebarContent";
import { StickySidebarWrapper } from "./StickySidebarWrapper";

export async function HomeSidebar({ searchParams }: { searchParams: any }) {
  return (
    <StickySidebarWrapper>
      <Suspense fallback={<SidebarSkeleton />}>
        <SidebarContent searchParams={searchParams} />
      </Suspense>
    </StickySidebarWrapper>
  );
}
