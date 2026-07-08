import Link from "next/link";
import { Gamepad2, Play } from "lucide-react";
import prisma from "@/lib/prisma";

export const metadata = {
  title: "Flashcard Match – Select Topic | Dolcake",
  description: "Choose a flashcard topic and play Flashcard Match — flip cards, match English words with images, and build vocabulary in a fun memory game on Dolcake.",
};

// ─── Card color themes ────────────────────────────────────────────────────────
const CARD_COLORS = [
  {
    bg: "bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/20",
    border: "border-amber-200 dark:border-amber-800",
    hoverBorder: "hover:border-amber-400 dark:hover:border-amber-500",
    hoverShadow: "hover:shadow-amber-400/20",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-500",
    badgeHoverBg: "group-hover:bg-amber-200",
    badgeHoverText: "group-hover:text-amber-700",
    titleHover: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
    btnHoverBg: "group-hover:bg-amber-500",
    btnHoverText: "group-hover:text-white",
  },
  {
    bg: "bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-800/20",
    border: "border-emerald-200 dark:border-emerald-800",
    hoverBorder: "hover:border-emerald-400 dark:hover:border-emerald-500",
    hoverShadow: "hover:shadow-emerald-400/20",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-500",
    badgeHoverBg: "group-hover:bg-emerald-200",
    badgeHoverText: "group-hover:text-emerald-700",
    titleHover: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
    btnHoverBg: "group-hover:bg-emerald-500",
    btnHoverText: "group-hover:text-white",
  },
  {
    bg: "bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-900/20 dark:to-blue-800/20",
    border: "border-sky-200 dark:border-sky-800",
    hoverBorder: "hover:border-sky-400 dark:hover:border-sky-500",
    hoverShadow: "hover:shadow-sky-400/20",
    iconBg: "bg-sky-100 dark:bg-sky-900/40",
    iconColor: "text-sky-500",
    badgeHoverBg: "group-hover:bg-sky-200",
    badgeHoverText: "group-hover:text-sky-700",
    titleHover: "group-hover:text-sky-600 dark:group-hover:text-sky-400",
    btnHoverBg: "group-hover:bg-sky-500",
    btnHoverText: "group-hover:text-white",
  },
  {
    bg: "bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-900/20 dark:to-pink-800/20",
    border: "border-rose-200 dark:border-rose-800",
    hoverBorder: "hover:border-rose-400 dark:hover:border-rose-500",
    hoverShadow: "hover:shadow-rose-400/20",
    iconBg: "bg-rose-100 dark:bg-rose-900/40",
    iconColor: "text-rose-500",
    badgeHoverBg: "group-hover:bg-rose-200",
    badgeHoverText: "group-hover:text-rose-700",
    titleHover: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
    btnHoverBg: "group-hover:bg-rose-500",
    btnHoverText: "group-hover:text-white",
  },
  {
    bg: "bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-800/20",
    border: "border-violet-200 dark:border-violet-800",
    hoverBorder: "hover:border-violet-400 dark:hover:border-violet-500",
    hoverShadow: "hover:shadow-violet-400/20",
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
    iconColor: "text-violet-500",
    badgeHoverBg: "group-hover:bg-violet-200",
    badgeHoverText: "group-hover:text-violet-700",
    titleHover: "group-hover:text-violet-600 dark:group-hover:text-violet-400",
    btnHoverBg: "group-hover:bg-violet-500",
    btnHoverText: "group-hover:text-white",
  },
];

// ─── Level config ─────────────────────────────────────────────────────────────
const LEVEL_CONFIG: Record<
  string,
  { label: string; emoji: string; description: string; audience: string }
> = {
  kindergarten: {
    label: "Kindergarten",
    emoji: "🧸",
    description: "2–5 Years",
    audience: "kindergarten",
  },
  kid: {
    label: "Kid",
    emoji: "🎒",
    description: "6–12 Years",
    audience: "kid",
  },
  teen: {
    label: "Teen",
    emoji: "🎧",
    description: "13–16 Years",
    audience: "teen",
  },
  learner: {
    label: "Learner",
    emoji: "🚀",
    description: "16+ Years",
    audience: "learner",
  },
};

