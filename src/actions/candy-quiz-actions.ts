"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { toSlug } from "@/lib/slugify";
import { revalidatePath } from "next/cache";

import type {
  QuizQuestionOption,
  QuizQuestion,
  QuizRound,
  SaveCandyQuizPayload,
} from "@/types/candy-quiz";



export async function getCandyQuizGameDetailsAction(topicId: string) {
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

    // Group items by roundIndex
    const roundsMap: Record<number, typeof topic.items> = {};
    topic.items.forEach((item) => {
      const rIdx = item.roundIndex ?? 0;
      if (!roundsMap[rIdx]) roundsMap[rIdx] = [];
      roundsMap[rIdx].push(item);
    });

    const roundIndices = Object.keys(roundsMap).map(Number).sort((a, b) => a - b);
    const loadedRounds: QuizRound[] = [];

    roundIndices.forEach((rIdx, i) => {
      const roundItems = roundsMap[rIdx];
      const questions: QuizQuestion[] = roundItems.map((item, idx) => {
        let options: QuizQuestionOption[] = [];
        try {
          if (item.labelB) {
            const parsed = JSON.parse(item.labelB);
            if (Array.isArray(parsed.options)) {
              options = parsed.options;
            }
          }
        } catch (e) {
          options = [];
        }

        // Fallback default options if parsing failed
        if (options.length === 0) {
          options = [
            { id: "A", text: "", isCorrect: true },
            { id: "B", text: "", isCorrect: false },
            { id: "C", text: "", isCorrect: false },
            { id: "D", text: "", isCorrect: false },
          ];
        }

        return {
          id: item.id || `q-${i}-${idx}`,
          question: item.word || "",
          imageUrl: item.imageUrl || undefined,
          options,
        };
      });

      loadedRounds.push({
        id: `round-${i + 1}`,
        title: `Vòng ${i + 1}`,
        questions,
      });
    });

    return {
      success: true,
      topic: {
        id: topic.id,
        title: topic.name,
        gradeLevel: topic.ageGroup,
        rounds: loadedRounds.length > 0 ? loadedRounds : undefined,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Không thể tải chi tiết bài tập!" };
  }
}

export async function saveCandyQuizGameAction(data: SaveCandyQuizPayload) {
  try {
    const session = await auth();

    // Flatten all questions across rounds into items
    const flatItems: Array<{
      roundIndex: number;
      word: string;
      imageUrl: string | null;
      labelB: string;
    }> = [];

    data.rounds.forEach((round, rIdx) => {
      round.questions.forEach((q) => {
        flatItems.push({
          roundIndex: rIdx,
          word: q.question.trim(),
          imageUrl: q.imageUrl || null,
          labelB: JSON.stringify({
            options: q.options.map((opt, idx) => ({
              id: opt.id || String.fromCharCode(65 + idx),
              text: opt.text.trim(),
              isCorrect: Boolean(opt.isCorrect),
            })),
          }),
        });
      });
    });

    if (flatItems.length === 0) {
      return { success: false, error: "Bài tập phải có ít nhất 1 câu hỏi!" };
    }

    const targetGameMode = data.gameMode || "candy-quiz";
    const isTreasure = targetGameMode === "treasure-hunt";
    const targetGameName = isTreasure ? "Trò chơi Truy tìm Kho báu" : "Trò chơi Trắc nghiệm Kẹo Ngọt";
    const defaultIcon = isTreasure ? "🗺️" : "🍬";

    // If updating an existing topic
    if (data.topicId) {
      await prisma.matchWordItem.deleteMany({
        where: { topicId: data.topicId },
      });

      const updatedTopic = await prisma.matchWordTopic.update({
        where: { id: data.topicId },
        data: {
          name: data.title,
          ageGroup: data.gradeLevel || "kids-2-5",
          audioMode: "NONE",
          gameMode: targetGameMode,
          items: {
            create: flatItems.map((item) => ({
              roundIndex: item.roundIndex,
              word: item.word,
              imageUrl: item.imageUrl,
              labelB: item.labelB,
              audioUrl: null,
              audioBUrl: null,
            })),
          },
        },
      });

      revalidatePath("/teacher");
      return { success: true, topicId: updatedTopic.id, slug: updatedTopic.slug };
    }

    // Create container game if not exists
    let game = await prisma.matchWordGame.findFirst({
      where: {
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

    const topic = await prisma.matchWordTopic.create({
      data: {
        gameId: game.id,
        name: data.title,
        slug,
        ageGroup: data.gradeLevel || "kids-2-5",
        icon: defaultIcon,
        audioMode: "NONE",
        gameMode: targetGameMode,
        teacherId: session?.user?.id || null,
        items: {
          create: flatItems.map((item) => ({
            roundIndex: item.roundIndex,
            word: item.word,
            imageUrl: item.imageUrl,
            labelB: item.labelB,
            audioUrl: null,
            audioBUrl: null,
          })),
        },
      },
    });

    revalidatePath("/teacher");
    return { success: true, topicId: topic.id, slug: topic.slug };
  } catch (error: any) {
    console.error("Failed to save quiz game:", error);
    return { success: false, error: error.message || "Failed to save game to database" };
  }
}

export async function getTeacherQuizGamesAction() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: true, topics: [] };
    }

    const isAdmin = session.user.role === "ADMIN";
    const whereCondition: any = isAdmin
      ? {
          OR: [
            { gameMode: "candy-quiz" },
            { gameMode: "treasure-hunt" },
            { game: { name: { contains: "Trắc nghiệm" } } },
            { game: { name: { contains: "Kho báu" } } },
          ],
        }
      : {
          teacherId: session.user.id,
          OR: [
            { gameMode: "candy-quiz" },
            { gameMode: "treasure-hunt" },
            { game: { name: { contains: "Trắc nghiệm" } } },
            { game: { name: { contains: "Kho báu" } } },
          ],
        };

    const rawTopics = await prisma.matchWordTopic.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        createdAt: true,
        gameMode: true,
        game: {
          select: {
            name: true,
            level: true,
          },
        },
        items: {
          take: 4,
          select: {
            id: true,
            word: true,
            imageUrl: true,
            labelB: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const topics = rawTopics.map((t) => {
      const isTreasure = t.gameMode === "treasure-hunt" || t.game?.name?.includes("Kho báu");
      return {
        id: t.id,
        name: t.name,
        createdAt: t.createdAt,
        gameMode: t.gameMode || (isTreasure ? "treasure-hunt" : "candy-quiz"),
        game: {
          ...t.game,
          name: t.game?.name || (isTreasure ? "Trò chơi Truy tìm Kho báu" : "Trò chơi Trắc nghiệm Kẹo Ngọt"),
        },
        items: t.items,
        totalItems: t._count.items,
      };
    });

    return { success: true, topics };
  } catch (error: any) {
    console.error("Failed to fetch teacher quiz games:", error);
    return { success: false, error: error.message || "Failed to fetch games", topics: [] };
  }
}
