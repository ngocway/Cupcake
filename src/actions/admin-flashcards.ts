"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { toSlug } from "@/lib/slugify"
import { revalidatePath, revalidateTag } from "next/cache"

/**
 * Helper để kiểm tra quyền Admin bảo mật
 */
async function checkAdminAuth() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized: Yêu cầu quyền quản trị viên Admin.")
  }
}

/**
 * Helper để làm mới bộ nhớ đệm trang học sinh
 */
async function triggerCacheRevalidation() {
  try {
    revalidateTag("flashcards", "max")
    revalidateTag("flashcard-categories", "max")
    revalidateTag("flashcard-categories-v2", "max")
    revalidatePath("/flashcards")
    revalidatePath("/")
  } catch (error) {
    console.error("Lỗi khi revalidate cache:", error)
  }
}

// ============================================================================
// PHÂN HỆ 1: CRUD FLASHCARDS (THẺ HỌC)
// ============================================================================

interface CreateFlashcardData {
  topicId: string
  word: string
  phonetic?: string
  definition?: string
  definitionVi?: string
  definitionTh?: string
  definitionId?: string
  exampleSentence?: string
  imageUrl?: string
  audioUrl?: string
}

export async function adminCreateFlashcard(data: CreateFlashcardData) {
  await checkAdminAuth()

  try {
    // 1. Tìm orderIndex cao nhất hiện tại của topic để đẩy thẻ mới xuống dưới cùng
    const maxCard = await prisma.globalFlashcard.findFirst({
      where: { topicId: data.topicId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true }
    })

    const orderIndex = maxCard ? maxCard.orderIndex + 1 : 0

    // 2. Tạo thẻ mới
    const newCard = await prisma.globalFlashcard.create({
      data: {
        topicId: data.topicId,
        word: data.word.trim(),
        phonetic: data.phonetic?.trim() || null,
        definition: data.definition?.trim() || null,
        definitionVi: data.definitionVi?.trim() || null,
        definitionTh: data.definitionTh?.trim() || null,
        definitionId: data.definitionId?.trim() || null,
        exampleSentence: data.exampleSentence?.trim() || null,
        imageUrl: data.imageUrl?.trim() || null,
        audioUrl: data.audioUrl?.trim() || null,
        orderIndex
      }
    })

    // 3. Làm mới cache tức thì
    await triggerCacheRevalidation()

    return { success: true, card: newCard }
  } catch (error: any) {
    console.error("Lỗi khi thêm flashcard:", error)
    return { success: false, error: error.message || "Không thể tạo thẻ học." }
  }
}

interface UpdateFlashcardData {
  topicId?: string
  word?: string
  phonetic?: string | null
  definition?: string | null
  definitionVi?: string | null
  definitionTh?: string | null
  definitionId?: string | null
  exampleSentence?: string | null
  imageUrl?: string | null
  audioUrl?: string | null
}

export async function adminUpdateFlashcard(id: string, data: UpdateFlashcardData) {
  await checkAdminAuth()

  try {
    const updatedCard = await prisma.globalFlashcard.update({
      where: { id },
      data: {
        ...(data.topicId && { topicId: data.topicId }),
        ...(data.word && { word: data.word.trim() }),
        phonetic: data.phonetic !== undefined ? (data.phonetic?.trim() || null) : undefined,
        definition: data.definition !== undefined ? (data.definition?.trim() || null) : undefined,
        definitionVi: data.definitionVi !== undefined ? (data.definitionVi?.trim() || null) : undefined,
        definitionTh: data.definitionTh !== undefined ? (data.definitionTh?.trim() || null) : undefined,
        definitionId: data.definitionId !== undefined ? (data.definitionId?.trim() || null) : undefined,
        exampleSentence: data.exampleSentence !== undefined ? (data.exampleSentence?.trim() || null) : undefined,
        imageUrl: data.imageUrl !== undefined ? (data.imageUrl?.trim() || null) : undefined,
        audioUrl: data.audioUrl !== undefined ? (data.audioUrl?.trim() || null) : undefined
      }
    })

    await triggerCacheRevalidation()

    return { success: true, card: updatedCard }
  } catch (error: any) {
    console.error(`Lỗi khi sửa flashcard ${id}:`, error)
    return { success: false, error: error.message || "Không thể chỉnh sửa thẻ học." }
  }
}

