"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export interface AdminTeacherGameItem {
  id: string;
  title: string;
  slug: string;
  gameMode: string;
  group: "candy" | "shooter" | "egg" | "treasure" | "flip" | "match";
  groupLabel: string;
  gameModeLabel: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  icon: string;
  itemCount: number;
  createdAt: string;
  playUrl: string;
  videoId?: string;
  desc?: string;
  imageUrl?: string;
  isPublished: boolean;
  teacher: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
}

function classifyTeacherGame(topic: {
  id: string;
  name: string;
  slug: string;
  gameMode: string | null;
  createdAt: Date;
  game?: { name?: string | null } | null;
  teacher?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  _count?: { items: number };
}, isPublished = false): AdminTeacherGameItem {
  const mode = topic.gameMode || "";
  const name = topic.name || "";
  const containerGameName = topic.game?.name || "";

  // 1. Kẹo Ngọt (Candy Quiz)
  if (
    mode === "candy-quiz" ||
    name.toLowerCase().includes("kẹo ngọt") ||
    containerGameName.toLowerCase().includes("kẹo ngọt")
  ) {
    return {
      id: topic.id,
      title: name,
      slug: topic.slug,
      gameMode: mode || "candy-quiz",
      group: "candy",
      groupLabel: "Kẹo Ngọt",
      gameModeLabel: "Trắc nghiệm Kẹo Ngọt",
      badge: "KẸO NGỌT",
      badgeBg: "bg-gradient-to-r from-pink-500 to-rose-500 text-white",
      badgeColor: "bg-pink-500/10 text-pink-400 border-pink-500/20",
      icon: "cookie",
      videoId: "m6_CohSIXpo",
      desc: "Trả lời câu hỏi trắc nghiệm cùng bánh kẹo ngọt ngào và âm thanh vui nhộn.",
      imageUrl: "/images/games/candy-quiz.jpg",
      itemCount: topic._count?.items ?? 0,
      createdAt: topic.createdAt.toISOString(),
      playUrl: `/student/game/candy-quiz?topicId=${topic.id}`,
      isPublished,
      teacher: topic.teacher || null,
    };
  }

  // 2. Bắn súng (Shooter - bao gồm Bắn súng Trắc nghiệm & Bắn súng Toán học)
  if (
    mode === "shooter-quiz" ||
    name.toLowerCase().includes("bắn súng trắc nghiệm")
  ) {
    return {
      id: topic.id,
      title: name,
      slug: topic.slug,
      gameMode: mode,
      group: "shooter",
      groupLabel: "Bắn súng",
      gameModeLabel: "Bắn súng Trắc nghiệm",
      badge: "BẮN SÚNG",
      badgeBg: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white",
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      icon: "sports_martial_arts",
      videoId: "MxrxyO1a8gM",
      desc: "Điều khiển nòng pháo không gian bắn đạn laser neon vào quả cầu đáp án đúng.",
      imageUrl: "/images/games/shooter-quiz.jpg",
      itemCount: topic._count?.items ?? 0,
      createdAt: topic.createdAt.toISOString(),
      playUrl: `/game/shooter-quiz?topicId=${topic.id}`,
      isPublished,
      teacher: topic.teacher || null,
    };
  }

  if (
    mode === "choice-shooter" ||
    containerGameName.toLowerCase().includes("bắn súng") ||
    name.toLowerCase().includes("bắn súng")
  ) {
    return {
      id: topic.id,
      title: name,
      slug: topic.slug,
      gameMode: mode,
      group: "shooter",
      groupLabel: "Bắn súng",
      gameModeLabel: "Bắn súng Toán học",
      badge: "BẮN SÚNG TOÁN",
      badgeBg: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      icon: "rocket_launch",
      videoId: "vyQ8QBQ1m4E",
      desc: "Bắn phá các khối cầu mang đáp án đúng để ghi điểm và tích lũy chuỗi combo.",
      itemCount: topic._count?.items ?? 0,
      createdAt: topic.createdAt.toISOString(),
      playUrl: `/game/shooter/${topic.slug}`,
      isPublished,
      teacher: topic.teacher || null,
    };
  }

  // 3. Đập trứng (Egg Smash)
  if (
    mode === "choice-egg" ||
    containerGameName.toLowerCase().includes("đập trứng") ||
    name.toLowerCase().includes("đập trứng")
  ) {
    return {
      id: topic.id,
      title: name,
      slug: topic.slug,
      gameMode: mode,
      group: "egg",
      groupLabel: "Đập trứng",
      gameModeLabel: "Đập trứng Toán học",
      badge: "ĐẬP TRỨNG",
      badgeBg: "bg-gradient-to-r from-amber-500 to-orange-600 text-white",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      icon: "egg",
      videoId: "R6fn9PnMmog",
      desc: "Đập vỡ các quả trứng mang đáp án đúng để tích lũy xu thưởng và nhân sao.",
      itemCount: topic._count?.items ?? 0,
      createdAt: topic.createdAt.toISOString(),
      playUrl: `/game/egg-smash/${topic.slug}`,
      isPublished,
      teacher: topic.teacher || null,
    };
  }

  // 4. Truy tìm Kho báu (Treasure Hunt)
  if (
    mode === "treasure-hunt" ||
    name.toLowerCase().includes("kho báu") ||
    containerGameName.toLowerCase().includes("kho báu")
  ) {
    return {
      id: topic.id,
      title: name,
      slug: topic.slug,
      gameMode: mode,
      group: "treasure",
      groupLabel: "Kho báu",
      gameModeLabel: "Truy tìm Kho báu",
      badge: "KHO BÁU",
      badgeBg: "bg-gradient-to-r from-amber-500 to-yellow-600 text-white",
      badgeColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      icon: "diamond",
      videoId: "9juS0TQRyHw",
      desc: "Trả lời câu hỏi trắc nghiệm để mở khóa ô bí ẩn trên bản đồ hải tặc và tìm rương vàng.",
      imageUrl: "/games/mystery-treasure-grid-assets/assets/webp/background-stage.webp",
      itemCount: topic._count?.items ?? 0,
      createdAt: topic.createdAt.toISOString(),
      playUrl: `/game/treasure-grid?topicId=${topic.id}`,
      isPublished,
      teacher: topic.teacher || null,
    };
  }

  // 5. Lật ảnh (Memory Flip)
  if (
    mode === "flip" ||
    mode.startsWith("flip-") ||
    containerGameName.toLowerCase().includes("lật ảnh") ||
    name.toLowerCase().includes("lật ảnh")
  ) {
    const isImageText = mode === "flip-image-text" || name.toLowerCase().includes("ảnh-chữ") || name.toLowerCase().includes("ảnh - chữ");
    return {
      id: topic.id,
      title: name,
      slug: topic.slug,
      gameMode: mode || "flip",
      group: "flip",
      groupLabel: "Lật ảnh",
      gameModeLabel: isImageText ? "Lật Ảnh - Chữ" : "Lật Ảnh - Ảnh",
      badge: isImageText ? "ẢNH - CHỮ" : "ẢNH - ẢNH",
      badgeBg: isImageText ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white" : "bg-gradient-to-r from-rose-500 to-pink-600 text-white",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      icon: "style",
      videoId: isImageText ? "30Ov93AvLwY" : "ZgE2PaGdvFU",
      desc: "Lật các thẻ bài để tìm và ghép các cặp hình ảnh hoặc từ vựng tương ứng.",
      itemCount: topic._count?.items ?? 0,
      createdAt: topic.createdAt.toISOString(),
      playUrl: `/game/memory-flip?topicId=${topic.id}`,
      isPublished,
      teacher: topic.teacher || null,
    };
  }

  // 6. Nối cặp (Match Games: Băng chuyền, Nối dây, Ảnh-Chữ, Ảnh-Ảnh, Chữ-Chữ)
  if (
    mode === "conveyor-drop" ||
    containerGameName.toLowerCase().includes("băng chuyền") ||
    name.toLowerCase().includes("băng chuyền")
  ) {
    return {
      id: topic.id,
      title: name,
      slug: topic.slug,
      gameMode: mode,
      group: "match",
      groupLabel: "Nối cặp",
      gameModeLabel: "Băng chuyền thả khối",
      badge: "BĂNG CHUYỀN",
      badgeBg: "bg-cyan-500 text-white",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      icon: "conveyor_belt",
      videoId: "JTMQ83gi9wo",
      desc: "Nhìn khối hàng hình ảnh di chuyển trên băng chuyền và thả vào đúng ống hút từ vựng.",
      itemCount: topic._count?.items ?? 0,
      createdAt: topic.createdAt.toISOString(),
      playUrl: `/student/game/conveyor-drop?topicId=${topic.id}`,
      isPublished,
      teacher: topic.teacher || null,
    };
  }

  if (
    mode === "line" ||
    mode === "match-text-text" ||
    containerGameName.toLowerCase().includes("chữ - chữ") ||
    name.toLowerCase().includes("nối dây")
  ) {
    const isImageImage = name.toLowerCase().includes("ảnh - ảnh") || name.toLowerCase().includes("ảnh-ảnh");
    return {
      id: topic.id,
      title: name,
      slug: topic.slug,
      gameMode: mode,
      group: "match",
      groupLabel: "Nối cặp",
      gameModeLabel: isImageImage ? "Nối dây Ảnh - Ảnh" : "Nối dây Ảnh - Chữ",
      badge: "NỐI DÂY",
      badgeBg: "bg-violet-500 text-white",
      badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/20",
      icon: "timeline",
      videoId: isImageImage ? "wO2Q6tGhfLM" : "qkE6qYZ-DDU",
      desc: "Kéo dây nối hình ảnh với từ vựng hoặc câu tương ứng giữa hàng trên và hàng dưới.",
      itemCount: topic._count?.items ?? 0,
      createdAt: topic.createdAt.toISOString(),
      playUrl: `/student/game/match-text-text?topicId=${topic.id}`,
      isPublished,
      teacher: topic.teacher || null,
    };
  }

  const isImageText = name.toLowerCase().includes("ảnh - chữ") || name.toLowerCase().includes("ảnh-chữ");
  return {
    id: topic.id,
    title: name,
    slug: topic.slug,
    gameMode: mode || "match",
    group: "match",
    groupLabel: "Nối cặp",
    gameModeLabel: isImageText ? "Nối cặp Ảnh - Chữ" : "Nối cặp Ảnh - Ảnh",
    badge: isImageText ? "ẢNH - CHỮ" : "ẢNH - ẢNH",
    badgeBg: isImageText ? "bg-orange-500 text-white" : "bg-emerald-500 text-white",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    icon: "extension",
    videoId: isImageText ? "pe7grSyHL0g" : "XSLnexaHxHM",
    desc: "Ghép các hình ảnh tương đồng hoặc hình ảnh với từ vựng tương ứng.",
    itemCount: topic._count?.items ?? 0,
    createdAt: topic.createdAt.toISOString(),
    playUrl: `/student/game/flashcard-match?topicId=${topic.id}`,
    isPublished,
    teacher: topic.teacher || null,
  };
}

