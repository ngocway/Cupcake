"use client";

import React from 'react';
import { CopyCodeButton } from './CopyCodeButton';

interface ClassSidebarBentoProps {
  description?: string | null;
  joinCode: string;
}

export function ClassSidebarBento({
  description,
  joinCode,
}: ClassSidebarBentoProps) {
  return (
    <aside className="space-y-6">
      {/* CLASS INFO & SHARE WIDGET */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
          Thông tin lớp học
        </h3>

        <div className="space-y-3.5 text-xs">
          {/* Join Code Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Mã tham gia lớp</p>
              <p className="font-mono text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{joinCode}</p>
            </div>
            <CopyCodeButton code={joinCode} />
          </div>

          {/* Description */}
          {description ? (
            <div className="pt-2">
              <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider block mb-1">Giới thiệu lớp</span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {description}
              </p>
            </div>
          ) : (
            <div className="pt-1 text-slate-400 italic text-[11px]">
              Lớp học tiếng Anh trên hệ thống Dolcake.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
