'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

async function requireTeacherClass(classId: string) {
  const session = await auth();
  if (!session || session.user?.role !== 'TEACHER') throw new Error("Unauthorized");
  
  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: session.user.id },
  });
  if (!cls) throw new Error("Class not found");
  
  return cls;
}

export async function updateEnrollmentStatus(classId: string, studentId: string, status: 'ACTIVE' | 'BLOCKED' | 'INVITED' | 'PENDING') {
  const cls = await requireTeacherClass(classId);

  await prisma.classEnrollment.update({
    where: { studentId_classId: { studentId, classId } },
    data: { status }
  });

  if (status === 'ACTIVE') {
    const { createNotification } = await import('@/actions/notification-actions');
    await createNotification(
      studentId,
      'ENROLLMENT_APPROVED', // type
      'Yêu cầu vào lớp đã được duyệt',
      `Bạn đã chính thức trở thành học sinh của lớp ${cls.name}.`,
      `/student/classes/${classId}`
    );
  }

  revalidatePath(`/teacher/classes/${classId}`);
  return { success: true };
}

export async function removeEnrollment(classId: string, studentId: string) {
  await requireTeacherClass(classId);

  await prisma.classEnrollment.delete({
    where: { studentId_classId: { studentId, classId } },
  });

  revalidatePath(`/teacher/classes/${classId}`);
  return { success: true };
}

export async function bulkUpdateEnrollments(classId: string, studentIds: string[], status: 'ACTIVE' | 'BLOCKED' | 'INVITED' | 'PENDING') {
  const cls = await requireTeacherClass(classId);

  await prisma.classEnrollment.updateMany({
    where: { classId, studentId: { in: studentIds } },
    data: { status }
  });

  if (status === 'ACTIVE') {
    const { createNotification } = await import('@/actions/notification-actions');
    for (const studentId of studentIds) {
      await createNotification(
        studentId,
        'ENROLLMENT_APPROVED', // type
        'Yêu cầu vào lớp đã được duyệt',
        `Bạn đã được thêm vào lớp ${cls.name}.`,
        `/student/classes/${classId}`
      );
    }
  }

  revalidatePath(`/teacher/classes/${classId}`);
  return { success: true };
}

export async function bulkRemoveEnrollments(classId: string, studentIds: string[]) {
  await requireTeacherClass(classId);

  await prisma.classEnrollment.deleteMany({
    where: { classId, studentId: { in: studentIds } },
  });

  revalidatePath(`/teacher/classes/${classId}`);
  return { success: true };
}

export async function toggleClassJoinability(classId: string, isJoinable: boolean) {
  await requireTeacherClass(classId);

  await prisma.class.update({
    where: { id: classId },
    data: { isJoinable }
  });

  revalidatePath(`/teacher/classes/${classId}`);
  return { success: true };
}

export async function updateStudentNote(classId: string, studentId: string, notes: string) {
  await requireTeacherClass(classId);

  await prisma.classEnrollment.update({
    where: { studentId_classId: { studentId, classId } },
    data: { notes }
  });

  return { success: true };
}

export async function getAnnouncements(classId: string) {
  await requireTeacherClass(classId);

  const announcements = await prisma.announcement.findMany({
    where: { classId },
    orderBy: { createdAt: 'desc' },
  });

  return announcements;
}

export async function createAnnouncement(classId: string, content: string, attachments?: string) {
  const cls = await requireTeacherClass(classId);

  const announcement = await prisma.announcement.create({
    data: {
      classId,
      content,
      authorId: cls.teacherId,
      attachments,
    }
  });

  // Notify students
  const { createNotification } = await import('@/actions/notification-actions');
  const enrollments = await prisma.classEnrollment.findMany({
    where: { classId, status: 'ACTIVE' },
    select: { studentId: true }
  });

  for (const e of enrollments) {
    await createNotification(
      e.studentId,
      'GENERAL',
      `Thông báo mới từ lớp ${cls.name}`,
      content.length > 100 ? content.substring(0, 97) + '...' : content,
      `/student/classes/${classId}`
    );
  }

  return { success: true, announcement };
}

export async function remindPendingSubmissions(classId: string, assignmentId: string) {
  const cls = await requireTeacherClass(classId);

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { title: true }
  });

  if (!assignment) throw new Error("Assignment not found");

  // Find students who haven't submitted
  const enrolledStudents = await prisma.classEnrollment.findMany({
    where: { classId, status: 'ACTIVE' },
    select: { studentId: true }
  });

  const submissions = await prisma.submission.findMany({
    where: { 
      assignmentId, 
      studentId: { in: enrolledStudents.map(e => e.studentId) },
      submittedAt: { not: null }
    },
    select: { studentId: true }
  });

  const submittedStudentIds = new Set(submissions.map(s => s.studentId));
  const pendingStudentIds = enrolledStudents
    .map(e => e.studentId)
    .filter(id => !submittedStudentIds.has(id));

  if (pendingStudentIds.length === 0) {
    return { success: true, count: 0 };
  }

  // Notify them
  const { createNotification } = await import('@/actions/notification-actions');
  for (const studentId of pendingStudentIds) {
    await createNotification(
      studentId,
      'DUE_REMINDER',
      `Nhắc nhở nộp bài: ${assignment.title}`,
      `Bạn vẫn chưa nộp bài tập "${assignment.title}" của lớp ${cls.name}. Hãy hoàn thành sớm nhé!`,
      `/student/assignments/${assignmentId}/run`
    );
  }

  return { success: true, count: pendingStudentIds.length };
}
