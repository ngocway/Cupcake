'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cancelJoinRequest } from '@/app/student/classes/actions';
import {
  Hourglass,
  GraduationCap,
  Flame,
  BookOpen,
  ArrowRight,
  Plus,
  Sparkles,
  X,
  LogIn,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Compass,
  ArrowDown,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

import { useContentStore } from '@/store/useContentStore';

type PublicClassItem = {
  id: string;
  title: string;
  description: string;
  subjectBadge: string;
  subjectBadgeClass: string;
  typeBadge: string;
  typeBadgeClass: string;
  thumbnail: string;
  joinCode?: string;
  teacher: {
    name: string;
    avatar: string;
    role: string;
  };
  lessonsCount: number;
  studentsCount: string;
  btnGradient: string;
};

const PUBLIC_CLASSES: PublicClassItem[] = [
  {
    id: 'cmuvbigbg0001vta43ikcsjbk',
    title: 'English Grammar Mastery (45 Days)',
    description: 'Master English grammar from zero to B1 with 268 interactive spaced-repetition exercises.',
    subjectBadge: 'Grammar',
    subjectBadgeClass: 'bg-[#ede9fe]/95 text-[#4338ca] border-[#c7d2fe]/70',
    typeBadge: '🔥 Free',
    typeBadgeClass: 'bg-[#fef9c3]/95 text-[#78350f] border-[#fde047]/70',
    thumbnail: '/assests/Classes/thumbnails/class-thumb-grammar-45-days.png',
    joinCode: 'GM45VN',
    teacher: {
      name: 'Dolcake Teacher',
      avatar: '/assests/Classes/avatars/teacher-avatar-ms-jessica.png',
      role: 'Teacher',
    },
    lessonsCount: 268,
    studentsCount: '12+ students',
    btnGradient: 'from-[#6366f1] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#7c3aed] shadow-indigo-500/20',
  },
  {
    id: 'english-adventure-club',
    title: 'English Adventure Club',
    description: 'Learn English through storytelling, interactive games, and joyful daily challenges.',
    subjectBadge: 'English • Grades 2-3',
    subjectBadgeClass: 'bg-[#dcfce7]/95 text-[#14532d] border-[#86efac]/70',
    typeBadge: '🔥 Free',
    typeBadgeClass: 'bg-[#fef9c3]/95 text-[#78350f] border-[#fde047]/70',
    thumbnail: '/assests/Classes/thumbnails/class-thumb-english-adventure-club.png',
    joinCode: 'EAC23',
    teacher: {
      name: 'Ms. Jessica Nguyen',
      avatar: '/assests/Classes/avatars/teacher-avatar-ms-jessica.png',
      role: 'Teacher',
    },
    lessonsCount: 20,
    studentsCount: '120+ students',
    btnGradient: 'from-[#2dd4bf] to-[#06b6d4] hover:from-[#14b8a6] hover:to-[#0891b2] shadow-teal-500/20',
  },
  {
    id: 'phonics-happy-reading',
    title: 'Phonics & Happy Reading',
    description: 'Master phonics, correct pronunciation, and build confident reading habits.',
    subjectBadge: 'Phonics • Grades 1-2',
    subjectBadgeClass: 'bg-[#ffedd5]/95 text-[#7c2d12] border-[#fdba74]/70',
    typeBadge: '🔥 Hot',
    typeBadgeClass: 'bg-[#fee2e2]/95 text-[#991b1b] border-[#fca5a5]/70',
    thumbnail: '/assests/Classes/thumbnails/class-thumb-phonics-happy-reading.png',
    joinCode: 'PHON12',
    teacher: {
      name: 'Ms. Anna Pham',
      avatar: '/assests/Classes/avatars/teacher-avatar-ms-anna.png',
      role: 'Teacher',
    },
    lessonsCount: 12,
    studentsCount: '85+ students',
    btnGradient: 'from-[#fb923c] to-[#f43f5e] hover:from-[#f97316] hover:to-[#e11d48] shadow-rose-500/20',
  },
  {
    id: 'little-speaking-stars',
    title: 'Little Speaking Stars',
    description: 'Boost conversation skills through role-playing, dialogues, and kid-friendly topics.',
    subjectBadge: 'Speaking • Grades 3-5',
    subjectBadgeClass: 'bg-[#ede9fe]/95 text-[#4c1d95] border-[#c4b5fd]/70',
    typeBadge: '✨ Free',
    typeBadgeClass: 'bg-[#fef9c3]/95 text-[#78350f] border-[#fde047]/70',
    thumbnail: '/assests/Classes/thumbnails/class-thumb-little-speaking-stars.png',
    joinCode: 'STAR35',
    teacher: {
      name: 'Mr. David Tran',
      avatar: '/assests/Classes/avatars/teacher-avatar-mr-david.png',
      role: 'Teacher',
    },
    lessonsCount: 18,
    studentsCount: '200+ students',
    btnGradient: 'from-[#a855f7] to-[#6366f1] hover:from-[#9333ea] hover:to-[#4f46e5] shadow-indigo-500/20',
  },
];

type FormattedClassInfo = {
  id: string;
  status: string;
  joinedAt: string | Date;
  class: {
    id: string;
    name: string;
    thumbnail?: string | null;
    gradeLevel?: string | null;
    teacherName: string;
    teacherAvatar?: string | null;
    totalAssignments: number;
    completedAssignments?: number;
  };
  pendingCount: number;
  nearestDueDate?: string | null;
};

// Helper: match enrolled class with rich public class artwork / avatar / badge
function findMatchingPublicClass(clsItem: { id?: string; name?: string; teacherName?: string }) {
  const cId = (clsItem.id || '').toLowerCase();
  const cName = (clsItem.name || '').toLowerCase();

  const match = PUBLIC_CLASSES.find((p) => {
    const pId = p.id.toLowerCase();
    const pTitle = p.title.toLowerCase();
    return (
      pId === cId ||
      pTitle === cName ||
      (cName.length > 0 && pTitle.includes(cName)) ||
      (cName.length > 0 && cName.includes(pTitle))
    );
  });

  if (match) return match;

  return {
    id: clsItem.id || 'custom-class',
    title: clsItem.name || 'Lớp học Dolcake',
    description: '',
    subjectBadge: 'English • Lớp học',
    subjectBadgeClass: 'bg-[#dcfce7]/95 text-[#14532d] border-[#86efac]/70',
    typeBadge: '',
    typeBadgeClass: '',
    thumbnail: '/assests/Classes/thumbnails/class-thumb-neutral-default.jpg',
    teacher: {
      name: clsItem.teacherName || 'Giáo viên Dolcake',
      avatar: '/assests/Classes/avatars/teacher-avatar-ms-jessica.png',
      role: 'Giáo viên',
    },
    lessonsCount: 15,
    studentsCount: '30+ học viên',
    btnGradient: 'from-blue-600 to-indigo-600',
  };
}

interface EnrolledClassRowCardProps {
  item: FormattedClassInfo;
  isVi: boolean;
  enteringClassId: string | null;
  onEnter: (id: string) => void;
}

// Sub-component 1: Horizontal Row Card for Enrolled Classes (Stacks vertically on mobile)
function EnrolledClassRowCard({
  item,
  isVi,
  enteringClassId,
  onEnter,
}: EnrolledClassRowCardProps) {
  const matched = findMatchingPublicClass(item.class);
  const totalAssignments = item.class.totalAssignments;
  const completedCount = item.class.completedAssignments ?? Math.max(0, totalAssignments - (item.pendingCount ?? 0));
  const pendingCount = item.pendingCount ?? Math.max(0, totalAssignments - completedCount);
  const progressPercent = totalAssignments > 0 
    ? Math.min(100, Math.round((completedCount / totalAssignments) * 100))
    : (totalAssignments === 0 ? 100 : 0);

  const isCompleted = totalAssignments > 0 ? (completedCount >= totalAssignments || pendingCount === 0) : true;
  const isOnePending = pendingCount === 1;

  const targetClassId = item.class.id || item.id;
  const classUrl = `/student/classes/${targetClassId}`;

  // Real thumbnail and teacher avatar from database
  const thumbnailSrc = item.class.thumbnail || matched.thumbnail;
  const teacherAvatar = item.class.teacherAvatar || matched.teacher.avatar;

  return (
    <div
      className={`group bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[28px] border border-slate-200/90 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500/60 shadow-xs hover:shadow-lg transition-all duration-300 p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-5 w-full max-w-full min-w-0 overflow-hidden ${
        enteringClassId === targetClassId ? 'ring-2 ring-blue-500/80 pointer-events-none' : ''
      }`}
    >
      {/* 1. Thumbnail */}
      <Link
        href={classUrl}
        onClick={() => onEnter(targetClassId)}
        className="relative w-full md:w-36 lg:w-44 h-44 sm:h-48 md:h-24 lg:h-28 rounded-lg sm:rounded-[12px] overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 block cursor-pointer"
      >
        <Image
          src={thumbnailSrc}
          alt={item.class.name || matched.title}
          fill
          sizes="(max-width: 768px) 100vw, 180px"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </Link>

      {/* 2. Title & Teacher Info */}
      <div className="flex-1 min-w-0 md:min-w-[170px] lg:min-w-[210px] flex flex-col justify-center">
        <Link
          href={classUrl}
          onClick={() => onEnter(targetClassId)}
          className="block"
        >
          <h3 className="font-headline font-black text-slate-900 dark:text-white text-base sm:text-lg leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {item.class.name || matched.title}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <div className="relative size-6 sm:size-7 rounded-full overflow-hidden border border-white dark:border-slate-700 shadow-2xs shrink-0">
            <Image
              src={teacherAvatar}
              alt={item.class.teacherName || matched.teacher.name}
              fill
              className="object-cover"
            />
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
            {item.class.teacherName || matched.teacher.name}
          </span>
        </div>
      </div>

      {/* 3. Progress Bar */}
      <div className="w-full md:w-44 lg:w-56 shrink-0 flex flex-col justify-center min-w-0">
        <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 min-w-0">
          <span className="text-slate-500 dark:text-slate-400 shrink-0">
            {isVi ? 'Tiến độ:' : 'Progress:'}
          </span>
          <span className="font-extrabold text-slate-700 dark:text-slate-200 truncate text-right">
            {completedCount}/{totalAssignments} {isVi ? 'bài' : 'lessons'} ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700/80 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 4. Alert / To-do Chip */}
      <div className="w-full md:w-52 lg:w-60 shrink-0 min-w-0">
        {isCompleted ? (
          <div className="px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-emerald-800 dark:text-emerald-200 leading-tight truncate">
                {isVi ? '✓ Đã xong hết bài' : '✓ All caught up'}
              </p>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5 truncate">
                {isVi ? 'Tuyệt vời! Tiếp tục ôn tập nhé!' : 'Great job! Keep reviewing!'}
              </p>
            </div>
          </div>
        ) : isOnePending ? (
          <div className="px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/50 flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-rose-800 dark:text-rose-200 leading-tight truncate">
                {isVi ? '⏰ 1 bài tập cần nộp' : '⏰ 1 task due soon'}
              </p>
              <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 leading-tight mt-0.5 truncate">
                {item.nearestDueDate
                  ? `${isVi ? 'Hạn nộp: ' : 'Due: '}${new Date(item.nearestDueDate).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', month: 'numeric', day: 'numeric' })}`
                  : (isVi ? 'Hãy hoàn thành sớm nhé!' : 'Complete soon!')}
              </p>
            </div>
          </div>
        ) : (
          <div className="px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/50 flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-orange-100 dark:bg-orange-900/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-orange-800 dark:text-orange-200 leading-tight truncate">
                🔥 {pendingCount} {isVi ? 'bài mới' : 'new tasks'}
              </p>
              <p className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 leading-tight mt-0.5 truncate">
                {isVi ? 'Hãy tiếp tục học để khám phá nhé!' : 'Continue learning now!'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 5. Action Button */}
      <div className="w-full md:w-auto shrink-0 md:min-w-[130px]">
        <Link
          href={classUrl}
          prefetch={true}
          onClick={() => onEnter(targetClassId)}
          className={`w-full py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
            isCompleted
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-teal-500/20'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20'
          }`}
        >
          {enteringClassId === targetClassId ? (
            <>
              <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
              <span>{isVi ? 'Đang vào...' : 'Entering...'}</span>
            </>
          ) : (
            <>
              <span>
                {isCompleted
                  ? isVi ? 'Vào lớp học' : 'Enter Class'
                  : isVi ? 'Tiếp tục học' : 'Continue'}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Link>
      </div>
    </div>
  );
}

// Sub-component 2: Showcase Public Class Card
interface PublicClassCardProps {
  cls: PublicClassItem;
  isLoggedIn: boolean;
  onPreview?: (cls: PublicClassItem) => void;
}

function PublicClassCard({ cls, isLoggedIn, onPreview }: PublicClassCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cls.joinCode) return;
    navigator.clipboard.writeText(cls.joinCode);
    setCopied(true);
    toast.success(`Đã sao chép mã lớp: ${cls.joinCode}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[28px] sm:rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-700/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full group">
      {/* Thumbnail Container with Badges */}
      <Link
        href={`/classes/${cls.id}`}
        className="relative w-full aspect-[16/10] overflow-hidden rounded-t-[28px] sm:rounded-t-[32px] bg-slate-100 dark:bg-slate-900 block cursor-pointer"
      >
        <Image
          src={cls.thumbnail}
          alt={cls.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges on Top */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
          <span
            className={`px-3 py-1 rounded-full text-xs sm:text-[13px] font-black tracking-tight shadow-sm border backdrop-blur-md ${cls.subjectBadgeClass}`}
          >
            {cls.subjectBadge}
          </span>
          <span
            className={`px-2.5 py-1 rounded-full text-xs sm:text-[13px] font-black tracking-tight shadow-sm border backdrop-blur-md ${cls.typeBadgeClass}`}
          >
            {cls.typeBadge}
          </span>
        </div>
      </Link>

      {/* Card Body */}
      <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
        <div>
          <Link href={`/classes/${cls.id}`} className="block">
            <h3 className="font-headline font-black text-slate-900 dark:text-white text-lg sm:text-[19px] leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {cls.title}
            </h3>
          </Link>
          <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-2 mb-4 line-clamp-2 min-h-[38px]">
            {cls.description}
          </p>

          {/* Teacher & Class Code Info */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative size-10 rounded-full overflow-hidden border-2 border-white dark:border-slate-700 shadow-xs shrink-0">
              <Image
                src={cls.teacher.avatar}
                alt={cls.teacher.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col text-left min-w-0 flex-1">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  title="Bấm để sao chép mã lớp"
                  className="group/code inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-700/70 dark:hover:bg-blue-900/40 text-slate-800 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-300 border border-slate-200/80 dark:border-slate-600/80 transition-all cursor-pointer active:scale-95"
                >
                  <span className="text-xs sm:text-[13px] font-mono font-extrabold tracking-wide leading-tight">
                    Code: {cls.joinCode || '---'}
                  </span>
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400 group-hover/code:text-blue-500 transition-colors" />
                  )}
                </button>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                {cls.teacher.name}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2">
          <Link
            href={`/classes/${cls.id}`}
            className={`w-full py-3 px-4 rounded-2xl bg-gradient-to-r ${cls.btnGradient || 'from-blue-600 to-indigo-600 shadow-blue-500/20'} text-white font-black text-sm shadow-md transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer`}
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>Join Class</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Sub-component 3: Join With Code Card
function JoinWithCodeCard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="relative rounded-[28px] sm:rounded-[32px] border-2 border-dashed border-purple-200 dark:border-purple-800/80 hover:border-purple-400 bg-gradient-to-b from-[#fbfaff] via-[#f7f5ff] to-[#f3f0ff] dark:from-slate-800/80 dark:to-slate-900/80 p-6 sm:p-7 flex flex-col items-center justify-between text-center overflow-hidden hover:shadow-lg transition-all duration-300 group min-h-[380px]">
      {/* Soft decorative star graphics */}
      <div className="absolute top-4 left-4 text-purple-300/60 text-lg pointer-events-none select-none animate-pulse">✦</div>
      <div className="absolute top-7 right-5 text-amber-300/80 text-xl pointer-events-none select-none">★</div>
      <div className="absolute bottom-16 left-5 text-amber-400/80 text-sm pointer-events-none select-none">★</div>
      <div className="absolute bottom-7 right-4 text-purple-300/70 text-lg pointer-events-none select-none">✦</div>

      {/* Key Graphic Icon */}
      <div className="w-full flex justify-center pt-2 sm:pt-4 mb-2">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 transition-transform duration-300 group-hover:scale-105">
          <Image
            src="/assests/Classes/icons/join-with-code-key.png"
            alt="Join with Code"
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Title & Desc */}
      <div className="flex-1 flex flex-col items-center justify-center mb-6">
        <h3 className="text-xl sm:text-2xl font-black text-[#1e1b4b] dark:text-white font-headline leading-tight mb-2.5">
          Join with<br />Code
        </h3>
        <p className="text-xs sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-[210px] mx-auto">
          Have a class code from your teacher? Enter it to find and join your classroom.
        </p>
      </div>

      {/* CTA Button */}
      <button
        type="button"
        onClick={onOpen}
        className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-purple-50 text-[#7c3aed] font-black text-sm shadow-md shadow-purple-500/10 border border-purple-100 hover:border-purple-200 transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
      >
        <Plus className="w-4 h-4 stroke-[3]" />
        <span>+ Enter Code</span>
      </button>
    </div>
  );
}

interface StudentClassesTabProps {
  isLoggedIn: boolean;
  locale?: string;
}

export function StudentClassesTab({ isLoggedIn, locale = 'vi' }: StudentClassesTabProps) {
  const router = useRouter();
  const isVi = locale === 'vi';

  const cachedData = useContentStore((s) => (s as any).studentClasses);
  const setCachedData = useContentStore((s) => (s as any).setStudentClasses);

  const activeClasses: FormattedClassInfo[] = cachedData?.activeClasses || [];
  const pendingRequests: FormattedClassInfo[] = cachedData?.pendingRequests || [];

  const [isLoading, setIsLoading] = useState(!cachedData && isLoggedIn);
  const [error, setError] = useState<string | null>(null);

  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [enteringClassId, setEnteringClassId] = useState<string | null>(null);

  // Modal join class
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [selectedClassDetail, setSelectedClassDetail] = useState<PublicClassItem | null>(null);

  const isFetchingRef = React.useRef(false);

  const fetchClasses = async (isBackground = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!isBackground) setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/student/classes');
      if (!res.ok) {
        throw new Error('Failed to load classes');
      }
      const data = await res.json();
      setCachedData(data);
    } catch (err: any) {
      console.error('Error fetching student classes:', err);
      if (!isBackground) {
        setError(err?.message || 'Có lỗi xảy ra khi tải danh sách lớp học');
      }
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && !cachedData) {
      fetchClasses(false);
    }
  }, [isLoggedIn, cachedData]);

  const handleCancelRequest = async (classId: string) => {
    setCancelingId(classId);
    try {
      await cancelJoinRequest(classId);
      // Remove from pending list locally in store
      if (cachedData) {
        setCachedData({
          ...cachedData,
          pendingRequests: cachedData.pendingRequests.filter((item: any) => item.id !== classId)
        });
      }
    } catch (err) {
      alert(isVi ? 'Không thể hủy yêu cầu này.' : 'Failed to cancel request.');
    } finally {
      setCancelingId(null);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;
    router.push(`/join/${code}`);
  };

  // 1. Trạng thái khách (Chưa đăng nhập) - 3 Card Lớp Khám Phá Mẫu + 1 Khung Tham Gia Bằng Mã Code
  if (!isLoggedIn) {
    return (
      <div className="w-full animate-in fade-in duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
          {PUBLIC_CLASSES.map((cls) => (
            <PublicClassCard
              key={cls.id}
              cls={cls}
              isLoggedIn={false}
              onPreview={setSelectedClassDetail}
            />
          ))}

          {/* CARD 4: Tham gia bằng mã code */}
          <JoinWithCodeCard onOpen={() => setIsJoinModalOpen(true)} />
        </div>

        {/* Join Class Code Modal */}
        {isJoinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {isVi ? 'Tham gia lớp học' : 'Join Classroom'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsJoinModalOpen(false);
                    setJoinCodeInput('');
                  }}
                  className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleJoinSubmit} className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    {isVi ? 'Mã lớp học (6 ký tự)' : 'Class Code (6 characters)'}
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 2KDC6D"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    maxLength={10}
                    autoFocus
                    className="w-full text-center text-2xl font-mono font-black tracking-widest py-3 px-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none uppercase bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsJoinModalOpen(false);
                      setJoinCodeInput('');
                    }}
                    className="flex-1 py-3 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    {isVi ? 'Hủy' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={!joinCodeInput.trim()}
                    className="flex-1 py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isVi ? 'Vào lớp 🚀' : 'Join Class 🚀'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Class Detail Preview Modal */}
        {selectedClassDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-[32px] max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden space-y-0 animate-in zoom-in-95 duration-200">
              <div className="relative w-full aspect-[16/9]">
                <Image
                  src={selectedClassDetail.thumbnail}
                  alt={selectedClassDetail.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
                  <span className={`px-3 py-1 rounded-full text-xs font-black shadow-md border ${selectedClassDetail.subjectBadgeClass}`}>
                    {selectedClassDetail.subjectBadge}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedClassDetail(null)}
                    className="size-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-headline">
                    {selectedClassDetail.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed font-medium">
                    {selectedClassDetail.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
                  <div className="relative size-12 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0">
                    <Image
                      src={selectedClassDetail.teacher.avatar}
                      alt={selectedClassDetail.teacher.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 block tracking-wider mb-0.5">
                      Code: {selectedClassDetail.joinCode || selectedClassDetail.teacher.role}
                    </span>
                    <span className="text-base font-medium text-slate-700 dark:text-slate-300">
                      {selectedClassDetail.teacher.name}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-black">✓</span>
                    <span>{selectedClassDetail.lessonsCount} standard roadmap lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-black">✓</span>
                    <span>Interactive games & review flashcards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-black">✓</span>
                    <span>Assignments & teacher feedback</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedClassDetail(null)}
                    className="flex-1 py-3 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <Link
                    href={`/student/login?callbackUrl=/classes/${selectedClassDetail.id}`}
                    className={`flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r ${selectedClassDetail.btnGradient} text-white font-black text-sm shadow-lg text-center flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign in to join</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-9 w-36 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 flex flex-col md:flex-row items-center gap-4 h-32"
            >
              <div className="w-40 h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded-md" />
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded-md" />
              </div>
              <div className="w-48 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              <div className="w-32 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. Error state
  if (error) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-red-100 dark:border-red-900/30">
        <p className="text-red-600 font-bold mb-4">{error}</p>
        <button
          onClick={() => {
            fetchClasses();
          }}
          className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-white rounded-xl font-bold text-xs inline-flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Thử lại
        </button>
      </div>
    );
  }

  // =========================================================
  // FILTERING LOGIC: Ẩn các lớp học sinh ĐÃ tham gia
  // =========================================================
  const enrolledClassIds = new Set(
    activeClasses.flatMap((ac) => [
      ac.id?.toLowerCase(),
      ac.class?.id?.toLowerCase(),
    ]).filter(Boolean)
  );
  const enrolledClassNames = new Set(
    activeClasses
      .map((ac) => ac.class?.name?.trim().toLowerCase())
      .filter(Boolean)
  );

  // Khám phá thêm các lớp học: Cố định chính xác 3 lớp học mẫu tiêu biểu
  const recommendedClasses: PublicClassItem[] = PUBLIC_CLASSES;

  return (
    <div className="space-y-8 sm:space-y-10 animate-in fade-in duration-300 w-full max-w-full min-w-0">
      {/* ========================================================= */}
      {/* KHU VỰC 1: LỚP HỌC CỦA TÔI (ENROLLED CLASSES)             */}
      {/* ========================================================= */}
      <section className="space-y-5 w-full max-w-full min-w-0">
        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-headline tracking-tight flex items-center gap-2.5">
              <GraduationCap className="w-7 h-7 text-blue-600 shrink-0 stroke-[2.3]" />
              {isVi ? 'Lớp học của tôi' : 'My Classes'}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              {isVi
                ? 'Theo dõi bài tập và tham gia các lớp học của bạn'
                : 'Track your assignments and continue learning'}
            </p>
          </div>
          {activeClasses.length > 0 && (
            <button
              type="button"
              onClick={() => setIsJoinModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 dark:text-purple-300 font-bold text-xs sm:text-sm border border-purple-200 dark:border-purple-800 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isVi ? 'Nhập mã lớp' : 'Join with Code'}</span>
            </button>
          )}
        </div>

        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                <Hourglass className="w-4 h-4 animate-spin text-amber-500" style={{ animationDuration: '4s' }} />
                {isVi ? 'Đang chờ duyệt' : 'Pending Approval'}
              </span>
              <span className="h-5 px-2 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center justify-center font-bold">
                {pendingRequests.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {pendingRequests.map((item) => (
                <div
                  key={item.id}
                  className="relative p-5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-2 border-amber-200/80 dark:border-amber-700/50 rounded-[28px] shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 rounded-full">
                        {isVi ? 'Chờ duyệt' : 'Pending'}
                      </span>
                      <span className="text-[11px] font-bold text-amber-600">
                        {isVi ? 'Chờ giáo viên' : 'Waiting teacher'}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-1">
                      {item.class.name}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {isVi ? 'Giáo viên' : 'Teacher'}: {item.class.teacherName}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-amber-100 dark:border-amber-900/40">
                    <button
                      onClick={() => handleCancelRequest(item.id)}
                      disabled={cancelingId === item.id}
                      className="w-full py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {cancelingId === item.id
                        ? isVi
                          ? 'Đang hủy...'
                          : 'Canceling...'
                        : isVi
                        ? 'Hủy yêu cầu'
                        : 'Cancel request'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enrolled Classes List (Horizontal Row Cards) */}
        {activeClasses.length > 0 ? (
          <div className="space-y-4 w-full max-w-full min-w-0">
            {activeClasses.map((item) => (
              <EnrolledClassRowCard
                key={item.id || item.class.id}
                item={item}
                isVi={isVi}
                enteringClassId={enteringClassId}
                onEnter={(id) => setEnteringClassId(id)}
              />
            ))}
          </div>
        ) : (
          /* Empty State: Left Notification (70% - Desktop only) ⇄ Right Join with Code Card (30%) */
          <div className="grid grid-cols-1 md:grid-cols-10 gap-5 sm:gap-6 w-full items-stretch">
            {/* Khối 1 (Bên trái): Thông báo chưa tham gia lớp nào (70% - Ẩn trên mobile, hiện trên desktop) */}
            <div className="hidden md:flex relative rounded-[28px] border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 sm:p-7 flex-col justify-between shadow-xs transition-all duration-300 hover:shadow-md group overflow-hidden md:col-span-7">
              <div className="flex items-start gap-4 mb-5">
                <div className="size-14 sm:size-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-300">
                  <BookOpen className="w-7 h-7 stroke-[2.2]" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[11px] font-black tracking-wider uppercase">
                    {isVi ? 'CHƯA CÓ LỚP HỌC' : 'NO CLASSES YET'}
                  </span>
                  <h4 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white font-headline leading-tight">
                    {isVi ? 'Bạn chưa tham gia lớp học nào' : "You haven't joined any classes yet"}
                  </h4>
                  <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xl">
                    {isVi
                      ? 'Hãy nhập mã lớp do thầy cô cung cấp ở bên cạnh, hoặc khám phá các lớp học gợi ý bên dưới để bắt đầu học nhé!'
                      : 'Enter your class code on the right, or explore recommended classes below to start learning!'}
                  </p>
                </div>
              </div>

              {/* Nút phụ cuộn nhanh xuống danh sách lớp */}
              <button
                type="button"
                onClick={() => {
                  document.getElementById('explore-classes-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-fit self-start py-2.5 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-2xs"
              >
                <span>{isVi ? 'Khám phá lớp học bên dưới' : 'Explore classes below'}</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Khối 2 (Bên phải): Card tím - Tham gia bằng mã lớp (30% - Hiện trên cả desktop & mobile) */}
            <div className="relative rounded-[28px] border-2 border-dashed border-purple-200 dark:border-purple-800/80 hover:border-purple-400 bg-gradient-to-br from-[#faf8ff] via-[#f6f2ff] to-[#efe6ff] dark:from-slate-800/90 dark:to-purple-950/40 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 group overflow-hidden w-full md:col-span-3">
              <div className="absolute top-3 right-4 text-purple-300/60 text-xl pointer-events-none select-none">✦</div>
              <div className="absolute bottom-4 left-4 text-amber-300/80 text-lg pointer-events-none select-none">★</div>
              
              <div className="flex items-start gap-3.5 mb-4">
                <div className="relative size-12 sm:size-14 rounded-2xl bg-white dark:bg-purple-900/40 shadow-sm border border-purple-100 dark:border-purple-800/60 flex items-center justify-center shrink-0 p-2 group-hover:scale-105 transition-transform duration-300">
                  <Image
                    src="/assests/Classes/icons/join-with-code-key.png"
                    alt="Class Code"
                    fill
                    className="object-contain p-1.5"
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100/80 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[10.5px] font-black tracking-wider uppercase">
                    {isVi ? 'MÃ LỚP HỌC' : 'CLASS CODE'}
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-headline leading-tight">
                    {isVi ? 'Tham gia bằng mã lớp' : 'Join with Class Code'}
                  </h4>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-4">
                {isVi
                  ? 'Thầy cô đã gửi mã lớp cho bạn? Nhập mã 6 ký tự để vào lớp ngay.'
                  : 'Have a class code from your teacher? Enter the code to join now.'}
              </p>

              <button
                type="button"
                onClick={() => setIsJoinModalOpen(true)}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35 transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 group-hover:scale-[1.01]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{isVi ? 'Nhập mã vào lớp' : 'Enter Class Code'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* KHU VỰC 2: KHÁM PHÁ THÊM CÁC LỚP HỌC (SHOWCASE / RECOMMENDED)*/}
      {/* ========================================================= */}
      <section id="explore-classes-section" className="pt-6 sm:pt-8 border-t border-slate-200/80 dark:border-slate-800 space-y-6 w-full max-w-full min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-headline">
                {isVi ? 'Khám phá thêm các lớp học' : 'Explore More Classes'}
              </h3>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
              {isVi
                ? 'Đăng ký tham gia ngay để nhận bài học và tương tác cùng thầy cô'
                : 'Join interactive classes with teachers and start learning today'}
            </p>
          </div>
        </div>

        {/* Grid of recommended classes (filtered) + Join with code card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
          {recommendedClasses.map((cls) => (
            <PublicClassCard
              key={cls.id}
              cls={cls}
              isLoggedIn={true}
              onPreview={setSelectedClassDetail}
            />
          ))}

          {/* CARD: Tham gia bằng mã code */}
          <JoinWithCodeCard onOpen={() => setIsJoinModalOpen(true)} />
        </div>
      </section>

      {/* Join Class Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {isVi ? 'Tham gia lớp học' : 'Join Classroom'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsJoinModalOpen(false);
                  setJoinCodeInput('');
                }}
                className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  {isVi ? 'Mã lớp học (6 ký tự)' : 'Class Code (6 characters)'}
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 2KDC6D"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  maxLength={10}
                  autoFocus
                  className="w-full text-center text-2xl font-mono font-black tracking-widest py-3 px-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none uppercase bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsJoinModalOpen(false);
                    setJoinCodeInput('');
                  }}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  {isVi ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!joinCodeInput.trim()}
                  className="flex-1 py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isVi ? 'Vào lớp 🚀' : 'Join Class 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Detail Preview Modal */}
      {selectedClassDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-[32px] max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden space-y-0 animate-in zoom-in-95 duration-200">
            <div className="relative w-full aspect-[16/9]">
              <Image
                src={selectedClassDetail.thumbnail}
                alt={selectedClassDetail.title}
                fill
                className="object-cover"
              />
              <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
                <span className={`px-3 py-1 rounded-full text-xs font-black shadow-md border ${selectedClassDetail.subjectBadgeClass}`}>
                  {selectedClassDetail.subjectBadge}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedClassDetail(null)}
                  className="size-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-headline">
                  {selectedClassDetail.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed font-medium">
                  {selectedClassDetail.description}
                </p>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
                <div className="relative size-12 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0">
                  <Image
                    src={selectedClassDetail.teacher.avatar}
                    alt={selectedClassDetail.teacher.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block uppercase">
                    {selectedClassDetail.teacher.role}
                  </span>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {selectedClassDetail.teacher.name}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-black">✓</span>
                  <span>{selectedClassDetail.lessonsCount} standard roadmap lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-black">✓</span>
                  <span>Interactive games & review flashcards</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-black">✓</span>
                  <span>Assignments & teacher feedback</span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedClassDetail(null)}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <Link
                  href={`/classes/${selectedClassDetail.id}`}
                  className={`flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r ${selectedClassDetail.btnGradient} text-white font-black text-sm shadow-lg text-center flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Join Class</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
