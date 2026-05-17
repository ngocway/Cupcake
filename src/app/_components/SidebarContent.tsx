import { getCachedCategoryTree, getCachedTags } from "@/lib/cached-queries";
import { SidebarCategoryList } from "./SidebarCategoryList";
import { SidebarTagList } from "./SidebarTagList";
import { getTranslations } from "next-intl/server";

export async function SidebarContent({ searchParams }: { searchParams: any }) {
  const t = await getTranslations("home");
  const [categories, tags] = await Promise.all([
    getCachedCategoryTree(),
    getCachedTags()
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-6">{t("categories")}</h2>
        <SidebarCategoryList categories={categories} activeId={searchParams.categoryId} />
      </div>

      <div className="pt-10 border-t border-primary/5">
        <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-6">{t("popularTags")}</h2>
        <SidebarTagList tags={tags} searchParams={searchParams} />
      </div>
    </div>
  );
}
