"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ForcedLandscapeWrapper } from "@/components/games/ForcedLandscapeWrapper";
import { GameStartOverlay } from "@/components/games/GameStartOverlay";

function EggSmashQuizGameContent() {
  const searchParams = useSearchParams();
  const topicId = searchParams?.get("topicId");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const gameSrc = topicId
    ? `/games/egg-smash-quiz-premium-ambient/index.html?topicId=${encodeURIComponent(topicId)}`
    : "/games/egg-smash-quiz-premium-ambient/index.html";

  return (
    <ForcedLandscapeWrapper
      backHref="/teacher?tab=my-choice-games"
      backLabel="Thoát Game"
      bgColor="#11111a"
    >
      {!isLoaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#11111a]">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-4" />
          <span className="text-amber-400 font-bold tracking-widest uppercase animate-pulse">
            Đang nạp Game Đập Trứng...
          </span>
        </div>
      )}

      {/* Start Screen Overlay */}
      {isLoaded && (
        <GameStartOverlay
          isOpen={!isStarted}
          title="Đập Trứng Chọn Đáp Án"
          gameMode="egg-smash"
          onStart={() => setIsStarted(true)}
        />
      )}

      <iframe
        ref={iframeRef}
        src={gameSrc}
        className="w-full h-full flex-1 border-none block"
        title="Egg Smash Quiz Game"
        sandbox="allow-scripts allow-same-origin"
        onLoad={() => setIsLoaded(true)}
      />
    </ForcedLandscapeWrapper>
  );
}

export default function EggSmashQuizGamePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-amber-400 font-bold">
          Loading Game...
        </div>
      }
    >
      <EggSmashQuizGameContent />
    </Suspense>
  );
}
