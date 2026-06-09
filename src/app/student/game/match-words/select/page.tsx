import Link from "next/link";
import { ArrowLeft, Play, Sparkles } from "lucide-react";
import { getMatchWordGames } from "@/actions/admin-match-words";

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

  // Decorative gradients for games
  const gradients = [
    "from-blue-400 to-sky-500",
    "from-purple-400 to-fuchsia-500",
    "from-emerald-400 to-teal-500",
    "from-amber-400 to-orange-500",
    "from-pink-400 to-rose-500"
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 font-body">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link 
            href="/student/game"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-500" />
              Choose a Game
            </h1>
            <p className="text-slate-500 font-medium">Select a Word Match game to start playing!</p>
          </div>
        </div>

        {/* Game List */}
        {games.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400">No games found for this age group yet.</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game, index) => {
              const bgGradient = gradients[index % gradients.length];
              
              return (
                <Link 
                  key={game.id} 
                  href={`/student/game/match-words?age=${age}&gameId=${game.id}`}
                  className="group"
                >
                  <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 overflow-hidden flex flex-col h-full transform hover:-translate-y-1">
                    
                    <div className={`h-32 bg-gradient-to-r ${bgGradient} relative overflow-hidden flex items-center justify-center`}>
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
                      <div className="text-4xl relative z-20 animate-bounce">🎯</div>
                      
                      {/* Decorative blobs */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-xl -mr-6 -mt-6" />
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                            Kids {game.ageGroup}
                          </span>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white group-hover:text-primary transition-colors">
                          {game.name}
                        </h2>
                      </div>
                      
                      <div className="mt-5 flex items-center text-primary font-black text-sm uppercase tracking-widest gap-2 group-hover:translate-x-2 transition-transform">
                        <Play className="w-5 h-5 fill-primary" />
                        Play Game
                      </div>
                    </div>

                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
