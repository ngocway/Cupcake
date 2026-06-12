
import { SidebarSkeleton } from "./HomeSkeletons";
import { Suspense } from "react";
import { SidebarContent } from "./SidebarContent";
import { StickySidebarWrapper } from "./StickySidebarWrapper";

export async function HomeSidebar({ searchParams, initialUserType, studySubject, studyAgeGroup }: { searchParams: any, initialUserType: string, studySubject?: string, studyAgeGroup?: string }) {
  return (
    <StickySidebarWrapper>
      <Suspense fallback={<SidebarSkeleton />}>
        <SidebarContent searchParams={searchParams} initialUserType={initialUserType} studySubject={studySubject} studyAgeGroup={studyAgeGroup} />
      </Suspense>
    </StickySidebarWrapper>
  );
}
