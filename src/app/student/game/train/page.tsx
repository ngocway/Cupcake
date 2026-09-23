"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ForcedLandscapeWrapper } from "@/components/games/ForcedLandscapeWrapper";
import { GameStartOverlay } from "@/components/games/GameStartOverlay";

function TrainGameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topicId = searchParams.get("topicId");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "TRAIN_READY") {
        setIsLoaded(true);
      }
      if (e.data && e.data.type === "TRAIN_EXIT") {
        router.push("/teacher");
      }
    };
    window.addEventListener("message", handleMessage);

    // Dự phòng an toàn tối đa 20 giây nếu mạng chậm hoặc lỗi
    const fallbackTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 20000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(fallbackTimer);
    };
  }, [router]);

  return (
    <ForcedLandscapeWrapper
      backHref="/teacher"
      backLabel="Thoát Game"
      bgColor="#bce7ee"
    >
      {/* Loading Skeleton với hiệu ứng fade-out mượt mà */}
      <div 
        className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-[#bce7ee] to-[#e4f7fa] transition-opacity duration-500 pointer-events-none ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="relative flex items-center justify-center mb-5">
          <div className="w-20 h-20 rounded-3xl bg-white/90 backdrop-blur-md shadow-2xl flex items-center justify-center border border-white/60">
            <span className="text-4xl animate-bounce">🚂</span>
          </div>
        </div>
        <span className="text-slate-800 font-headline font-black text-base tracking-wider uppercase drop-shadow-sm mb-1">
          Đang chuẩn bị chuyến tàu từ vựng...
        </span>
        <span className="text-slate-600 font-bold text-xs bg-white/60 px-3.5 py-1 rounded-full border border-white/40 shadow-sm flex items-center gap-1.5 mt-1">
          <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
          Vui lòng đợi các toa tàu và hình ảnh nạp xong
        </span>
      </div>

      {/* Start Screen Overlay */}
      {isLoaded && (
        <GameStartOverlay
          isOpen={!isStarted}
          title="Đoàn Tàu Từ Vựng"
          gameMode="train"
          onStart={() => setIsStarted(true)}
          onClose={() => router.push("/teacher")}
        />
      )}

      {/* Game Iframe */}
      <iframe
        ref={iframeRef}
        src={`/games/Doan-tau-tu-vung/index.html?topicId=${topicId || ""}`}
        className="w-full h-full flex-1 border-none block"
        title="Đoàn tàu từ vựng Game"
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin"
      />
    </ForcedLandscapeWrapper>
  );
}

export default function TrainGamePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#bce7ee] flex items-center justify-center text-slate-800 font-bold">Loading Game...</div>}>
      <TrainGameContent />
    </Suspense>
  );
}
