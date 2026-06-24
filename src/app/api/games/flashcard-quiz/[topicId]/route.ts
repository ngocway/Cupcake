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

    // Find the topic to check targetAudience (for distractor fallback)
    const topic = await prisma.flashcardTopic.findUnique({
      where: { id: topicId },
      select: { name: true, targetAudience: true }
    })

    if (!topic) {
      return NextResponse.json({ success: false, error: "Topic not found" }, { status: 404 })
    }

    // Get cards in the topic that have a quizQuestion populated
    const quizCards = await prisma.globalFlashcard.findMany({
      where: {
        topicId,
        quizQuestion: { not: null },
        NOT: {
          quizQuestion: ""
        }
      },
      select: {
        id: true,
        word: true,
        imageUrl: true,
        quizQuestion: true,
        quizAudioUrl: true
      }
    })

    if (quizCards.length === 0) {
      return NextResponse.json({ success: true, questions: [] })
    }

    // Get all words in the same topic for distractors
    const allTopicCards = await prisma.globalFlashcard.findMany({
      where: { topicId },
      select: { word: true }
    })

    let distractorPool = Array.from(new Set(allTopicCards.map(c => c.word.trim()).filter(Boolean)))

    // Fallback distractor pool: if topic has too few cards, grab words from other topics in same targetAudience
    if (distractorPool.length < 5) {
      const extraCards = await prisma.globalFlashcard.findMany({
        where: {
          topic: {
            targetAudience: topic.targetAudience
          }
        },
        select: { word: true },
        take: 30
      })
      const extraWords = extraCards.map(c => c.word.trim()).filter(Boolean)
      distractorPool = Array.from(new Set([...distractorPool, ...extraWords]))
    }

    const genericFallbacks = ["Apple", "Dog", "Cat", "Sun", "Book", "Tree", "Bird", "Fish", "Car", "Milk"]

    // Construct randomized questions and multiple choices
    const questions = quizCards.map(card => {
      const correctWord = card.word.trim()

      // Exclude correct answer
      let availableDistractors = distractorPool.filter(w => w.toLowerCase() !== correctWord.toLowerCase())

      // Shuffle and pick 3
      availableDistractors = shuffleArray(availableDistractors)
      let selectedDistractors = availableDistractors.slice(0, 3)

      // Fallback if not enough distractors exist in database
      if (selectedDistractors.length < 3) {
        const needed = 3 - selectedDistractors.length
        const extraFallbacks = genericFallbacks
          .filter(f => f.toLowerCase() !== correctWord.toLowerCase() && !selectedDistractors.includes(f))
          .slice(0, needed)
        selectedDistractors = [...selectedDistractors, ...extraFallbacks]
      }

      // Generate 4 randomized options
      const options = shuffleArray([correctWord, ...selectedDistractors])

      return {
        id: card.id,
        word: correctWord,
        question: card.quizQuestion,
        audioUrl: card.quizAudioUrl,
        imageUrl: card.imageUrl,
        options
      }
    })

    // Return questions shuffled
    return NextResponse.json({
      success: true,
      topicName: topic.name,
      questions: shuffleArray(questions)
    })

  } catch (error: any) {
    console.error("API error getting flashcard quiz:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
