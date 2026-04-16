import prisma from "@/lib/prisma"
import { AdminUserItem } from "./AdminUserItem"

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
              <AdminUserItem key={user.id} user={user} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
