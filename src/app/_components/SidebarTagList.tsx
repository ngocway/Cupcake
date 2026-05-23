"use client"
import Link from "next/link"

interface Props {
  tags: string[]
  searchParams: any
}

export function SidebarTagList({ tags }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag: string) => (
        <Link
          key={tag}
          href={`/tags/${encodeURIComponent(tag)}`}
          className="px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 bg-white border border-primary/10 text-primary/60 hover:border-primary/40 hover:text-primary hover:bg-primary/5 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
        >
          {tag}
        </Link>
      ))}
    </div>
  )
}
