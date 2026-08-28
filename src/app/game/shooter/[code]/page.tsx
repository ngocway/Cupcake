"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, X, Trophy, Heart, Sparkles, Volume2, VolumeX } from "lucide-react";
import { getChoiceShooterGameById, ChoiceShooterGame } from "@/lib/choice-shooter-storage";

import { SciFiNeonShooterGame } from "@/app/_components/SciFiNeonShooterGame";

export default function StudentShooterGamePage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const code = resolvedParams?.code;

  const [game, setGame] = useState<ChoiceShooterGame | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (code) {
      const found = getChoiceShooterGameById(code);
      setGame(found);
    }
    setLoading(false);
  }, [code]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#050510] text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-sm text-cyan-400">Đang tải game Neon Math Shooter...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="fixed inset-0 bg-[#050510] text-white flex flex-col items-center justify-center p-6 text-center space-y-6 font-sans">
        <div className="w-20 h-20 rounded-3xl bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center text-4xl shadow-xl">
          ⚠️
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="font-headline font-black text-2xl text-white">Không tìm thấy bài tập!</h1>
          <p className="text-xs text-slate-400 font-mono">
            Mã bài tập "{code}" không tồn tại hoặc đã bị xóa. Vui lòng kiểm tra lại đường link.
          </p>
        </div>
        <Link
          href="/"
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-cyan-500/20 transition-all"
        >
          Quay về Trang chủ
        </Link>
      </div>
    );
  }

  return <SciFiNeonShooterGame game={game} />;
}
