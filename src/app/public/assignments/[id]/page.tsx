import React from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import QuizClientRunner from "@/app/student/assignments/[id]/run/quiz/QuizClientRunner";

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
  
  const [assignment, questions, popularTags] = await Promise.all([
    prisma.assignment.findFirst({
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
        },
        lesson: {
          select: { id: true }
        }
      }
    }),
    prisma.question.findMany({
      where: { 
        assignment: {
          OR: [
            { id },
            { slug: id }
          ]
        }
      },
      orderBy: { orderIndex: 'asc' }
    }),
    prisma.tag.findMany({
      where: { isPopular: true },
      select: { name: true }
    })
  ]);

  if (!assignment) {
    notFound();
  }

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

  const popularTagNames = new Set(popularTags.map(t => t.name.toLowerCase().trim()));

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
      include: { teacher: { select: { name: true, image: true } } }
    });

    const getOverlapCount = (tagsStr: string | null | undefined) => {
      if (!tagsStr) return 0;
      const tags = tagsStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      return tags.filter(tag => filteredTags.includes(tag)).length;
    };
    candidates.sort((a, b) => getOverlapCount(b.tags) - getOverlapCount(a.tags));
    relatedAssignments = candidates.slice(0, 10);
  }

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
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { teacher: { select: { name: true, image: true } } }
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
