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

  if (!session?.user?.id) redirect("/login");
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

  // Tối ưu hóa: Lấy nội dung liên quan
  const tags = assignment.tags?.split(',').map(t => t.trim()).filter(Boolean) || [];
  const relatedAssignments = await prisma.assignment.findMany({
    where: {
      status: 'PUBLIC',
      id: { not: assignment.id },
      OR: tags.length > 0 ? [
        { teacherId: assignment.teacherId },
        ...tags.map(tag => ({ tags: { contains: tag } }))
      ] : [{ teacherId: assignment.teacherId }]
    },
    take: 5,
    include: {
      teacher: { select: { name: true, image: true } }
    }
  });

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
