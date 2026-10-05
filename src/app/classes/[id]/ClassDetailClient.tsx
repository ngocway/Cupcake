'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Home,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  BookOpen,
  Calendar,
  Globe,
  Play,
  FileText,
  Sparkles,
  MessageCircle,
  Gamepad2,
  Trophy,
  GraduationCap,
  Heart,
  Lock,
  ArrowRight,
  ArrowLeft,
  X,
  Volume2,
} from 'lucide-react';
import type { PublicClassDetail, ClassLangContent } from '@/lib/public-classes-data';
import { CLASS_DETAIL_UI_LABELS } from '@/lib/public-classes-data';

interface Props {
  classData: PublicClassDetail;
}

const STORAGE_LANG_KEY = 'dolcake_class_detail_lang';

export function ClassDetailClient({ classData }: Props) {
  const router = useRouter();

  // Language state: default 'en', persist to localStorage
  const [lang, setLang] = useState<'en' | 'vi'>('en');

  // Dynamic viewport height detection (Layer 3)
  const [viewportHeight, setViewportHeight] = useState<number>(900);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_LANG_KEY);
      if (savedLang === 'vi' || savedLang === 'en') {
        setLang(savedLang);
      }
    } catch {
      // LocalStorage might be restricted
    }

    const updateHeight = () => {
      setViewportHeight(window.innerHeight);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleToggleLang = (newLang: 'en' | 'vi') => {
    setLang(newLang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, newLang);
    } catch {
      // LocalStorage might be restricted
    }
  };

  // Active content based on chosen language
  const content: ClassLangContent =
    (classData[lang] as ClassLangContent) ||
    classData.en ||
    (classData as unknown as ClassLangContent);
  const labels = CLASS_DETAIL_UI_LABELS[lang] || CLASS_DETAIL_UI_LABELS.en;

  // Accordion state: default open unit-1
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>({
    'unit-1': true,
  });

  // Preview / Trial modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');

  const toggleUnit = (unitId: string) => {
    setOpenUnits((prev) => ({
      ...prev,
      [unitId]: !prev[unitId],
    }));
  };

  const handleOpenTrial = (title?: string) => {
    setPreviewTitle(title || `${labels.tryFreeBtn}: ${content.title}`);
    setIsPreviewOpen(true);
  };

  const renderWhatYouLearnIcon = (type: string, colorScheme: string) => {
    switch (type) {
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-sky-500" />;
      case 'game':
        return <Gamepad2 className="w-5 h-5 text-purple-500" />;
      case 'trophy':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'book':
        return <BookOpen className="w-5 h-5 text-rose-500" />;
      case 'mic':
        return <Volume2 className="w-5 h-5 text-purple-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-cyan-500" />;
    }
  };

  const getWhatYouLearnCardStyle = (colorScheme: string) => {
    switch (colorScheme) {
      case 'amber':
        return {
          cardBg: 'bg-[#fffbeb] border-[#fef3c7]',
          iconBg: 'bg-[#fef3c7]',
        };
      case 'sky':
        return {
          cardBg: 'bg-[#f0f9ff] border-[#e0f2fe]',
          iconBg: 'bg-[#e0f2fe]',
        };
      case 'purple':
        return {
          cardBg: 'bg-[#faf5ff] border-[#f3e8ff]',
          iconBg: 'bg-[#f3e8ff]',
        };
      case 'yellow':
        return {
          cardBg: 'bg-[#fefce8] border-[#fef9c3]',
          iconBg: 'bg-[#fef9c3]',
        };
      case 'rose':
        return {
          cardBg: 'bg-[#fff1f2] border-[#ffe4e6]',
          iconBg: 'bg-[#ffe4e6]',
        };
      case 'emerald':
        return {
          cardBg: 'bg-[#ecfdf5] border-[#d1fae5]',
          iconBg: 'bg-[#d1fae5]',
        };
      default:
        return {
          cardBg: 'bg-[#f8fafc] border-[#f1f5f9]',
          iconBg: 'bg-[#e2e8f0]',
        };
    }
  };

  const getUnitPillColor = (index: number) => {
    switch (index) {
      case 1:
        return 'bg-[#06b6d4] text-white';
      case 2:
        return 'bg-[#3b82f6] text-white';
      case 3:
        return 'bg-[#a855f7] text-white';
      case 4:
        return 'bg-[#f59e0b] text-white';
      default:
        return 'bg-[#06b6d4] text-white';
    }
  };

  const modalMessage = lang === 'en' ? labels.trialModalMsgEn : labels.trialModalMsg;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-800">
      
      {/* ─── TOP BREADCRUMB ─────────────────────────────────────────────────── */}
      <div className="w-full border-b border-slate-200/60 bg-white/70 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back();
                } else {
                  router.push('/');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:-translate-x-0.5"
              title="Back"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
              <Link 
                href="/" 
                className="hover:text-cyan-700 flex items-center gap-1.5 transition-colors"
                title={labels.breadcrumbHome}
              >
                <Home className="w-4 h-4 text-slate-400 hover:text-cyan-700" />
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <Link 
                href="/" 
                className="hover:text-cyan-700 transition-colors font-medium text-slate-600"
              >
                {labels.breadcrumbClasses}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-900 font-bold truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                {content.title}
              </span>
            </nav>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT CONTAINER ─────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: HERO, STATS, WHAT YOU LEARN, UNITS, TEACHER, REVIEWS       */}
          {/* ========================================================================= */}
          <div className="lg:col-span-8 space-y-8 sm:space-y-10 min-w-0">
            
            {/* 2. Badges, Language Toggle (Phương án A), Title, Description & Quick Stats */}
            <div className="space-y-4">
              {/* Badges & Language Toggle Row */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Left: Badges */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={`px-3.5 py-1 rounded-full text-xs font-black border ${classData.subjectBadgeClass}`}>
                    {content.subjectBadge}
                  </span>
                  <span className={`px-3.5 py-1 rounded-full text-xs font-black border ${classData.typeBadgeClass}`}>
                    {content.typeBadge}
                  </span>
                </div>

                {/* Right: Language Toggle Pill (Phương án A) */}
                <div className="inline-flex items-center p-0.5 sm:p-1 rounded-full bg-slate-100/90 border border-slate-200/90 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleToggleLang('en')}
                    className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                      lang === 'en'
                        ? 'bg-white text-cyan-700 shadow-xs'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Switch to English"
                  >
                    <span>🇺🇸</span>
                    <span>EN</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleLang('vi')}
                    className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                      lang === 'vi'
                        ? 'bg-white text-cyan-700 shadow-xs'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Chuyển sang Tiếng Việt"
                  >
                    <span>🇻🇳</span>
                    <span>VI</span>
                  </button>
                </div>
              </div>

              {/* Main Class Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-slate-900 tracking-tight font-headline leading-tight">
                {content.title}
              </h1>

              {/* Hero Description */}
              <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed max-w-3xl">
                {content.heroDescription}
              </p>

              {/* Quick Stats Horizontal Bar */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-3 text-xs sm:text-[13px] font-bold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-slate-900 font-black">{classData.rating.toFixed(1)}</span>
                  <span className="text-slate-500 font-semibold">
                    ({classData.reviewsCount} {lang === 'en' ? 'reviews' : 'đánh giá'})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-700">
                  <Users className="w-4 h-4 text-cyan-600" />
                  <span>{content.studentsCount}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-700">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>{content.lessonsCount} {labels.totalLessons}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-700">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span>{content.duration}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-700">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>{content.language}</span>
                </div>
              </div>
            </div>

            {/* 3. Section: What You Learn / Bạn sẽ học được gì? (4 cards grid) */}
            <div className="space-y-4 pt-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-headline flex items-center gap-2">
                <span>✨</span>
                <span>{labels.whatYouLearnTitle}</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {content.whatYouLearn.map((item, idx) => {
                  const style = getWhatYouLearnCardStyle(item.colorScheme);
                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl p-4.5 border flex flex-col justify-between space-y-2.5 shadow-xs transition-all hover:shadow-md hover:-translate-y-1 ${style.cardBg}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${style.iconBg}`}>
                        {renderWhatYouLearnIcon(item.iconType, item.colorScheme)}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-sm sm:text-[15px] leading-tight mb-1">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Section: Course Curriculum / Nội dung khóa học (Accordion Units) */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-headline flex items-center gap-2">
                  <span>📁</span>
                  <span>{labels.curriculumTitle}</span>
                </h2>
                <span className="text-xs sm:text-sm font-semibold text-slate-500">
                  {lang === 'en'
                    ? `${content.units.length} ${labels.totalUnits} • ${content.lessonsCount} ${labels.totalLessons}`
                    : `Tổng ${content.units.length} ${labels.totalUnits} • ${content.lessonsCount} ${labels.totalLessons}`}
                </span>
              </div>

              {/* Accordion Units List */}
              <div className="space-y-3">
                {content.units.map((unit) => {
                  const isOpen = !!openUnits[unit.id];
                  const pillColor = getUnitPillColor(unit.unitIndex);

                  return (
                    <div
                      key={unit.id}
                      className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden transition-all"
                    >
                      {/* Unit Header Bar */}
                      <button
                        type="button"
                        onClick={() => toggleUnit(unit.id)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                          <span className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center shrink-0 shadow-xs ${pillColor}`}>
                            {unit.unitIndex}
                          </span>
                          <span className="font-black text-slate-800 text-sm sm:text-base truncate">
                            {unit.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 ml-2">
                          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                            {unit.lessonsCount} {labels.totalLessons}
                          </span>
                          {unit.isFreeTrial && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] font-black text-[11px] shrink-0">
                              {labels.freeTrialBadge}
                            </span>
                          )}
                          <div className="text-slate-400 transition-transform duration-200">
                            {isOpen ? (
                              <ChevronUp className="w-5 h-5 text-slate-600" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Unit Expanded Lessons List */}
                      {isOpen && (
                        <div className="border-t border-slate-100 bg-[#f8fafc]/70 p-3 sm:p-4 space-y-2">
                          {unit.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-white border border-slate-100/90 shadow-2xs hover:border-slate-200 transition-all gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {lesson.isTrial ? (
                                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Play className="w-3 h-3 fill-white ml-0.5" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                  </div>
                                )}
                                <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                                  {lesson.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                                  {lesson.type}
                                </span>

                                {lesson.isTrial ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenTrial(lesson.title)}
                                    className="px-3 py-1 rounded-full bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#059669] border border-[#a7f3d0] font-black text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                                  >
                                    <Play className="w-3 h-3 fill-[#059669]" />
                                    <span>{labels.tryFreeBtn}</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-300">
                                    <Lock className="w-4 h-4" />
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Section: Teacher Bio Card */}
            <div className="relative overflow-hidden rounded-[32px] p-6 sm:p-8 bg-gradient-to-r from-[#eff6ff] via-[#f5f3ff] to-[#fdf2f8] border border-indigo-100/70 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Soft decorative blur circle */}
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-pink-200/30 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-blue-200/30 blur-2xl pointer-events-none" />

              {/* Teacher Avatar with Stars */}
              <div className="relative shrink-0">
                <div className="absolute -top-2 -left-1 text-amber-300 text-lg pointer-events-none animate-pulse">✦</div>
                <div className="absolute bottom-1 -right-2 text-pink-300 text-base pointer-events-none">★</div>
                
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                  <Image
                    src={content.teacher.avatar}
                    alt={content.teacher.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Teacher Info & Quote */}
              <div className="flex-1 space-y-2 text-center sm:text-left relative z-10">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-[11px] mb-1">
                  <span>👑</span>
                  <span>{labels.teacherBadge}</span>
                </span>

                <h3 className="text-2xl font-black text-slate-900 font-headline leading-tight">
                  {content.teacher.name}
                </h3>
                
                <p className="text-xs font-bold text-slate-500 pb-1">
                  {content.teacher.role}
                </p>

                <div className="space-y-1 text-xs sm:text-[13px] font-semibold text-slate-700">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>{content.teacher.degree}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Heart className="w-4 h-4 text-rose-500 shrink-0 fill-rose-500" />
                    <span>{content.teacher.experience}</span>
                  </div>
                </div>

                {/* Quote Box */}
                <div className="mt-3.5 relative p-4 rounded-2xl bg-white/80 backdrop-blur-xs border border-white/90 shadow-2xs text-xs sm:text-sm italic text-slate-600 font-medium leading-relaxed">
                  <span className="text-indigo-400 font-serif text-xl mr-1 leading-none">“</span>
                  <span>{content.teacher.quote.replace(/[“”"]/g, '')}</span>
                  <span className="text-indigo-400 font-serif text-xl ml-1 leading-none">”</span>
                </div>
              </div>
            </div>

            {/* 6. Section: Đánh giá từ phụ huynh và học viên */}
            <div className="space-y-4 pt-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-headline flex items-center gap-2">
                  <span>⭐</span>
                  <span>{labels.reviewsTitle}</span>
                </h2>
              </div>

              {/* Review Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {content.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                          <Image
                            src={rev.avatar}
                            alt={rev.author}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm leading-tight">
                            {rev.author}
                          </h4>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {[...Array(rev.stars)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] font-medium text-slate-400 shrink-0">
                        {rev.timeAgo}
                      </span>
                    </div>

                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-medium italic">
                      {rev.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: AUTO-CALCULATED VIEWPORT-RESPONSIVE STICKY ENROLL CARD       */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 sticky top-14 lg:top-16 z-20">
            <div 
              className={`rounded-[28px] bg-white border border-slate-200/80 shadow-lg flex flex-col justify-between transition-all duration-200 max-h-[calc(100dvh-4.5rem)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
                viewportHeight < 720
                  ? 'p-3 sm:p-3.5 space-y-2.5'
                  : viewportHeight < 820
                  ? 'p-3.5 sm:p-4 space-y-3'
                  : 'p-4 sm:p-5 space-y-3.5'
              }`}
            >
              
              {/* Thumbnail Image: Full 4:3 Aspect Ratio with Auto-scaled Max-Height */}
              <div 
                className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xs bg-slate-100 shrink-0 transition-all duration-300 mx-auto ${
                  viewportHeight < 720
                    ? 'max-h-[160px]'
                    : viewportHeight < 820
                    ? 'max-h-[215px]'
                    : 'max-h-[275px]'
                }`}
              >
                <Image
                  src={classData.thumbnail}
                  alt={content.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 380px"
                  className="object-cover"
                  priority
                />
              </div>

              {/* Class Title (Streamlined without duplicate badges) */}
              <div className="pt-0.5">
                <h3 className={`font-black text-slate-900 font-headline leading-tight line-clamp-2 ${
                  viewportHeight < 720 ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
                }`}>
                  {content.title}
                </h3>
              </div>

              {/* Compact 2-Column Stats Grid (Space-saving) */}
              <div className={`grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 border-y border-slate-100 ${
                viewportHeight < 720 ? 'py-1.5' : 'py-2 sm:py-2.5'
              }`}>
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  <span className="text-slate-900 font-bold">{classData.rating.toFixed(1)}</span>
                  <span className="text-slate-400 text-[11px]">({classData.reviewsCount})</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  <span className="text-[12px] truncate">{content.studentsCount}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-[12px]">{content.lessonsCount} {labels.totalLessons}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="text-[12px]">{content.duration.split('(')[0].trim()}</span>
                </div>

                <div className="col-span-2 flex items-center gap-1.5 text-[11px] text-slate-500 pt-0.5 border-t border-slate-50">
                  <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{content.language}</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className={`space-y-2 ${viewportHeight < 720 ? 'pt-0.5' : 'pt-1'}`}>
                {/* Primary Button: Tham gia lớp */}
                <Link
                  href={`/student/login?callbackUrl=/classes/${classData.id}`}
                  className={`w-full rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#0ea5e9] hover:from-[#0891b2] hover:to-[#0284c7] text-white font-black shadow-md shadow-cyan-500/25 active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${
                    viewportHeight < 720 ? 'py-2.5 px-3 text-xs sm:text-sm' : 'py-3 px-4 text-sm'
                  }`}
                >
                  <span>{labels.enrollBtn}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </Link>

                {/* Secondary Button: Học thử bài đầu tiên */}
                <button
                  type="button"
                  onClick={() =>
                    handleOpenTrial(
                      lang === 'en'
                        ? 'Lesson 1: Nice to meet you!'
                        : 'Bài 1: Nice to meet you! (Chào hỏi & Làm quen)'
                    )
                  }
                  className={`w-full rounded-xl bg-white border-2 border-[#06b6d4] hover:bg-cyan-50 text-[#0891b2] font-black active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                    viewportHeight < 720 ? 'py-2 px-3 text-[11px] sm:text-xs' : 'py-2.5 px-4 text-xs'
                  }`}
                >
                  <Play className="w-3 h-3 fill-[#0891b2]" />
                  <span>{labels.tryFirstLessonBtn}</span>
                </button>

                {/* Security lock note */}
                <p className="text-[11px] text-slate-400 font-medium text-center flex items-center justify-center gap-1 pt-0.5">
                  <Lock className="w-3 h-3" />
                  <span>{labels.loginRequiredNote}</span>
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ─── TRIAL / PREVIEW LESSON MODAL (GROUP FACEBOOK TRIAL ACCESS) ─────── */}
      {isPreviewOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div 
            className="bg-white rounded-[32px] max-w-md w-full shadow-2xl border border-slate-100 p-6 sm:p-7 relative overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col items-center text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Soft decorative background circles */}
            <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-blue-100/60 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-indigo-100/60 blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Đóng thông báo"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon Graphic */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1877F2] to-[#38bdf8] text-white flex items-center justify-center shadow-lg shadow-[#1877F2]/25 mt-1">
              <Sparkles className="w-8 h-8 drop-shadow-sm" />
            </div>

            {/* Title */}
            <h3 className="font-headline font-black text-slate-900 text-xl sm:text-[22px] leading-tight pt-1">
              {labels.trialModalTitle}
            </h3>

            {/* Exact Required Message */}
            <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-sm">
              {modalMessage}
            </p>

            {/* Facebook Group Button */}
            <div className="w-full pt-2">
              <a
                href="https://www.facebook.com/groups/2340951663410999"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-5 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-black text-sm sm:text-base shadow-lg shadow-[#1877F2]/25 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer group"
              >
                {/* Official Facebook SVG Icon */}
                <svg className="w-5 h-5 fill-current shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>{labels.joinFacebookBtn}</span>
              </a>
            </div>

            {/* Close / Dismiss Action */}
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors pt-1 cursor-pointer"
            >
              {labels.dismissBtn}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

