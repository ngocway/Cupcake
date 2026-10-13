"use client";

import React from "react";
import { X, Info, RotateCcw, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { getScoreEmoji, getScoreMsg } from "../utils/quizHelpers";

interface QuizResultModalProps {
  scoreResult: { correct: number; total: number };
  isRetrying: boolean;
  onClose: () => void;
  handleRetryAssignment: () => void;
}

export function QuizResultModal({
  scoreResult,
  isRetrying,
  onClose,
  handleRetryAssignment,
}: QuizResultModalProps) {
  const t = useTranslations("student.quiz");

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-4 border-primary/20 shadow-2xl shadow-primary/20 overflow-hidden flex flex-col items-center text-center px-8 py-7 relative max-w-md w-full animate-in zoom-in-95 duration-300">
        {/* Decorative top gradient */}
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-emerald-400 via-amber-400 to-primary"></div>

        {/* Close button (X) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
          title="Close"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-5xl mb-3 mt-1 animate-bounce">
          {getScoreEmoji(scoreResult.correct, scoreResult.total)}
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">
          {getScoreMsg(scoreResult.correct, scoreResult.total)}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">
          You answered <span className="text-primary font-black text-xl px-1">{scoreResult.correct}</span> / {scoreResult.total} questions correctly.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
          >
            <Info className="w-4 h-4" />
            {t("reviewDetails") || "Review details"}
          </button>
          <button
            onClick={handleRetryAssignment}
            disabled={isRetrying}
            className={`px-6 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm transition-all shadow-xl shadow-primary/30 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto ${
              isRetrying ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {isRetrying ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <RotateCcw className="w-4 h-4 shrink-0" />
            )}
            <span>{isRetrying ? "Đang chuẩn bị đề thi..." : (t("retryAssignment") || "Retry assignment")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
export default QuizResultModal;
