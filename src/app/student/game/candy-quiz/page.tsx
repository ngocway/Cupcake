"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ForcedLandscapeWrapper } from "@/components/games/ForcedLandscapeWrapper";

function CandyQuizGameContent() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get("topicId");
  const [isLoading, setIsLoading] = useState(true);

  const gameSrc = topicId
    ? `/games/candy-grammar-sugar-jelly/index.html?topicId=${encodeURIComponent(topicId)}`
    : `/games/candy-grammar-sugar-jelly/index.html`;

  return (
    <ForcedLandscapeWrapper
      backHref="/teacher?tab=my-quiz-games"
      backLabel="Thoát Game"
      bgColor="#43b9f5"
    >
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#43b9f5]">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-white/30 border-t-white animate-spin mb-4" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">🍬</div>
          </div>
          <span className="text-white font-black tracking-widest text-lg drop-shadow-md animate-pulse">
            ĐANG NẠP THẾ GIỚI KẸO...
          </span>
        </div>
      )}
      <iframe
        src={gameSrc}
        className={`w-full h-full flex-1 border-none block transition-opacity duration-500 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        title="Candy Grammar Quiz"
        sandbox="allow-scripts allow-same-origin allow-popups"
        onLoad={() => setIsLoading(false)}
      />
    </ForcedLandscapeWrapper>
  );
}

export default function CandyQuizGamePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-[#43b9f5] flex items-center justify-center text-white font-black text-xl">
          Đang chuẩn bị...
        </div>
      }
    >
      <CandyQuizGameContent />
    </Suspense>
  );
}
