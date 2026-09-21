"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Maximize2, Minimize2, RotateCw } from "lucide-react";
import Link from "next/link";

function TrainGameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topicId = searchParams.get("topicId");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [rotationAngle, setRotationAngle] = useState<90 | -90>(90);
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

  const toggleRotation = () => {
    setRotationAngle((prev) => (prev === 90 ? -90 : 90));
  };

  // Tự động nhận diện hướng màn hình iPad / Mobile
  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== "undefined") {
        setIsPortrait(window.innerHeight > window.innerWidth);
      }
    };
    checkOrientation();

    const mql = window.matchMedia("(orientation: portrait)");
    const handleMql = (e: MediaQueryListEvent) => {
      setIsPortrait(e.matches);
    };

    mql.addEventListener("change", handleMql);
    window.addEventListener("resize", checkOrientation);

    return () => {
      mql.removeEventListener("change", handleMql);
      window.removeEventListener("resize", checkOrientation);
    };
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

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
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] w-screen h-screen bg-[#bce7ee] overflow-hidden select-none"
    >
      {/* Khung xoay ngang cưỡng bức thông minh khi màn hình ở trạng thái Dọc */}
      <div
        className="flex flex-col overflow-hidden"
        style={
          isPortrait
            ? {
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "100dvh",
                height: "100dvw",
                transform: `translate(-50%, -50%) rotate(${rotationAngle}deg)`,
                transformOrigin: "center center",
                transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }
            : {
                position: "relative",
                width: "100%",
                height: "100%",
                transform: "none",
                transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }
        }
      >
        {/* Top Floating Control Bar */}
        <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
          <Link
            href="/teacher"
            className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-slate-800 rounded-full text-xs font-black shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 border border-white/60 group"
            title="Quay về trang giáo viên"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600 group-hover:-translate-x-1 transition-transform" />
            <span>Thoát Game</span>
          </Link>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Nút đổi chiều xoay 90 / -90 độ: Chỉ hiển thị khi đang cầm máy dọc */}
            {isPortrait && (
              <button
                type="button"
                onClick={toggleRotation}
                className="px-3.5 py-2 rounded-full bg-white/95 hover:bg-white text-slate-700 flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 border border-white/60 cursor-pointer text-xs font-black"
                title="Đổi chiều xoay màn hình (90° / -90°)"
              >
                <RotateCw className="w-4 h-4 text-sky-600" />
                <span>Đổi chiều ({rotationAngle > 0 ? "90°" : "-90°"})</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 border border-white/60 cursor-pointer"
              title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

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

        {/* Game Iframe */}
        <iframe
          ref={iframeRef}
          src={`/games/Doan-tau-tu-vung/index.html?topicId=${topicId || ""}`}
          className="w-full h-full flex-1 border-none block"
          title="Game Nối Đoàn Tàu"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}

export default function TrainGamePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#bce7ee] flex items-center justify-center text-slate-800 font-bold">Đang tải game...</div>}>
      <TrainGameContent />
    </Suspense>
  );
}
