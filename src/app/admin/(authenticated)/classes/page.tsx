import prisma from "@/lib/prisma"
import { AdminClassItem } from "./AdminClassItem"

export default async function AdminClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams

  const classes = await prisma.class.findMany({
    where: {
      ...(q && {
        OR: [
          { name: { contains: q } },
          { classCode: { contains: q } },
        ],
      }),
    },
    include: {
      teacher: { select: { name: true, email: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Quản lý lớp học</h1>
          <p className="text-neutral-400">Giám sát hoạt động của các lớp học trên toàn hệ thống.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-grow w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">search</span>
            <input 
              type="text" 
              placeholder="Tìm theo tên lớp hoặc mã lớp..." 
              className="w-full pl-12 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl outline-none focus:border-blue-500 text-white transition-all font-medium"
            />
         </div>
         <button className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/20">Lọc dữ liệu</button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-full py-20 bg-neutral-900 border border-neutral-800 rounded-3xl text-center">
             <span className="material-symbols-outlined text-neutral-600 text-5xl mb-4">school</span>
             <p className="text-neutral-500 font-medium">Hiện chưa có lớp học nào được tạo.</p>
          </div>
        ) : (
          classes.map((cls) => (
            <AdminClassItem key={cls.id} cls={cls} />
          ))
        )}
      </div>
    </div>
  )
}
