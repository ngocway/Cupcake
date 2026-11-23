'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Gamepad2,
  MessageCircle,
  ClipboardCheck,
  Layers,
  Loader2,
} from 'lucide-react';
import { LoginModal } from '@/components/LoginButton';

interface Props {
  isLoggedIn: boolean;
  currentGrade: number | null;
}

const STORAGE_LANG_KEY = 'dolcake_class_detail_lang';

interface GradeCardInfo {
  grade: number;
  emoji: string;
  unitsCount: number;
  gradient: string;
  cardBg: string;
  border: string;
  btnGradient: string;
  titleVi: string;
  titleEn: string;
  subVi: string;
  subEn: string;
  highlightsVi: string[];
  highlightsEn: string[];
}

const GRADE_CARDS: GradeCardInfo[] = [
  {
    grade: 1,
    emoji: '🐣',
    unitsCount: 16,
    gradient: 'from-amber-400 via-orange-400 to-rose-400',
    cardBg: 'from-amber-50/80 via-white to-orange-50/40',
    border: 'border-amber-200/90 hover:border-amber-400',
    btnGradient: 'from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 shadow-orange-500/25',
    titleVi: 'Global Success Lớp 1',
    titleEn: 'Global Success Grade 1',
    subVi: '16 Đảo Unit • Học kỳ 1 & 2',
    subEn: '16 Unit Islands • Semester 1 & 2',
    highlightsVi: ['In the school playground', 'At the zoo', 'In the toy shop'],
    highlightsEn: ['In the school playground', 'At the zoo', 'In the toy shop'],
  },
  {
    grade: 2,
    emoji: '🐬',
    unitsCount: 16,
    gradient: 'from-sky-400 via-cyan-400 to-blue-500',
    cardBg: 'from-sky-50/80 via-white to-cyan-50/40',
    border: 'border-sky-200/90 hover:border-sky-400',
    btnGradient: 'from-sky-500 via-cyan-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-sky-500/25',
    titleVi: 'Global Success Lớp 2',
    titleEn: 'Global Success Grade 2',
    subVi: '16 Đảo Unit • Học kỳ 1 & 2',
    subEn: '16 Unit Islands • Semester 1 & 2',
    highlightsVi: ['At my birthday party', 'At the seaside', 'On the farm'],
    highlightsEn: ['At my birthday party', 'At the seaside', 'On the farm'],
  },
  {
    grade: 3,
    emoji: '🦊',
    unitsCount: 20,
    gradient: 'from-emerald-400 via-teal-400 to-green-500',
    cardBg: 'from-emerald-50/80 via-white to-teal-50/40',
    border: 'border-emerald-200/90 hover:border-emerald-400',
    btnGradient: 'from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/25',
    titleVi: 'Global Success Lớp 3',
    titleEn: 'Global Success Grade 3',
    subVi: '20 Đảo Unit • Học kỳ 1 & 2',
    subEn: '20 Unit Islands • Semester 1 & 2',
    highlightsVi: ['Hello & My hobbies', 'My family & Jobs', 'Outdoor activities'],
    highlightsEn: ['Hello & My hobbies', 'My family & Jobs', 'Outdoor activities'],
  },
  {
    grade: 4,
    emoji: '🦄',
    unitsCount: 20,
    gradient: 'from-violet-400 via-purple-500 to-indigo-500',
    cardBg: 'from-violet-50/80 via-white to-indigo-50/40',
    border: 'border-violet-200/90 hover:border-violet-400',
    btnGradient: 'from-violet-500 via-purple-600 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-violet-500/25',
    titleVi: 'Global Success Lớp 4',
    titleEn: 'Global Success Grade 4',
    subVi: '20 Đảo Unit • Học kỳ 1 & 2',
    subEn: '20 Unit Islands • Semester 1 & 2',
    highlightsVi: ['Time & daily routines', 'Our sports day', 'At summer camp'],
    highlightsEn: ['Time & daily routines', 'Our sports day', 'At summer camp'],
  },
  {
    grade: 5,
    emoji: '🚀',
    unitsCount: 20,
    gradient: 'from-pink-400 via-rose-500 to-fuchsia-500',
    cardBg: 'from-pink-50/80 via-white to-rose-50/40',
    border: 'border-pink-200/90 hover:border-pink-400',
    btnGradient: 'from-pink-500 via-rose-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 shadow-rose-500/25',
    titleVi: 'Global Success Lớp 5',
    titleEn: 'Global Success Grade 5',
    subVi: '20 Đảo Unit • Học kỳ 1 & 2',
    subEn: '20 Unit Islands • Semester 1 & 2',
    highlightsVi: ['My future job', 'Our Tet holiday', 'Our summer holidays'],
    highlightsEn: ['My future job', 'Our Tet holiday', 'Our summer holidays'],
  },
];

