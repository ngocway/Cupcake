"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { getChoiceEggGameById, ChoiceEggGame } from "@/lib/choice-egg-storage";
import { getTeacherChoiceGameByCodeAction } from "@/actions/teacher-choice-games";
import { ForcedLandscapeWrapper } from "@/components/games/ForcedLandscapeWrapper";
import { GameStartOverlay } from "@/components/games/GameStartOverlay";

function prepareEggGameData(questions: ChoiceEggGame["questions"]) {
  return questions.map((q) => {
    const allAnswers = [q.a, ...q.wrong];
    const shuffled = [...allAnswers].sort(() => Math.random() - 0.5);
    return {
      question: q.q,
      answers: shuffled,
      correct: q.a,
    };
  });
}

export default function StudentEggSmashGamePage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const code = resolvedParams?.code;

  const [game, setGame] = useState<ChoiceEggGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    async function load() {
      if (!code) {
        setLoading(false);
        return;
      }

      let found: ChoiceEggGame | null = null;

      try {
        const dbRes = await getTeacherChoiceGameByCodeAction(code);
        if (dbRes.success && dbRes.game) {
          found = dbRes.game as any;
        }
      } catch (e) {}

      if (!found) {
        found = getChoiceEggGameById(code);
      }

      if (found) {
        setGame(found);
        // Inject custom questions into parent window for iframe game.js to read
        (window as any).CUSTOM_EGG_GAME_DATA = prepareEggGameData(found.questions);
        (window as any).CUSTOM_EGG_END_MODE = found.endMode || "finish";
      }

      setLoading(false);
    }
    load();
  }, [code]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#11111a] text-white flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
        <p className="font-mono text-sm text-amber-400">Đang nạp Game Đập Trứng...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="fixed inset-0 bg-[#11111a] text-white flex flex-col items-center justify-center p-6 text-center space-y-6 font-sans">
        <div className="w-20 h-20 rounded-3xl bg-amber-950/60 border border-amber-500/40 text-amber-400 flex items-center justify-center text-4xl shadow-xl">
          🥚
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="font-headline font-black text-2xl text-white">Không tìm thấy bài tập!</h1>
          <p className="text-xs text-slate-400 font-mono">
            Mã bài tập "{code}" không tồn tại hoặc đã bị xóa. Vui lòng kiểm tra lại đường link.
          </p>
        </div>
        <Link
          href="/"
          className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 transition-all"
        >
          Quay về Trang chủ
        </Link>
      </div>
    );
  }

  return (
    <ForcedLandscapeWrapper
      backHref="/teacher?tab=my-choice-games"
      backLabel="Thoát Game"
      bgColor="#11111a"
    >
      {!isIframeLoaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#11111a]">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-4" />
          <span className="text-amber-400 font-bold tracking-widest uppercase animate-pulse">
            Đang nạp Game Đập Trứng...
          </span>
        </div>
      )}

      {/* Start Screen Overlay */}
      {isIframeLoaded && (
        <GameStartOverlay
          isOpen={!isStarted}
          title={game.title}
          gameMode="egg-smash"
          questionCount={game.questionCount || game.questions?.length}
          onStart={() => setIsStarted(true)}
        />
      )}

      <iframe
        src="/games/egg-smash-quiz-premium-ambient/index.html"
        className="w-full h-full flex-1 border-none block"
        title="Egg Smash Quiz Game"
        sandbox="allow-scripts allow-same-origin"
        onLoad={() => setIsIframeLoaded(true)}
      />
    </ForcedLandscapeWrapper>
  );
}
