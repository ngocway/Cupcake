"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { toSlug } from "@/lib/slugify";
import { revalidatePath } from "next/cache";
import { processTopicAudioInBackground } from "@/lib/server-topic-tts";
import { syncSetToTeacherLibrary, LibrarySubType } from "@/actions/teacher-library-actions";
import { capitalizeFirstLetter, formatLabelBOrQuizOptions } from "@/lib/text-case";

export interface SaveMatchImageTextPayload {
  topicId?: string;
  title: string;
  subject?: string;
  gradeLevel?: string;
  description?: string;
  audioMode?: string;
  gameType?: string;
  gameMode?: string; // "match" | "line"
  thumbnailUrl?: string;
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
        items: topic.items.map((item) => {
          const formattedWord = capitalizeFirstLetter(item.word);
          const rawLabelB = (item as any).labelB || undefined;
          return {
            id: item.id,
            roundIndex: item.roundIndex ?? 0,
            word: formattedWord,
            imageUrl: item.imageUrl || undefined,
            audioUrl: item.audioUrl || undefined,
            imageBUrl: (item as any).imageBUrl || undefined,
            labelB: rawLabelB ? formatLabelBOrQuizOptions(rawLabelB, formattedWord) || undefined : undefined,
            audioBUrl: (item as any).audioBUrl || undefined,
          };
        }),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Không thể tải chi tiết bài tập!" };
  }
}