// Ordered list for tab display
const LEVEL_ORDER = ["kindergarten", "kid", "teen", "learner"];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function FlashcardMatchSelectPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolved = await searchParams;
  const activeLevel = (resolved.level as string) || "kindergarten";

  const levelCfg = LEVEL_CONFIG[activeLevel] || LEVEL_CONFIG.kindergarten;

  // Fetch topics that have at least 1 card with an image
  const topics = await prisma.flashcardTopic.findMany({
    where: {
      targetAudiences: {
        hasSome: [levelCfg.audience],
      },
      flashcards: {
        some: {
          imageUrl: { not: null },
          NOT: { imageUrl: "" },
        },
      },
    },
    include: {
      _count: {
        select: {
          flashcards: {
            where: {
              imageUrl: { not: null },
              NOT: { imageUrl: "" },
            },
          },
        },
      },
      // Lấy ảnh đầu tiên để dùng làm thumbnail khi topic không có iconUrl
      flashcards: {
        where: {
          imageUrl: { not: null },
          NOT: { imageUrl: "" },
        },
        select: { imageUrl: true },
        orderBy: { orderIndex: "asc" },
        take: 3,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16 font-body relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-400/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-400/8 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pt-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-5 py-2 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 shadow-sm">
            🃏 Flashcard Match
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white mb-2">
            Choose a Topic to Play
          </h1>
        </div>



        {/* Topic Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {topics.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px]">
              <Gamepad2 className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-xl font-bold text-slate-400 dark:text-slate-500">
                No topics found
              </h3>
              <p className="text-slate-400 mt-2">
                Add flashcard images to topics in the admin panel to enable this game.
              </p>
            </div>
          ) : (
            topics.map((topic, index) => {
              const theme = CARD_COLORS[index % CARD_COLORS.length];
              const cardCount = topic._count?.flashcards || 0;

              return (
                <Link
                  key={topic.id}
                  href={`/student/game/flashcard-match?topicId=${topic.id}`}
                  className={`group ${theme.bg} border ${theme.border} ${theme.hoverBorder} ${theme.hoverShadow} rounded-[32px] transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden flex flex-col h-full p-0`}
                >
                  {/* Number Badge */}
                  <div
                    className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 dark:text-slate-500 ${theme.badgeHoverBg} ${theme.badgeHoverText} shadow-sm transition-colors z-10`}
                  >
                    {index + 1}
                  </div>

                  {/* Thumbnail / Icon */}
                  <div className="w-full h-32 relative bg-white/40 dark:bg-slate-900/40 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {(() => {
                      // 1. iconUrl từ DB
                      if (topic.iconUrl) {
                        if (topic.iconUrl.startsWith("http") || topic.iconUrl.startsWith("/")) {
                          return (
                            <img
                              src={topic.iconUrl}
                              alt={topic.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          );
                        }
                        return (
                          <div className="text-7xl group-hover:scale-110 transition-transform duration-500 select-none">
                            {topic.iconUrl}
                          </div>
                        );
                      }

                      // 2. Dùng lưới ảnh flashcard làm thumbnail
                      const sampleImages = (topic as any).flashcards
                        ?.map((f: any) => f.imageUrl)
                        .filter(Boolean) as string[];

                      if (sampleImages && sampleImages.length > 0) {
                        return (
                          <div className={`w-full h-full grid ${
                            sampleImages.length === 1 ? "grid-cols-1" :
                            sampleImages.length === 2 ? "grid-cols-2" :
                            "grid-cols-3"
                          } gap-1 p-2`}>
                            {sampleImages.slice(0, 3).map((src, i) => (
                              <div key={i} className="relative overflow-hidden rounded-xl bg-white/60 flex items-center justify-center">
                                <img
                                  src={src}
                                  alt=""
                                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                />
                              </div>
                            ))}
                          </div>
                        );
                      }

                      // 3. Fallback: icon Gamepad2
                      return (
                        <div className={`w-16 h-16 ${theme.iconBg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                          <Gamepad2 className={`w-7 h-7 ${theme.iconColor}`} />
                        </div>
                      );
                    })()}
                  </div>

                  {/* Text */}
                  <div className="p-4 flex flex-col flex-1">
                    <h2
                      className={`text-2xl font-black text-slate-800 dark:text-white mb-2 ${theme.titleHover} transition-colors`}
                    >
                      {topic.name}
                    </h2>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/50 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs font-black uppercase tracking-wider">
                        {cardCount} {cardCount === 1 ? "Card" : "Cards"}
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800 pt-3">
                      <span className="font-bold text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">
                        Play Now
                      </span>
                      <div
                        className={`w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 ${theme.btnHoverBg} ${theme.btnHoverText} shadow-sm transition-all`}
                      >
                        <Play className="w-4 h-4 ml-0.5 fill-current" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
