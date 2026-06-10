import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Gamepad2, Play } from "lucide-react";
import { getMatchWordGames } from "@/actions/admin-match-words";

export const metadata = {
  title: "Match Words Games",
}

const CARD_COLORS = [
  {
    bg: "bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-900/20 dark:to-sky-800/20",
    border: "border-blue-200 dark:border-blue-800",
    hoverBorder: "hover:border-blue-400 dark:hover:border-blue-500",
    hoverShadow: "hover:shadow-blue-500/20",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-500",
    badgeHoverBg: "group-hover:bg-blue-200",
    badgeHoverText: "group-hover:text-blue-700",
    titleHover: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
    btnHoverBg: "group-hover:bg-blue-600",
    btnHoverText: "group-hover:text-white"
  },
  {
    bg: "bg-gradient-to-br from-purple-50 to-fuchsia-100 dark:from-purple-900/20 dark:to-fuchsia-800/20",
    border: "border-purple-200 dark:border-purple-800",
    hoverBorder: "hover:border-purple-400 dark:hover:border-purple-500",
    hoverShadow: "hover:shadow-purple-500/20",
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    iconColor: "text-purple-500",
    badgeHoverBg: "group-hover:bg-purple-200",
    badgeHoverText: "group-hover:text-purple-700",
    titleHover: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
    btnHoverBg: "group-hover:bg-purple-600",
    btnHoverText: "group-hover:text-white"
  },
  {
    bg: "bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-800/20",
    border: "border-emerald-200 dark:border-emerald-800",
    hoverBorder: "hover:border-emerald-400 dark:hover:border-emerald-500",
    hoverShadow: "hover:shadow-emerald-500/20",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-500",
    badgeHoverBg: "group-hover:bg-emerald-200",
    badgeHoverText: "group-hover:text-emerald-700",
    titleHover: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
    btnHoverBg: "group-hover:bg-emerald-600",
    btnHoverText: "group-hover:text-white"
  },
  {
    bg: "bg-gradient-to-br from-rose-50 to-orange-100 dark:from-rose-900/20 dark:to-orange-800/20",
    border: "border-rose-200 dark:border-rose-800",
    hoverBorder: "hover:border-rose-400 dark:hover:border-rose-500",
    hoverShadow: "hover:shadow-rose-500/20",
    iconBg: "bg-rose-100 dark:bg-rose-900/40",
    iconColor: "text-rose-500",
    badgeHoverBg: "group-hover:bg-rose-200",
    badgeHoverText: "group-hover:text-rose-700",
    titleHover: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
    btnHoverBg: "group-hover:bg-rose-600",
    btnHoverText: "group-hover:text-white"
  }
];

export default async function MatchWordsSelectPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  const age = (resolvedSearchParams.age as string) || "2-5";

  // Fetch games based on age group
  const res = await getMatchWordGames(age);
  const games = res.success && res.games ? res.games : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-8 pb-12 font-body relative overflow-hidden">
      {/* Decorative background blobs - Blue theme for Match Words */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <Link 
          href="/student/game"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all font-bold mb-10 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Game Hub</span>
        </Link>
        
        <div className="mb-12 text-center md:text-left flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-sky-500 rounded-[28px] flex items-center justify-center shadow-xl shadow-blue-500/30 rotate-3 hover:rotate-0 transition-transform">
            <span className="material-symbols-outlined text-white text-5xl">pets</span>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight">
              Match <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-sky-500">Words</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg max-w-xl">
              Drag and drop English words to match the correct illustrations. Choose a game level below!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px]">
              <Gamepad2 className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-xl font-bold text-slate-400 dark:text-slate-500">No levels found</h3>
              <p className="text-slate-400 mt-2">More games will be added soon for this age group!</p>
            </div>
          ) : (
            games.map((game, index) => {
              const theme = CARD_COLORS[index % CARD_COLORS.length];
              return (
                <Link 
                  key={game.id} 
                  href={`/student/game/match-words?age=${age}&gameId=${game.id}`}
                  className={`group ${theme.bg} border ${theme.border} ${theme.hoverBorder} ${theme.hoverShadow} rounded-[32px] transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden flex flex-col h-full p-0`}
                >
                  {/* Number Badge */}
                  <div className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 dark:text-slate-500 ${theme.badgeHoverBg} ${theme.badgeHoverText} shadow-sm transition-colors z-10`}>
                    {index + 1}
                  </div>

                  {/* Thumbnail Half */}
                  <div className="w-full h-44 relative bg-white/40 dark:bg-slate-900/40 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {(game as any).thumbnailUrl ? (
                      <Image 
                        src={(game as any).thumbnailUrl} 
                        alt={game.name} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className={`w-14 h-14 ${theme.iconBg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                        <Gamepad2 className={`w-6 h-6 ${theme.iconColor}`} />
                      </div>
                    )}
                  </div>
                  
                  {/* Text Half */}
                  <div className="p-6 flex flex-col flex-1">
                    <h2 className={`text-2xl font-black text-slate-800 dark:text-white mb-2 ${theme.titleHover} transition-colors`}>{game.name}</h2>
                    <div className="flex items-center gap-2 mb-8">
                      <span className="px-3 py-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/50 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs font-black uppercase tracking-wider">
                        {game.topics?.length || 0} Topics
                      </span>
                    </div>
                    
                    <div className="mt-auto flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800 pt-5">
                      <span className="font-bold text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">Start Playing</span>
                      <div className={`w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 ${theme.btnHoverBg} ${theme.btnHoverText} shadow-sm transition-all`}>
                        <Play className="w-4 h-4 ml-1 fill-current" />
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
