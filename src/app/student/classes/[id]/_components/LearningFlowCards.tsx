"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  BookOpen, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Play, 
  Star, 
  Eye, 
  HelpCircle, 
  Volume2, 
  Layers,
  ArrowRight,
  Flame,
  Award
} from 'lucide-react';
import { StudentGroupItem } from './StudentAssignmentsView';

export interface CardHelperProps {
  item: StudentGroupItem;
  targetUrl: string;
  isReview: boolean;
  cleanTitle: string;
  formula?: string;
  itemCount?: number;
  itemUnit?: string;
}

// Level colors mapping matching Dolcake theme
export const getLevelStyle = (lvl?: string | null) => {
  const l = (lvl || 'a1').toLowerCase();
  if (l.includes('pre') || l.includes('beginner')) return { label: 'PRE-A1', color: 'bg-emerald-500 text-white' };
  if (l.includes('a1')) return { label: 'A1', color: 'bg-emerald-500 text-white' };
  if (l.includes('a2') || l.includes('elementary')) return { label: 'A2', color: 'bg-sky-500 text-white' };
  if (l.includes('b1') || l.includes('intermediate')) return { label: 'B1', color: 'bg-amber-500 text-white' };
  if (l.includes('b2')) return { label: 'B2', color: 'bg-orange-500 text-white' };
  if (l.includes('c1') || l.includes('advanced')) return { label: 'C1', color: 'bg-rose-500 text-white' };
  return { label: (lvl || 'A1').toUpperCase(), color: 'bg-blue-600 text-white' };
};

/* =========================================================================
   1. GRAMMAR LESSON BANNER CARD (Formula Box & Ambient Glow)
   ========================================================================= */
