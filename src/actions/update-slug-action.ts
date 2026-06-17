"use server";

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { generateUniqueSlug } from '@/lib/slugify';
import { revalidatePath } from 'next/cache';

export async function generateNewUniqueSlugAction(title: string, model: 'assignment' | 'lesson' = 'assignment') {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  
  const slug = await generateUniqueSlug(title, model);
  return slug;
}

export async function updateMaterialSlugAction(id: string, newSlug: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Verify ownership
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { lesson: true }
  });

  if (!assignment || assignment.teacherId !== session.user.id) {
    throw new Error('Forbidden');
  }

  // Update assignment slug
  await prisma.assignment.update({
    where: { id },
    data: { slug: newSlug }
  });

  // If there's a linked lesson, update its slug too
  if (assignment.lesson) {
    const lessonSlug = await generateUniqueSlug(assignment.title, 'lesson');
    if (lessonSlug) {
      await prisma.lesson.update({
        where: { id: assignment.lesson.id },
        data: { slug: lessonSlug }
      });
    }
  }

  revalidatePath('/teacher/materials');
  revalidatePath('/teacher/lessons');
  
  return { success: true };
}
