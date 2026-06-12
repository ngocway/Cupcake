import { getCachedCategoryTree, getCachedTags } from "@/lib/cached-queries";
import { SidebarCategoryList } from "./SidebarCategoryList";
import { SidebarTagList } from "./SidebarTagList";
import { SidebarHeroSentence } from "./SidebarHeroSentence";
import { LearningGoalsFilter } from "./LearningGoalsFilter";
import { getTranslations } from "next-intl/server";

export async function SidebarContent({ searchParams, initialUserType, studySubject, studyAgeGroup }: { searchParams: any, initialUserType: string, studySubject?: string, studyAgeGroup?: string }) {
  const t = await getTranslations("home");
  const [categories, tags] = await Promise.all([
    getCachedCategoryTree(),
    getCachedTags()
  ]);

  return (
    <div className="space-y-10">
      <div>
        <SidebarHeroSentence categoryTree={categories} />
      </div>

      <LearningGoalsFilter categories={categories} activeId={searchParams.categoryId} />
    </div>
  );
}
