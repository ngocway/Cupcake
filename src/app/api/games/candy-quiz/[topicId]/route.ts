import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;

    if (!topicId) {
      return NextResponse.json(
        { success: false, error: "Thiếu topicId!" },
        { status: 400 }
      );
    }

    const topic = await prisma.matchWordTopic.findUnique({
      where: { id: topicId },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!topic) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy bài tập trắc nghiệm!" },
        { status: 404 }
      );
    }

    // Group items by roundIndex
    const roundsMap: Record<number, typeof topic.items> = {};
    topic.items.forEach((item) => {
      const rIdx = item.roundIndex ?? 0;
      if (!roundsMap[rIdx]) roundsMap[rIdx] = [];
      roundsMap[rIdx].push(item);
    });

    const roundIndices = Object.keys(roundsMap)
      .map(Number)
      .sort((a, b) => a - b);

    const formattedRounds = roundIndices.map((rIdx, i) => {
      const roundItems = roundsMap[rIdx];
      const questions = roundItems.map((item, qIdx) => {
        let options: Array<{ id: string; text: string; isCorrect: boolean }> = [];
        try {
          if (item.labelB) {
            const parsed = JSON.parse(item.labelB);
            if (Array.isArray(parsed.options)) {
              options = parsed.options;
            }
          }
        } catch {
          options = [];
        }

        if (options.length === 0) {
          options = [
            { id: "A", text: "Đáp án A", isCorrect: true },
            { id: "B", text: "Đáp án B", isCorrect: false },
          ];
        }

        const correctIdx = options.findIndex((opt) => opt.isCorrect);
        const resolvedCorrectIdx = correctIdx >= 0 ? correctIdx : 0;
        const correctText = options[resolvedCorrectIdx]?.text || "";

        return {
          id: item.id || `q-${rIdx}-${qIdx}`,
          question: item.word || "",
          imageUrl: item.imageUrl || null,
          answers: options.map((opt) => opt.text),
          correct: resolvedCorrectIdx,
          fill: correctText,
        };
      });

      return {
        roundIndex: rIdx,
        roundNumber: i + 1,
        title: `Vòng ${i + 1}`,
        questions,
      };
    });

    return NextResponse.json({
      success: true,
      topicId: topic.id,
      topicName: topic.name,
      totalQuestions: topic.items.length,
      rounds: formattedRounds,
    });
  } catch (error: any) {
    console.error("Error fetching candy quiz data:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi nạp dữ liệu bài tập!" },
      { status: 500 }
    );
  }
}
