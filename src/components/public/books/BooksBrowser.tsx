"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

const CEFR_LEVEL_CONFIG: Record<string, {
  label: string;
  badge: string;
  border: string;
  bgClosed: string;
  bgOpen: string;
  titleColor: string;
  tagBg: string;
  hoverGlow: string;
  accentIcon: string;
}> = {
  a1: {
    label: "For Kid 3-6 year and Beginner",
    badge: "bg-emerald-500 text-white shadow-sm shadow-emerald-200",
    border: "border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400",
    bgClosed: "bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white dark:from-emerald-950/20 dark:to-slate-800 hover:from-emerald-100/90 hover:to-teal-50/80",
    bgOpen: "bg-emerald-50/30 dark:bg-slate-800",
    titleColor: "text-emerald-900 dark:text-emerald-200",
    tagBg: "bg-emerald-100/90 text-emerald-800 border border-emerald-300/60 dark:bg-emerald-900/40 dark:text-emerald-300",
    hoverGlow: "hover:shadow-xl hover:shadow-emerald-500/10",
    accentIcon: "text-emerald-500",
  },
  a2: {
    label: "Elementary (A2)",
    badge: "bg-sky-500 text-white shadow-sm shadow-sky-200",
    border: "border-sky-200 dark:border-sky-800/50 hover:border-sky-400",
    bgClosed: "bg-gradient-to-r from-sky-50/80 via-blue-50/40 to-white dark:from-sky-950/20 dark:to-slate-800 hover:from-sky-100/90 hover:to-blue-50/80",
    bgOpen: "bg-sky-50/30 dark:bg-slate-800",
    titleColor: "text-sky-900 dark:text-sky-200",
    tagBg: "bg-sky-100/90 text-sky-800 border border-sky-300/60 dark:bg-sky-900/40 dark:text-sky-300",
    hoverGlow: "hover:shadow-xl hover:shadow-sky-500/10",
    accentIcon: "text-sky-500",
  },
  b1: {
    label: "Intermediate (B1)",
    badge: "bg-amber-500 text-white shadow-sm shadow-amber-200",
    border: "border-amber-200 dark:border-amber-800/50 hover:border-amber-400",
    bgClosed: "bg-gradient-to-r from-amber-50/80 via-yellow-50/40 to-white dark:from-amber-950/20 dark:to-slate-800 hover:from-amber-100/90 hover:to-yellow-50/80",
    bgOpen: "bg-amber-50/30 dark:bg-slate-800",
    titleColor: "text-amber-900 dark:text-amber-200",
    tagBg: "bg-amber-100/90 text-amber-800 border border-amber-300/60 dark:bg-amber-900/40 dark:text-amber-300",
    hoverGlow: "hover:shadow-xl hover:shadow-amber-500/10",
    accentIcon: "text-amber-500",
  },
  b2: {
    label: "Upper Intermediate (B2)",
    badge: "bg-orange-500 text-white shadow-sm shadow-orange-200",
    border: "border-orange-200 dark:border-orange-800/50 hover:border-orange-400",
    bgClosed: "bg-gradient-to-r from-orange-50/80 via-amber-50/40 to-white dark:from-orange-950/20 dark:to-slate-800 hover:from-orange-100/90 hover:to-amber-50/80",
    bgOpen: "bg-orange-50/30 dark:bg-slate-800",
    titleColor: "text-orange-900 dark:text-orange-200",
    tagBg: "bg-orange-100/90 text-orange-800 border border-orange-300/60 dark:bg-orange-900/40 dark:text-orange-300",
    hoverGlow: "hover:shadow-xl hover:shadow-orange-500/10",
    accentIcon: "text-orange-500",
  },
  c1: {
    label: "Advanced (C1)",
    badge: "bg-rose-500 text-white shadow-sm shadow-rose-200",
    border: "border-rose-200 dark:border-rose-800/50 hover:border-rose-400",
    bgClosed: "bg-gradient-to-r from-rose-50/80 via-pink-50/40 to-white dark:from-rose-950/20 dark:to-slate-800 hover:from-rose-100/90 hover:to-pink-50/80",
    bgOpen: "bg-rose-50/30 dark:bg-slate-800",
    titleColor: "text-rose-900 dark:text-rose-200",
    tagBg: "bg-rose-100/90 text-rose-800 border border-rose-300/60 dark:bg-rose-900/40 dark:text-rose-300",
    hoverGlow: "hover:shadow-xl hover:shadow-rose-500/10",
    accentIcon: "text-rose-500",
  },
};

const CEFR_ORDER = ["a1", "a2", "b1", "b2", "c1"];

interface BooksBrowserProps {
  itemsByLevel: Record<string, any[]>;   // pre-grouped: { a1: [...], a2: [], ... }
  loadingLevels?: string[];              // levels still being fetched
  initialLevel?: string;
}

