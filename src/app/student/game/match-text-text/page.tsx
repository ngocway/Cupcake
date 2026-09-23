"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ForcedLandscapeWrapper } from "@/components/games/ForcedLandscapeWrapper";
import { GameStartOverlay } from "@/components/games/GameStartOverlay";

function MatchTextTextGameContent() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get("topicId");
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <ForcedLandscapeWrapper
      backHref="/teacher?tab=my-match-games"
      backLabel="Thoát Game"
      bgColor="#a1c4fd"
    >
      <GameStartOverlay
        isOpen={!hasStarted}
        onStart={() => setHasStarted(true)}
        title="Nối Chữ Thần Tốc"
        gameMode="match-text-text"
      />
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#a1c4fd]">
          <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
          <span className="text-white font-bold tracking-widest uppercase animate-pulse">
            Đang tải trò chơi Nối Chữ...
          </span>
        </div>
      )}
      <iframe
        src={`/games/match-text-text/index.html${topicId ? `?topicId=${topicId}` : ""}`}
        className={`w-full h-full flex-1 border-none block transition-opacity duration-700 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        title="Game Nối Chữ - Chữ"
        sandbox="allow-scripts allow-same-origin"
        onLoad={() => setIsLoading(false)}
      />
    </ForcedLandscapeWrapper>
  );
}

export default function MatchTextTextGamePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-slate-400 font-bold">
          Loading Game...
        </div>
      }
    >
      <MatchTextTextGameContent />
    </Suspense>
  );
}
