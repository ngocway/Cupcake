"use client";

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyCodeButtonProps {
  code: string;
  className?: string;
  variant?: 'subtle' | 'pill';
}

export function CopyCodeButton({ code, className = '', variant = 'pill' }: CopyCodeButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code', err);
    }
  };

  if (variant === 'subtle') {
    return (
      <button
        type="button"
        onClick={handleCopy}
        title="Sao chép mã lớp"
        className={`inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer ${className}`}
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5px]" />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">Đã sao chép</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 text-slate-400 stroke-[2px]" />
            <span className="font-mono font-medium text-[11px]">{code}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Sao chép mã lớp"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer active:scale-95 ${
        copied
          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
          : 'bg-slate-100/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5px]" />
          <span>Đã chép mã</span>
        </>
      ) : (
        <>
          <span className="font-mono tracking-wider">{code}</span>
          <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </>
      )}
    </button>
  );
}
