import { SidebarHeroSentence } from "./SidebarHeroSentence";
import { LearningGoalsFilter } from "./LearningGoalsFilter";
import { getTranslations } from "next-intl/server";

export async function SidebarContent({ searchParams, initialUserType, studySubject, studyAgeGroup }: { searchParams: any, initialUserType: string, studySubject?: string, studyAgeGroup?: string }) {
  const t = await getTranslations("home");

  return (
    <div className="space-y-10">
      <div>
        <SidebarHeroSentence />
      </div>

      <LearningGoalsFilter activeId={searchParams.goal || searchParams.categoryId} />
    </div>
  );
}
