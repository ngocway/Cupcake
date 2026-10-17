"use client"

import React, { useState } from "react"
import { adminUpdateStudentEnrollmentAction } from "@/actions/admin-classes"

export type AdminStudentItem = {
  id: string
  name: string
  email: string
  status: "ACTIVE" | "BLOCKED" | "PENDING" | "INVITED"
  isManagedAccount: boolean
  pin?: string | null
  notes?: string | null
  joinedAt: string
}

interface AdminStudentsTabProps {
  classId: string
  initialStudents: AdminStudentItem[]
  onRefresh: () => void
}

export function AdminStudentsTab({ classId, initialStudents, onRefresh }: AdminStudentsTabProps) {
  const [students, setStudents] = useState<AdminStudentItem[]>(initialStudents)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleAction = async (studentId: string, action: 'APPROVE' | 'REJECT' | 'BLOCK' | 'UNBLOCK' | 'REMOVE') => {
    setActionLoadingId(studentId)
    try {
      const res = await adminUpdateStudentEnrollmentAction(classId, studentId, action)
      if (res.success) {
        if (action === 'APPROVE') {
          setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: 'ACTIVE' } : s))
          showToast("Đã duyệt học sinh vào lớp!")
        } else if (action === 'BLOCK') {
          setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: 'BLOCKED' } : s))
          showToast("Đã chặn học sinh này!")
        } else if (action === 'UNBLOCK') {
          setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: 'ACTIVE' } : s))
          showToast("Đã bỏ chặn học sinh!")
        } else if (action === 'REJECT' || action === 'REMOVE') {
          setStudents(prev => prev.filter(s => s.id !== studentId))
          showToast("Đã gỡ học sinh khỏi lớp!")
        }
        onRefresh()
      }
    } catch (e: any) {
      alert(e?.message || "Lỗi cập nhật học sinh")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCopyPin = (studentId: string, pin: string) => {
    navigator.clipboard.writeText(pin)
    setCopiedPinId(studentId)
    setTimeout(() => setCopiedPinId(null), 2000)
  }

  const counts = {
    total: students.length,
    active: students.filter(s => s.status === 'ACTIVE').length,
    pending: students.filter(s => s.status === 'PENDING').length,
    blocked: students.filter(s => s.status === 'BLOCKED').length,
    managed: students.filter(s => s.isManagedAccount).length,
  }

  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.pin && s.pin.includes(search))

    if (!matchesSearch) return false
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'MANAGED') return s.isManagedAccount
    return s.status === statusFilter
  })

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-4 text-xs font-bold">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Tổng học viên</p>
          <p className="text-2xl font-black text-white">{counts.total}</p>
        </div>
        <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Đang học (Active)</p>
          <p className="text-2xl font-black text-emerald-400">{counts.active}</p>
        </div>
        <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800">
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Chờ duyệt</p>
          <p className="text-2xl font-black text-amber-400">{counts.pending}</p>
        </div>
        <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800">
          <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">Tài khoản Mầm non (PIN)</p>
          <p className="text-2xl font-black text-purple-400">{counts.managed}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-grow w-full md:max-w-md">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-lg">search</span>
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, email hoặc mã PIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-2xl text-white text-xs outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
          {[
            { id: "ALL", label: `Tất cả (${counts.total})` },
            { id: "ACTIVE", label: `Đang học (${counts.active})` },
            { id: "PENDING", label: `Chờ duyệt (${counts.pending})` },
            { id: "MANAGED", label: `Có mã PIN (${counts.managed})` },
            { id: "BLOCKED", label: `Bị chặn (${counts.blocked})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Student List */}
      <div className="rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-neutral-500">
            <span className="material-symbols-outlined text-4xl text-neutral-600 mb-2">person_search</span>
            <p className="text-xs font-medium">Không tìm thấy học sinh nào phù hợp bộ lọc.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {filteredStudents.map((s) => {
              const isLoading = actionLoadingId === s.id
              const isCopied = copiedPinId === s.id

              return (
                <div key={s.id} className="p-4 hover:bg-neutral-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-3.5">
                    <div className="size-11 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-neutral-300 shrink-0 text-sm">
                      {s.name ? s.name.charAt(0).toUpperCase() : s.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-xs font-bold">{s.name || "Chưa đặt tên"}</span>
                        {s.isManagedAccount ? (
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-extrabold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">child_care</span>
                            Mầm non / Bé
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-400 text-[10px] font-bold border border-neutral-700">
                            Tự do
                          </span>
                        )}
                      </div>
                      <p className="text-neutral-400 text-[11px] mt-0.5">{s.email}</p>
                    </div>
                  </div>

                  {/* Middle: PIN Code if managed */}
                  <div className="flex items-center gap-6">
                    {s.isManagedAccount && s.pin ? (
                      <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl">
                        <span className="text-[10px] text-purple-300 font-bold uppercase">Mã PIN:</span>
                        <code className="text-xs font-mono font-bold text-white tracking-widest">{s.pin}</code>
                        <button
                          onClick={() => handleCopyPin(s.id, s.pin!)}
                          title="Sao chép mã PIN đăng nhập"
                          className="size-6 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {isCopied ? "check" : "content_copy"}
                          </span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-neutral-500">
                        {new Date(s.joinedAt).toLocaleDateString('vi-VN')}
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {s.status === 'ACTIVE' && (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                          Đang học
                        </span>
                      )}
                      {s.status === 'PENDING' && (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold">
                          Chờ duyệt
                        </span>
                      )}
                      {s.status === 'BLOCKED' && (
                        <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-bold">
                          Bị chặn
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {isLoading ? (
                        <div className="size-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          {s.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleAction(s.id, 'APPROVE')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[14px]">check</span>
                                Duyệt
                              </button>
                              <button
                                onClick={() => handleAction(s.id, 'REJECT')}
                                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 text-[11px] font-bold transition-colors"
                              >
                                Từ chối
                              </button>
                            </>
                          )}

                          {s.status === 'ACTIVE' && (
                            <>
                              <button
                                onClick={() => handleAction(s.id, 'BLOCK')}
                                title="Chặn học sinh"
                                className="size-8 rounded-xl bg-neutral-800 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 border border-neutral-700 hover:border-rose-500/30 flex items-center justify-center transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">block</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Bạn có chắc muốn gỡ học sinh ${s.name || s.email} khỏi lớp?`)) {
                                    handleAction(s.id, 'REMOVE')
                                  }
                                }}
                                title="Gỡ khỏi lớp"
                                className="size-8 rounded-xl bg-neutral-800 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 border border-neutral-700 hover:border-rose-500/30 flex items-center justify-center transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">person_remove</span>
                              </button>
                            </>
                          )}

                          {s.status === 'BLOCKED' && (
                            <button
                              onClick={() => handleAction(s.id, 'UNBLOCK')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white text-[11px] font-bold transition-all"
                            >
                              Bỏ chặn
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
