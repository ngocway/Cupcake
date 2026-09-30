'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { fetchWithRedis } from '@/lib/cached-queries';
import { redis } from '@/lib/redis';

export async function createNotification(userId: string, type: string, title: string, message: string, link?: string) {
  try {
    await redis.del(`user:unread-count:${userId}`);
  } catch {}
  return await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      link: link || null,
      isRead: false
    }
  });
}

export async function getMyNotifications() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await prisma.notification.findMany({
    where: {
      userId: session.user.id
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      link: true,
      isRead: true,
      createdAt: true
    }
  });
}

export async function getUnreadCount() {
  const session = await auth();
  if (!session?.user?.id) return 0;

  return fetchWithRedis(`user:unread-count:${session.user.id}`, 30, async () => {
    return prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    });
  });
}

export async function markAsRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  try {
    await redis.del(`user:unread-count:${session.user.id}`);
  } catch {}

  await prisma.notification.update({
    where: {
      id,
      userId: session.user.id
    },
    data: {
      isRead: true
    }
  });

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  try {
    await redis.del(`user:unread-count:${session.user.id}`);
  } catch {}

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      isRead: false
    },
    data: {
      isRead: true
    }
  });

  revalidatePath('/', 'layout');
  return { success: true };
}
