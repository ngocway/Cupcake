"use client";

import { useContentStore } from "@/store/useContentStore";
import { updateAllPreferences } from "@/actions/user-preferences-actions";
import { getBestAgeGroupForSubject } from "@/lib/user-preferences-utils";
import { useRouter } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { SidebarContentTypeMenu } from "./SidebarContentTypeMenu";

interface SubjectConfig {
  id: string;
  label: string;
  icon?: string;
}

interface Props {
  subjects: SubjectConfig[];
  config: any;
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

export function SubjectSelector({ subjects, config }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("english_menu_open");
    if (saved !== null) {
      setIsMenuOpen(saved === "true");
    }
  }, []);

  const toggleMenu = () => {
    const next = !isMenuOpen;
    setIsMenuOpen(next);
    localStorage.setItem("english_menu_open", String(next));
    window.dispatchEvent(new CustomEvent("toggle-english-menu", { detail: { open: next } }));
  };

  const studySubject = useContentStore(s => (s as any).studySubject);
  const setStudySubject = useContentStore(s => (s as any).setStudySubject);
  const studyAgeGroup = useContentStore(s => (s as any).studyAgeGroup);
  const setStudyAgeGroup = useContentStore(s => (s as any).setStudyAgeGroup);
  const studyLevel = useContentStore(s => (s as any).studyLevel);
  const setStudyLevel = useContentStore(s => (s as any).setStudyLevel);
  const userType = useContentStore(s => s.userType);

  const handleSelect = (subjectId: string) => {
    if (subjectId === studySubject) return;

    // Resolve matching age group for the new subject
    const newAgeGroup = getBestAgeGroupForSubject(subjectId, userType, studyAgeGroup, config);

    // 1. Update store instantly (optimistic)
    setStudySubject(subjectId);
    setStudyAgeGroup(newAgeGroup);
    setStudyLevel(""); // Reset level — new subject has different levels

    // 2. Set cookies client-side immediately
    document.cookie = `study_subject=${subjectId}; path=/; max-age=31536000; samesite=lax`;
    document.cookie = `study_age_group=${newAgeGroup}; path=/; max-age=31536000; samesite=lax`;
    document.cookie = `study_level=; path=/; max-age=31536000; samesite=lax`;

    // 3. Fire-and-forget DB update
    updateAllPreferences({ 
      studySubject: subjectId, 
      studyAgeGroup: newAgeGroup,
      studyLevel: "" 
    }).catch(console.error);

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

  const locale = useLocale();

  return (
    <div className="animate-in fade-in slide-in-from-left duration-700">
      <p className="cefr-redesign-section-label" style={{ marginBottom: "8px" }}>
        {locale === "vi" ? "Môn học" : "Subject"}
      </p>
      <div className="cefr-redesign-subject-list">
        {subjects.map((subject) => {
          const isActive = studySubject === subject.id;
          const isLocked = subject.id === "math" || subject.id === "global";

          let displayLabel = subject.label;
          let iconUrl = "/images/english.png";
          let activeClass = "";

          if (subject.id === "english") {
            displayLabel = locale === "vi" ? "Tiếng Anh" : "English";
            iconUrl = "/images/english.png";
            activeClass = isActive 
              ? "bg-[#12A375] text-white border-[#12A375] shadow-md shadow-emerald-500/25 scale-[1.02]" 
              : "bg-white border-[#F0E2BF] text-[#3E3524] hover:bg-[#DEF4EA] hover:border-[#12A375] hover:text-[#0B7A58]";
          } else if (subject.id === "math") {
            displayLabel = locale === "vi" ? "Toán" : "Math";
            iconUrl = "/images/math.png";
            activeClass = "bg-white border-[#F0E2BF] text-[#8C826D] opacity-85 cursor-not-allowed";
          } else if (subject.id === "global") {
            displayLabel = locale === "vi" ? "Khoa học & TG" : "Global & Science";
            iconUrl = "/images/global.png";
            activeClass = "bg-white border-[#F0E2BF] text-[#8C826D] opacity-85 cursor-not-allowed";
          }

          return (
            <div key={subject.id} className="flex flex-col w-full">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (!isLocked) {
                    if (isActive) {
                      toggleMenu();
                    } else {
                      handleSelect(subject.id);
                      setIsMenuOpen(true);
                      localStorage.setItem("english_menu_open", "true");
                      window.dispatchEvent(new CustomEvent("toggle-english-menu", { detail: { open: true } }));
                    }
                  }
                }}
                disabled={isPending || isLocked}
                className={`group flex items-center gap-3.5 px-4 py-2.5 rounded-[16px] border-2 font-black text-sm tracking-wide transition-all duration-300 w-full cursor-pointer ${activeClass}`}
              >
                {isActive && isPending ? (
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <img
                    src={iconUrl}
                    alt={displayLabel}
                    className="w-6 h-6 object-contain shrink-0 transition-transform duration-300 group-hover:scale-110"
                  />
                )}
                <span className="font-headline font-bold">{displayLabel}</span>
                {isLocked ? (
                  <span className="material-symbols-rounded lock ml-auto text-slate-400 font-normal">lock</span>
                ) : (
                  subject.id === "english" && (
                    <span className={`material-symbols-rounded ml-auto font-normal transition-transform duration-300 ${isMenuOpen ? "rotate-180" : ""}`}>
                      expand_more
                    </span>
                  )
                )}
              </button>

              {/* Nested Collapsible Submenu (Thụt lề) */}
              <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isActive && isMenuOpen ? "max-h-[1200px] opacity-100 mt-2" : "max-h-0 opacity-0 pointer-events-none"}`}>
                <div className="ml-1.5 p-2">
                  <SidebarContentTypeMenu />
                </div>
              </div>

              {/* Collapsed state mini-preview icons */}
              {!isMenuOpen && isActive && subject.id === "english" && (
                <div className="flex gap-3 px-3 py-2 bg-white/60 rounded-[16px] border border-[#F0E2BF] w-full items-center justify-center animate-in fade-in duration-300 mt-1 cursor-pointer hover:bg-white transition-all shadow-xs" onClick={toggleMenu}>
                  <span className="material-symbols-rounded text-base text-[#0B7A58] opacity-75">import_contacts</span>
                  <span className="material-symbols-rounded text-base text-[#7B5CFA] opacity-75">style</span>
                  <span className="material-symbols-rounded text-base text-[#FF6F96] opacity-75">sports_esports</span>
                  <span className="material-symbols-rounded text-base text-[#3FA9F5] opacity-75">edit_note</span>
                  <span className="material-symbols-rounded text-base text-[#FF9F43] opacity-75">auto_stories</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
