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
  History
} from 'lucide-react';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { ReviewTrigger } from '@/components/reviews/ReviewTrigger';
import { FloatingTeacherInfo } from "@/app/student/_components/FloatingTeacherInfo";
import Link from "next/link";

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
  completedSubmissions,
  maxScore,
  slug,
  reviewMode,
  hasAttemptsLeft,
  isDeadlinePassed,
  totalQuestions
}: { 
  completedSubmissions: Array<{ id: string; submittedAt: Date | null; attemptNumber: number; answers: { isCorrect: boolean | null }[] }>;
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
            <History className="w-5 h-5 text-blue-500 stroke-[2px]" />
            {t("submissionHistory")}
         </h3>
      </div>
      
      {completedSubmissions.length > 0 ? (
        <div className="space-y-4">
          {completedSubmissions.map((sub) => {
            const correctCount = sub.answers.filter(a => a.isCorrect).length;
            
            return (
              <div key={sub.id} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-500/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${correctCount >= (totalQuestions * 0.5) ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                    <BarChart3 className="w-7 h-7 stroke-[1.5px]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("attempt", { number: sub.attemptNumber })}</p>
                    <h5 className="font-black text-2xl text-slate-900 dark:text-white">
                      {t("correctAnswers", { count: correctCount, total: totalQuestions })}
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      {sub.submittedAt ? format(sub.submittedAt, "HH:mm, dd/MM", { locale: dateLocale }) : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-10 border-2 border-dashed border-slate-200/50 dark:border-slate-700/50 rounded-2xl flex flex-col items-center text-center space-y-4">
           <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 shadow-sm">
              <BarChart3 className="w-8 h-8 stroke-[1.5px]" />
           </div>
           <p className="text-slate-500 dark:text-slate-400 font-medium italic">{t("noAttempts")}</p>
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
  const [rawAssignment, allSubmissions, t, locale] = await Promise.all([
    getAssignmentMeta(id),
    // Fetch submissions once with answers included — reused for both status check and history display
    prisma.submission.findMany({
      where: { assignmentId: id, studentId: userId },
      select: {
        id: true,
        submittedAt: true,
        attemptNumber: true,
        answers: { select: { isCorrect: true } }  // Included here so SubmissionHistoryWrapper doesn't need to re-fetch
      },
      orderBy: { attemptNumber: 'desc' }
    }),
    getTranslations("student.assignmentRun"),
    getLocale()
  ]);

  if (!rawAssignment) {
    notFound();
    return null;
  }
  const assignment = rawAssignment;
  
  // Canonical redirect
  if (id === assignment.id && assignment.slug && id !== assignment.slug) {
    redirect(`/student/assignments/${assignment.slug}/run`);
  }

  const activeSubmission = allSubmissions.find(s => !s.submittedAt);
  const completedSubmissions = allSubmissions.filter(s => !!s.submittedAt);
  const completedCount = completedSubmissions.length;
  
  const hasAttemptsLeft = completedCount < assignment.maxAttempts;
  const isDeadlinePassed = assignment.deadline ? new Date() > assignment.deadline : false;
  const totalQuestions = assignment._count.questions;
  const maxScore = assignment.defaultPoints * totalQuestions;

  // ── Always go directly to quiz (no lobby) ONLY if direct === "true" and attempts are left
  const identifier = assignment.slug || assignment.id;
  if (activeSubmission) {
    redirect(`/student/assignments/${identifier}/run/quiz?submissionId=${activeSubmission.id}`);
  } else if (direct === "true" && hasAttemptsLeft && !isDeadlinePassed) {
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
  const dateLocale = locale === "vi" ? vi : enUS;

  const _lobbyNormalizedLevel = (assignment.level || "").toLowerCase().split(",")[0].trim();
  const isHighLevel = ["b1","b2","c1","c2","intermediate","upper-intermediate","upper_intermediate","advanced","proficiency"].includes(_lobbyNormalizedLevel);

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden relative font-body">
      {/* ── Background ── */}
      {isHighLevel ? (
        // B1+ → green gradient + floating decorative shapes (like HomeShell)
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-gradient-to-tr from-[#e6fcf0] via-[#f2faf5] to-[#cbf9e2]">
          <div className="absolute top-[-5%] left-[-5%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-[#6ee7b7]/65 to-transparent blur-[130px] animate-pulse" style={{ animationDuration:'10s' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tl from-[#a7f3d0]/65 to-transparent blur-[150px] animate-pulse" style={{ animationDuration:'12s' }} />
          <div className="absolute top-[15%] right-[5%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-bl from-[#5eead4]/55 to-transparent blur-[120px] animate-pulse" style={{ animationDuration:'15s' }} />
          <div className="absolute bottom-[20%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-[#fef9c3]/55 to-transparent blur-[140px] animate-pulse" style={{ animationDuration:'18s' }} />
          <div className="absolute top-[25%] left-[8%] w-[120px] h-[120px] rounded-full bg-[#34d399]/20 blur-[15px] animate-bounce" style={{ animationDuration:'8s' }} />
          <div className="absolute bottom-[35%] right-[12%] w-[150px] h-[150px] rounded-full bg-[#a3e635]/15 blur-[20px] animate-bounce" style={{ animationDuration:'10s' }} />
          <div className="absolute top-[50%] right-[25%] w-[100px] h-[100px] rounded-full bg-[#14b8a6]/18 blur-[15px] animate-pulse" style={{ animationDuration:'6s' }} />
        </div>
      ) : (
        // A1/A2 → subtle white/transparent (keep existing feel)
        <div className="fixed inset-0 -z-10 bg-slate-50/80 pointer-events-none" />
      )}
      {/* Background Pre-fetcher */}
      <QuizPrefetcher assignmentId={assignment.id} />

      <div className="h-12 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
            <BookOpen className="w-4 h-4 text-blue-500 stroke-[2px]" />
            {t("assignmentDetail")}
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              {t("attemptsCount", { count: completedCount, total: assignment.maxAttempts })}
           </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[70%] shrink-0 flex flex-col bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-800/50">
          <div className="flex-1 overflow-y-auto no-scrollbar p-8 lg:p-12 pl-32 lg:pl-40 space-y-12">
            
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest shadow-sm">
                  <Star className="w-3 h-3 fill-blue-600 dark:fill-blue-400" />
                  {t("lessonInfo")}
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] uppercase italic font-headline max-w-3xl">
                  {assignment.title}
                </h1>
                
                {/* Streaming Teacher Info */}
                <Suspense fallback={<div className="h-12 w-40 bg-slate-100 rounded-full animate-pulse" />}>
                   <TeacherInfoWrapper id={assignment.id} />
                </Suspense>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: t("time"), value: assignment.timeLimit ? `${assignment.timeLimit}'` : t("free"), icon: Clock, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/10" },
                  { label: t("questions"), value: t("questionsCount", { count: totalQuestions }), icon: Info, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/10" },
                  { label: t("deadline"), value: assignment.deadline ? format(assignment.deadline as Date, 'dd/MM', { locale: dateLocale }) : "∞", icon: Calendar, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/10" },
                  { label: t("attempts"), value: `${completedCount}/${assignment.maxAttempts}`, icon: Award, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/10" }
                ].map((stat, i) => (
                  <div key={i} className={`p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/30 ${stat.bg} space-y-3 shadow-sm backdrop-blur-sm`}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    <div className="flex items-center gap-2">
                      <stat.icon className={`w-5 h-5 ${stat.color} stroke-[2px]`} />
                      <span className="text-lg font-black text-slate-900 dark:text-white">{stat.value}</span>
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
                completedSubmissions={completedSubmissions}
                maxScore={maxScore}
                totalQuestions={totalQuestions}
                slug={assignment.slug || assignment.id}
                reviewMode="AFTER_EACH_ATTEMPT"
                hasAttemptsLeft={hasAttemptsLeft}
                isDeadlinePassed={isDeadlinePassed}
              />
              </Suspense>
            </div>
          </div>

          <div className="h-20 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex items-center justify-center gap-12 lg:gap-24 px-6 shrink-0 z-50">

             <div className="flex flex-col items-center">
                {activeSubmission ? (
                  <StartButton assignmentId={assignment.id} label={t("continue")} />
                ) : (hasAttemptsLeft && !isDeadlinePassed) ? (
                  <StartButton assignmentId={assignment.id} label={completedCount > 0 ? t("retry") : t("start")} />
                ) : (
                  <div className="px-10 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl font-black text-sm tracking-widest uppercase italic border border-slate-200/50 dark:border-slate-700/50 opacity-50 shadow-sm">
                      {t("locked")}
                  </div>
                )}
             </div>
          </div>
        </div>

        <div className="w-[30%] shrink-0 flex flex-col bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-l border-slate-200/50 dark:border-slate-800/50">
          <div className="h-12 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-6 bg-white/50 dark:bg-slate-800/50 shrink-0">
            <div className="flex items-center gap-2 text-[11px] font-black text-blue-500 uppercase tracking-[0.2em]">
              <BookOpen className="w-4 h-4 stroke-[2px]" />
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
