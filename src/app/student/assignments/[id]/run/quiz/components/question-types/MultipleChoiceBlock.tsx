"use client";

import React, { useMemo } from "react";
import { Check, CheckCircle2, XCircle } from "lucide-react";

interface MultipleChoiceBlockProps {
  currentQuestion: any;
  options: any[];
  userAnswer: any;
  isChecked: boolean;
  isMultiSelect: boolean;
  quizMode: "practice" | "autoplay";
  handleAnswerChange: (q: any, val: any) => void;
}

const solarpunkStyles = [
  { 
    color: "text-emerald-900", bg: "bg-emerald-100", border: "border-emerald-300", iconBg: "bg-emerald-200", shadow: "shadow-emerald-900/10",
    selectedBg: "bg-emerald-500", selectedBorder: "border-emerald-600", selectedColor: "text-white", selectedIconBg: "bg-white", selectedIconColor: "text-emerald-600", selectedShadow: "shadow-emerald-500/40"
  },
  { 
    color: "text-orange-900", bg: "bg-orange-100", border: "border-orange-300", iconBg: "bg-orange-200", shadow: "shadow-orange-900/10",
    selectedBg: "bg-orange-500", selectedBorder: "border-orange-600", selectedColor: "text-white", selectedIconBg: "bg-white", selectedIconColor: "text-orange-600", selectedShadow: "shadow-orange-500/40"
  },
  { 
    color: "text-sky-900", bg: "bg-sky-100", border: "border-sky-300", iconBg: "bg-sky-200", shadow: "shadow-sky-900/10",
    selectedBg: "bg-sky-500", selectedBorder: "border-sky-600", selectedColor: "text-white", selectedIconBg: "bg-white", selectedIconColor: "text-sky-600", selectedShadow: "shadow-sky-500/40"
  },
  { 
    color: "text-purple-900", bg: "bg-purple-100", border: "border-purple-300", iconBg: "bg-purple-200", shadow: "shadow-purple-900/10",
    selectedBg: "bg-purple-500", selectedBorder: "border-purple-600", selectedColor: "text-white", selectedIconBg: "bg-white", selectedIconColor: "text-purple-600", selectedShadow: "shadow-purple-500/40"
  },
  { 
    color: "text-rose-900", bg: "bg-rose-100", border: "border-rose-300", iconBg: "bg-rose-200", shadow: "shadow-rose-900/10",
    selectedBg: "bg-rose-500", selectedBorder: "border-rose-600", selectedColor: "text-white", selectedIconBg: "bg-white", selectedIconColor: "text-rose-600", selectedShadow: "shadow-rose-500/40"
  },
];

const blobShapes = [
  "rounded-[1.75rem_2.5rem_1.75rem_3rem_/_2.5rem_1.75rem_3rem_2rem]",
  "rounded-[2.5rem_1.75rem_3rem_2rem_/_1.75rem_2.5rem_2rem_3rem]",
  "rounded-[2rem_3rem_2.25rem_3rem_/_3rem_2.25rem_3rem_2rem]",
  "rounded-[3rem_2rem_3rem_2.25rem_/_2rem_3rem_2.25rem_3rem]",
  "rounded-[2.25rem_3rem_2rem_3rem_/_3rem_2rem_3rem_2.25rem]",
];

