"use client"

import { useState } from "react"
import { ADMIN_PERMISSIONS } from "@/lib/permissions-config"
import { createAdminRole, deleteAdminRole } from "@/actions/admin-roles"

export default function RolesClient({ roles }: { roles: any[] }) {
  const [showForm, setShowForm] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])
  const [isPending, setIsPending] = useState(false)

  const togglePermission = (id: string) => {
    setSelectedPerms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleCreate = async () => {
    if (!newRoleName) return alert("Vui lòng nhập tên vai trò")
    if (selectedPerms.length === 0) return alert("Vui lòng chọn ít nhất một quyền")

    setIsPending(true)
    const res = await createAdminRole(newRoleName, selectedPerms)
    if (res.success) {
      setNewRoleName("")
      setSelectedPerms([])
      setShowForm(false)
    } else {
      alert(res.error)
    }
    setIsPending(false)
  }

  // Group permissions by category
  const categories = Array.from(new Set(ADMIN_PERMISSIONS.map(p => p.category)))

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Phân quyền Admin</h1>
          <p className="text-neutral-400">Tạo các vai trò quản trị định sẵn bằng cách chọn chức năng.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <span className="material-symbols-outlined">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Hủy bỏ' : 'Tạo Vai trò mới'}
        </button>
      </div>

      {showForm && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 animate-in fade-in slide-in-from-top-4 duration-300">
           <div className="max-w-4xl space-y-8">
              <div>
                 <label className="block text-sm font-bold text-neutral-300 mb-3 ml-1">Tên vai trò</label>
                 <input 
                   type="text" 
                   value={newRoleName}
                   onChange={(e) => setNewRoleName(e.target.value)}
                   placeholder="VD: Kiểm duyệt viên nội dung"
                   className="w-full px-6 py-4 bg-neutral-800 border border-neutral-700 rounded-2xl outline-none focus:border-blue-500 text-white transition-all font-medium"
                 />
              </div>

              <div>
                 <label className="block text-sm font-bold text-neutral-300 mb-6 ml-1">Chọn chức năng (Permissions)</label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {categories.map(cat => (
                      <div key={cat} className="space-y-4">
                         <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest px-1">{cat}</h3>
                         <div className="space-y-2">
                            {ADMIN_PERMISSIONS.filter(p => p.category === cat).map(perm => (
                              <label key={perm.id} className="flex items-center gap-3 p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-2xl cursor-pointer hover:bg-neutral-800 transition-colors">
                                 <input 
                                   type="checkbox"
                                   checked={selectedPerms.includes(perm.id)}
                                   onChange={() => togglePermission(perm.id)}
                                   className="w-5 h-5 rounded border-neutral-600 text-blue-600 focus:ring-blue-500 bg-neutral-700"
                                 />
                                 <span className="text-sm font-bold text-neutral-200">{perm.label}</span>
                              </label>
                            ))}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="pt-4">
                 <button 
                   onClick={handleCreate}
                   disabled={isPending}
                   className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50"
                 >
                    {isPending ? "Đang lưu..." : "Lưu Vai trò"}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Roles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => {
          const permsCount = JSON.parse(role.permissions).length
          return (
            <div key={role.id} className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl hover:border-neutral-700 transition-all flex flex-col justify-between">
               <div>
                  <div className="flex justify-between items-start mb-4">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <span className="material-symbols-outlined text-indigo-500">shield_person</span>
                     </div>
                     <button 
                       onClick={() => deleteAdminRole(role.id)}
                       className="text-neutral-600 hover:text-rose-500 transition-colors"
                     >
                        <span className="material-symbols-outlined text-xl">delete</span>
                     </button>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{role.name}</h3>
                  <p className="text-neutral-500 text-sm mb-6">Đã gán {permsCount} chức năng quản trị.</p>
               </div>
               <div className="flex flex-wrap gap-2">
                  {JSON.parse(role.permissions).slice(0, 3).map((pId: string) => {
                    const p = ADMIN_PERMISSIONS.find(ap => ap.id === pId)
                    return (
                      <span key={pId} className="px-2 py-1 bg-neutral-800 text-neutral-400 text-[9px] font-bold rounded-lg border border-neutral-700 uppercase">
                        {p?.label}
                      </span>
                    )
                  })}
                  {permsCount > 3 && <span className="text-[9px] text-neutral-600 font-bold self-center">+{permsCount - 3} khác</span>}
               </div>
            </div>
          )
        })}
        {roles.length === 0 && !showForm && (
           <div className="col-span-full py-20 bg-neutral-900 border border-dotted border-neutral-800 rounded-3xl text-center">
              <span className="material-symbols-outlined text-neutral-700 text-6xl mb-4">admin_panel_settings</span>
              <p className="text-neutral-500 font-medium">Chưa có vai trò tùy chỉnh nào. Hãy tạo một vai trò mới.</p>
           </div>
        )}
      </div>
    </div>
  )
}
