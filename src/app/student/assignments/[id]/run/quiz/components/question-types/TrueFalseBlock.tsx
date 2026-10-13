"use client";

import React from "react";
import { Check, X, CheckCircle2, User } from "lucide-react";
import { seedShuffle } from "../../utils/quizHelpers";

interface TrueFalseBlockProps {
  currentQuestion: any;
  currentQuestionData: any;
  userAnswer: any;
  isChecked: boolean;
  quizMode: "practice" | "autoplay";
  attemptSeed: string;
  handleAnswerChange: (q: any, val: any) => void;
}

export function TrueFalseBlock({
  currentQuestion,
  currentQuestionData,
  userAnswer,
  isChecked,
  quizMode,
  attemptSeed,
  handleAnswerChange,
}: TrueFalseBlockProps) {
  const options = seedShuffle([
    { 
      label: "True", 
      value: true,
      icon: (colorClass: string) => (
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110 shadow-sm ${colorClass}`}>
          <Check className="w-8 h-8" strokeWidth={4.5} />
        </div>
      )
    },
    { 
      label: "False", 
      value: false,
      icon: (colorClass: string) => (
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110 shadow-sm ${colorClass}`}>
          <X className="w-8 h-8" strokeWidth={4.5} />
        </div>
      )
    },
  ], `${attemptSeed}-${currentQuestion?.id}-tf`);

  return (
    <div className="grid grid-cols-2 gap-6 pt-4">
      {options.map((opt, i) => {
        const isSelected = userAnswer === opt.value;
        let isCorrectOpt = false;
        if (typeof currentQuestionData.isTrue === "boolean") {
          isCorrectOpt = currentQuestionData.isTrue === opt.value;
        } else if (Array.isArray(currentQuestionData.options)) {
          const matchedOpt = currentQuestionData.options.find((o: any) => {
            const normText = (o.text || "").toLowerCase().trim();
            return opt.value ? (normText === "true" || normText === "đúng" || normText === "yes") : (normText === "false" || normText === "sai" || normText === "no");
          });
          isCorrectOpt = !!matchedOpt?.isCorrect;
        }
        
        let btnStyle = "";
        let iconBgColor = "";
        
        if (isChecked) {
          if (isCorrectOpt) {
            btnStyle = "border-emerald-400 bg-emerald-100 text-emerald-900 shadow-md scale-[1.02]";
            iconBgColor = "bg-emerald-500 text-white";
          } else if (isSelected) {
            btnStyle = "border-rose-400 bg-rose-100 text-rose-900 shadow-md";
            iconBgColor = "bg-rose-500 text-white";
          } else {
            btnStyle = "border-slate-200 bg-slate-50 text-slate-400 opacity-60";
            iconBgColor = "bg-slate-200 text-slate-400";
          }
        } else if (isSelected) {
          if (opt.value) {
            btnStyle = "border-emerald-600 bg-emerald-500 text-white scale-[1.05] shadow-xl shadow-emerald-500/30 border-4 z-10 font-black";
            iconBgColor = "bg-white text-emerald-600 scale-110 shadow-md";
          } else {
            btnStyle = "border-rose-600 bg-rose-500 text-white scale-[1.05] shadow-xl shadow-rose-500/30 border-4 z-10 font-black";
            iconBgColor = "bg-white text-rose-600 scale-110 shadow-md";
          }
        } else {
          if (opt.value) {
            btnStyle = "border-emerald-250 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100/80 shadow-sm";
            iconBgColor = "bg-emerald-100 text-emerald-600";
          } else {
            btnStyle = "border-rose-250 bg-rose-50 text-rose-700 hover:border-rose-400 hover:bg-rose-100/80 shadow-sm";
            iconBgColor = "bg-rose-100 text-rose-600";
          }
        }
        
        return (
          <button
            key={i}
            disabled={isChecked}
            onClick={() => handleAnswerChange(currentQuestion, opt.value)}
            className={`relative group flex flex-col items-center justify-center py-6 px-4 rounded-[2.5rem] border-[3px] font-extrabold text-xl sm:text-2xl transition-all duration-350 ${btnStyle} ${!isChecked ? "hover:scale-[1.03] active:scale-95 cursor-pointer" : "cursor-default"}`}
            style={{ fontFamily: "'Quicksand', 'Nunito', sans-serif" }}
          >
            {/* Badge góc trên phải khi review */}
            {isChecked && (isCorrectOpt || isSelected) && (
              <div className="absolute top-3 right-3 flex flex-col items-end gap-1 z-10">
                {isCorrectOpt && quizMode !== "autoplay" && (
                  <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide bg-emerald-500 text-white pl-1.5 pr-2 py-0.5 rounded-full shadow-md border border-emerald-400">
                    <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> Correct
                  </span>
                )}
                {isSelected && !isCorrectOpt && (
                  <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide bg-rose-500 text-white pl-1.5 pr-2 py-0.5 rounded-full shadow-md border border-rose-400">
                    <User className="w-2.5 h-2.5 shrink-0" /> Yours
                  </span>
                )}
                {isSelected && isCorrectOpt && (
                  <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide bg-emerald-700 text-white pl-1.5 pr-2 py-0.5 rounded-full shadow-md border border-emerald-600">
                    <User className="w-2.5 h-2.5 shrink-0" /> Yours ✓
                  </span>
                )}
              </div>
            )}

            {opt.icon(iconBgColor)}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
export default TrueFalseBlock;
