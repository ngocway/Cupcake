"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getTeacherMatchGamesAction() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: true, topics: [] };
    }

    const isAdmin = session.user.role === "ADMIN";
    const whereCondition: any = isAdmin
      ? {}
      : { teacherId: session.user.id };

    const rawTopics = await prisma.matchWordTopic.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        createdAt: true,
        game: {
          select: {
            name: true,
            level: true,
          },
        },
        items: {
          take: 4,
          select: {
            id: true,
            word: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const topics = rawTopics.map((t) => ({
      id: t.id,
      name: t.name,
      createdAt: t.createdAt,
      game: t.game,
      items: t.items,
      totalItems: t._count.items,
    }));

    return { success: true, topics };
  } catch (error: any) {
    console.error("Failed to fetch teacher match games:", error);
    return { success: false, error: error.message || "Failed to fetch games", topics: [] };
  }
}

export async function deleteTeacherMatchGameAction(topicId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const isAdmin = session.user.role === "ADMIN";
    const whereCondition: any = isAdmin
      ? { id: topicId }
      : { id: topicId, teacherId: session.user.id };

    const topic = await prisma.matchWordTopic.findFirst({
      where: whereCondition,
    });

    if (!topic) {
      return { success: false, error: "Game not found or permission denied" };
    }

    await prisma.matchWordTopic.delete({
      where: { id: topic.id },
    });

    revalidatePath("/teacher");
    revalidatePath("/student/game/match-words");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete match game:", error);
    return { success: false, error: error.message || "Failed to delete game" };
  }
}
