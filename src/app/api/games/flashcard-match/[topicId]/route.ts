import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const topicId = (await params).topicId

    // Find the topic
    const topic = await prisma.flashcardTopic.findUnique({
      where: { id: topicId },
      select: { name: true, targetAudiences: true }
    })

    if (!topic) {
      return NextResponse.json({ success: false, error: "Topic not found" }, { status: 404 })
    }

    // Get all cards in this topic that have an imageUrl
    const cards = await prisma.globalFlashcard.findMany({
      where: {
        topicId,
        imageUrl: { not: null },
        NOT: { imageUrl: "" }
      },
      select: {
        id: true,
        word: true,
        imageUrl: true,
        audioUrl: true,
        audioWordUrl: true,
      },
      orderBy: { orderIndex: "asc" }
    })

    if (cards.length === 0) {
      return NextResponse.json({ success: true, cards: [], topicName: topic.name })
    }

    // Shuffle and return all cards (the game will pick 7 at a time client-side)
    return NextResponse.json({
      success: true,
      topicName: topic.name,
      cards: shuffleArray(cards)
    })

  } catch (error: any) {
    console.error("API error getting flashcard match cards:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
