"use client";

import { useState } from "react";
import Link from "next/link";
import { Gamepad2, Play, Sparkles, Layers, Lock, ArrowLeft, Loader2 } from "lucide-react";

interface Game {
  id: string;
  title: string;
  href: string;
  gradient: string;
  emoji: string;
  tag: string;
  desc: string;
  comingSoon: boolean;
}

const GAME_CATEGORIES = [
  { id: "kid-6-12", name: "Kid (6-10 years)", slug: "kid-6-12", icon: "🎒", bg: "bg-emerald-100/80 border-emerald-200 text-emerald-600", bgGradient: "from-emerald-400 to-teal-500", glowShadow: "shadow-emerald-100/60" },
  { id: "teen", name: "Teen (11-16 years)", slug: "teen", icon: "🎧", bg: "bg-indigo-100/80 border-indigo-200 text-indigo-600", bgGradient: "from-indigo-400 to-violet-500", glowShadow: "shadow-indigo-100/60" },
  { id: "readers", name: "Learner (16+)", slug: "readers", icon: "🚀", bg: "bg-pink-100/80 border-pink-200 text-pink-600", bgGradient: "from-pink-400 to-rose-500", glowShadow: "shadow-pink-100/60" },
];

const GAMES_DATA: Record<string, Game[]> = {
  "kids-2-5": [
    {
      id: "word-match",
      title: "Word Match",
      href: "/student/game/match-words/select?age=2-5",
      gradient: "from-blue-200 to-sky-400",
      emoji: "🐾",
      tag: "Vocabulary",
      desc: "Drag and drop English words to match the correct illustrations. Exciting vocabulary topics are waiting for you to discover!",
      comingSoon: false,
    },
    {
      id: "sentence-builder",
      title: "Sentence Builder",
      href: "/student/game/sentence-builder?age=2-5",
      gradient: "from-purple-200 to-fuchsia-400",
      emoji: "🧩",
      tag: "Grammar",
      desc: "Arrange the given words into a complete sentence describing the image. Practice grammar in a fun way!",
      comingSoon: false,
    }
  ],
  "kid-6-12": [
    {
      id: "word-match",
      title: "Word Match",
      href: "/student/game/match-words/select?age=6-12",
      gradient: "from-blue-200 to-sky-400",
      emoji: "🐾",
      tag: "Vocabulary",
      desc: "Drag and drop English words to match the correct illustrations. Exciting vocabulary topics are waiting for you to discover!",
      comingSoon: false,
    },
    {
      id: "sentence-builder",
      title: "Sentence Builder",
      href: "/student/game/sentence-builder?age=6-12",
      gradient: "from-purple-200 to-fuchsia-400",
      emoji: "🧩",
      tag: "Grammar",
      desc: "Arrange the given words into a complete sentence describing the image. Practice grammar in a fun way!",
      comingSoon: false,
    },
    {
      id: "spell-quest",
      title: "Spell Quest",
      href: "#",
      gradient: "from-emerald-250 to-teal-400 dark:from-emerald-900/40 dark:to-teal-800/40",
      emoji: "📝",
      tag: "Spelling",
      desc: "Unscramble letters to spell vocabulary words correctly. Level up your spelling and win badges!",
      comingSoon: true,
    }
  ],
  "teen": [
    {
      id: "word-match",
      title: "Word Match",
      href: "/student/game/match-words/select?age=teen",
      gradient: "from-blue-200 to-sky-400",
      emoji: "🐾",
      tag: "Vocabulary",
      desc: "Drag and drop English words to match the correct illustrations. Exciting vocabulary topics are waiting for you to discover!",
      comingSoon: false,
    },
    {
      id: "sentence-builder",
      title: "Sentence Builder",
      href: "/student/game/sentence-builder?age=teen",
      gradient: "from-purple-200 to-fuchsia-400",
      emoji: "🧩",
      tag: "Grammar",
      desc: "Arrange the given words into a complete sentence describing the image. Practice grammar in a fun way!",
      comingSoon: false,
    },
    {
      id: "grammar-escape",
      title: "Grammar Escape",
      href: "#",
      gradient: "from-indigo-250 to-violet-400 dark:from-indigo-900/40 dark:to-violet-800/40",
      emoji: "🏰",
      tag: "Reading",
      desc: "Solve grammar riddles to escape the haunted classroom. Challenge your reading and sentence building skills!",
      comingSoon: true,
    }
  ],
  "readers": [
    {
      id: "word-match",
      title: "Word Match",
      href: "/student/game/match-words/select?age=readers",
      gradient: "from-blue-200 to-sky-400",
      emoji: "🐾",
      tag: "Vocabulary",
      desc: "Drag and drop English words to match the correct illustrations. Exciting vocabulary topics are waiting for you to discover!",
      comingSoon: false,
    },
    {
      id: "sentence-builder",
      title: "Sentence Builder",
      href: "/student/game/sentence-builder?age=readers",
      gradient: "from-purple-200 to-fuchsia-400",
      emoji: "🧩",
      tag: "Grammar",
      desc: "Arrange the given words into a complete sentence describing the image. Practice grammar in a fun way!",
      comingSoon: false,
    },
    {
      id: "vocab-master",
      title: "Vocabulary Master",
      href: "#",
      gradient: "from-pink-250 to-rose-400 dark:from-pink-900/40 dark:to-rose-800/40",
      emoji: "👑",
      tag: "Synonyms",
      desc: "Compete against the clock to match complex definitions and high-level vocabulary synonyms.",
      comingSoon: true,
    }
  ]
};

import { useRouter } from "next/navigation";

