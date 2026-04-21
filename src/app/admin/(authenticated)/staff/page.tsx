import prisma from "@/lib/prisma"
import AddAdminModal from "./AddAdminModal"
import { ImpersonateButtons } from "./ImpersonateButtons"

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams

  const [staff, adminRoles] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: 'ADMIN',
        ...(q && {
          OR: [
            { email: { contains: q } },
            { name: { contains: q } },
          ],
        }),
      },
      include: { adminRole: { select: { name: true, permissions: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.adminRole.findMany({ select: { id: true, name: true } })
  ])

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Nhân sự Admin</h1>
          <p className="text-neutral-400">Quản lý đội ngũ quản trị cấp dưới và phân bổ quyền hạn.</p>
        </div>
        <AddAdminModal roles={adminRoles} />
      </div>

      {/* Filters */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
         <form className="relative flex-grow w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">search</span>
            <input 
              name="q"
              type="text" 
              defaultValue={q}
              placeholder="Tìm nhân sự theo tên hoặc email..." 
              className="w-full pl-12 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl outline-none focus:border-blue-500 text-white transition-all font-medium"
            />
         </form>
         <button className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-2xl transition-all border border-neutral-700">Tìm kiếm</button>
      </div>

      {/* Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-800/50">
              <th className="p-4 text-xs font-black text-neutral-500 uppercase tracking-widest pl-8">Nhân sự</th>
              <th className="p-4 text-xs font-black text-neutral-500 uppercase tracking-widest">Loại Admin</th>
              <th className="p-4 text-xs font-black text-neutral-500 uppercase tracking-widest">Gói phân quyền</th>
              <th className="p-4 text-xs font-black text-neutral-500 uppercase tracking-widest">Ngày gia nhập</th>
              <th className="p-4 text-xs font-black text-neutral-500 uppercase tracking-widest">Xem như</th>
              <th className="p-4 text-xs font-black text-neutral-500 uppercase tracking-widest pr-8 text-right">Quản trị</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {staff.map((user) => (
              <tr key={user.id} className="hover:bg-neutral-800/30 transition-colors group">
                <td className="p-6 pl-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
                      <span className="material-symbols-outlined text-blue-500">badge</span>
                    </div>
                    <div>
                      <p className="text-white font-black text-base">{user.name || "Admin mới"}</p>
                      <p className="text-neutral-500 text-xs font-bold">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                      <span className="text-xs font-black text-rose-500 uppercase tracking-widest">Administrator</span>
                   </div>
                </td>
                <td className="p-6">
                   <div className="space-y-1">
                      <p className="text-sm text-neutral-200 font-black">
                        {user.adminRole?.name || 'Super Admin'}
                      </p>
                      {user.adminRole?.permissions && (
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-tighter">
                          {JSON.parse(user.adminRole.permissions).length} Quyền hạn được gán
                        </p>
                      )}
                   </div>
                </td>
                <td className="p-6 text-sm text-neutral-400 font-medium">
                  {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="p-6">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImpersonateButtons />
                  </div>
                </td>
                <td className="p-6 pr-8 text-right">
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-10 h-10 rounded-2xl bg-neutral-800 hover:bg-blue-600 text-neutral-500 hover:text-white flex items-center justify-center transition-all border border-neutral-700">
                      <span className="material-symbols-outlined text-sm">history</span>
                    </button>
                    <button className="w-10 h-10 rounded-2xl bg-neutral-800 hover:bg-rose-500/10 text-neutral-500 hover:text-rose-500 flex items-center justify-center transition-all border border-neutral-700">
                      <span className="material-symbols-outlined text-sm">person_off</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={6} className="p-20 text-center">
                   <span className="material-symbols-outlined text-neutral-700 text-6xl mb-4">no_accounts</span>
                   <p className="text-neutral-500 font-bold">Không tìm thấy nhân sự nào.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
