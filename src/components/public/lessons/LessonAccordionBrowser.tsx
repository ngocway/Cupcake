"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { LessonCard } from "@/components/public/ContentCards";

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
    label: "Beginner (Pre-A1, A1)",
    badge: "bg-emerald-500 text-white shadow-sm shadow-emerald-200",
    border: "border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400",
    bgClosed: "bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white dark:from-emerald-950/20 dark:to-slate-800 hover:from-emerald-100/90 hover:to-teal-50/80",
    bgOpen: "bg-emerald-50/30 dark:bg-slate-800",
    titleColor: "text-emerald-900 dark:text-emerald-200",
    tagBg: "bg-emerald-100/90 text-emerald-800 border border-emerald-300/60 dark:bg-emerald-900/40 dark:text-emerald-300",
    hoverGlow: "hover:shadow-xl hover:shadow-emerald-500/10",
    accentIcon: "text-emerald-500",
  },
  a2: {
    label: "Elementary (A2)",
    badge: "bg-sky-500 text-white shadow-sm shadow-sky-200",
    border: "border-sky-200 dark:border-sky-800/50 hover:border-sky-400",
    bgClosed: "bg-gradient-to-r from-sky-50/80 via-blue-50/40 to-white dark:from-sky-950/20 dark:to-slate-800 hover:from-sky-100/90 hover:to-blue-50/80",
    bgOpen: "bg-sky-50/30 dark:bg-slate-800",
    titleColor: "text-sky-900 dark:text-sky-200",
    tagBg: "bg-sky-100/90 text-sky-800 border border-sky-300/60 dark:bg-sky-900/40 dark:text-sky-300",
    hoverGlow: "hover:shadow-xl hover:shadow-sky-500/10",
    accentIcon: "text-sky-500",
  },
  b1: {
    label: "Intermediate (B1)",
    badge: "bg-amber-500 text-white shadow-sm shadow-amber-200",
    border: "border-amber-200 dark:border-amber-800/50 hover:border-amber-400",
    bgClosed: "bg-gradient-to-r from-amber-50/80 via-yellow-50/40 to-white dark:from-amber-950/20 dark:to-slate-800 hover:from-amber-100/90 hover:to-yellow-50/80",
    bgOpen: "bg-amber-50/30 dark:bg-slate-800",
    titleColor: "text-amber-900 dark:text-amber-200",
    tagBg: "bg-amber-100/90 text-amber-800 border border-amber-300/60 dark:bg-amber-900/40 dark:text-amber-300",
    hoverGlow: "hover:shadow-xl hover:shadow-amber-500/10",
    accentIcon: "text-amber-500",
  },
  b2: {
    label: "Upper Intermediate (B2)",
    badge: "bg-orange-500 text-white shadow-sm shadow-orange-200",
    border: "border-orange-200 dark:border-orange-800/50 hover:border-orange-400",
    bgClosed: "bg-gradient-to-r from-orange-50/80 via-amber-50/40 to-white dark:from-orange-950/20 dark:to-slate-800 hover:from-orange-100/90 hover:to-amber-50/80",
    bgOpen: "bg-orange-50/30 dark:bg-slate-800",
    titleColor: "text-orange-900 dark:text-orange-200",
    tagBg: "bg-orange-100/90 text-orange-800 border border-orange-300/60 dark:bg-orange-900/40 dark:text-orange-300",
    hoverGlow: "hover:shadow-xl hover:shadow-orange-500/10",
    accentIcon: "text-orange-500",
  },
  c1: {
    label: "Advanced (C1)",
    badge: "bg-rose-500 text-white shadow-sm shadow-rose-200",
    border: "border-rose-200 dark:border-rose-800/50 hover:border-rose-400",
    bgClosed: "bg-gradient-to-r from-rose-50/80 via-pink-50/40 to-white dark:from-rose-950/20 dark:to-slate-800 hover:from-rose-100/90 hover:to-pink-50/80",
    bgOpen: "bg-rose-50/30 dark:bg-slate-800",
    titleColor: "text-rose-900 dark:text-rose-200",
    tagBg: "bg-rose-100/90 text-rose-800 border border-rose-300/60 dark:bg-rose-900/40 dark:text-rose-300",
    hoverGlow: "hover:shadow-xl hover:shadow-rose-500/10",
    accentIcon: "text-rose-500",
  },
};

const CEFR_ORDER = ["a1", "a2", "b1", "b2", "c1"];

export function normalizeLessonLevel(rawLevel?: string): string {
  if (!rawLevel) return "a1";
  const lvl = rawLevel.toLowerCase();
  if (lvl.includes("pre-a1") || lvl.includes("a1") || lvl.includes("beginner")) return "a1";
  if (lvl.includes("a2") || lvl.includes("elementary")) return "a2";
  if (lvl.includes("b1") || (lvl.includes("intermediate") && !lvl.includes("upper"))) return "b1";
  if (lvl.includes("b2") || lvl.includes("upper")) return "b2";
  if (lvl.includes("c1") || lvl.includes("advanced")) return "c1";
  return "a1";
}

