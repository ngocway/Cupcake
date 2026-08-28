"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { toSlug } from "@/lib/slugify";
import { revalidatePath } from "next/cache";

export interface SaveMatchImageTextPayload {
  topicId?: string;
  title: string;
  subject?: string;
  gradeLevel?: string;
  description?: string;
  audioMode?: string;
  gameType?: string;
  gameMode?: string; // "match" | "line"
  pairs: Array<{
    roundIndex?: number;
    word: string;
    imageUrl?: string;
    audioUrl?: string;
    imageBUrl?: string;
    labelB?: string;
    audioBUrl?: string;
  }>;
}

export async function getMatchImageTextGameDetailsAction(topicId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const topic = await prisma.matchWordTopic.findUnique({
      where: { id: topicId },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!topic) {
      return { success: false, error: "Không tìm thấy bài tập!" };
    }

    return {
      success: true,
      topic: {
        id: topic.id,
        title: topic.name,
        gradeLevel: topic.ageGroup,
        audioMode: topic.audioMode || "AUTO_TTS",
        gameMode: topic.gameMode || "match",
        items: topic.items.map((item) => ({
          id: item.id,
          roundIndex: item.roundIndex ?? 0,
          word: item.word,
          imageUrl: item.imageUrl || undefined,
          audioUrl: item.audioUrl || undefined,
          imageBUrl: (item as any).imageBUrl || undefined,
          labelB: (item as any).labelB || undefined,
          audioBUrl: (item as any).audioBUrl || undefined,
        })),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Không thể tải chi tiết bài tập!" };
  }
}

export async function saveMatchImageTextGameAction(data: SaveMatchImageTextPayload) {
  try {
    const session = await auth();

    // If updating an existing topic
    if (data.topicId) {
      // 1. Delete existing items to re-create fresh pair items
      await prisma.matchWordItem.deleteMany({
        where: { topicId: data.topicId },
      });

      // 2. Update the topic and create new items
      const updatedTopic = await prisma.matchWordTopic.update({
        where: { id: data.topicId },
        data: {
          name: data.title,
          ageGroup: data.gradeLevel || "kids-2-5",
          audioMode: data.audioMode || "AUTO_TTS",
          ...(data.gameMode ? { gameMode: data.gameMode } : {}),
          items: {
            create: data.pairs.map((pair) => ({
              roundIndex: pair.roundIndex ?? 0,
              word: pair.word || "",
              imageUrl: pair.imageUrl || null,
              audioUrl: pair.audioUrl || null,
              imageBUrl: pair.imageBUrl || null,
              labelB: pair.labelB || null,
              audioBUrl: pair.audioBUrl || null,
            })),
          },
        },
      });

      revalidatePath("/teacher");
      revalidatePath("/student/game/flashcard-match");

      return { success: true, topicId: updatedTopic.id, slug: updatedTopic.slug };
    }

    // 1. Get or create a default match word game container for new topic
    const targetGameName = data.gameType === "conveyor-drop"
      ? "Trò chơi Băng Chuyền Thả Khối"
      : data.gameType === "image-image" 
        ? "Trò chơi Nối Cặp Ảnh - Ảnh" 
        : data.gameType === "text-text" 
          ? "Trò chơi Nối Cặp Chữ - Chữ" 
          : "Trò chơi Nối Cặp Ảnh - Chữ";
    let game = await prisma.matchWordGame.findFirst({
      where: { 
        ageGroup: data.gradeLevel || "kids-2-5",
        name: targetGameName,
      },
    });

    if (!game) {
      game = await prisma.matchWordGame.create({
        data: {
          name: targetGameName,
          ageGroup: data.gradeLevel || "kids-2-5",
          level: 1,
        },
      });
    }

    const slug = toSlug(data.title) + "-" + Date.now().toString(36);

    // 2. Create the new topic with all card items
    const topic = await prisma.matchWordTopic.create({
      data: {
        gameId: game.id,
        name: data.title,
        slug,
        ageGroup: data.gradeLevel || "kids-2-5",
        icon: "🖼️",
        audioMode: data.audioMode || "AUTO_TTS",
        gameMode: data.gameMode || "match",
        teacherId: session?.user?.id || null,
        items: {
          create: data.pairs.map((pair) => ({
            roundIndex: pair.roundIndex ?? 0,
            word: pair.word || "",
            imageUrl: pair.imageUrl || null,
            audioUrl: pair.audioUrl || null,
            imageBUrl: pair.imageBUrl || null,
            labelB: pair.labelB || null,
            audioBUrl: pair.audioBUrl || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    revalidatePath("/teacher");
    revalidatePath("/student/game/flashcard-match");

    return { success: true, topicId: topic.id, slug: topic.slug };
  } catch (error: any) {
    console.error("Failed to save match image game:", error);
    return { success: false, error: error.message || "Failed to save game to database" };
  }
}
