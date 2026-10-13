"use client";

import React from "react";
import { X, HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface QuizNavGuardModalProps {
  isOpen: boolean;
  targetTitle: string;
  targetUrl: string;
  allCompleted: boolean;
  onClose: () => void;
  onConfirm: (url: string) => void;
}

export function QuizNavGuardModal({
  isOpen,
  targetTitle,
  targetUrl,
  allCompleted,
  onClose,
  onConfirm,
}: QuizNavGuardModalProps) {
  const t = useTranslations("student.quiz");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-sm bg-slate-900/60 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-8 relative animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose} 
          className="absolute top-5 left-5 p-1.5 text-slate-400 hover:text-slate-900 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="mt-6 space-y-5 text-center">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
            <HelpCircle className="w-7 h-7 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-black text-slate-900">{t("navGuardTitle")}</h4>
            <p className="text-slate-500 text-sm leading-relaxed">
              {t("navGuardMessage", { unfinished: allCompleted ? "" : t("unfinished"), title: targetTitle })}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onConfirm(targetUrl)}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm tracking-widest hover:bg-primary/90 transition-all shadow-xl uppercase italic cursor-pointer"
            >
              {t("confirm")}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-slate-500 font-bold text-xs hover:text-slate-800 transition-colors uppercase tracking-widest cursor-pointer"
            >
              {t("continue")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default QuizNavGuardModal;
