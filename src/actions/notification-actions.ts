'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function createNotification(userId: string, type: string, title: string, message: string, link?: string) {
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

  return await prisma.notification.count({
    where: {
      userId: session.user.id,
      isRead: false
    }
  });
}

export async function markAsRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

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
