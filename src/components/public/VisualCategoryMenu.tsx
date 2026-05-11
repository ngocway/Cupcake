"use client"
import React, { useMemo } from "react";
import { useContentStore } from "@/store/useContentStore";
import { ChevronRight, Sparkles } from "lucide-react";

interface Category {
  id: string;
  name: string;
  children?: Category[];
}

interface Props {
  categoryTree: Category[];
}

export function VisualCategoryMenu({ categoryTree }: Props) {
  const { 
    selectedCategoryId, setSelectedCategoryId,
    selectedSubCategoryId, setSelectedSubCategoryId 
  } = useContentStore();

  const activeCategory = useMemo(() => {
    return categoryTree.find(cat => cat.id === selectedCategoryId);
  }, [categoryTree, selectedCategoryId]);

  const level1Gradients = [
    "from-pink-100 to-rose-200 text-rose-950 shadow-rose-100/50",
    "from-orange-100 to-amber-200 text-amber-950 shadow-amber-100/50",
    "from-purple-100 to-indigo-200 text-indigo-950 shadow-indigo-100/50",
    "from-emerald-100 to-teal-200 text-teal-950 shadow-teal-100/50",
    "from-blue-100 to-sky-200 text-sky-950 shadow-sky-100/50",
  ];

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* Level 1: Main Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 px-4">
        {categoryTree.map((cat, idx) => {
          const isActive = selectedCategoryId === cat.id;
          const gradient = level1Gradients[idx % level1Gradients.length];
          
          return (
            <button
              key={cat.id}
              onClick={() => {
                if (isActive) {
                  setSelectedCategoryId("");
                  setSelectedSubCategoryId("");
                } else {
                  setSelectedCategoryId(cat.id);
                  setSelectedSubCategoryId(""); // Reset sub when changing main
                }
              }}
              className={`group relative h-28 md:h-32 rounded-3xl p-6 transition-all duration-500 overflow-hidden flex flex-col items-center justify-center gap-3 border-2 ${
                isActive 
                  ? `bg-gradient-to-br ${gradient} border-white scale-105 shadow-2xl z-10` 
                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/20 hover:scale-[1.02] shadow-magazine-shadow"
              }`}
            >
              {/* Background Glow for active state */}
              {isActive && (
                <div className="absolute inset-0 bg-white/20 blur-xl scale-150 animate-pulse" />
              )}
              
              <div className={`relative z-10 font-headline font-black text-xl md:text-2xl tracking-tight transition-colors ${isActive ? "text-inherit" : "text-slate-800 dark:text-slate-100"}`}>
                {cat.name}
              </div>
              
              {isActive && (
                <div className="relative z-10 w-6 h-1 bg-current rounded-full opacity-50" />
              )}

              {/* Decorative Icon */}
              <div className={`absolute -right-2 -bottom-2 opacity-10 transition-transform duration-700 group-hover:scale-125 group-hover:-rotate-12 ${isActive ? "scale-110" : ""}`}>
                 <Sparkles className="w-16 h-16" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Level 2: Sub-category Pills with Smooth Slide Down Effect */}
      <div 
        className={`grid transition-all duration-700 ease-in-out ${
          activeCategory && activeCategory.children && activeCategory.children.length > 0 
            ? "grid-rows-[1fr] opacity-100 translate-y-0" 
            : "grid-rows-[0fr] opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <div 
            key={activeCategory?.id}
            className="flex flex-wrap items-center justify-start gap-4 py-8 px-6 animate-in fade-in slide-in-from-top-8 duration-1000"
          >
            {activeCategory?.children?.map((sub) => {
              const isSubActive = selectedSubCategoryId === sub.id;
              
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    setSelectedSubCategoryId(isSubActive ? "" : sub.id);
                  }}
                  className={`px-8 py-3.5 rounded-[2rem] text-sm font-black transition-all duration-500 border-2 uppercase tracking-wider shadow-sm hover:scale-105 active:scale-95 ${
                    isSubActive
                      ? "bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-200 scale-105"
                      : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-sky-300 hover:text-sky-600"
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
