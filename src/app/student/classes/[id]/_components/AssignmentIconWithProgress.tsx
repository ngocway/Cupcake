'use client';

import React from 'react';

interface AssignmentIconWithProgressProps {
  progress?: number;
  isItemActive?: boolean;
  badgeClass?: string;
  iconNode: React.ReactNode;
  tooltipText?: string;
}

export function AssignmentIconWithProgress({
  progress = 0,
  isItemActive = false,
  badgeClass = '',
  iconNode,
  tooltipText = '',
}: AssignmentIconWithProgressProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const isLoading = clampedProgress > 0 && clampedProgress < 100;

  return (
    <div className="relative group/icon flex items-center justify-center shrink-0">
      {/* Icon Container with Soft Vibrant palette */}
      <div
        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
          isItemActive
            ? 'bg-white/25 text-white border border-white/40 shadow-xs backdrop-blur-xs scale-105'
            : badgeClass || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60'
        }`}
      >
        {iconNode}
      </div>

      {/* Subtle background preload loading indicator */}
      {isLoading && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
        </span>
      )}

      {/* Floating Tooltip on Hover (anchored left-0 so it never clips past left container boundary) */}
      {tooltipText && (
        <div className="absolute left-0 bottom-full mb-1.5 px-2.5 py-0.5 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-sm text-white text-[10.5px] font-black rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover/icon:opacity-100 transition-all duration-150 shadow-md z-50 scale-95 group-hover/icon:scale-100 origin-bottom-left">
          {tooltipText}
          <div className="absolute left-3 -bottom-1 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-slate-900/95 dark:border-t-slate-800/95" />
        </div>
      )}
    </div>
  );
}

