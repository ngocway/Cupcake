'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function cancelJoinRequest(classId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const studentId = session.user.id;

  // We only allow canceling if it's currently PENDING.
  const enrollment = await prisma.classEnrollment.findUnique({
    where: { studentId_classId: { studentId, classId } }
  });

  if (enrollment && enrollment.status === 'PENDING') {
    await prisma.classEnrollment.delete({
      where: { studentId_classId: { studentId, classId } }
    });
    
    // Invalidate caches
    revalidatePath('/student/classes');
    revalidatePath('/student/dashboard');
    return { success: true };
  }

  throw new Error("Không thể hủy yêu cầu này.");
}
