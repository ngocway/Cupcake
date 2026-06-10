import { getMatchWordGames } from "@/actions/admin-match-words"
import { AdminMatchWordsClient } from "./AdminMatchWordsClient"

export const metadata = {
  title: "Quản lý Game Nối Từ (Match Words)",
}

export default async function AdminMatchWordsPage() {
  const [games2to5Res, games6to12Res, gamesTeenRes, gamesReadersRes] = await Promise.all([
    getMatchWordGames("2-5"),
    getMatchWordGames("6-12"),
    getMatchWordGames("teen"),
    getMatchWordGames("readers")
  ])

  const games2to5 = games2to5Res.success ? games2to5Res.games : []
  const games6to12 = games6to12Res.success ? games6to12Res.games : []
  const gamesTeen = gamesTeenRes.success ? gamesTeenRes.games : []
  const gamesReaders = gamesReadersRes.success ? gamesReadersRes.games : []

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <span className="material-symbols-outlined text-blue-500 text-4xl">sports_esports</span>
          Quản lý Game Nối Từ
        </h1>
        <p className="text-neutral-400 mt-2">Thêm từ vựng và hình ảnh cho game Match Words.</p>
      </div>
      
      <AdminMatchWordsClient 
        initialGames2to5={games2to5 as any} 
        initialGames6to12={games6to12 as any} 
        initialGamesTeen={gamesTeen as any}
        initialGamesReaders={gamesReaders as any}
      />
    </div>
  )
}
