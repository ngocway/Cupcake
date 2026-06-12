"use client";

import { useContentStore } from "@/store/useContentStore";
import { FilterLink } from "@/components/public/FilterLink";
import { useLocale } from "next-intl";

export function LearningGoalsFilter({ categories, activeId }: { categories: any[], activeId?: string }) {
  const studySubject = useContentStore(s => (s as any).studySubject);
  const studyAgeGroup = useContentStore(s => (s as any).studyAgeGroup);
  const locale = useLocale();

  if (studySubject !== "english") return null;
  if (studyAgeGroup === "kindergarten" || studyAgeGroup === "kindergarden") return null;

  const englishCat = categories.find(c => c.slug === "english");
  if (!englishCat || !englishCat.children) return null;

  let goals = englishCat.children;
  if (studyAgeGroup === "kid" || studyAgeGroup === "teen") {
    goals = goals.filter((g: any) => g.slug !== "ielts-toefl");
  }

  const blobShapes = [
    "rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem]",
    "rounded-[3.5rem_2rem_4rem_2.5rem_/_2rem_3.5rem_2.5rem_4rem]",
    "rounded-[2.5rem_4.5rem_3rem_4rem_/_4rem_3rem_4.5rem_2.5rem]",
    "rounded-[4rem_2.5rem_4rem_3rem_/_2.5rem_4.5rem_3rem_4.5rem]",
    "rounded-[3rem_4rem_2.5rem_4.5rem_/_4.5rem_2.5rem_4.5rem_3rem]",
  ];

  const colors = [
    { border: "border-slate-300", bg: "bg-slate-100", text: "text-slate-900", hover: "hover:bg-slate-200" }, // All
    { border: "border-emerald-300", bg: "bg-emerald-100/60", text: "text-emerald-900", hover: "hover:bg-emerald-200" },
    { border: "border-sky-300", bg: "bg-sky-100/60", text: "text-sky-900", hover: "hover:bg-sky-200" },
    { border: "border-amber-300", bg: "bg-amber-100/60", text: "text-amber-900", hover: "hover:bg-amber-200" },
    { border: "border-purple-300", bg: "bg-purple-100/60", text: "text-purple-900", hover: "hover:bg-purple-200" },
    { border: "border-rose-300", bg: "bg-rose-100/60", text: "text-rose-900", hover: "hover:bg-rose-200" },
  ];

  const allGoals = [
    { id: englishCat.id, nameEn: "All", nameVi: "Tất cả", slug: "all" },
    ...goals
  ];

  // If activeId is undefined, "All" should be active. Or if activeId === englishCat.id.
  const isAllActive = !activeId || activeId === englishCat.id;

  return (
    <div className="pt-6 border-t border-primary/5 animate-in fade-in slide-in-from-left duration-700">
      <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">
        {locale === "vi" ? "Mục tiêu học tập" : "Learning Goals"}
      </h2>
      <div className="flex flex-wrap gap-2.5">
        {allGoals.map((goal, idx) => {
          const isSelected = goal.slug === "all" ? isAllActive : activeId === goal.id;
          const blobShape = blobShapes[idx % blobShapes.length];
          const color = colors[idx % colors.length];
          const displayName = (locale === "vi" ? (goal.nameVi || goal.nameEn) : (goal.nameEn || goal.nameVi)) || "";

          return (
            <FilterLink
              key={goal.id}
              href={`/?categoryId=${goal.id}`}
              className={`inline-block border px-3 py-1.5 text-[11px] uppercase tracking-[0.05em] font-black transition-all duration-300 ${blobShape} ${color.border} ${isSelected ? `${color.bg} ${color.text} shadow-md scale-[1.05] ring-2 ring-primary/10` : `bg-white text-slate-500 hover:text-slate-800 ${color.hover} opacity-80 hover:opacity-100 shadow-sm hover:scale-105`}`}
            >
              {displayName}
            </FilterLink>
          );
        })}
      </div>
    </div>
  );
}