function BookCard({ book }: { book: any }) {
  const coverSlide = book.slides?.[0];
  const coverUrl = book.thumbnailUrl || coverSlide?.imageUrl || "";
  const pageCount = book._count?.slides ?? book.slides?.length ?? 0;

  return (
    <Link
      href={`/student/books/${book.bookId}`}
      prefetch={true}
      className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/55 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group shadow-md"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-800">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={book.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700">
            menu_book
          </span>
        )}
        {/* Page count pill */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-1">
          <span className="material-symbols-outlined text-[11px]">auto_stories</span>
          <span>{pageCount} pages</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-grow flex flex-col justify-between">
        <h3 className="text-slate-800 dark:text-white font-black text-base line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {book.title}
        </h3>
        <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
          <span>Read &amp; shadow</span>
          <span className="flex items-center gap-0.5 text-amber-500">
            <span className="material-symbols-outlined text-xs">mic</span>
            <span>Pronunciation</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export function BooksBrowser({ itemsByLevel, loadingLevels = [], initialLevel = "a1" }: BooksBrowserProps) {
  const defaultLevel = useMemo(() => {
    return CEFR_ORDER.includes(initialLevel) ? initialLevel : "a1";
  }, [initialLevel]);

  const [openLevel, setOpenLevel] = useState<string>(defaultLevel);

  useEffect(() => {
    const handleOpenLevel = (e: any) => {
      const lvl = e.detail?.level;
      if (lvl && lvl !== "all" && CEFR_ORDER.includes(lvl)) setOpenLevel(lvl);
    };
    window.addEventListener("open-cefr-level", handleOpenLevel);
    return () => window.removeEventListener("open-cefr-level", handleOpenLevel);
  }, []);

  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({
    a1: 6, a2: 6, b1: 6, b2: 6, c1: 6,
  });

  const handleViewMore = (levelId: string) => {
    setVisibleCounts(prev => ({ ...prev, [levelId]: (prev[levelId] || 6) + 6 }));
  };

  return (
    <div className="w-full space-y-4">
      {CEFR_ORDER.map((levelId) => {
        const config = CEFR_LEVEL_CONFIG[levelId] || CEFR_LEVEL_CONFIG.a1;
        const levelBooks = itemsByLevel[levelId] || [];
        const isLoading = loadingLevels.includes(levelId);
        const isOpen = openLevel === levelId;
        const currentVisibleCount = visibleCounts[levelId] || 6;
        const displayedBooks = levelBooks.slice(0, currentVisibleCount);
        const hasMore = levelBooks.length > currentVisibleCount;
        const countLabel = isLoading && levelBooks.length === 0
          ? "..."
          : `${levelBooks.length} ${levelBooks.length === 1 ? "book" : "books"}`;

        return (
          <div
            key={levelId}
            id={`cefr-level-${levelId}`}
            className={`w-full group/accordion rounded-[28px] border-2 transition-all duration-300 ${config.border} ${config.hoverGlow} ${
              isOpen ? config.bgOpen : config.bgClosed
            }`}
          >
            {/* Header */}
            <button
              onClick={() => setOpenLevel(isOpen ? "" : levelId)}
              className="w-full flex items-center gap-2 sm:gap-3.5 px-3.5 sm:px-6 py-3.5 sm:py-4.5 cursor-pointer text-left focus:outline-none transition-transform duration-300 group-hover/accordion:-translate-y-0.5 min-w-0"
            >
              <span className={`shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-[11px] sm:text-xs font-black uppercase transition-transform duration-300 group-hover/accordion:scale-110 ${config.badge}`}>
                {levelId.toUpperCase()}
              </span>

              <div className="flex flex-col min-w-0 flex-1">
                <span className={`font-black text-[clamp(11px,3.2vw,18px)] sm:text-base md:text-lg leading-tight whitespace-nowrap overflow-hidden text-ellipsis transition-colors ${config.titleColor}`}>
                  {config.label}
                </span>
              </div>

              {!isOpen && (
                <span className={`shrink-0 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-black rounded-full transition-all duration-300 group-hover/accordion:scale-105 whitespace-nowrap ${config.tagBg} ${isLoading && levelBooks.length === 0 ? "animate-pulse" : ""}`}>
                  {countLabel}
                </span>
              )}

              <div className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-white/80 dark:bg-slate-700/80 border border-slate-200/60 dark:border-slate-600 shadow-sm transition-all duration-300 group-hover/accordion:bg-white group-hover/accordion:scale-110 ${isOpen ? "rotate-180 bg-white" : ""}`}>
                <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${config.accentIcon}`} />
              </div>
            </button>

            {/* Expanded content */}
            {isOpen && (
              <div className="px-6 pb-6 border-t border-slate-200/50 dark:border-slate-700/50 animate-in fade-in slide-in-from-top-2 duration-300">
                {isLoading && levelBooks.length === 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 pt-5">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-3 animate-pulse">
                        <div className="aspect-video w-full bg-slate-100 dark:bg-slate-700 rounded-2xl" />
                        <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-700 rounded-xl" />
                        <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-700 rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : displayedBooks.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 pt-5">
                      {displayedBooks.map((book) => (
                        <BookCard key={book.id} book={book} />
                      ))}
                    </div>
                    {hasMore && (
                      <div className="flex justify-center pt-8">
                        <button
                          onClick={() => handleViewMore(levelId)}
                          className="px-8 py-3 rounded-full text-xs font-black uppercase tracking-wider bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-200 hover:text-primary shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.03] active:scale-95"
                        >
                          View more ({levelBooks.length - currentVisibleCount} more)
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-8 text-center text-sm font-bold text-slate-400 dark:text-slate-500">
                    No books available for this level.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
