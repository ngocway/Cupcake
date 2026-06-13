"use client";

import { useContentStore } from "@/store/useContentStore";
import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { getOnboardingConfig } from "@/actions/user-preferences-actions";

export function SidebarHeroSentence({ categoryTree }: { categoryTree: any[] }) {
  const nativeLanguage = useContentStore(s => s.nativeLanguage);
  const studySubject = useContentStore(s => (s as any).studySubject);
  const studyAgeGroup = useContentStore(s => (s as any).studyAgeGroup);
  const studyLevel = useContentStore(s => (s as any).studyLevel);
  const setFilterModalOpen = useContentStore(s => (s as any).setFilterModalOpen);

  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    getOnboardingConfig().then(c => {
      if (c) setConfig(c);
    });
  }, []);

  const subjectData = config?.subjects?.find((s: any) => s.id === studySubject);
  const ageGroupData = subjectData?.ageGroups?.find((a: any) => a.id === studyAgeGroup);
  const levelData = ageGroupData?.levels?.find((l: any) => l.id === studyLevel);

  const subjectLabel = subjectData?.label || "Anything";
  const rawAgeGroupLabel = ageGroupData?.label || "Learner";
  const ageGroupLabel = (rawAgeGroupLabel?.toUpperCase() === "KINDERGARTEN (< 6 YEARS)" || rawAgeGroupLabel?.toLowerCase() === "kindergarten")
    ? "Kindergarten"
    : rawAgeGroupLabel;
  const levelLabel = levelData?.label;
  const avatarSrc = ageGroupData?.avatar || "/images/avatars/adult.png";

  return (
    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-left duration-1000">
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
        <div className="inline-block border border-sky-300 px-2 py-0.5 bg-sky-100/60 text-sky-900 rounded-[3.5rem_2rem_4rem_2.5rem_/_2rem_3.5rem_2.5rem_4rem] shadow-sm transform -rotate-1 hover:rotate-0 transition-transform duration-300">
          {ageGroupLabel}
        </div>
        <span>speaking</span>
        <div className="inline-block border border-amber-300 px-2 py-0.5 bg-amber-100/60 text-amber-900 rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem] shadow-sm transform rotate-1 hover:rotate-0 transition-transform duration-300">
          {nativeLanguage === 'vi' ? 'Tiếng Việt' : nativeLanguage === 'th' ? 'ภาษาไทย' : nativeLanguage === 'id' ? 'Bahasa Indonesia' : 'English'}
        </div>
        <span>learning</span>
        <div className="inline-block border border-emerald-300 px-2 py-0.5 bg-emerald-100/60 text-emerald-900 rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem] shadow-sm transform rotate-1 hover:rotate-0 transition-transform duration-300">
          {subjectLabel}
        </div>
        {levelLabel && (
          <>
            <span>at</span>
            <span className="inline-flex items-center">
              <div className="inline-block border border-purple-300 px-2 py-0.5 bg-purple-100/60 text-purple-900 rounded-[3.5rem_2rem_4rem_2.5rem_/_2rem_3.5rem_2.5rem_4rem] shadow-sm transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                {levelLabel}
              </div>
            </span>
          </>
        )}
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
    </div>
  );
}
