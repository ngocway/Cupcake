"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { FlashcardModePopup } from "./FlashcardModePopup";
import { useContentStore } from "@/store/useContentStore";

const CEFR_LEVEL_CONFIG: Record<string, {
  label: string;
  badge: string;
  border: string;
  bgClosed: string;
  bgOpen: string;
  titleColor: string;
  tagBg: string;
  hoverGlow: string;
  accentIcon: string;
}> = {
  a1: {
    label: "For Kid 3-6 year and Beginner",
    badge: "bg-emerald-500 text-white shadow-sm shadow-emerald-200",
    border: "border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400",
    bgClosed: "bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white dark:from-emerald-950/20 dark:to-slate-800 hover:from-emerald-100/90 hover:to-teal-50/80",
    bgOpen: "bg-emerald-50/60 backdrop-blur-md dark:bg-slate-800/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]",
    titleColor: "text-emerald-900 dark:text-emerald-200",
    tagBg: "bg-emerald-100/90 text-emerald-800 border border-emerald-300/60 dark:bg-emerald-900/40 dark:text-emerald-300",
    hoverGlow: "hover:shadow-xl hover:shadow-emerald-500/10",
    accentIcon: "text-emerald-500",
  },
  a2: {
    label: "Elementary",
    badge: "bg-sky-500 text-white shadow-sm shadow-sky-200",
    border: "border-sky-200 dark:border-sky-800/50 hover:border-sky-400",
    bgClosed: "bg-gradient-to-r from-sky-50/80 via-blue-50/40 to-white dark:from-sky-950/20 dark:to-slate-800 hover:from-sky-100/90 hover:to-blue-50/80",
    bgOpen: "bg-sky-50/60 backdrop-blur-md dark:bg-slate-800/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]",
    titleColor: "text-sky-900 dark:text-sky-200",
    tagBg: "bg-sky-100/90 text-sky-800 border border-sky-300/60 dark:bg-sky-900/40 dark:text-sky-300",
    hoverGlow: "hover:shadow-xl hover:shadow-sky-500/10",
    accentIcon: "text-sky-500",
  },
  b1: {
    label: "Intermediate",
    badge: "bg-amber-500 text-white shadow-sm shadow-amber-200",
    border: "border-amber-200 dark:border-amber-800/50 hover:border-amber-400",
    bgClosed: "bg-gradient-to-r from-amber-50/80 via-yellow-50/40 to-white dark:from-amber-950/20 dark:to-slate-800 hover:from-amber-100/90 hover:to-yellow-50/80",
    bgOpen: "bg-amber-50/60 backdrop-blur-md dark:bg-slate-800/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]",
    titleColor: "text-amber-900 dark:text-amber-200",
    tagBg: "bg-amber-100/90 text-amber-800 border border-amber-300/60 dark:bg-amber-900/40 dark:text-amber-300",
    hoverGlow: "hover:shadow-xl hover:shadow-amber-500/10",
    accentIcon: "text-amber-500",
  },
  b2: {
    label: "Upper Intermediate",
    badge: "bg-orange-500 text-white shadow-sm shadow-orange-200",
    border: "border-orange-200 dark:border-orange-800/50 hover:border-orange-400",
    bgClosed: "bg-gradient-to-r from-orange-50/80 via-amber-50/40 to-white dark:from-orange-950/20 dark:to-slate-800 hover:from-orange-100/90 hover:to-amber-50/80",
    bgOpen: "bg-orange-50/60 backdrop-blur-md dark:bg-slate-800/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]",
    titleColor: "text-orange-900 dark:text-orange-200",
    tagBg: "bg-orange-100/90 text-orange-800 border border-orange-300/60 dark:bg-orange-900/40 dark:text-orange-300",
    hoverGlow: "hover:shadow-xl hover:shadow-orange-500/10",
    accentIcon: "text-orange-500",
  },
  c1: {
    label: "Advanced",
    badge: "bg-rose-500 text-white shadow-sm shadow-rose-200",
    border: "border-rose-200 dark:border-rose-800/50 hover:border-rose-400",
    bgClosed: "bg-gradient-to-r from-rose-50/80 via-pink-50/40 to-white dark:from-rose-950/20 dark:to-slate-800 hover:from-rose-100/90 hover:to-pink-50/80",
    bgOpen: "bg-rose-50/60 backdrop-blur-md dark:bg-slate-800/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]",
    titleColor: "text-rose-900 dark:text-rose-200",
    tagBg: "bg-rose-100/90 text-rose-800 border border-rose-300/60 dark:bg-rose-900/40 dark:text-rose-300",
    hoverGlow: "hover:shadow-xl hover:shadow-rose-500/10",
    accentIcon: "text-rose-500",
  },
};

