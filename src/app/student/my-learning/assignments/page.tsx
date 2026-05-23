import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { StudentAssignmentHistory } from "./_components/StudentAssignmentHistory";
import { getTranslations, getLocale } from "next-intl/server";

export default async function MyAssignmentsPage() {
  const t = await getTranslations("student.myLearning");
  const locale = await getLocale();
  const session = await auth();
  
  if (!session || session.user?.role !== "STUDENT") {
    redirect("/student/login");
  }

  const userId = session.user.id;

  // Fetch submissions and session in parallel if possible, but session is needed for userId
  const submissions = await prisma.submission.findMany({
    where: { studentId: userId },
    include: {
      assignment: {
        include: {
          teacher: {
            select: { name: true }
          },
          _count: {
            select: { questions: true }
          }
        }
      },
      answers: {
        where: { isCorrect: true },
        select: { id: true } // Only fetch what we need to count
      }
    },
    orderBy: {
      startedAt: 'desc'
    },
    take: 50 // Added a limit for performance
  });

  const formattedSubmissions = submissions.map(s => ({
    id: s.id,
    assignmentId: s.assignmentId,
    slug: s.assignment.slug,
    title: s.assignment.title,
    thumbnail: s.assignment.thumbnail,
    teacherName: s.assignment.teacher.name,
    startedAt: s.startedAt,
    submittedAt: s.submittedAt,
    score: s.score,
    totalQuestions: s.assignment._count.questions,
    correctAnswers: s.answers.length, // Counted directly from the filtered include
    status: s.submittedAt ? "COMPLETED" : "IN_PROGRESS"
  }));

  return (
    <div className="min-h-screen bg-transparent pb-20">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pt-10">
        <StudentAssignmentHistory 
          initialSubmissions={formattedSubmissions as any} 
          translations={{
            completed: t("completed"),
            inProgress: t("inProgress"),
            searchPlaceholder: t("searchPlaceholder"),
            retake: t("retake"),
            date: t("date", { date: "{date}" }),
            result: t("result"),
            questions: t("questions"),
            unfinished: t("unfinished"),
            continue: t("continue"),
            noAssignments: t("noAssignments"),
            noResults: t("noResults"),
            emptyMessage: t("emptyMessage", { tab: "{tab}" }),
            clearSearch: t("clearSearch")
          }}
        />
      </div>
    </div>
  );
}