async function getPublishedIdsFromSetting(): Promise<string[]> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "published_teacher_games" },
    });
    if (setting && typeof setting.value === "object" && setting.value !== null) {
      const ids = (setting.value as any).publishedIds;
      if (Array.isArray(ids)) return ids;
    }
    return [];
  } catch (e) {
    console.error("Failed to read published teacher games setting:", e);
    return [];
  }
}

export async function getAdminTeacherGamesAction(): Promise<{
  success: boolean;
  games?: AdminTeacherGameItem[];
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Bạn không có quyền truy cập trang này!" };
    }

    const [publishedIds, rawTopics] = await Promise.all([
      getPublishedIdsFromSetting(),
      prisma.matchWordTopic.findMany({
        where: {
          teacherId: { not: null },
        },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          game: {
            select: {
              name: true,
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
      }),
    ]);

    const games = rawTopics.map((t) => classifyTeacherGame(t, publishedIds.includes(t.id)));

    return {
      success: true,
      games,
    };
  } catch (error: any) {
    console.error("Lỗi khi tải danh sách game giáo viên tạo cho Admin:", error);
    return {
      success: false,
      error: error.message || "Không thể tải danh sách game!",
      games: [],
    };
  }
}

export async function toggleTeacherGamePublishAction(
  topicId: string,
  isPublished: boolean
): Promise<{ success: boolean; error?: string; isPublished?: boolean }> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Chỉ Admin mới có quyền phát hành game!" };
    }

    const currentIds = await getPublishedIdsFromSetting();
    let updatedIds: string[];

    if (isPublished) {
      updatedIds = currentIds.includes(topicId) ? currentIds : [...currentIds, topicId];
    } else {
      updatedIds = currentIds.filter((id) => id !== topicId);
    }

    await prisma.systemSetting.upsert({
      where: { key: "published_teacher_games" },
      update: {
        value: {
          publishedIds: updatedIds,
          updatedAt: new Date().toISOString(),
        },
      },
      create: {
        key: "published_teacher_games",
        value: {
          publishedIds: updatedIds,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    revalidatePath("/admin/games/teacher-games");
    revalidatePath("/");

    return { success: true, isPublished };
  } catch (error: any) {
    console.error("Failed to toggle teacher game publish status:", error);
    return { success: false, error: error.message || "Lỗi cập nhật trạng thái phát hành" };
  }
}

export async function getPublishedTeacherGamesAction(): Promise<AdminTeacherGameItem[]> {
  try {
    const publishedIds = await getPublishedIdsFromSetting();
    if (publishedIds.length === 0) return [];

    const rawTopics = await prisma.matchWordTopic.findMany({
      where: {
        id: { in: publishedIds },
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        game: {
          select: {
            name: true,
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

    return rawTopics.map((t) => classifyTeacherGame(t, true));
  } catch (error) {
    console.error("Failed to get published teacher games for student:", error);
    return [];
  }
}
