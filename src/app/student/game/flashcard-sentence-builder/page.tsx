"use client";

import { Loader2 } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ForcedLandscapeWrapper } from "@/components/games/ForcedLandscapeWrapper";
import { GameStartOverlay } from "@/components/games/GameStartOverlay";

function FlashcardSentenceBuilderGameContent() {
  const searchParams = useSearchParams();
  const age = searchParams.get("age") || "2-5";
  const topicId = searchParams.get("topicId") || "";
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  // Determine back link level
  let level = "kindergarten";
  if (age === "6-12" || age === "kid") level = "kid";
  else if (age === "teen") level = "teen";
  else if (age === "readers" || age === "learner") level = "learner";

  return (
    <ForcedLandscapeWrapper
      backHref={`/student/game/flashcard-sentence-builder/select?level=${level}`}
      backLabel="Quay lại"
      bgColor="#fbc2eb"
    >
      <GameStartOverlay
        isOpen={!hasStarted}
        onStart={() => setHasStarted(true)}
        title="Ghép Câu Flashcard"
        gameMode="sentence-builder"
      />
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#fbc2eb]">
          <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
          <span className="text-white font-bold tracking-widest uppercase animate-pulse">Loading Game...</span>
        </div>
      )}
      <iframe 
        src={`/games/flashcard-sentence-builder/index.html?topicId=${topicId}&age=${age}`} 
        className={`w-full h-full flex-1 border-none block transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        title="Flashcard Sentence Builder Game"
        sandbox="allow-scripts allow-same-origin"
        allow="autoplay"
        onLoad={() => setIsLoading(false)}
      />
    </ForcedLandscapeWrapper>
  );
}

export default function FlashcardSentenceBuilderGamePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-slate-400 font-bold">Loading Game...</div>}>
      <FlashcardSentenceBuilderGameContent />
    </Suspense>
  );
}
