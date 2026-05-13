
import { getCachedCategoryTree, getCachedTags } from "@/lib/cached-queries";
import Link from "next/link";
import { SidebarCategoryList } from "./SidebarCategoryList";

export async function SidebarContent({ searchParams }: { searchParams: any }) {
  const [categories, tags] = await Promise.all([
    getCachedCategoryTree(),
    getCachedTags()
  ]);

  const activeCategoryId = searchParams.categoryId;
  const activeTags = searchParams.tags?.split(",") || [];

  return (
    <div className="space-y-10">
      {/* Search Header */}
      <div>
        <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-6">Phân loại</h2>
        <SidebarCategoryList categories={categories} activeId={activeCategoryId} />
      </div>

      {/* Tags Section */}
      <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
        <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-6">Thẻ phổ biến</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag: string) => {
            const isSelected = activeTags.includes(tag);
            const newTags = isSelected 
              ? activeTags.filter((t: string) => t !== tag)
              : [...activeTags, tag];
            
            const params = new URLSearchParams(searchParams);
            if (newTags.length > 0) params.set("tags", newTags.join(","));
            else params.delete("tags");

            return (
              <Link
                key={tag}
                href={`/?${params.toString()}`}
                scroll={false}
                className={`px-4 py-2 rounded-xl text-tiny font-bold transition-all duration-300 ${
                  isSelected
                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {tag}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