interface LessonAccordionBrowserProps {
  items: any[];
  isLoggedIn: boolean;
  initialLevel?: string;
}

export function LessonAccordionBrowser({ items, isLoggedIn, initialLevel }: LessonAccordionBrowserProps) {
  // Normalize initial level or default to "a1"
  const defaultLevel = useMemo(() => {
    const norm = normalizeLessonLevel(initialLevel);
    return CEFR_ORDER.includes(norm) ? norm : "a1";
  }, [initialLevel]);

  const [openLevel, setOpenLevel] = useState<string>(defaultLevel);

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

  // Track pagination limits per level (default 6 items)
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({
    a1: 6,
    a2: 6,
    b1: 6,
    b2: 6,
    c1: 6,
  });

  // Group items by normalized CEFR level
  const groupedLessons = useMemo(() => {
    const map: Record<string, any[]> = {
      a1: [],
      a2: [],
      b1: [],
      b2: [],
      c1: [],
    };

    items.forEach((item) => {
      const lvl = normalizeLessonLevel(item.level);
      if (map[lvl]) {
        map[lvl].push(item);
      } else {
        map.a1.push(item);
      }
    });

    return map;
  }, [items]);

  const handleViewMore = (levelId: string) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [levelId]: (prev[levelId] || 6) + 6,
    }));
  };

  return (
    <div className="space-y-4">
      {CEFR_ORDER.map((levelId) => {
        const config = CEFR_LEVEL_CONFIG[levelId] || CEFR_LEVEL_CONFIG.a1;
        const levelLessons = groupedLessons[levelId] || [];
        const isOpen = openLevel === levelId;
        const currentVisibleCount = visibleCounts[levelId] || 6;
        const displayedLessons = levelLessons.slice(0, currentVisibleCount);
        const hasMore = levelLessons.length > currentVisibleCount;

        return (
          <div
            key={levelId}
            id={`cefr-level-${levelId}`}
            className={`group/accordion rounded-[28px] border-2 transition-all duration-300 ${config.border} ${config.hoverGlow} ${
              isOpen ? config.bgOpen : config.bgClosed
            }`}
          >
            {/* Level Accordion Header */}
            <button
              onClick={() => setOpenLevel(isOpen ? "" : levelId)}
              className="w-full flex items-center gap-3.5 px-6 py-4.5 cursor-pointer text-left focus:outline-none transition-transform duration-300 group-hover/accordion:-translate-y-0.5"
            >
              <span className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black uppercase transition-transform duration-300 group-hover/accordion:scale-110 ${config.badge}`}>
                {levelId.toUpperCase()}
              </span>

              <div className="flex flex-col">
                <span className={`font-black text-base md:text-lg leading-tight transition-colors ${config.titleColor}`}>
                  {config.label}
                </span>
                {!isOpen && (
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 group-hover/accordion:text-slate-600 dark:group-hover/accordion:text-slate-300">
                    <span>Click to expand</span>
                    <span>•</span>
                    <span>{levelLessons.length} {levelLessons.length === 1 ? "lesson" : "lessons"}</span>
                  </span>
                )}
              </div>

              <div className="flex-1" />

              {!isOpen && (
                <span className={`px-3 py-1 text-xs font-black rounded-full transition-all duration-300 group-hover/accordion:scale-105 ${config.tagBg}`}>
                  {levelLessons.length} {levelLessons.length === 1 ? "lesson" : "lessons"}
                </span>
              )}

              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/80 dark:bg-slate-700/80 border border-slate-200/60 dark:border-slate-600 shadow-sm transition-all duration-300 group-hover/accordion:bg-white group-hover/accordion:scale-110 ${isOpen ? "rotate-180 bg-white" : "group-hover/accordion:translate-y-0.5"}`}>
                <ChevronDown className={`w-4 h-4 transition-colors ${config.accentIcon}`} />
              </div>
            </button>

            {/* Expanded Content: Grid of LessonCards */}
            {isOpen && (
              <div className="px-6 pb-6 border-t border-slate-200/50 dark:border-slate-700/50 animate-in fade-in slide-in-from-top-2 duration-300">
                {displayedLessons.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 pt-5">
                      {displayedLessons.map((lesson) => (
                        <LessonCard key={lesson.id} item={lesson} isLoggedIn={isLoggedIn} />
                      ))}
                    </div>

                    {/* View More Button */}
                    {hasMore && (
                      <div className="flex justify-center pt-8">
                        <button
                          onClick={() => handleViewMore(levelId)}
                          className="px-8 py-3 rounded-full text-xs font-black uppercase tracking-wider bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-200 hover:text-primary shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.03] active:scale-95"
                        >
                          View more ({levelLessons.length - currentVisibleCount} more)
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-8 text-center text-sm font-bold text-slate-400 dark:text-slate-500">
                    No lessons available for this level.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
