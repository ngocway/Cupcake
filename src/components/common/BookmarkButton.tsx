
"use client"

import { useState, useTransition } from "react"
import { Bookmark } from "lucide-react"
import { toggleFavoriteAssignment, toggleFavoriteLesson } from "@/actions/public-materials"
import { toast } from "sonner"

interface BookmarkButtonProps {
    type: 'assignment' | 'lesson' | 'ASSIGNMENT' | 'LESSON'
    id: string
    initialIsBookmarked: boolean
    className?: string
}

export function BookmarkButton({ type, id, initialIsBookmarked, className }: BookmarkButtonProps) {
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
    const [isPending, startTransition] = useTransition()

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        startTransition(async () => {
            const action = type.toLowerCase() === 'assignment' ? toggleFavoriteAssignment : toggleFavoriteLesson
            const res = await action(id)

            if (res.success) {
                setIsBookmarked(res.action === 'favorited')
                toast.success(res.action === 'favorited' ? 'Đã lưu vào mục yêu thích' : 'Đã xóa khỏi mục yêu thích')
            } else {
                toast.error(res.error || 'Lỗi khi lưu')
            }
        })
    }

    return (
        <button 
            onClick={handleToggle}
            disabled={isPending}
            className={`p-2 rounded-full transition-all active:scale-90 ${
                isBookmarked 
                ? 'bg-primary/10 text-primary' 
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            } ${className}`}
            title={isBookmarked ? "Xóa khỏi Bookmark" : "Lưu vào Bookmark"}
        >
            <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''} ${isPending ? 'opacity-50 animate-pulse' : ''}`} />
        </button>
    )
}
