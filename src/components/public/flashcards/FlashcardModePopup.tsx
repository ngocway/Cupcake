"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Layers, Keyboard, Sparkles, X, Loader2 } from "lucide-react";
import { getFlashcardsByTopic } from "@/actions/flashcards-actions";
import { useContentStore } from "@/store/useContentStore";

type Mode = "scramble" | "type" | "hint";

const LAST_MODE_KEY = "dolcake_last_flashcard_mode";

interface Topic {
  id: string;
  name: string;
}

interface Props {
  topic: Topic;
  onClose: () => void;
}

const MODES: { id: Mode; label: string; desc: string; icon: React.ReactNode; color: string; border: string; activeBorder: string; activeBg: string; shadow: string }[] = [
  {
    id: "scramble",
    label: "Word Puzzle",
    desc: "Solve the puzzle by putting mixed-up letters in the correct order.",
    icon: <Layers className="w-7 h-7" />,
    color: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30",
    border: "border-emerald-400 dark:border-emerald-500",
    activeBorder: "border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-300/50",
    activeBg: "bg-emerald-50 dark:bg-emerald-950/20 shadow-lg shadow-emerald-200/60",
    shadow: "hover:shadow-emerald-300/60",
  },
  {
    id: "type",
    label: "Type Mode",
    desc: "Spell the word by typing manually using your physical or virtual keyboard.",
    icon: <Keyboard className="w-7 h-7" />,
    color: "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30",
    border: "border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500",
    activeBorder: "border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-300/50",
    activeBg: "bg-indigo-50/60 dark:bg-indigo-950/20 shadow-lg shadow-indigo-200/60",
    shadow: "hover:shadow-indigo-300/60",
  },
  {
    id: "hint",
    label: "Hint Mode",
    desc: "Flip the card, listen to audio, and learn with automatic letter suggestions.",
    icon: <Sparkles className="w-7 h-7" />,
    color: "bg-amber-500 text-white shadow-lg shadow-amber-500/30",
    border: "border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500",
    activeBorder: "border-amber-400 dark:border-amber-500 ring-2 ring-amber-300/50",
    activeBg: "bg-amber-50/60 dark:bg-amber-950/20 shadow-lg shadow-amber-200/60",
    shadow: "hover:shadow-amber-300/60",
  },
];

export function FlashcardModePopup({ topic, onClose }: Props) {
  const router = useRouter();
  const setPendingFlashcards = useContentStore((s) => s.setPendingFlashcards);

  // Read last used mode from localStorage
  const [selectedMode, setSelectedMode] = useState<Mode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LAST_MODE_KEY) as Mode | null;
      if (saved && ["scramble", "type", "hint"].includes(saved)) return saved;
    }
    return "scramble";
  });

  // Track fetch state
  const [fetchState, setFetchState] = useState<"loading" | "done" | "error">("loading");
  const cardsRef = useRef<any[]>([]);

  // Track if user already clicked a mode (while cards still loading)
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);

  // Start fetching cards immediately when popup opens
  useEffect(() => {
    let cancelled = false;
    setFetchState("loading");
    getFlashcardsByTopic(topic.id)
      .then((cards) => {
        if (cancelled) return;
        cardsRef.current = cards;
        setFetchState(cards.length > 0 ? "done" : "error");
      })
      .catch(() => {
        if (!cancelled) setFetchState("error");
      });
    return () => { cancelled = true; };
  }, [topic.id]);

  // When cards finish loading AND user already clicked a mode → navigate
  useEffect(() => {
    if (fetchState === "done" && pendingMode !== null) {
      navigateWithCards(pendingMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchState, pendingMode]);

  function navigateWithCards(mode: Mode) {
    localStorage.setItem(LAST_MODE_KEY, mode);
    const shuffled = [...cardsRef.current].sort(() => Math.random() - 0.5);
    setPendingFlashcards({ topicId: topic.id, cards: shuffled, mode });
    router.push(`/flashcards?topic=${topic.id}&mode=${mode}`);
  }

  function handleSelectMode(mode: Mode) {
    setSelectedMode(mode);
    if (fetchState === "done") {
      // Cards already ready → go immediately
      navigateWithCards(mode);
    } else if (fetchState === "error") {
      // No cards → alert and close
      alert("This topic does not have any flashcards yet. Please choose another topic!");
      onClose();
    } else {
      // Still loading → queue the mode, spinner shows on button
      setPendingMode(mode);
    }
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[40px] border-4 border-slate-100 dark:border-slate-800 p-6 md:p-8 shadow-2xl space-y-5 md:space-y-8 animate-in zoom-in-95 duration-300 max-h-[90dvh] overflow-y-auto relative">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pr-8">
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">
            Choose Study Mode
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Pick how you want to learn vocabulary for{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              &quot;{topic.name}&quot;
            </span>
          </p>
          {/* Background fetch indicator */}
          {fetchState === "loading" && (
            <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 pt-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading cards in background…
            </p>
          )}
        </div>

        {/* Mode cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {MODES.map((m) => {
            const isDefault = m.id === selectedMode;
            const isWaiting = pendingMode === m.id && fetchState === "loading";

            return (
              <button
                key={m.id}
                onClick={() => handleSelectMode(m.id)}
                disabled={isWaiting}
                className={`group relative p-4 md:p-6 rounded-[32px] border-4 transition-all duration-300 flex flex-row md:flex-col items-center md:text-center gap-4 md:gap-0 md:space-y-4 hover:shadow-xl hover:-translate-y-1 ${
                  isDefault
                    ? `${m.activeBorder} ${m.activeBg}`
                    : `${m.border} bg-white dark:bg-slate-800/40`
                }`}
              >
                {/* Recommended badge (scramble only) */}
                {m.id === "scramble" && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-sm">
                    Recommended
                  </span>
                )}

                <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-3xl transition-transform duration-300 group-hover:scale-110 ${m.color}`}>
                  {isWaiting ? <Loader2 className="w-6 h-6 animate-spin" /> : m.icon}
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                    {m.label}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    {m.desc}
                  </p>
                </div>

                {/* Last used badge */}
                {isDefault && (
                  <span className="absolute bottom-3 right-3 text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">
                    Last used
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
