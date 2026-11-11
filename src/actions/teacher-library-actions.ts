"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { toSlug } from "@/lib/slugify";
import { revalidatePath } from "next/cache";
import { unstable_cache } from "next/cache";
import { formatLibraryItemCase } from "@/lib/text-case";

export type LibraryCategory = "match" | "choice" | "flip" | "quiz";
export type LibrarySubType = "image-text" | "image-image" | "text-text" | "quiz" | "choice";

export interface LibraryQuestionItem {
  id: string;
  roundIndex: number;
  word: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  imageBUrl?: string | null;
  labelB?: string | null;
  audioBUrl?: string | null;
}

export interface LibrarySetItem {
  id: string;
  name: string;
  slug: string;
  category: LibraryCategory;
  subType: LibrarySubType;
  gameMode: string;
  audioMode: string;
  gradeLevel: string;
  totalItems: number;
  createdAt: string;
  updatedAt: string;
  isLibraryRecord: boolean;
  items: LibraryQuestionItem[];
}

const LIBRARY_GAME_MODES: Record<LibrarySubType, string> = {
  "image-text": "library-image-text",
  "image-image": "library-image-image",
  "text-text": "library-text-text",
  "quiz": "library-quiz",
  "choice": "library-choice",
};

const ALL_LIBRARY_GAME_MODES = Object.values(LIBRARY_GAME_MODES);

/**
 * Compute a deterministic fingerprint of a question/card set's content
 * so we can avoid creating duplicate library sets when content is identical.
 */
function computeItemsFingerprint(
  items: Array<{
    word?: string | null;
    imageUrl?: string | null;
    imageBUrl?: string | null;
    labelB?: string | null;
  }>
): string {
  const normalized = items.map((item) => {
    const w = (item.word || "").trim().toLowerCase();
    const imgA = (item.imageUrl || "").trim();
    const imgB = (item.imageBUrl || "").trim();
    const lblB = (item.labelB || "").trim();
    return `${w}|${imgA}|${imgB}|${lblB}`;
  });
  return normalized.join(";;");
}

function classifyTopicSubType(topic: {
  gameMode?: string | null;
  game?: { name?: string | null } | null;
  items?: Array<{ imageUrl?: string | null; imageBUrl?: string | null; labelB?: string | null }>;
}): { category: LibraryCategory; subType: LibrarySubType } {
  const gm = (topic.gameMode || "").toLowerCase();
  const gameName = topic.game?.name || "";

  if (gm === "library-choice" || gm.startsWith("choice")) {
    return { category: "choice", subType: "choice" };
  }
  if (
    gm === "library-quiz" ||
    gm === "candy-quiz" ||
    gm === "treasure-hunt" ||
    gm === "shooter-quiz" ||
    gm === "quiz" ||
    gameName.includes("Trắc nghiệm") ||
    gameName.includes("Kho báu")
  ) {
    return { category: "quiz", subType: "quiz" };
  }

  const isFlip =
    gm.startsWith("flip") || gameName.includes("Lật Ảnh") || gameName.includes("Lật Thẻ");

  const hasImageB =
    gm === "library-image-image" ||
    gm === "match-image-image" ||
    gm === "flip-image-image" ||
    gameName.includes("Ảnh - Ảnh") ||
    gameName.includes("Ảnh-Ảnh") ||
    Boolean(topic.items?.some((i) => Boolean(i.imageBUrl)));

  if (hasImageB) {
    return { category: isFlip ? "flip" : "match", subType: "image-image" };
  }

  const isTextText =
    gm === "library-text-text" ||
    gm === "match-text-text" ||
    gameName.includes("Chữ - Chữ") ||
    Boolean(topic.items?.some((i) => Boolean(i.labelB && !i.imageUrl && !i.imageBUrl)));

  if (isTextText) {
    return { category: "match", subType: "text-text" };
  }

  return { category: isFlip ? "flip" : "match", subType: "image-text" };
}

/**
 * Automatically save or update a question set in the teacher's My Library
 * whenever they create/update a game.
 *
 * Smart deduplication rules:
 * 1. If an existing library set (or teacher game set) for this teacher has the exact same content fingerprint -> skip creating a duplicate.
 * 2. If an existing library set for this teacher has the exact same title and subType -> update its items in place.
 * 3. Otherwise -> create a new standalone library set (`gameMode = library-*`) so deleting the game later never deletes the library set.
 */
