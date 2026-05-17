"use client"
import { FilterLink } from "@/components/public/FilterLink"

interface Props {
  tags: string[]
  searchParams: any
}

export function SidebarTagList({ tags, searchParams }: Props) {
  const activeTags: string[] = searchParams.tags?.split(",").filter(Boolean) || []

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag: string) => {
        const isSelected = activeTags.includes(tag)
        const newTags = isSelected
          ? activeTags.filter((t: string) => t !== tag)
          : [...activeTags, tag]

        const params = new URLSearchParams(searchParams)
        if (newTags.length > 0) params.set("tags", newTags.join(","))
        else params.delete("tags")

        return (
          <FilterLink
            key={tag}
            href={`/?${params.toString()}`}
            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
              isSelected
                ? "bg-secondary text-on-secondary shadow-lg shadow-secondary/20 scale-110"
                : "bg-white border border-primary/10 text-primary/60 hover:border-primary/40 hover:text-primary hover:bg-primary/5"
            }`}
          >
            {tag}
          </FilterLink>
        )
      })}
    </div>
  )
}
