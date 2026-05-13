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
            className={`px-4 py-2 rounded-xl text-tiny font-bold transition-all duration-300 ${
              isSelected
                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                : "bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            {tag}
          </FilterLink>
        )
      })}
    </div>
  )
}
