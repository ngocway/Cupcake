import prisma from "@/lib/prisma"

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>
}) {
  const { role, q } = await searchParams

  const users = await prisma.user.findMany({
    where: {
      role: { in: ['TEACHER', 'STUDENT'] },
      ...(role && { role: role as any }),
      ...(q && {
        OR: [
          { email: { contains: q } },
          { name: { contains: q } },
        ],
      }),
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Quản lý người dùng</h1>
          <p className="text-neutral-400">Xem và quản lý tài khoản Giáo viên và Học sinh.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
         <form className="relative flex-grow w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">search</span>
            <input 
              name="q"
              type="text" 
              defaultValue={q}
              placeholder="Tìm theo tên hoặc email..." 
              className="w-full pl-12 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl outline-none focus:border-blue-500 text-white transition-all font-medium"
            />
         </form>
         <div className="flex gap-4 w-full md:w-auto">
            <select className="bg-neutral-800 border border-neutral-700 rounded-2xl px-4 py-3 outline-none text-white focus:border-blue-500 w-full md:w-48 font-bold text-sm">
               <option value="">Tất cả vai trò</option>
               <option value="TEACHER">Giáo viên</option>
               <option value="STUDENT">Học sinh</option>
            </select>
         </div>
      </div>

      {/* Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-800/50">
              <th className="p-4 text-xs font-black text-neutral-500 uppercase tracking-widest pl-8">Thông tin người dùng</th>
              <th className="p-4 text-xs font-black text-neutral-500 uppercase tracking-widest">Loại tài khoản</th>
              <th className="p-4 text-xs font-black text-neutral-500 uppercase tracking-widest">Ngày tham gia</th>
              <th className="p-4 text-xs font-black text-neutral-500 uppercase tracking-widest pr-8 text-right">Quản lý</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-neutral-800/30 transition-colors group">
                <td className="p-5 pl-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center border border-neutral-700">
                      <span className="material-symbols-outlined text-neutral-500">person</span>
                    </div>
                    <div>
                      <p className="text-white font-black text-sm">{user.name || "Không tên"}</p>
                      <p className="text-neutral-500 text-xs font-medium">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    user.role === 'TEACHER' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                    'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-5 text-sm text-neutral-500 font-medium">
                  {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="p-5 pr-8 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-500 hover:text-white flex items-center justify-center transition-all border border-neutral-700">
                      <span className="material-symbols-outlined text-sm">settings</span>
                    </button>
                    <button className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-rose-500/10 text-neutral-500 hover:text-rose-500 flex items-center justify-center transition-all border border-neutral-700">
                      <span className="material-symbols-outlined text-sm">block</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
