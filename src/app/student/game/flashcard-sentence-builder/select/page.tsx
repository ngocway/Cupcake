import Link from "next/link";
import { Gamepad2, Play } from "lucide-react";
import prisma from "@/lib/prisma";

export const metadata = {
  title: "Sentence Builder (Flashcards) – Select Topic",
};

// ─── Card color themes ────────────────────────────────────────────────────────
const CARD_COLORS = [
  {
    bg: "bg-gradient-to-br from-purple-50 to-fuchsia-100 dark:from-purple-900/20 dark:to-fuchsia-800/20",
    border: "border-purple-200 dark:border-purple-800",
    hoverBorder: "hover:border-purple-400 dark:hover:border-purple-500",
    hoverShadow: "hover:shadow-purple-400/20",
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    iconColor: "text-purple-500",
    badgeHoverBg: "group-hover:bg-purple-200",
    badgeHoverText: "group-hover:text-purple-700",
    titleHover: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
    btnHoverBg: "group-hover:bg-purple-500",
    btnHoverText: "group-hover:text-white",
  },
  {
    bg: "bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-900/20 dark:to-rose-800/20",
    border: "border-pink-200 dark:border-pink-800",
    hoverBorder: "hover:border-pink-400 dark:hover:border-pink-500",
    hoverShadow: "hover:shadow-pink-400/20",
    iconBg: "bg-pink-100 dark:bg-pink-900/40",
    iconColor: "text-pink-500",
    badgeHoverBg: "group-hover:bg-pink-200",
    badgeHoverText: "group-hover:text-pink-700",
    titleHover: "group-hover:text-pink-600 dark:group-hover:text-pink-400",
    btnHoverBg: "group-hover:bg-pink-500",
    btnHoverText: "group-hover:text-white",
  },
  {
    bg: "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20",
    border: "border-blue-200 dark:border-blue-800",
    hoverBorder: "hover:border-blue-400 dark:hover:border-blue-500",
    hoverShadow: "hover:shadow-blue-400/20",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-500",
    badgeHoverBg: "group-hover:bg-blue-200",
    badgeHoverText: "group-hover:text-blue-700",
    titleHover: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
    btnHoverBg: "group-hover:bg-blue-500",
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
];

// ─── Level config ─────────────────────────────────────────────────────────────
const LEVEL_CONFIG: Record<
  string,
  { label: string; emoji: string; description: string; audience: string; ageParam: string }
> = {
  kindergarten: {
    label: "Kindergarten",
    emoji: "🧸",
    description: "2–5 Years",
    audience: "kindergarten",
    ageParam: "2-5"
  },
  kid: {
    label: "Kid",
    emoji: "🎒",
    description: "6–12 Years",
    audience: "kid",
    ageParam: "6-12"
  },
  teen: {
    label: "Teen",
    emoji: "🎧",
    description: "13–16 Years",
    audience: "teen",
    ageParam: "teen"
  },
  learner: {
    label: "Learner",
    emoji: "🚀",
    description: "16+ Years",
    audience: "learner",
    ageParam: "readers"
  },
};

// Ordered list for tab display
const LEVEL_ORDER = ["kindergarten", "kid", "teen", "learner"];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function FlashcardSentenceBuilderSelectPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolved = await searchParams;
  const activeLevel = (resolved.level as string) || "kindergarten";

  const levelCfg = LEVEL_CONFIG[activeLevel] || LEVEL_CONFIG.kindergarten;

  // Fetch topics that have target audience
  const topicsRaw = await prisma.flashcardTopic.findMany({
    where: {
      targetAudiences: {
        hasSome: [levelCfg.audience],
      },
    },
    include: {
      _count: {
        select: {
          flashcards: {
            where: {
              imageUrl: { not: null },
              exampleSentence: { not: null },
              AND: [
                { imageUrl: { not: "" } },
                { exampleSentence: { not: "" } }
              ]
            },
          },
        },
      },
      // Take first 3 images to display as sample thumbnail
      flashcards: {
        where: {
          imageUrl: { not: null },
          exampleSentence: { not: null },
          AND: [
            { imageUrl: { not: "" } },
            { exampleSentence: { not: "" } }
          ]
        },
        select: { imageUrl: true },
        orderBy: { orderIndex: "asc" },
        take: 3,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Only keep topics that have at least 3 cards with both Image and Example Sentence
  const topics = topicsRaw.filter(topic => (topic._count?.flashcards || 0) >= 3);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16 font-body relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-400/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-400/8 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pt-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-5 py-2 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 shadow-sm">
            🧩 Sentence Builder (Flashcards)
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white mb-2 animate-in fade-in slide-in-from-top-4 duration-350">
            Choose a Topic to Play
          </h1>
        </div>



        {/* Topic Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {topics.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] shadow-sm animate-in zoom-in-95 duration-200">
              <Gamepad2 className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-xl font-bold text-slate-400 dark:text-slate-500">
                No topics found
              </h3>
              <p className="text-slate-400 mt-2 text-sm px-4">
                Ensure topics have at least 3 flashcards with both an image and an example sentence.
              </p>
            </div>
          ) : (
            topics.map((topic, index) => {
              const theme = CARD_COLORS[index % CARD_COLORS.length];
              const cardCount = topic._count?.flashcards || 0;

              return (
                <Link
                  key={topic.id}
                  href={`/student/game/flashcard-sentence-builder?topicId=${topic.id}&age=${levelCfg.ageParam}`}
                  className={`group ${theme.bg} border ${theme.border} ${theme.hoverBorder} ${theme.hoverShadow} rounded-[32px] transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden flex flex-col h-full p-0 animate-in fade-in slide-in-from-bottom-6 duration-300`}
                  style={{ animationDelay: `${index * 50}ms` }}
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

                      // sample flashcard images
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
                        {cardCount} {cardCount === 1 ? "Sentence" : "Sentences"}
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
