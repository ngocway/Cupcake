"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";

interface LevelPillConfig {
  id: string;
  label: string;
  subLabel?: string;
  activeBg: string;
  inactiveBg: string;
  activeBorder: string;
  inactiveBorder: string;
  activeText: string;
  inactiveText: string;
  badgeBg: string;
}

const LEVEL_PILLS: LevelPillConfig[] = [
  {
    id: "a1",
    label: "A1",
    subLabel: "Beginner",
    activeBg: "bg-emerald-500 shadow-md shadow-emerald-500/25",
    inactiveBg: "bg-emerald-50/90 dark:bg-emerald-950/30",
    activeBorder: "border-emerald-500",
    inactiveBorder: "border-emerald-200 dark:border-emerald-800/40 hover:border-emerald-400",
    activeText: "text-white",
    inactiveText: "text-emerald-900 dark:text-emerald-200",
    badgeBg: "bg-emerald-200/90 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200",
  },
  {
    id: "a2",
    label: "A2",
    subLabel: "Elementary",
    activeBg: "bg-sky-500 shadow-md shadow-sky-500/25",
    inactiveBg: "bg-sky-50/90 dark:bg-sky-950/30",
    activeBorder: "border-sky-500",
    inactiveBorder: "border-sky-200 dark:border-sky-800/40 hover:border-sky-400",
    activeText: "text-white",
    inactiveText: "text-sky-900 dark:text-sky-200",
    badgeBg: "bg-sky-200/90 text-sky-900 dark:bg-sky-900/60 dark:text-sky-200",
  },
  {
    id: "b1",
    label: "B1",
    subLabel: "Intermediate",
    activeBg: "bg-violet-500 shadow-md shadow-violet-500/25",
    inactiveBg: "bg-violet-50/90 dark:bg-violet-950/30",
    activeBorder: "border-violet-500",
    inactiveBorder: "border-violet-200 dark:border-violet-800/40 hover:border-violet-400",
    activeText: "text-white",
    inactiveText: "text-violet-900 dark:text-violet-200",
    badgeBg: "bg-violet-200/90 text-violet-900 dark:bg-violet-900/60 dark:text-violet-200",
  },
  {
    id: "b2",
    label: "B2",
    subLabel: "Upper Int.",
    activeBg: "bg-amber-500 shadow-md shadow-amber-500/25",
    inactiveBg: "bg-amber-50/90 dark:bg-amber-950/30",
    activeBorder: "border-amber-500",
    inactiveBorder: "border-amber-200 dark:border-amber-800/40 hover:border-amber-400",
    activeText: "text-white",
    inactiveText: "text-amber-900 dark:text-amber-200",
    badgeBg: "bg-amber-200/90 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200",
  },
  {
    id: "c1",
    label: "C1",
    subLabel: "Advanced",
    activeBg: "bg-rose-500 shadow-md shadow-rose-500/25",
    inactiveBg: "bg-rose-50/90 dark:bg-rose-950/30",
    activeBorder: "border-rose-500",
    inactiveBorder: "border-rose-200 dark:border-rose-800/40 hover:border-rose-400",
    activeText: "text-white",
    inactiveText: "text-rose-900 dark:text-rose-200",
    badgeBg: "bg-rose-200/90 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200",
  },
];

interface Props {
  activeTab?: string;
  counts?: Record<string, number>;
}

export function LevelPillSelector({ counts }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<string>("a1");
  const locale = useLocale();

  const handleSelect = (levelId: string) => {
    setSelectedLevel(levelId);

    // 1. Dispatch custom event so browser components expand the targeted level accordion
    window.dispatchEvent(
      new CustomEvent("open-cefr-level", { detail: { level: levelId } })
    );

    // 2. Smooth scroll jump (Option B)
    const elem = document.getElementById(`cefr-level-${levelId}`);
    if (elem) {
      const offset = 90; // offset for sticky navbar header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elemRect = elem.getBoundingClientRect().top;
      const elemPosition = elemRect - bodyRect;
      const offsetPosition = elemPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div id="cefr-content-top" className="mb-4 pt-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-2.5 overflow-x-auto p-2.5 no-scrollbar sm:flex-wrap">
        {LEVEL_PILLS.map((pill) => {
          const isActive = selectedLevel === pill.id;
          const count = counts ? counts[pill.id] : undefined;

          return (
            <button
              key={pill.id}
              onClick={() => handleSelect(pill.id)}
              className={`group flex items-center gap-2 px-3.5 py-2 rounded-2xl border-2 font-black text-xs uppercase tracking-wide transition-all duration-300 shadow-xs cursor-pointer shrink-0 hover:scale-105 active:scale-95 ${
                isActive
                  ? `${pill.activeBg} ${pill.activeBorder} ${pill.activeText} shadow-md scale-105`
                  : `${pill.inactiveBg} ${pill.inactiveBorder} ${pill.inactiveText} opacity-85 hover:opacity-100`
              }`}
            >
              <span>{pill.label}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black transition-all ${
                    isActive ? "bg-white/25 text-white" : pill.badgeBg
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
