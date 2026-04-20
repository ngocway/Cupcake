import prisma from "@/lib/prisma"
import Link from "next/link"
import { AdminMaterialItem } from "./AdminMaterialItem"

export default async function AdminMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>
}) {
  const { type = 'lessons', q } = await searchParams

  const isLessons = type === 'lessons'

  const data = isLessons 
    ? await prisma.lesson.findMany({
        where: { deletedAt: null, ...(q && { title: { contains: q } }) },
        include: { teacher: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : await prisma.assignment.findMany({
        where: { deletedAt: null, ...(q && { title: { contains: q } }) },
        include: { teacher: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      })

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Quản lý học liệu</h1>
        <p className="text-neutral-400">Giám sát và kiểm duyệt các bài học, bài tập trên toàn hệ thống.</p>
      </div>

      {/* Tabs / Filters */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl flex flex-col md:flex-row gap-6 items-center justify-between">
         <div className="flex gap-1 p-1 bg-neutral-800 rounded-2xl w-full md:w-auto">
            <Link 
              href="/admin/materials?type=lessons"
              className={`px-8 py-2.5 font-bold rounded-xl transition-all text-center flex-grow md:flex-none ${
                isLessons ? "bg-blue-600 text-white shadow-lg" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Tất cả bài học
            </Link>
            <Link 
              href="/admin/materials?type=assignments"
              className={`px-8 py-2.5 font-bold rounded-xl transition-all text-center flex-grow md:flex-none ${
                !isLessons ? "bg-blue-600 text-white shadow-lg" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Bài tập / Đề thi
            </Link>
         </div>

         <div className="flex items-center gap-4 w-full md:w-auto">
            <Link
              href="/admin/materials/ai-generator"
              className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-blue-400 border border-neutral-700 rounded-2xl font-bold flex items-center gap-2 transition-all whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-xl">auto_awesome</span>
              Tạo bằng AI
            </Link>
            
            <form className="relative flex-grow max-w-sm w-full">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">search</span>
                <input 
                  name="q"
                  type="text" 
                  defaultValue={q}
                  placeholder={`Tìm ${isLessons ? 'bài học' : 'bài tập'}...`} 
                  className="w-full pl-12 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl outline-none focus:border-blue-500 text-white transition-all"
                />
                <input type="hidden" name="type" value={type} />
            </form>
         </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-4">
        {data.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 p-16 rounded-3xl text-center">
             <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-neutral-600 text-4xl">inventory_2</span>
             </div>
             <p className="text-neutral-500 font-bold">Hiện chưa có dữ liệu trong mục này.</p>
          </div>
        ) : (
          data.map((item: any) => (
            <AdminMaterialItem key={item.id} item={item} isLessons={isLessons} />
          ))
        )}
      </div>
    </div>
  )
}
