"use client"

import { useState } from "react"
import { createSubAdmin } from "@/actions/admin-users"

export default function AddAdminModal({ roles }: { roles: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    roleId: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.roleId) return alert("Vui lòng chọn vai trò")

    setIsPending(true)
    const res = await createSubAdmin({
      name: formData.name,
      email: formData.email,
      adminRoleId: formData.roleId
    })
    
    if (res.success) {
      setIsOpen(false)
      setFormData({ name: "", email: "", roleId: "" })
    } else {
      alert(res.error)
    }
    setIsPending(false)
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
      >
        <span className="material-symbols-outlined">person_add</span>
        Thêm Sub-Admin
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl relative">
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors"
              >
                 <span className="material-symbols-outlined">close</span>
              </button>

              <h2 className="text-2xl font-black text-white mb-2">Thêm Quản trị viên con</h2>
              <p className="text-neutral-500 text-sm mb-8 font-medium">Cấp quyền truy cập dựa trên các vai trò đã định nghĩa.</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                    <label className="block text-xs font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">Họ và tên</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="VD: Trần Thị B"
                      className="w-full px-5 py-4 bg-neutral-800 border border-neutral-700/50 rounded-2xl outline-none focus:border-blue-500 text-white transition-all font-medium"
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">Email đăng nhập</label>
                    <input 
                      required
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="email@vidu.com"
                      className="w-full px-5 py-4 bg-neutral-800 border border-neutral-700/50 rounded-2xl outline-none focus:border-blue-500 text-white transition-all font-medium"
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">Vai trò (Role)</label>
                    <select 
                      required
                      value={formData.roleId}
                      onChange={(e) => setFormData({...formData, roleId: e.target.value})}
                      className="w-full px-5 py-4 bg-neutral-800 border border-neutral-700/50 rounded-2xl outline-none focus:border-blue-500 text-white transition-all font-medium appearance-none"
                    >
                       <option value="">-- Chọn vai trò --</option>
                       {roles.map(role => (
                         <option key={role.id} value={role.id}>{role.name}</option>
                       ))}
                    </select>
                 </div>

                 <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="flex-grow py-4 bg-neutral-800 text-white font-bold rounded-2xl hover:bg-neutral-700 transition-all border border-neutral-700"
                    >
                       Hủy bỏ
                    </button>
                    <button 
                      type="submit"
                      disabled={isPending}
                      className="flex-grow py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                       {isPending ? "Đang tạo..." : "Xác nhận tạo"}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </>
  )
}
