import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;

    if (!topicId) {
      return NextResponse.json({ success: false, error: "Missing topicId" }, { status: 400 });
    }

    // 1. Try querying Teacher-created MatchWordTopic & items
    const matchTopic = await prisma.matchWordTopic.findUnique({
      where: { id: topicId },
      include: { items: true },
    });

    if (matchTopic && matchTopic.items && matchTopic.items.length > 0) {
      const cards = matchTopic.items.map((item) => ({
        id: item.id,
        word: item.word,
        imageUrl: item.imageUrl || null,
        audioUrl: item.audioUrl || null,
      }));

      return NextResponse.json({
        success: true,
        topicName: matchTopic.name,
        isTeacherGame: true,
        cards,
      });
    }

    // 2. Fallback: Query system FlashcardTopic & flashcards
    const flashcardTopic = await prisma.flashcardTopic.findUnique({
      where: { id: topicId },
      include: {
        flashcards: {
          where: {
            imageUrl: { not: null },
            NOT: { imageUrl: "" },
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (flashcardTopic && flashcardTopic.flashcards && flashcardTopic.flashcards.length > 0) {
      const cards = flashcardTopic.flashcards.map((f: any) => ({
        id: f.id,
        word: f.englishText || f.word || "",
        imageUrl: f.imageUrl || null,
        audioUrl: f.audioUrl || null,
      }));

      return NextResponse.json({
        success: true,
        topicName: flashcardTopic.name,
        isTeacherGame: false,
        cards,
      });
    }

    return NextResponse.json({
      success: false,
      error: "No cards found for this topic",
    }, { status: 404 });
  } catch (error: any) {
    console.error("[Flashcard Match API Error]:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to fetch topic cards",
    }, { status: 500 });
  }
}
