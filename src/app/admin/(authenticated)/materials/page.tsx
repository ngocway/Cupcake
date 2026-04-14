import prisma from "@/lib/prisma"
import Link from "next/link"

export default async function AdminMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>
}) {
  const { type = 'lessons', q } = await searchParams

  const isLessons = type === 'lessons'

  const data = isLessons 
    ? await prisma.lesson.findMany({
        where: { ...(q && { title: { contains: q } }) },
        include: { teacher: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : await prisma.assignment.findMany({
        where: { ...(q && { title: { contains: q } }) },
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
         <form className="relative flex-grow max-w-md w-full">
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
            <div key={item.id} className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl hover:border-neutral-700 transition-all flex items-center justify-between group">
              <div className="flex items-center gap-6">
                 <div className="w-14 h-14 rounded-2xl bg-neutral-800 flex items-center justify-center border border-neutral-700 shadow-inner">
                    {isLessons ? (
                      <span className="material-symbols-outlined text-blue-500">play_circle</span>
                    ) : (
                      <span className="material-symbols-outlined text-emerald-500">assignment</span>
                    )}
                 </div>
                 <div>
                    <h3 className="text-white font-black text-lg mb-1">{item.title}</h3>
                    <div className="flex items-center gap-3 text-xs font-medium">
                       <span className="text-neutral-500">Người tạo: <span className="text-blue-500 font-bold">{item.teacher.name}</span></span>
                       <span className="text-neutral-700">|</span>
                       <span className="text-neutral-500">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                       <span className="text-neutral-700">|</span>
                       {isLessons ? (
                         <span className="flex items-center gap-1 text-neutral-500">
                            <span className="material-symbols-outlined text-xs">visibility</span>
                            {item.viewsCount} lượt xem
                         </span>
                       ) : (
                         <span className="px-2 py-0.5 bg-neutral-800 text-neutral-400 rounded text-[9px] uppercase font-black tracking-widest">
                            {item.materialType}
                         </span>
                       )}
                    </div>
                 </div>
              </div>
              
              <div className="flex items-center gap-4">
                 {isLessons && item.isPremium && (
                   <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase border border-amber-500/10 rounded-full tracking-widest">Premium Content</span>
                 )}
                 {!isLessons && item.status === 'DRAFT' && (
                   <span className="px-3 py-1 bg-neutral-800 text-neutral-500 text-[9px] font-black uppercase rounded-full tracking-widest">Bản nháp</span>
                 )}
                 <div className="flex gap-2">
                    <button className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-500 hover:text-white flex items-center justify-center transition-all border border-neutral-700">
                       <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-rose-500/10 text-neutral-500 hover:text-rose-500 flex items-center justify-center transition-all border border-neutral-700">
                       <span className="material-symbols-outlined text-lg">block</span>
                    </button>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
