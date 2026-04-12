import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AssignmentsPageContent from "./_components/AssignmentsPageContent";

export default async function StudentAssignmentsPage() {
  const session = await auth();
  
  if (!session || session.user?.role !== "STUDENT") {
    redirect("/student/login");
  }

  const userId = session.user.id;

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

  const classes = enrollments.map(e => ({
    id: e.classId,
    name: e.class.name
  }));

  // Submissions for status tracking
  const submissions = await prisma.submission.findMany({
    where: { studentId: userId },
    select: {
      assignmentId: true,
      score: true,
      submittedAt: true,
    }
  });

  const submissionMap = new Map();
  submissions.forEach(s => {
    submissionMap.set(s.assignmentId, {
      score: s.score,
      submittedAt: s.submittedAt
    });
  });

  // Flat map assigned tasks
  const assignedAssignments = enrollments.flatMap(e => 
    e.class.assignments.map(ca => {
      const submission = submissionMap.get(ca.assignmentId);
      return {
        id: ca.assignmentId,
        title: ca.assignment.title,
        thumbnail: ca.assignment.thumbnail,
        className: e.class.name,
        classId: e.class.id,
        assignedAt: ca.assignedAt,
        dueDate: ca.dueDate,
        status: submission ? "COMPLETED" : "PENDING" as "PENDING" | "COMPLETED",
        score: submission?.score,
        teacherName: ca.assignment.teacher.name,
        type: "ASSIGNED" as const
      };
    })
  );

  // 2. Fetch Public Assignments (Free Learning)
  // We fetch PUBLIC assignments not already assigned to the student's classes
  const assignedIds = assignedAssignments.map(a => a.id);
  
  const publicAssignmentsRaw = await prisma.assignment.findMany({
    where: {
      status: "PUBLIC",
      id: { notIn: assignedIds },
      deletedAt: null
    },
    include: {
      teacher: true,
      targetClasses: true // To double check if it's really "free" or just public in general
    },
    take: 20,
    orderBy: { createdAt: 'desc' }
  });

  const freeLearningAssignments = publicAssignmentsRaw.map(a => {
    const submission = submissionMap.get(a.id);
    return {
      id: a.id,
      title: a.title,
      thumbnail: a.thumbnail,
      className: "Kho tự học",
      classId: "free",
      assignedAt: a.createdAt,
      dueDate: null, // Free learning has no deadline
      status: submission ? "COMPLETED" : "PENDING" as "PENDING" | "COMPLETED",
      score: submission?.score,
      teacherName: a.teacher.name,
      type: "FREE" as const
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 text-primary text-sm font-bold uppercase tracking-widest">
           <span className="material-symbols-outlined">auto_stories</span>
           <span>Hệ thống học tập thông minh</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Lộ trình <span className="text-primary italic">Học tập</span>
            </h1>
            <p className="text-on-surface-variant text-lg">
              Hoàn thành các nhiệm vụ từ giáo viên hoặc tự do khám phá kho tài liệu khổng lồ để nâng cao trình độ.
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-4 bg-surface-container-low p-4 rounded-3xl border border-outline-variant/10">
             <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-outline tracking-wider">Tiến độ tổng quát</p>
                <div className="flex items-center gap-3 mt-1">
                   <div className="w-32 h-1.5 bg-surface-variant rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${assignedAssignments.length > 0 ? (assignedAssignments.filter(a => a.status === "COMPLETED").length / assignedAssignments.length) * 100 : 0}%` }}
                      ></div>
                   </div>
                   <span className="font-bold text-xs">
                      {assignedAssignments.length > 0 ? Math.round((assignedAssignments.filter(a => a.status === "COMPLETED").length / assignedAssignments.length) * 100) : 0}%
                   </span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Main Content Component handles the Switcher and Grids */}
      <AssignmentsPageContent 
        assignedAssignments={assignedAssignments} 
        freeLearningAssignments={freeLearningAssignments}
        classes={classes}
      />
    </div>
  );
}
