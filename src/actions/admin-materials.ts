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

export async function adminSyncCacheAndFeed() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  // 1. Find all active public lessons (associated with a public assignment)
  const activeLessons = await prisma.lesson.findMany({
    where: {
      deletedAt: null,
      isBlocked: false,
      assignment: { status: 'PUBLIC' }
    },
    select: { id: true }
  });

  // 2. Find all active public exercises (not associated with any lesson)
  const activeExercises = await prisma.assignment.findMany({
    where: {
      deletedAt: null,
      status: 'PUBLIC',
      lesson: null
    },
    select: { id: true }
  });

  const lessonIds = activeLessons.map(l => l.id);
  const exerciseIds = activeExercises.map(e => e.id);
  const activeSourceIds = [...lessonIds, ...exerciseIds];

  // Delete all items in HomepageFeed that are not in the active list
  await prisma.homepageFeed.deleteMany({
    where: {
      sourceId: { notIn: activeSourceIds }
    }
  });

  const { syncToHomepageFeed } = await import('@/lib/feed-sync');

  // Sync lessons and exercises sequentially to avoid DB lock issues
  for (const lessonId of lessonIds) {
    await syncToHomepageFeed(lessonId, 'LESSON');
  }

  for (const exerciseId of exerciseIds) {
    await syncToHomepageFeed(exerciseId, 'EXERCISE');
  }

  // 3. Clear cache tags
  const { revalidateTag, revalidatePath: nextRevalidatePath } = await import('next/cache');
  try {
    revalidateTag("homepage", {});
    revalidateTag("shuffled", {});
    revalidateTag("assignments", {});
    revalidateTag("lessons", {});
    revalidateTag("home-feed", {});
    nextRevalidatePath("/");
  } catch (e) {
    console.warn("[CacheSync] Failed to revalidate tags:", e);
  }

  return { success: true };
}

