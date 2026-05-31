import { Suspense } from "react"
import { HomeShell } from "../_components/HomeShell"
import { getFlashcardCategories } from "@/actions/flashcards-actions"
import { FlashcardsClient } from "./FlashcardsClient"

export const metadata = {
  title: "Flashcard Học Tiếng Anh Đa Tương Tác | Cupcakes",
  description: "Trang học từ vựng tiếng Anh qua thẻ Flashcard tương tác 3D sinh động, phát âm chuẩn cho bé từ 2-12 tuổi và câu ví dụ chi tiết cho học sinh lớn tuổi.",
}

export default async function FlashcardsPage() {
  // Nạp danh sách danh mục & chủ đề trên server
  const categories = await getFlashcardCategories()

  return (
    <HomeShell>
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950/20 pt-28 pb-20 px-4 md:px-8">
        <Suspense fallback={
          <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
            <div className="text-center space-y-4">
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-full w-1/3 mx-auto" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mx-auto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              ))}
            </div>
          </div>
        }>
          <FlashcardsClient initialCategories={categories} />
        </Suspense>
      </main>
    </HomeShell>
  )
}
