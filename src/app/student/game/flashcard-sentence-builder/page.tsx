"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function FlashcardSentenceBuilderGameContent() {
  const searchParams = useSearchParams();
  const age = searchParams.get("age") || "2-5";
  const topicId = searchParams.get("topicId") || "";
  const [isLoading, setIsLoading] = useState(true);

  // Determine back link level
  let level = "kindergarten";
  if (age === "6-12" || age === "kid") level = "kid";
  else if (age === "teen") level = "teen";
  else if (age === "readers" || age === "learner") level = "learner";

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Top Bar Navigation */}
      <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 flex-shrink-0 z-10 shadow-sm relative">
        <Link 
          href={`/student/game/flashcard-sentence-builder/select?level=${level}`}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors font-bold text-sm animate-in slide-in-from-left-4 duration-300"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Topics</span>
        </Link>
        <div className="absolute left-1/2 -translate-x-1/2 font-black text-primary uppercase tracking-widest hidden sm:block">
          Sentence Builder (Flashcards)
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
          src={`/games/flashcard-sentence-builder/index.html?topicId=${topicId}&age=${age}`} 
          className={`w-full h-full border-none transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          title="Flashcard Sentence Builder Game"
          sandbox="allow-scripts allow-same-origin"
          allow="autoplay"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
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
