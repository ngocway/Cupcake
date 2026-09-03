"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { Loader2 } from "lucide-react";

function EggSmashQuizGameContent() {
  const [isLoaded, setIsLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen bg-[#11111a] overflow-hidden flex flex-col">
      {!isLoaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#11111a]">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-4" />
          <span className="text-amber-400 font-bold tracking-widest uppercase animate-pulse">
            Đang nạp Game Đập Trứng...
          </span>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src="/games/egg-smash-quiz-premium-ambient/index.html"
        className="w-full h-full flex-1 border-none block"
        title="Egg Smash Quiz Game"
        sandbox="allow-scripts allow-same-origin"
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}

export default function EggSmashQuizGamePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-amber-400 font-bold">Loading Game...</div>}>
      <EggSmashQuizGameContent />
    </Suspense>
  );
}
