import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AssignmentsPageContent from "./_components/AssignmentsPageContent";

export default async function StudentAssignmentsPage({
  searchParams
}: {
  searchParams: Promise<{ filter?: string; source?: string }>
}) {
  const { filter, source = "public" } = await searchParams;
  const session = await auth();
  
  if (!session || session.user?.role !== "STUDENT") {
    redirect("/student/login");
  }

  const userId = session.user.id;

  // Submissions for status tracking
  const submissions = await prisma.submission.findMany({
    where: { studentId: userId },
    include: {
      assignment: {
        select: {
          _count: { select: { questions: true } }
        }
      },
      answers: {
        select: { isCorrect: true }
      }
    }
  });

  const submissionMap = new Map();
  submissions.forEach(s => {
    submissionMap.set(s.assignmentId, {
      score: s.score,
      submittedAt: s.submittedAt,
      totalQuestions: s.assignment._count.questions,
      correctAnswers: s.answers.filter(a => a.isCorrect).length
    });
  });

  let assignments;

  if (source === "class") {
    // 1. Fetch Class Assignments (Assigned by Teachers)
    const enrollments = await prisma.classEnrollment.findMany({
      where: { studentId: userId },
      include: {
        class: {
          include: {
            assignments: {
              include: {
                assignment: {
                  include: { teacher: true }
                }
              }
            }
          }
        }
      }
    });

    assignments = enrollments.flatMap(e => 
      e.class.assignments.map(ca => {
        const submission = submissionMap.get(ca.assignmentId);
        let status: "PENDING" | "COMPLETED" | "IN_PROGRESS" = "PENDING";
        if (submission) {
          status = submission.submittedAt ? "COMPLETED" : "IN_PROGRESS";
        }

        return {
          id: ca.assignmentId,
          slug: ca.assignment.slug,
          title: ca.assignment.title,
          thumbnail: ca.assignment.thumbnail,
          className: e.class.name,
          classId: e.class.id,
          assignedAt: ca.assignedAt,
          dueDate: ca.dueDate,
          status,
          score: submission?.score,
          correctAnswers: submission?.correctAnswers,
          totalQuestions: submission?.totalQuestions,
          teacherName: ca.assignment.teacher.name,
          type: "ASSIGNED" as const
        };
      })
    );
  } else {
    // 2. Fetch Public Assignments (Free Learning)
    const publicAssignmentsRaw = await prisma.assignment.findMany({
      where: {
        status: "PUBLIC",
        deletedAt: null
      },
      include: {
        teacher: true,
        targetClasses: true 
      },
      take: 40,
      orderBy: { createdAt: 'desc' }
    });

    assignments = publicAssignmentsRaw.map(a => {
      const submission = submissionMap.get(a.id);
      let status: "PENDING" | "COMPLETED" | "IN_PROGRESS" = "PENDING";
      if (submission) {
        status = submission.submittedAt ? "COMPLETED" : "IN_PROGRESS";
      }

      return {
        id: a.id,
        slug: a.slug,
        title: a.title,
        thumbnail: a.thumbnail,
        className: "Kho tự học",
        classId: "free",
        assignedAt: a.createdAt,
        dueDate: null, 
        status,
        score: submission?.score,
        correctAnswers: submission?.correctAnswers,
        totalQuestions: submission?.totalQuestions,
        teacherName: a.teacher.name,
        type: "FREE" as const
      };
    });
  }

  // Filter based on status if needed
  const filteredAssignments = assignments.filter(a => {
    if (filter === "completed") return a.status === "COMPLETED";
    if (filter === "in-progress") return a.status === "IN_PROGRESS";
    return true;
  });

  const classes = source === "class" 
    ? Array.from(new Set(assignments.map(a => JSON.stringify({ id: a.classId, name: a.className }))))
        .map(s => JSON.parse(s))
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

      <AssignmentsPageContent 
        initialAssignments={filteredAssignments} 
        initialSource={source as "class" | "public"}
        classes={classes}
        initialTab={filter === "completed" ? "completed" : filter === "in-progress" ? "in-progress" : "pending"}
      />
    </div>
  );
}
