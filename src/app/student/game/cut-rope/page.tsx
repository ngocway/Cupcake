"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ForcedLandscapeWrapper } from "@/components/games/ForcedLandscapeWrapper";

function CutRopeGameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topicId = searchParams.get("topicId");
  const [isLoaded, setIsLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "CUT_ROPE_READY") {
        setIsLoaded(true);
      }
      if (e.data && e.data.type === "CUT_ROPE_EXIT") {
        router.push("/teacher");
      }
    };
    window.addEventListener("message", handleMessage);

    // Dự phòng tối đa 10 giây nếu mạng quá chậm hoặc lỗi kết nối
    const fallbackTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 10000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(fallbackTimer);
    };
  }, [router]);

  return (
    <ForcedLandscapeWrapper
      backHref="/teacher"
      backLabel="Thoát Game"
      bgColor="#8bd8ff"
    >
      {/* Loading Skeleton với hiệu ứng fade-out mượt mà */}
      <div 
        className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-[#8bd8ff] to-[#d8f6ff] transition-opacity duration-300 ${
          isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-3xl bg-white/80 backdrop-blur-md shadow-2xl flex items-center justify-center border border-white/60">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          </div>
        </div>
        <span className="text-slate-800 font-headline font-black text-sm tracking-wider uppercase drop-shadow-sm">
          Đang nạp Game Cắt Dây...
        </span>
      </div>

      {/* Game Iframe */}
      <iframe
        ref={iframeRef}
        src={`/games/magic_tree_matching_game_v3/index.html?topicId=${topicId || ""}&v=3.1`}
        className="w-full h-full flex-1 border-none block"
        title="Game Cắt Dây Ảnh - Chữ"
        sandbox="allow-scripts allow-same-origin"
      />
    </ForcedLandscapeWrapper>
  );
}

export default function CutRopeGamePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#8bd8ff] flex items-center justify-center text-slate-800 font-bold">Loading Game...</div>}>
      <CutRopeGameContent />
    </Suspense>
  );
}
