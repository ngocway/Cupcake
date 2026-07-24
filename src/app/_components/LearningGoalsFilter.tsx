"use client";

import { useContentStore } from "@/store/useContentStore";
import { FilterLink } from "@/components/public/FilterLink";
import { useLocale } from "next-intl";

interface Props {
  config: any;
  activeId?: string;
}

export function LearningGoalsFilter({ config, activeId }: Props) {
  const studySubject = useContentStore(s => (s as any).studySubject);
  const studyAgeGroup = useContentStore(s => (s as any).studyAgeGroup);
  const locale = useLocale();

  if (!studySubject || !studyAgeGroup || !config) return null;
  if (studyAgeGroup === "kindergarten" || studyAgeGroup === "kindergarden" || studyAgeGroup === "KINDERGARTEN (< 6 YEARS)") return null;

  const subjectData = config.subjects?.find((s: any) => s.id === studySubject);
  const ageGroupData = subjectData?.ageGroups?.find((a: any) => a.id === studyAgeGroup);
  const goals = ageGroupData?.goals || [];

  if (goals.length === 0) return null;

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
    { id: "all", label: "All", nameVi: "Tất cả", nameEn: "All", color: "#64748b" },
    ...goals
  ];

  const isAllActive = !activeId || activeId === "all";

  return (
    <div className="animate-in fade-in slide-in-from-left duration-700">
      <p className="cefr-redesign-section-label" style={{ marginBottom: "8px" }}>
        {locale === "vi" ? "Mục tiêu học tập" : "Learning Goals"}
      </p>
      <div className="cefr-redesign-chip-row">
        {allGoals.map((goal) => {
          const isSelected = goal.id === "all" ? isAllActive : activeId === goal.id;
          const displayName = goal.id === "all" && locale === "vi" ? "Tất cả" : goal.label;
          const filterHref = goal.id === "all" ? "/?goal=" : `/?goal=${goal.id}`;

          return (
            <FilterLink
              key={goal.id}
              href={filterHref}
              className={`cefr-redesign-chip decoration-transparent cursor-pointer ${isSelected ? "active" : ""}`}
            >
              {displayName}
            </FilterLink>
          );
        })}
      </div>
    </div>
  );
}