export async function saveMatchImageTextGameAction(data: SaveMatchImageTextPayload) {
  try {
    const session = await auth();

    const { optimizeAndUploadToR2 } = await import("@/lib/server-image-uploader");
    const subFolder = `uploads/${session?.user?.id || "teacher"}`;
    const sanitizedPairs = await Promise.all(
      (data.pairs || []).map(async (pair) => {
        const [optA, optB] = await Promise.all([
          pair.imageUrl ? optimizeAndUploadToR2(pair.imageUrl, subFolder) : Promise.resolve(null),
          pair.imageBUrl ? optimizeAndUploadToR2(pair.imageBUrl, subFolder) : Promise.resolve(null),
        ]);
        return {
          ...pair,
          imageUrl: optA || pair.imageUrl || null,
          imageBUrl: optB || pair.imageBUrl || null,
        };
      })
    );

    const isImageImage =
      data.gameType === "image-image" ||
      data.gameType === "FLIP_IMAGE_IMAGE" ||
      data.gameType === "flip-image-image" ||
      sanitizedPairs.some((p) => Boolean(p.imageBUrl));
    const isTextText =
      data.gameType === "text-text" ||
      sanitizedPairs.some((p) => Boolean(p.labelB && !p.imageUrl && !p.imageBUrl));
    const librarySubType: LibrarySubType = isImageImage
      ? "image-image"
      : isTextText
        ? "text-text"
        : "image-text";

    // If updating an existing topic
    if (data.topicId) {
      // 1. Delete existing items to re-create fresh pair items
      await prisma.matchWordItem.deleteMany({
        where: { topicId: data.topicId },
      });

      // 2. Update the topic
      const updatedTopic = await prisma.matchWordTopic.update({
        where: { id: data.topicId },
        data: {
          name: data.title,
          ageGroup: data.gradeLevel || "kids-2-5",
          audioMode: data.audioMode || "AUTO_TTS",
          ...(data.gameMode ? { gameMode: data.gameMode } : {}),
          ...(data.thumbnailUrl ? { thumbnailUrl: data.thumbnailUrl } : {}),
        },
      });

      // 3. Bulk insert items in 1 SQL statement
      if (sanitizedPairs.length > 0) {
        await prisma.matchWordItem.createMany({
          data: sanitizedPairs.map((pair) => ({
            topicId: updatedTopic.id,
            roundIndex: pair.roundIndex ?? 0,
            word: pair.word || "",
            imageUrl: pair.imageUrl || null,
            audioUrl: pair.audioUrl || null,
            imageBUrl: pair.imageBUrl || null,
            labelB: pair.labelB || null,
            audioBUrl: pair.audioBUrl || null,
          })),
        });
      }

      // Auto-sync to Teacher's My Library
      await syncSetToTeacherLibrary({
        teacherId: session?.user?.id || null,
        title: data.title,
        subType: librarySubType,
        gradeLevel: data.gradeLevel || "kids-2-5",
        audioMode: data.audioMode || "AUTO_TTS",
        thumbnailUrl: data.thumbnailUrl || null,
        items: sanitizedPairs.map((pair) => ({
          roundIndex: pair.roundIndex ?? 0,
          word: pair.word || "",
          imageUrl: pair.imageUrl || null,
          audioUrl: pair.audioUrl || null,
          imageBUrl: pair.imageBUrl || null,
          labelB: pair.labelB || null,
          audioBUrl: pair.audioBUrl || null,
        })),
      });

      revalidatePath("/teacher");
      revalidatePath("/student/game/flashcard-match");
      revalidatePath("/");

      if (data.audioMode === "AUTO_TTS" || !data.audioMode) {
        processTopicAudioInBackground(updatedTopic.id).catch(() => {});
      }

      return { success: true, id: updatedTopic.id, topicId: updatedTopic.id, slug: updatedTopic.slug };
    }

    // 1. Get or create a default match word game container for new topic
    const targetGameName = data.gameType === "conveyor-drop"
      ? "Trò chơi Băng Chuyền Thả Khối"
      : data.gameType === "FLIP_IMAGE_IMAGE" || data.gameType === "flip-image-image"
        ? "Trò chơi Lật Ảnh-Ảnh"
        : data.gameType === "FLIP_IMAGE_TEXT" || data.gameType === "flip-image-text"
          ? "Trò chơi Lật Ảnh-Chữ"
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

    // 2. Create the new topic
    const topic = await prisma.matchWordTopic.create({
      data: {
        gameId: game.id,
        name: data.title,
        slug,
        ageGroup: data.gradeLevel || "kids-2-5",
        icon: "🖼️",
        thumbnailUrl: data.thumbnailUrl || null,
        audioMode: data.audioMode || "AUTO_TTS",
        gameMode: data.gameMode || "match",
        teacherId: session?.user?.id || null,
      },
    });

    // 3. Bulk insert all card items in 1 SQL statement
    if (sanitizedPairs.length > 0) {
      await prisma.matchWordItem.createMany({
        data: sanitizedPairs.map((pair) => ({
          topicId: topic.id,
          roundIndex: pair.roundIndex ?? 0,
          word: pair.word || "",
          imageUrl: pair.imageUrl || null,
          audioUrl: pair.audioUrl || null,
          imageBUrl: pair.imageBUrl || null,
          labelB: pair.labelB || null,
          audioBUrl: pair.audioBUrl || null,
        })),
      });
    }

    // Auto-sync to Teacher's My Library
    await syncSetToTeacherLibrary({
      teacherId: session?.user?.id || null,
      title: data.title,
      subType: librarySubType,
      gradeLevel: data.gradeLevel || "kids-2-5",
      audioMode: data.audioMode || "AUTO_TTS",
      thumbnailUrl: data.thumbnailUrl || null,
      items: sanitizedPairs.map((pair) => ({
        roundIndex: pair.roundIndex ?? 0,
        word: pair.word || "",
        imageUrl: pair.imageUrl || null,
        audioUrl: pair.audioUrl || null,
        imageBUrl: pair.imageBUrl || null,
        labelB: pair.labelB || null,
        audioBUrl: pair.audioBUrl || null,
      })),
    });

    revalidatePath("/teacher");
    revalidatePath("/student/game/flashcard-match");
    revalidatePath("/");

    if (data.audioMode === "AUTO_TTS" || !data.audioMode) {
      processTopicAudioInBackground(topic.id).catch(() => {});
    }

    return { success: true, id: topic.id, topicId: topic.id, slug: topic.slug };
  } catch (error: any) {
    console.error("Failed to save match image game:", error);
    return { success: false, error: error.message || "Failed to save game to database" };
  }
}
