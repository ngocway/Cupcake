import prisma from "@/lib/prisma"

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
            <div key={cls.id} className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden hover:border-neutral-700 transition-all group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <span className="material-symbols-outlined text-blue-500">school</span>
                  </div>
                  <span className="px-3 py-1 bg-neutral-800 text-neutral-400 text-[10px] font-bold rounded-lg border border-neutral-700">
                    ID: {cls.classCode}
                  </span>
                </div>
                
                <h3 className="text-white font-bold text-lg mb-1 group-hover:text-blue-500 transition-colors">{cls.name}</h3>
                <p className="text-neutral-500 text-sm mb-4">Giảng viên: <span className="text-neutral-300 font-medium">{cls.teacher.name || cls.teacher.email}</span></p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                   <div className="bg-neutral-800/50 p-3 rounded-2xl border border-neutral-800">
                      <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Học sinh</p>
                      <p className="text-white font-bold">{cls._count.enrollments}</p>
                   </div>
                   <div className="bg-neutral-800/50 p-3 rounded-2xl border border-neutral-800">
                      <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Mã tham gia</p>
                      <p className="text-blue-500 font-bold">{cls.joinCode}</p>
                   </div>
                </div>

                <div className="flex gap-2">
                   <button className="flex-grow py-3 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl transition-all border border-neutral-700">Xem chi tiết</button>
                   <button className="w-12 h-12 bg-neutral-800 hover:bg-rose-500/10 text-neutral-500 hover:text-rose-500 rounded-xl transition-all border border-neutral-700 hover:border-rose-500/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">delete</span>
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
