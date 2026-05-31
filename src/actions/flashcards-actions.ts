"use server"

import prisma from "@/lib/prisma"
import { unstable_cache } from "next/cache"

// 1. Caching categories query
const fetchCategories = async () => {
  return prisma.flashcardCategory.findMany({
    include: {
      topics: {
        orderBy: {
          name: 'asc'
        }
      }
    },
    orderBy: {
      slug: 'asc' // Sắp xếp theo slug để giữ thứ tự Kids, Kid, Teen, Readers
    }
  });
};

export const getCachedFlashcardCategories = unstable_cache(
  fetchCategories,
  ["flashcard-categories-cache-v1"],
  { revalidate: 43200, tags: ["flashcard-categories"] } // Cache for 12 hours
);

/**
 * Lấy danh sách toàn bộ các danh mục tuổi (FlashcardCategory)
 * kèm theo danh sách các chủ đề (FlashcardTopic) của danh mục đó.
 */
export async function getFlashcardCategories() {
  try {
    return await getCachedFlashcardCategories();
  } catch (error) {
    console.error("Lỗi khi lấy danh mục flashcard:", error);
    return [];
  }
}

// 2. Caching flashcards by topic query
const fetchFlashcardsByTopic = async (topicId: string) => {
  return prisma.globalFlashcard.findMany({
    where: {
      topicId: topicId
    },
    orderBy: {
      orderIndex: 'asc'
    }
  });
};

export const getCachedFlashcardsByTopic = unstable_cache(
  fetchFlashcardsByTopic,
  ["flashcards-by-topic-cache-v1"],
  { revalidate: 43200, tags: ["flashcards"] } // Cache for 12 hours
);

/**
 * Lấy danh sách toàn bộ các thẻ flashcard thuộc một chủ đề (topicId)
 * @param topicId ID của chủ đề cần lấy thẻ
 */
export async function getFlashcardsByTopic(topicId: string) {
  try {
    return await getCachedFlashcardsByTopic(topicId);
  } catch (error) {
    console.error(`Lỗi khi lấy flashcards cho chủ đề ${topicId}:`, error);
    return [];
  }
}

