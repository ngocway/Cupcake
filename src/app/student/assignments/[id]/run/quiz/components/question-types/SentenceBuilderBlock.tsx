"use client";

import React, { useMemo } from "react";
import { RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { seedShuffle } from "../../utils/quizHelpers";

interface WordToken {
  idx: number;
  text: string;
}

interface SentenceBuilderBlockProps {
  currentQuestion: any;
  currentQuestionData: any;
  userAnswer: any;
  isChecked: boolean;
  attemptSeed: string;
  handleAnswerChange: (q: any, val: any) => void;
}

const TILE_PASTELS = [
  "bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100",
  "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100",
  "bg-sky-50 border-sky-300 text-sky-900 hover:bg-sky-100",
  "bg-purple-50 border-purple-300 text-purple-900 hover:bg-purple-100",
];

export function SentenceBuilderBlock({
  currentQuestion,
  currentQuestionData,
  userAnswer,
  isChecked,
  attemptSeed,
  handleAnswerChange,
}: SentenceBuilderBlockProps) {
  const selectedTokens: WordToken[] = Array.isArray(userAnswer) ? userAnswer : [];
  const selectedIdxSet = new Set(selectedTokens.map((t) => t.idx));

  // Build deterministic shuffled word bank with stable indices (handles duplicate words safely)
  const bankTokens: WordToken[] = useMemo(() => {
    const rawWords: string[] = Array.isArray(currentQuestionData?.shuffledWords)
      ? currentQuestionData.shuffledWords
      : Array.isArray(currentQuestionData?.words)
      ? seedShuffle(currentQuestionData.words, `${attemptSeed}-${currentQuestion?.id}-sb`)
      : [];
    return rawWords.map((text, idx) => ({ idx, text }));
  }, [currentQuestionData, attemptSeed, currentQuestion?.id]);

  const targetSentence: string =
    currentQuestionData?.targetSentence ||
    (Array.isArray(currentQuestionData?.words) ? currentQuestionData.words.join(" ") : "");

  const builtSentence = selectedTokens.map((t) => t.text).join(" ").trim();
  const isCorrect = isChecked && builtSentence === targetSentence.trim();
  const contextHint: string | undefined = currentQuestionData?.contextHint;

  const handleAddToken = (token: WordToken) => {
    if (isChecked || selectedIdxSet.has(token.idx)) return;
    handleAnswerChange(currentQuestion, [...selectedTokens, token]);
  };

  const handleRemoveToken = (idxToRemove: number) => {
    if (isChecked) return;
    handleAnswerChange(
      currentQuestion,
      selectedTokens.filter((t) => t.idx !== idxToRemove)
    );
  };

  const handleClear = () => {
    if (isChecked || selectedTokens.length === 0) return;
    handleAnswerChange(currentQuestion, []);
  };

  return (
    <div className="space-y-4 sm:space-y-5 w-full max-w-2xl mx-auto">
      {/* Optional Context Hint (shown for Grade 1-9) */}
      {contextHint && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-200 text-indigo-800 text-xs sm:text-sm font-bold shadow-2xs">
            <span>{contextHint}</span>
          </div>
        </div>
      )}

      {/* Answer Drop Tray */}
      <div
        className={`relative min-h-[84px] sm:min-h-[96px] p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 ${
          isChecked
            ? isCorrect
              ? "border-emerald-400 bg-emerald-50/90 shadow-sm"
              : "border-rose-400 bg-rose-50/90 shadow-sm"
            : selectedTokens.length > 0
            ? "border-purple-300 bg-purple-50/40 shadow-inner"
            : "border-dashed border-purple-200 bg-slate-50/70"
        }`}
      >
        {selectedTokens.length === 0 ? (
          <span className="text-xs sm:text-sm font-bold text-slate-400 select-none">
            Tap words below to build the sentence...
          </span>
        ) : (
          selectedTokens.map((token) => (
            <button
              key={`placed-${token.idx}`}
              type="button"
              disabled={isChecked}
              onClick={() => handleRemoveToken(token.idx)}
              className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-extrabold text-sm sm:text-base border-2 border-b-4 transition-all select-none ${
                isChecked
                  ? isCorrect
                    ? "bg-white border-emerald-400 text-emerald-800"
                    : "bg-white border-rose-400 text-rose-800"
                  : "bg-white border-purple-400 text-[#2D366D] hover:bg-rose-50 hover:border-rose-300 active:translate-y-0.5 cursor-pointer shadow-sm"
              }`}
              title={isChecked ? undefined : "Tap to remove"}
            >
              {token.text}
            </button>
          ))
        )}

        {/* Clear Button */}
        {!isChecked && selectedTokens.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Clear all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Correct answer feedback when checked & wrong */}
      {isChecked && !isCorrect && targetSentence && (
        <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Correct sentence: &ldquo;{targetSentence}&rdquo;</span>
        </div>
      )}

      {isChecked && isCorrect && (
        <div className="flex items-center justify-center gap-1.5 text-emerald-600 text-xs sm:text-sm font-black">
          <CheckCircle2 className="w-4 h-4" />
          <span>Perfect order!</span>
        </div>
      )}

      {/* Shuffled Word Bank */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 pt-1">
        {bankTokens.map((token) => {
          const isUsed = selectedIdxSet.has(token.idx);
          const colorCls = TILE_PASTELS[token.idx % TILE_PASTELS.length];
          return (
            <button
              key={`bank-${token.idx}`}
              type="button"
              disabled={isChecked || isUsed}
              onClick={() => handleAddToken(token)}
              className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-extrabold text-sm sm:text-base border-2 border-b-4 transition-all select-none ${
                isUsed
                  ? "bg-slate-100 border-slate-200 text-transparent shadow-none pointer-events-none opacity-40"
                  : isChecked
                  ? "bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-default"
                  : `${colorCls} active:translate-y-0.5 shadow-sm cursor-pointer`
              }`}
            >
              {token.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
