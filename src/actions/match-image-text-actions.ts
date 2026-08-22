"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { toSlug } from "@/lib/slugify";
import { revalidatePath } from "next/cache";

export interface SaveMatchImageTextPayload {
  title: string;
  subject?: string;
  gradeLevel?: string;
  description?: string;
  pairs: Array<{
    word: string;
    imageUrl?: string;
    audioUrl?: string;
  }>;
}

export async function saveMatchImageTextGameAction(data: SaveMatchImageTextPayload) {
  try {
    const session = await auth();

    // 1. Get or create a default match word game container
    let game = await prisma.matchWordGame.findFirst({
      where: { ageGroup: data.gradeLevel || "kids-2-5" },
    });

    if (!game) {
      game = await prisma.matchWordGame.create({
        data: {
          name: "Trò chơi Nối Cặp Ảnh - Chữ",
          ageGroup: data.gradeLevel || "kids-2-5",
          level: 1,
        },
      });
    }

    const slug = toSlug(data.title) + "-" + Date.now().toString(36);

    // 2. Create the topic with all card items
    const topic = await prisma.matchWordTopic.create({
      data: {
        gameId: game.id,
        name: data.title,
        slug,
        ageGroup: data.gradeLevel || "kids-2-5",
        icon: "🧩",
        teacherId: session?.user?.id || null,
        items: {
          create: data.pairs.map((pair) => ({
            word: pair.word,
            imageUrl: pair.imageUrl || null,
            audioUrl: pair.audioUrl || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    revalidatePath("/teacher/games");
    revalidatePath("/student/game/match-words");

    return { success: true, topicId: topic.id, slug: topic.slug };
  } catch (error: any) {
    console.error("Failed to save match image text game:", error);
    return { success: false, error: error.message || "Failed to save game to database" };
  }
}
