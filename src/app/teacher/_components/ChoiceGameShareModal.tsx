"use client";

import { useState } from "react";
import { X, Check, Copy, Link2, Share2, Sparkles } from "lucide-react";

interface ChoiceGameShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  gameCode: string;
}

export function ChoiceGameShareModal({
  isOpen,
  onClose,
  gameTitle,
  gameCode,
}: ChoiceGameShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const directLink = `${typeof window !== "undefined" ? window.location.origin : ""}/game/shooter/${gameCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 text-2xl font-bold">
          🎯
        </div>

        <div className="space-y-1">
          <h3 className="font-headline font-black text-xl text-slate-800 dark:text-white">
            Chia Sẻ Bài Tập Bắn Súng
          </h3>
          <p className="text-xs font-semibold text-slate-400 truncate px-2">
            "{gameTitle}"
          </p>
        </div>

        {/* Assignment Code Box */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl p-3.5 border border-emerald-200/60 dark:border-emerald-800/60 space-y-0.5">
          <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block">
            Mã Bài Tập Học Sinh
          </span>
          <p className="font-mono font-black text-2xl text-emerald-700 dark:text-emerald-300 tracking-widest">
            {gameCode}
          </p>
        </div>

        {/* Direct Link Box */}
        <div className="space-y-2 text-left">
          <label className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
            Đường Link Trực Tiếp
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={directLink}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-emerald-500/20 cursor-pointer whitespace-nowrap"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Đã chép" : "Sao chép"}</span>
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
