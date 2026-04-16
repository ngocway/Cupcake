"use client"

import React, { useState } from "react"
import { adminToggleBlockUser } from "@/actions/admin-users"

export function AdminUserItem({ user }: { user: any }) {
  const [localIsBlocked, setLocalIsBlocked] = useState(user.isBlocked || false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const handleToggleBlock = async () => {
    setIsToggling(true)
    try {
      await adminToggleBlockUser(user.id, !localIsBlocked)
      setLocalIsBlocked(!localIsBlocked)
      setShowConfirm(false)
    } catch (e) {
      alert("Lỗi cập nhật trạng thái chặn!")
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <tr className="hover:bg-neutral-800/30 transition-colors group">
      <td className="p-5 pl-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center border border-neutral-700">
            <span className="material-symbols-outlined text-neutral-500">person</span>
          </div>
          <div>
            <p className="text-white font-black text-sm flex items-center gap-2">
              {user.name || "Không tên"}
              {localIsBlocked && (
                <span className="material-symbols-outlined text-rose-500 text-sm" title="Tài khoản bị chặn">block</span>
              )}
            </p>
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
        <div className={`flex items-center justify-end gap-2 transition-opacity ${showConfirm ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-500 hover:text-white flex items-center justify-center transition-all border border-neutral-700">
            <span className="material-symbols-outlined text-sm">settings</span>
          </button>
          
          {showConfirm ? (
            <div className={`flex items-center gap-2 border rounded-xl px-2 py-1 ${localIsBlocked ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
              <span className={`text-xs font-bold whitespace-nowrap ml-2 ${localIsBlocked ? 'text-emerald-500' : 'text-rose-500'}`}>{localIsBlocked ? 'Bỏ chặn?' : 'Chặn?'}</span>
              <button 
                onClick={() => setShowConfirm(false)}
                disabled={isToggling}
                className="px-3 py-1 text-xs font-bold text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleToggleBlock}
                disabled={isToggling}
                className={`px-3 py-1 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1 ${localIsBlocked ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}
              >
                {isToggling ? (
                  <div className="size-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (localIsBlocked ? 'Bỏ chặn' : 'Chặn')}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowConfirm(true)}
              className={`w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center transition-all border border-neutral-700 ${localIsBlocked ? 'hover:bg-emerald-500/10 text-emerald-500 hover:text-emerald-400' : 'hover:bg-rose-500/10 text-neutral-500 hover:text-rose-500'}`}
            >
              <span className="material-symbols-outlined text-sm">{localIsBlocked ? 'lock_open' : 'block'}</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
