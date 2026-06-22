import { SidebarHeroSentence } from "./SidebarHeroSentence";
import { LearningGoalsFilter } from "./LearningGoalsFilter";
import { getTranslations } from "next-intl/server";
import { getOnboardingConfig } from "@/actions/user-preferences-actions";

export async function SidebarContent({ searchParams, initialUserType, studySubject, studyAgeGroup }: { searchParams: any, initialUserType: string, studySubject?: string, studyAgeGroup?: string }) {
  const t = await getTranslations("home");
  const config = await getOnboardingConfig();

  return (
    <div className="space-y-6">
      {/* 1. "I'm a..." sentence → 2. Subject selector → 3. Level selector (all inside SidebarHeroSentence) */}
      <SidebarHeroSentence config={config} />

      {/* 4. Learning Goals */}
      <LearningGoalsFilter config={config} activeId={searchParams.goal || searchParams.categoryId} />
    </div>
  );
}
