"use client";

import React, { useEffect, useState, useRef, ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Maximize2, Minimize2, RotateCw } from "lucide-react";

interface ForcedLandscapeWrapperProps {
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
  onExit?: () => void;
  bgColor?: string;
  extraControls?: ReactNode;
  showTopBar?: boolean;
}

export function ForcedLandscapeWrapper({
  children,
  backHref = "/teacher",
  backLabel = "Thoát Game",
  onExit,
  bgColor = "#0f172a",
  extraControls,
  showTopBar = true,
}: ForcedLandscapeWrapperProps) {
  const [isPortrait, setIsPortrait] = useState(false);
  const [rotationAngle, setRotationAngle] = useState<90 | -90>(90);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleRotation = () => {
    setRotationAngle((prev) => (prev === 90 ? -90 : 90));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
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

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] w-screen h-screen overflow-hidden select-none"
      style={{ backgroundColor: bgColor }}
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
        {showTopBar && (
          <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
            {onExit ? (
              <button
                type="button"
                onClick={onExit}
                className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-slate-800 rounded-full text-xs font-black shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 border border-white/60 group cursor-pointer"
                title="Quay về"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-600 group-hover:-translate-x-1 transition-transform" />
                <span>{backLabel}</span>
              </button>
            ) : (
              <Link
                href={backHref}
                className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-slate-800 rounded-full text-xs font-black shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 border border-white/60 group cursor-pointer"
                title="Quay về"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-600 group-hover:-translate-x-1 transition-transform" />
                <span>{backLabel}</span>
              </Link>
            )}

            <div className="flex items-center gap-2 pointer-events-auto">
              {extraControls}

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
        )}

        {/* Nội dung game (Iframe hoặc Game Stage) */}
        {children}
      </div>
    </div>
  );
}
