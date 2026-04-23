import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import QuizClientRunner from "./QuizClientRunner";

export default async function StudentQuizPage({
  searchParams,
  params
}: {
  searchParams: Promise<{ submissionId: string }>;
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { submissionId } = await searchParams;
  const { id } = await params;

  if (!submissionId) {
    redirect(`/student/assignments/${id}/run`);
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              image: true,
              professionalTitle: true,
              bio: true,
              isPortfolioPublished: true,
              _count: {
                select: {
                  lessons: true,
                  assignments: true
                }
              }
            }
          },
          questions: {
            orderBy: { orderIndex: 'asc' }
          },
          favoriteAssignments: {
            where: { studentId: session.user.id }
          },
          reviews: {
            where: {
              OR: [
                { isApproved: true },
                { studentId: session.user.id }
              ]
            },
            include: {
              student: {
                select: { name: true, image: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    }
  });

  if (!submission || submission.studentId !== session.user.id) {
    notFound();
  }

  // Fetch related assignments by tags
  const tags = submission.assignment.tags?.split(',').map(t => t.trim()).filter(Boolean) || [];
  const relatedAssignments = await prisma.assignment.findMany({
    where: {
      status: 'PUBLIC',
      id: { not: submission.assignment.id },
      OR: [
        { teacherId: submission.assignment.teacherId },
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

  if (submission.submittedAt) {
    redirect(`/student/assignments/${id}/run`);
  }

  const isBookmarked = submission.assignment.favoriteAssignments.length > 0;
  const myReview = submission.assignment.reviews.find(r => r.studentId === session.user.id);
  const approvedReviews = submission.assignment.reviews.filter(r => r.isApproved);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
       <QuizClientRunner 
          assignment={submission.assignment}
          submissionId={submissionId}
          questions={submission.assignment.questions}
          initialAnswers={submission.answersDraft ? JSON.parse(submission.answersDraft) : {}}
          isBookmarked={isBookmarked}
          initialReview={myReview}
          allReviews={approvedReviews}
          relatedAssignments={relatedAssignments}
       />
    </div>
  );
}
