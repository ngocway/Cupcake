import React, { Suspense } from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { StartButton } from './StartButton';
import { 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Award, 
  BarChart3, 
  Info,
  ChevronRight,
  BookOpen,
  ChevronLeft,
  Star,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { ReviewTrigger } from '@/components/reviews/ReviewTrigger';
import { FloatingTeacherInfo } from "@/app/student/_components/FloatingTeacherInfo";
import Link from "next/link";
import BackButton from "@/components/ui/BackButton";
import { getAssignmentMeta } from './data';
import { 
  SidebarReviewsWrapper, 
  BookmarkWrapper, 
  InstructionsWrapper, 
  TeacherInfoWrapper 
} from './StreamingComponents';
import { QuizPrefetcher } from './QuizPrefetcher';
import { getTranslations, getLocale } from 'next-intl/server';

// --- Sub-components for Streaming ---

async function SubmissionHistoryWrapper({ 
  assignmentId, 
  studentId, 
  maxScore, 
  slug,
  reviewMode,
  hasAttemptsLeft,
  isDeadlinePassed,
  totalQuestions
}: { 
  assignmentId: string;
  studentId: string;
  maxScore: number;
  slug: string;
  reviewMode: string;
  hasAttemptsLeft: boolean;
  isDeadlinePassed: boolean;
  totalQuestions: number;
}) {
  const t = await getTranslations("student.assignmentRun");
  const locale = await getLocale();
  const dateLocale = locale === "vi" ? vi : enUS;

  const completedSubmissions = await prisma.submission.findMany({
    where: {
      assignmentId,
      studentId,
      submittedAt: { not: null }
    },
    orderBy: { attemptNumber: 'desc' },
    include: {
      answers: {
        select: { isCorrect: true }
      }
    }
  });

  const canReview = (sub: any) => {
    if (reviewMode === "AFTER_EACH_ATTEMPT") return true;
    if (reviewMode === "AFTER_ALL_ATTEMPTS_EXHAUSTED" && !hasAttemptsLeft) return true;
    if (reviewMode === "AFTER_DEADLINE" && isDeadlinePassed) return true;
    return false;
  }

  return (
    <div className="space-y-6 pt-4 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
         <h3 className="text-xl font-black tracking-tight uppercase italic flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            {t("submissionHistory")}
         </h3>
      </div>
      
      {completedSubmissions.length > 0 ? (
        <div className="space-y-4">
          {completedSubmissions.map((sub) => {
            const correctCount = sub.answers.filter(a => a.isCorrect).length;
            
            return (
              <div key={sub.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${correctCount >= (totalQuestions * 0.5) ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <BarChart3 className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest">{t("attempt", { number: sub.attemptNumber })}</p>
                    <h5 className="font-black text-2xl text-on-surface">
                      {t("correctAnswers", { count: correctCount, total: totalQuestions })}
                    </h5>
                    <p className="text-xs text-on-surface-variant mt-1 font-medium">
                      {sub.submittedAt ? format(sub.submittedAt, "HH:mm, dd/MM", { locale: dateLocale }) : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-10 border-2 border-dashed border-outline-variant/20 rounded-2xl flex flex-col items-center text-center space-y-4">
           <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-outline">
              <BarChart3 className="w-8 h-8" />
           </div>
           <p className="text-on-surface-variant font-medium italic">{t("noAttempts")}</p>
        </div>
      )}
    </div>
  );
}

// --- Main Page Component ---

export default async function StudentAssignmentLobbyPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ direct?: string }>
}) {
  const [sessionData, { id: paramsId }, { direct }] = await Promise.all([
    auth(),
    params,
    searchParams
  ]);
  const id = paramsId;

  if (!sessionData?.user?.id) redirect("/student/login");
  const userId = sessionData.user.id;

  // Hướng 1 & 4: Parallel queries + Meta-only fetch (Cực nhanh)
  const [assignment, submissionStatus, t, locale] = await Promise.all([
    getAssignmentMeta(id),
    prisma.submission.findMany({
      where: { assignmentId: id, studentId: userId },
      select: { id: true, submittedAt: true, attemptNumber: true },
      orderBy: { attemptNumber: 'desc' }
    }),
    getTranslations("student.assignmentRun"),
    getLocale()
  ]);

  if (!assignment) notFound();
  
  // Canonical redirect
  if (id === assignment.id && assignment.slug && id !== assignment.slug) {
    redirect(`/student/assignments/${assignment.slug}/run`);
  }

  const activeSubmission = submissionStatus.find(s => !s.submittedAt);
  const completedCount = submissionStatus.filter(s => s.submittedAt).length;
  
  const hasAttemptsLeft = completedCount < assignment.maxAttempts;
  const isDeadlinePassed = assignment.deadline ? new Date() > assignment.deadline : false;
  const totalQuestions = assignment._count.questions;
  const maxScore = assignment.defaultPoints * totalQuestions;

  // Direct start logic
  if (direct === 'true') {
    const identifier = assignment.slug || assignment.id;
    if (activeSubmission) {
      redirect(`/student/assignments/${identifier}/run/quiz?submissionId=${activeSubmission.id}`);
    } else if (hasAttemptsLeft && !isDeadlinePassed) {
      const nextAttemptNumber = completedCount + 1;
      const newSubmission = await prisma.submission.create({
        data: {
          assignmentId: assignment.id,
          studentId: userId,
          attemptNumber: nextAttemptNumber
        }
      });
      redirect(`/student/assignments/${identifier}/run/quiz?submissionId=${newSubmission.id}`);
    }
  }
  const dateLocale = locale === "vi" ? vi : enUS;

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden relative bg-slate-50 dark:bg-slate-950 font-body">
      {/* Background Pre-fetcher (Hướng 2: Sẵn sàng câu hỏi ngầm) */}
      <QuizPrefetcher assignmentId={assignment.id} />

      <div className="h-12 border-b border-outline-variant/20 flex items-center justify-between px-6 bg-white dark:bg-slate-900 shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <BackButton className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl border border-slate-200 transition-all active:scale-95">
            <ChevronLeft className="w-4 h-4" />
            {t("back")}
          </BackButton>
          <div className="h-4 w-px bg-outline-variant/20" />
          <div className="flex items-center gap-2 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em]">
            <BookOpen className="w-4 h-4 text-primary" />
            {t("assignmentDetail")}
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-[10px] font-black text-outline uppercase tracking-widest px-3 py-1 bg-surface-container rounded-full border border-outline-variant/10">
              {t("attemptsCount", { count: completedCount, total: assignment.maxAttempts })}
           </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[70%] shrink-0 flex flex-col bg-slate-50/30 dark:bg-slate-950/30 border-r border-outline-variant/30">
          <div className="flex-1 overflow-y-auto no-scrollbar p-8 lg:p-12 pl-32 lg:pl-40 space-y-12">
            
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-lg text-primary text-[10px] font-black uppercase tracking-widest">
                  <Star className="w-3 h-3 fill-primary" />
                  {t("lessonInfo")}
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tight leading-[1.1] uppercase italic font-headline max-w-3xl">
                  {assignment.title}
                </h1>
                
                {/* Streaming Teacher Info */}
                <Suspense fallback={<div className="h-12 w-40 bg-slate-100 rounded-full animate-pulse" />}>
                   <TeacherInfoWrapper id={assignment.id} />
                </Suspense>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: t("time"), value: assignment.timeLimit ? `${assignment.timeLimit}'` : t("free"), icon: Clock, color: "text-primary", bg: "bg-primary/5" },
                  { label: t("questions"), value: t("questionsCount", { count: totalQuestions }), icon: Info, color: "text-secondary", bg: "bg-secondary/5" },
                  { label: t("deadline"), value: assignment.deadline ? format(assignment.deadline, 'dd/MM', { locale: dateLocale }) : "∞", icon: Calendar, color: "text-error", bg: "bg-error/5" },
                  { label: t("attempts"), value: `${completedCount}/${assignment.maxAttempts}`, icon: Award, color: "text-amber-500", bg: "bg-amber-50" }
                ].map((stat, i) => (
                  <div key={i} className={`p-5 rounded-2xl border border-outline-variant/10 ${stat.bg} space-y-3`}>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider">{stat.label}</p>
                    <div className="flex items-center gap-2">
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      <span className="text-lg font-black text-on-surface">{stat.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {assignment.focusMode && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-6 rounded-2xl flex gap-5 animate-in slide-in-from-left-2 duration-300">
                  <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                     <AlertTriangle className="w-6 h-6 text-rose-600" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-rose-700 dark:text-rose-400 text-sm uppercase tracking-wide">{t("focusMode")}</h4>
                    <p className="text-sm text-rose-600/80 dark:text-rose-400/60 leading-relaxed font-medium">
                      {t("focusModeWarning")}
                    </p>
                  </div>
                </div>
              )}

              {/* History Section (Streamed) */}
              <Suspense fallback={<div className="h-48 bg-white dark:bg-slate-900 animate-pulse rounded-2xl" />}>
                <SubmissionHistoryWrapper 
                  assignmentId={assignment.id}
                  studentId={userId}
                  maxScore={maxScore}
                  totalQuestions={totalQuestions}
                  slug={assignment.slug || assignment.id}
                  reviewMode="AFTER_EACH_ATTEMPT" // Temporary fix or pass correctly
                  hasAttemptsLeft={hasAttemptsLeft}
                  isDeadlinePassed={isDeadlinePassed}
                />
              </Suspense>
            </div>
          </div>

          <div className="h-20 border-t border-outline-variant/20 bg-white dark:bg-slate-900 flex items-center justify-center gap-12 lg:gap-24 px-6 shrink-0 z-50">

             <div className="flex flex-col items-center">
                {activeSubmission ? (
                  <StartButton assignmentId={assignment.id} label={t("continue")} />
                ) : (hasAttemptsLeft && !isDeadlinePassed) ? (
                  <StartButton assignmentId={assignment.id} label={completedCount > 0 ? t("retry") : t("start")} />
                ) : (
                  <div className="px-10 py-3 bg-surface-container text-on-surface-variant rounded-xl font-black text-sm tracking-widest uppercase italic border border-outline-variant/20 opacity-50">
                      {t("locked")}
                  </div>
                )}
             </div>
          </div>
        </div>

        <div className="w-[30%] shrink-0 flex flex-col bg-white dark:bg-slate-900 border-l border-outline-variant/30">
          <div className="h-12 border-b border-outline-variant/20 flex items-center justify-between px-6 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
            <div className="flex items-center gap-2 text-[11px] font-black text-primary uppercase tracking-[0.2em]">
              <BookOpen className="w-4 h-4" />
              {t("resourcesAndReviews")}
            </div>
            <div className="flex items-center gap-3">
               <Suspense fallback={<div className="w-10 h-10 bg-slate-100 rounded-full animate-pulse" />}>
                  <BookmarkWrapper 
                    assignmentId={assignment.id} 
                    studentId={userId} 
                  />
               </Suspense>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-10 pb-20 space-y-12">
            {/* Streaming Instructions & Reading Text */}
            <Suspense fallback={<div className="space-y-6 animate-pulse">
               <div className="h-4 w-32 bg-slate-100 rounded" />
               <div className="h-40 bg-slate-50 rounded-2xl" />
            </div>}>
               <InstructionsWrapper id={assignment.id} />
            </Suspense>

            {/* Streaming Reviews */}
            <Suspense fallback={<div className="space-y-4 pt-10 animate-pulse">
              <div className="h-6 w-48 bg-slate-100 rounded" />
              <div className="h-32 bg-slate-100 rounded-2xl" />
            </div>}>
               <SidebarReviewsWrapper assignmentId={assignment.id} />
            </Suspense>

            <div className="pt-6">
               <ReviewTrigger type="assignment" id={assignment.id} isLoggedIn={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