const CEFR_ORDER = ["a1", "a2", "b1", "b2", "c1"];

// Same palette as existing flashcard cards
const CARD_STYLES = [
  { bg: "bg-amber-50",   border: "border-amber-200",   hover: "hover:border-amber-400 hover:bg-amber-100/90",   circles: ["absolute -top-10 -right-10 w-24 h-24 bg-amber-200/60 rounded-full blur-xl", "absolute -bottom-8 -left-8 w-20 h-20 bg-orange-100/60 rounded-full blur-xl"] },
  { bg: "bg-pink-50",    border: "border-pink-200",    hover: "hover:border-pink-400 hover:bg-pink-100/90",     circles: ["absolute -top-10 -right-10 w-24 h-24 bg-pink-200/60 rounded-full blur-xl",  "absolute -bottom-8 -left-8 w-20 h-20 bg-purple-100/60 rounded-full blur-xl"] },
  { bg: "bg-sky-50",     border: "border-sky-200",     hover: "hover:border-sky-400 hover:bg-sky-100/90",       circles: ["absolute -top-10 -right-10 w-24 h-24 bg-sky-200/60 rounded-full blur-xl",   "absolute -bottom-8 -left-8 w-20 h-20 bg-teal-100/60 rounded-full blur-xl"] },
  { bg: "bg-emerald-50", border: "border-emerald-200", hover: "hover:border-emerald-400 hover:bg-emerald-100/90", circles: ["absolute -top-10 -right-10 w-24 h-24 bg-emerald-200/60 rounded-full blur-xl", "absolute -bottom-8 -left-8 w-20 h-20 bg-green-100/60 rounded-full blur-xl"] },
  { bg: "bg-violet-50",  border: "border-violet-200",  hover: "hover:border-violet-400 hover:bg-violet-100/90", circles: ["absolute -top-10 -right-10 w-24 h-24 bg-violet-200/60 rounded-full blur-xl", "absolute -bottom-8 -left-8 w-20 h-20 bg-indigo-100/60 rounded-full blur-xl"] },
  { bg: "bg-rose-50",    border: "border-rose-200",    hover: "hover:border-rose-400 hover:bg-rose-100/90",     circles: ["absolute -top-10 -right-10 w-24 h-24 bg-rose-200/60 rounded-full blur-xl",  "absolute -bottom-8 -left-8 w-20 h-20 bg-orange-100/60 rounded-full blur-xl"] },
];

interface Topic {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string | null;
  cefrLevel?: string | null;
  _count?: { flashcards: number };
}

interface Props {
  topics: Topic[];
  initialLevel?: string;
}