export function MultipleChoiceBlock({
  currentQuestion,
  options = [],
  userAnswer,
  isChecked,
  isMultiSelect,
  quizMode,
  handleAnswerChange,
}: MultipleChoiceBlockProps) {
  // Dynamically analyze text length to pick the most ergonomic mobile & desktop grid layout
  const { isShort, isMedium, gridLayoutClass } = useMemo(() => {
    const maxLen = options.reduce((max, opt) => {
      const len = String(opt?.text || "").trim().length;
      return Math.max(max, len);
    }, 0);

    const short = maxLen <= 18;
    const medium = maxLen <= 40;

    let gridClass = "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 pt-2 w-full max-w-2xl mx-auto";
    if (short) {
      // 2 columns on Mobile AND Desktop (2x2 grid)
      gridClass = "grid grid-cols-2 gap-2.5 sm:gap-5 pt-1.5 w-full max-w-xl mx-auto";
    } else if (!medium) {
      // Very long sentences: 1 column on all screens
      gridClass = "grid grid-cols-1 gap-3 sm:gap-4 pt-2 w-full max-w-2xl mx-auto";
    }

    return { isShort: short, isMedium: medium, gridLayoutClass: gridClass };
  }, [options]);

  return (
    <div className={gridLayoutClass}>
      {options.map((option: any, i: number) => {
        const optionVal = option.originalIndex !== undefined ? option.originalIndex : i;
        const isSelected = isMultiSelect
          ? Array.isArray(userAnswer) && userAnswer.includes(optionVal)
          : userAnswer === optionVal;
        const isCorrectOpt = option.isCorrect;

        const theme = solarpunkStyles[i % solarpunkStyles.length];
        const blobShape = blobShapes[i % blobShapes.length];

        let containerClass = `${theme.bg} ${theme.border} ${theme.shadow}`;
        let textClass = theme.color;
        let iconClass = `${theme.iconBg} ${theme.color}`;

        if (isChecked) {
          if (isCorrectOpt) {
            containerClass = `bg-emerald-100 border-emerald-400 shadow-emerald-900/10 ${quizMode === "autoplay" ? "" : "scale-[1.02]"}`;
            textClass = "text-emerald-900";
            iconClass = "bg-emerald-500 text-white";
          } else if (isSelected) {
            containerClass = "bg-rose-100 border-rose-400 shadow-rose-900/10";
            textClass = "text-rose-900";
            iconClass = "bg-rose-500 text-white";
          } else {
            containerClass = "bg-slate-50 border-slate-200 opacity-60";
            textClass = "text-slate-500";
            iconClass = "bg-slate-200 text-slate-500";
          }
        } else if (isSelected) {
          containerClass = `${theme.selectedBg} ${theme.selectedBorder} scale-[1.03] shadow-xl ${theme.selectedShadow} z-10 animate-solar-pulse border-4`;
          textClass = theme.selectedColor;
          iconClass = `${theme.selectedIconBg} ${theme.selectedIconColor} scale-110 -rotate-6 shadow-md`;
        }

        const btnHeightAndPadding = isShort
          ? "min-h-[3.75rem] sm:min-h-[4.75rem] py-2.5 sm:py-3.5 px-3 sm:px-5"
          : "min-h-[4.25rem] sm:min-h-[5.25rem] py-3.5 sm:py-4 px-4 sm:px-6";

        const badgeDimensions = isShort
          ? "-top-2.5 -left-1.5 sm:-top-3 sm:-left-2 w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm font-[900]"
          : "-top-3 -left-2 sm:-top-3.5 sm:-left-2.5 w-8 h-8 sm:w-9 sm:h-9 text-sm sm:text-base font-[900]";

        const textFontSize = isShort
          ? "text-[clamp(0.95rem,2.2dvh,1.15rem)] font-[800]"
          : "text-[clamp(0.95rem,2.2dvh,1.15rem)] font-[800]";

        return (
          <button
            key={i}
            disabled={isChecked}
            onClick={() => handleAnswerChange(currentQuestion, optionVal)}
            className={`group relative w-full ${blobShape} ${btnHeightAndPadding} transition-all duration-500 flex flex-col items-center justify-center border-[3px] shadow-md cursor-pointer ${containerClass} ${!isChecked && !isSelected ? "hover:scale-[1.02]" : ""}`}
            style={{ fontFamily: "'Quicksand', 'Nunito', sans-serif" }}
          >
            {/* Floating Badge (A, B, C, D) */}
            <div className={`absolute rounded-full shadow-md transition-all duration-500 flex items-center justify-center ${badgeDimensions} ${iconClass} ${!isChecked && !isSelected ? "group-hover:scale-110 group-hover:-rotate-12" : ""}`}>
              {isMultiSelect
                ? <Check className={`w-4 h-4 sm:w-5 sm:h-5 transition-all ${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50"}`} strokeWidth={4} />
                : String.fromCharCode(65 + i)}
            </div>

            <span className={`relative z-10 ${textFontSize} tracking-tight transition-all duration-500 ${textClass} text-center flex items-center justify-center gap-1.5 leading-snug break-words max-w-full`}>
              {option.text}
              {isChecked && isCorrectOpt && <CheckCircle2 className="w-[1.2em] h-[1.2em] text-emerald-600 shrink-0 ml-1" />}
              {isChecked && isSelected && !isCorrectOpt && <XCircle className="w-[1.2em] h-[1.2em] text-rose-600 shrink-0 ml-1" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
export default MultipleChoiceBlock;
