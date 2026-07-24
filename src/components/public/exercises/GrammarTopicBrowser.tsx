"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CEFR_LEVELS, getTopicsForLevel, type CefrLevel } from "@/lib/grammar-taxonomy";

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
    label: "Beginner",
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
    label: "Elementary",
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
    label: "Intermediate",
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
    label: "Upper Intermediate",
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
    label: "Advanced",
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

const LEVEL_ACCENT: Record<CefrLevel, string> = {
  a1: "text-emerald-600",
  a2: "text-sky-600",
  b1: "text-amber-600",
  b2: "text-orange-600",
  c1: "text-rose-600",
};

// Same palette as flashcard cards
const CARD_STYLES = [
  {
    bg: "bg-amber-100/75",
    borderHover: "hover:border-amber-400",
    bgHover: "hover:bg-amber-100/90",
    circles: [
      { className: "absolute -top-10 -right-10 w-24 h-24 bg-amber-300/60 rounded-full blur-xl animate-pulse" },
      { className: "absolute -bottom-8 -left-8 w-20 h-20 bg-orange-200/60 rounded-full blur-xl" },
    ],
  },
  {
    bg: "bg-pink-100/75",
    borderHover: "hover:border-pink-400",
    bgHover: "hover:bg-pink-100/90",
    circles: [
      { className: "absolute -top-10 -right-10 w-24 h-24 bg-pink-300/60 rounded-full blur-xl animate-pulse" },
      { className: "absolute -bottom-8 -left-8 w-20 h-20 bg-purple-200/60 rounded-full blur-xl" },
    ],
  },
  {
    bg: "bg-sky-100/75",
    borderHover: "hover:border-sky-400",
    bgHover: "hover:bg-sky-100/90",
    circles: [
      { className: "absolute -top-10 -right-10 w-24 h-24 bg-sky-300/60 rounded-full blur-xl animate-pulse" },
      { className: "absolute -bottom-8 -left-8 w-20 h-20 bg-teal-200/60 rounded-full blur-xl" },
    ],
  },
  {
    bg: "bg-emerald-100/75",
    borderHover: "hover:border-emerald-400",
    bgHover: "hover:bg-emerald-100/90",
    circles: [
      { className: "absolute -top-10 -right-10 w-24 h-24 bg-emerald-300/60 rounded-full blur-xl animate-pulse" },
      { className: "absolute -bottom-8 -left-8 w-20 h-20 bg-green-200/60 rounded-full blur-xl" },
    ],
  },
  {
    bg: "bg-rose-100/75",
    borderHover: "hover:border-rose-400",
    bgHover: "hover:bg-rose-100/90",
    circles: [
      { className: "absolute -top-10 -right-10 w-24 h-24 bg-rose-300/60 rounded-full blur-xl animate-pulse" },
      { className: "absolute -bottom-8 -left-8 w-20 h-20 bg-orange-200/50 rounded-full blur-xl" },
    ],
  },
  {
    bg: "bg-violet-100/75",
    borderHover: "hover:border-violet-400",
    bgHover: "hover:bg-violet-100/90",
    circles: [
      { className: "absolute -top-10 -right-10 w-24 h-24 bg-violet-300/60 rounded-full blur-xl animate-pulse" },
      { className: "absolute -bottom-8 -left-8 w-20 h-20 bg-indigo-200/60 rounded-full blur-xl" },
    ],
  },
];

