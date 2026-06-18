import React from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import QuizClientRunner from "@/app/student/assignments/[id]/run/quiz/QuizClientRunner";
import { fetchWithRedis } from "@/lib/cached-queries";
import { getCachedAssignmentQuestions, getRelatedAssignmentsCached } from "@/app/student/assignments/[id]/run/data";

export default async function PublicAssignmentPage({ 
  params,
}: { 
  params: Promise<{ id: string }>,
  searchParams?: Promise<Record<string, string>>
}) {
  const sessionData = await auth();
  const session = sessionData?.user ? {
    id: sessionData.user.id!,
    name: sessionData.user.name ?? null,
    image: sessionData.user.image ?? null,
    role: sessionData.user.role ?? null,
  } : null;

  const { id } = await params;

  const assignment = await fetchWithRedis(`assignment:public:${id}`, 300, async () => {
    return prisma.assignment.findFirst({
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
              select: { lessons: true, assignments: true }
            }
          }
        },
        _count: { select: { questions: true } },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        lesson: { select: { id: true, targetAudiences: true } }
      }
    });
  });

  if (!assignment) {
    notFound();
  }

  const questions = await getCachedAssignmentQuestions(assignment.id);

  // ── Always go directly to quiz (no landing page) ──────────────────────────

  // For logged-in users: create/resume submission then redirect to quiz
  if (session) {
    const submissions = await prisma.submission.findMany({
      where: { assignmentId: assignment.id, studentId: session.id },
      orderBy: { attemptNumber: 'desc' }
    });
    const activeSubmission = submissions.find(s => !s.submittedAt);
    const completedCount = submissions.filter(s => s.submittedAt).length;

    if (activeSubmission) {
      redirect(`/student/assignments/${assignment.id}/run/quiz?submissionId=${activeSubmission.id}`);
    } else {
      const newSubmission = await prisma.submission.create({
        data: {
          assignmentId: assignment.id,
          studentId: session.id,
          attemptNumber: completedCount + 1
        }
      });
      redirect(`/student/assignments/${assignment.id}/run/quiz?submissionId=${newSubmission.id}`);
    }
  }

  const relatedAssignments = await getRelatedAssignmentsCached(assignment.id, assignment.tags, assignment.targetAudiences as string[]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
       <QuizClientRunner 
          assignment={assignment}
          questions={questions}
          initialAnswers={{}}
          extraDataPromise={Promise.resolve(assignment)}
          relatedAssignmentsPromise={Promise.resolve(relatedAssignments)}
          isGuest={true}
       />
    </div>
  );
}
