"use client"

import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"

export default function PlaySentenceBuilderGamePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const gameId = params.gameId as string
  const age = searchParams.get("age") || "2-5"
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Top Bar Navigation */}
      <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 flex-shrink-0 z-10 shadow-sm relative">
        <Link 
          href={`/student/game/sentence-builder?age=${age}`}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors font-bold text-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Levels</span>
        </Link>
        <div className="absolute left-1/2 -translate-x-1/2 font-black text-primary uppercase tracking-widest hidden sm:block">
          Sentence Builder
        </div>
      </div>

      {/* Game Iframe */}
      <div className="flex-1 w-full bg-[#fbc2eb] overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#fbc2eb]">
            <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
            <span className="text-white font-bold tracking-widest uppercase animate-pulse">Loading Game...</span>
          </div>
        )}
        <iframe 
          src={`/games/sentence-builder/index.html?gameId=${gameId}&age=${age}`}
          className={`w-full h-full border-none transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          title="Sentence Builder Game"
          sandbox="allow-scripts allow-same-origin"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  )
}
