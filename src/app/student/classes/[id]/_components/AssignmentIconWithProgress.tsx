'use client';

import React from 'react';

interface AssignmentIconWithProgressProps {
  progress?: number;
  isItemActive?: boolean;
  badgeClass?: string;
  iconNode: React.ReactNode;
}

export function AssignmentIconWithProgress({
  progress = 0,
  isItemActive = false,
  badgeClass = '',
  iconNode,
}: AssignmentIconWithProgressProps) {
  const radius = 13.5;
  const circumference = 2 * Math.PI * radius; // ~84.82
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = circumference * (1 - clampedProgress / 100);
  const isCompleted = clampedProgress >= 100;
  const isLoading = clampedProgress > 0 && clampedProgress < 100;

  return (
    <div
      className="relative w-7 h-7 flex items-center justify-center shrink-0"
      title={
        isCompleted
          ? 'Đã sẵn sàng'
          : isLoading
            ? 'Đang chuẩn bị...'
            : 'Chờ tải...'
      }
    >
      {/* Circular Progress Ring */}
      <svg
        className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
        viewBox="0 0 32 32"
      >
        {/* Background Track */}
        <circle
          cx="16"
          cy="16"
          r={radius}
          fill="none"
          strokeWidth="2.5"
          className={
            isItemActive
              ? 'stroke-white/20'
              : isCompleted
                ? 'stroke-emerald-100 dark:stroke-emerald-950/70'
                : 'stroke-slate-200/90 dark:stroke-slate-700/60'
          }
        />
        {/* Dynamic Progress / Closed Green Ring */}
        {clampedProgress > 0 && (
          <circle
            cx="16"
            cy="16"
            r={radius}
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`transition-[stroke-dashoffset] duration-300 ease-out ${
              isCompleted
                ? isItemActive
                  ? 'stroke-emerald-300'
                  : 'stroke-emerald-500 dark:stroke-emerald-400'
                : isItemActive
                  ? 'stroke-white'
                  : 'stroke-blue-500 dark:stroke-blue-400'
            }`}
          />
        )}
      </svg>

      {/* Inner Icon Container */}
      <div
        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
          isItemActive
            ? 'bg-white/20 text-white'
            : badgeClass || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
        }`}
      >
        {iconNode}
      </div>
    </div>
  );
}
