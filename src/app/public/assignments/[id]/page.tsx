
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
import { enUS } from 'date-fns/locale';
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
  
  const assignment = await prisma.assignment.findFirst({
    where: {
      OR: [
        { id },
        { slug: id }
      ]
    },
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
      } : {}),
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  console.log('[PublicAssignmentPage] id from params:', id);
  console.log('[PublicAssignmentPage] assignment found:', !!assignment);

  if (!assignment) {
    console.log('[PublicAssignmentPage] Triggering notFound');
    notFound();
  }

  const submissions = session ? await prisma.submission.findMany({
    where: {
      assignmentId: assignment.id,
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
      where: { assignmentId: assignment.id },
      orderBy: { orderIndex: 'asc' }
    });

    // Fetch popular tags
    const popularTags = await prisma.tag.findMany({
      where: { isPopular: true },
      select: { name: true }
    });
    const popularTagNames = new Set(popularTags.map(t => t.name.toLowerCase().trim()));

    // Get current assignment's tags (excluding popular tags)
    const currentTags = assignment.tags
      ? assignment.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
      : [];
    const filteredTags = currentTags.filter(tag => !popularTagNames.has(tag));

    const currentAudiences = assignment.targetAudiences || [];

    let relatedAssignments: any[] = [];

    if (filteredTags.length > 0) {
      const candidates = await prisma.assignment.findMany({
        where: {
          status: 'PUBLIC',
          id: { not: assignment.id },
          deletedAt: null,
          lesson: null,
          ...(currentAudiences.length > 0 && {
            targetAudiences: { hasSome: currentAudiences }
          }),
          OR: filteredTags.map(tag => ({
            tags: { contains: tag, mode: 'insensitive' }
          }))
        },
        take: 100,
        include: {
          teacher: {
            select: { name: true, image: true }
          }
        }
      });

      const getOverlapCount = (tagsStr: string | null | undefined) => {
        if (!tagsStr) return 0;
        const tags = tagsStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        return tags.filter(tag => filteredTags.includes(tag)).length;
      };

      candidates.sort((a, b) => {
        const overlapA = getOverlapCount(a.tags);
        const overlapB = getOverlapCount(b.tags);
        return overlapB - overlapA;
      });

      relatedAssignments = candidates.slice(0, 10);
    }

    // Fallback: Fetch latest public assignments not associated with any lesson
    if (relatedAssignments.length === 0) {
      relatedAssignments = await prisma.assignment.findMany({
        where: {
          status: 'PUBLIC',
          id: { not: assignment.id },
          deletedAt: null,
          lesson: null,
          ...(currentAudiences.length > 0 && {
            targetAudiences: { hasSome: currentAudiences }
          })
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10,
        include: {
          teacher: {
            select: { name: true, image: true }
          }
        }
      });
    }

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
      redirect(`/student/assignments/${assignment.id}/run/quiz?submissionId=${activeSubmission.id}`);
    } else if (hasAttemptsLeft && !isDeadlinePassed) {
      const newSubmission = await prisma.submission.create({
        data: {
          assignmentId: assignment.id,
          studentId: session.id,
          attemptNumber: nextAttemptNumber
        }
      });
      redirect(`/student/assignments/${assignment.id}/run/quiz?submissionId=${newSubmission.id}`);
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
    <div className="min-h-screen bg-[#F4EFE6] dark:bg-slate-950 pb-20 font-body">
      <PublicHeader session={session} />
      
      {/* Hero Section */}
      <div className="max-w-[1200px] mx-auto px-6 mt-6 mb-12">
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-primary/5 rounded-[3.5rem] shadow-2xl shadow-primary/5 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col items-center text-center relative z-10">
          {session && (
            <div className="absolute top-8 right-6">
              <BookmarkButton 
                type="assignment" 
                id={assignment.id} 
                initialIsBookmarked={isBookmarked} 
                className="scale-125"
              />
            </div>
          )}
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary/5">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <p className="text-primary font-bold text-xs uppercase tracking-[0.2em] mb-2">Assignment Info</p>
          <h1 className="text-3xl md:text-5xl font-black text-on-surface tracking-tight max-w-2xl leading-tight uppercase italic font-headline">
            {assignment.title}
          </h1>
          {(() => {
             const tagsArray = assignment.tags
                ? assignment.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
                : [];
             if (tagsArray.length === 0) return null;
             return (
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                   {tagsArray.map((tag: string) => (
                      <Link 
                         key={tag} 
                         href={`/tags/${encodeURIComponent(tag)}`}
                         className="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-yellow-100 dark:border-yellow-800/30 hover:scale-105 hover:bg-yellow-100 transition-all duration-300"
                      >
                         #{tag}
                      </Link>
                   ))}
                </div>
             );
          })()}
          <div className="flex items-center gap-2 mt-6 px-4 py-2 bg-surface-container rounded-full">
            <div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-[10px] font-bold">
               {assignment.teacher.name?.charAt(0) || "T"}
            </div>
            <span className="text-sm font-medium text-on-surface-variant">Teacher: {assignment.teacher.name || "System"}</span>
          </div>
        </div>
      </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Info Dashboard */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl shadow-primary/5 border border-primary/5 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Duration</p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-black text-on-surface">{assignment.timeLimit ? `${assignment.timeLimit}'` : "Free"}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Questions</p>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-secondary" />
                <span className="font-black text-on-surface">{totalQuestions} {totalQuestions === 1 ? 'Question' : 'Questions'}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Deadline</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-error" />
                <span className="font-black text-on-surface">
                  {assignment.deadline ? format(assignment.deadline, 'dd/MM') : "∞"}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Attempts</p>
              <div className="flex items-center gap-2">
                < Award className="w-4 h-4 text-tertiary" />
                <span className="font-black text-on-surface">{completedSubmissions.length}/{assignment.maxAttempts}</span>
              </div>
            </div>
          </div>

          {/* Warnings & Focus Mode */}
          {assignment.focusMode && (
             <div className="bg-error-container/20 border border-error/20 p-6 rounded-[2.5rem] flex gap-4 backdrop-blur-xl shadow-xl shadow-error/5">
                <AlertTriangle className="w-6 h-6 text-error shrink-0" />
                <div className="space-y-1">
                   <h4 className="font-bold text-error">Focus Mode</h4>
                   <p className="text-sm text-on-surface-variant leading-relaxed">
                      The assignment will be submitted automatically if you leave the screen or switch tabs more than 3 times.
                   </p>
                </div>
             </div>
          )}

          {/* History & Review */}
          <div className="space-y-6">
            <h3 className="text-xl font-black tracking-tight uppercase italic">Attempt History</h3>
            {session ? (
               completedSubmissions.length > 0 ? (
                  <div className="space-y-4">
                     {completedSubmissions.map((sub) => {
                       const isPassed = (sub.score || 0) >= (maxScore * 0.5);
                       const showReview = canReview(sub);
                       return (
                         <div key={sub.id} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2.5rem] border border-primary/5 shadow-xl shadow-primary/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/20 hover:-translate-y-1 transition-all duration-300">
                            <div className="flex items-center gap-4">
                               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isPassed ? 'bg-secondary-container/20 text-secondary' : 'bg-error-container/20 text-error'}`}>
                                  <BarChart3 className="w-7 h-7" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Attempt {sub.attemptNumber}</p>
                                  <h5 className="font-black text-xl">
                                     {sub.score || 0} <span className="text-sm font-medium text-on-surface-variant">/ {maxScore} pts</span>
                                  </h5>
                                  <p className="text-xs text-on-surface-variant mt-1">
                                     {sub.submittedAt ? format(sub.submittedAt, "HH:mm, dd/MM", { locale: enUS }) : "N/A"}
                                  </p>
                               </div>
                            </div>
                            
                            <a 
                               href={`/student/assignments/${assignment.id}/review/${sub.id}?showAnswers=${showReview}`}
                               className={`px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${
                                 showReview 
                                 ? "bg-on-surface text-white hover:bg-primary" 
                                 : "bg-surface-container text-on-surface-variant cursor-not-allowed pointer-events-none"
                               }`}
                            >
                               {showReview ? "Review Answers" : "Review Locked"}
                               <ChevronRight className="w-4 h-4" />
                            </a>
                         </div>
                       )
                     })}
                  </div>
               ) : (
                  <p className="text-on-surface-variant italic">You have not made any attempts yet.</p>
               )
            ) : (
               <div className="p-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-dashed border-primary/20 text-center shadow-xl shadow-primary/5">
                  <p className="text-on-surface-variant font-medium">Please log in to view your attempt history.</p>
                  <Link href="/student/login" className="text-primary font-bold hover:underline mt-2 inline-block">Log in now</Link>
               </div>
            )}
          </div>
        </div>

        {/* Sidebar CTA */}
        <div className="space-y-8">
           <div className="bg-primary text-white rounded-[2.5rem] p-8 shadow-2xl shadow-primary/30 space-y-8 border border-white/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div>
                 <h3 className="text-2xl font-black mb-2 uppercase italic font-headline">
                    {session ? (activeSubmission ? "Continue" : "Start") : "Join"}
                 </h3>
                 <p className="text-primary-fixed/80 text-sm font-medium">
                    Please check the information carefully before starting.
                 </p>
              </div>

              <div className="flex flex-col items-center">
                 {session ? (
                    activeSubmission ? (
                       <StartButton assignmentId={assignment.id} label="CONTINUE" />
                    ) : (hasAttemptsLeft && !isDeadlinePassed) ? (
                       <StartButton assignmentId={assignment.id} label={completedSubmissions.length > 0 ? "RETRY" : "START"} />
                    ) : (
                       <div className="bg-white/10 px-8 py-4 rounded-3xl text-sm font-bold border border-white/20 text-center w-full">
                          Locked
                       </div>
                    )
                 ) : (
                    <Link 
                      href={`/join/${assignment.id}`}
                      className="w-full py-4 bg-white text-primary rounded-3xl text-center font-black text-sm tracking-widest hover:scale-105 active:scale-95 shadow-xl shadow-primary/20 transition-all uppercase"
                    >
                       START NOW
                    </Link>
                 )}
              </div>
           </div>
        </div>
      </div>
      
      {/* Voluntary Review Trigger (UC 11) */}
      <ReviewTrigger type="assignment" id={assignment.id} isLoggedIn={!!session} />
    </div>
  );
}
