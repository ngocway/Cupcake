"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getChoiceEggGameById, ChoiceEggGame } from "@/lib/choice-egg-storage";

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

  useEffect(() => {
    if (code) {
      const found = getChoiceEggGameById(code);
      if (found) {
        setGame(found);
        // Inject custom questions into parent window for iframe game.js to read
        (window as any).CUSTOM_EGG_GAME_DATA = prepareEggGameData(found.questions);
        (window as any).CUSTOM_EGG_END_MODE = found.endMode || "finish";
      }
    }
    setLoading(false);
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
    <div className="fixed inset-0 z-[100] w-screen h-screen bg-[#11111a] overflow-hidden flex flex-col">
      {/* Top Overlay Controls Bar */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-3">
        <Link
          href="/teacher?tab=choice"
          className="w-10 h-10 rounded-2xl bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all shadow-lg"
          title="Quay về"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      {!isIframeLoaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#11111a]">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-4" />
          <span className="text-amber-400 font-bold tracking-widest uppercase animate-pulse">
            Đang nạp Game Đập Trứng...
          </span>
        </div>
      )}

      <iframe
        src="/games/egg-smash-quiz-premium-ambient/index.html"
        className="w-full h-full flex-1 border-none block"
        title="Egg Smash Quiz Game"
        sandbox="allow-scripts allow-same-origin"
        onLoad={() => setIsIframeLoaded(true)}
      />
    </div>
  );
}
