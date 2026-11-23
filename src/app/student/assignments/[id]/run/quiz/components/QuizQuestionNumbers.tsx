"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { getQuestionStatus } from "../utils/quizHelpers";

interface QuizQuestionNumbersProps {
  questions: any[];
  currentIndex: number;
  answers: any;
  checkedQuestions: Record<string, boolean>;
  isAutoRevealing: boolean;
  navigateTo: (index: number) => void;
}

export function QuizQuestionNumbers({
  questions = [],
  currentIndex,
  answers = {},
  checkedQuestions = {},
  isAutoRevealing,
  navigateTo,
}: QuizQuestionNumbersProps) {
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, questions.length]);

  useEffect(() => {
    if (activeBtnRef.current) {
      activeBtnRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
    const timer = setTimeout(checkScroll, 350);
    return () => clearTimeout(timer);
  }, [currentIndex, checkScroll]);

  if (!questions || questions.length === 0) return null;

  const splitTwoRows = questions.length > 8;
  const half = splitTwoRows ? Math.ceil(questions.length / 2) : questions.length;
  const row1 = questions.slice(0, half);
  const row2 = splitTwoRows ? questions.slice(half) : [];

  // When a row has > 15 items, use compact sizing so it fits neatly without clipping on desktop
  const isCompact = half > 15;
  const btnSizeClass = isCompact
    ? "w-7 h-7 sm:w-8 sm:h-8"
    : "w-8 h-8 sm:w-9 sm:h-9";
  const textSizeClass = isCompact
    ? "text-[11px] sm:text-xs"
    : "text-xs sm:text-sm";
  const rowGapClass = isCompact
    ? "gap-1 sm:gap-1.5"
    : "gap-1 sm:gap-2.5";

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -220, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 220, behavior: "smooth" });
    }
  };

  const renderQuestionButton = (q: any, i: number) => {
    const active = i === currentIndex;

    // Check answer status
    const ans = answers[q.id];
    let isAnswered = false;
    if (ans !== undefined && ans !== null) {
      if (Array.isArray(ans)) {
        isAnswered = ans.length > 0;
      } else if (typeof ans === "object") {
        isAnswered = Object.keys(ans).length > 0;
      } else {
        isAnswered = true;
      }
    }

    // Check if graded
    const isGraded = checkedQuestions[q.id];
    let status = "pending";
    if (isGraded) {
      status = getQuestionStatus(q, ans);
    }

    // Determine classes based on state
    let btnClass = "";

    if (isGraded) {
      if (status === "correct") {
        btnClass = active
          ? "bg-emerald-500 text-white ring-2 ring-emerald-300 shadow-md shadow-emerald-500/40 scale-105"
          : "bg-emerald-500 text-white border border-emerald-600 hover:bg-emerald-600";
      } else if (status === "incorrect") {
        btnClass = active
          ? "bg-rose-500 text-white ring-2 ring-rose-300 shadow-md shadow-rose-500/40 scale-105"
          : "bg-rose-500 text-white border border-rose-600 hover:bg-rose-600";
      } else {
        btnClass = active
          ? "bg-slate-500 text-white ring-2 ring-slate-300 shadow-md shadow-slate-500/40 scale-105"
          : "bg-white text-slate-400 border border-slate-300 border-dashed hover:bg-slate-50";
      }
    } else {
      if (active) {
        btnClass = "bg-orange-500 text-white shadow-lg shadow-orange-500/40 ring-2 ring-orange-300 scale-105 z-10";
      } else if (isAnswered) {
        btnClass = "bg-purple-500 border border-purple-600 text-white shadow-sm shadow-purple-500/20 hover:bg-purple-600";
      } else {
        btnClass = "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-purple-300 hover:text-purple-600 shadow-xs";
      }
    }

    return (
      <button
        key={q.id}
        ref={active ? activeBtnRef : null}
        onClick={() => navigateTo(i)}
        disabled={isAutoRevealing}
        className={`relative ${btnSizeClass} rounded-full transition-all duration-200 shrink-0 flex items-center justify-center cursor-pointer select-none ${btnClass}`}
        title={`Câu ${i + 1}`}
      >
        <span className={`font-black ${textSizeClass} leading-none`}>
          {i + 1}
        </span>
        {isGraded && !active && status === "correct" && (
          <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-100 rounded-full border border-emerald-500 flex items-center justify-center shadow-xs">
            <Check className="w-2.5 h-2.5 text-emerald-700 stroke-[3.5px]" />
          </div>
        )}
        {isGraded && !active && status === "incorrect" && (
          <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-100 rounded-full border border-rose-500 flex items-center justify-center shadow-xs">
            <X className="w-2.5 h-2.5 text-rose-700 stroke-[3.5px]" />
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="w-full mt-2.5 sm:mt-4 z-20 flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-2 animate-in fade-in-50 duration-300">
      {/* Nút lùi về trước (chỉ hiện khi có thể cuộn sang trái) */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={handleScrollLeft}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 dark:bg-slate-800/95 border-2 border-slate-200 dark:border-slate-700 shadow-md text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 active:scale-95 transition-all shrink-0 cursor-pointer"
          aria-label="Cuộn sang trái"
          title="Xem các câu hỏi trước"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}

      {/* Khung chứa các nút số câu hỏi */}
      <div
        ref={scrollContainerRef}
        className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-2 border-white/90 dark:border-slate-700/80 shadow-xl shadow-slate-900/10 rounded-[2rem] ${
          isCompact ? "px-2.5 sm:px-4 py-1.5 sm:py-2" : "px-3 sm:px-5 py-2 sm:py-2.5"
        } max-w-full overflow-x-auto no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`}
      >
        <div className="w-max min-w-full flex flex-col gap-1 sm:gap-1.5 items-center">
          {/* Hàng 1: Từ trái qua phải */}
          <div className={`flex items-center ${rowGapClass} flex-nowrap justify-start sm:justify-center min-w-full px-1`}>
            {row1.map((q, idx) => renderQuestionButton(q, idx))}
          </div>

          {/* Hàng 2: Từ trái qua phải */}
          {row2.length > 0 && (
            <div className={`flex items-center ${rowGapClass} flex-nowrap justify-start sm:justify-center min-w-full px-1`}>
              {row2.map((q, idx) => renderQuestionButton(q, half + idx))}
            </div>
          )}
        </div>
      </div>

      {/* Nút tiến về sau (chỉ hiện khi có thể cuộn sang phải) */}
      {canScrollRight && (
        <button
          type="button"
          onClick={handleScrollRight}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 dark:bg-slate-800/95 border-2 border-slate-200 dark:border-slate-700 shadow-md text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 active:scale-95 transition-all shrink-0 cursor-pointer animate-pulse hover:animate-none"
          aria-label="Cuộn sang phải"
          title="Xem các câu hỏi tiếp theo"
        >
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
}
export default QuizQuestionNumbers;
