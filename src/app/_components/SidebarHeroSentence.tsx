"use client";

import { useContentStore } from "@/store/useContentStore";
import { useState, useEffect, useTransition } from "react";
import { Settings } from "lucide-react";
import { updateAllPreferences } from "@/actions/user-preferences-actions";
import { useRouter } from "next/navigation";
import { SubjectSelector } from "./SubjectSelector";

interface Props {
  config: any;
}

export function SidebarHeroSentence({ config }: Props) {
  const router = useRouter();
  const nativeLanguage = useContentStore(s => s.nativeLanguage);
  const studySubject = useContentStore(s => (s as any).studySubject);
  const studyAgeGroup = useContentStore(s => (s as any).studyAgeGroup);
  const studyLevel = useContentStore(s => (s as any).studyLevel);
  const setStudyLevel = useContentStore(s => (s as any).setStudyLevel);
  const setFilterModalOpen = useContentStore(s => (s as any).setFilterModalOpen);

  const [isPending, startTransition] = useTransition();

  const subjectData = config?.subjects?.find((s: any) => s.id === studySubject);
  const ageGroupData = subjectData?.ageGroups?.find((a: any) => a.id === studyAgeGroup);
  const levelData = ageGroupData?.levels?.find((l: any) => l.id === studyLevel);
  const availableLevels: any[] = ageGroupData?.levels || [];

  const rawAgeGroupLabel = ageGroupData?.label || "Learner";
  const ageGroupLabel = (rawAgeGroupLabel?.toUpperCase() === "KINDERGARTEN (< 6 YEARS)" || rawAgeGroupLabel?.toLowerCase() === "kindergarten")
    ? "Kindergarten"
    : rawAgeGroupLabel;
  const avatarSrc = ageGroupData?.avatar || "/images/avatars/adult.png";

  const handleSelectLevel = (levelId: string) => {
    const newLevel = levelId === "all" ? "" : levelId;

    // 1. Update store instantly (optimistic)
    setStudyLevel(newLevel);

    // 2. Set cookie client-side immediately
    document.cookie = `study_level=${newLevel}; path=/; max-age=31536000; samesite=lax`;

    // 3. Fire-and-forget to DB
    updateAllPreferences({ studyLevel: newLevel }).catch(console.error);

    // 4. Reload server content
    startTransition(() => {
      router.refresh();
    });
  };

  const levelStyles = [
    { bg: "bg-emerald-100", border: "border-emerald-300", activeBg: "bg-emerald-500", text: "text-emerald-900", activeText: "text-white" },
    { bg: "bg-sky-100", border: "border-sky-300", activeBg: "bg-sky-500", text: "text-sky-900", activeText: "text-white" },
    { bg: "bg-purple-100", border: "border-purple-300", activeBg: "bg-purple-500", text: "text-purple-900", activeText: "text-white" },
    { bg: "bg-orange-100", border: "border-orange-300", activeBg: "bg-orange-500", text: "text-orange-900", activeText: "text-white" },
    { bg: "bg-rose-100", border: "border-rose-300", activeBg: "bg-rose-500", text: "text-rose-900", activeText: "text-white" },
  ];

  const blobShapes = [
    "rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem]",
    "rounded-[3.5rem_2rem_4rem_2.5rem_/_2rem_3.5rem_2.5rem_4rem]",
    "rounded-[2.5rem_4.5rem_3rem_4rem_/_4rem_3rem_4.5rem_2.5rem]",
    "rounded-[4rem_2.5rem_4rem_3rem_/_2.5rem_4.5rem_3rem_4.5rem]",
    "rounded-[3rem_4rem_2.5rem_4.5rem_/_4.5rem_2.5rem_4.5rem_3rem]",
  ];

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left duration-1000">
      {/* "I'm a..." sentence — without "learning [Subject]" */}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5 text-xs md:text-sm font-headline font-bold text-primary leading-tight relative">
        <span>I'm a</span>
        <div className="flex flex-col items-center gap-0.5 shrink-0 px-0.5 mt-1">
          <div className="relative w-[24px] h-[24px] rounded-full overflow-hidden border-2 border-primary shadow-sm bg-white">
            <img 
              src={avatarSrc} 
              alt={ageGroupLabel} 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>
        <button 
          onClick={() => setFilterModalOpen(true)}
          className="inline-block border border-sky-300 px-2 py-0.5 bg-sky-100/60 text-sky-900 rounded-[3.5rem_2rem_4rem_2.5rem_/_2rem_3.5rem_2.5rem_4rem] shadow-sm transform -rotate-1 hover:rotate-0 transition-transform duration-300 cursor-pointer focus:outline-none"
        >
          {ageGroupLabel}
        </button>
        <span>speaking</span>
        <button 
          onClick={() => setFilterModalOpen(true)}
          className="inline-block border border-amber-300 px-2 py-0.5 bg-amber-100/60 text-amber-900 rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem] shadow-sm transform rotate-1 hover:rotate-0 transition-transform duration-300 cursor-pointer focus:outline-none"
        >
          {nativeLanguage === 'vi' ? 'Tiếng Việt' : nativeLanguage === 'th' ? 'ภาษาไทย' : nativeLanguage === 'id' ? 'Bahasa Indonesia' : 'English'}
        </button>
        <span className="inline-flex items-center">
          <button
            onClick={() => setFilterModalOpen(true)}
            className="ml-1 text-primary/40 hover:text-primary hover:rotate-90 transition-all duration-300 focus:outline-none cursor-pointer p-1 rounded-full hover:bg-primary/5"
            title="Change Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>
        </span>
      </div>

      {/* Subject Selector — between sentence and level */}
      <SubjectSelector subjects={(config?.subjects || []).map((s: any) => ({ id: s.id, label: s.label, icon: s.icon }))} />

      {/* Level Selector — shown only when levels exist for current subject+ageGroup */}
      {availableLevels.length > 0 && (
        <div className="pt-3 border-t border-primary/5 animate-in fade-in slide-in-from-left duration-700">
          <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-3">
            Your Level
          </h2>
          <div className="flex flex-wrap gap-2">
            {/* "All" option */}
            <button
              onClick={() => handleSelectLevel("all")}
              disabled={isPending}
              className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.05em] border transition-all duration-300 rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem] shadow-sm hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                !studyLevel
                  ? "bg-slate-700 border-slate-600 text-white shadow-md scale-[1.05]"
                  : "bg-white border-slate-300 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              All
            </button>

            {availableLevels.map((level: any, idx: number) => {
              const isActive = studyLevel === level.id;
              const style = levelStyles[idx % levelStyles.length];
              const blob = blobShapes[(idx + 1) % blobShapes.length];

              return (
                <button
                  key={level.id}
                  onClick={() => handleSelectLevel(level.id)}
                  disabled={isPending}
                  className={`px-3 py-1.5 ${blob} text-[11px] font-black uppercase tracking-[0.05em] border-2 transition-all duration-300 shadow-sm hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                    isActive
                      ? `${style.activeBg} ${style.border} ${style.activeText} shadow-md scale-[1.05]`
                      : `bg-white ${style.border} ${style.text} hover:${style.bg}`
                  }`}
                >
                  {level.label}
                </button>
              );
            })}
          </div>
          {isPending && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] text-primary/60 font-bold">Updating...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
