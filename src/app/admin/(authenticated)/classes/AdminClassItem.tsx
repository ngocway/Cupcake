"use client"

import React, { useState } from "react"
import { adminToggleBlockClass } from "@/actions/admin-classes"

export function AdminClassItem({ cls }: { cls: any }) {
  const [localIsBlocked, setLocalIsBlocked] = useState(cls.isBlocked || false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const handleToggleBlock = async () => {
    setIsToggling(true)
    try {
      await adminToggleBlockClass(cls.id, !localIsBlocked)
      setLocalIsBlocked(!localIsBlocked)
      setShowConfirm(false)
    } catch (e) {
      alert("Lỗi cập nhật trạng thái chặn!")
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden hover:border-neutral-700 transition-all group">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <span className="material-symbols-outlined text-blue-500">school</span>
          </div>
          <span className="px-3 py-1 bg-neutral-800 text-neutral-400 text-[10px] font-bold rounded-lg border border-neutral-700">
            ID: {cls.classCode}
          </span>
        </div>
        
        <h3 className="text-white font-bold text-lg mb-1 group-hover:text-blue-500 transition-colors flex items-center gap-2">
          {cls.name}
          {localIsBlocked && (
            <span className="material-symbols-outlined text-rose-500 text-base" title="Lớp bị chặn">block</span>
          )}
        </h3>
        <p className="text-neutral-500 text-sm mb-4">Giảng viên: <span className="text-neutral-300 font-medium">{cls.teacher.name || cls.teacher.email}</span></p>

        <div className="grid grid-cols-2 gap-3 mb-6">
           <div className="bg-neutral-800/50 p-3 rounded-2xl border border-neutral-800">
              <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Học sinh</p>
              <p className="text-white font-bold">{cls._count?.enrollments || 0}</p>
           </div>
           <div className="bg-neutral-800/50 p-3 rounded-2xl border border-neutral-800">
              <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Mã tham gia</p>
              <p className="text-blue-500 font-bold">{cls.joinCode}</p>
           </div>
        </div>

        <div className="flex gap-2">
           <button className="flex-grow py-3 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl transition-all border border-neutral-700">Xem chi tiết</button>
           
           {showConfirm ? (
             <div className={`flex items-center gap-2 border rounded-xl px-2 py-1 animate-in slide-in-from-right-4 duration-200 ${localIsBlocked ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
               <span className={`text-xs font-bold whitespace-nowrap ml-2 ${localIsBlocked ? 'text-emerald-500' : 'text-rose-500'}`}>{localIsBlocked ? 'Bỏ chặn?' : 'Chặn?'}</span>
               <button 
                 onClick={() => setShowConfirm(false)}
                 disabled={isToggling}
                 className="px-2 py-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-300 transition-colors"
               >
                 Hủy
               </button>
               <button 
                 onClick={handleToggleBlock}
                 disabled={isToggling}
                 className={`px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1 ${localIsBlocked ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}
               >
                 {isToggling ? (
                   <div className="size-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                 ) : (localIsBlocked ? 'Bỏ chặn' : 'Chặn')}
               </button>
             </div>
           ) : (
             <button 
               onClick={() => setShowConfirm(true)}
               className={`w-12 h-12 bg-neutral-800 flex items-center justify-center transition-all border border-neutral-700 rounded-xl ${localIsBlocked ? 'hover:border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10' : 'hover:border-rose-500/20 text-neutral-500 hover:bg-rose-500/10 hover:text-rose-500'}`}
             >
               <span className="material-symbols-outlined text-xl">{localIsBlocked ? 'lock_open' : 'block'}</span>
             </button>
           )}
        </div>
      </div>
    </div>
  )
}