export function GrammarLessonCard({
  item,
  targetUrl,
  isReview,
  cleanTitle,
  formula
}: CardHelperProps) {
  const displayFormula = formula || "S + V / V(s/es) + Object";

  return (
    <Link
      href={targetUrl}
      className="group relative overflow-hidden rounded-md p-5 sm:p-6 flex flex-col items-center justify-between text-center gap-5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-indigo-400/30 cursor-pointer w-full min-h-[300px]"
    >
      {/* Decorative ambient background blobs */}
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-purple-400/20 blur-xl pointer-events-none" />

      {/* Top: Badges + Title */}
      <div className="space-y-2.5 z-10 w-full pt-1">
        <div className="flex items-center justify-center gap-1.5 flex-nowrap">
          <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-md backdrop-blur-sm border border-white/20 whitespace-nowrap">
            Grammar Lesson
          </span>
          {isReview && (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 shadow-xs whitespace-nowrap">
              Ôn bài
            </span>
          )}
          {item.isSubmitted && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-400 text-emerald-950 flex items-center gap-1 whitespace-nowrap shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              Đã học
            </span>
          )}
        </div>

        <h3 className="font-black text-lg sm:text-xl text-white tracking-tight leading-snug line-clamp-2 px-1">
          {cleanTitle}
        </h3>
      </div>

      {/* Formula Box */}
      <div className="w-full z-10">
        <div className="bg-white/95 dark:bg-slate-900/95 rounded-md px-4 py-2.5 shadow-md border border-white/60 text-center w-full">
          <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mb-0.5">
            CÔNG THỨC TRỌNG TÂM
          </p>
          <code className="text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-mono font-black break-words">
            {displayFormula}
          </code>
        </div>
      </div>

      {/* CTA Button */}
      <div className="z-10 w-full pt-1">
        <div className="w-full py-2.5 px-4 bg-white text-slate-800 rounded-md text-xs font-black shadow-md group-hover:shadow-xl group-hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-1.5">
          <span>{item.isSubmitted ? 'Ôn lại lý thuyết' : 'Vào xem lý thuyết'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
}

/* =========================================================================
   2. GRAMMAR EXERCISE CARD (Horizontal Pastel Card)
   ========================================================================= */
export function GrammarExerciseCard({
  item,
  targetUrl,
  isReview,
  cleanTitle,
  itemCount
}: CardHelperProps) {
  const levelInfo = getLevelStyle(item.assignment.level);
  const teacher = item.assignment.teacher;
  const questions = itemCount ?? item.assignment.questionsCount ?? 15;
  const thumbnail = item.assignment.thumbnail || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600";

  return (
    <Link
      href={targetUrl}
      className="group flex flex-row rounded-md overflow-hidden bg-white dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative w-full"
    >
      {/* 1:1 Square Thumbnail on left */}
      <div className="relative shrink-0 aspect-square w-[85px] sm:w-[95px] overflow-hidden bg-slate-100 dark:bg-slate-700">
        <Image
          src={thumbnail}
          alt={cleanTitle}
          fill
          sizes="95px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {isReview && (
          <div className="absolute top-1.5 left-1.5 z-10">
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase bg-amber-400 text-amber-950 shadow-sm">
              Ôn
            </span>
          </div>
        )}
      </div>

      {/* Right Content */}
      <div className="flex-1 p-3 sm:p-3.5 flex flex-col justify-between min-w-0">
        <div>
          {/* Teacher row */}
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-4.5 h-4.5 rounded-full overflow-hidden border border-slate-200 relative shrink-0">
              <Image
                src={teacher?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher?.id || 'teacher'}`}
                alt="Teacher"
                fill
                sizes="18px"
                className="object-cover"
              />
            </div>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              {teacher?.name || 'Dolcake Teacher'}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-black leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {cleanTitle}
          </h4>
        </div>

        {/* Footer: Level, Qs, and Submission Status */}
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className={`${levelInfo.color} px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider`}>
              {levelInfo.label}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              {questions} Qs
            </span>
          </div>

          {/* Submission badge */}
          {item.isSubmitted ? (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" />
              <span suppressHydrationWarning>
                {item.score !== undefined && item.score !== null
                  ? `${typeof item.score === 'number' ? Number(item.score.toFixed(1)) : item.score} đ`
                  : 'Đã nộp'}
              </span>
            </span>
          ) : (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              Làm bài →
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* =========================================================================
   3. READING STORY CARD (Vertical Storybook Poster Card)
   ========================================================================= */
export function ReadingStoryCard({
  item,
  targetUrl,
  isReview,
  cleanTitle
}: CardHelperProps) {
  const levelInfo = getLevelStyle(item.assignment.level);
  const teacher = item.assignment.teacher;
  const thumbnail = item.assignment.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800";
  const wordCount = ((cleanTitle.length || 10) * 12 + 100) % 600 + 150;

  return (
    <div className="relative w-full group">
      {/* Top Cover Image */}
      <Link 
        href={targetUrl} 
        className="block relative aspect-[16/10] w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800 shadow-md border border-slate-200/60 dark:border-slate-700 cursor-pointer"
      >
        <Image
          src={thumbnail}
          alt={cleanTitle}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Level Badges */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 pointer-events-none">
          <span className={`${levelInfo.color} px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider shadow-md`}>
            {levelInfo.label}
          </span>
          {isReview && (
            <span className="bg-amber-400 text-amber-950 px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow-md">
              Ôn bài
            </span>
          )}
        </div>

        {/* Completion status indicator */}
        {item.isSubmitted && (
          <div className="absolute top-3 right-3 z-10 bg-emerald-500 text-white px-2.5 py-1 rounded-md text-[10px] font-black shadow-md flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Đã đọc
          </div>
        )}

        {/* Bottom subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
      </Link>

      {/* Floating Content Box overlapping cover */}
      <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-md p-4 sm:p-5 shadow-lg border border-slate-200/60 dark:border-slate-700/60 transition-all duration-300 group-hover:-translate-y-1">
        {/* Teacher row */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 relative">
            <Image
              src={teacher?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher?.id || 'story'}`}
              alt="Teacher"
              fill
              sizes="24px"
              className="object-cover"
            />
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
            {teacher?.name || 'Dolcake Storybook'}
          </span>
        </div>

        {/* Title */}
        <Link href={targetUrl}>
          <h4 className="text-slate-900 dark:text-white text-base font-black leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-3">
            {cleanTitle}
          </h4>
        </Link>

        {/* Bottom stats row */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {wordCount} words
          </span>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-slate-400 text-[11px] font-bold">
              <Eye className="w-3.5 h-3.5" />
              <span>1.8k</span>
            </div>
            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md font-black text-[11px]">
              <Star className="w-3 h-3 fill-amber-400 stroke-none" />
              <span>4.9</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   4. FLASHCARD LANE CARD (Pastel Ambient Topic Card)
   ========================================================================= */
const FLASHCARD_PALETTES = [
  { bg: "bg-amber-50 dark:bg-amber-950/20",   border: "border-amber-200 dark:border-amber-800/40",   hover: "hover:border-amber-400 hover:bg-amber-100/80",   dot: "bg-amber-200/60" },
  { bg: "bg-pink-50 dark:bg-pink-950/20",    border: "border-pink-200 dark:border-pink-800/40",    hover: "hover:border-pink-400 hover:bg-pink-100/80",     dot: "bg-pink-200/60" },
  { bg: "bg-sky-50 dark:bg-sky-950/20",     border: "border-sky-200 dark:border-sky-800/40",     hover: "hover:border-sky-400 hover:bg-sky-100/80",       dot: "bg-sky-200/60" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-800/40", hover: "hover:border-emerald-400 hover:bg-emerald-100/80", dot: "bg-emerald-200/60" },
  { bg: "bg-violet-50 dark:bg-violet-950/20",  border: "border-violet-200 dark:border-violet-800/40",  hover: "hover:border-violet-400 hover:bg-violet-100/80",  dot: "bg-violet-200/60" },
];

export function FlashcardLaneCard({
  item,
  targetUrl,
  isReview,
  cleanTitle,
  itemCount
}: CardHelperProps) {
  const colorIndex = (cleanTitle.charCodeAt(0) || 0) % FLASHCARD_PALETTES.length;
  const style = FLASHCARD_PALETTES[colorIndex];
  const count = itemCount || 15;

  return (
    <Link
      href={targetUrl}
      className={`group relative flex flex-col justify-between w-full p-4 sm:p-5 rounded-md border-2 overflow-hidden cursor-pointer transition-all duration-300 shadow-xs hover:shadow-xl hover:scale-[1.02] min-h-[140px] ${style.bg} ${style.border} ${style.hover}`}
    >
      {/* Ambient background blur blobs */}
      <div className={`absolute -top-10 -right-10 w-24 h-24 ${style.dot} rounded-full blur-xl pointer-events-none`} />
      <div className={`absolute -bottom-8 -left-8 w-20 h-20 ${style.dot} rounded-full blur-xl pointer-events-none`} />

      {/* Ghost watermark */}
      <span className="absolute -bottom-3 -right-3 text-5xl opacity-10 transform rotate-12 transition-transform duration-500 group-hover:scale-125 select-none pointer-events-none">
        🧸
      </span>

      {/* Top: Icon + Title */}
      <div className="flex items-start gap-3 relative z-10 w-full">
        <div className="w-10 h-10 rounded-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-md flex items-center justify-center text-2xl shadow-xs shrink-0 group-hover:scale-110 transition-transform">
          🧸
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              Flashcard
            </span>
            {isReview && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400 text-amber-950">
                Ôn bài
              </span>
            )}
          </div>
          <h4 className="font-black text-sm sm:text-base text-slate-800 dark:text-white leading-snug line-clamp-2 group-hover:text-purple-600 transition-colors">
            {cleanTitle}
          </h4>
        </div>
      </div>

      {/* Bottom: Card Count & Status */}
      <div className="mt-4 pt-2.5 border-t border-slate-200/50 dark:border-slate-700/40 flex items-center justify-between relative z-10">
        <span className="text-xs font-black text-slate-500 dark:text-slate-400">
          {count} Cards
        </span>

        {item.isSubmitted ? (
          <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã học
          </span>
        ) : (
          <span className="text-[11px] font-black text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
            Luyện từ vựng →
          </span>
        )}
      </div>
    </Link>
  );
}

/* =========================================================================
   5. BOOK SHADOWING CARD (Pronunciation & Read along)
   ========================================================================= */
export function BookShadowingCard({
  item,
  targetUrl,
  isReview,
  cleanTitle
}: CardHelperProps) {
  const levelInfo = getLevelStyle(item.assignment.level);
  const thumbnail = item.assignment.thumbnail || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800";

  return (
    <Link
      href={targetUrl}
      className="group flex flex-col rounded-md overflow-hidden bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <Image
          src={thumbnail}
          alt={cleanTitle}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
          <span className="bg-amber-500 text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-md">
            8 PAGES
          </span>
          <span className="bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider border border-white/20 flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-amber-300" />
            SHADOWING
          </span>
          {item.isSubmitted && (
            <span className="bg-emerald-500 text-white px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider shadow-md flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Đã học
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
            Luyện phát âm & ngữ điệu
          </span>
          <h4 className="font-black text-sm sm:text-base text-slate-800 dark:text-white leading-snug line-clamp-2 mt-1 group-hover:text-amber-600 transition-colors">
            {cleanTitle}
          </h4>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <span className={`${levelInfo.color} px-2 py-0.5 rounded-md text-[10px] font-black uppercase`}>
            {levelInfo.label}
          </span>

          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            {item.isSubmitted ? 'Đọc lại →' : 'Bắt đầu đọc →'}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* =========================================================================
   6. EDUCATIONAL GAME CARD (Vibrant Poster & Big Play Now Button)
   ========================================================================= */
export function EducationalGameCard({
  item,
  targetUrl,
  isReview,
  cleanTitle,
  itemCount
}: CardHelperProps) {
  const count = itemCount || 20;
  const thumbnail = item.assignment.thumbnail || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800";

  return (
    <div className="group rounded-md overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
      {/* Top Banner Image with Badges */}
      <Link href={targetUrl} className="relative aspect-[16/10] w-full overflow-hidden block bg-slate-100 dark:bg-slate-800">
        <Image
          src={thumbnail}
          alt={cleanTitle}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        {/* Ribbons Top-Left */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 pointer-events-none">
          <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-md bg-pink-500 text-white">
            KẸO NGỌT
          </span>
          <span className="px-2.5 py-1 rounded-md bg-gradient-to-r from-red-500 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 animate-pulse">
            <Sparkles className="w-3 h-3" />
            <span>MỚI</span>
          </span>
        </div>

        {/* Bottom Badge on Image: Question count */}
        <div className="absolute bottom-2.5 left-3 z-10">
          <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">
            {count} câu hỏi
          </span>
        </div>

        {item.isSubmitted && (
          <div className="absolute bottom-2.5 right-3 z-10">
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/90 text-white text-[10px] font-black shadow-md flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Đã chơi
            </span>
          </div>
        )}
      </Link>

      {/* Content & Action Button */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <Link href={targetUrl} className="block">
            <h4 className="font-black text-base sm:text-lg text-slate-800 dark:text-white leading-snug line-clamp-2 group-hover:text-pink-600 transition-colors">
              {cleanTitle}
            </h4>
          </Link>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
            Vừa chơi vừa ôn tập từ vựng & ngữ pháp cực vui
          </p>
        </div>

        {/* Full-width glowing CTA */}
        <Link
          href={targetUrl}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-md shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 group/btn cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-white stroke-none" />
          <span>{item.isSubmitted ? 'Chơi lại game' : 'Chơi ngay • PLAY NOW'}</span>
        </Link>
      </div>
    </div>
  );
}
