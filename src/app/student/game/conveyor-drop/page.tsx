"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function ConveyorDropGameContent() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get("topicId");
  const [topicData, setTopicData] = useState<any>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Pre-fetch topic data immediately on page mount before or while iframe loads
  useEffect(() => {
    if (!topicId) {
      setIsDataLoaded(true);
      return;
    }

    let isMounted = true;
    fetch(`/api/games/flashcard-match/${topicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.success && data.cards) {
            setTopicData(data);
          }
          setIsDataLoaded(true);
        }
      })
      .catch((err) => {
        console.error("Failed to preload topic data:", err);
        if (isMounted) setIsDataLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [topicId]);

  // PostMessage topicData into iframe as soon as it loads or updates
  const handleIframeLoad = () => {
    if (iframeRef.current && iframeRef.current.contentWindow && topicData) {
      iframeRef.current.contentWindow.postMessage({ type: "INIT_GAME_DATA", topicData }, "*");
    }
  };

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow && topicData) {
      iframeRef.current.contentWindow.postMessage({ type: "INIT_GAME_DATA", topicData }, "*");
    }
  }, [topicData]);

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen bg-[#11111a] overflow-hidden flex flex-col">
      {!isDataLoaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#11111a]">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
          <span className="text-cyan-400 font-bold tracking-widest uppercase animate-pulse">
            Đang nạp bài tập...
          </span>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={`/games/conveyor-drop/index.html?topicId=${topicId || ""}`}
        className="w-full h-full flex-1 border-none block"
        title="Băng Chuyền Thả Khối Game"
        sandbox="allow-scripts allow-same-origin"
        onLoad={handleIframeLoad}
      />
    </div>
  );
}

export default function ConveyorDropGamePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-cyan-400 font-bold">Loading Game...</div>}>
      <ConveyorDropGameContent />
    </Suspense>
  );
}
