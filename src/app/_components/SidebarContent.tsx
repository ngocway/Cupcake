
import { getCachedCategoryTree, getCachedTags } from "@/lib/cached-queries";
import { SidebarCategoryList } from "./SidebarCategoryList";
import { SidebarTagList } from "./SidebarTagList";

export async function SidebarContent({ searchParams }: { searchParams: any }) {
  const [categories, tags] = await Promise.all([
    getCachedCategoryTree(),
    getCachedTags()
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-6">Phân loại</h2>
        <SidebarCategoryList categories={categories} activeId={searchParams.categoryId} />
      </div>

      <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
        <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-6">Thẻ phổ biến</h2>
        <SidebarTagList tags={tags} searchParams={searchParams} />
      </div>
    </div>
  );
}
