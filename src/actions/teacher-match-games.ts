"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { TEACHER_GAME_CATEGORIES } from "@/constants/teacher-game-categories";

export async function getTeacherMatchGamesAction() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: true, topics: [] };
    }

    const isAdmin = session.user.role === "ADMIN";
    const matchModes = TEACHER_GAME_CATEGORIES.match.gameModes;

    // Strict Whitelist Filter: only games explicitly classified as Match
    const matchFilter: any = {
      OR: [
        { gameMode: { in: matchModes } },
        {
          gameMode: null,
          game: {
            name: { not: { contains: "Lật Ảnh" } },
          },
          NOT: [
            { game: { name: { contains: "Trắc nghiệm" } } },
            { game: { name: { contains: "Kho báu" } } },
            { game: { name: { contains: "Bắn súng" } } },
            { game: { name: { contains: "Đập Trứng" } } },
            { game: { name: { contains: "Toán" } } },
          ],
        },
      ],
    };

    const whereCondition: any = isAdmin
      ? matchFilter
      : { 
          teacherId: session.user.id,
          ...matchFilter,
        };

    const rawTopics = await prisma.matchWordTopic.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        createdAt: true,
        gameMode: true,
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
            imageBUrl: true,
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

    const topics = rawTopics.map((t) => {
      const isImageImage = t.game?.name?.includes("Ảnh - Ảnh") || t.items.some((item) => Boolean(item.imageBUrl));
      return {
        id: t.id,
        name: t.name,
        createdAt: t.createdAt,
        gameMode: t.gameMode || "match",
        game: {
          ...t.game,
          name: isImageImage ? "Trò chơi Nối Cặp Ảnh - Ảnh" : (t.game?.name || "Trò chơi Nối Cặp Ảnh - Chữ"),
        },
        items: t.items,
        totalItems: t._count.items,
        isImageImage,
      };
    });

    return { success: true, topics };
  } catch (error: any) {
    console.error("Failed to fetch teacher match games:", error);
    return { success: false, error: error.message || "Failed to fetch games", topics: [] };
  }
}

export async function getTeacherFlipGamesAction() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: true, topics: [] };
    }

    const isAdmin = session.user.role === "ADMIN";
    const flipModes = TEACHER_GAME_CATEGORIES.flip.gameModes;

    // Strict Whitelist Filter for Flip Games
    const flipFilter: any = {
      OR: [
        { gameMode: { in: flipModes } },
        { game: { name: { contains: "Lật Ảnh" } } },
      ],
    };

    const whereCondition: any = isAdmin
      ? flipFilter
      : { teacherId: session.user.id, ...flipFilter };

    const rawTopics = await prisma.matchWordTopic.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        createdAt: true,
        gameMode: true,
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
            imageBUrl: true,
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

    const topics = rawTopics.map((t) => {
      const isImageImage = t.game?.name?.includes("Ảnh-Ảnh") || t.items.some((item) => Boolean(item.imageBUrl));
      return {
        id: t.id,
        name: t.name,
        createdAt: t.createdAt,
        gameMode: t.gameMode || "flip",
        game: {
          ...t.game,
          name: isImageImage ? "Trò chơi Lật Ảnh-Ảnh" : (t.game?.name || "Trò chơi Lật Ảnh-Chữ"),
        },
        items: t.items,
        totalItems: t._count.items,
        isImageImage,
      };
    });

    return { success: true, topics };
  } catch (error: any) {
    console.error("Failed to fetch teacher flip games:", error);
    return { success: false, error: error.message || "Failed to fetch flip games", topics: [] };
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
    revalidatePath("/student/game/flashcard-match");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete match game:", error);
    return { success: false, error: error.message || "Failed to delete game" };
  }
}