export function GlobalSuccessPrimaryLandingClient({ isLoggedIn, currentGrade }: Props) {
  const router = useRouter();
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [joiningGrade, setJoiningGrade] = useState<number | null>(null);
  const [loginModalGrade, setLoginModalGrade] = useState<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY);
      if (saved === 'en' || saved === 'vi') {
        setLang(saved);
      }
    } catch {}
  }, []);

  const handleToggleLang = (next: 'vi' | 'en') => {
    setLang(next);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, next);
    } catch {}
  };

  const isVi = lang === 'vi';

  const handleJoinGrade = async (grade: number) => {
    setJoiningGrade(grade);
    try {
      await fetch('/api/student/global-success-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setGrade', grade }),
      });
    } catch {}

    if (!isLoggedIn) {
      setJoiningGrade(null);
      setLoginModalGrade(grade);
      return;
    }

    router.push(`/student/classes/global-success-primary?grade=${grade}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50/90 via-white to-indigo-50/70 pb-16">
      {/* Compact Top Bar */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isVi ? 'Quay lại' : 'Back'}</span>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider">
                  Global Success
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                  🔥 {isVi ? 'Miễn phí' : 'Free'}
                </span>
              </div>
              <h1 className="font-headline font-black text-sm sm:text-lg text-slate-800 truncate leading-tight mt-0.5">
                {isVi
                  ? 'Tiếng Anh Global Success Tiểu học (Lớp 1–5)'
                  : 'Global Success Primary English (Grades 1–5)'}
              </h1>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-black shrink-0">
            <button
              type="button"
              onClick={() => handleToggleLang('en')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                !isVi ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleToggleLang('vi')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                isVi ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              VI
            </button>
          </div>
        </div>
      </header>

      {/* Main Content — 5 Grade Cards */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-headline font-black text-2xl sm:text-4xl text-slate-900 leading-tight">
            {isVi ? 'Chọn Lớp Global Success Của Bé 🎒' : 'Choose Your Global Success Grade 🎒'}
          </h2>
        </div>

        {/* 5-Card Grid (3 top + 2 bottom centered on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
          {GRADE_CARDS.map((card, idx) => {
            const isCurrent = isLoggedIn && currentGrade === card.grade;
            const isJoining = joiningGrade === card.grade;
            const colSpanClass =
              idx < 3
                ? 'lg:col-span-2'
                : idx === 3
                  ? 'lg:col-span-2 lg:col-start-2'
                  : 'lg:col-span-2 lg:col-start-4';

            return (
              <div
                key={card.grade}
                className={`${colSpanClass} group relative bg-gradient-to-br ${card.cardBg} rounded-[28px] border-2 ${card.border} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-5 sm:p-6 flex flex-col justify-between gap-5`}
              >
                {/* Top Header */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-3xl shadow-md group-hover:scale-105 transition-transform`}
                    >
                      {card.emoji}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/90 border border-slate-200 text-slate-700 text-[11px] font-black shadow-2xs">
                        🔥 {isVi ? 'Miễn phí' : 'Free'}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black shadow-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isVi ? 'Đang học' : 'Active'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-headline font-black text-xl text-slate-900 leading-snug">
                      {isVi ? card.titleVi : card.titleEn}
                    </h3>
                    <p className="text-xs font-extrabold text-indigo-600 mt-1">
                      {isVi ? card.subVi : card.subEn}
                    </p>
                  </div>

                  {/* 5 Stations Mini Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 border border-emerald-200/80 text-emerald-700 text-[11px] font-bold">
                      <Layers className="w-3 h-3" />
                      {isVi ? 'Từ vựng' : 'Vocab'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 border border-amber-200/80 text-amber-700 text-[11px] font-bold">
                      <MessageCircle className="w-3 h-3" />
                      {isVi ? 'Hội thoại' : 'Conversations'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 border border-violet-200/80 text-violet-700 text-[11px] font-bold">
                      <BookOpen className="w-3 h-3" />
                      {card.grade <= 2
                        ? isVi
                          ? 'Mẫu câu'
                          : 'Key Sentences'
                        : isVi
                          ? 'Ngữ pháp'
                          : 'Grammar'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 border border-rose-200/80 text-rose-700 text-[11px] font-bold">
                      <Gamepad2 className="w-3 h-3" />
                      Game
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 border border-sky-200/80 text-sky-700 text-[11px] font-bold">
                      <ClipboardCheck className="w-3 h-3" />
                      {isVi ? 'Tổng hợp' : 'Review'}
                    </span>
                  </div>

                  {/* Sample Unit Highlights */}
                  <div className="rounded-2xl bg-white/80 border border-slate-200/70 px-3.5 py-2.5 space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {isVi ? 'Chủ đề tiêu biểu' : 'Featured Units'}
                    </div>
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                      {(isVi ? card.highlightsVi : card.highlightsEn).join(' • ')}…
                    </p>
                  </div>
                </div>

                {/* Join Class CTA Button */}
                <button
                  type="button"
                  disabled={joiningGrade !== null}
                  onClick={() => handleJoinGrade(card.grade)}
                  className={`w-full py-3 px-5 rounded-2xl bg-gradient-to-r ${card.btnGradient} text-white font-headline font-black text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70`}
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isVi ? 'Đang mở lớp...' : 'Opening...'}</span>
                    </>
                  ) : isCurrent ? (
                    <>
                      <span>{isVi ? 'Vào học ngay' : 'Continue Learning'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>{isVi ? 'Vào học ngay' : 'Join Class'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </main>

      {/* Login Modal for Guest clicking Join Class on a Grade */}
      <LoginModal
        isOpen={loginModalGrade !== null}
        onClose={() => setLoginModalGrade(null)}
        defaultView="studentLogin"
        callbackUrl={
          loginModalGrade
            ? `/student/classes/global-success-primary?grade=${loginModalGrade}`
            : '/student/classes/global-success-primary'
        }
        joinNotice={
          loginModalGrade
            ? {
                className: isVi
                  ? `Global Success Lớp ${loginModalGrade}`
                  : `Global Success Grade ${loginModalGrade}`,
              }
            : undefined
        }
        onLoginSuccess={() => {
          const targetGrade = loginModalGrade || 1;
          setLoginModalGrade(null);
          router.push(`/student/classes/global-success-primary?grade=${targetGrade}`);
        }}
      />
    </div>
  );
}