export default function GameHubPage() {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState(GAME_CATEGORIES[0].id);

  const selectedCategory = GAME_CATEGORIES.find((cat) => cat.id === selectedCategoryId) || GAME_CATEGORIES[0];
  const games = GAMES_DATA[selectedCategoryId] || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-16 md:pt-8 pb-12 font-body relative">
      {/* Back Button (Moved to top left) */}
      <Link 
        href="/"
        className="absolute top-6 left-4 md:top-8 md:left-8 xl:left-12 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all font-bold shadow-sm z-40"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back to home</span>
      </Link>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">

        {/* Selection Area (Category & Game Cards) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[40px] p-6 md:p-8 shadow-xl shadow-slate-100/50 dark:shadow-none space-y-10">
          {/* STEP 1: Select Age Category */}
          <div className="space-y-5">
            <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-primary" />
              <span>Step 1: Select Age Category</span>
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {GAME_CATEGORIES.map((cat) => {
                const isActive = selectedCategoryId === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`relative overflow-hidden p-6 rounded-[32px] border-4 transition-all duration-500 flex flex-col text-left group active:scale-95 ${
                      isActive
                        ? `border-primary bg-white dark:bg-slate-800 shadow-2xl ${cat.glowShadow} scale-[1.03]`
                        : "border-slate-100 dark:border-slate-800 bg-slate-50/50 hover:bg-white dark:hover:bg-slate-850 hover:border-primary/30 hover:scale-[1.01] hover:shadow-xl"
                    }`}
                  >
                    {/* Background Glow */}
                    {isActive && (
                      <span className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${cat.bgGradient} opacity-[0.08] rounded-full blur-2xl -translate-y-8 translate-x-8`} />
                    )}

                    {/* Category circular icon box */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 transition-transform duration-500 group-hover:scale-110 shadow-sm border ${cat.bg}`}>
                      {cat.icon}
                    </div>

                    <span className="font-black text-lg text-slate-800 dark:text-slate-200 leading-tight group-hover:text-primary transition-colors">
                      {cat.name}
                    </span>

                    {/* Active indicator bar */}
                    <span className={`h-2 rounded-full mt-5 transition-all duration-500 ${
                      isActive
                        ? `w-14 bg-gradient-to-r ${cat.bgGradient}`
                        : "w-0 bg-slate-200 dark:bg-slate-700"
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/50" />

          {/* STEP 2: Choose Game */}
          <div className="space-y-5">
            <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Gamepad2 className="w-4.5 h-4.5 text-emerald-500" />
              <span>Step 2: Choose Game</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {games.map((game) => {
                if (game.comingSoon) {
                  return (
                    <div 
                      key={game.id} 
                      className="bg-slate-50/50 dark:bg-slate-900/30 rounded-[32px] border border-slate-200/50 dark:border-slate-800/80 shadow-sm transition-all duration-300 overflow-hidden flex flex-col h-full opacity-75 relative select-none"
                    >
                      <div className={`aspect-video bg-gradient-to-br ${game.gradient} relative overflow-hidden flex items-center justify-center p-6 grayscale`}>
                        <div className="absolute inset-0 bg-black/20 z-10" />
                        <div className="relative z-20 flex flex-col items-center justify-center space-y-2">
                          <div className="text-6xl">{game.emoji}</div>
                          <h3 className="text-3xl font-black text-white text-center drop-shadow-md">{game.title}</h3>
                        </div>
                      </div>

                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5" />
                              {game.tag}
                            </span>
                            <span className="px-3 py-1 bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 rounded-full text-xs font-black uppercase tracking-wider">
                              Coming Soon
                            </span>
                          </div>
                          <h2 className="text-xl font-black text-slate-400 dark:text-slate-600 mb-2">
                            {game.title}
                          </h2>
                          <p className="text-sm text-slate-400 dark:text-slate-600 line-clamp-2">
                            {game.desc}
                          </p>
                        </div>

                        <div className="mt-6 flex items-center text-slate-400 dark:text-slate-600 font-black text-sm uppercase tracking-widest gap-2">
                          <Lock className="w-5 h-5" />
                          Locked
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={game.id} 
                    onClick={() => {
                       window.dispatchEvent(new Event("show-global-loader"));
                       router.push(game.href);
                    }}
                    className="group cursor-pointer"
                  >
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:border-primary/50 transition-all duration-300 overflow-hidden flex flex-col h-full transform hover:-translate-y-2">
                      <div className={`aspect-video bg-gradient-to-br ${game.gradient} relative overflow-hidden flex items-center justify-center p-6`}>
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
                        <div className="relative z-20 flex flex-col items-center justify-center space-y-2">
                           <div className="text-6xl animate-bounce">{game.emoji}</div>
                           <h3 className="text-3xl font-black text-white text-center drop-shadow-md">{game.title}</h3>
                        </div>
                        
                        {/* Decorative blobs */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl -ml-10 -mb-10" />
                      </div>

                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full text-xs font-black uppercase tracking-wider">
                              {game.tag}
                            </span>
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded-full text-xs font-black uppercase tracking-wider">
                              {selectedCategory.name.split(" ")[0]}
                            </span>
                          </div>
                          <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2 group-hover:text-primary transition-colors">
                            {game.title}
                          </h2>
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {game.desc}
                          </p>
                        </div>
                        
                        <div className="mt-6 flex items-center text-primary font-black text-sm uppercase tracking-widest gap-2 group-hover:translate-x-2 transition-transform">
                          <Play className="w-5 h-5 fill-primary" />
                          Play Now
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
