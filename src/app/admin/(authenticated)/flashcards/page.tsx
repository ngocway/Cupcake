import prisma from "@/lib/prisma"
import { AdminFlashcardsClient } from "./AdminFlashcardsClient"

export const dynamic = "force-dynamic"

export default async function AdminFlashcardsPage() {
  // 1. Lấy danh sách toàn bộ các danh mục tuổi (Kids 2-5, Kids 6-12, Teen, Readers)
  const categories = await prisma.flashcardCategory.findMany({
    include: {
      topics: {
        orderBy: {
          name: 'asc'
        }
      }
    },
    orderBy: {
      slug: 'asc'
    }
  });

  // 2. Lấy toàn bộ các chủ đề (Topics) - Sắp xếp theo ngày tạo mới nhất lên đầu như yêu cầu!
  const topics = await prisma.flashcardTopic.findMany({
    include: {
      category: true,
      _count: {
        select: { flashcards: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // 3. Lấy toàn bộ các thẻ flashcard - Sắp xếp theo ngày tạo mới nhất lên đầu để dễ theo dõi
  const flashcards = await prisma.globalFlashcard.findMany({
    include: {
      topic: {
        include: {
          category: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="p-8 space-y-8 bg-neutral-950 min-h-screen text-neutral-200">
      <div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Hệ thống Quản lý Flashcards</h1>
        <p className="text-neutral-400 font-medium">Thiết lập các nhóm tuổi, chủ đề từ vựng và biên soạn các thẻ học tương tác sinh động.</p>
      </div>

      <AdminFlashcardsClient 
        initialCategories={categories}
        initialTopics={topics}
        initialFlashcards={flashcards}
      />
    </div>
  )
}
