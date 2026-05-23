
import { SidebarSkeleton } from "./HomeSkeletons";
import { Suspense } from "react";
import { SidebarContent } from "./SidebarContent";
import { StickySidebarWrapper } from "./StickySidebarWrapper";

export async function HomeSidebar({ searchParams, initialUserType }: { searchParams: any, initialUserType: string }) {
  return (
    <StickySidebarWrapper>
      <Suspense fallback={<SidebarSkeleton />}>
        <SidebarContent searchParams={searchParams} initialUserType={initialUserType} />
      </Suspense>
    </StickySidebarWrapper>
  );
}
