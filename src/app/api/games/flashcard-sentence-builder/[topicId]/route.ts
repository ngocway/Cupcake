import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Helper to clean punctuation from a word
function cleanWord(word: string): string {
  // Removes ending/surrounding punctuation but keeps alphanumeric/casing
  return word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim()
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
      select: { id: true, name: true, targetAudiences: true }
    })

    if (!topic) {
      return NextResponse.json({ success: false, error: "Topic not found" }, { status: 404 })
    }

    // Fetch flashcards that have both imageUrl and exampleSentence
    const cards = await prisma.globalFlashcard.findMany({
      where: {
        topicId,
        imageUrl: { not: null },
        exampleSentence: { not: null },
        AND: [
          { imageUrl: { not: "" } },
          { exampleSentence: { not: "" } }
        ]
      },
      select: {
        id: true,
        word: true,
        imageUrl: true,
        audioUrl: true,
        exampleSentence: true
      },
      orderBy: { orderIndex: "asc" }
    })

    // Minimum requirement of 3 flashcards to play
    if (cards.length < 3) {
      return NextResponse.json({ success: true, game: { questions: [] } })
    }

    const targetAudiences = topic.targetAudiences

    // Get fallback words from other cards in the same topic
    const otherCardsInSameTopic = await prisma.globalFlashcard.findMany({
      where: {
        topicId,
        NOT: {
          id: {
            in: cards.map(c => c.id)
          }
        }
      },
      select: { word: true },
      take: 30
    })

    let fallbackWords = otherCardsInSameTopic.map(c => c.word.trim())

    // If not enough fallback words, fetch from other topics of the same age group
    if (fallbackWords.length < 15) {
      const otherTopics = await prisma.flashcardTopic.findMany({
        where: {
          targetAudiences: {
            hasSome: targetAudiences
          },
          NOT: { id: topicId }
        },
        select: { id: true }
      })

      const otherTopicIds = otherTopics.map(t => t.id)
      if (otherTopicIds.length > 0) {
        const otherCards = await prisma.globalFlashcard.findMany({
          where: {
            topicId: { in: otherTopicIds }
          },
          select: { word: true },
          take: 40
        })
        fallbackWords = [...fallbackWords, ...otherCards.map(c => c.word.trim())]
      }
    }

    // Filter unique non-empty words
    fallbackWords = Array.from(new Set(fallbackWords.map(w => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim()).filter(w => w.length > 0)))

    const questions = cards.map(card => {
      const sentence = card.exampleSentence || ""
      
      // Clean and split example sentence
      const expected = sentence
        .trim()
        .split(/\s+/)
        .map(w => cleanWord(w))
        .filter(w => w.length > 0)

      // Select 2-3 distractor words that are not in the expected array
      const eligibleDistractors = fallbackWords.filter(w => !expected.some(ew => ew.toLowerCase() === w.toLowerCase()))
      const shuffledDistractors = shuffleArray(eligibleDistractors)
      const distractorCount = Math.floor(Math.random() * 2) + 2 // 2 or 3 distractors
      const chosenDistractors = shuffledDistractors.slice(0, distractorCount)

      // If we still lack distractors, fallback to generic English words
      const defaultPool = ["dog", "cat", "cow", "apple", "banana", "sun", "book", "happy", "run", "play", "jump", "tree", "bird", "fish", "ball", "toy"]
      while (chosenDistractors.length < distractorCount) {
        const extra = defaultPool[Math.floor(Math.random() * defaultPool.length)]
        if (!expected.some(ew => ew.toLowerCase() === extra.toLowerCase()) && !chosenDistractors.some(d => d.toLowerCase() === extra.toLowerCase())) {
          chosenDistractors.push(extra)
        }
      }

      // Combine expected words and distractors
      const pool = [...expected, ...chosenDistractors]

      return {
        id: card.id,
        image: card.imageUrl,
        expected,
        pool: shuffleArray(pool),
        audio: card.audioUrl,
        audioRate: 1.0 // Playback rate 1.0 to prevent double slowing down of TTS
      }
    })

    // Shuffle the entire questions set to randomize play order
    const shuffledQuestions = shuffleArray(questions)

    return NextResponse.json({
      success: true,
      game: {
        questions: shuffledQuestions
      }
    })

  } catch (error: any) {
    console.error("API error getting flashcard sentence builder game:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
