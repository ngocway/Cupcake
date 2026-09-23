import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { fetchWithRedis } from "@/lib/cached-queries";

export interface GameTopicWithItems {
  id: string;
  slug: string;
  name: string;
  ageGroup: string;
  gameMode: string | null;
  thumbnailUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  teacher?: {
    name: string | null;
    image?: string | null;
  } | null;
  items: Array<{
    id: string;
    word: string;
    labelB?: string | null;
    imageUrl?: string | null;
  }>;
}

export interface GameFaqItem {
  question: string;
  answer: string;
}

/**
 * Format age group codes to user-friendly Vietnamese text.
 */
export function formatAgeGroup(ageGroup?: string | null): string {
  if (!ageGroup) return "học sinh mọi lứa tuổi";
  const normalized = ageGroup.toLowerCase().trim();
  if (normalized === "2-5" || normalized === "kids-2-5") {
    return "trẻ mầm non (2-5 tuổi)";
  }
  if (normalized === "6-12" || normalized === "kids-6-12") {
    return "học sinh tiểu học (6-12 tuổi)";
  }
  if (normalized === "teen" || normalized === "teens") {
    return "học sinh THCS & THPT (13-18 tuổi)";
  }
  if (normalized === "readers" || normalized === "adult") {
    return "người học tiếng Anh nâng cao";
  }
  return `học sinh lứa tuổi ${ageGroup}`;
}

/**
 * Translate game mode code to human-readable game type name in Vietnamese.
 */
export function formatGameModeName(gameMode?: string | null): string {
  if (!gameMode) return "Trò chơi tiếng Anh tương tác";
  const mode = gameMode.toLowerCase().trim();

  switch (mode) {
    case "candy-quiz":
      return "Trắc nghiệm Kẹo Ngọt";
    case "treasure-hunt":
      return "Truy tìm Kho báu";
    case "shooter-quiz":
    case "choice-shooter":
      return "Bắn súng Trắc nghiệm";
    case "conveyor-drop":
      return "Băng chuyền Thả chữ";
    case "egg-smash":
    case "choice-egg":
      return "Đập trứng Chọn đáp án";
    case "flip":
    case "flip-image-image":
    case "flip-image-text":
    case "memory-flip":
      return "Lật thẻ Trí nhớ";
    case "match":
    case "match-words":
    case "match-image-text":
    case "match-image-image":
    case "match-text-text":
    case "line":
      return "Nối từ vựng tương tác";
    case "cut-rope":
      return "Cắt dây Nối từ";
    case "train":
      return "Chuyến tàu Từ vựng";
    case "sentence-builder":
    case "sentence":
      return "Ghép câu Tiếng Anh";
    default:
      return "Trò chơi tương tác";
  }
}

/**
 * Determine internal URL to play the game based on gameMode.
 */
export function getGamePlayUrl(topic: { id: string; gameMode: string | null }): string {
  const mode = (topic.gameMode || "match").toLowerCase().trim();

  if (mode === "candy-quiz") {
    return `/student/game/candy-quiz?topicId=${topic.id}`;
  }
  if (mode === "treasure-hunt") {
    return `/game/treasure-grid?topicId=${topic.id}`;
  }
  if (mode === "shooter-quiz" || mode === "choice-shooter") {
    return `/game/shooter-quiz?topicId=${topic.id}`;
  }
  if (mode === "conveyor-drop") {
    return `/student/game/conveyor-drop?topicId=${topic.id}`;
  }
  if (mode === "choice-egg" || mode === "egg-smash") {
    return `/student/game/egg-smash-quiz?topicId=${topic.id}`;
  }
  if (
    mode === "flip" ||
    mode === "flip-image-image" ||
    mode === "flip-image-text" ||
    mode === "memory-flip"
  ) {
    return `/game/memory-flip?topicId=${topic.id}`;
  }
  if (mode === "cut-rope") {
    return `/student/game/cut-rope?topicId=${topic.id}`;
  }
  if (mode === "train") {
    return `/student/game/train?topicId=${topic.id}`;
  }
  if (mode === "sentence-builder" || mode === "sentence") {
    return `/student/game/sentence-builder/${topic.id}`;
  }

  // Default to match-words
  return `/student/game/match-words?topicId=${topic.id}`;
}

/**
 * Fetch game topic and items cached for SEO generation.
 */