export function GrammarTopicBrowser() {
  const [openLevel, setOpenLevel] = useState<CefrLevel>("a1");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [countsLoaded, setCountsLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/exercises/counts")
      .then((r) => r.json())
      .then((data) => { setCounts(data); setCountsLoaded(true); })
      .catch(() => setCountsLoaded(true));

    const handleOpenLevel = (e: any) => {
      const lvl = e.detail?.level;
      if (lvl && lvl !== "all") {
        setOpenLevel(lvl as CefrLevel);
      }
    };
    window.addEventListener("open-cefr-level", handleOpenLevel);
    return () => window.removeEventListener("open-cefr-level", handleOpenLevel);
  }, []);

  // Show skeleton while waiting for exercise counts
  if (!countsLoaded) {
    return (
      <div className="space-y-4">
        {CEFR_LEVELS.map(({ id: levelId }) => (
          <div
            key={levelId}
            className="rounded-[28px] border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm animate-pulse"
          >
            {/* Level header skeleton */}
            <div className="flex items-center gap-3.5 px-6 py-4.5">
              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
              <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded-md" />
              <div className="flex-1" />
              <div className="h-6 w-28 bg-slate-100 dark:bg-slate-700 rounded-full" />
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            {/* Expanded card grid skeleton (only for first level) */}
            {levelId === "a1" && (
              <div className="px-6 pb-6 border-t border-slate-100 dark:border-slate-700">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="rounded-[24px] bg-slate-100 dark:bg-slate-700 min-h-[135px] p-4.5 flex flex-col gap-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-600 shrink-0" />
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-600 rounded mt-1" />
                      </div>
                      <div className="h-3 w-full bg-slate-200 dark:bg-slate-600 rounded" />
                      <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-600 rounded" />
                      <div className="mt-auto h-3 w-16 bg-slate-200 dark:bg-slate-600 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {CEFR_LEVELS.map(({ id: levelId }) => {
        const level = levelId as CefrLevel;
        const config = CEFR_LEVEL_CONFIG[level] || CEFR_LEVEL_CONFIG.a1;
        const isOpen = openLevel === level;
        const allTopics = getTopicsForLevel(level);
        const topics = allTopics.filter((t) => (counts[`${t.id}_${level}`] ?? 0) > 0);
        const totalExercises = topics.reduce(
          (sum, t) => sum + (counts[`${t.id}_${level}`] ?? 0),
          0
        );
        if (topics.length === 0) return null;

        return (
          <div
            key={level}
            id={`cefr-level-${level}`}
            className={`group/accordion rounded-[28px] border-2 transition-all duration-300 ${config.border} ${config.hoverGlow} ${
              isOpen ? config.bgOpen : config.bgClosed
            }`}
          >
            {/* Level header */}
            <button
              onClick={() => setOpenLevel(isOpen ? ("" as CefrLevel) : level)}
              className="w-full flex items-center gap-3.5 px-6 py-4.5 cursor-pointer text-left focus:outline-none transition-transform duration-300 group-hover/accordion:-translate-y-0.5"
            >
              <span className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black uppercase transition-transform duration-300 group-hover/accordion:scale-110 ${config.badge}`}>
                {level.toUpperCase()}
              </span>

              <div className="flex flex-col">
                <span className={`font-black text-base md:text-lg leading-tight transition-colors ${config.titleColor}`}>
                  {config.label}
                </span>
                {!isOpen && (
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 group-hover/accordion:text-slate-600 dark:group-hover/accordion:text-slate-300">
                    <span>Click to expand</span>
                    <span>•</span>
                    <span>{topics.length} {topics.length === 1 ? "topic" : "topics"}</span>
                  </span>
                )}
              </div>

              <div className="flex-1" />

              {!isOpen && (
                <span className={`px-3 py-1 text-xs font-black rounded-full transition-all duration-300 group-hover/accordion:scale-105 ${config.tagBg}`}>
                  {topics.length} {topics.length === 1 ? "topic" : "topics"}{totalExercises > 0 && ` · ${totalExercises} exercises`}
                </span>
              )}

              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/80 dark:bg-slate-700/80 border border-slate-200/60 dark:border-slate-600 shadow-sm transition-all duration-300 group-hover/accordion:bg-white group-hover/accordion:scale-110 ${isOpen ? "rotate-180 bg-white" : "group-hover/accordion:translate-y-0.5"}`}>
                <ChevronDown className={`w-4 h-4 transition-colors ${config.accentIcon}`} />
              </div>
            </button>

            {/* Expanded: 4-col grid */}
            {isOpen && (
              <div className="px-6 pb-6 border-t border-slate-200/50 dark:border-slate-700/50 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-5">
                  {topics.map((topic, idx) => {
                    const style = CARD_STYLES[idx % CARD_STYLES.length];
                    const lessonLabels = topic.lessons
                      .filter((l) => l.level === level)
                      .map((l) => l.label)
                      .join(", ");
                    const exCount = counts[`${topic.id}_${level}`] ?? 0;

                    return (
                      <Link
                        key={topic.id}
                        href={`/exercises/${level}/${topic.id}`}
                        className={`group relative flex flex-col justify-between p-4.5 rounded-[24px] border-2 border-slate-200 overflow-hidden cursor-pointer transition-all duration-300 shadow-sm hover:shadow-xl hover:scale-[1.03] ${style.bg} ${style.borderHover} ${style.bgHover} min-h-[135px]`}
                      >
                        {/* Ambient blobs */}
                        {style.circles.map((c, cIdx) => (
                          <div key={cIdx} className={c.className} />
                        ))}

                        {/* Ghost emoji watermark */}
                        <span className="absolute -bottom-3 -right-3 text-5xl opacity-[0.07] transform rotate-12 transition-transform duration-500 group-hover:scale-125 select-none pointer-events-none">
                          {topic.icon}
                        </span>

                        {/* Top: icon bubble + title */}
                        <div className="flex items-start gap-3 relative z-10">
                          <div className="w-10 h-10 rounded-2xl bg-white/80 flex items-center justify-center text-xl shrink-0 shadow-sm border border-white">
                            {topic.icon}
                          </div>
                          <p className="font-black text-sm text-slate-800 leading-tight pt-1 group-hover:text-primary transition-colors">
                            {topic.label}
                          </p>
                        </div>

                        {/* Lesson sub-text */}
                        {lessonLabels && (
                          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 relative z-10 mt-2">
                            {lessonLabels}
                          </p>
                        )}

                        {/* Footer: exercise count + arrow */}
                        <div className="flex items-center justify-between mt-auto pt-2 relative z-10">
                          <span className={`text-xs font-black ${LEVEL_ACCENT[level]}`}>
                            {exCount > 0 ? `${exCount} exercises` : "—"}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
