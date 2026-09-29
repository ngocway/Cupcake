"use client";

import React from 'react';

export interface CardTitleWithTooltipProps {
  title: string;
  className?: string;
  as?: 'h3' | 'h4' | 'div' | 'span';
  align?: 'left' | 'center';
}

/**
 * Dolcake UI Floating Bubble Tooltip for Card Titles.
 * Displays a clean, elegant floating bubble with an arrow pointer, dark backdrop-blur,
 * and unclipped full title when hovering over the card title.
 */
export function CardTitleWithTooltip({
  title,
  className = "font-black leading-snug line-clamp-2 transition-colors",
  as: Tag = "h4",
  align = "left",
}: CardTitleWithTooltipProps) {
  return (
    <div className={`relative group/title inline-block max-w-full ${align === "center" ? "text-center" : "text-left"}`}>
      <Tag className={className}>
        {title}
      </Tag>

      {/* Dolcake Floating Bubble Tooltip (Option B) */}
      <div
        className={`pointer-events-none absolute bottom-full ${
          align === "center" ? "left-1/2 -translate-x-1/2 items-center" : "left-0 items-start"
        } mb-2.5 hidden group-hover/title:flex flex-col z-50 w-max max-w-[calc(100vw-2rem)] sm:max-w-[340px] drop-shadow-xl animate-in fade-in duration-150`}
        role="tooltip"
      >
        <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur-md border border-slate-700/60 dark:border-slate-600/60 text-left leading-snug break-words">
          {title}
        </div>
        <div
          className={`w-2 h-2 bg-slate-900/95 dark:bg-slate-800/95 rotate-45 -mt-1 border-r border-b border-slate-700/60 dark:border-slate-600/60 ${
            align === "center" ? "self-center" : "ml-4"
          }`}
        />
      </div>
    </div>
  );
}
