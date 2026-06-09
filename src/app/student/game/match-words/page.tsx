"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function MatchWordsGameContent() {
  const searchParams = useSearchParams();
  const age = searchParams.get("age") || "2-5";
  const gameId = searchParams.get("gameId");

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Top Bar Navigation */}
      <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 flex-shrink-0 z-10 shadow-sm relative">
        <Link 
          href="/student/game"
          className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors font-bold text-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Games</span>
        </Link>
        <div className="absolute left-1/2 -translate-x-1/2 font-black text-primary uppercase tracking-widest hidden sm:block">
          Match the Words ({age === "6-12" ? "Kids 6-12" : "Kids 2-5"})
        </div>
      </div>

      {/* Game Iframe */}
      <div className="flex-1 w-full bg-[#a1c4fd] overflow-hidden relative">
        <iframe 
          src={`/games/match-words/index.html?age=${age}${gameId ? `&gameId=${gameId}` : ''}`} 
          className="w-full h-full border-none"
          title="Match the Words Game"
          sandbox="allow-scripts allow-same-origin"
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
