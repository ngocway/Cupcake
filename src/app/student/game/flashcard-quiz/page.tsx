"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BackButton from "@/components/ui/BackButton";

function FlashcardQuizGameContent() {
  const searchParams = useSearchParams();
  const age = searchParams.get("age") || "2-5";
  const topicId = searchParams.get("topicId");
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Top Bar Navigation */}
      <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 flex-shrink-0 z-10 shadow-sm relative">
        <BackButton 
          className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors font-bold text-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Games</span>
        </BackButton>
        <div className="absolute left-1/2 -translate-x-1/2 font-black text-primary uppercase tracking-widest hidden sm:block">
          Flashcard Quiz
        </div>
      </div>

      {/* Game Iframe */}
      <div className="flex-1 w-full bg-[#f1f5f9] overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#f1f5f9]">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <span className="text-slate-600 font-bold tracking-widest uppercase animate-pulse">Loading Game...</span>
          </div>
        )}
        <iframe 
          src={`/games/flashcard-quiz/index.html?age=${age}${topicId ? `&topicId=${topicId}` : ''}`} 
          className={`w-full h-full border-none transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          title="Flashcard Quiz Game"
          sandbox="allow-scripts allow-same-origin"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
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
