import { Suspense } from "react"
import { HomeShell } from "../_components/HomeShell"
import { getFlashcardTopics } from "@/actions/flashcards-actions"
import { getOnboardingConfig } from "@/actions/user-preferences-actions"
import { FlashcardsClient } from "./FlashcardsClient"

export const metadata = {
  title: "Flashcard Học Tiếng Anh Đa Tương Tác | Cupcakes",
  description: "Trang học từ vựng tiếng Anh qua thẻ Flashcard tương tác 3D sinh động, phát âm chuẩn cho bé từ 2-12 tuổi và câu ví dụ chi tiết cho học sinh lớn tuổi.",
}

export default async function FlashcardsPage() {
  const config = await getOnboardingConfig()
  const englishSubject = (config as any)?.subjects?.find((s: any) => s.id === 'english');
  const targetAudiences = (englishSubject?.ageGroups || []).filter((ta: any) => 
    ta.id !== 'kindergarten' && 
    ta.id !== 'kindergarden' && 
    ta.id !== 'KINDERGARTEN' && 
    ta.id !== 'KINDERGARTEN (< 6 YEARS)' &&
    ta.id !== 'kids-2-5'
  );
  
  const topics = await getFlashcardTopics()
  
  const categories = targetAudiences.map((ta: any) => ({
    id: ta.id,
    name: ta.label,
    slug: ta.id,
    topics: topics.filter(t => t.targetAudience === ta.id).map(t => ({
      id: t.id,
      categoryId: t.targetAudience,
      name: t.name,
      slug: t.slug,
      iconUrl: t.iconUrl,
      flashcardCount: t._count?.flashcards ?? 0
    }))
  }))

  return (
    <HomeShell>
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950/20 pb-20 px-4 md:px-8">
        <Suspense fallback={
          <div className="relative min-h-[400px] w-full">
            {/* Centered spinner loading */}
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-transparent">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-md" />
            </div>
            
            <div className="max-w-6xl mx-auto space-y-8 animate-pulse opacity-50">
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
          </div>
        }>
          <FlashcardsClient initialCategories={categories as any} />
        </Suspense>
      </main>
    </HomeShell>
  )
}
