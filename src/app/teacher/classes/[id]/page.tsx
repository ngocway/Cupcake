import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import ClassDashboardClient, { type Student } from './_components/ClassDashboardClient';
import type { Assignment } from './_components/AssignmentsTab';
import ClassDetailLoading from './loading';

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (retries > 0 && (err?.message?.includes("Can't reach database") || err?.code === 'P1001' || err?.code === 'P2024')) {
      console.warn(`[ClassPage] Database connection retry (${retries} left)...`);
      await new Promise(r => setTimeout(r, 600));
      return fetchWithRetry(fn, retries - 1);
    }
    throw err;
  }
}

async function ClassDashboardContent({
  classId,
  isTeacherAdmin,
  teacherId,
}: {
  classId: string;
  isTeacherAdmin: boolean;
  teacherId: string;
}) {
  // Parallel server-side fetch (SSR) with automatic retry resilience
  const [cls, enrollments, assignmentClasses, submissionCounts] = await fetchWithRetry(() =>
    Promise.all([
      // 1. Basic class info
      prisma.class.findFirst({
        where: {
          id: classId,
          ...(isTeacherAdmin ? {} : { teacherId }),
        },
        select: { id: true, name: true, joinCode: true, isJoinable: true, teacherId: true },
      }),
      // 2. Enrolled students
      prisma.classEnrollment.findMany({
        where: { classId },
        select: {
          status: true,
          notes: true,
          joinedAt: true,
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              isManagedAccount: true,
              password: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      }),
      // 3. Assignments (no heavy _count sub-query here)
      prisma.assignmentClass.findMany({
        where: { classId },
        select: {
          assignedAt: true,
          groupId: true,
          group: { select: { title: true, createdAt: true } },
          assignment: {
            select: {
              id: true,
              title: true,
              materialType: true,
              level: true,
              instructions: true,
              deadline: true,
              deletedAt: true,
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
      }),
      // 4. Submission counts in ONE grouped query instead of N sub-queries
      prisma.submission.groupBy({
        by: ['assignmentId'],
        where: {
          assignment: { targetClasses: { some: { classId } } },
          submittedAt: { not: null },
        },
        _count: { assignmentId: true },
      }),
    ])
  );

  if (!cls) {
    notFound();
  }

  // Build a lookup map: assignmentId -> submitted count
  const submissionCountMap = new Map(
    submissionCounts.map((s) => [s.assignmentId, s._count.assignmentId])
  );

  const students: Student[] = enrollments.map((e) => ({
    id: e.student.id,
    name: e.student.name ?? '',
    email: e.student.email ?? '',
    status: e.status,
    isManagedAccount: e.student.isManagedAccount,
    pin: e.student.isManagedAccount ? e.student.password ?? '' : undefined,
    notes: e.notes ?? '',
  }));

  const totalStudents = enrollments.length;
  const now = new Date();

  const assignments: Assignment[] = assignmentClasses
    .filter((ac) => ac.assignment.deletedAt === null)
    .map((ac) => {
      const a = ac.assignment;
      const isOpen = a.deadline ? new Date(a.deadline) > now : true;
      const submittedCount = submissionCountMap.get(a.id) ?? 0;
      const percentage = totalStudents > 0
        ? Math.round((submittedCount / totalStudents) * 100)
        : 0;

      let section: 'NEW' | 'REVIEW' = 'NEW';
      if (a.instructions) {
        try {
          const meta = JSON.parse(a.instructions);
          if (meta.section === 'REVIEW') section = 'REVIEW';
        } catch {}
      }

      return {
        id: a.id,
        title: a.title ?? '',
        materialType: a.materialType as any,
        level: a.level,
        instructions: a.instructions,
        deadline: a.deadline ? a.deadline.toISOString() : null,
        isOpen,
        submittedCount,
        totalStudents,
        percentage,
        assignedAt: ac.assignedAt ? ac.assignedAt.toISOString() : null,
        groupId: ac.groupId,
        groupTitle: ac.group?.title || null,
        groupCreatedAt: ac.group?.createdAt ? ac.group.createdAt.toISOString() : null,
        section,
      };
    });

  const initialOpenAssignmentCount = assignments.filter((a) => a.isOpen).length;

  return (
    <ClassDashboardClient
      classId={cls.id}
      initialClassName={cls.name}
      initialJoinCode={cls.joinCode}
      initialIsJoinable={cls.isJoinable}
      initialStudents={students}
      initialAssignments={assignments}
      initialOpenAssignmentCount={initialOpenAssignmentCount}
      isAdmin={isTeacherAdmin}
    />
  );
}

export default async function ClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const isTeacher = session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN';
  if (!session || !isTeacher) {
    redirect('/login');
  }

  const { id: classId } = await params;
  const isTeacherAdmin = session.user.role === 'ADMIN';
  const teacherId = session.user.id;

  return (
    <Suspense fallback={<ClassDetailLoading />}>
      <ClassDashboardContent
        classId={classId}
        isTeacherAdmin={isTeacherAdmin}
        teacherId={teacherId}
      />
    </Suspense>
  );
}
