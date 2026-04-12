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
