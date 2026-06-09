import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import QuizClientRunner from "./QuizClientRunner";

async function getRelatedAssignments(assignment: any) {
  const popularTags = await prisma.tag.findMany({
    where: { isPopular: true },
    select: { name: true }
  });
  const popularTagNames = new Set(popularTags.map(t => t.name.toLowerCase().trim()));

  const currentTags = assignment.tags
    ? assignment.tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
    : [];
  const filteredTags = currentTags.filter((tag: string) => !popularTagNames.has(tag));

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
        OR: filteredTags.map((tag: string) => ({
          tags: { contains: tag, mode: 'insensitive' }
        }))
      },
      take: 100,
      include: {
        teacher: { select: { name: true, image: true } }
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

  return relatedAssignments;
}

export default async function StudentQuizPage({
  searchParams,
  params
}: {
  searchParams: Promise<{ submissionId: string }>;
  params: Promise<{ id: string }>;
}) {
  const [session, { submissionId }, { id: paramsId }] = await Promise.all([
    auth(),
    searchParams,
    params
  ]);

  if (!session?.user?.id) redirect("/student/login");
  const userId = session.user.id;

  if (!submissionId) {
    redirect(`/student/assignments/${paramsId}/run`);
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { 
      assignment: {
        select: {
          id: true,
          title: true,
          slug: true,
          tags: true,
          targetAudiences: true,
          lesson: { select: { id: true } },
          questions: { orderBy: { orderIndex: 'asc' } }
        }
      }
    }
  });

  if (!submission || submission.studentId !== userId || !submission.assignment) {
    notFound();
  }

  const assignmentCore = submission.assignment;

  if (submission.submittedAt) {
    const identifier = assignmentCore.slug || assignmentCore.id;
    redirect(`/student/assignments/${identifier}/run`);
  }

  // Luồng 2: Tải ngầm dữ liệu phụ (Teacher, Lesson, Nội dung đọc hiểu, Hướng dẫn...)
  const extraDataPromise = prisma.assignment.findUnique({
    where: { id: assignmentCore.id },
    select: {
      readingText: true,
      instructions: true,
      videoUrl: true,
      audioUrl: true,
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
      lesson: {
        select: {
          videoUrl: true,
          audioUrl: true
        }
      },
      favoriteAssignments: { where: { studentId: userId }, select: { studentId: true } }
    }
  });

  const relatedAssignmentsPromise = getRelatedAssignments(assignmentCore);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
       <QuizClientRunner 
          assignment={assignmentCore as any}
          submissionId={submissionId}
          questions={assignmentCore.questions}
          initialAnswers={submission.answersDraft ? JSON.parse(submission.answersDraft as string) : {}}
          extraDataPromise={extraDataPromise}
          relatedAssignmentsPromise={relatedAssignmentsPromise}
          isGuest={!userId}
       />
    </div>
  );
}
