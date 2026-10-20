"use client"

import React, { useEffect, useState } from "react"
import { adminGetUserDetail, adminToggleBlockUser, adminUpdateUserRole } from "@/actions/admin-users"

interface AdminUserDrawerProps {
  userId: string | null
  onClose: () => void
}

export function AdminUserDrawer({ userId, onClose }: AdminUserDrawerProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"timeline" | "classes" | "submissions">("timeline")
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (!userId) {
      setData(null)
      return
    }

    setLoading(true)
    adminGetUserDetail(userId)
      .then((res) => {
        if (res.success) {
          setData(res.data)
        } else {
          alert(res.error || "Lỗi tải thông tin")
        }
      })
      .finally(() => setLoading(false))
  }, [userId])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  if (!userId) return null

  const handleToggleBlock = async () => {
    if (!data) return
    setIsUpdating(true)
    try {
      await adminToggleBlockUser(data.id, !data.isBlocked)
      setData({ ...data, isBlocked: !data.isBlocked })
    } catch {
      alert("Lỗi cập nhật trạng thái chặn!")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRoleChange = async (newRole: "TEACHER" | "STUDENT") => {
    if (!data || data.role === newRole) return
    setIsUpdating(true)
    try {
      await adminUpdateUserRole(data.id, newRole)
      setData({ ...data, role: newRole })
    } catch {
      alert("Lỗi đổi vai trò!")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-xl h-full bg-neutral-950 border-l border-neutral-800 shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-900/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400">account_circle</span>
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              Hồ sơ & Nhật ký hoạt động
            </span>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Drawer Content */}
        {loading ? (
          <div className="flex-grow p-8 flex flex-col items-center justify-center space-y-4">
            <div className="size-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-neutral-400 font-medium">Đang tải lịch sử hoạt động...</p>
          </div>
        ) : !data ? (
          <div className="flex-grow p-8 flex items-center justify-center text-neutral-500">
            Không tìm thấy dữ liệu.
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* User Profile Card */}
            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/20">
                    {data.name ? data.name[0].toUpperCase() : "U"}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      {data.name || "Chưa có tên"}
                      {data.isBlocked && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30">
                          BỊ CHẶN
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-neutral-400 font-medium">{data.email}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Tham gia: {new Date(data.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>

                {/* Block / Unblock Toggle */}
                <button
                  onClick={handleToggleBlock}
                  disabled={isUpdating}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                    data.isBlocked
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {data.isBlocked ? "lock_open" : "block"}
                  </span>
                  <span>{data.isBlocked ? "Bỏ chặn" : "Khóa"}</span>
                </button>
              </div>

              {/* Role Switcher */}
              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                <span className="text-neutral-400 font-medium">Vai trò hệ thống:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleRoleChange("STUDENT")}
                    disabled={isUpdating || data.role === "STUDENT"}
                    className={`px-3 py-1 rounded-xl font-bold transition-all text-[11px] cursor-pointer ${
                      data.role === "STUDENT"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    Học sinh
                  </button>
                  <button
                    onClick={() => handleRoleChange("TEACHER")}
                    disabled={isUpdating || data.role === "TEACHER"}
                    className={`px-3 py-1 rounded-xl font-bold transition-all text-[11px] cursor-pointer ${
                      data.role === "TEACHER"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    Giáo viên
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-2xl">
                <p className="text-xl font-black text-white">{data.activeDays30 || 0}</p>
                <p className="text-[10px] font-bold text-neutral-500 uppercase mt-0.5">
                  Ngày học (30d)
                </p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-2xl">
                <p className="text-xl font-black text-emerald-400">
                  {data.totalSubmissions || 0}
                </p>
                <p className="text-[10px] font-bold text-neutral-500 uppercase mt-0.5">
                  Bài tập nộp
                </p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-2xl">
                <p className="text-xl font-black text-blue-400">{data.enrollments?.length || 0}</p>
                <p className="text-[10px] font-bold text-neutral-500 uppercase mt-0.5">
                  Lớp tham gia
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-800">
              <button
                onClick={() => setActiveTab("timeline")}
                className={`flex-1 pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
                  activeTab === "timeline"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                Nhật ký xem trang ({data.pageviews?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("classes")}
                className={`flex-1 pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
                  activeTab === "classes"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                Lớp học ({data.enrollments?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("submissions")}
                className={`flex-1 pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
                  activeTab === "submissions"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                Bài nộp gần nhất ({data.submissions?.length || 0})
              </button>
            </div>

            {/* Tab 1: Timeline */}
            {activeTab === "timeline" && (
              <div className="space-y-3">
                {data.pageviews?.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-6">
                    Chưa có nhật ký truy cập được ghi lại.
                  </p>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-800">
                    {data.pageviews.map((pv: any) => (
                      <div key={pv.id} className="relative group">
                        <span className="absolute -left-6 top-1.5 size-2 rounded-full bg-blue-500 ring-4 ring-neutral-950" />
                        <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl group-hover:border-neutral-700 transition-colors">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-mono text-neutral-300 font-semibold truncate max-w-[280px]">
                              {pv.path}
                            </span>
                            <span className="text-neutral-500 font-medium whitespace-nowrap">
                              {new Date(pv.createdAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              • {new Date(pv.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          {pv.userAgent && (
                            <p className="text-[10px] text-neutral-500 truncate">
                              {pv.userAgent.includes("Mobile")
                                ? "📱 Thiết bị Di động"
                                : pv.userAgent.includes("iPad") || pv.userAgent.includes("Tablet")
                                ? "📟 Máy tính bảng (Tablet)"
                                : "💻 Máy tính bàn (Desktop)"}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Classes */}
            {activeTab === "classes" && (
              <div className="space-y-2.5">
                {data.enrollments?.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-6">
                    Chưa tham gia lớp học nào.
                  </p>
                ) : (
                  data.enrollments.map((en: any) => (
                    <div
                      key={en.classId}
                      className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                          <span className="material-symbols-outlined text-base">school</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{en.class?.name}</p>
                          <p className="text-[10px] text-neutral-500 font-mono">
                            Mã: {en.class?.classCode}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-neutral-500">
                        {new Date(en.joinedAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Submissions */}
            {activeTab === "submissions" && (
              <div className="space-y-2.5">
                {data.submissions?.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-6">
                    Chưa có bài tập nào được nộp.
                  </p>
                ) : (
                  data.submissions.map((sub: any) => (
                    <div
                      key={sub.id}
                      className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <span className="material-symbols-outlined text-base">task_alt</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">
                            {sub.assignment?.title || "Bài tập"}
                          </p>
                          <p className="text-[10px] text-neutral-500">
                            {sub.class?.name || "Bài tập tự do"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-400">
                          {sub.score !== null ? `${sub.score}đ` : "Đã nộp"}
                        </span>
                        <p className="text-[10px] text-neutral-500">
                          {sub.submittedAt
                            ? new Date(sub.submittedAt).toLocaleDateString("vi-VN")
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
