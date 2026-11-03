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
  thumbnailUrl?: string | null;
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
  const item = getBaseClassifiedTeacherGame(topic, isPublished);
  if (topic.thumbnailUrl) {
    item.imageUrl = topic.thumbnailUrl;
    item.videoId = undefined;
  }
  return item;
}

function getBaseClassifiedTeacherGame(topic: {
  id: string;
  name: string;
  slug: string;
  gameMode: string | null;
  thumbnailUrl?: string | null;
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

  if (
    mode === "cut-rope" ||
    name.toLowerCase().includes("cắt dây")
  ) {
    return {
      id: topic.id,
      title: name,
      slug: topic.slug,
      gameMode: mode,
      group: "match",
      groupLabel: "Nối cặp",
      gameModeLabel: "Cắt Dây Ảnh - Chữ",
      badge: "CẮT DÂY",
      badgeBg: "bg-rose-500 text-white",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      icon: "content_cut",
      desc: "Học sinh dùng thao tác cắt dây để nối hình ảnh với từ vựng / câu tương ứng.",
      imageUrl: "/images/games/cut-rope.png",
      itemCount: topic._count?.items ?? 0,
      createdAt: topic.createdAt.toISOString(),
      playUrl: `/student/game/cut-rope?topicId=${topic.id}`,
      isPublished,
      teacher: topic.teacher || null,
    };
  }

  if (
    mode === "train" ||
    name.toLowerCase().includes("đoàn tàu")
  ) {
    return {
      id: topic.id,
      title: name,
      slug: topic.slug,
      gameMode: mode,
      group: "match",
      groupLabel: "Nối cặp",
      gameModeLabel: "Nối Đoàn Tàu",
      badge: "ĐOÀN TÀU",
      badgeBg: "bg-amber-500 text-white",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      icon: "train",
      desc: "Học sinh ghép thẻ từ vựng vào đúng toa tàu có hình ảnh tương ứng.",
      imageUrl: "/images/games/train-vocab.png",
      itemCount: topic._count?.items ?? 0,
      createdAt: topic.createdAt.toISOString(),
      playUrl: `/student/game/train?topicId=${topic.id}`,
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


export interface TeacherTemplateAnalyticsItem {
  id: string;
  title: string;
  category: "match" | "choice" | "flip" | "quiz";
  categoryLabel: string;
  badge: string;
  demoViews: number;
  guideViews: number;
  createClicks: number;
  guestCreateClicks: number;
  createdCount: number;
  shareCount: number;
}

export interface TeacherBehaviorEventLog {
  id: string;
  eventName: string;
  actionLabel: string;
  gameTitle: string;
  categoryLabel: string;
  userName: string;
  userEmail: string | null;
  isGuest: boolean;
  device: "Mobile" | "Tablet" | "Desktop";
  createdAt: string;
}

export interface AdminTeacherBehaviorAnalytics {
  funnel: {
    portalVisits: number;
    uniqueVisitors: number;
    videoOpens: number;
    demoViews: number;
    guideViews: number;
    createClicks: number;
    authCreateClicks: number;
    guestCreateClicks: number;
    cardCreateClicks: number;
    modalCreateClicks: number;
    authPrompts: number;
    authConverted: number;
    totalGamesCreated: number;
    shareActions: number;
  };
  categoryStats: {
    key: string;
    label: string;
    clicks: number;
  }[];
  templates: TeacherTemplateAnalyticsItem[];
  recentEvents: TeacherBehaviorEventLog[];
}

const TEACHER_GAME_TEMPLATES: Omit<
  TeacherTemplateAnalyticsItem,
  "demoViews" | "guideViews" | "createClicks" | "guestCreateClicks" | "createdCount" | "shareCount"
>[] = [
  { id: "image-image", title: "Nối Cặp Ảnh - Ảnh", category: "match", categoryLabel: "Nối cặp", badge: "Ảnh - Ảnh" },
  { id: "image-text", title: "Nối Cặp Ảnh - Chữ", category: "match", categoryLabel: "Nối cặp", badge: "Ảnh - Chữ" },
  { id: "conveyor-drop", title: "Băng Chuyền Thả Khối", category: "match", categoryLabel: "Nối cặp", badge: "Băng Chuyền" },
  { id: "line-image-image", title: "Nối Dây Ảnh - Ảnh", category: "match", categoryLabel: "Nối cặp", badge: "Nối Dây" },
  { id: "line-image-text", title: "Nối Dây Ảnh - Chữ", category: "match", categoryLabel: "Nối cặp", badge: "Nối Dây" },
  { id: "cut-rope-image-text", title: "Cắt Dây Ảnh - Chữ", category: "match", categoryLabel: "Nối cặp", badge: "Cắt Dây" },
  { id: "train-vocab", title: "Nối Đoàn Tàu", category: "match", categoryLabel: "Nối cặp", badge: "Đoàn Tàu" },
  { id: "shooter", title: "Bắn Súng Toán Học", category: "choice", categoryLabel: "Toán học", badge: "Bắn Súng" },
  { id: "egg-crack", title: "Đập Trứng Toán Học", category: "choice", categoryLabel: "Toán học", badge: "Đập Trứng" },
  { id: "flip-image-image", title: "Lật Ảnh-Ảnh", category: "flip", categoryLabel: "Lật ảnh", badge: "Ảnh - Ảnh" },
  { id: "flip-image-text", title: "Lật Ảnh-Chữ", category: "flip", categoryLabel: "Lật ảnh", badge: "Ảnh - Chữ" },
  { id: "candy-quiz", title: "Trắc nghiệm Kẹo Ngọt", category: "quiz", categoryLabel: "Trắc nghiệm", badge: "Kẹo Ngọt" },
  { id: "treasure-hunt", title: "Truy tìm Kho báu", category: "quiz", categoryLabel: "Trắc nghiệm", badge: "Kho Báu" },
  { id: "shooter-quiz", title: "Bắn súng Trắc nghiệm", category: "quiz", categoryLabel: "Trắc nghiệm", badge: "Bắn Súng" },
];

function mapCreatedGameToTemplateId(game: AdminTeacherGameItem): string {
  const label = game.gameModeLabel;
  if (label === "Trắc nghiệm Kẹo Ngọt") return "candy-quiz";
  if (label === "Bắn súng Trắc nghiệm") return "shooter-quiz";
  if (label === "Bắn súng Toán học") return "shooter";
  if (label === "Đập trứng Toán học") return "egg-crack";
  if (label === "Truy tìm Kho báu") return "treasure-hunt";
  if (label === "Lật Ảnh - Chữ") return "flip-image-text";
  if (label === "Lật Ảnh - Ảnh") return "flip-image-image";
  if (label === "Băng chuyền thả khối") return "conveyor-drop";
  if (label === "Nối dây Ảnh - Ảnh") return "line-image-image";
  if (label === "Nối dây Ảnh - Chữ") return "line-image-text";
  if (label === "Cắt Dây Ảnh - Chữ") return "cut-rope-image-text";
  if (label === "Nối Đoàn Tàu") return "train-vocab";
  if (label === "Nối cặp Ảnh - Chữ") return "image-text";
  return "image-image";
}

export async function getAdminTeacherBehaviorAnalyticsAction(
  existingGames?: AdminTeacherGameItem[]
): Promise<AdminTeacherBehaviorAnalytics> {
  const emptyResult: AdminTeacherBehaviorAnalytics = {
    funnel: {
      portalVisits: 0,
      uniqueVisitors: 0,
      videoOpens: 0,
      demoViews: 0,
      guideViews: 0,
      createClicks: 0,
      authCreateClicks: 0,
      guestCreateClicks: 0,
      cardCreateClicks: 0,
      modalCreateClicks: 0,
      authPrompts: 0,
      authConverted: 0,
      totalGamesCreated: existingGames?.length || 0,
      shareActions: 0,
    },
    categoryStats: [
      { key: "match", label: "Nối cặp", clicks: 0 },
      { key: "choice", label: "Toán học", clicks: 0 },
      { key: "flip", label: "Lật ảnh", clicks: 0 },
      { key: "quiz", label: "Trắc nghiệm", clicks: 0 },
      { key: "my-games", label: "Bài tập đã tạo", clicks: 0 },
    ],
    templates: TEACHER_GAME_TEMPLATES.map((t) => ({
      ...t,
      demoViews: 0,
      guideViews: 0,
      createClicks: 0,
      guestCreateClicks: 0,
      createdCount: 0,
      shareCount: 0,
    })),
    recentEvents: [],
  };

  try {
    const logs = await prisma.pageViewLog.findMany({
      where: {
        OR: [
          { path: { startsWith: "/__event__/class/global/teacher_" } },
          { path: "/teacher" },
          { path: { startsWith: "/teacher?" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 2500,
    });

    const userIds = Array.from(
      new Set(logs.map((l) => l.userId).filter((id): id is string => Boolean(id)))
    );

    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true },
          })
        : [];

    const userMap = new Map(users.map((u) => [u.id, u]));

    const templateMap = new Map<string, TeacherTemplateAnalyticsItem>();
    for (const t of TEACHER_GAME_TEMPLATES) {
      templateMap.set(t.id, {
        ...t,
        demoViews: 0,
        guideViews: 0,
        createClicks: 0,
        guestCreateClicks: 0,
        createdCount: 0,
        shareCount: 0,
      });
    }

    // Count actual created games per template
    if (existingGames) {
      for (const g of existingGames) {
        const tid = mapCreatedGameToTemplateId(g);
        const entry = templateMap.get(tid);
        if (entry) {
          entry.createdCount++;
        }
      }
    }

    const categoryClicksMap: Record<string, number> = {
      match: 0,
      choice: 0,
      flip: 0,
      quiz: 0,
      "my-games": 0,
    };

    const uniqueVisitorsSet = new Set<string>();
    let portalVisits = 0;
    let videoOpens = 0;
    let demoViews = 0;
    let guideViews = 0;
    let createClicks = 0;
    let authCreateClicks = 0;
    let guestCreateClicks = 0;
    let cardCreateClicks = 0;
    let modalCreateClicks = 0;
    let authPrompts = 0;
    let authConverted = 0;
    let shareActions = 0;

    const recentEvents: TeacherBehaviorEventLog[] = [];

    for (const log of logs) {
      uniqueVisitorsSet.add(log.userId || log.ipHash || log.id);

      if (!log.path.startsWith("/__event__/")) {
        portalVisits++;
        continue;
      }

      const [rawPath, queryStr] = log.path.split("?");
      const parts = rawPath.split("/");
      const eventName = decodeURIComponent(parts[4] || "");
      const params = new URLSearchParams(queryStr || "");

      const gameId = params.get("gameId") || "";
      const gameTitle = params.get("gameTitle") || "";
      const category = params.get("category") || "";
      const videoType = params.get("videoType") || "demo";
      const source = params.get("source") || "card";
      const tab = params.get("tab") || "";
      const action = params.get("action") || "";
      const targetUrl = params.get("targetUrl") || "";
      const isAuthenticatedParam = params.get("isAuthenticated") === "true" || Boolean(log.userId);

      const userObj = log.userId ? userMap.get(log.userId) : undefined;
      const ua = log.userAgent || "";
      const device: "Mobile" | "Tablet" | "Desktop" =
        ua.includes("iPad") || ua.includes("Tablet")
          ? "Tablet"
          : ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")
            ? "Mobile"
            : "Desktop";

      let actionLabel = eventName;
      let displayTitle = gameTitle;
      let displayCategory =
        category === "match"
          ? "Nối cặp"
          : category === "choice"
            ? "Toán học"
            : category === "flip"
              ? "Lật ảnh"
              : category === "quiz"
                ? "Trắc nghiệm"
                : "Teacher Portal";

      if (eventName === "teacher_category_click") {
        portalVisits++;
        if (tab.startsWith("my-")) {
          categoryClicksMap["my-games"]++;
          actionLabel = "Mở danh mục Bài tập đã tạo";
          displayTitle =
            tab === "my-match-games"
              ? "Nối cặp đã tạo"
              : tab === "my-choice-games"
                ? "Toán học đã tạo"
                : tab === "my-flip-games"
                  ? "Lật ảnh đã tạo"
                  : "Trắc nghiệm đã tạo";
          displayCategory = "Bài tập đã tạo";
        } else if (categoryClicksMap[tab] !== undefined) {
          categoryClicksMap[tab]++;
          actionLabel = "Chuyển danh mục Game";
          displayTitle =
            tab === "match"
              ? "Tạo Game Nối cặp"
              : tab === "choice"
                ? "Tạo Game Toán học"
                : tab === "flip"
                  ? "Tạo Game Lật ảnh"
                  : "Tạo Game Trắc nghiệm";
          displayCategory = displayTitle;
        }
      } else if (eventName === "teacher_video_open") {
        videoOpens++;
        if (videoType === "guide") {
          guideViews++;
          actionLabel = "📹 Xem Video Hướng dẫn";
        } else {
          demoViews++;
          actionLabel = "▶️ Xem Video Demo";
        }
        const tpl = templateMap.get(gameId);
        if (tpl) {
          if (videoType === "guide") tpl.guideViews++;
          else tpl.demoViews++;
          displayCategory = tpl.categoryLabel;
        }
      } else if (eventName === "teacher_create_click") {
        createClicks++;
        if (isAuthenticatedParam) authCreateClicks++;
        else guestCreateClicks++;

        if (source === "video_modal") {
          modalCreateClicks++;
          actionLabel = "➕ Bấm Tạo bài tập (từ Video)";
        } else {
          cardCreateClicks++;
          actionLabel = "➕ Bấm + TẠO BÀI TẬP";
        }

        const tpl = templateMap.get(gameId);
        if (tpl) {
          tpl.createClicks++;
          if (!isAuthenticatedParam) tpl.guestCreateClicks++;
          displayCategory = tpl.categoryLabel;
        }
      } else if (eventName === "teacher_auth_prompt") {
        authPrompts++;
        actionLabel = "🔒 Hiện Popup Yêu cầu Đăng nhập GV";
        if (!displayTitle && targetUrl) {
          displayTitle = targetUrl;
        }
      } else if (eventName === "teacher_auth_converted") {
        authConverted++;
        actionLabel = "✅ Đăng nhập Giáo viên thành công từ Popup";
        displayTitle = targetUrl || "/teacher";
      } else if (eventName === "teacher_my_game_action") {
        if (action === "copy_link" || action === "share_open" || action === "download_qr") {
          shareActions++;
        }
        actionLabel =
          action === "copy_link"
            ? "🔗 Sao chép link gửi học sinh"
            : action === "download_qr"
              ? "📲 Tải mã QR bài tập"
              : action === "share_open"
                ? "📤 Mở hộp thoại Chia sẻ"
                : action === "preview"
                  ? "👁️ Chơi thử bài đã tạo"
                  : `⚡ Thao tác: ${action}`;
        displayCategory = "Bài tập đã tạo";
      }

      if (recentEvents.length < 60) {
        recentEvents.push({
          id: log.id,
          eventName,
          actionLabel,
          gameTitle: displayTitle || "Khám phá chung",
          categoryLabel: displayCategory,
          userName: userObj?.name || (log.userId ? "Giáo viên" : "Khách vãng lai (Chưa đăng nhập)"),
          userEmail: userObj?.email || null,
          isGuest: !log.userId && !isAuthenticatedParam,
          device,
          createdAt: log.createdAt.toISOString(),
        });
      }
    }

    return {
      funnel: {
        portalVisits,
        uniqueVisitors: uniqueVisitorsSet.size,
        videoOpens,
        demoViews,
        guideViews,
        createClicks,
        authCreateClicks,
        guestCreateClicks,
        cardCreateClicks,
        modalCreateClicks,
        authPrompts,
        authConverted,
        totalGamesCreated: existingGames?.length || 0,
        shareActions,
      },
      categoryStats: [
        { key: "match", label: "Nối cặp", clicks: categoryClicksMap.match },
        { key: "choice", label: "Toán học", clicks: categoryClicksMap.choice },
        { key: "flip", label: "Lật ảnh", clicks: categoryClicksMap.flip },
        { key: "quiz", label: "Trắc nghiệm", clicks: categoryClicksMap.quiz },
        { key: "my-games", label: "Bài tập đã tạo", clicks: categoryClicksMap["my-games"] },
      ],
      templates: Array.from(templateMap.values()).sort(
        (a, b) =>
          b.createClicks + b.demoViews + b.createdCount - (a.createClicks + a.demoViews + a.createdCount)
      ),
      recentEvents,
    };
  } catch (err) {
    console.error("Failed to fetch teacher behavior analytics:", err);
    return emptyResult;
  }
}