export async function adminDeleteFlashcard(id: string) {
  await checkAdminAuth()

  try {
    await prisma.globalFlashcard.delete({
      where: { id }
    })

    await triggerCacheRevalidation()

    return { success: true }
  } catch (error: any) {
    console.error(`Lỗi khi xóa flashcard ${id}:`, error)
    return { success: false, error: error.message || "Không thể xóa thẻ học." }
  }
}

// ============================================================================
// PHÂN HỆ 2: CRUD TOPICS (CHỦ ĐỀ)
// ============================================================================

export async function adminCreateTopic(targetAudience: string, name: string, iconUrl?: string) {
  await checkAdminAuth()

  try {
    const trimmedName = name.trim()
    const slug = toSlug(trimmedName)

    if (!slug) {
      return { success: false, error: "Tên chủ đề không hợp lệ." }
    }

    // Kiểm tra trùng lặp slug trong cùng một đối tượng (Target Audience)
    const existing = await prisma.flashcardTopic.findUnique({
      where: {
        targetAudience_slug: {
          targetAudience,
          slug
        }
      }
    })

    if (existing) {
      return { success: false, error: "Chủ đề này đã tồn tại trong nhóm tuổi này." }
    }

    const newTopic = await prisma.flashcardTopic.create({
      data: {
        targetAudience,
        name: trimmedName,
        slug,
        iconUrl: iconUrl?.trim() || null
      }
    })

    await triggerCacheRevalidation()

    return { success: true, topic: newTopic }
  } catch (error: any) {
    console.error("Lỗi khi thêm chủ đề mới:", error)
    return { success: false, error: error.message || "Không thể thêm chủ đề." }
  }
}

export async function adminUpdateTopic(id: string, name: string, targetAudience: string, iconUrl?: string) {
  await checkAdminAuth()

  try {
    const trimmedName = name.trim()
    const slug = toSlug(trimmedName)

    if (!slug) {
      return { success: false, error: "Tên chủ đề không hợp lệ." }
    }

    // Kiểm tra xem có bị trùng slug với chủ đề khác trong cùng targetAudience không
    const existing = await prisma.flashcardTopic.findFirst({
      where: {
        targetAudience,
        slug,
        id: { not: id }
      }
    })

    if (existing) {
      return { success: false, error: "Tên chủ đề bị trùng với chủ đề khác trong cùng nhóm tuổi." }
    }

    const updatedTopic = await prisma.flashcardTopic.update({
      where: { id },
      data: {
        name: trimmedName,
        targetAudience,
        slug,
        iconUrl: iconUrl !== undefined ? (iconUrl?.trim() || null) : undefined
      }
    })

    await triggerCacheRevalidation()

    return { success: true, topic: updatedTopic }
  } catch (error: any) {
    console.error(`Lỗi khi cập nhật chủ đề ${id}:`, error)
    return { success: false, error: error.message || "Không thể cập nhật chủ đề." }
  }
}

export async function adminDeleteTopic(id: string) {
  await checkAdminAuth()

  try {
    // Cascade delete sẽ tự động hoạt động trên PostgreSQL (Prisma schema onDelete: Cascade)
    await prisma.flashcardTopic.delete({
      where: { id }
    })

    await triggerCacheRevalidation()

    return { success: true }
  } catch (error: any) {
    console.error(`Lỗi khi xóa chủ đề ${id}:`, error)
    return { success: false, error: error.message || "Không thể xóa chủ đề." }
  }
}
