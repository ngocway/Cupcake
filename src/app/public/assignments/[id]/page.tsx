
import React from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { StartButton } from '@/app/student/assignments/[id]/run/StartButton';
import { 
  Globe, 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Award, 
  BarChart3, 
  Info,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Share2,
  Bookmark
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ReviewTrigger } from '@/components/reviews/ReviewTrigger';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { PublicHeader } from "@/components/public/PublicHeader";
import Link from "next/link";
import QuizClientRunner from "@/app/student/assignments/[id]/run/quiz/QuizClientRunner";

export default async function PublicAssignmentPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ direct?: string }>
}) {
  const sessionData = await auth();
  const session = sessionData?.user ? {
    id: sessionData.user.id!,
    name: sessionData.user.name ?? null,
    image: sessionData.user.image ?? null,
    role: sessionData.user.role ?? null,
  } : null;

  const { id } = await params;
  const { direct } = await searchParams;
  
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      teacher: {
        include: {
          _count: {
            select: {
               lessons: true,
               assignments: true
            }
          }
        }
      },
      _count: {
        select: { questions: true }
      },
      ...(session ? {
        favoriteAssignments: {
          where: { studentId: session.id }
        }
      } : {})
    }
  });

  if (!assignment) notFound();

  const submissions = session ? await prisma.submission.findMany({
    where: {
      assignmentId: id,
      studentId: session.id
    },
    orderBy: {
      attemptNumber: 'desc'
    }
  }) : [];

  const activeSubmission = submissions.find(s => !s.submittedAt);
  const completedSubmissions = submissions.filter(s => s.submittedAt);
  
  const hasAttemptsLeft = completedSubmissions.length < assignment.maxAttempts;
  const nextAttemptNumber = completedSubmissions.length + 1;
  const isDeadlinePassed = assignment.deadline ? new Date() > assignment.deadline : false;
  
  const totalQuestions = assignment._count.questions;
  const maxScore = assignment.defaultPoints * totalQuestions;

  // Direct jump logic for guests
  if (!session && direct === 'true') {
    // Fetch questions and related data for the runner
    const questions = await prisma.question.findMany({
      where: { assignmentId: id },
      orderBy: { orderIndex: 'asc' }
    });

    const tags = assignment.tags?.split(',').map(t => t.trim()).filter(Boolean) || [];
    const relatedAssignments = await prisma.assignment.findMany({
      where: {
        status: 'PUBLIC',
        id: { not: id },
        OR: [
          { teacherId: assignment.teacherId },
          {
            OR: tags.map(tag => ({
              tags: { contains: tag }
            }))
          }
        ]
      },
      take: 5,
      include: {
        teacher: {
          select: { name: true, image: true }
        }
      }
    });

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
         <QuizClientRunner 
            assignment={assignment}
            questions={questions}
            initialAnswers={{}}
            isBookmarked={false}
            initialReview={null}
            allReviews={assignment.reviews || []}
            relatedAssignments={relatedAssignments}
            isGuest={true}
         />
      </div>
    );
  }

  // Direct start logic for logged in users
  if (session && direct === 'true') {
    if (activeSubmission) {
      redirect(`/student/assignments/${id}/run/quiz?submissionId=${activeSubmission.id}`);
    } else if (hasAttemptsLeft && !isDeadlinePassed) {
      const newSubmission = await prisma.submission.create({
        data: {
          assignmentId: id,
          studentId: session.id,
          attemptNumber: nextAttemptNumber
        }
      });
      redirect(`/student/assignments/${id}/run/quiz?submissionId=${newSubmission.id}`);
    }
  }

  const canReview = (sub: any) => {
    if (assignment.reviewMode === "AFTER_EACH_ATTEMPT") return true;
    if (assignment.reviewMode === "AFTER_ALL_ATTEMPTS_EXHAUSTED" && !hasAttemptsLeft) return true;
    if (assignment.reviewMode === "AFTER_DEADLINE" && isDeadlinePassed) return true;
    return false;
  }

  const isBookmarked = session ? (assignment as any).favoriteAssignments?.length > 0 : false;

  return (
    <div className="min-h-screen bg-surface-container-low/30 pb-20 font-body">
      <PublicHeader session={session} />
      
      {/* Hero Section */}
      <div className="bg-white dark:bg-slate-950 border-b border-outline-variant/30 pt-20">
        <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col items-center text-center relative">
          {session && (
            <div className="absolute top-8 right-6">
              <BookmarkButton 
                type="assignment" 
                id={id} 
                initialIsBookmarked={isBookmarked} 
                className="scale-125"
              />
            </div>
          )}
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary/5">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <p className="text-primary font-bold text-xs uppercase tracking-[0.2em] mb-2">Thông tin bài tập</p>
          <h1 className="text-3xl md:text-5xl font-black text-on-surface tracking-tight max-w-2xl leading-tight uppercase italic font-headline">
            {assignment.title}
          </h1>
          <div className="flex items-center gap-2 mt-6 px-4 py-2 bg-surface-container rounded-full">
            <div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-[10px] font-bold">
               {assignment.teacher.name?.charAt(0) || "T"}
            </div>
            <span className="text-sm font-medium text-on-surface-variant">Giáo viên: {assignment.teacher.name || "Cố định"}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Info Dashboard */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-magazine-shadow border border-outline-variant/20 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Thời gian</p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-black text-on-surface">{assignment.timeLimit ? `${assignment.timeLimit}'` : "Free"}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Số câu</p>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-secondary" />
                <span className="font-black text-on-surface">{totalQuestions} Câu</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Hạn nộp</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-error" />
                <span className="font-black text-on-surface">
                  {assignment.deadline ? format(assignment.deadline, 'dd/MM') : "∞"}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Lượt làm</p>
              <div className="flex items-center gap-2">
                < Award className="w-4 h-4 text-tertiary" />
                <span className="font-black text-on-surface">{completedSubmissions.length}/{assignment.maxAttempts}</span>
              </div>
            </div>
          </div>

          {/* Warnings & Focus Mode */}
          {assignment.focusMode && (
             <div className="bg-error-container/20 border border-error/20 p-6 rounded-3xl flex gap-4">
                <AlertTriangle className="w-6 h-6 text-error shrink-0" />
                <div className="space-y-1">
                   <h4 className="font-bold text-error">Chế độ tập trung (Focus Mode)</h4>
                   <p className="text-sm text-on-surface-variant leading-relaxed">
                      Bài làm sẽ tự động nộp nếu bạn thoát màn hình hoặc chuyển tab quá 3 lần.
                   </p>
                </div>
             </div>
          )}

          {/* History & Review */}
          <div className="space-y-6">
            <h3 className="text-xl font-black tracking-tight uppercase italic">Lịch sử làm bài</h3>
            {session ? (
               completedSubmissions.length > 0 ? (
                  <div className="space-y-4">
                     {completedSubmissions.map((sub) => {
                       const isPassed = (sub.score || 0) >= (maxScore * 0.5);
                       const showReview = canReview(sub);
                       return (
                         <div key={sub.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-outline-variant/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-4">
                               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isPassed ? 'bg-secondary-container/20 text-secondary' : 'bg-error-container/20 text-error'}`}>
                                  <BarChart3 className="w-7 h-7" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Lần làm {sub.attemptNumber}</p>
                                  <h5 className="font-black text-xl">
                                     {sub.score || 0} <span className="text-sm font-medium text-on-surface-variant">/ {maxScore} điểm</span>
                                  </h5>
                                  <p className="text-xs text-on-surface-variant mt-1">
                                     {sub.submittedAt ? format(sub.submittedAt, "HH:mm, dd/MM", { locale: vi }) : "N/A"}
                                  </p>
                               </div>
                            </div>
                            
                            <a 
                               href={`/student/assignments/${id}/review/${sub.id}?showAnswers=${showReview}`}
                               className={`px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${
                                 showReview 
                                 ? "bg-on-surface text-white hover:bg-primary" 
                                 : "bg-surface-container text-on-surface-variant cursor-not-allowed pointer-events-none"
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
                  <p className="text-on-surface-variant italic">Bạn chưa thực hiện lần thử nào.</p>
               )
            ) : (
               <div className="p-8 bg-surface-container rounded-[2rem] border border-dashed border-outline-variant/30 text-center">
                  <p className="text-on-surface-variant font-medium">Vui lòng đăng nhập để xem lịch sử làm bài.</p>
                  <Link href="/student/login" className="text-primary font-bold hover:underline mt-2 inline-block">Đăng nhập ngay</Link>
               </div>
            )}
          </div>
        </div>

        {/* Sidebar CTA */}
        <div className="space-y-8">
           <div className="bg-primary text-white rounded-[2.5rem] p-8 shadow-2xl shadow-primary/20 space-y-8">
              <div>
                 <h3 className="text-2xl font-black mb-2 uppercase italic font-headline">
                    {session ? (activeSubmission ? "Tiếp tục" : "Bắt đầu") : "Tham gia"}
                 </h3>
                 <p className="text-primary-fixed/80 text-sm font-medium">
                    Hãy kiểm tra kỹ các thông tin trước khi nhấn nút.
                 </p>
              </div>

              <div className="flex flex-col items-center">
                 {session ? (
                    activeSubmission ? (
                       <StartButton assignmentId={id} label="TIẾP TỤC" />
                    ) : (hasAttemptsLeft && !isDeadlinePassed) ? (
                       <StartButton assignmentId={id} label={completedSubmissions.length > 0 ? "LÀM LẠI" : "BẮT ĐẦU"} />
                    ) : (
                       <div className="bg-white/10 px-8 py-4 rounded-3xl text-sm font-bold border border-white/20 text-center w-full">
                          Đã khóa
                       </div>
                    )
                 ) : (
                    <Link 
                      href={`/join/${id}`}
                      className="w-full py-4 bg-white text-primary rounded-3xl text-center font-black text-sm tracking-widest hover:scale-105 active:scale-95 shadow-xl shadow-primary/20 transition-all uppercase"
                    >
                       BẮT ĐẦU NGAY
                    </Link>
                 )}
              </div>
           </div>
        </div>
      </div>
      
      {/* Voluntary Review Trigger (UC 11) */}
      <ReviewTrigger type="assignment" id={id} isLoggedIn={!!session} />
    </div>
  );
}
