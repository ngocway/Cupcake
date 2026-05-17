import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ClassesClient from './ClassesClient';
import { getTranslations, getLocale } from "next-intl/server";

export default async function StudentClassesPage() {
  const t = await getTranslations("student.classes");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;

  const enrollments = await prisma.classEnrollment.findMany({
    where: { studentId: userId },
    include: {
      class: {
        include: {
          teacher: true,
          _count: {
            select: { assignments: true }
          }
        }
      }
    },
    orderBy: { joinedAt: 'desc' }
  });

  // Calculate pending assignments for active classes
  const assignedToMe = await prisma.assignmentClass.findMany({
    where: {
      classId: { in: enrollments.filter(e => e.status === 'ACTIVE').map(e => e.classId) }
    },
    include: { assignment: true }
  });

  const formattedEnrollments = enrollments.map(e => {
    let pendingCount = 0;
    if (e.status === 'ACTIVE') {
      pendingCount = assignedToMe.filter(a => 
        a.classId === e.classId && 
        new Date() < (a.dueDate || new Date(9999, 11, 31))
      ).length;
    }

    return {
      id: e.classId,
      status: e.status,
      joinedAt: e.joinedAt,
      class: {
        id: e.class.id,
        name: e.class.name,
        teacherName: e.class.teacher.name || e.class.teacher.email,
        totalAssignments: e.class._count.assignments
      },
      pendingCount
    };
  });

  const activeClasses = formattedEnrollments.filter(e => e.status === 'ACTIVE');
  const pendingRequests = formattedEnrollments.filter(e => e.status === 'PENDING');

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">{t("title")}</h1>
        <p className="text-on-surface-variant text-lg">
          {t("subtitle")}
        </p>
      </div>

      <ClassesClient 
        activeClasses={activeClasses} 
        pendingRequests={pendingRequests} 
        translations={{
          searchPlaceholder: t("searchPlaceholder"),
          pendingApproval: t("pendingApproval"),
          waitingTeacher: t("waitingTeacher"),
          cancelRequest: t("cancelRequest"),
          canceling: t("canceling"),
          activeClasses: t("activeClasses"),
          noClasses: t("noClasses"),
          noClassesMessage: t("noClassesMessage"),
          teacher: t("teacher"),
          newAssignments: t("newAssignments"),
          totalAssignments: t("totalAssignments"),
          cancelError: t("cancelError")
        }}
      />
    </div>
  );
}
