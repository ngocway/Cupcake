import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") || "public";
    const filter = searchParams.get("filter");
    const skip = parseInt(searchParams.get("skip") || "0", 10);
    const take = parseInt(searchParams.get("take") || "20", 10);

    const userId = session.user.id;

    // Parallel fetch for submissions
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
    let total: number;

    if (source === "class") {
      // Count total
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

      total = enrollments.reduce((acc, e) => acc + e.class.assignments.length, 0);

      const allAssignments = enrollments.flatMap(e => 
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

      // Apply filter
      let filtered = allAssignments;
      if (filter === "completed") {
        filtered = allAssignments.filter(a => a.status === "COMPLETED");
      } else if (filter === "in-progress") {
        filtered = allAssignments.filter(a => a.status === "IN_PROGRESS");
      } else if (filter === "pending") {
        filtered = allAssignments.filter(a => a.status === "PENDING");
      }

      // Paginate
      assignments = filtered.slice(skip, skip + take);
      total = filtered.length;

      const classes = Array.from(new Set(allAssignments.map(a => JSON.stringify({ id: a.classId, name: a.className }))))
        .map(s => JSON.parse(s));

      return NextResponse.json({
        assignments,
        classes,
        hasMore: skip + take < total,
        total,
      });
    } else {
      // Public assignments
      total = await prisma.assignment.count({
        where: {
          status: "PUBLIC",
          deletedAt: null
        }
      });

      const publicAssignmentsRaw = await prisma.assignment.findMany({
        where: {
          status: "PUBLIC",
          deletedAt: null
        },
        include: {
          teacher: true,
          targetClasses: true 
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
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

      // Apply filter on client side for public assignments
      let filtered = assignments;
      if (filter === "completed") {
        filtered = assignments.filter(a => a.status === "COMPLETED");
      } else if (filter === "in-progress") {
        filtered = assignments.filter(a => a.status === "IN_PROGRESS");
      } else if (filter === "pending") {
        filtered = assignments.filter(a => a.status === "PENDING");
      }

      return NextResponse.json({
        assignments: filtered,
        classes: [],
        hasMore: skip + take < total,
        total: filtered.length,
      });
    }
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
