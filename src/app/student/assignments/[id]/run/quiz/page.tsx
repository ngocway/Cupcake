import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import QuizClientRunner from "./QuizClientRunner";

async function getQuizData(assignmentId: string, studentId: string) {
  return prisma.assignment.findFirst({
    where: { OR: [{ id: assignmentId }, { slug: assignmentId }] },
    include: {
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
      questions: { orderBy: { orderIndex: 'asc' } },
      favoriteAssignments: { where: { studentId }, select: { studentId: true } },
      lesson: {
        select: {
          videoUrl: true,
          audioUrl: true
        }
      },
      reviews: {
        where: { isApproved: true },
        include: { student: { select: { name: true, image: true } } },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
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

  // Fetch submission first to get the real assignmentId (CUID)
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { 
      id: true, 
      studentId: true, 
      assignmentId: true, 
      submittedAt: true, 
      answersDraft: true 
    }
  });

  // Verify submission belongs to user
  if (!submission || submission.studentId !== userId) {
    notFound();
  }

  // Fetch assignment using CUID
  const assignment = await getQuizData(submission.assignmentId, userId);

  if (!assignment) {
    notFound();
  }

  if (submission.submittedAt) {
    const identifier = assignment.slug || assignment.id;
    redirect(`/student/assignments/${identifier}/run`);
  }

  // Tối ưu hóa: Lấy nội dung liên quan (không thuộc bài học nào, ưu tiên trùng nhiều tag, trừ tag phổ biến, giới hạn 10)
  const popularTags = await prisma.tag.findMany({
    where: { isPopular: true },
    select: { name: true }
  });
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

  // Fallback: Lấy các bài tập mới nhất không thuộc bài học nào
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
        teacher: { select: { name: true, image: true } }
      }
    });
  }

  const isBookmarked = assignment.favoriteAssignments.length > 0;
  const myReview = assignment.reviews.find(r => r.studentId === userId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
       <QuizClientRunner 
          assignment={assignment as any}
          submissionId={submissionId}
          questions={assignment.questions}
          initialAnswers={submission.answersDraft ? JSON.parse(submission.answersDraft) : {}}
          isBookmarked={isBookmarked}
          initialReview={myReview as any}
          allReviews={assignment.reviews as any}
          relatedAssignments={relatedAssignments as any}
       />
    </div>
  );
}
