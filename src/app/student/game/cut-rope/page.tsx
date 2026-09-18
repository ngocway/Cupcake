"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import Link from "next/link";

function CutRopeGameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topicId = searchParams.get("topicId");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

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

    // Dự phòng tối đa 2.2 giây nếu mạng chậm
    const fallbackTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 2200);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(fallbackTimer);
    };
  }, [router]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] w-screen h-screen bg-[#8bd8ff] overflow-hidden flex flex-col select-none"
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        <Link
          href="/teacher"
          className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-white/85 hover:bg-white text-slate-800 rounded-full text-xs font-black shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 border border-white/40 group"
          title="Quay về trang giáo viên"
        >
          <ArrowLeft className="w-4 h-4 text-rose-500 group-hover:-translate-x-1 transition-transform" />
          <span>Thoát Game</span>
        </Link>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-full bg-white/85 hover:bg-white text-slate-700 flex items-center justify-center shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 border border-white/40 cursor-pointer"
            title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Loading Skeleton với hiệu ứng fade-out mượt mà */}
      <div 
        className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-[#8bd8ff] to-[#d8f6ff] transition-opacity duration-300 pointer-events-none ${
          isLoaded ? "opacity-0" : "opacity-100"
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
        src={`/games/magic_tree_matching_game_v3/index.html?topicId=${topicId || ""}`}
        className="w-full h-full flex-1 border-none block"
        title="Game Cắt Dây Ảnh - Chữ"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
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
