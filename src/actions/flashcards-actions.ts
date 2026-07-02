"use server"

import prisma from "@/lib/prisma"
import { unstable_cache } from "next/cache"

// 1. Caching topics query
const fetchTopics = async () => {
  return prisma.flashcardTopic.findMany({
    orderBy: {
      name: 'asc'
    },
    include: {
      _count: {
        select: {
          flashcards: true
        }
      }
    }
  });
};

export const getCachedFlashcardTopics = unstable_cache(
  fetchTopics,
  ["flashcard-topics-cache-v2"],
  { revalidate: 43200, tags: ["flashcard-categories-v2"] } // Updated tags/cache-key to v2
);

/**
 * Lấy danh sách toàn bộ các chủ đề (FlashcardTopic)
 */
export async function getFlashcardTopics() {
  try {
    return await getCachedFlashcardTopics();
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
    include: {
      translations: true
    },
    orderBy: {
      orderIndex: 'asc'
    }
  });
};

export const getCachedFlashcardsByTopic = unstable_cache(
  fetchFlashcardsByTopic,
  ["flashcards-by-topic-cache-v3"],
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

