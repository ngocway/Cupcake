"use client"

import { useState, useTransition } from "react"
import { toggleFavoriteAssignment } from "@/actions/public-materials"
import { useRouter } from "next/navigation"

export function BookmarkButton({ 
  assignmentId, 
  initialIsBookmarked,
  isLoggedIn
}: { 
  assignmentId: string, 
  initialIsBookmarked: boolean,
  isLoggedIn: boolean
}) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập để lưu bài tập!")
      return
    }

    const previousState = isBookmarked
    setIsBookmarked(!previousState)

    startTransition(async () => {
      const result = await toggleFavoriteAssignment(assignmentId)
      if (result.error) {
        setIsBookmarked(previousState)
        alert(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <button 
      onClick={handleToggle}
      disabled={isPending}
      className={`absolute top-4 right-4 size-10 backdrop-blur-md rounded-full flex items-center justify-center transition-all shadow-lg ${
        isBookmarked ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-300 hover:text-red-500'
      } ${isPending ? 'opacity-50' : ''}`}
    >
      <span className={`material-symbols-outlined font-icon-bold text-[20px] ${isBookmarked ? 'fill-current' : ''}`}>
        favorite
      </span>
    </button>
  )
}
