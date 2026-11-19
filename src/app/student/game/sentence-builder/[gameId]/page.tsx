"use client"

import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { ForcedLandscapeWrapper } from "@/components/games/ForcedLandscapeWrapper"
import { GameStartOverlay } from "@/components/games/GameStartOverlay"

export default function PlaySentenceBuilderGamePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const gameId = params.gameId as string
  const age = searchParams.get("age") || "2-5"
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <ForcedLandscapeWrapper
      backHref={`/student/game/sentence-builder?age=${age}`}
      backLabel="Quay lại"
      bgColor="#fbc2eb"
    >
      <GameStartOverlay
        isOpen={!hasStarted}
        onStart={() => setHasStarted(true)}
        title="Ghép Câu Tiếng Anh"
        gameMode="sentence-builder"
      />
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#fbc2eb]">
          <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
          <span className="text-white font-bold tracking-widest uppercase animate-pulse">Loading Game...</span>
        </div>
      )}
      <iframe 
        src={`/games/sentence-builder/index.html?gameId=${gameId}&age=${age}`}
        className={`w-full h-full flex-1 border-none block transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        title="Sentence Builder Game"
        allow="autoplay"
        onLoad={() => setIsLoading(false)}
      />
    </ForcedLandscapeWrapper>
  )
}
