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
  const setFilterModalOpen = useContentStore(s => (s as any).setFilterModalOpen);

  const subjectData = config?.subjects?.find((s: any) => s.id === studySubject);
  const ageGroupData = subjectData?.ageGroups?.find((a: any) => a.id === studyAgeGroup);

  const rawAgeGroupLabel = ageGroupData?.label || "Learner";
  const ageGroupLabel = (rawAgeGroupLabel?.toUpperCase() === "KINDERGARTEN (< 6 YEARS)" || rawAgeGroupLabel?.toLowerCase() === "kindergarten")
    ? "Kindergarten"
    : rawAgeGroupLabel;
  const avatarSrc = ageGroupData?.avatar || "/images/avatars/adult.png";

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
          onPointerDown={(e) => {
            if (e.button === 0) {
              e.preventDefault();
              setFilterModalOpen(true);
            }
          }}
          onClick={(e) => {
            e.preventDefault();
            setFilterModalOpen(true);
          }}
          className="inline-block border border-sky-300 px-2 py-0.5 bg-sky-100/60 text-sky-900 rounded-[3.5rem_2rem_4rem_2.5rem_/_2rem_3.5rem_2.5rem_4rem] shadow-sm transform-gpu will-change-transform touch-manipulation -rotate-1 hover:rotate-0 transition-transform duration-300 cursor-pointer focus:outline-none"
        >
          {ageGroupLabel}
        </button>
        <span>speaking</span>
        <button 
          onPointerDown={(e) => {
            if (e.button === 0) {
              e.preventDefault();
              setFilterModalOpen(true);
            }
          }}
          onClick={(e) => {
            e.preventDefault();
            setFilterModalOpen(true);
          }}
          className="inline-block border border-amber-300 px-2 py-0.5 bg-amber-100/60 text-amber-900 rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem] shadow-sm transform-gpu will-change-transform touch-manipulation rotate-1 hover:rotate-0 transition-transform duration-300 cursor-pointer focus:outline-none"
        >
          {nativeLanguage === 'vi' ? 'Tiếng Việt' 
           : nativeLanguage === 'th' ? 'ภาษาไทย' 
           : nativeLanguage === 'id' ? 'Bahasa Indonesia' 
           : nativeLanguage === 'zh' ? 'Mandarin Chinese' 
           : nativeLanguage === 'hi' ? 'Hindi' 
           : nativeLanguage === 'ja' ? 'Japanese' 
           : nativeLanguage === 'es' ? 'Spanish' 
           : nativeLanguage === 'ar' ? 'Arabic' 
           : nativeLanguage === 'fr' ? 'French' 
           : nativeLanguage === 'ko' ? 'Korean' 
           : nativeLanguage === 'pt' ? 'Portuguese' 
           : nativeLanguage === 'ru' ? 'Russian' 
           : nativeLanguage === 'de' ? 'German' 
           : nativeLanguage === 'other' ? 'Other language' 
           : 'English'}
        </button>
        <span className="inline-flex items-center">
          <button
            onPointerDown={(e) => {
              if (e.button === 0) {
                e.preventDefault();
                setFilterModalOpen(true);
              }
            }}
            onClick={(e) => {
              e.preventDefault();
              setFilterModalOpen(true);
            }}
            className="ml-1 text-primary/40 hover:text-primary hover:rotate-90 transition-all duration-300 focus:outline-none cursor-pointer p-1 rounded-full hover:bg-primary/5"
            title="Change Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>
        </span>
      </div>

      {/* Subject Selector — between sentence and level */}
      <SubjectSelector subjects={(config?.subjects || []).map((s: any) => ({ id: s.id, label: s.label, icon: s.icon }))} config={config} />
    </div>
  );
}
