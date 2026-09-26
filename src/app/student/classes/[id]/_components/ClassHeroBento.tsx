"use client";

import React from 'react';
import Link from 'next/link';
import { 
  GraduationCap, 
  ArrowLeft, 
  Play, 
  Sparkles, 
  ChevronRight,
  Calendar
} from 'lucide-react';
import { CopyCodeButton } from './CopyCodeButton';

interface ClassHeroBentoProps {
  name: string;
  teacher: {
    name: string | null;
    email: string;
    image?: string | null;
  };
  gradeLevel?: string | null;
  joinCode: string;
  totalAssignments: number;
  completedAssignments: number;
  nextTask?: {
    id: string;
    title: string;
    kind: string;
    targetUrl: string;
  } | null;
  joinedAt?: string | null;
}

export function ClassHeroBento({
  name,
  teacher,
  gradeLevel,
  joinCode,
  totalAssignments,
  completedAssignments,
  nextTask,
  joinedAt,
}: ClassHeroBentoProps) {
  const percent = totalAssignments > 0 
    ? Math.round((completedAssignments / totalAssignments) * 100) 
    : 0;
  const isAllDone = totalAssignments > 0 && completedAssignments === totalAssignments;
  const teacherDisplayName = teacher.name || teacher.email.split('@')[0];

  return (
    <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 lg:p-6 border border-slate-800/80 shadow-lg overflow-hidden">
      {/* Decorative ambient glow */}
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Subtle watermark illustration */}
      <div className="absolute right-4 bottom-1 opacity-5 pointer-events-none select-none">
        <GraduationCap className="w-36 h-36 stroke-[1.2px]" />
      </div>

      <div className="relative z-10 flex flex-col gap-3.5 sm:gap-4">
        {/* Top Strip: Breadcrumb + Status Chip + Metadata (Trình độ, Ngày vào, Mã lớp) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs pb-1 border-b border-white/5">
          {/* Left: Breadcrumbs + Status */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link 
              href="/student/classes" 
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors font-medium py-0.5 px-1.5 -ml-1 rounded-md hover:bg-white/5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Lớp của tôi</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Đang theo học
            </span>
          </div>

          {/* Right: Trình độ, Ngày vào lớp, Mã lớp */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-slate-300 text-[11px] font-medium backdrop-blur-sm">
              <GraduationCap className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>{gradeLevel || 'Tổng hợp'}</span>
            </div>

            {joinedAt && (
              <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-slate-300 text-[11px] font-medium backdrop-blur-sm">
                <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{new Date(joinedAt).toLocaleDateString('vi-VN')}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px] font-medium hidden md:inline">Mã:</span>
              <CopyCodeButton 
                code={joinCode} 
                className="bg-white/10 hover:bg-white/15 border-white/10 text-white text-[11px] py-1 px-2 h-auto" 
              />
            </div>
          </div>
        </div>

        {/* Main Content: Title + Teacher (Left) vs Progress & Action (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-center">
          {/* Left: Class Title & Teacher */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center gap-1.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white line-clamp-1">
              {name}
            </h1>

            {/* Teacher row */}
            <div className="flex items-center gap-2 pt-0.5">
              <div className="size-6 sm:size-7 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-400 flex items-center justify-center text-white font-bold text-xs shrink-0 border border-white/20 shadow-xs overflow-hidden">
                {teacher.image ? (
                  <img src={teacher.image} alt={teacherDisplayName} className="w-full h-full object-cover" />
                ) : (
                  <span>{teacherDisplayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1">
                <span className="text-slate-400">GV:</span>
                <span className="text-white font-bold">{teacherDisplayName}</span>
              </p>
            </div>
          </div>

          {/* Right: Compact Progress & Next Task Bar */}
          <div className="lg:col-span-6 xl:col-span-5">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 space-y-2.5 shadow-sm">
              {/* Progress Row */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-300 uppercase tracking-wider">
                    Tiến độ
                  </span>
                  <span className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                    isAllDone 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {completedAssignments}/{totalAssignments} bài ({percent}%)
                  </span>
                </div>

                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      isAllDone 
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-300' 
                        : 'bg-gradient-to-r from-blue-400 to-indigo-400'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Action Strip */}
              {isAllDone && totalAssignments > 0 ? (
                <div className="flex items-center gap-2 pt-0.5 text-emerald-300">
                  <div className="size-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-xs font-bold text-white truncate">
                    Đã hoàn thành xuất sắc 100% bài tập!
                  </p>
                </div>
              ) : nextTask ? (
                <div className="flex items-center justify-between gap-2.5 pt-0.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-[10px] text-indigo-300 font-semibold mb-0.5">
                      <Play className="w-2.5 h-2.5 fill-indigo-300 text-indigo-300 shrink-0" />
                      <span>Bài tiếp theo:</span>
                    </div>
                    <p className="font-bold text-xs text-white truncate">
                      {nextTask.title}
                    </p>
                  </div>

                  <Link
                    href={nextTask.targetUrl}
                    className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs tracking-wide transition-all shadow-sm active:scale-95 shrink-0 group"
                  >
                    <span>Vào học ngay</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              ) : (
                <div className="text-xs text-slate-400 pt-0.5">
                  Chưa có bài tập nào được giao.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
