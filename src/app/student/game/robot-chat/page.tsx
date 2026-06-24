"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";


import { useContentStore } from "@/store/useContentStore";

export default function RobotChatGamePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const nativeLanguage = useContentStore((s) => s.nativeLanguage);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Top Bar Navigation */}
      <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 flex-shrink-0 z-10 shadow-sm relative">
        
        <div className="absolute left-1/2 -translate-x-1/2 font-black text-primary uppercase tracking-widest hidden sm:block">
          Chat with Dolbot
        </div>
      </div>

      {/* Game Iframe */}
      <div className="flex-1 w-full bg-[#0f0c1a] overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0f0c1a]">
            <Loader2 className="w-12 h-12 text-[#7c5cfc] animate-spin mb-4" />
            <span className="text-white font-bold tracking-widest uppercase animate-pulse">Loading Game...</span>
          </div>
        )}
        <iframe 
          src={`/games/robot-chat/index.html?nativeLang=${nativeLanguage || "vi"}`} 
          className={`w-full h-full border-none transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          title="Chat with Dolbot"
          allow="microphone"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}
