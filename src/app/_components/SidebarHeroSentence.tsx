"use client";

import { useContentStore } from "@/store/useContentStore";
import { useMemo } from "react";
import { Settings } from "lucide-react";

export function SidebarHeroSentence({ categoryTree }: { categoryTree: any[] }) {
  const userType = useContentStore(s => s.userType);
  const nativeLanguage = useContentStore(s => s.nativeLanguage);
  const selectedCategoryId = useContentStore(s => s.selectedCategoryId);
  const selectedSubCategoryId = useContentStore(s => s.selectedSubCategoryId);
  const setFilterModalOpen = useContentStore(s => (s as any).setFilterModalOpen);

  // Avatar lookup map for landing page summary
  const avatarMap: Record<string, { label: string; src: string }> = {
    kids: { label: "KID", src: "/images/avatars/kid.png" },
    teens: { label: "TEEN", src: "/images/avatars/teen.png" },
    adults: { label: "ADULT", src: "/images/avatars/adult.png" },
    business: { label: "BUSINESS", src: "/images/avatars/Business man.png" },
  };
  const activeAvatar = avatarMap[userType] || avatarMap.adults;

  const activeNames = useMemo(() => {
    let categoryName = "";
    let subCategoryName = "";
    
    if (selectedCategoryId) {
      const cat = categoryTree.find((c: any) => c.id === selectedCategoryId);
      if (cat) {
        categoryName = cat.nameEn || cat.nameVi || "";
        if (selectedSubCategoryId && cat.children) {
          const sub = cat.children.find((s: any) => s.id === selectedSubCategoryId);
          if (sub) {
            subCategoryName = sub.nameEn || sub.nameVi || "";
          }
        }
      }
    }
    return { categoryName, subCategoryName };
  }, [categoryTree, selectedCategoryId, selectedSubCategoryId]);

  return (
    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-left duration-1000">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5 text-xs md:text-sm font-headline font-bold text-primary leading-tight relative">
        <span>I'm a</span>
        <div className="flex flex-col items-center gap-0.5 shrink-0 px-0.5 mt-1">
          <div className="relative w-[24px] h-[24px] rounded-full overflow-hidden border-2 border-primary shadow-sm">
            <img 
              src={activeAvatar.src} 
              alt={activeAvatar.label} 
              className="w-full h-full object-cover" 
            />
          </div>
          <span className="text-[6px] font-black uppercase tracking-[0.1em] text-primary/70 leading-none mt-0.5">
            {activeAvatar.label}
          </span>
        </div>
        <span>speaking</span>
        <div className="inline-block border border-amber-300 px-2 py-0.5 bg-amber-100/60 text-amber-900 rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem] shadow-sm transform rotate-1 hover:rotate-0 transition-transform duration-300">
          {nativeLanguage === 'vi' ? 'Tiếng Việt' : nativeLanguage === 'th' ? 'ภาษาไทย' : nativeLanguage === 'id' ? 'Bahasa Indonesia' : 'English'}
        </div>
        <span>practicing</span>
        <div className="inline-block border border-emerald-300 px-2 py-0.5 bg-emerald-100/60 text-emerald-900 rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem] shadow-sm transform rotate-1 hover:rotate-0 transition-transform duration-300">
          {activeNames.categoryName || "Anything"}
        </div>
        <div className="inline-block border border-sky-300 px-2 py-0.5 bg-sky-100/60 text-sky-900 rounded-[3.5rem_2rem_4rem_2.5rem_/_2rem_3.5rem_2.5rem_4rem] shadow-sm transform -rotate-1 hover:rotate-0 transition-transform duration-300">
          {activeNames.subCategoryName || "All Topics"}
        </div>
        <button
          onClick={() => setFilterModalOpen(true)}
          className="ml-1 text-primary/40 hover:text-primary hover:rotate-90 transition-all duration-300 focus:outline-none cursor-pointer p-1 rounded-full hover:bg-primary/5"
          title="Change Preferences"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
