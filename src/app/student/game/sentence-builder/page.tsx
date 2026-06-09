"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

export default function SentenceBuilderGamePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

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
          Sentence Builder
        </div>
      </div>

      {/* Game Iframe */}
      <div className="flex-1 w-full bg-[#fbc2eb] overflow-hidden relative">
        <iframe 
          src="/games/sentence-builder/index.html" 
          className="w-full h-full border-none"
          title="Sentence Builder Game"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