export function FlashcardTopicBrowser({ topics, initialLevel }: Props) {
  const searchParams = useSearchParams();
  const studyLevel = useContentStore((s) => (s as any).studyLevel);
  const normalizedLevel = studyLevel === "pre-a1-a1" || studyLevel === "beginner" ? "a1" : (studyLevel || "a1");

  // Initialise openLevel from initialLevel prop (SSR-derived) so accordion opens immediately,
  // then override from store/URL via effects below.
  const [openLevel, setOpenLevel] = useState<string>(initialLevel || "a1");
  const [popupTopic, setPopupTopic] = useState<{ id: string; name: string } | null>(null);
  const didApplyLevelParam = useRef(false);

  // Sync openLevel with selected studyLevel (e.g. from user profile / cookie / pill selector)
  useEffect(() => {
    // If URL already specified a level, let the URL-based effect handle it
    const hasLvlParam = searchParams.get("level");
    if (hasLvlParam) return;

    if (normalizedLevel && ["a1", "a2", "b1", "b2", "c1"].includes(normalizedLevel)) {
      setOpenLevel(normalizedLevel);
    }
  }, [normalizedLevel, searchParams]);

  // On mount: if URL has ?level=a1 (from back-navigation), open that accordion & scroll to it
  useEffect(() => {
    if (didApplyLevelParam.current) return;
    const lvl = searchParams.get("level");
    if (lvl && ["a1", "a2", "b1", "b2", "c1"].includes(lvl)) {
      didApplyLevelParam.current = true;
      setOpenLevel(lvl);
      // Scroll accordion into view after it opens
      setTimeout(() => {
        const el = document.getElementById(`cefr-level-${lvl}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [searchParams]);

  // If the default openLevel ("a1") has no topics, fall back to the first level that does.
  // Prevents the tab showing "A1 selected" but no accordion being open.
  useEffect(() => {
    if (!topics || topics.length === 0) return;
    const currentLevelHasTopics = topics.some(
      t => (t.cefrLevel ? t.cefrLevel.toLowerCase() : "a1") === openLevel
    );
    if (!currentLevelHasTopics) {
      const firstAvailable = CEFR_ORDER.find(lvl =>
        topics.some(t => (t.cefrLevel ? t.cefrLevel.toLowerCase() : "a1") === lvl)
      );
      if (firstAvailable) setOpenLevel(firstAvailable);
    }
  // Run only when topics first load — not on every openLevel change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics]);

  useEffect(() => {
    const handleOpenLevel = (e: any) => {
      const lvl = e.detail?.level;
      if (lvl && lvl !== "all") {
        setOpenLevel(lvl);
      }
    };
    window.addEventListener("open-cefr-level", handleOpenLevel);
    return () => window.removeEventListener("open-cefr-level", handleOpenLevel);
  }, []);

  if (!topics || topics.length === 0) {
    return <div className="text-center py-20 text-primary/50 font-bold">No flashcards available.</div>;
  }

  return (
    <>
      <div className="w-full space-y-4">
        {CEFR_ORDER.map((levelId) => {
          const config = CEFR_LEVEL_CONFIG[levelId] || CEFR_LEVEL_CONFIG.a1;
          const levelTopics = topics.filter(t => (t.cefrLevel ? t.cefrLevel.toLowerCase() : "a1") === levelId);
          if (levelTopics.length === 0) return null;

          const isOpen = openLevel === levelId;
          const totalCards = levelTopics.reduce((sum, t) => sum + (t._count?.flashcards ?? 0), 0);

          return (
            <div
              key={levelId}
              id={`cefr-level-${levelId}`}
              className={`w-full group/accordion rounded-[28px] border-2 transition-all duration-300 ${config.border} ${config.hoverGlow} ${
                isOpen ? config.bgOpen : config.bgClosed
              }`}
            >
              {/* Level header button */}
              <button
                onClick={() => setOpenLevel(isOpen ? "" : levelId)}
                className="w-full flex items-center gap-2 sm:gap-3.5 px-3.5 sm:px-6 py-3.5 sm:py-4.5 cursor-pointer text-left focus:outline-none transition-transform duration-300 group-hover/accordion:-translate-y-0.5 min-w-0"
              >
                <span className={`shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-[11px] sm:text-xs font-black uppercase transition-transform duration-300 group-hover/accordion:scale-110 ${config.badge}`}>
                  {levelId.toUpperCase()}
                </span>

                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`font-black text-[clamp(11px,3.2vw,18px)] sm:text-base md:text-lg leading-tight whitespace-nowrap overflow-hidden text-ellipsis transition-colors ${config.titleColor}`}>
                    {config.label}
                  </span>
                </div>

                {!isOpen && (
                  <span className={`shrink-0 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-black rounded-full transition-all duration-300 group-hover/accordion:scale-105 whitespace-nowrap ${config.tagBg}`}>
                    <span className="sm:hidden">{levelTopics.length} topics</span>
                    <span className="hidden sm:inline">{levelTopics.length} topics · {totalCards} cards</span>
                  </span>
                )}

                <div className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-white/80 dark:bg-slate-700/80 border border-slate-200/60 dark:border-slate-600 shadow-sm transition-all duration-300 group-hover/accordion:bg-white group-hover/accordion:scale-110 ${isOpen ? "rotate-180 bg-white" : "group-hover/accordion:translate-y-0.5"}`}>
                  <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${config.accentIcon}`} />
                </div>
              </button>

              {/* Expanded: topic card grid */}
              {isOpen && (
                <div className="px-3.5 sm:px-6 pb-4.5 sm:pb-6 border-t border-slate-200/50 dark:border-slate-700/50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-5">
                    {levelTopics.map((topic, idx) => {
                      const style = CARD_STYLES[idx % CARD_STYLES.length];
                      const cardCount = topic._count?.flashcards ?? 0;

                      return (
                        <button
                          key={topic.id}
                          onClick={() => setPopupTopic({ id: topic.id, name: topic.name })}
                          className={`group relative flex flex-col justify-between w-full p-3.5 sm:p-4.5 rounded-[20px] sm:rounded-[24px] border-2 overflow-hidden cursor-pointer transition-all duration-300 shadow-sm hover:shadow-xl hover:scale-[1.03] min-h-[120px] sm:min-h-[135px] text-left ${style.bg} ${style.border} ${style.hover}`}
                        >
                          {/* Ambient blobs */}
                          {style.circles.map((cls, cIdx) => (
                            <div key={cIdx} className={cls} />
                          ))}

                          {/* Ghost icon watermark */}
                          {topic.iconUrl ? (
                            topic.iconUrl.startsWith("http") || topic.iconUrl.startsWith("/") ? (
                              <img
                                src={topic.iconUrl}
                                alt=""
                                className="absolute -bottom-4 -right-4 w-20 h-20 object-cover opacity-[0.07] transform rotate-12 transition-transform duration-500 group-hover:scale-125 select-none pointer-events-none"
                              />
                            ) : (
                              <span className="absolute -bottom-3 -right-3 text-5xl opacity-[0.08] transform rotate-12 transition-transform duration-500 group-hover:scale-125 select-none pointer-events-none">
                                {topic.iconUrl}
                              </span>
                            )
                          ) : (
                            <span className="absolute -bottom-3 -right-3 text-5xl opacity-[0.08] transform rotate-12 transition-transform duration-500 group-hover:scale-125 select-none pointer-events-none">
                              🧸
                            </span>
                          )}

                          {/* Top: icon + title (Stacked flex-col on mobile, side-by-side flex-row on desktop) */}
                          <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-start sm:gap-3 relative z-10 w-full min-w-0">
                            <div className="shrink-0">
                              {topic.iconUrl ? (
                                topic.iconUrl.startsWith("http") || topic.iconUrl.startsWith("/") ? (
                                  <img src={topic.iconUrl} alt={topic.name} className="w-8 h-8 sm:w-12 sm:h-12 object-contain" />
                                ) : (
                                  <span className="text-2xl sm:text-4xl leading-none">{topic.iconUrl}</span>
                                )
                              ) : <span className="text-2xl sm:text-4xl leading-none">🧸</span>}
                            </div>
                            <p className="font-black text-xs sm:text-base md:text-xl text-slate-800 leading-snug sm:pt-1 group-hover:text-primary transition-colors line-clamp-2 break-words w-full">
                              {topic.name}
                            </p>
                          </div>

                          {/* Footer: card count */}
                          <div className="mt-auto pt-1.5 relative z-10">
                            <span className="text-[11px] sm:text-xs font-black text-slate-400/90 group-hover:text-slate-600 transition-colors">
                              {cardCount > 0 ? `${cardCount} Cards` : "—"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mode selection popup — renders on top of current page */}
      {popupTopic && (
        <FlashcardModePopup
          topic={popupTopic}
          onClose={() => setPopupTopic(null)}
        />
      )}
    </>
  );
}

