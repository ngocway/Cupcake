"use client";

import React from "react";
import { useContentStore } from "@/store/useContentStore";
import { Lock, Sparkles, X, ArrowRight } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSwitch: () => void;
}

export function AgeGroupRestrictionModal({ isOpen, onClose, onConfirmSwitch }: Props) {
  const nativeLanguage = useContentStore((s) => s.nativeLanguage);
  const isVi = nativeLanguage === "vi";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border-4 border-amber-300/80 dark:border-amber-500/40 text-center flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow & decorative shapes */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-200/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-200/50 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Playful Lock Icon Badge */}
        <div className="relative mt-2">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center shadow-lg shadow-amber-400/30 transform rotate-3 transition-transform hover:rotate-6">
            <Lock className="w-10 h-10 text-amber-950 stroke-[2.5]" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white p-1.5 rounded-full shadow-md">
            <Sparkles className="w-4 h-4 fill-white" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold font-headline text-slate-800 dark:text-white mt-1">
          {isVi ? "Nội dung tạm khóa" : "Content Locked"}
        </h3>

        {/* Body Message */}
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed px-2">
          {isVi
            ? "Phần học này chưa phù hợp với lứa tuổi Mầm non (2-5 tuổi). Bạn có muốn chuyển đổi sang độ tuổi khác để mở khóa không?"
            : "This content is recommended for older learners. Would you like to switch your age group to unlock it?"}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 w-full mt-2">
          <button
            onClick={onConfirmSwitch}
            className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 group whitespace-nowrap cursor-pointer"
          >
            <span className="whitespace-nowrap">{isVi ? "Đổi độ tuổi" : "Switch Age Group"}</span>
            <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-5 rounded-2xl font-bold text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200/80 dark:border-slate-700/80 whitespace-nowrap cursor-pointer"
          >
            {isVi ? "Bỏ qua" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
