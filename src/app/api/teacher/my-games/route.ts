import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { TEACHER_GAME_CATEGORIES } from "@/constants/teacher-game-categories";
import { capitalizeFirstLetter } from "@/lib/text-case";

export type MyGamesCategory = "all" | "match" | "choice" | "flip" | "quiz";

function classifyTopicCategory(
  gameMode: string | null | undefined,
  gameName?: string | null
): "match" | "choice" | "flip" | "quiz" {
  const mode = gameMode || "";
  const name = gameName || "";

  if (TEACHER_GAME_CATEGORIES.choice.gameModes.includes(mode)) return "choice";
  if (TEACHER_GAME_CATEGORIES.flip.gameModes.includes(mode) || name.includes("Lật Ảnh")) return "flip";
  if (
    TEACHER_GAME_CATEGORIES.quiz.gameModes.includes(mode) ||
    name.includes("Trắc nghiệm") ||
    name.includes("Kho báu")
  ) {
    return "quiz";
  }
  if (TEACHER_GAME_CATEGORIES.match.gameModes.includes(mode)) return "match";
  if (name.includes("Bắn súng") || name.includes("Đập Trứng") || name.includes("Toán")) {
    return "choice";
  }
  return "match";
}

function buildCategoryFilter(category: MyGamesCategory) {
  const matchModes = TEACHER_GAME_CATEGORIES.match.gameModes;
  const choiceModes = TEACHER_GAME_CATEGORIES.choice.gameModes;
  const flipModes = TEACHER_GAME_CATEGORIES.flip.gameModes;
  const quizModes = TEACHER_GAME_CATEGORIES.quiz.gameModes;

  if (category === "match") {
    return {
      AND: [
        {
          OR: [{ gameMode: { in: matchModes } }, { gameMode: null }],
        },
        {
          game: {
            NOT: [
              { name: { contains: "Lật Ảnh" } },
              { name: { contains: "Trắc nghiệm" } },
              { name: { contains: "Kho báu" } },
              { name: { contains: "Bắn súng" } },
              { name: { contains: "Đập Trứng" } },
              { name: { contains: "Toán" } },
            ],
          },
        },
      ],
    };
  }

  if (category === "choice") {
    return {
      gameMode: { in: choiceModes },
    };
  }

  if (category === "flip") {
    return {
      OR: [
        { gameMode: { in: flipModes } },
        { game: { name: { contains: "Lật Ảnh" } } },
      ],
    };
  }

  if (category === "quiz") {
    return {
      OR: [
        { gameMode: { in: quizModes } },
        { game: { name: { contains: "Trắc nghiệm" } } },
        { game: { name: { contains: "Kho báu" } } },
      ],
      NOT: [
        { gameMode: { in: choiceModes } },
        { gameMode: { in: flipModes } },
      ],
    };
  }

  return {};
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        isAdmin: false,
        games: [],
        counts: { all: 0, match: 0, choice: 0, flip: 0, quiz: 0 },
        pagination: { page: 1, limit: 24, total: 0, hasMore: false },
      });
    }

    const { searchParams } = new URL(req.url);
    const rawCat = (searchParams.get("category") || "all").toLowerCase();
    const category: MyGamesCategory =
      rawCat === "match" || rawCat === "choice" || rawCat === "flip" || rawCat === "quiz"
        ? rawCat
        : "all";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(60, Math.max(1, parseInt(searchParams.get("limit") || "24", 10) || 24));
    const q = (searchParams.get("q") || "").trim();
    const isAdmin = session.user.role === "ADMIN";
    const scope = isAdmin && searchParams.get("scope") === "mine" ? "mine" : isAdmin ? "all" : "mine";
    const includeCounts = searchParams.get("includeCounts") !== "0";

    // Base filter: exclude library-* question sets + scope by teacherId when not Admin viewing all
    const baseAnd: any[] = [
      {
        OR: [
          { gameMode: null },
          { NOT: { gameMode: { startsWith: "library-" } } },
        ],
      },
    ];

    if (scope === "mine") {
      baseAnd.push({ teacherId: session.user.id });
    }

    const listAnd: any[] = [...baseAnd];
    if (category !== "all") {
      listAnd.push(buildCategoryFilter(category));
    }
    if (q) {
      listAnd.push({
        name: { contains: q, mode: "insensitive" },
      });
    }

    const listWhere = { AND: listAnd };
    const needSeparateCount = Boolean(q) || !includeCounts;

    // Run paginated list query + single fast grouped counts query (joining game.name) in parallel
    const [rawTopics, explicitCount, modeGroups] = await Promise.all([
      prisma.matchWordTopic.findMany({
        where: listWhere,
        select: {
          id: true,
          name: true,
          slug: true,
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
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              word: true,
              imageUrl: true,
              imageBUrl: true,
              labelB: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      needSeparateCount
        ? prisma.matchWordTopic.count({ where: listWhere })
        : Promise.resolve(null),
      includeCounts
        ? scope === "mine"
          ? prisma.$queryRaw<Array<{ gameMode: string | null; gameName: string | null; cnt: bigint }>>`
              SELECT t."gameMode" AS "gameMode", g."name" AS "gameName", COUNT(*)::bigint AS cnt
              FROM "MatchWordTopic" t
              LEFT JOIN "MatchWordGame" g ON g.id = t."gameId"
              WHERE t."teacherId" = ${session.user.id}
                AND (t."gameMode" IS NULL OR t."gameMode" NOT LIKE 'library-%')
              GROUP BY t."gameMode", g."name"
            `
          : prisma.$queryRaw<Array<{ gameMode: string | null; gameName: string | null; cnt: bigint }>>`
              SELECT t."gameMode" AS "gameMode", g."name" AS "gameName", COUNT(*)::bigint AS cnt
              FROM "MatchWordTopic" t
              LEFT JOIN "MatchWordGame" g ON g.id = t."gameId"
              WHERE (t."gameMode" IS NULL OR t."gameMode" NOT LIKE 'library-%')
              GROUP BY t."gameMode", g."name"
            `
        : Promise.resolve(null),
    ]);

    // Calculate accurate category counts (including Flip games with gameMode='match' and game.name containing 'Lật Ảnh')
    let counts: { all: number; match: number; choice: number; flip: number; quiz: number } | undefined;
    if (modeGroups) {
      const c = { all: 0, match: 0, choice: 0, flip: 0, quiz: 0 };
      for (const g of modeGroups) {
        const n = Number(g.cnt || 0);
        c.all += n;
        const cat = classifyTopicCategory(g.gameMode, g.gameName);
        c[cat] += n;
      }
      counts = c;
    }

    const filteredTotal =
      explicitCount !== null
        ? explicitCount
        : counts
          ? counts[category]
          : rawTopics.length;

    // Format into unified card items
    const games = rawTopics.map((topic) => {
      const type = classifyTopicCategory(topic.gameMode, topic.game?.name);
      const totalItems = topic._count.items;

      if (type === "choice") {
        const isEgg = topic.gameMode === "choice-egg";
        const gameType = isEgg ? ("egg" as const) : ("shooter" as const);
        const playUrl = isEgg ? `/game/egg-smash/${topic.slug}` : `/game/shooter/${topic.slug}`;
        const editUrl = isEgg
          ? `/teacher/games/choice-egg/create?id=${topic.id}`
          : `/teacher/games/choice-shooter/create?id=${topic.id}`;

        const sampleQuestions = topic.items.slice(0, 3).map((item) => {
          let answer = "";
          try {
            const parsed = JSON.parse(item.labelB || "{}");
            answer = parsed.a || "";
          } catch {}
          return {
            id: item.id,
            q: item.word,
            a: answer,
          };
        });

        return {
          id: topic.id,
          code: topic.slug,
          title: topic.name,
          type: "choice" as const,
          createdAt: topic.createdAt.toISOString(),
          count: totalItems,
          countUnit: "questions" as const,
          gameMode: topic.gameMode || (isEgg ? "choice-egg" : "choice-shooter"),
          gameType,
          playUrl,
          editUrl,
          shareGamePath: playUrl,
          sampleQuestions,
          raw: {
            id: topic.id,
            code: topic.slug,
            name: topic.name,
            title: topic.name,
            gameMode: topic.gameMode,
            gameType,
          },
        };
      }

      if (type === "flip") {
        const isImageImage =
          topic.gameMode === "flip-image-image" ||
          Boolean(topic.game?.name?.includes("Ảnh-Ảnh")) ||
          topic.items.some((item) => Boolean(item.imageBUrl));
        const playUrl = `/game/memory-flip?topicId=${topic.id}`;
        const editUrl = isImageImage
          ? `/teacher/games/flip/create?type=image-image&topicId=${topic.id}`
          : `/teacher/games/flip/create?type=image-text&topicId=${topic.id}`;

        return {
          id: topic.id,
          title: topic.name,
          type: "flip" as const,
          createdAt: topic.createdAt.toISOString(),
          count: totalItems,
          countUnit: "pairs" as const,
          gameMode: topic.gameMode || "flip",
          isImageImage,
          playUrl,
          editUrl,
          shareGamePath: "/game/memory-flip",
          items: topic.items.map((item) => ({
            id: item.id,
            word: capitalizeFirstLetter(item.word),
            imageUrl: item.imageUrl,
            imageBUrl: item.imageBUrl,
            labelB: item.labelB,
          })),
          raw: {
            id: topic.id,
            name: topic.name,
            gameMode: topic.gameMode || "flip",
            isImageImage,
          },
        };
      }

      if (type === "quiz") {
        const isTreasure =
          topic.gameMode === "treasure-hunt" || Boolean(topic.game?.name?.includes("Kho báu"));
        const isShooter = topic.gameMode === "shooter-quiz";
        const resolvedMode = isShooter
          ? "shooter-quiz"
          : isTreasure
            ? "treasure-hunt"
            : "candy-quiz";
        const playUrl = isShooter
          ? `/game/shooter-quiz?topicId=${topic.id}`
          : isTreasure
            ? `/game/treasure-grid?topicId=${topic.id}`
            : `/student/game/candy-quiz?topicId=${topic.id}`;
        const editUrl = isShooter
          ? `/teacher/games/shooter-quiz/create?topicId=${topic.id}`
          : isTreasure
            ? `/teacher/games/treasure-hunt/create?topicId=${topic.id}`
            : `/teacher/games/candy-quiz/create?topicId=${topic.id}`;
        const shareGamePath = isShooter
          ? "/game/shooter-quiz"
          : isTreasure
            ? "/game/treasure-grid"
            : "/student/game/candy-quiz";

        return {
          id: topic.id,
          title: topic.name,
          type: "quiz" as const,
          createdAt: topic.createdAt.toISOString(),
          count: totalItems,
          countUnit: "questions" as const,
          gameMode: resolvedMode,
          playUrl,
          editUrl,
          shareGamePath,
          items: topic.items.slice(0, 3).map((item) => ({
            id: item.id,
            word: item.word,
            imageUrl: item.imageUrl,
          })),
          raw: {
            id: topic.id,
            name: topic.name,
            gameMode: resolvedMode,
          },
        };
      }

      // Default: match category
      const isTrain = topic.gameMode === "train";
      const isCutRope = topic.gameMode === "cut-rope";
      const isConveyorDrop =
        topic.gameMode === "conveyor-drop" || Boolean(topic.game?.name?.includes("Băng Chuyền"));
      const isImageImage =
        !isConveyorDrop &&
        !isTrain &&
        !isCutRope &&
        (Boolean(topic.game?.name?.includes("Ảnh - Ảnh")) ||
          topic.items.some((item) => Boolean(item.imageBUrl)));
      const isTextText =
        !isConveyorDrop &&
        !isTrain &&
        !isCutRope &&
        !isImageImage &&
        (topic.gameMode === "match-text-text" ||
          topic.gameMode === "library-text-text" ||
          Boolean(topic.game?.name?.includes("Chữ - Chữ")) ||
          topic.items.some((item) => Boolean(item.labelB && !item.imageUrl && !item.imageBUrl)));
      const isLineDraw =
        !isConveyorDrop && !isTrain && !isCutRope && topic.gameMode === "line";

      const playUrl = isTrain
        ? `/student/game/train?topicId=${topic.id}`
        : isCutRope
          ? `/student/game/cut-rope?topicId=${topic.id}`
          : isConveyorDrop
            ? `/student/game/conveyor-drop?topicId=${topic.id}`
            : isLineDraw || isTextText
              ? `/student/game/match-text-text?topicId=${topic.id}`
              : `/student/game/flashcard-match?topicId=${topic.id}`;

      const shareGamePath = isTrain
        ? "/student/game/train"
        : isCutRope
          ? "/student/game/cut-rope"
          : isConveyorDrop
            ? "/student/game/conveyor-drop"
            : isLineDraw || isTextText
              ? "/student/game/match-text-text"
              : "/student/game/flashcard-match";

      const editUrl = isTrain
        ? `/teacher/games/match-image-text/create?type=image-text&gameMode=train&topicId=${topic.id}`
        : isCutRope
          ? `/teacher/games/match-image-text/create?type=image-text&gameMode=cut-rope&topicId=${topic.id}`
          : isConveyorDrop
            ? `/teacher/games/conveyor-drop/create?topicId=${topic.id}`
            : isImageImage
              ? `/teacher/games/match-image-text/create?type=image-image${isLineDraw ? "&gameMode=line" : ""}&topicId=${topic.id}`
              : isTextText
                ? `/teacher/games/match-image-text/create?type=text-text&topicId=${topic.id}`
                : `/teacher/games/match-image-text/create?${isLineDraw ? "gameMode=line&" : ""}topicId=${topic.id}`;

      return {
        id: topic.id,
        title: topic.name,
        type: "match" as const,
        createdAt: topic.createdAt.toISOString(),
        count: totalItems,
        countUnit: "pairs" as const,
        gameMode: topic.gameMode || "match",
        isImageImage,
        isTextText,
        playUrl,
        editUrl,
        shareGamePath,
        items: topic.items.map((item) => ({
          id: item.id,
          word: capitalizeFirstLetter(item.word),
          imageUrl: item.imageUrl,
          imageBUrl: item.imageBUrl,
          labelB: item.labelB,
        })),
        raw: {
          id: topic.id,
          name: topic.name,
          gameMode: topic.gameMode || "match",
          isImageImage,
          isTextText,
        },
      };
    });

    return NextResponse.json(
      {
        success: true,
        isAdmin,
        scope,
        games,
        ...(counts ? { counts } : {}),
        pagination: {
          page,
          limit,
          total: filteredTotal,
          hasMore: page * limit < filteredTotal,
        },
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch unified teacher games:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch games", games: [] },
      { status: 500 }
    );
  }
}
