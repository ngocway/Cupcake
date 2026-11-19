"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useContentStore } from "@/store/useContentStore";
import { ForcedLandscapeWrapper } from "@/components/games/ForcedLandscapeWrapper";
import { GameStartOverlay } from "@/components/games/GameStartOverlay";

function FlashcardQuizGameContent() {
  const searchParams = useSearchParams();
  const age = searchParams.get("age") || "2-5";
  const topicId = searchParams.get("topicId");
  const nativeLanguage = useContentStore((s) => s.nativeLanguage) || "vi";
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <ForcedLandscapeWrapper
      backHref={topicId ? `/student/game/flashcard-quiz/select?age=${age}` : `/teacher?tab=my-games`}
      backLabel="Thoát Game"
      bgColor="#f1f5f9"
    >
      <GameStartOverlay
        isOpen={!hasStarted}
        onStart={() => setHasStarted(true)}
        title="Trắc Nghiệm Flashcard"
        gameMode="candy-quiz"
      />
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#f1f5f9]">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <span className="text-slate-600 font-bold tracking-widest uppercase animate-pulse">Loading Game...</span>
        </div>
      )}
      <iframe 
        src={`/games/flashcard-quiz/index.html?age=${age}&nativeLanguage=${nativeLanguage}${topicId ? `&topicId=${topicId}` : ''}`} 
        className={`w-full h-full flex-1 border-none block transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        title="Flashcard Quiz Game"
        sandbox="allow-scripts allow-same-origin"
        onLoad={() => setIsLoading(false)}
      />
    </ForcedLandscapeWrapper>
  );
}

export default function FlashcardQuizGamePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-slate-400 font-bold">Loading Game...</div>}>
      <FlashcardQuizGameContent />
    </Suspense>
  );
}
