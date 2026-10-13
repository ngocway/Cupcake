"use client";

import React from "react";

interface ClozeTestBlockProps {
  q: any;
  questionData: any;
  userAnswer: any;
  isChecked: boolean;
  handleAnswerChange: (q: any, value: any) => void;
}

export function ClozeTestBlock({
  q,
  questionData,
  userAnswer,
  isChecked,
  handleAnswerChange,
}: ClozeTestBlockProps) {
  const textWithBlanks = questionData.textWithBlanks || questionData.questionText || "";
  const parts = textWithBlanks.split(/(\{\{.*?\}\})/g);
  let blankIndex = 0;

  return (
    <div className="w-full p-6 bg-white border-2 border-slate-200 rounded-3xl text-xl lg:text-2xl font-medium text-slate-700 leading-[3.5rem] lg:leading-[4.5rem] shadow-inner">
      {parts.map((part: string, i: number) => {
        if (part.startsWith("{{") && part.endsWith("}}")) {
          const expectedWord = part.slice(2, -2);
          const currentIndex = blankIndex++;
          const userWord = (userAnswer || {})[currentIndex] || "";
          const isCorrect = questionData.caseSensitive
            ? expectedWord === userWord.trim()
            : expectedWord.toLowerCase() === userWord.trim().toLowerCase();

          let inputClass = "border-b-4 border-primary/60 bg-primary/5 text-primary font-bold focus:border-primary";
          if (isChecked) {
            inputClass = isCorrect
              ? "border-4 border-emerald-500 bg-emerald-50 text-emerald-700 font-bold rounded-xl"
              : "border-4 border-rose-500 bg-rose-50 text-rose-700 font-bold opacity-70 line-through rounded-xl";
          }
          const width = Math.max(userWord.length, isChecked && !isCorrect ? expectedWord.length : 5) * 1.2 + 2;

          return (
            <span key={i} className="inline-block relative mx-2 align-middle">
              <input
                type="text"
                disabled={isChecked}
                value={userWord}
                onChange={(e) => handleAnswerChange(q, { ...(userAnswer || {}), [currentIndex]: e.target.value })}
                className={`inline-block text-center outline-none transition-all px-3 py-1 min-w-[100px] disabled:opacity-100 disabled:cursor-not-allowed text-xl ${inputClass}`}
                style={{ width: `${width}ch` }}
                placeholder="..."
              />
              {isChecked && !isCorrect && (
                <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-xl border border-emerald-200 shadow-md whitespace-nowrap z-30">
                  {expectedWord}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-100 rotate-45 border-r border-b border-emerald-200" />
                </span>
              )}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
export default ClozeTestBlock;
