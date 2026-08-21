"use client";

import { useContentStore } from "@/store/useContentStore";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { Lock } from "lucide-react";

export function MobileContentTypeMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const studyAgeGroup = useContentStore((s) => (s as any).studyAgeGroup) || "";
  const activeTabStore = useContentStore((s) => (s as any).activeTab) || "flashcards";
  const setActiveTab = useContentStore((s) => (s as any).setActiveTab);

  const isKindergarten = useMemo(() => {
    const ag = studyAgeGroup.toLowerCase();
    return ag.includes("kindergarten") || ag.includes("kindergarden") || ag === "kids-2-5" || ag === "kindergarten (< 6 years)";
  }, [studyAgeGroup]);

  // Determine active tab from URL path or Zustand store
  const activeTab = useMemo(() => {
    if (pathname.includes("/exercises") || pathname.includes("/grammar")) return "exercises";
    if (pathname.includes("/lessons") || pathname.includes("/books") || pathname.includes("/public/lessons")) return "lessons";
    if (pathname.includes("/flashcards") || pathname.includes("/student/flashcards")) return "flashcards";
    if (pathname.includes("/shadowing")) return "shadowing";
    if (pathname.includes("/game")) return "games";
    
    // On home page or default
    return searchParams.get("tab") || activeTabStore;
  }, [pathname, searchParams, activeTabStore]);

  const checkAndRequireOnboarding = useContentStore((s) => (s as any).checkAndRequireOnboarding);
  const setFilterModalOpen = useContentStore((s) => (s as any).setFilterModalOpen);

  const isTabLocked = (tabId: string) => {
    return isKindergarten && (tabId === "lessons" || tabId === "exercises" || tabId === "shadowing");
  };

  const handleSelectTab = (tabId: string) => {
    if ((tabId === "lessons" || tabId === "exercises" || tabId === "shadowing") && !studyAgeGroup) {
      if (checkAndRequireOnboarding) {
        checkAndRequireOnboarding(() => {
          setActiveTab(tabId);
          if (pathname !== "/") {
            router.push(`/?tab=${tabId}`, { scroll: false });
          } else {
            const p = new URLSearchParams(window.location.search);
            p.set("tab", tabId);
            history.replaceState(null, "", `?${p.toString()}`);
          }
        });
      } else if (setFilterModalOpen) {
        setFilterModalOpen(true);
      }
      return;
    }

    if (isTabLocked(tabId)) return;

    setActiveTab(tabId);
    if (pathname !== "/") {
      router.push(`/?tab=${tabId}`, { scroll: false });
    } else {
      const p = new URLSearchParams(window.location.search);
      p.set("tab", tabId);
      history.replaceState(null, "", `?${p.toString()}`);
    }
  };

  const items = [
    {
      id: "flashcards",
      label: locale === "vi" ? "Flashcards" : "Flashcards",
      icon: "layers",
      bgClass: "bg-[#DFD7FC] text-[#5A3EDB] border-[#7B5CFA]",
      activeStyle: "border-[#7B5CFA] ring-2 ring-[#7B5CFA]/40 shadow-md scale-[1.03]",
    },
    {
      id: "games",
      label: locale === "vi" ? "Trò chơi" : "Games",
      icon: "sports_esports",
      bgClass: "bg-[#FCD5DF] text-[#D9436C] border-[#FF6F96]",
      activeStyle: "border-[#FF6F96] ring-2 ring-[#FF6F96]/40 shadow-md scale-[1.03]",
    },
    {
      id: "lessons",
      label: locale === "vi" ? "Bài đọc" : "Reading",
      icon: "menu_book",
      bgClass: "bg-[#C4EFE0] text-[#0B7A58] border-[#0B7A58]",
      activeStyle: "border-[#0B7A58] ring-2 ring-[#0B7A58]/40 shadow-md scale-[1.03]",
    },
    {
      id: "exercises",
      label: locale === "vi" ? "Ngữ pháp" : "Grammar",
      icon: "quiz",
      bgClass: "bg-[#CFE9FC] text-[#1C7FC2] border-[#3FA9F5]",
      activeStyle: "border-[#3FA9F5] ring-2 ring-[#3FA9F5]/40 shadow-md scale-[1.03]",
    },
    {
      id: "shadowing",
      label: locale === "vi" ? "Shadowing" : "Shadowing",
      icon: "auto_stories",
      bgClass: "bg-[#FFE0CC] text-[#E26D33] border-[#E26D33]",
      activeStyle: "border-[#E26D33] ring-2 ring-[#E26D33]/40 shadow-md scale-[1.03]",
    },
  ];

  return (
    <div className="w-full lg:hidden block px-4 pt-1 pb-0 select-none">
      {/* Scrollable Horizontal Bar */}
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const locked = isTabLocked(item.id);

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              disabled={locked}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border-2 transition-all duration-300 shrink-0 font-extrabold text-xs cursor-pointer ${
                item.bgClass
              } ${isActive ? item.activeStyle : "border-transparent opacity-85 hover:opacity-100"}`}
            >
              <span className="material-symbols-rounded !text-[20px] shrink-0">
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
              {locked && <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
