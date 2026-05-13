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
import { vi } from 'date-fns/locale';
import { ReviewTrigger } from '@/components/reviews/ReviewTrigger';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { ReviewList } from "@/components/reviews/ReviewList";
import { FloatingTeacherInfo } from "@/app/student/_components/FloatingTeacherInfo";
import Link from "next/link";

// --- Sub-components for Streaming ---

async function SubmissionHistoryWrapper({ 
  assignmentId, 
  studentId, 
  maxScore, 
  slug,
  reviewMode,
  hasAttemptsLeft,
  isDeadlinePassed
}: { 
  assignmentId: string;
  studentId: string;
  maxScore: number;
  slug: string;
  reviewMode: string;
  hasAttemptsLeft: boolean;
  isDeadlinePassed: boolean;
}) {
  const completedSubmissions = await prisma.submission.findMany({
    where: {
      assignmentId,
      studentId,
      submittedAt: { not: null }
    },
    orderBy: { attemptNumber: 'desc' },
    select: {
      id: true,
      attemptNumber: true,
      score: true,
      submittedAt: true
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
            Lịch sử làm bài
         </h3>
      </div>
      
      {completedSubmissions.length > 0 ? (
        <div className="space-y-4">
          {completedSubmissions.map((sub) => {
            const isPassed = (sub.score || 0) >= (maxScore * 0.5);
            const showReview = canReview(sub);
            return (
              <div key={sub.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${isPassed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <BarChart3 className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Lần làm {sub.attemptNumber}</p>
                    <h5 className="font-black text-2xl text-on-surface">
                      {sub.score || 0} <span className="text-sm font-medium text-on-surface-variant">/ {maxScore} điểm</span>
                    </h5>
                    <p className="text-xs text-on-surface-variant mt-1 font-medium">
                      {sub.submittedAt ? format(sub.submittedAt, "HH:mm, dd/MM", { locale: vi }) : "N/A"}
                    </p>
                  </div>
                </div>
                
                <a 
                  href={`/student/assignments/${slug}/review/${sub.id}?showAnswers=${showReview}`}
                  className={`px-6 h-12 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                    showReview 
                    ? "bg-slate-900 dark:bg-primary text-white hover:scale-105 active:scale-95 shadow-lg shadow-slate-900/10" 
                    : "bg-surface-container text-on-surface-variant cursor-not-allowed pointer-events-none opacity-50"
                  }`}
                >
                  {showReview ? "Xem lại đáp án" : "Review đã khóa"}
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-10 border-2 border-dashed border-outline-variant/20 rounded-2xl flex flex-col items-center text-center space-y-4">
           <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-outline">
              <BarChart3 className="w-8 h-8" />
           </div>
           <p className="text-on-surface-variant font-medium italic">Bạn chưa thực hiện lần thử nào cho bài tập này.</p>
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
  const [sessionData, { id }, { direct }] = await Promise.all([
    auth(),
    params,
    searchParams
  ]);

  const session = sessionData?.user ? {
    id: sessionData.user.id!,
    name: sessionData.user.name ?? null,
    image: sessionData.user.image ?? null,
    role: sessionData.user.role ?? null,
  } : null;

  if (!session) redirect("/login");

  // Fetch only what's needed for the Lobby shell and logic
  const assignment = await prisma.assignment.findFirst({
    where: {
      OR: [{ id }, { slug: id }]
    },
    select: {
      id: true,
      slug: true,
      title: true,
      instructions: true,
      readingText: true,
      timeLimit: true,
      deadline: true,
      maxAttempts: true,
      defaultPoints: true,
      reviewMode: true,
      focusMode: true,
      teacher: {
        select: {
          id: true,
          name: true,
          image: true,
          professionalTitle: true,
          bio: true,
          isPortfolioPublished: true,
          _count: { select: { lessons: true, assignments: true } }
        }
      },
      _count: { select: { questions: true } },
      favoriteAssignments: {
        where: { studentId: session.id },
        select: { studentId: true }
      },
      reviews: {
        where: { isApproved: true },
        take: 3, // Only show 3 reviews initially
        include: { student: { select: { name: true, image: true } } }
      }
    }
  });

  if (!assignment) notFound();
  
  // Canonical redirect
  if (id === assignment.id && assignment.slug && id !== assignment.slug) {
    redirect(`/student/assignments/${assignment.slug}/run`);
  }

  // Quick check for submission status (minimal query)
  const submissionStatus = await prisma.submission.findMany({
    where: { assignmentId: assignment.id, studentId: session.id },
    select: { id: true, submittedAt: true, attemptNumber: true },
    orderBy: { attemptNumber: 'desc' }
  });

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
          studentId: session.id,
          attemptNumber: nextAttemptNumber
        }
      });
      redirect(`/student/assignments/${identifier}/run/quiz?submissionId=${newSubmission.id}`);
    }
  }

  const isBookmarked = assignment.favoriteAssignments.length > 0;

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden relative bg-slate-50 dark:bg-slate-950 font-body">
      <FloatingTeacherInfo teacher={assignment.teacher as any} />
      
      <div className="h-12 border-b border-outline-variant/20 flex items-center justify-between px-6 bg-white dark:bg-slate-900 shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em]">
          <BookOpen className="w-4 h-4 text-primary" />
          Chi tiết bài tập
        </div>
        <div className="flex items-center gap-4">
           <div className="text-[10px] font-black text-outline uppercase tracking-widest px-3 py-1 bg-surface-container rounded-full border border-outline-variant/10">
              {completedCount} / {assignment.maxAttempts} Lượt đã thực hiện
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
                  Thông tin bài học
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tight leading-[1.1] uppercase italic font-headline max-w-3xl">
                  {assignment.title}
                </h1>
                
                <div className="flex items-center gap-3 py-2">
                   <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-black">
                      {assignment.teacher.name?.charAt(0) || "T"}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Giảng viên</span>
                      <span className="text-sm font-black text-on-surface">{assignment.teacher.name || "Cố định"}</span>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Thời gian", value: assignment.timeLimit ? `${assignment.timeLimit}'` : "Free", icon: Clock, color: "text-primary", bg: "bg-primary/5" },
                  { label: "Số câu", value: `${totalQuestions} Câu`, icon: Info, color: "text-secondary", bg: "bg-secondary/5" },
                  { label: "Hạn nộp", value: assignment.deadline ? format(assignment.deadline, 'dd/MM') : "∞", icon: Calendar, color: "text-error", bg: "bg-error/5" },
                  { label: "Lượt làm", value: `${completedCount}/${assignment.maxAttempts}`, icon: Award, color: "text-amber-500", bg: "bg-amber-50" }
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
                    <h4 className="font-black text-rose-700 dark:text-rose-400 text-sm uppercase tracking-wide">Chế độ tập trung (Focus Mode)</h4>
                    <p className="text-sm text-rose-600/80 dark:text-rose-400/60 leading-relaxed font-medium">
                      Bài làm sẽ tự động nộp nếu bạn thoát màn hình hoặc chuyển tab quá 3 lần.
                    </p>
                  </div>
                </div>
              )}

              {/* History Section (Streamed) */}
              <Suspense fallback={<div className="h-48 bg-white dark:bg-slate-900 animate-pulse rounded-2xl" />}>
                <SubmissionHistoryWrapper 
                  assignmentId={assignment.id}
                  studentId={session.id}
                  maxScore={maxScore}
                  slug={assignment.slug || assignment.id}
                  reviewMode={assignment.reviewMode}
                  hasAttemptsLeft={hasAttemptsLeft}
                  isDeadlinePassed={isDeadlinePassed}
                />
              </Suspense>
            </div>
          </div>

          <div className="h-20 border-t border-outline-variant/20 bg-white dark:bg-slate-900 flex items-center justify-center gap-12 lg:gap-24 px-6 shrink-0 z-50">
             <Link 
                href="/student/library"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm text-on-surface-variant uppercase tracking-widest hover:bg-surface-container transition-all italic"
             >
                <ChevronLeft className="w-5 h-5" />
                Quay lại
             </Link>

             <div className="flex flex-col items-center">
                {activeSubmission ? (
                  <StartButton assignmentId={assignment.id} label="TIẾP TỤC" />
                ) : (hasAttemptsLeft && !isDeadlinePassed) ? (
                  <StartButton assignmentId={assignment.id} label={completedCount > 0 ? "LÀM LẠI" : "BẮT ĐẦU"} />
                ) : (
                  <div className="px-10 py-3 bg-surface-container text-on-surface-variant rounded-xl font-black text-sm tracking-widest uppercase italic border border-outline-variant/20 opacity-50">
                      Đã khóa
                  </div>
                )}
             </div>
          </div>
        </div>

        <div className="w-[30%] shrink-0 flex flex-col bg-white dark:bg-slate-900 border-l border-outline-variant/30">
          <div className="h-12 border-b border-outline-variant/20 flex items-center justify-between px-6 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
            <div className="flex items-center gap-2 text-[11px] font-black text-primary uppercase tracking-[0.2em]">
              <BookOpen className="w-4 h-4" />
              Tài liệu & Đánh giá
            </div>
            <div className="flex items-center gap-3">
               <BookmarkButton 
                  type="assignment" 
                  id={assignment.id} 
                  initialIsBookmarked={isBookmarked} 
                  className="scale-90"
               />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-10 pb-20 space-y-12">
            {assignment.instructions && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
                  <span className="material-symbols-outlined text-sm">menu_book</span>
                  Hướng dẫn làm bài
                </div>
                <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-loose prose-p:text-sm bg-primary/5 p-6 rounded-2xl border border-primary/10">
                  <div dangerouslySetInnerHTML={{ __html: assignment.instructions }} />
                </div>
              </div>
            )}

            {assignment.readingText && (
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-secondary font-black text-xs uppercase tracking-widest">
                    <span className="material-symbols-outlined text-sm">description</span>
                    Tài liệu đi kèm
                  </div>
                  <div className="p-5 bg-secondary/5 rounded-2xl border border-secondary/10 flex items-center justify-between group cursor-pointer hover:bg-secondary/10 transition-all">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-secondary shadow-sm">
                           <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-black text-on-surface">Đọc tài liệu lý thuyết</span>
                     </div>
                     <ChevronRight className="w-5 h-5 text-secondary transform group-hover:translate-x-1 transition-transform" />
                  </div>
               </div>
            )}

            {(assignment.reviews || []).length > 0 && (
              <div className="border-t border-outline-variant/20 pt-10 space-y-8">
                 <div className="space-y-1">
                    <h3 className="text-xl font-black tracking-tight italic uppercase">Phản hồi học viên</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cảm nhận từ những người đã hoàn thành</p>
                 </div>
                 <ReviewList reviews={assignment.reviews as any} />
              </div>
            )}

            <div className="pt-6">
               <ReviewTrigger type="assignment" id={assignment.id} isLoggedIn={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
