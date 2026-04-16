'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function createNotification(userId: string, type: string, title: string, message: string, link?: string) {
  const id = Math.random().toString(36).substring(2, 11);
  return await prisma.$executeRawUnsafe(
    `INSERT INTO "Notification" (id, "userId", type, title, message, "actionLink", "isRead", "createdAt") 
     VALUES ($1, $2, $3, $4, $5, $6, false, CURRENT_TIMESTAMP)`,
    id, userId, type, title, message, link || null
  );
}

export async function getMyNotifications() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await prisma.$queryRawUnsafe(
    `SELECT id, title, message, type, "actionLink" as link, "isRead", "createdAt" 
     FROM "Notification" 
     WHERE "userId" = $1 
     ORDER BY "createdAt" DESC 
     LIMIT 20`,
    session.user.id
  );
}

export async function getUnreadCount() {
  const session = await auth();
  if (!session?.user?.id) return 0;

  const result: any = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as count FROM "Notification" WHERE "userId" = $1 AND "isRead" = false`,
    session.user.id
  );
  return Number(result[0].count);
}

export async function markAsRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  await prisma.$executeRawUnsafe(
    `UPDATE "Notification" SET "isRead" = true WHERE id = $1 AND "userId" = $2`,
    id, session.user.id
  );

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  await prisma.$executeRawUnsafe(
    `UPDATE "Notification" SET "isRead" = true WHERE "userId" = $1 AND "isRead" = false`,
    session.user.id
  );

  revalidatePath('/', 'layout');
  return { success: true };
}
