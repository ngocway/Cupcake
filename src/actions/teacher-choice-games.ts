"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { TEACHER_GAME_CATEGORIES } from "@/constants/teacher-game-categories";
import { revalidatePath } from "next/cache";

export interface SaveTeacherChoiceGamePayload {
  code: string;
  title: string;
  gameType: "shooter" | "egg";
  questionCount?: number;
  endMode?: "finish" | "loop";
  selectedTypes?: string[];
  questions: Array<{
    id: string;
    typeId: string;
    q: string;
    a: string;
    wrong: string[];
  }>;
}

export async function saveTeacherChoiceGameAction(data: SaveTeacherChoiceGamePayload) {
  try {
    const session = await auth();
    const isEgg = data.gameType === "egg";
    const targetGameName = isEgg ? "Trò chơi Đập Trứng Toán Học" : "Trò chơi Bắn Súng Toán Học";
    const targetGameMode = isEgg ? "choice-egg" : "choice-shooter";
    const defaultIcon = isEgg ? "🥚" : "🚀";

    // 1. Get or create container game
    let game = await prisma.matchWordGame.findFirst({
      where: { name: targetGameName },
    });

    if (!game) {
      game = await prisma.matchWordGame.create({
        data: {
          name: targetGameName,
          ageGroup: "kids-2-5",
          level: 1,
        },
      });
    }

    // 2. Prepare items data
    const itemsData = data.questions.map((q, idx) => ({
      roundIndex: 0,
      word: q.q.trim(),
      labelB: JSON.stringify({
        a: q.a,
        wrong: q.wrong,
        typeId: q.typeId,
        endMode: data.endMode || "finish",
        selectedTypes: data.selectedTypes || [],
      }),
      imageUrl: null,
      audioUrl: null,
      imageBUrl: null,
      audioBUrl: null,
    }));

    // 3. Check if topic already exists by slug (code)
    const existing = await prisma.matchWordTopic.findFirst({
      where: {
        slug: data.code.trim().toUpperCase(),
        gameMode: targetGameMode,
      },
    });

    let topicId: string;

    if (existing) {
      topicId = existing.id;
      // Delete existing items
      await prisma.matchWordItem.deleteMany({
        where: { topicId: existing.id },
      });

      // Update topic info
      await prisma.matchWordTopic.update({
        where: { id: existing.id },
        data: {
          name: data.title.trim(),
          icon: defaultIcon,
          gameMode: targetGameMode,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new topic
      const newTopic = await prisma.matchWordTopic.create({
        data: {
          gameId: game.id,
          name: data.title.trim(),
          slug: data.code.trim().toUpperCase(),
          ageGroup: "kids-2-5",
          icon: defaultIcon,
          audioMode: "NONE",
          gameMode: targetGameMode,
          teacherId: session?.user?.id || null,
        },
      });
      topicId = newTopic.id;
    }

    // 4. Bulk insert questions in 1 single SQL statement
    if (itemsData.length > 0) {
      await prisma.matchWordItem.createMany({
        data: itemsData.map((item) => ({
          ...item,
          topicId,
        })),
      });
    }

    revalidatePath("/teacher");
    return { success: true, topicId, code: data.code.trim().toUpperCase() };
  } catch (error: any) {
    console.error("Failed to save teacher choice game:", error);
    return { success: false, error: error.message || "Failed to save game to database" };
  }
}

export async function getTeacherChoiceGamesAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: true, games: [] };
    }

    const isAdmin = session.user.role === "ADMIN";
    const allowedModes = TEACHER_GAME_CATEGORIES.choice.gameModes;

    const whereCondition: any = isAdmin
      ? { gameMode: { in: allowedModes } }
      : {
          teacherId: session.user.id,
          gameMode: { in: allowedModes },
        };

    const rawTopics = await prisma.matchWordTopic.findMany({
      where: whereCondition,
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
        game: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const games = rawTopics.map((t) => {
      const isEgg = t.gameMode === "choice-egg";
      let endMode: "finish" | "loop" = "finish";
      let selectedTypes: string[] = [];

      const questions = t.items.map((item, idx) => {
        let meta: any = {};
        try {
          meta = JSON.parse(item.labelB || "{}");
          if (idx === 0) {
            if (meta.endMode) endMode = meta.endMode;
            if (Array.isArray(meta.selectedTypes)) selectedTypes = meta.selectedTypes;
          }
        } catch {}

        return {
          id: item.id,
          typeId: meta.typeId || "",
          q: item.word,
          a: meta.a || "",
          wrong: Array.isArray(meta.wrong) ? meta.wrong : [],
        };
      });

      return {
        id: t.id,
        code: t.slug,
        title: t.name,
        questionCount: t.items.length,
        createdAt: t.createdAt.toISOString(),
        gameType: isEgg ? ("egg" as const) : ("shooter" as const),
        endMode,
        selectedTypes,
        questions,
      };
    });

    return { success: true, games };
  } catch (error: any) {
    console.error("Failed to fetch teacher choice games:", error);
    return { success: false, error: error.message || "Failed to fetch games", games: [] };
  }
}

export async function getTeacherChoiceGameByCodeAction(code: string) {
  try {
    const searchCode = code.trim().toUpperCase();
    const topic = await prisma.matchWordTopic.findFirst({
      where: {
        slug: searchCode,
        gameMode: { in: TEACHER_GAME_CATEGORIES.choice.gameModes },
      },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!topic) {
      return { success: false, error: "Game not found" };
    }

    const isEgg = topic.gameMode === "choice-egg";
    let endMode: "finish" | "loop" = "finish";
    let selectedTypes: string[] = [];

    const questions = topic.items.map((item, idx) => {
      let meta: any = {};
      try {
        meta = JSON.parse(item.labelB || "{}");
        if (idx === 0) {
          if (meta.endMode) endMode = meta.endMode;
          if (Array.isArray(meta.selectedTypes)) selectedTypes = meta.selectedTypes;
        }
      } catch {}

      return {
        id: item.id,
        typeId: meta.typeId || "",
        q: item.word,
        a: meta.a || "",
        wrong: Array.isArray(meta.wrong) ? meta.wrong : [],
      };
    });

    return {
      success: true,
      game: {
        id: topic.id,
        code: topic.slug,
        title: topic.name,
        questionCount: topic.items.length,
        endMode,
        selectedTypes,
        questions,
        createdAt: topic.createdAt.toISOString(),
        updatedAt: topic.updatedAt.toISOString(),
        gameType: isEgg ? ("egg" as const) : ("shooter" as const),
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch choice game by code:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteTeacherChoiceGameAction(topicId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const isAdmin = session.user.role === "ADMIN";
    const whereCondition: any = isAdmin
      ? { id: topicId }
      : { id: topicId, teacherId: session.user.id };

    await prisma.matchWordTopic.deleteMany({
      where: whereCondition,
    });

    revalidatePath("/teacher");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete choice game:", error);
    return { success: false, error: error.message };
  }
}
