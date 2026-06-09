"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { toSlug } from "@/lib/slugify"

// CREATE GAME
export async function createMatchWordGame(data: { name: string; ageGroup: string; order?: number }) {
  try {
    const game = await prisma.matchWordGame.create({
      data: {
        name: data.name,
        ageGroup: data.ageGroup,
        order: data.order || 0,
      },
    })
    revalidatePath("/admin/games/match-words")
    return { success: true, game }
  } catch (error: any) {
    console.error("Failed to create game:", error)
    return { success: false, error: error.message }
  }
}

// GET GAMES WITH TOPICS
export async function getMatchWordGames(ageGroup?: string) {
  try {
    const games = await prisma.matchWordGame.findMany({
      where: ageGroup ? { ageGroup } : undefined,
      include: {
        topics: {
          include: {
            items: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    })
    return { success: true, games }
  } catch (error: any) {
    console.error("Failed to get games:", error)
    return { success: false, error: error.message }
  }
}

// UPDATE GAME
export async function updateMatchWordGame(id: string, data: { name?: string; order?: number }) {
  try {
    const game = await prisma.matchWordGame.update({
      where: { id },
      data,
    })
    revalidatePath("/admin/games/match-words")
    return { success: true, game }
  } catch (error: any) {
    console.error("Failed to update game:", error)
    return { success: false, error: error.message }
  }
}

// DELETE GAME
export async function deleteMatchWordGame(id: string) {
  try {
    await prisma.matchWordGame.delete({
      where: { id },
    })
    revalidatePath("/admin/games/match-words")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete game:", error)
    return { success: false, error: error.message }
  }
}

// CREATE TOPIC
export async function createMatchWordTopic(data: { gameId: string; name: string; ageGroup: string; icon: string }) {
  try {
    const slug = toSlug(data.name)
    const topic = await prisma.matchWordTopic.create({
      data: {
        gameId: data.gameId,
        name: data.name,
        ageGroup: data.ageGroup,
        icon: data.icon,
        slug: slug,
      },
    })
    revalidatePath("/admin/games/match-words")
    return { success: true, topic }
  } catch (error: any) {
    console.error("Failed to create topic:", error)
    return { success: false, error: error.message }
  }
}

// MOVE TOPIC
export async function moveMatchWordTopic(id: string, targetGameId: string) {
  try {
    const topic = await prisma.matchWordTopic.update({
      where: { id },
      data: { gameId: targetGameId }
    })
    revalidatePath("/admin/games/match-words")
    return { success: true, topic }
  } catch (error: any) {
    console.error("Failed to move topic:", error)
    return { success: false, error: error.message }
  }
}

// DELETE TOPIC
export async function deleteMatchWordTopic(id: string) {
  try {
    await prisma.matchWordTopic.delete({
      where: { id },
    })
    revalidatePath("/admin/games/match-words")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete topic:", error)
    return { success: false, error: error.message }
  }
}

// ADD ITEM TO TOPIC
export async function addMatchWordItem(data: { topicId: string; word: string; imageUrl?: string; emoji?: string }) {
  try {
    const item = await prisma.matchWordItem.create({
      data: {
        topicId: data.topicId,
        word: data.word,
        imageUrl: data.imageUrl,
        emoji: data.emoji,
      },
    })
    revalidatePath("/admin/games/match-words")
    return { success: true, item }
  } catch (error: any) {
    console.error("Failed to add item:", error)
    return { success: false, error: error.message }
  }
}

// UPDATE ITEM
export async function updateMatchWordItem(id: string, data: { word: string; imageUrl?: string; emoji?: string }) {
  try {
    const item = await prisma.matchWordItem.update({
      where: { id },
      data: {
        word: data.word,
        imageUrl: data.imageUrl,
        emoji: data.emoji,
      },
    })
    revalidatePath("/admin/games/match-words")
    return { success: true, item }
  } catch (error: any) {
    console.error("Failed to update item:", error)
    return { success: false, error: error.message }
  }
}

// DELETE ITEM
export async function deleteMatchWordItem(id: string) {
  try {
    await prisma.matchWordItem.delete({
      where: { id },
    })
    revalidatePath("/admin/games/match-words")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete item:", error)
    return { success: false, error: error.message }
  }
}
