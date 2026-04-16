"use server";

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { MaterialStatus } from '@prisma/client';

export async function adminToggleBlockMaterial(id: string, isLessons: boolean, isBlocked: boolean) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') throw new Error('Unauthorized');
  
  if (isLessons) {
    await prisma.lesson.update({
      where: { id },
      data: { isBlocked }
    });
  } else {
    await prisma.assignment.update({
      where: { id },
      data: { isBlocked }
    });
  }
  
  revalidatePath('/admin/materials');
  return { success: true };
}

export async function adminUpdateAssignmentInfo(id: string, title: string, status: MaterialStatus) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') throw new Error('Unauthorized');
  
  await prisma.assignment.update({
    where: { id },
    data: { 
      title,
      status 
    }
  });
  
  revalidatePath('/admin/materials');
  return { success: true };
}

export async function adminUpdateLessonInfo(id: string, title: string, isPremium: boolean) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') throw new Error('Unauthorized');
  
  await prisma.lesson.update({
    where: { id },
    data: { 
      title,
      isPremium
    }
  });
  
  revalidatePath('/admin/materials');
  return { success: true };
}
