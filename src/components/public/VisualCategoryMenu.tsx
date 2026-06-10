"use client"
import React, { useMemo } from "react";
import { useLocale } from "next-intl";
import { 
  BookOpen, 
  Calculator, 
  Globe, 
  Atom, 
  Palette, 
  Sparkles 
} from "lucide-react";

interface Category {
  id: string;
  nameVi: string;
  nameEn: string;
  children?: Category[];
}

interface Props {
  categoryTree: Category[];
  activeCategoryId: string;
  activeSubCategoryId: string;
  onSelectCategory: (id: string) => void;
  onSelectSubCategory: (id: string) => void;
}

export function VisualCategoryMenu({ 
  categoryTree, 
  activeCategoryId, 
  activeSubCategoryId, 
  onSelectCategory, 
  onSelectSubCategory 
}: Props) {
  const locale = useLocale();

  const activeCategory = useMemo(() => {
    return categoryTree.find(cat => cat.id === activeCategoryId);
  }, [categoryTree, activeCategoryId]);

  const solarpunkStyles = [
    { icon: "/images/english.png", color: "text-emerald-900", bg: "bg-emerald-100", border: "border-emerald-300", iconBg: "bg-emerald-200", shadow: "shadow-emerald-900/10" },
    { icon: "/images/math.png", color: "text-orange-900", bg: "bg-orange-100", border: "border-orange-300", iconBg: "bg-orange-200", shadow: "shadow-orange-900/10" },
    { icon: "/images/global.png", color: "text-sky-900", bg: "bg-sky-100", border: "border-sky-300", iconBg: "bg-sky-200", shadow: "shadow-sky-900/10" },
    { icon: Atom, color: "text-purple-900", bg: "bg-purple-100", border: "border-purple-300", iconBg: "bg-purple-200", shadow: "shadow-purple-900/10" },
    { icon: Palette, color: "text-rose-900", bg: "bg-rose-100", border: "border-rose-300", iconBg: "bg-rose-200", shadow: "shadow-rose-900/10" },
    { icon: Sparkles, color: "text-amber-900", bg: "bg-amber-100", border: "border-amber-300", iconBg: "bg-amber-200", shadow: "shadow-amber-900/10" },
  ];

  const getStyleByName = (name: string | undefined | null, index: number) => {
    const n = (name || "").toLowerCase();
    if (n.includes("anh") || n.includes("english")) return solarpunkStyles[0];
    if (n.includes("toán") || n.includes("math")) return solarpunkStyles[1];
    if (n.includes("global") || n.includes("xã hội")) return solarpunkStyles[2];
    if (n.includes("khoa học") || n.includes("science")) return solarpunkStyles[3];
    if (n.includes("nghệ thuật") || n.includes("art")) return solarpunkStyles[4];
    return solarpunkStyles[index % solarpunkStyles.length];
  };

  const blobShapes = [
    "rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem]",
    "rounded-[3.5rem_2rem_4rem_2.5rem_/_2rem_3.5rem_2.5rem_4rem]",
    "rounded-[2.5rem_4.5rem_3rem_4rem_/_4rem_3rem_4.5rem_2.5rem]",
    "rounded-[4rem_2.5rem_4rem_3rem_/_2.5rem_4.5rem_3rem_4.5rem]",
    "rounded-[3rem_4rem_2.5rem_4.5rem_/_4.5rem_2.5rem_4.5rem_3rem]",
  ];

  return (
    <div className="w-full animate-in fade-in slide-in-from-top-4 duration-1000 ease-out">
      {/* Level 1: Main Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 p-6 category-grid">
        {categoryTree.map((cat, idx) => {
          const isActive = activeCategoryId === cat.id;
          const displayName = (locale === "vi" ? (cat.nameVi || cat.nameEn) : (cat.nameEn || cat.nameVi)) || "";
          const style = getStyleByName(displayName, idx);
          const blobShape = blobShapes[idx % blobShapes.length];
          const Icon = style.icon;
          
          return (
            <button
              key={cat.id}
              onClick={() => {
                const updateState = () => {
                  if (isActive) {
                    onSelectCategory("");
                  } else {
                    onSelectCategory(cat.id);
                  }
                };

                updateState();
              }}
              className={`group relative h-24 md:h-28 ${blobShape} p-6 transition-all duration-700 flex flex-col items-center justify-center gap-2 border-[3px] shadow-xl category-btn ${
                isActive 
                  ? `${style.bg} ${style.border} scale-[1.08] shadow-2xl z-20 animate-solar-pulse` 
                  : `${style.bg} ${style.border} hover:scale-[1.05] ${style.shadow}`
              }`}
            >
              {/* Category Icon 'Nổi' on the edge */}
              <div className={`absolute -top-5 -left-4 rounded-2xl shadow-lg transition-all duration-700 flex items-center justify-center w-14 h-14 category-btn-icon ${style.iconBg} ${style.color} ${isActive ? "scale-110 -rotate-6 shadow-xl" : "group-hover:scale-110 group-hover:-rotate-12"}`}>
                {typeof Icon === "string" ? (
                  <img src={Icon} alt={displayName} className="w-10 h-10 object-contain drop-shadow-sm" />
                ) : (
                  <Icon size={36} strokeWidth={2.5} />
                )}
              </div>

              <div className={`relative z-10 font-headline font-black text-lg md:text-xl tracking-tight transition-all duration-500 category-btn-text ${isActive ? style.color + " scale-105" : "text-foreground/80"}`}>
                {displayName}
              </div>
              
              {isActive && (
                <div className={`relative z-10 w-8 h-1.5 bg-current opacity-20 rounded-full blur-[1px] ${style.color}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Level 2: Sub-category Pills */}
      <div 
        className={`grid transition-all duration-1000 ease-in-out ${
          activeCategory && activeCategory.children && activeCategory.children.length > 0 
            ? "grid-rows-[1fr] opacity-100 translate-y-0" 
            : "grid-rows-[0fr] opacity-0 -translate-y-6 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <div 
            className="flex flex-wrap items-center justify-start gap-4 py-4 px-4 transition-all duration-1000 sub-category-pills"
          >
            {activeCategory?.children?.map((sub, idx) => {
              const isSubActive = activeSubCategoryId === sub.id;
              const subDisplayName = (locale === "vi" ? (sub.nameVi || sub.nameEn) : (sub.nameEn || sub.nameVi)) || "";
              const blobShape = blobShapes[(idx + 2) % blobShapes.length]; // Offset to vary shapes
              
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    const newSubId = isSubActive ? "" : sub.id;
                    onSelectSubCategory(newSubId);
                  }}
                  className={`px-8 py-3 ${blobShape} text-xs font-black transition-all duration-500 border-2 uppercase tracking-[0.1em] shadow-sm hover:scale-110 active:scale-95 sub-category-btn ${
                    isSubActive
                      ? "bg-primary border-primary text-on-primary shadow-xl shadow-primary/30 scale-105"
                      : "bg-white border-primary/10 text-primary/60 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {subDisplayName}
                </button>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
