
"use client"

import { useState, useTransition } from "react"
import { Bookmark } from "lucide-react"
import { toggleFavoriteAssignment, toggleFavoriteLesson } from "@/actions/public-materials"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { LoginModal } from "@/components/LoginButton"

interface BookmarkButtonProps {
    type: 'assignment' | 'lesson' | 'ASSIGNMENT' | 'LESSON'
    id: string
    initialIsBookmarked: boolean
    className?: string
    isLoggedIn?: boolean
}

export function BookmarkButton({ type, id, initialIsBookmarked, className, isLoggedIn = true }: BookmarkButtonProps) {
    const t = useTranslations("common")
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
    const [isPending, startTransition] = useTransition()
    const [showLoginModal, setShowLoginModal] = useState(false)

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!isLoggedIn) {
            setShowLoginModal(true)
            return
        }

        startTransition(async () => {
            const action = type.toLowerCase() === 'assignment' ? toggleFavoriteAssignment : toggleFavoriteLesson
            const res = await action(id)

            if (res.success) {
                setIsBookmarked(res.action === 'favorited')
                toast.success(res.action === 'favorited' ? t('saveFavorite') : t('removeFavorite'))
            } else {
                toast.error(res.error || t('errorSaving'))
            }
        })
    }

    return (
        <>
            <button 
                onClick={handleToggle}
                disabled={isPending}
                className={`p-2 rounded-full transition-all active:scale-90 ${
                    isBookmarked 
                    ? 'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400' 
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                } ${className}`}
                title={isBookmarked ? t("removeFromBookmarks") : t("addToBookmarks")}
            >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''} ${isPending ? 'opacity-50 animate-pulse' : ''}`} />
            </button>
            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} defaultView="studentLogin" />
        </>
    )
}
