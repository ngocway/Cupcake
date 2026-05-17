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

      <div className="mt-auto p-6 bg-secondary/5 rounded-[2rem] border border-secondary/10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined">lightbulb</span>
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-secondary">Solar Tip</span>
        </div>
        <p className="text-[11px] font-bold text-primary/60 leading-relaxed">
          Knowledge is like sunlight—it's most powerful when shared freely. Keep exploring!
        </p>
      </div>
    </div>
  );
}
