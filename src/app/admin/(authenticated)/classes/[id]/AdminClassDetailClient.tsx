"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AdminCurriculumTab, type AdminGroupItem, type AdminAssignmentItem } from "./_components/AdminCurriculumTab"
import { AdminStudentsTab, type AdminStudentItem } from "./_components/AdminStudentsTab"
import { adminUpdateClassSettingsAction } from "@/actions/admin-classes"

export type AdminClassDetails = {
  id: string
  name: string
  classCode: string
  joinCode: string
  isJoinable: boolean
  autoApprove: boolean
  dailyDripUnlock: boolean
  isBlocked: boolean
  teacher: {
    name: string | null
    email: string | null
  }
  groups: AdminGroupItem[]
  ungroupedAssignments: AdminAssignmentItem[]
  students: AdminStudentItem[]
}

interface AdminClassDetailClientProps {
  initialData: AdminClassDetails
}

export function AdminClassDetailClient({ initialData }: AdminClassDetailClientProps) {
  const router = useRouter()
  const [data, setData] = useState<AdminClassDetails>(initialData)
  const [activeTab, setActiveTab] = useState<"curriculum" | "students">("curriculum")
  const [copiedCode, setCopiedCode] = useState(false)
  const [isUpdatingSetting, setIsUpdatingSetting] = useState(false)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(data.joinCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleToggleSetting = async (key: 'dailyDripUnlock' | 'isJoinable' | 'autoApprove', val: boolean) => {
    setIsUpdatingSetting(true)
    try {
      await adminUpdateClassSettingsAction(data.id, { [key]: val })
      setData(prev => ({ ...prev, [key]: val }))
    } catch {
      alert("Lỗi khi cập nhật cài đặt lớp học")
    } finally {
      setIsUpdatingSetting(false)
    }
  }

  const handleRefresh = () => {
    router.refresh()
  }

  const totalAssignments = data.groups.reduce((acc, g) => acc + g.items.length, 0) + data.ungroupedAssignments.length

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation & Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/classes"
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors group"
        >
          <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>
          Quay lại danh sách lớp học
        </Link>

        <span className="px-3 py-1 bg-neutral-900 text-neutral-400 text-[11px] font-bold rounded-xl border border-neutral-800">
          ID: {data.classCode}
        </span>
      </div>

      {/* Hero Class Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-neutral-900 border border-neutral-800 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Class Identity */}
          <div className="flex items-start gap-4">
            <div className="size-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-3xl">school</span>
            </div>

            <div>
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black text-white">{data.name}</h1>
                {data.isBlocked && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">block</span>
                    Lớp bị chặn
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-neutral-400 flex-wrap">
                <span>
                  Giảng viên: <strong className="text-neutral-200">{data.teacher.name || data.teacher.email}</strong>
                </span>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <span>Mã tham gia:</span>
                  <span className="font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                    {data.joinCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    title="Sao chép mã tham gia"
                    className="size-6 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedCode ? "check" : "content_copy"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Settings Toggles */}
          <div className="flex items-center gap-3 flex-wrap bg-neutral-800/40 p-2.5 rounded-2xl border border-neutral-800">
            {/* Daily Drip Unlock Toggle */}
            <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-xl hover:bg-neutral-800/80 transition-colors">
              <input
                type="checkbox"
                checked={data.dailyDripUnlock}
                disabled={isUpdatingSetting}
                onChange={(e) => handleToggleSetting("dailyDripUnlock", e.target.checked)}
                className="size-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
              />
              <span className="text-xs font-bold text-neutral-300">Mở bài theo ngày (Drip)</span>
            </label>

            {/* Auto Approve Toggle */}
            <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-xl hover:bg-neutral-800/80 transition-colors">
              <input
                type="checkbox"
                checked={data.autoApprove}
                disabled={isUpdatingSetting}
                onChange={(e) => handleToggleSetting("autoApprove", e.target.checked)}
                className="size-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
              />
              <span className="text-xs font-bold text-neutral-300">Tự động duyệt học sinh</span>
            </label>

            {/* Joinable Toggle */}
            <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-xl hover:bg-neutral-800/80 transition-colors">
              <input
                type="checkbox"
                checked={data.isJoinable}
                disabled={isUpdatingSetting}
                onChange={(e) => handleToggleSetting("isJoinable", e.target.checked)}
                className="size-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
              />
              <span className="text-xs font-bold text-neutral-300">Cho phép vào lớp</span>
            </label>
          </div>
        </div>

        {/* Counters summary */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-neutral-800/80">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Chặng / Nhóm bài</p>
            <p className="text-xl font-bold text-white mt-0.5">{data.groups.length}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Tổng bài học / Bài tập</p>
            <p className="text-xl font-bold text-blue-400 mt-0.5">{totalAssignments}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Học sinh đăng ký</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{data.students.length}</p>
          </div>
        </div>
      </div>

      {/* Main Tab Selector */}
      <div className="flex items-center gap-2 border-b border-neutral-800">
        <button
          onClick={() => setActiveTab("curriculum")}
          className={`pb-3.5 px-4 text-xs font-bold transition-all relative flex items-center gap-2 ${
            activeTab === "curriculum"
              ? "text-white"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <span className="material-symbols-outlined text-lg text-blue-400">route</span>
          Lộ trình & Chặng bài học ({data.groups.length})
          {activeTab === "curriculum" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full animate-in fade-in" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`pb-3.5 px-4 text-xs font-bold transition-all relative flex items-center gap-2 ${
            activeTab === "students"
              ? "text-white"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <span className="material-symbols-outlined text-lg text-emerald-400">group</span>
          Học sinh & Mã PIN ({data.students.length})
          {activeTab === "students" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full animate-in fade-in" />
          )}
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "curriculum" ? (
        <AdminCurriculumTab
          classId={data.id}
          initialGroups={data.groups}
          ungroupedAssignments={data.ungroupedAssignments}
          onRefresh={handleRefresh}
        />
      ) : (
        <AdminStudentsTab
          classId={data.id}
          initialStudents={data.students}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  )
}
