"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";


function MatchWordsGameContent() {
  const searchParams = useSearchParams();
  const age = searchParams.get("age") || "2-5";
  const gameId = searchParams.get("gameId");
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Top Bar Navigation */}
      <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 flex-shrink-0 z-10 shadow-sm relative">
        
        <div className="absolute left-1/2 -translate-x-1/2 font-black text-primary uppercase tracking-widest hidden sm:block">
          Match the Words ({age === "6-12" ? "Kids 6-12" : "Kids 2-5"})
        </div>
      </div>

      {/* Game Iframe */}
      <div className="flex-1 w-full bg-[#a1c4fd] overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#a1c4fd]">
            <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
            <span className="text-white font-bold tracking-widest uppercase animate-pulse">Loading Game...</span>
          </div>
        )}
        <iframe 
          src={`/games/match-words/index.html?age=${age}${gameId ? `&gameId=${gameId}` : ''}`} 
          className={`w-full h-full border-none transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          title="Match the Words Game"
          sandbox="allow-scripts allow-same-origin"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}

export default function MatchWordsGamePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-slate-400 font-bold">Loading Game...</div>}>
      <MatchWordsGameContent />
    </Suspense>
  );
}