export async function getGameTopicSeoData(idOrSlug: string): Promise<GameTopicWithItems | null> {
  if (!idOrSlug) return null;

  try {
    return await fetchWithRedis(`seo:game:topic:${idOrSlug}`, 300, async () => {
      const topic = await prisma.matchWordTopic.findFirst({
        where: {
          OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        },
        include: {
          teacher: {
            select: { name: true, image: true },
          },
          items: {
            take: 24,
            select: {
              id: true,
              word: true,
              labelB: true,
              imageUrl: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!topic) return null;

      return {
        id: topic.id,
        slug: topic.slug,
        name: topic.name,
        ageGroup: topic.ageGroup,
        gameMode: topic.gameMode,
        thumbnailUrl: topic.thumbnailUrl,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
        teacher: topic.teacher,
        items: topic.items,
      };
    });
  } catch (error) {
    console.error("Error fetching game topic SEO data:", error);
    return null;
  }
}

/**
 * Generate SEO-optimized title tag (50-60 characters).
 */
export function generateGameTitle(topic: GameTopicWithItems): string {
  const modeName = formatGameModeName(topic.gameMode);
  return `${topic.name} - ${modeName} Tiếng Anh Cho Bé | Dolcake`;
}

/**
 * Generate SEO-optimized Meta Description (140-160 characters).
 */
export function generateGameMetaDescription(topic: GameTopicWithItems): string {
  const sampleWords = topic.items
    .map((i) => i.word?.trim())
    .filter((w): w is string => Boolean(w) && w.length > 1 && w.length < 25)
    .slice(0, 5);

  const wordsSnippet =
    sampleWords.length > 0 ? ` từ vựng: ${sampleWords.join(", ")}` : "";
  const count = topic.items.length;
  const modeName = formatGameModeName(topic.gameMode);
  const ageName = formatAgeGroup(topic.ageGroup);

  const baseDesc = `Khám phá trò chơi "${topic.name}" (${modeName}) dành cho ${ageName}. Luyện tập ${count} câu hỏi/từ vựng${wordsSnippet}... rèn phản xạ và ghi nhớ sâu trên Dolcake.`;

  // Trim gracefully if too long
  if (baseDesc.length > 165) {
    return baseDesc.slice(0, 160).trim() + "...";
  }
  return baseDesc;
}

/**
 * Generate structured FAQ questions and answers for Schema FAQPage.
 */
export function generateGameFaqItems(topic: GameTopicWithItems): GameFaqItem[] {
  const sampleWords = topic.items
    .map((i) => i.word?.trim())
    .filter((w): w is string => Boolean(w) && w.length > 1 && w.length < 25)
    .slice(0, 8);

  const wordsList = sampleWords.length > 0 ? sampleWords.join(", ") : topic.name;
  const modeName = formatGameModeName(topic.gameMode);
  const ageName = formatAgeGroup(topic.ageGroup);
  const count = topic.items.length;

  return [
    {
      question: `Trò chơi "${topic.name}" phù hợp cho học sinh lứa tuổi nào?`,
      answer: `Trò chơi được thiết kế đặc biệt cho ${ageName}, với đồ họa thân thiện, âm thanh sinh động và độ khó vừa vặn giúp học sinh tiếp thu kiến thức một cách tự nhiên.`,
    },
    {
      question: `Học sinh sẽ học được những từ vựng và câu hỏi gì trong bài?`,
      answer: `Bài học gồm ${count} nội dung luyện tập tương tác xoay quanh chủ đề ${topic.name}, bao gồm các từ vựng tiêu biểu: ${wordsList}.`,
    },
    {
      question: `Trò chơi này giúp phát triển những kỹ năng tiếng Anh nào?`,
      answer: `Thông qua định dạng ${modeName}, học sinh được rèn luyện phản xạ nhận diện từ vựng nhanh, khả năng liên tưởng hình ảnh với ngữ nghĩa và tăng cường hứng thú học tiếng Anh.`,
    },
    {
      question: `Có thể chơi trò chơi này trên thiết bị nào và có mất phí không?`,
      answer: `Trò chơi hoàn toàn miễn phí trên nền tảng giáo dục Dolcake. Học sinh có thể chơi trực tiếp mượt mà trên trình duyệt của máy tính, máy tính bảng (iPad) cũng như điện thoại thông minh mà không cần cài đặt ứng dụng.`,
    },
  ];
}

/**
 * Generate rich JSON-LD Schema.org object (LearningResource + Quiz + FAQPage).
 */
export function generateGameJsonLd(
  topic: GameTopicWithItems,
  canonicalUrl: string
): Record<string, any> {
  const title = generateGameTitle(topic);
  const description = generateGameMetaDescription(topic);
  const faqList = generateGameFaqItems(topic);
  const thumbnail =
    topic.thumbnailUrl || "https://dolcake.com/images/og-image.png";

  const teachesWords = topic.items
    .map((i) => i.word?.trim())
    .filter((w): w is string => Boolean(w) && w.length > 1);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LearningResource", "Quiz"],
        name: title,
        description,
        url: canonicalUrl,
        inLanguage: ["en", "vi"],
        isAccessibleForFree: true,
        educationalLevel: formatAgeGroup(topic.ageGroup),
        teaches: teachesWords.slice(0, 12),
        numberOfQuestions: topic.items.length,
        image: thumbnail,
        provider: {
          "@type": "EducationalOrganization",
          name: "Dolcake",
          url: "https://dolcake.com",
          logo: "https://dolcake.com/images/og-image.png",
        },
        author: topic.teacher?.name
          ? {
              "@type": "Person",
              name: topic.teacher.name,
              ...(topic.teacher.image ? { image: topic.teacher.image } : {}),
            }
          : {
              "@type": "EducationalOrganization",
              name: "Dolcake",
            },
        dateCreated: topic.createdAt ? new Date(topic.createdAt).toISOString() : undefined,
        dateModified: topic.updatedAt ? new Date(topic.updatedAt).toISOString() : undefined,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqList.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };
}

/**
 * Generate Next.js Metadata object with Title, Description, OpenGraph, Twitter cards.
 */
export function generateGameMetadata(
  topic: GameTopicWithItems,
  canonicalUrl: string
): Metadata {
  const title = generateGameTitle(topic);
  const description = generateGameMetaDescription(topic);
  const thumbnail =
    topic.thumbnailUrl || "https://dolcake.com/images/og-image.png";

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Dolcake",
      images: [
        {
          url: thumbnail,
          width: 1200,
          height: 630,
          alt: topic.name,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [thumbnail],
    },
  };
}

/**
 * Generate 3-step gameplay guide for a specific game mode.
 */
export function getGameHowToPlay(
  gameMode?: string | null
): Array<{ step: number; title: string; desc: string }> {
  const mode = (gameMode || "").toLowerCase();

  if (mode.includes("candy")) {
    return [
      {
        step: 1,
        title: "Đọc câu hỏi & Quan sát hình ảnh",
        desc: "Quan sát kỹ câu hỏi tiếng Anh và hình ảnh minh họa sinh động trên bảng kẹo.",
      },
      {
        step: 2,
        title: "Chọn viên kẹo đáp án đúng",
        desc: "Bấm vào viên kẹo A, B, C hoặc D chứa đáp án chính xác trước khi hết thời gian.",
      },
      {
        step: 3,
        title: "Tích lũy xu và qua vòng",
        desc: "Trả lời đúng liên tiếp để kích hoạt chuỗi Combo điểm số và mở khóa các vòng kẹo ngọt tiếp theo.",
      },
    ];
  }
  if (mode.includes("treasure")) {
    return [
      {
        step: 1,
        title: "Chọn ô gạch trên bản đồ bí ẩn",
        desc: "Nhấp chuột vào một trong 16 ô gạch màu sắc để kích hoạt câu hỏi thử thách.",
      },
      {
        step: 2,
        title: "Giải đố để mở khóa ô gạch",
        desc: "Chọn đáp án đúng để làm vỡ ô gạch và thu thập ngôi sao năng lượng bay vào rương.",
      },
      {
        step: 3,
        title: "Mở khóa linh thú & Rương kho báu",
        desc: "Mở khóa thành công toàn bộ bản đồ để giải phóng thần hộ mệnh và mở rương vàng vinh quang.",
      },
    ];
  }
  if (mode.includes("shooter")) {
    return [
      {
        step: 1,
        title: "Quan sát câu hỏi ở màn hình phía dưới",
        desc: "Đọc câu hỏi hiển thị trên bảng điều khiển trung tâm phi thuyền vũ trụ.",
      },
      {
        step: 2,
        title: "Ngắm bắn mục tiêu chứa đáp án đúng",
        desc: "Di chuyển tâm ngắm laser và nhấp chuột hoặc chạm vào bia mục tiêu chính xác.",
      },
      {
        step: 3,
        title: "Giữ chuỗi Combo để đạt điểm tối đa",
        desc: "Bắn chuẩn xác liên tiếp để nhân hệ số điểm Combo x2, x3 và hoàn thành nhiệm vụ ngân hà.",
      },
    ];
  }
  if (mode.includes("egg")) {
    return [
      {
        step: 1,
        title: "Xem câu hỏi phép tính / từ vựng",
        desc: "Đọc kỹ đề bài được treo ở bảng gỗ nông trại vui nhộn.",
      },
      {
        step: 2,
        title: "Vung búa đập quả trứng chính xác",
        desc: "Dùng búa gõ vào quả trứng mang đáp án đúng trong 4 ổ rơm ấm áp.",
      },
      {
        step: 3,
        title: "Thu thập tiền vàng nông trại",
        desc: "Mỗi quả trứng đập đúng sẽ nở ra điểm số và xu vàng giúp bạn chinh phục toàn bộ câu hỏi.",
      },
    ];
  }
  if (mode.includes("conveyor")) {
    return [
      {
        step: 1,
        title: "Theo dõi từ vựng rơi trên băng chuyền",
        desc: "Quan sát các khối từ vựng đang di chuyển trên hệ thống băng chuyền cơ khí.",
      },
      {
        step: 2,
        title: "Thả khối từ vào đúng vị trí tương ứng",
        desc: "Bấm nút hoặc kéo thả để ghép nối từ vựng với định nghĩa / hình ảnh đúng.",
      },
      {
        step: 3,
        title: "Tăng tốc độ xử lý",
        desc: "Băng chuyền sẽ nhanh dần theo từng cấp độ, đòi hỏi sự tập trung và phản xạ nhạy bén.",
      },
    ];
  }
  if (mode.includes("flip")) {
    return [
      {
        step: 1,
        title: "Lật các quân bài bí ẩn dưới đáy biển",
        desc: "Bấm vào từng quân bài để lật mở từ vựng hoặc hình ảnh minh họa.",
      },
      {
        step: 2,
        title: "Ghi nhớ vị trí và ghép cặp trùng khớp",
        desc: "Tìm kiếm quân bài thứ 2 có nghĩa tương ứng để tạo thành một cặp hoàn chỉnh.",
      },
      {
        step: 3,
        title: "Hoàn thành bài trong thời gian ngắn nhất",
        desc: "Lật sạch toàn bộ bàn bài với số lượt lật ít nhất để ghi tên vào bảng vàng thành tích.",
      },
    ];
  }

  if (mode.includes("sentence")) {
    return [
      {
        step: 1,
        title: "Đọc và phân tích cấu trúc câu",
        desc: "Đọc câu tiếng Anh gợi ý hoặc hình ảnh minh họa để nắm cấu trúc ngữ pháp cần sắp xếp.",
      },
      {
        step: 2,
        title: "Kéo thả các khối từ vựng",
        desc: "Bấm hoặc kéo các mảnh ghép từ vựng vào vị trí chính xác theo trật tự câu hoàn chỉnh.",
      },
      {
        step: 3,
        title: "Kiểm tra và nhận thưởng",
        desc: "Nhấn kiểm tra để nhận điểm sao và lắng nghe giọng đọc chuẩn bản xứ của toàn bộ câu.",
      },
    ];
  }

  // Default matching / other
  return [
    {
      step: 1,
      title: "Quan sát thẻ bài và hình ảnh",
      desc: "Đọc từ vựng tiếng Anh và quan sát hình ảnh tương ứng trên màn hình.",
    },
    {
      step: 2,
      title: "Nối cặp chính xác",
      desc: "Kéo đường nối hoặc nhấp chọn 2 thẻ bài có nghĩa tương đồng để ghép cặp.",
    },
    {
      step: 3,
      title: "Hoàn thành toàn bộ cặp từ",
      desc: "Ghép thành công tất cả các cặp để vượt qua thử thách bài tập xuất sắc.",
    },
  ];
}

/**
 * Fetch related game topics for the landing page recommendations.
 */
export async function getRelatedGameTopics(
  currentTopicId: string,
  ageGroup?: string | null,
  limit = 4
): Promise<
  Array<{
    id: string;
    slug: string;
    name: string;
    gameMode: string | null;
    ageGroup: string;
    thumbnailUrl: string | null;
    itemCount: number;
  }>
> {
  try {
    return await fetchWithRedis(`seo:game:related:${currentTopicId}`, 300, async () => {
      const items = await prisma.matchWordTopic.findMany({
        where: {
          id: { not: currentTopicId },
          name: { not: "" },
          items: { some: {} },
          ...(ageGroup ? { ageGroup } : {}),
        },
        select: {
          id: true,
          slug: true,
          name: true,
          gameMode: true,
          ageGroup: true,
          thumbnailUrl: true,
          _count: { select: { items: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
      });

      return items.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        gameMode: t.gameMode,
        ageGroup: t.ageGroup,
        thumbnailUrl: t.thumbnailUrl,
        itemCount: t._count.items,
      }));
    });
  } catch (e) {
    return [];
  }
}

