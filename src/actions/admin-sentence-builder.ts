"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// CREATE GAME
export async function createSentenceBuilderGame(data: { name: string; ageGroup?: string; order?: number }) {
  try {
    const game = await prisma.sentenceBuilderGame.create({
      data: {
        name: data.name,
        ageGroup: data.ageGroup,
        order: data.order || 0,
      },
    })
    revalidatePath("/admin/games/sentence-builder")
    return { success: true, game }
  } catch (error: any) {
    console.error("Failed to create sentence builder game:", error)
    return { success: false, error: error.message }
  }
}

// GET GAMES WITH QUESTIONS
export async function getSentenceBuilderGames(ageGroup?: string) {
  try {
    const games = await prisma.sentenceBuilderGame.findMany({
      where: ageGroup ? { ageGroup } : undefined,
      include: {
        questions: {
          orderBy: {
            orderIndex: "asc",
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    })
    return { success: true, games }
  } catch (error: any) {
    console.error("Failed to get sentence builder games:", error)
    return { success: false, error: error.message }
  }
}

// UPDATE GAME
export async function updateSentenceBuilderGame(id: string, data: { name?: string; order?: number }) {
  try {
    const game = await prisma.sentenceBuilderGame.update({
      where: { id },
      data,
    })
    revalidatePath("/admin/games/sentence-builder")
    return { success: true, game }
  } catch (error: any) {
    console.error("Failed to update game:", error)
    return { success: false, error: error.message }
  }
}

// DELETE GAME
export async function deleteSentenceBuilderGame(id: string) {
  try {
    await prisma.sentenceBuilderGame.delete({
      where: { id },
    })
    revalidatePath("/admin/games/sentence-builder")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete game:", error)
    return { success: false, error: error.message }
  }
}

// CREATE QUESTION
export async function createSentenceBuilderQuestion(data: {
  gameId: string
  image: string
  expected: string[]
  pool: string[]
  audio?: string
  orderIndex?: number
}) {
  try {
    let safeImage = data.image;
    let safeAudio = data.audio;

    if (safeImage && safeImage.startsWith('data:')) {
      const { uploadBase64Image } = await import('@/actions/upload-actions');
      const res = await uploadBase64Image(safeImage, `game-sb`);
      if (res.success && res.url) safeImage = res.url;
    }
    if (safeAudio && safeAudio.startsWith('data:')) {
      const { uploadBase64Image } = await import('@/actions/upload-actions');
      const res = await uploadBase64Image(safeAudio, `game-sb-audio`);
      if (res.success && res.url) safeAudio = res.url;
    }

    const question = await prisma.sentenceBuilderQuestion.create({
      data: {
        gameId: data.gameId,
        image: safeImage,
        expected: data.expected,
        pool: data.pool,
        audio: safeAudio,
        orderIndex: data.orderIndex || 0,
      },
    })
    revalidatePath("/admin/games/sentence-builder")
    return { success: true, question }
  } catch (error: any) {
    console.error("Failed to create question:", error)
    return { success: false, error: error.message }
  }
}

// UPDATE QUESTION
export async function updateSentenceBuilderQuestion(
  id: string,
  data: {
    image?: string
    expected?: string[]
    pool?: string[]
    audio?: string
    orderIndex?: number
  }
) {
  try {
    let safeImage = data.image;
    let safeAudio = data.audio;

    if (safeImage && safeImage.startsWith('data:')) {
      const { uploadBase64Image } = await import('@/actions/upload-actions');
      const res = await uploadBase64Image(safeImage, `game-sb`);
      if (res.success && res.url) safeImage = res.url;
    }
    if (safeAudio && safeAudio.startsWith('data:')) {
      const { uploadBase64Image } = await import('@/actions/upload-actions');
      const res = await uploadBase64Image(safeAudio, `game-sb-audio`);
      if (res.success && res.url) safeAudio = res.url;
    }

    const question = await prisma.sentenceBuilderQuestion.update({
      where: { id },
      data: {
        ...data,
        image: safeImage,
        audio: safeAudio,
      },
    })
    revalidatePath("/admin/games/sentence-builder")
    return { success: true, question }
  } catch (error: any) {
    console.error("Failed to update question:", error)
    return { success: false, error: error.message }
  }
}

// MOVE QUESTION
export async function moveSentenceBuilderQuestion(id: string, targetGameId: string) {
  try {
    const question = await prisma.sentenceBuilderQuestion.update({
      where: { id },
      data: { gameId: targetGameId },
    })
    revalidatePath("/admin/games/sentence-builder")
    return { success: true, question }
  } catch (error: any) {
    console.error("Failed to move question:", error)
    return { success: false, error: error.message }
  }
}

// DELETE QUESTION
export async function deleteSentenceBuilderQuestion(id: string) {
  try {
    await prisma.sentenceBuilderQuestion.delete({
      where: { id },
    })
    revalidatePath("/admin/games/sentence-builder")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete question:", error)
    return { success: false, error: error.message }
  }
}
