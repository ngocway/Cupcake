"use client";

import { useContentStore } from "@/store/useContentStore";
import { updateAllPreferences } from "@/actions/user-preferences-actions";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface SubjectConfig {
  id: string;
  label: string;
  icon?: string;
}

interface Props {
  subjects: SubjectConfig[];
}

const subjectStyles: Record<string, { bg: string; activeBg: string; border: string; activeBorder: string; text: string; activeText: string; icon: string }> = {
  english: {
    bg: "bg-emerald-50", activeBg: "bg-emerald-500", border: "border-emerald-200",
    activeBorder: "border-emerald-500", text: "text-emerald-800", activeText: "text-white",
    icon: "/images/english.png"
  },
  math: {
    bg: "bg-orange-50", activeBg: "bg-orange-500", border: "border-orange-200",
    activeBorder: "border-orange-500", text: "text-orange-800", activeText: "text-white",
    icon: "/images/math.png"
  },
  global: {
    bg: "bg-sky-50", activeBg: "bg-sky-500", border: "border-sky-200",
    activeBorder: "border-sky-500", text: "text-sky-800", activeText: "text-white",
    icon: "/images/global.png"
  },
};

const defaultStyle = {
  bg: "bg-purple-50", activeBg: "bg-purple-500", border: "border-purple-200",
  activeBorder: "border-purple-500", text: "text-purple-800", activeText: "text-white",
  icon: "/images/english.png"
};

function getStyle(subjectId: string) {
  return subjectStyles[subjectId] || defaultStyle;
}

export function SubjectSelector({ subjects }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const studySubject = useContentStore(s => (s as any).studySubject);
  const setStudySubject = useContentStore(s => (s as any).setStudySubject);
  const setStudyLevel = useContentStore(s => (s as any).setStudyLevel);

  const handleSelect = (subjectId: string) => {
    if (subjectId === studySubject) return;

    // 1. Update store instantly (optimistic)
    setStudySubject(subjectId);
    setStudyLevel(""); // Reset level — new subject has different levels

    // 2. Set cookies client-side immediately
    document.cookie = `study_subject=${subjectId}; path=/; max-age=31536000; samesite=lax`;
    document.cookie = `study_level=; path=/; max-age=31536000; samesite=lax`;

    // 3. Fire-and-forget DB update
    updateAllPreferences({ studySubject: subjectId, studyLevel: "" }).catch(console.error);

    // 4. Clear goal from URL and refresh
    const qs = new URLSearchParams(window.location.search);
    qs.delete("goal");
    qs.delete("categoryId");
    localStorage.removeItem("cupcakes_preferred_goal_id");
    localStorage.removeItem("cupcakes_preferred_category_id");

    startTransition(() => {
      router.push(`/?${qs.toString()}`, { scroll: false });
      router.refresh();
    });
  };

  return (
    <div className="pt-4 border-t border-primary/5 animate-in fade-in slide-in-from-left duration-700">
      <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-3">
        Subject
      </h2>
      {/* Use flex wrap for desktop, overflow-x scroll on mobile */}
      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 no-scrollbar sm:flex-wrap sm:overflow-visible sm:pb-0">
        {subjects.map((subject) => {
          const isActive = studySubject === subject.id;
          const style = getStyle(subject.id);

          return (
            <button
              key={subject.id}
              onPointerDown={(e) => {
                if (e.button === 0) {
                  e.preventDefault();
                  handleSelect(subject.id);
                }
              }}
              onClick={(e) => {
                e.preventDefault();
                handleSelect(subject.id);
              }}
              disabled={isPending}
              className={`group flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-black uppercase tracking-wide border-2 transition-all duration-300 shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                isActive
                  ? `${style.activeBg} ${style.activeBorder} ${style.activeText} shadow-md scale-[1.05]`
                  : `${style.bg} ${style.border} ${style.text} hover:scale-105 hover:shadow-md opacity-80 hover:opacity-100`
              }`}
            >
              {isActive && isPending ? (
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <img
                  src={style.icon}
                  alt={subject.label}
                  className={`w-5 h-5 object-contain transition-transform duration-300 ${
                    isActive ? "scale-110" : "group-hover:scale-110"
                  }`}
                />
              )}
              <span>{subject.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
