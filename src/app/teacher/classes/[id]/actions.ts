'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { invalidateStudentClassesCache, invalidateStudentClassDetailCache } from '@/lib/cached-queries';

async function requireTeacherClass(classId: string) {
  const session = await auth();
  const isTeacher = session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN';
  if (!session || !isTeacher) throw new Error("Unauthorized");
  
  const cls = await prisma.class.findFirst({
    where: { 
      id: classId, 
      ...(session.user.role === 'ADMIN' ? {} : { teacherId: session.user.id }) 
    },
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

  await invalidateStudentClassesCache(studentId);
  revalidatePath(`/teacher/classes/${classId}`);
  return { success: true };
}

export async function removeEnrollment(classId: string, studentId: string) {
  await requireTeacherClass(classId);

  await prisma.classEnrollment.delete({
    where: { studentId_classId: { studentId, classId } },
  });

  await invalidateStudentClassesCache(studentId);
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

  await Promise.all(studentIds.map(id => invalidateStudentClassesCache(id)));
  revalidatePath(`/teacher/classes/${classId}`);
  return { success: true };
}

export async function bulkRemoveEnrollments(classId: string, studentIds: string[]) {
  await requireTeacherClass(classId);

  await prisma.classEnrollment.deleteMany({
    where: { classId, studentId: { in: studentIds } },
  });

  await Promise.all(studentIds.map(id => invalidateStudentClassesCache(id)));
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

export async function toggleClassAutoApprove(classId: string, autoApprove: boolean) {
  await requireTeacherClass(classId);

  await prisma.class.update({
    where: { id: classId },
    data: { autoApprove }
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
      classId,
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

export async function removeAssignmentFromClass(classId: string, assignmentId: string) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Chỉ ADMIN mới có quyền gỡ bài khỏi lớp.');
  }

  // Verify the class exists
  const cls = await prisma.class.findUnique({ where: { id: classId }, select: { id: true } });
  if (!cls) throw new Error('Class not found');

  // Delete the AssignmentClass record (unlink assignment from this class)
  await prisma.assignmentClass.deleteMany({
    where: { classId, assignmentId },
  });

  await invalidateStudentClassDetailCache(classId);
  revalidatePath(`/teacher/classes/${classId}`);
  revalidatePath(`/student/classes/${classId}`);
  return { success: true };
}

export async function updateClassInfo(
  classId: string,
  data: {
    name: string;
    description?: string | null;
    isJoinable?: boolean;
    autoApprove?: boolean;
  }
) {
  await requireTeacherClass(classId);

  const trimmedName = data.name.trim();
  if (!trimmedName) {
    throw new Error('Tên lớp không được để trống');
  }

  const updated = await prisma.class.update({
    where: { id: classId },
    data: {
      name: trimmedName,
      description: data.description !== undefined ? (data.description ? data.description.trim() : null) : undefined,
      isJoinable: data.isJoinable !== undefined ? data.isJoinable : undefined,
      autoApprove: data.autoApprove !== undefined ? data.autoApprove : undefined,
    },
  });

  await invalidateStudentClassDetailCache(classId);
  revalidatePath('/teacher/classes');
  revalidatePath(`/teacher/classes/${classId}`);

  return { success: true, class: updated };
}

export async function deleteClass(classId: string) {
  await requireTeacherClass(classId);

  // Soft delete class
  await prisma.class.update({
    where: { id: classId },
    data: { deletedAt: new Date() },
  });

  const enrollments = await prisma.classEnrollment.findMany({
    where: { classId },
    select: { studentId: true }
  });
  await Promise.all(enrollments.map(e => invalidateStudentClassesCache(e.studentId)));
  await invalidateStudentClassDetailCache(classId);

  revalidatePath('/teacher/classes');
  return { success: true };
}

export async function regenerateClassJoinCode(classId: string) {
  await requireTeacherClass(classId);

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let joinCode = '';
  let attempts = 0;

  do {
    joinCode = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const existing = await prisma.class.findFirst({
      where: { joinCode },
    });
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  const updated = await prisma.class.update({
    where: { id: classId },
    data: { joinCode },
  });

  revalidatePath('/teacher/classes');
  revalidatePath(`/teacher/classes/${classId}`);

  return { success: true, joinCode: updated.joinCode };
}
