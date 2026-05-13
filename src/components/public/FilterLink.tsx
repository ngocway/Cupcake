"use client"
import { useRouter } from "next/navigation"
import { useTransition, useEffect } from "react"
import { useContentStore } from "@/store/useContentStore"

interface FilterLinkProps {
  href: string
  className?: string
  children: React.ReactNode
  scroll?: boolean
}

/**
 * Drop-in replacement for <Link> used inside filter controls (sidebar categories, tags).
 * Wraps router.push in useTransition to expose isPending, then syncs it to the global
 * isFiltering flag in useContentStore so LandingPage can show a progress bar + grid overlay.
 */
export function FilterLink({ href, className, children, scroll = false }: FilterLinkProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const setFiltering = useContentStore(s => s.setFiltering)

  // Sync local isPending → global store
  useEffect(() => {
    setFiltering(isPending)
  }, [isPending, setFiltering])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setFiltering(true) // Optimistic: flag immediately, before transition starts
    startTransition(() => {
      router.push(href, { scroll })
    })
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
