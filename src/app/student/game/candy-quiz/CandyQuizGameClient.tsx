"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ForcedLandscapeWrapper } from "@/components/games/ForcedLandscapeWrapper";
import { GameStartOverlay } from "@/components/games/GameStartOverlay";
import { getCandyQuizGameDetailsAction } from "@/actions/candy-quiz-actions";

import { completeClassActivityAction } from "@/actions/activity-completion-actions";

function CandyQuizGameContent() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get("topicId");
  const assignmentId = searchParams.get("assignmentId");
  const [isLoading, setIsLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [topicTitle, setTopicTitle] = useState("Trắc nghiệm Kẹo Ngọt");
  const [questionCount, setQuestionCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "CANDY_GAME_PROGRESS" || event.data?.type === "GAME_PROGRESS") {
        const { isPass, accuracy } = event.data;
        if (assignmentId && (isPass || (typeof accuracy === "number" && accuracy >= 0.8))) {
          completeClassActivityAction({ assignmentId, score: null }).catch((err) => {
            console.error("Failed to complete candy game activity:", err);
          });
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [assignmentId]);

  useEffect(() => {
    if (!topicId) return;
    let isMounted = true;
    getCandyQuizGameDetailsAction(topicId).then((res) => {
      if (isMounted && res.success && res.topic) {
        if (res.topic.title) setTopicTitle(res.topic.title);
        if (res.topic.rounds) {
          const totalQ = res.topic.rounds.reduce(
            (sum: number, r: any) => sum + (r.questions?.length || 0),
            0
          );
          setQuestionCount(totalQ);
        }
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [topicId]);

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

      {/* Start Screen Overlay */}
      {!isLoading && (
        <GameStartOverlay
          isOpen={!isStarted}
          title={topicTitle}
          gameMode="candy-quiz"
          questionCount={questionCount}
          onStart={() => setIsStarted(true)}
        />
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

export default function CandyQuizGameClient() {
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