export async function syncSetToTeacherLibrary(params: {
  teacherId?: string | null;
  title: string;
  subType: LibrarySubType;
  gradeLevel?: string;
  audioMode?: string;
  thumbnailUrl?: string | null;
  items: Array<{
    roundIndex?: number;
    word: string;
    imageUrl?: string | null;
    audioUrl?: string | null;
    imageBUrl?: string | null;
    labelB?: string | null;
    audioBUrl?: string | null;
  }>;
}) {
  try {
    const teacherId = params.teacherId;
    if (!teacherId || !params.items || params.items.length === 0) {
      return { synced: false };
    }

    const cleanTitle = (params.title || "Bộ câu hỏi mới").trim();
    const targetLibMode = LIBRARY_GAME_MODES[params.subType] || "library-image-text";
    const incomingFingerprint = computeItemsFingerprint(params.items);

    // Fetch existing library sets of the same subType for this teacher OR shared Global Success sets
    const existingLibTopics = await prisma.matchWordTopic.findMany({
      where: {
        OR: [
          { teacherId, gameMode: targetLibMode },
          { teacherId: null, gameMode: targetLibMode },
          { slug: { startsWith: "shared-lib-" } },
        ],
      },
      include: {
        items: {
          orderBy: [{ roundIndex: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        },
      },
    });

    // Rule 1: Exact content fingerprint match -> already in Personal Library or Global Success Library, no duplicate needed
    for (const libTopic of existingLibTopics) {
      const fp = computeItemsFingerprint(libTopic.items);
      if (fp === incomingFingerprint) {
        return { synced: true, libraryId: libTopic.id, action: "skipped-duplicate" };
      }
    }

    // Rule 2: Same title (case-insensitive) in this teacher's personal library -> update existing library set with latest items
    const sameNameLib = existingLibTopics.find(
      (t) =>
        t.teacherId === teacherId &&
        !(t.slug || "").startsWith("shared-lib-") &&
        t.name.trim().toLowerCase() === cleanTitle.toLowerCase()
    );

    if (sameNameLib) {
      await prisma.matchWordItem.deleteMany({
        where: { topicId: sameNameLib.id },
      });

      await prisma.matchWordTopic.update({
        where: { id: sameNameLib.id },
        data: {
          name: cleanTitle,
          ageGroup: params.gradeLevel || sameNameLib.ageGroup || "kids-2-5",
          audioMode: params.audioMode || sameNameLib.audioMode || "AUTO_TTS",
          ...(params.thumbnailUrl ? { thumbnailUrl: params.thumbnailUrl } : {}),
          updatedAt: new Date(),
        },
      });

      await prisma.matchWordItem.createMany({
        data: params.items.map((item) => ({
          topicId: sameNameLib.id,
          roundIndex: item.roundIndex ?? 0,
          word: item.word || "",
          imageUrl: item.imageUrl || null,
          audioUrl: item.audioUrl || null,
          imageBUrl: item.imageBUrl || null,
          labelB: item.labelB || null,
          audioBUrl: item.audioBUrl || null,
        })),
      });

      return { synced: true, libraryId: sameNameLib.id, action: "updated" };
    }

    // Rule 3: Create a new standalone Library record
    let containerGame = await prisma.matchWordGame.findFirst({
      where: { name: "Thư viện Câu hỏi Giáo viên (My Library)" },
    });

    if (!containerGame) {
      containerGame = await prisma.matchWordGame.create({
        data: {
          name: "Thư viện Câu hỏi Giáo viên (My Library)",
          ageGroup: "kids-2-5",
          level: 1,
        },
      });
    }

    const slug = `lib-${toSlug(cleanTitle)}-${Date.now().toString(36)}`;
    const iconMap: Record<LibrarySubType, string> = {
      "image-text": "📚",
      "image-image": "🖼️",
      "text-text": "🔤",
      "quiz": "❓",
      "choice": "🧮",
    };

    const createdLib = await prisma.matchWordTopic.create({
      data: {
        gameId: containerGame.id,
        teacherId,
        name: cleanTitle,
        slug,
        ageGroup: params.gradeLevel || "kids-2-5",
        icon: iconMap[params.subType] || "📚",
        thumbnailUrl: params.thumbnailUrl || null,
        audioMode: params.audioMode || "AUTO_TTS",
        gameMode: targetLibMode,
      },
    });

    await prisma.matchWordItem.createMany({
      data: params.items.map((item) => ({
        topicId: createdLib.id,
        roundIndex: item.roundIndex ?? 0,
        word: item.word || "",
        imageUrl: item.imageUrl || null,
        audioUrl: item.audioUrl || null,
        imageBUrl: item.imageBUrl || null,
        labelB: item.labelB || null,
        audioBUrl: item.audioBUrl || null,
      })),
    });

    return { synced: true, libraryId: createdLib.id, action: "created" };
  } catch (err) {
    console.error("Failed to sync set to teacher library:", err);
    return { synced: false };
  }
}

/**
 * Fetch the teacher's Library sets.
 * Automatically merges standalone `library-*` records with existing game sets
 * (deduplicated by content fingerprint so every previously created game's questions are immediately available without duplicates).
 *
 * Remember: `match` and `flip` share compatible `image-text` and `image-image` question sets!
 */
export async function getTeacherLibrarySetsAction(filterCategory?: LibraryCategory | "all") {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: true, sets: [] as LibrarySetItem[] };
    }

    const isAdmin = session.user.role === "ADMIN";
    const baseWhere: any = isAdmin
      ? {
          NOT: [
            { slug: { startsWith: "shared-lib-" } },
            { teacherId: null, gameMode: { in: ALL_LIBRARY_GAME_MODES } },
          ],
        }
      : {
          teacherId: session.user.id,
          NOT: { slug: { startsWith: "shared-lib-" } },
        };

    const quizModes = ["library-quiz", "candy-quiz", "treasure-hunt", "shooter-quiz", "quiz"];
    const choiceModes = ["library-choice", "choice-shooter", "choice-egg"];

    let categoryWhere: any = {};
    if (filterCategory === "quiz") {
      categoryWhere = {
        OR: [
          { gameMode: { in: [...quizModes, "library-hidden"] } },
          { game: { name: { contains: "Trắc nghiệm" } } },
          { game: { name: { contains: "Kho báu" } } },
        ],
      };
    } else if (filterCategory === "choice") {
      categoryWhere = {
        OR: [
          { gameMode: { in: [...choiceModes, "library-hidden"] } },
          { gameMode: { startsWith: "choice" } },
        ],
      };
    } else if (filterCategory === "match" || filterCategory === "flip") {
      categoryWhere = {
        NOT: [
          { gameMode: { in: [...quizModes, ...choiceModes] } },
        ],
      };
    }

    const whereCondition: any = {
      AND: [baseWhere, categoryWhere],
    };

    const rawTopics = await prisma.matchWordTopic.findMany({
      where: whereCondition,
      select: {
        id: true,
        teacherId: true,
        name: true,
        slug: true,
        gameMode: true,
        audioMode: true,
        ageGroup: true,
        createdAt: true,
        updatedAt: true,
        game: {
          select: { name: true, level: true },
        },
        items: {
          take: 4,
          orderBy: [{ roundIndex: "asc" }, { createdAt: "asc" }, { id: "asc" }],
          select: {
            id: true,
            roundIndex: true,
            word: true,
            imageUrl: true,
            imageBUrl: true,
            labelB: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Collect any raw game topic IDs or shared library IDs that have been overridden/edited or hidden by this teacher
    const overriddenGameTopicIds = new Set<string>();
    for (const t of rawTopics) {
      if (t.teacherId && t.teacherId !== session.user.id) continue;
      const match = (t.slug || "").match(/^lib-override-([a-z0-9]+)-/i);
      if (match?.[1]) {
        overriddenGameTopicIds.add(match[1]);
      }
    }

    // Separate explicit library records first so they take priority over raw game topics during deduplication
    const sortedTopics = [...rawTopics].sort((a, b) => {
      const aIsLib = ALL_LIBRARY_GAME_MODES.includes(a.gameMode || "") ? 0 : 1;
      const bIsLib = ALL_LIBRARY_GAME_MODES.includes(b.gameMode || "") ? 0 : 1;
      if (aIsLib !== bIsLib) return aIsLib - bIsLib;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    // Pre-populate fingerprints of Global Success shared textbook sets so raw games created
    // directly from Global Success sets do not leak into the personal library
    const sharedFingerprints = await getCachedSharedFingerprints();
    const seenFingerprints = new Set<string>(sharedFingerprints);

    const allSets: LibrarySetItem[] = [];

    for (const t of sortedTopics) {
      if (t.gameMode === "library-hidden") continue;
      const totalItemsCount = t._count?.items ?? t.items.length;
      if (totalItemsCount === 0 || !t.items || t.items.length === 0) continue;

      const { category, subType } = classifyTopicSubType(t);
      const isLibRecord = ALL_LIBRARY_GAME_MODES.includes(t.gameMode || "");

      // Skip raw game topics or shared library sets that have been edited/overridden or hidden in My Library
      if (overriddenGameTopicIds.has(t.id)) {
        continue;
      }

      const fp = `${subType}::${totalItemsCount}::${computeItemsFingerprint(t.items)}`;

      // Raw game topics are deduplicated by content fingerprint, while explicit standalone
      // library-* records (including newly duplicated or edited sets) are always included.
      if (!isLibRecord && seenFingerprints.has(fp)) {
        continue;
      }
      seenFingerprints.add(fp);

      allSets.push({
        id: t.id,
        name: t.name,
        slug: t.slug,
        category,
        subType,
        gameMode: t.gameMode || "match",
        audioMode: t.audioMode || "AUTO_TTS",
        gradeLevel: t.ageGroup || "kids-2-5",
        totalItems: totalItemsCount,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        isLibraryRecord: isLibRecord,
        items: t.items.map((item) =>
          formatLibraryItemCase({
            id: item.id,
            roundIndex: item.roundIndex ?? 0,
            word: item.word,
            imageUrl: item.imageUrl,
            audioUrl: null,
            imageBUrl: item.imageBUrl,
            labelB: item.labelB,
            audioBUrl: null,
          })
        ),
      });
    }

    // Filter by requested category
    // Note: Because Match and Flip share compatible `image-text` and `image-image` sets,
    // both `match` and `flip` library views show all `image-text` and `image-image` sets!
    const filteredSets = allSets.filter((s) => {
      if (!filterCategory || filterCategory === "all") return true;
      if (filterCategory === "match") {
        return s.subType === "image-text" || s.subType === "image-image" || s.subType === "text-text";
      }
      if (filterCategory === "flip") {
        return s.subType === "image-text" || s.subType === "image-image";
      }
      if (filterCategory === "quiz") {
        return s.subType === "quiz";
      }
      if (filterCategory === "choice") {
        return s.subType === "choice";
      }
      return true;
    });

    // Sort by updatedAt desc
    filteredSets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return { success: true, sets: filteredSets };
  } catch (error: any) {
    console.error("Failed to fetch teacher library sets:", error);
    return { success: false, error: error.message || "Failed to fetch library sets", sets: [] as LibrarySetItem[] };
  }
}

const getCachedSharedFingerprints = unstable_cache(
  async (): Promise<string[]> => {
    const sharedTopicsForDedup = await prisma.matchWordTopic.findMany({
      where: {
        OR: [
          { slug: { startsWith: "shared-lib-" } },
          { teacherId: null, gameMode: { in: ALL_LIBRARY_GAME_MODES } },
        ],
      },
      select: {
        gameMode: true,
        items: {
          take: 4,
          orderBy: [{ roundIndex: "asc" }, { createdAt: "asc" }, { id: "asc" }],
          select: {
            word: true,
            imageUrl: true,
            imageBUrl: true,
            labelB: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
    });
    const fps: string[] = [];
    for (const st of sharedTopicsForDedup) {
      const { subType: stSub } = classifyTopicSubType(st);
      const stCount = st._count?.items ?? st.items.length;
      if (stCount > 0 && st.items.length > 0) {
        fps.push(`${stSub}::${stCount}::${computeItemsFingerprint(st.items)}`);
      }
    }
    return fps;
  },
  ["global-success-fingerprints-v2"],
  { revalidate: 3600, tags: ["global-success-counts", "global-success-all"] }
);

const _fetchAllGlobalSuccessSets = async (): Promise<LibrarySetItem[]> => {
  const rawTopics = await prisma.matchWordTopic.findMany({
    where: {
      OR: [
        { slug: { startsWith: "shared-lib-" } },
        { teacherId: null, gameMode: { in: ALL_LIBRARY_GAME_MODES } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      gameMode: true,
      audioMode: true,
      ageGroup: true,
      createdAt: true,
      updatedAt: true,
      game: {
        select: { name: true, level: true },
      },
      items: {
        take: 4,
        orderBy: [{ roundIndex: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          roundIndex: true,
          word: true,
          imageUrl: true,
          imageBUrl: true,
          labelB: true,
        },
      },
      _count: {
        select: { items: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const sets: LibrarySetItem[] = [];
  for (const t of rawTopics) {
    if (t.gameMode === "library-hidden") continue;
    const totalItemsCount = t._count?.items ?? t.items.length;
    if (totalItemsCount === 0 || !t.items || t.items.length === 0) continue;

    const { category, subType } = classifyTopicSubType(t);
    sets.push({
      id: t.id,
      name: t.name,
      slug: t.slug,
      category,
      subType,
      gameMode: t.gameMode || "match",
      audioMode: t.audioMode || "AUTO_TTS",
      gradeLevel: t.ageGroup || "primary-1-5",
      totalItems: totalItemsCount,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      isLibraryRecord: true,
      items: t.items.map((item) =>
        formatLibraryItemCase({
          id: item.id,
          roundIndex: item.roundIndex ?? 0,
          word: item.word,
          imageUrl: item.imageUrl,
          audioUrl: null,
          imageBUrl: item.imageBUrl,
          labelB: item.labelB,
          audioBUrl: null,
        })
      ),
    });
  }

  return sets;
};

const getCachedAllGlobalSuccessSets = unstable_cache(
  _fetchAllGlobalSuccessSets,
  ["global-success-all-sets-v2"],
  { revalidate: 3600, tags: ["global-success-all"] }
);

/**
 * Fetch Global Success Textbook Library sets (shared system sets organized by Grade 1-12 & Unit)
 */
export async function getGlobalSuccessLibrarySetsAction() {
  try {
    const sets = await getCachedAllGlobalSuccessSets();
    return { success: true, sets };
  } catch (error: any) {
    console.error("Failed to fetch Global Success library sets:", error);
    return { success: false, error: error.message || "Failed to fetch Global Success sets", sets: [] as LibrarySetItem[] };
  }
}

/**
 * Grade-level metadata for the 12-grade grid.
 * Lightweight query: only counts how many sets exist per grade.
 * Used to render the grade selection cards instantly (no items fetched).
 */
export interface GradeCountItem {
  grade: number;
  count: number;
}

const _fetchGradeCounts = async (): Promise<GradeCountItem[]> => {
  const rawTopics = await prisma.matchWordTopic.findMany({
    where: {
      OR: [
        { slug: { startsWith: "shared-lib-" } },
        { teacherId: null, gameMode: { in: ALL_LIBRARY_GAME_MODES } },
      ],
    },
    select: {
      name: true,
      gameMode: true,
      _count: { select: { items: true } },
    },
  });

  const gradeMap: Record<number, number> = {};
  for (const t of rawTopics) {
    if (t.gameMode === "library-hidden") continue;
    const itemCount = t._count?.items ?? 0;
    if (itemCount === 0) continue;
    const gradeMatch = t.name.match(/Grade\s+(\d+)/i);
    const grade = gradeMatch ? parseInt(gradeMatch[1], 10) : 3;
    if (grade < 1 || grade > 12) continue;
    gradeMap[grade] = (gradeMap[grade] || 0) + 1;
  }

  const result: GradeCountItem[] = [];
  for (let g = 1; g <= 12; g++) {
    result.push({ grade: g, count: gradeMap[g] || 0 });
  }
  return result;
};

const getCachedGradeCounts = unstable_cache(
  _fetchGradeCounts,
  ["global-success-grade-counts-v2"],
  { revalidate: 3600, tags: ["global-success-counts"] }
);

export async function getGlobalSuccessGradeCountsAction(): Promise<{
  success: boolean;
  gradeCounts: GradeCountItem[];
  error?: string;
}> {
  try {
    const gradeCounts = await getCachedGradeCounts();
    return { success: true, gradeCounts };
  } catch (error: any) {
    console.error("Failed to fetch grade counts:", error);
    return { success: false, gradeCounts: [], error: error.message };
  }
}

/**
 * Fetch Global Success sets for a SINGLE grade (1-12).
 * Returns full set data (with 4 preview items) only for that grade.
 */
const _fetchSetsByGrade = async (grade: number): Promise<LibrarySetItem[]> => {
  // Slug pattern: shared-lib-g{grade}-u{unit}-{type}
  const slugPrefix = `shared-lib-g${grade}-`;

  const rawTopics = await prisma.matchWordTopic.findMany({
    where: {
      OR: [
        { slug: { startsWith: slugPrefix } },
        {
          teacherId: null,
          gameMode: { in: ALL_LIBRARY_GAME_MODES },
          name: { contains: `Grade ${grade} `, mode: "insensitive" },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      gameMode: true,
      audioMode: true,
      ageGroup: true,
      createdAt: true,
      updatedAt: true,
      game: {
        select: { name: true, level: true },
      },
      items: {
        take: 4,
        orderBy: [{ roundIndex: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          roundIndex: true,
          word: true,
          imageUrl: true,
          imageBUrl: true,
          labelB: true,
        },
      },
      _count: {
        select: { items: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const sets: LibrarySetItem[] = [];
  for (const t of rawTopics) {
    if (t.gameMode === "library-hidden") continue;
    const totalItemsCount = t._count?.items ?? t.items.length;
    if (totalItemsCount === 0 || !t.items || t.items.length === 0) continue;

    // Verify this topic actually belongs to the requested grade
    const gradeMatch = t.name.match(/Grade\s+(\d+)/i);
    const topicGrade = gradeMatch ? parseInt(gradeMatch[1], 10) : 3;
    if (topicGrade !== grade) continue;

    const { category, subType } = classifyTopicSubType(t);
    sets.push({
      id: t.id,
      name: t.name,
      slug: t.slug,
      category,
      subType,
      gameMode: t.gameMode || "match",
      audioMode: t.audioMode || "AUTO_TTS",
      gradeLevel: t.ageGroup || "primary-1-5",
      totalItems: totalItemsCount,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      isLibraryRecord: true,
      items: t.items.map((item) =>
        formatLibraryItemCase({
          id: item.id,
          roundIndex: item.roundIndex ?? 0,
          word: item.word,
          imageUrl: item.imageUrl,
          audioUrl: null,
          imageBUrl: item.imageBUrl,
          labelB: item.labelB,
          audioBUrl: null,
        })
      ),
    });
  }

  return sets;
};

function getCachedSetsByGrade(grade: number) {
  return unstable_cache(
    () => _fetchSetsByGrade(grade),
    [`global-success-grade-v2-${grade}`],
    { revalidate: 3600, tags: [`global-success-grade-${grade}`, "global-success-all"] }
  )();
}

export async function getGlobalSuccessSetsByGradeAction(grade: number): Promise<{
  success: boolean;
  sets: LibrarySetItem[];
  error?: string;
}> {
  try {
    if (grade < 1 || grade > 12) {
      return { success: false, sets: [], error: "Invalid grade" };
    }
    const sets = await getCachedSetsByGrade(grade);
    return { success: true, sets };
  } catch (error: any) {
    console.error(`Failed to fetch Global Success sets for grade ${grade}:`, error);
    return { success: false, sets: [], error: error.message };
  }
}

/**
 * Get a single Library Set by ID (works for both `library-*` records and existing game topics)
 */
export async function getTeacherLibrarySetByIdAction(setId: string) {
  try {
    const topic = await prisma.matchWordTopic.findUnique({
      where: { id: setId },
      include: {
        game: { select: { name: true } },
        items: { orderBy: [{ roundIndex: "asc" }, { createdAt: "asc" }, { id: "asc" }] },
      },
    });

    if (!topic) {
      return { success: false, error: "Không tìm thấy bộ câu hỏi trong thư viện!" };
    }

    const { category, subType } = classifyTopicSubType(topic);

    const setItem: LibrarySetItem = {
      id: topic.id,
      name: topic.name,
      slug: topic.slug,
      category,
      subType,
      gameMode: topic.gameMode || "match",
      audioMode: topic.audioMode || "AUTO_TTS",
      gradeLevel: topic.ageGroup || "kids-2-5",
      totalItems: topic.items.length,
      createdAt: topic.createdAt.toISOString(),
      updatedAt: topic.updatedAt.toISOString(),
      isLibraryRecord: ALL_LIBRARY_GAME_MODES.includes(topic.gameMode || ""),
      items: topic.items.map((item) =>
        formatLibraryItemCase({
          id: item.id,
          roundIndex: item.roundIndex ?? 0,
          word: item.word,
          imageUrl: item.imageUrl,
          audioUrl: item.audioUrl,
          imageBUrl: item.imageBUrl,
          labelB: item.labelB,
          audioBUrl: item.audioBUrl,
        })
      ),
    };

    return { success: true, set: setItem };
  } catch (error: any) {
    return { success: false, error: error.message || "Không thể tải bộ câu hỏi!" };
  }
}

/**
 * Rename a Library Set.
 * If the set was originally a game topic (not yet cloned to `library-*`),
 * we clone it into a standalone `library-*` record with the new name so the live game title is unaffected,
 * or if it is already a `library-*` record, we rename it directly.
 */
export async function renameTeacherLibrarySetAction(setId: string, newName: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const cleanName = newName.trim();
    if (!cleanName) {
      return { success: false, error: "Tên bộ câu hỏi không được để trống" };
    }

    const isAdmin = session.user.role === "ADMIN";
    const topic = await prisma.matchWordTopic.findFirst({
      where: isAdmin
        ? { id: setId }
        : { id: setId, OR: [{ teacherId: session.user.id }, { teacherId: null }] },
      include: {
        game: { select: { name: true } },
        items: { orderBy: [{ roundIndex: "asc" }, { createdAt: "asc" }, { id: "asc" }] },
      },
    });

    if (!topic) {
      return { success: false, error: "Không tìm thấy bộ câu hỏi!" };
    }

    if (topic.teacherId === null) {
      // Shared system library set -> Copy-on-Write personal override for this teacher
      const { subType } = classifyTopicSubType(topic);
      const targetLibGameMode = LIBRARY_GAME_MODES[subType];
      await prisma.$transaction(async (tx) => {
        const newLibTopic = await tx.matchWordTopic.create({
          data: {
            gameId: topic.gameId,
            teacherId: session.user.id,
            name: cleanName,
            slug: `lib-override-${topic.id}-${Date.now().toString(36)}`,
            ageGroup: topic.ageGroup || "kids-2-5",
            icon: topic.icon || "📚",
            thumbnailUrl: topic.thumbnailUrl,
            audioMode: topic.audioMode || "AUTO_TTS",
            gameMode: targetLibGameMode,
          },
        });
        if (topic.items.length > 0) {
          await tx.matchWordItem.createMany({
            data: topic.items.map((item) => ({
              topicId: newLibTopic.id,
              roundIndex: item.roundIndex ?? 0,
              word: item.word,
              imageUrl: item.imageUrl || null,
              audioUrl: item.audioUrl || null,
              imageBUrl: item.imageBUrl || null,
              labelB: item.labelB || null,
              audioBUrl: item.audioBUrl || null,
            })),
          });
        }
      });
    } else {
      await prisma.matchWordTopic.update({
        where: { id: topic.id },
        data: { name: cleanName, updatedAt: new Date() },
      });
    }

    revalidatePath("/teacher");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Không thể đổi tên bộ câu hỏi" };
  }
}

/**
 * Delete a Library Set.
 * Note: If the user deletes a standalone `library-*` record, it deletes that record.
 */
export async function deleteTeacherLibrarySetAction(setId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const isAdmin = session.user.role === "ADMIN";
    const topic = await prisma.matchWordTopic.findFirst({
      where: isAdmin
        ? { id: setId }
        : { id: setId, OR: [{ teacherId: session.user.id }, { teacherId: null }] },
    });

    if (!topic) {
      return { success: false, error: "Không tìm thấy bộ câu hỏi!" };
    }

    const isLibRecord = ALL_LIBRARY_GAME_MODES.includes(topic.gameMode || "");
    const isSharedRecord = topic.teacherId === null;

    if (isLibRecord && !isSharedRecord) {
      if ((topic.slug || "").startsWith("lib-override-")) {
        // Keep the override marker as hidden so the original live game stays untouched and hidden from Library
        await prisma.matchWordTopic.update({
          where: { id: topic.id },
          data: { gameMode: "library-hidden", updatedAt: new Date() },
        });
      } else {
        await prisma.matchWordTopic.delete({
          where: { id: topic.id },
        });
      }
    } else {
      // Never delete a live game or a shared textbook set!
      // Instead, record a hidden library override marker for this teacher.
      await prisma.matchWordTopic.create({
        data: {
          gameId: topic.gameId,
          teacherId: session.user.id,
          name: topic.name,
          slug: `lib-override-${topic.id}-${Date.now().toString(36)}`,
          ageGroup: topic.ageGroup || "kids-2-5",
          icon: topic.icon || "📚",
          gameMode: "library-hidden",
        },
      });
    }

    revalidatePath("/teacher");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Không thể xóa bộ câu hỏi" };
  }
}

/**
 * Duplicate a Library Set into a new standalone `library-*` record.
 * Returns the newly created LibrarySetItem so the UI can immediately open it for editing.
 */
export async function duplicateTeacherLibrarySetAction(setId: string, copySuffix: string = "Copy") {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const isAdmin = session.user.role === "ADMIN";
    const sourceTopic = await prisma.matchWordTopic.findFirst({
      where: isAdmin
        ? { id: setId }
        : { id: setId, OR: [{ teacherId: session.user.id }, { teacherId: null }] },
      include: {
        game: { select: { name: true } },
        items: { orderBy: [{ roundIndex: "asc" }, { createdAt: "asc" }, { id: "asc" }] },
      },
    });

    if (!sourceTopic || sourceTopic.items.length === 0) {
      return { success: false, error: "Không tìm thấy bộ câu hỏi cần nhân bản!" };
    }

    const { category, subType } = classifyTopicSubType(sourceTopic);
    const targetLibGameMode = LIBRARY_GAME_MODES[subType];

    // Ensure unique copy name if multiple copies exist
    const baseCopyName = `${sourceTopic.name} (${copySuffix})`;
    const existingWithPrefix = await prisma.matchWordTopic.count({
      where: {
        teacherId: session.user.id,
        name: { startsWith: `${sourceTopic.name} (${copySuffix}` },
      },
    });
    const finalCopyName =
      existingWithPrefix > 0
        ? `${sourceTopic.name} (${copySuffix} ${existingWithPrefix + 1})`
        : baseCopyName;

    const uniqueSlug = `${toSlug(finalCopyName || "library-copy")}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .substring(2, 6)}`;

    const createdTopic = await prisma.$transaction(async (tx) => {
      const newTopic = await tx.matchWordTopic.create({
        data: {
          gameId: sourceTopic.gameId,
          teacherId: session.user.id,
          name: finalCopyName,
          slug: uniqueSlug,
          ageGroup: sourceTopic.ageGroup || "kids-2-5",
          icon: sourceTopic.icon || "📚",
          thumbnailUrl: sourceTopic.thumbnailUrl || null,
          audioMode: sourceTopic.audioMode || "AUTO_TTS",
          gameMode: targetLibGameMode,
        },
      });

      await tx.matchWordItem.createMany({
        data: sourceTopic.items.map((item) => ({
          topicId: newTopic.id,
          roundIndex: item.roundIndex ?? 0,
          word: item.word,
          imageUrl: item.imageUrl || null,
          audioUrl: item.audioUrl || null,
          imageBUrl: item.imageBUrl || null,
          labelB: item.labelB || null,
          audioBUrl: item.audioBUrl || null,
        })),
      });

      return tx.matchWordTopic.findUnique({
        where: { id: newTopic.id },
        include: { items: { orderBy: [{ roundIndex: "asc" }, { createdAt: "asc" }, { id: "asc" }] } },
      });
    });

    if (!createdTopic) {
      return { success: false, error: "Không thể tạo bản sao bộ câu hỏi!" };
    }

    const duplicatedSet: LibrarySetItem = {
      id: createdTopic.id,
      name: createdTopic.name,
      slug: createdTopic.slug,
      category,
      subType,
      gameMode: createdTopic.gameMode || targetLibGameMode,
      audioMode: createdTopic.audioMode || "AUTO_TTS",
      gradeLevel: createdTopic.ageGroup || "kids-2-5",
      totalItems: createdTopic.items.length,
      createdAt: createdTopic.createdAt.toISOString(),
      updatedAt: createdTopic.updatedAt.toISOString(),
      isLibraryRecord: true,
      items: createdTopic.items.map((item) =>
        formatLibraryItemCase({
          id: item.id,
          roundIndex: item.roundIndex ?? 0,
          word: item.word,
          imageUrl: item.imageUrl,
          audioUrl: item.audioUrl,
          imageBUrl: item.imageBUrl,
          labelB: item.labelB,
          audioBUrl: item.audioBUrl,
        })
      ),
    };

    revalidatePath("/teacher");
    return { success: true, set: duplicatedSet };
  } catch (error: any) {
    console.error("Failed to duplicate library set:", error);
    return { success: false, error: error.message || "Không thể nhân bản bộ câu hỏi" };
  }
}

/**
 * Update a Library Set's name and its items (supports inline editing & deleting items inside the View/Edit modal).
 */
export async function updateTeacherLibrarySetAction(payload: {
  setId: string;
  name: string;
  audioMode?: string;
  gradeLevel?: string;
  thumbnailUrl?: string | null;
  items: Array<{
    roundIndex: number;
    word: string;
    imageUrl?: string | null;
    audioUrl?: string | null;
    imageBUrl?: string | null;
    labelB?: string | null;
    audioBUrl?: string | null;
  }>;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const cleanName = payload.name.trim();
    if (!cleanName) {
      return { success: false, error: "Tên bộ câu hỏi không được để trống!" };
    }

    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: "Bộ câu hỏi phải có ít nhất 1 mục!" };
    }

    const isAdmin = session.user.role === "ADMIN";
    const topic = await prisma.matchWordTopic.findFirst({
      where: isAdmin
        ? { id: payload.setId }
        : { id: payload.setId, OR: [{ teacherId: session.user.id }, { teacherId: null }] },
      include: {
        game: { select: { name: true } },
        items: { orderBy: [{ roundIndex: "asc" }, { createdAt: "asc" }, { id: "asc" }] },
      },
    });

    if (!topic) {
      return { success: false, error: "Không tìm thấy bộ câu hỏi!" };
    }

    const { category, subType } = classifyTopicSubType(topic);
    const targetLibGameMode = LIBRARY_GAME_MODES[subType];
    const isAlreadyLibRecord =
      ALL_LIBRARY_GAME_MODES.includes(topic.gameMode || "") && topic.teacherId !== null;

    const updatedTopic = await prisma.$transaction(async (tx) => {
      if (isAlreadyLibRecord) {
        // Standalone library record: update in-place without affecting any created games
        await tx.matchWordTopic.update({
          where: { id: topic.id },
          data: {
            name: cleanName,
            ...(payload.audioMode ? { audioMode: payload.audioMode } : {}),
            ...(payload.gradeLevel ? { ageGroup: payload.gradeLevel } : {}),
            ...(payload.thumbnailUrl !== undefined ? { thumbnailUrl: payload.thumbnailUrl } : {}),
            updatedAt: new Date(),
          },
        });

        await tx.matchWordItem.deleteMany({
          where: { topicId: topic.id },
        });

        await tx.matchWordItem.createMany({
          data: payload.items.map((item, idx) => ({
            topicId: topic.id,
            roundIndex: item.roundIndex ?? 0,
            word: (item.word || "").trim() || `Item ${idx + 1}`,
            imageUrl: item.imageUrl || null,
            audioUrl: item.audioUrl || null,
            imageBUrl: item.imageBUrl || null,
            labelB: item.labelB || null,
            audioBUrl: item.audioBUrl || null,
          })),
        });

        return tx.matchWordTopic.findUnique({
          where: { id: topic.id },
          include: {
            game: { select: { name: true } },
            items: { orderBy: [{ roundIndex: "asc" }, { createdAt: "asc" }, { id: "asc" }] },
          },
        });
      } else {
        // Copy-on-Write: `topic` is a live game from Created Exercises!
        // Leave `topic` 100% untouched so existing student games never change,
        // and create a standalone `library-*` record overriding `topic.id` in My Library.
        const newLibTopic = await tx.matchWordTopic.create({
          data: {
            gameId: topic.gameId,
            teacherId: topic.teacherId || session.user.id,
            name: cleanName,
            slug: `lib-override-${topic.id}-${Date.now().toString(36)}`,
            ageGroup: payload.gradeLevel || topic.ageGroup || "kids-2-5",
            icon: topic.icon || "📚",
            thumbnailUrl: payload.thumbnailUrl !== undefined ? payload.thumbnailUrl : topic.thumbnailUrl,
            audioMode: payload.audioMode || topic.audioMode || "AUTO_TTS",
            gameMode: targetLibGameMode,
          },
        });

        await tx.matchWordItem.createMany({
          data: payload.items.map((item, idx) => ({
            topicId: newLibTopic.id,
            roundIndex: item.roundIndex ?? 0,
            word: (item.word || "").trim() || `Item ${idx + 1}`,
            imageUrl: item.imageUrl || null,
            audioUrl: item.audioUrl || null,
            imageBUrl: item.imageBUrl || null,
            labelB: item.labelB || null,
            audioBUrl: item.audioBUrl || null,
          })),
        });

        return tx.matchWordTopic.findUnique({
          where: { id: newLibTopic.id },
          include: {
            game: { select: { name: true } },
            items: { orderBy: [{ roundIndex: "asc" }, { createdAt: "asc" }, { id: "asc" }] },
          },
        });
      }
    });

    if (!updatedTopic) {
      return { success: false, error: "Không thể lưu thay đổi bộ câu hỏi!" };
    }

    const updatedSet: LibrarySetItem = {
      id: updatedTopic.id,
      name: updatedTopic.name,
      slug: updatedTopic.slug,
      category,
      subType,
      gameMode: updatedTopic.gameMode || "match",
      audioMode: updatedTopic.audioMode || "AUTO_TTS",
      gradeLevel: updatedTopic.ageGroup || "kids-2-5",
      totalItems: updatedTopic.items.length,
      createdAt: updatedTopic.createdAt.toISOString(),
      updatedAt: updatedTopic.updatedAt.toISOString(),
      isLibraryRecord: ALL_LIBRARY_GAME_MODES.includes(updatedTopic.gameMode || ""),
      items: updatedTopic.items.map((item) =>
        formatLibraryItemCase({
          id: item.id,
          roundIndex: item.roundIndex ?? 0,
          word: item.word,
          imageUrl: item.imageUrl,
          audioUrl: item.audioUrl,
          imageBUrl: item.imageBUrl,
          labelB: item.labelB,
          audioBUrl: item.audioBUrl,
        })
      ),
    };

    revalidatePath("/teacher");
    return { success: true, set: updatedSet };
  } catch (error: any) {
    console.error("Failed to update library set:", error);
    return { success: false, error: error.message || "Không thể lưu thay đổi bộ câu hỏi" };
  }
}

