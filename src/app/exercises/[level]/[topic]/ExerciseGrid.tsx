"use client";
import { ExerciseCardHorizontal } from "@/components/public/ContentCards";
import { BookOpen, ExternalLink } from "lucide-react";

interface ExerciseGridProps {
  exercises: any[];
  isLoggedIn: boolean;
  /** Full URL to the grammar lesson page */
  grammarHref?: string;
  /** Display name of the lesson, shown inside the banner */
  lessonLabel?: string;
  /** Tailwind bg class used for the pill badge (e.g. "bg-emerald-500") */
  pillBg?: string;
  /** Tailwind gradient classes for the banner background (e.g. "from-emerald-300 via-emerald-400 to-teal-500") */
  pillGradient?: string;
  /** Short grammar formula/pattern, e.g. "S + V(s/es)" */
  formula?: string;
}

export function ExerciseGrid({
  exercises,
  isLoggedIn,
  grammarHref,
  lessonLabel,
  pillBg = "bg-emerald-500",
  pillGradient,
  formula,
}: ExerciseGridProps) {
  const bannerBg = pillGradient
    ? `bg-gradient-to-br ${pillGradient}`
    : pillBg;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-6">
      {/* ── Grammar banner — col 1, spans rows 1-2 ── */}
      {grammarHref && (
        <a
          href={grammarHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            row-span-2
            relative overflow-hidden
            flex flex-col items-center justify-center gap-4
            p-6 rounded-2xl
            ${bannerBg}
            shadow-lg hover:shadow-2xl
            hover:-translate-y-1
            transition-all duration-300
            cursor-pointer group
          `}
        >
          {/* ── Decorative background blobs ── */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute top-1/2 right-3 w-6 h-6 rounded-full bg-white/15 pointer-events-none" />

          {/* ── Icon with concentric glow rings ── */}
          <div className="relative flex items-center justify-center shrink-0 z-10">
            {/* Outer glow */}
            <div className="absolute w-[96px] h-[96px] rounded-full bg-white/10 group-hover:bg-white/15 transition-colors duration-300" />
            {/* Mid ring */}
            <div className="absolute w-[78px] h-[78px] rounded-full bg-white/15 group-hover:bg-white/20 transition-colors duration-300" />
            {/* Icon box */}
            <div className="relative w-16 h-16 rounded-2xl bg-white/25 border border-white/40 flex items-center justify-center shadow-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors duration-300">
              <BookOpen className="w-9 h-9 text-white drop-shadow-sm" />
            </div>
          </div>

          {/* ── Text ── */}
          <div className="text-center z-10 space-y-0.5">
            <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.18em]">
              Grammar Lesson
            </p>
            <p className="text-white font-black text-sm leading-tight drop-shadow-sm">
              {lessonLabel}
            </p>
          </div>

          {/* ── Formula chip — white bg for max readability ── */}
          {formula && (
            <div className="w-full z-10">
              <div className="bg-white/95 rounded-xl px-3 py-2.5 shadow-md border border-white/60 text-center">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                  Formula
                </p>
                <code className="text-slate-800 text-[14px] font-mono font-black leading-snug break-words">
                  {formula}
                </code>
              </div>
            </div>
          )}

          {/* ── CTA button — solid white pill ── */}
          <div className="z-10 flex items-center gap-1.5 px-4 py-2 bg-white rounded-full text-slate-700 text-[11px] font-black shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
            <span>View Lesson</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </div>
        </a>
      )}

      {/* ── Exercise cards ── */}
      {exercises.map((ex) => (
        <ExerciseCardHorizontal key={ex.id} item={ex} isLoggedIn={isLoggedIn} />
      ))}
    </div>
  );
}
