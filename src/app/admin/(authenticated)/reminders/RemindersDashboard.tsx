"use client"

import React, { useState } from "react"
import { toast } from "sonner"
import {
  ReminderStats,
  InactiveStudentItem,
  ReminderSettings,
  ReminderRunReport,
} from "@/lib/reminders/inactive-students"
import { InactiveTeacherItem, TeacherReminderRunReport } from "@/lib/reminders/inactive-teachers"

interface ClassItem {
  id: string
  name: string
  classCode: string
}

interface HistoryItem {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  title: string
  message: string
  link: string | null
  classId: string
  className: string
  createdAt: string
  isRead: boolean
}

interface RemindersDashboardProps {
  initialStats: ReminderStats
  initialRoster: InactiveStudentItem[]
  initialTeacherRoster: InactiveTeacherItem[]
  initialHistory: HistoryItem[]
  initialSettings: ReminderSettings
  classes: ClassItem[]
}

export function RemindersDashboard({
  initialStats,
  initialRoster,
  initialTeacherRoster,
  initialHistory,
  initialSettings,
  classes,
}: RemindersDashboardProps) {
  const [activeTab, setActiveTab] = useState<"roster" | "teachers" | "history" | "preview" | "settings">("roster")
  const [stats, setStats] = useState<ReminderStats>(initialStats)
  const [roster, setRoster] = useState<InactiveStudentItem[]>(initialRoster)
  const [teacherRoster, setTeacherRoster] = useState<InactiveTeacherItem[]>(initialTeacherRoster)
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory)
  const [settings, setSettings] = useState<ReminderSettings>(initialSettings)
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<"all" | "ready" | "cooldown">("all")

  // Loading states
  const [isScanning, setIsScanning] = useState(false)
  const [isScanningTeachers, setIsScanningTeachers] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isSendingSingle, setIsSendingSingle] = useState<string | null>(null)
  const [isSendingTeacherSingle, setIsSendingTeacherSingle] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Modals
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean
    isDryRun: boolean
    title: string
    report: ReminderRunReport | TeacherReminderRunReport | null
    type: "student" | "teacher"
  }>({
    isOpen: false,
    isDryRun: false,
    title: "",
    report: null,
    type: "student",
  })

  const [testEmailModal, setTestEmailModal] = useState({
    isOpen: false,
    role: "student" as "student" | "teacher",
    email: "ngocnguyenluong89@gmail.com",
    name: "Minh Khôi",
    teacherName: "Thầy Ngọc",
    className: "45 Ngày Từ Vựng Cơ Bản",
    isSending: false,
  })

  const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; item: HistoryItem | null }>({
    isOpen: false,
    item: null,
  })

  // Preview tab interactive state
  const [previewRole, setPreviewRole] = useState<"student" | "teacher">("student")
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop")
  const [previewName, setPreviewName] = useState("Minh Khôi")
  const [previewTeacherName, setPreviewTeacherName] = useState("Thầy Ngọc")
  const [previewClass, setPreviewClass] = useState("45 Ngày Từ Vựng Cơ Bản")
  const [previewDays, setPreviewDays] = useState(3)
  const [previewTeacherDays, setPreviewTeacherDays] = useState(7)

  // Fetch updated data from API
  async function refreshData() {
    setIsRefreshing(true)
    try {
      const url = selectedClassId
        ? `/api/admin/reminders?classId=${encodeURIComponent(selectedClassId)}`
        : `/api/admin/reminders`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
        setRoster(data.roster)
        setTeacherRoster(data.teacherRoster)
        setHistory(data.history)
        setSettings(data.settings)
        toast.success("Đã làm mới dữ liệu thành công")
      } else {
        toast.error(data.error || "Không thể tải dữ liệu mới")
      }
    } catch (err: any) {
      toast.error("Lỗi kết nối khi tải dữ liệu")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Trigger Student Scan & Send or Dry-Run
  async function handleScanStudents(dryRun = false) {
    setIsScanning(true)
    try {
      const res = await fetch("/api/admin/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "scan",
          classId: selectedClassId || undefined,
          dryRun,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setReportModal({
          isOpen: true,
          isDryRun: dryRun,
          title: dryRun ? "Báo Cáo Chạy Thử Học Sinh (Dry-Run)" : "Báo Cáo Quét & Gửi Email Học Sinh",
          report: data.report,
          type: "student",
        })
        if (!dryRun) {
          toast.success(`Đã gửi thành công ${data.report.remindersSent} email nhắc nhở học sinh!`)
          refreshData()
        } else {
          toast.info(`Chạy thử hoàn tất: Có ${data.report.remindersSent} học sinh đủ điều kiện nhận email.`)
        }
      } else {
        toast.error(data.error || "Quá trình quét thất bại")
      }
    } catch (e: any) {
      toast.error("Lỗi khi kết nối đến máy chủ")
    } finally {
      setIsScanning(false)
    }
  }

  // Trigger Teacher Scan & Send or Dry-Run
  async function handleScanTeachers(dryRun = false) {
    setIsScanningTeachers(true)
    try {
      const res = await fetch("/api/admin/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "scan_teachers",
          dryRun,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setReportModal({
          isOpen: true,
          isDryRun: dryRun,
          title: dryRun ? "Báo Cáo Chạy Thử Giáo Viên (Dry-Run)" : "Báo Cáo Quét & Gửi Email Giáo Viên",
          report: data.report,
          type: "teacher",
        })
        if (!dryRun) {
          toast.success(`Đã gửi thành công ${data.report.remindersSent} email nhắc tạo game cho giáo viên!`)
          refreshData()
        } else {
          toast.info(`Chạy thử hoàn tất: Có ${data.report.remindersSent} giáo viên đủ điều kiện nhận email.`)
        }
      } else {
        toast.error(data.error || "Quá trình quét giáo viên thất bại")
      }
    } catch (e: any) {
      toast.error("Lỗi khi kết nối đến máy chủ")
    } finally {
      setIsScanningTeachers(false)
    }
  }

  // Send single student reminder
  async function handleSendSingle(studentId: string, classId: string, studentName: string) {
    setIsSendingSingle(studentId)
    try {
      const res = await fetch("/api/admin/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_single",
          studentId,
          classId,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Đã gửi email nhắc nhở thành công cho ${studentName}!`)
        refreshData()
      } else {
        toast.error(data.error || "Gửi email thất bại")
      }
    } catch (e) {
      toast.error("Lỗi khi gửi email")
    } finally {
      setIsSendingSingle(null)
    }
  }

  // Send single teacher reminder
  async function handleSendTeacherSingle(teacherId: string, teacherName: string) {
    setIsSendingTeacherSingle(teacherId)
    try {
      const res = await fetch("/api/admin/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_teacher_single",
          teacherId,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Đã gửi email nhắc tạo game thành công cho ${teacherName}!`)
        refreshData()
      } else {
        toast.error(data.error || "Gửi email thất bại")
      }
    } catch (e) {
      toast.error("Lỗi khi gửi email cho giáo viên")
    } finally {
      setIsSendingTeacherSingle(null)
    }
  }

  // Send Test Email
  async function handleSendTestEmail() {
    if (!testEmailModal.email || !testEmailModal.email.includes("@")) {
      toast.error("Vui lòng nhập địa chỉ email hợp lệ")
      return
    }

    setTestEmailModal((prev) => ({ ...prev, isSending: true }))
    try {
      const isTeacher = testEmailModal.role === "teacher"
      const res = await fetch("/api/admin/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isTeacher
            ? {
                action: "send_teacher_test",
                testEmail: testEmailModal.email,
                teacherName: testEmailModal.teacherName,
              }
            : {
                action: "send_test",
                testEmail: testEmailModal.email,
                studentName: testEmailModal.name,
                className: testEmailModal.className,
              }
        ),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Đã gửi email kiểm tra (${isTeacher ? "Mẫu Giáo Viên" : "Mẫu Học Sinh"}) tới ${testEmailModal.email}!`)
        setTestEmailModal((prev) => ({ ...prev, isOpen: false }))
      } else {
        toast.error(data.error || "Gửi email kiểm tra thất bại")
      }
    } catch (e) {
      toast.error("Lỗi kết nối khi gửi email kiểm tra")
    } finally {
      setTestEmailModal((prev) => ({ ...prev, isSending: false }))
    }
  }

  // Save Settings
  async function handleSaveSettings() {
    setIsSavingSettings(true)
    try {
      const res = await fetch("/api/admin/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_settings",
          settings,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSettings(data.settings)
        toast.success("Đã lưu cấu hình nhắc nhở thành công!")
      } else {
        toast.error(data.error || "Không thể lưu cấu hình")
      }
    } catch (e) {
      toast.error("Lỗi khi lưu cấu hình")
    } finally {
      setIsSavingSettings(false)
    }
  }

  // Filtered Roster
  const filteredRoster = roster.filter((item) => {
    if (selectedClassId && item.classId !== selectedClassId) return false
    if (statusFilter === "ready" && !item.canSendNow) return false
    if (statusFilter === "cooldown" && item.canSendNow) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchName = item.studentName.toLowerCase().includes(q)
      const matchEmail = item.studentEmail.toLowerCase().includes(q)
      const matchClass = item.className.toLowerCase().includes(q)
      if (!matchName && !matchEmail && !matchClass) return false
    }
    return true
  })

  // Filtered Teachers
  const filteredTeachers = teacherRoster.filter((item) => {
    if (statusFilter === "ready" && !item.canSendNow) return false
    if (statusFilter === "cooldown" && item.canSendNow) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchName = item.teacherName.toLowerCase().includes(q)
      const matchEmail = item.teacherEmail.toLowerCase().includes(q)
      if (!matchName && !matchEmail) return false
    }
    return true
  })

  // Filtered History
  const filteredHistory = history.filter((item) => {
    if (selectedClassId && item.classId !== selectedClassId) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchName = item.studentName.toLowerCase().includes(q)
      const matchEmail = item.studentEmail.toLowerCase().includes(q)
      const matchClass = item.className.toLowerCase().includes(q)
      if (!matchName && !matchEmail && !matchClass) return false
    }
    return true
  })

  const quotaPercent = Math.min(100, Math.round((stats.monthlySentCount / stats.monthlyQuota) * 100))

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600/20 text-blue-500 border border-blue-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.2)]">
              <span className="material-symbols-outlined text-2xl">mail</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Quản lý Email & Nhắc nhở Tự động
              </h1>
              <p className="text-sm text-neutral-400">
                Nhắc nhở học sinh vào lớp và kích hoạt giáo viên tạo game qua Resend & Vercel Cron.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => refreshData()}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors text-sm font-semibold disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-lg ${isRefreshing ? "animate-spin" : ""}`}>
              sync
            </span>
            Làm mới
          </button>

          <button
            onClick={() => setTestEmailModal((prev) => ({ ...prev, isOpen: true }))}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 transition-all text-sm font-semibold"
          >
            <span className="material-symbols-outlined text-lg text-amber-400">mark_email_read</span>
            Gửi Thử Nghiệm
          </button>

          {/* Teacher Scan Button */}
          <button
            onClick={() => handleScanTeachers(false)}
            disabled={isScanningTeachers}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 transition-all text-sm font-bold disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg text-purple-400">
              {isScanningTeachers ? "progress_activity" : "sports_esports"}
            </span>
            {isScanningTeachers ? "Đang gửi GV..." : "Quét & Nhắc GV Tạo Game"}
          </button>

          {/* Student Scan Button */}
          <button
            onClick={() => handleScanStudents(false)}
            disabled={isScanning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all text-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">
              {isScanning ? "progress_activity" : "rocket_launch"}
            </span>
            {isScanning ? "Đang gửi HS..." : "Quét & Gửi Học Sinh"}
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Email tháng này</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">outgoing_mail</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.monthlySentCount}</span>
            <span className="text-xs text-neutral-400">/ {stats.monthlyQuota.toLocaleString()} free</span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                quotaPercent > 80 ? "bg-amber-500" : "bg-blue-500"
              }`}
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-400 mt-2">Hạn mức Resend còn {stats.monthlyQuota - stats.monthlySentCount} emails</p>
        </div>

        {/* Metric 2: Inactive Students */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Học sinh vắng (&ge;3 ngày)</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">person_off</span>
            </div>
          </div>
          <div className="text-3xl font-black text-red-400">{stats.totalInactiveStudents}</div>
          <p className="text-[11px] text-neutral-400 mt-3">{stats.readyToSendCount} bé sẵn sàng nhận thư nhắc hôm nay</p>
        </div>

        {/* Metric 3: Inactive Teachers */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Giáo viên vắng (&ge;7 ngày)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">sports_esports</span>
            </div>
          </div>
          <div className="text-3xl font-black text-purple-400">{teacherRoster.length}</div>
          <p className="text-[11px] text-neutral-400 mt-3">
            {teacherRoster.filter((t) => t.canSendNow).length} Thầy/Cô chưa tạo game trong 7 ngày
          </p>
        </div>

        {/* Metric 4: Cron */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Lịch Vercel Cron</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">schedule</span>
            </div>
          </div>
          <div className="text-xl font-black text-amber-300">18:30 Hàng ngày</div>
          <div className="mt-2.5 flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                settings.autoSendEnabled ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"
              }`}
            />
            <span className="text-[11px] font-semibold text-neutral-300">
              {settings.autoSendEnabled ? "Tự động gửi HS & GV: BẬT" : "Tự động đang TẮT"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-neutral-800 flex items-center gap-8 text-sm font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab("roster")}
          className={`pb-4 flex items-center gap-2 transition-all relative shrink-0 ${
            activeTab === "roster" ? "text-blue-500" : "text-neutral-400 hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-lg">group</span>
          Học Sinh Vắng Mặt ({roster.length})
          {activeTab === "roster" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("teachers")}
          className={`pb-4 flex items-center gap-2 transition-all relative shrink-0 ${
            activeTab === "teachers" ? "text-purple-400" : "text-neutral-400 hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-lg">sports_esports</span>
          Giáo Viên & Tạo Game ({teacherRoster.length})
          {activeTab === "teachers" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`pb-4 flex items-center gap-2 transition-all relative shrink-0 ${
            activeTab === "history" ? "text-blue-500" : "text-neutral-400 hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-lg">history</span>
          Lịch Sử Gửi Email ({history.length})
          {activeTab === "history" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("preview")}
          className={`pb-4 flex items-center gap-2 transition-all relative shrink-0 ${
            activeTab === "preview" ? "text-blue-500" : "text-neutral-400 hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-lg">preview</span>
          Xem Trước Mẫu Thư
          {activeTab === "preview" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`pb-4 flex items-center gap-2 transition-all relative shrink-0 ${
            activeTab === "settings" ? "text-blue-500" : "text-neutral-400 hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-lg">tune</span>
          Cấu Hình Quy Tắc
          {activeTab === "settings" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
          )}
        </button>
      </div>

      {/* TAB 1: ROSTER (STUDENTS) */}
      {activeTab === "roster" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">Tất cả lớp học ({classes.length})</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.classCode})
                  </option>
                ))}
              </select>

              <div className="flex rounded-xl bg-neutral-900 p-1 border border-neutral-800">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    statusFilter === "all" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setStatusFilter("ready")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    statusFilter === "ready" ? "bg-emerald-500/20 text-emerald-300" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Sẵn sàng gửi
                </button>
                <button
                  onClick={() => setStatusFilter("cooldown")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    statusFilter === "cooldown" ? "bg-amber-500/20 text-amber-300" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Đang Cooldown
                </button>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-neutral-500 text-lg">search</span>
              <input
                type="text"
                placeholder="Tìm tên, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead className="bg-neutral-900/80 text-xs uppercase text-neutral-400 font-bold border-b border-neutral-800">
                  <tr>
                    <th className="py-3.5 px-4">Học Sinh</th>
                    <th className="py-3.5 px-4">Lớp Học</th>
                    <th className="py-3.5 px-4">Thời Gian Vắng</th>
                    <th className="py-3.5 px-4">Hoạt Động Gần Nhất</th>
                    <th className="py-3.5 px-4">Trạng Thái Nhắc</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredRoster.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-neutral-500">
                        Tuyệt vời! Hiện tại không có học sinh nào vắng mặt cần nhắc nhở.
                      </td>
                    </tr>
                  ) : (
                    filteredRoster.map((item) => (
                      <tr key={`${item.studentId}:${item.classId}`} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{item.studentName}</div>
                          <div className="text-xs text-neutral-500">{item.studentEmail}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-neutral-200">{item.className}</div>
                          <div className="text-xs text-neutral-500 font-mono">{item.classCode}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            {item.inactiveDays} ngày
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {item.lastActivityAt ? (
                            <div>
                              <div className="text-xs text-neutral-300 font-medium">
                                {new Date(item.lastActivityAt).toLocaleDateString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </div>
                              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
                                {item.lastActivityType === "submission" ? "Nộp bài tập" : "Xem lớp học"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-500 italic">Chưa tương tác</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {item.canSendNow ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Sẵn sàng gửi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Chờ Cooldown ({item.cooldownDaysLeft} ngày)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleSendSingle(item.studentId, item.classId, item.studentName)}
                            disabled={isSendingSingle === item.studentId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 text-xs font-bold transition-all disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {isSendingSingle === item.studentId ? "progress_activity" : "send"}
                            </span>
                            {isSendingSingle === item.studentId ? "Đang gửi..." : "Gửi ngay"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEACHERS & GAME CREATION */}
      {activeTab === "teachers" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-neutral-400">
                Toàn bộ giáo viên chưa tạo game mới hoặc chưa truy cập hệ thống trong 7 ngày qua.
              </span>
            </div>

            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-neutral-500 text-lg">search</span>
              <input
                type="text"
                placeholder="Tìm tên giáo viên, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead className="bg-neutral-900/80 text-xs uppercase text-neutral-400 font-bold border-b border-neutral-800">
                  <tr>
                    <th className="py-3.5 px-4">Giáo Viên</th>
                    <th className="py-3.5 px-4">Số Lớp</th>
                    <th className="py-3.5 px-4">Game Đã Tạo</th>
                    <th className="py-3.5 px-4">Game Gần Nhất</th>
                    <th className="py-3.5 px-4">Vắng Mặt</th>
                    <th className="py-3.5 px-4">Trạng Thái Nhắc</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-500">
                        Tuyệt vời! Tất cả các Thầy/Cô đều đang tích cực hoạt động và tạo game cho học sinh!
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((teacher) => (
                      <tr key={teacher.teacherId} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{teacher.teacherName}</div>
                          <div className="text-xs text-neutral-500">{teacher.teacherEmail}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-300">{teacher.classesCount} lớp</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {teacher.gamesCount} game
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {teacher.lastGameName ? (
                            <div>
                              <div className="text-xs text-neutral-200 font-medium truncate max-w-xs">
                                {teacher.lastGameName}
                              </div>
                              <span className="text-[10px] text-neutral-500">
                                {new Date(teacher.lastGameCreatedAt!).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-amber-400/80 italic">Chưa tạo game nào</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            {teacher.inactiveDays} ngày
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {teacher.canSendNow ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Sẵn sàng gửi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Chờ Cooldown ({teacher.cooldownDaysLeft} ngày)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleSendTeacherSingle(teacher.teacherId, teacher.teacherName)}
                            disabled={isSendingTeacherSingle === teacher.teacherId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/15 hover:bg-purple-600/30 text-purple-300 hover:text-purple-200 border border-purple-500/30 text-xs font-bold transition-all disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {isSendingTeacherSingle === teacher.teacherId ? "progress_activity" : "send"}
                            </span>
                            {isSendingTeacherSingle === teacher.teacherId ? "Đang gửi..." : "Nhắc tạo game"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-neutral-400">
              Hiển thị tối đa 60 thông báo & email nhắc nhở được gửi gần đây nhất.
            </p>
            <div className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-neutral-500 text-lg">search</span>
              <input
                type="text"
                placeholder="Tìm email, học sinh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead className="bg-neutral-900/80 text-xs uppercase text-neutral-400 font-bold border-b border-neutral-800">
                  <tr>
                    <th className="py-3.5 px-4">Thời Gian Gửi</th>
                    <th className="py-3.5 px-4">Người Nhận</th>
                    <th className="py-3.5 px-4">Lớp Học</th>
                    <th className="py-3.5 px-4">Tiêu Đề Email</th>
                    <th className="py-3.5 px-4">Trạng Thái</th>
                    <th className="py-3.5 px-4 text-right">Xem Bản Sao</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-neutral-500">
                        Chưa có email nhắc nhở nào được lưu lại trong lịch sử.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs text-neutral-400">
                          {new Date(item.createdAt).toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{item.studentName}</div>
                          <div className="text-xs text-neutral-500">{item.studentEmail}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-neutral-200">{item.className}</td>
                        <td className="py-3.5 px-4 text-xs text-neutral-300 max-w-xs truncate">{item.title}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Đã gửi
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setPreviewModal({ isOpen: true, item })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            Xem thư
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE PREVIEW */}
      {activeTab === "preview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-5 h-fit backdrop-blur-sm">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-400">edit_note</span>
              Tùy Chỉnh Thử Nghiệm
            </h3>

            {/* Template Selector */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-2 uppercase tracking-wider">
                Chọn mẫu email muốn xem:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPreviewRole("student")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                    previewRole === "student"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                      : "bg-neutral-950 text-neutral-400 hover:text-white"
                  }`}
                >
                  👦 Mẫu Học Sinh
                </button>
                <button
                  onClick={() => setPreviewRole("teacher")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                    previewRole === "teacher"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                      : "bg-neutral-950 text-neutral-400 hover:text-white"
                  }`}
                >
                  🎮 Mẫu Giáo Viên
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-neutral-800">
              {previewRole === "student" ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
                      Tên bé mẫu
                    </label>
                    <input
                      type="text"
                      value={previewName}
                      onChange={(e) => setPreviewName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
                      Tên lớp học
                    </label>
                    <input
                      type="text"
                      value={previewClass}
                      onChange={(e) => setPreviewClass(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
                      Số ngày vắng mặt
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={previewDays}
                      onChange={(e) => setPreviewDays(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
                      Tên giáo viên mẫu
                    </label>
                    <input
                      type="text"
                      value={previewTeacherName}
                      onChange={(e) => setPreviewTeacherName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
                      Số ngày chưa tạo game
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={previewTeacherDays}
                      onChange={(e) => setPreviewTeacherDays(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-neutral-800">
                <label className="block text-xs font-bold text-neutral-300 mb-2 uppercase tracking-wider">
                  Thiết bị mô phỏng
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPreviewDevice("desktop")}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                      previewDevice === "desktop"
                        ? "bg-neutral-800 text-white border border-neutral-700"
                        : "bg-neutral-950 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">desktop_windows</span>
                    Máy tính
                  </button>
                  <button
                    onClick={() => setPreviewDevice("mobile")}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                      previewDevice === "mobile"
                        ? "bg-neutral-800 text-white border border-neutral-700"
                        : "bg-neutral-950 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">smartphone</span>
                    Điện thoại
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Container Column */}
          <div className="lg:col-span-2 flex flex-col items-center justify-start bg-neutral-950 p-4 md:p-6 rounded-2xl border border-neutral-800">
            <div
              className={`w-full transition-all duration-300 bg-[#f1f5f9] rounded-2xl p-4 sm:p-6 shadow-2xl ${
                previewDevice === "mobile" ? "max-w-sm" : "max-w-xl"
              }`}
            >
              {previewRole === "student" ? (
                /* STUDENT EMAIL PREVIEW */
                <div className="bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-xl text-slate-800">
                  <div className="bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-600 p-8 text-center text-white">
                    <div className="inline-flex w-16 h-16 bg-white rounded-2xl items-center justify-center text-3xl shadow-lg shadow-black/15 mb-3">
                      🧁
                    </div>
                    <br />
                    <div className="inline-block px-3 py-1 bg-white/20 border border-white/30 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-2">
                      DOLCAKE LEARNING
                    </div>
                    <h2 className="text-xl font-black leading-snug">
                      Bé ơi, lớp học "{previewClass}" đang đợi bé nè! ✨
                    </h2>
                  </div>

                  <div className="p-6 md:p-8 space-y-5 text-sm leading-relaxed">
                    <p className="font-bold text-slate-900 text-base">
                      Chào ba mẹ và bé <span className="text-sky-600 text-lg">{previewName}</span>,
                    </p>

                    <p className="text-slate-600">
                      Đã{" "}
                      <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-md font-bold">
                        {previewDays} ngày
                      </span>{" "}
                      rồi hệ thống Dolcake chưa thấy bé ghé thăm lớp học{" "}
                      <strong className="text-sky-600">{previewClass}</strong>. Thầy cô và các bạn đang rất nhớ bé đó!
                    </p>

                    <div className="bg-gradient-to-b from-green-50 to-emerald-50 border-1.5 border-green-300 rounded-2xl p-5 space-y-3">
                      <p className="font-bold text-green-900 text-sm leading-snug">
                        🌱 Học tiếng Anh giống như tưới nước cho một mầm cây nhỏ, chỉ cần bé dành{" "}
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-extrabold">
                          5 - 10 phút mỗi ngày
                        </span>
                        :
                      </p>

                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-lg shrink-0">
                            🃏
                          </div>
                          <div className="text-xs text-slate-700">
                            <strong className="text-sky-900">Lật các thẻ Flashcard</strong> từ vựng sinh động có âm thanh chuẩn bản xứ.
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-lg shrink-0">
                            🎮
                          </div>
                          <div className="text-xs text-slate-700">
                            <strong className="text-purple-900">Vượt qua các câu đố game vui nhộn</strong> của bài học.
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-lg shrink-0">
                            🔥
                          </div>
                          <div className="text-xs text-slate-700">
                            <strong className="text-orange-900">Tích lũy sao</strong> và giữ vững chuỗi học tập cùng cả lớp.
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-center font-bold text-slate-900 text-sm">
                      Ba mẹ hãy mở máy cho bé vào khám phá bài học ngày hôm nay nhé! 🚀
                    </p>

                    <div className="text-center pt-1">
                      <div className="inline-block w-full max-w-xs py-3.5 px-6 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white font-extrabold text-sm shadow-xl shadow-blue-500/30">
                        🚀 Vào Lớp Học Của Bé Ngay
                      </div>
                    </div>

                    <p className="text-center text-xs text-slate-400 italic pt-1">
                      "{settings.motivationQuote || "Mỗi ngày một chút xíu thôi, bé sẽ tự tin nói tiếng Anh hơn mỗi ngày! 🌟"}"
                    </p>
                  </div>

                  <div className="bg-slate-50 border-t border-slate-100 p-6 text-center text-xs text-slate-500 space-y-1">
                    <div className="font-semibold text-slate-600">Thương mến,</div>
                    <div className="font-extrabold text-sky-600 text-sm">Đội ngũ Dolcake & Thầy cô giáo 🧁</div>
                  </div>
                </div>
              ) : (
                /* TEACHER GAME EMAIL PREVIEW */
                <div className="bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-xl text-slate-800">
                  <div className="bg-gradient-to-br from-purple-700 via-indigo-600 to-blue-600 p-8 text-center text-white">
                    <div className="inline-flex w-16 h-16 bg-white rounded-2xl items-center justify-center text-3xl shadow-lg shadow-black/15 mb-3">
                      🎮
                    </div>
                    <br />
                    <div className="inline-block px-3 py-1 bg-white/20 border border-white/30 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-2">
                      DOLCAKE TEACHER STUDIO
                    </div>
                    <h2 className="text-xl font-black leading-snug">
                      Thầy/Cô ơi, cùng tạo một Mini-Game bất ngờ cho học sinh tuần này nhé! ✨
                    </h2>
                  </div>

                  <div className="p-6 md:p-8 space-y-5 text-sm leading-relaxed">
                    <p className="font-bold text-slate-900 text-base">
                      Kính gửi Thầy/Cô <span className="text-indigo-600 text-lg">{previewTeacherName}</span>, 👋
                    </p>

                    <p className="text-slate-600">
                      Đã{" "}
                      <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-md font-bold">
                        {previewTeacherDays} ngày
                      </span>{" "}
                      rồi hệ thống Dolcake chưa thấy Thầy/Cô ghé qua góc sáng tạo lớp học. Các bạn nhỏ đang rất ngóng chờ một thử thách mới đầy hứng khởi từ Thầy/Cô đó ạ!
                    </p>

                    <div className="bg-gradient-to-b from-purple-50 to-indigo-50 border-1.5 border-purple-200 rounded-2xl p-5 space-y-3">
                      <p className="font-bold text-indigo-950 text-sm leading-snug">
                        💡 Thầy/Cô có biết: Học sinh hào hứng và ghi nhớ từ vựng lâu gấp{" "}
                        <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-extrabold">
                          3 lần
                        </span>{" "}
                        khi được chơi mini-game tương tác?
                      </p>
                      <p className="text-xs text-indigo-700 font-semibold">
                        Chỉ mất <strong className="text-indigo-950">3 - 5 phút</strong>, Thầy/Cô có thể tạo ngay 4 tựa game hấp dẫn cho lớp:
                      </p>

                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center text-lg shrink-0">
                            🍬
                          </div>
                          <div className="text-xs text-slate-700">
                            <strong className="text-pink-700">Candy Quiz:</strong> Trả lời trắc nghiệm nhận kẹo ngọt, hiệu ứng rực rỡ, học sinh mê tít.
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-lg shrink-0">
                            🥚
                          </div>
                          <div className="text-xs text-slate-700">
                            <strong className="text-amber-800">Đập Trứng Bí Mật (Choice Egg):</strong> Khám phá bí mật sau mỗi quả trứng.
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-lg shrink-0">
                            🗺️
                          </div>
                          <div className="text-xs text-slate-700">
                            <strong className="text-emerald-700">Truy Tìm Kho Báu (Treasure Hunt):</strong> Vượt chướng ngại vật cùng cả lớp.
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-lg shrink-0">
                            🎯
                          </div>
                          <div className="text-xs text-slate-700">
                            <strong className="text-blue-700">Bắn Bóng Từ Vựng (Shooter Quiz):</strong> Rèn luyện phản xạ và từ vựng cực vui.
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-center font-bold text-slate-900 text-sm">
                      Thầy/Cô hãy thử tạo ngay một mini-game vui vẻ cho bài học tuần này nhé! 🚀
                    </p>

                    <div className="text-center pt-1">
                      <div className="inline-block w-full max-w-xs py-3.5 px-6 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-sm shadow-xl shadow-purple-500/30">
                        🎮 Vào Tạo Mini-Game Ngay (Chỉ 3 Phút)
                      </div>
                    </div>

                    <p className="text-center text-xs text-slate-400 italic pt-1">
                      "Mỗi tiết học có mini-game là một ngày vui đến lớp của các con! 🌟"
                    </p>
                  </div>

                  <div className="bg-slate-50 border-t border-slate-100 p-6 text-center text-xs text-slate-500 space-y-1">
                    <div className="font-semibold text-slate-600">Trân trọng,</div>
                    <div className="font-extrabold text-purple-600 text-sm">Đội ngũ Sáng tạo & Hỗ trợ Giáo viên Dolcake 🧁</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SETTINGS */}
      {activeTab === "settings" && (
        <div className="max-w-2xl mx-auto bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-6">
          <div className="border-b border-neutral-800 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">settings</span>
              Cấu Hình Quy Tắc Nhắc Nhở
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Các thiết lập này áp dụng cho toàn bộ các lần quét tự động và quét thủ công (Học sinh & Giáo viên).
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-950 border border-neutral-800">
              <div>
                <div className="font-bold text-white text-sm">Chế độ tự động gửi hàng ngày (18:30)</div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  Bật để Vercel Cron tự động quét và gửi email nhắc nhở học sinh & giáo viên.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoSendEnabled}
                  onChange={(e) => setSettings({ ...settings, autoSendEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
                Số ngày vắng mặt để kích hoạt học sinh (Mặc định: 3 ngày)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={settings.inactiveDaysThreshold}
                  onChange={(e) =>
                    setSettings({ ...settings, inactiveDaysThreshold: Math.max(1, Number(e.target.value)) })
                  }
                  className="w-28 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold text-center focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-neutral-400">
                  Học sinh chưa có lượt xem lớp học hoặc bài nộp trong số ngày này sẽ được chọn.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
                Thời gian giãn cách Cooldown chống spam (Mặc định: 7 - 10 ngày)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.cooldownDays}
                  onChange={(e) => setSettings({ ...settings, cooldownDays: Math.max(1, Number(e.target.value)) })}
                  className="w-28 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold text-center focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-neutral-400">
                  Tối đa 1 email gửi cho mỗi học sinh hoặc giáo viên trong khoảng thời gian này.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
                Tên hiển thị người gửi
              </label>
              <input
                type="text"
                value={settings.senderName || "Dolcake"}
                onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-neutral-500 mt-1">Sẽ hiển thị trong hòm thư là: Dolcake &lt;onboarding@resend.dev&gt;</p>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50 text-sm"
              >
                <span className="material-symbols-outlined text-base">
                  {isSavingSettings ? "progress_activity" : "save"}
                </span>
                {isSavingSettings ? "Đang lưu..." : "Lưu Thay Đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT MODAL (DRY-RUN & SCAN) */}
      {reportModal.isOpen && reportModal.report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    reportModal.isDryRun ? "bg-sky-500/20 text-sky-400" : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {reportModal.isDryRun ? "visibility" : "check_circle"}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{reportModal.title}</h3>
                  <p className="text-xs text-neutral-400 font-mono">
                    {new Date(reportModal.report.timestamp).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReportModal({ isOpen: false, isDryRun: false, title: "", report: null, type: "student" })}
                className="text-neutral-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                <div className="text-neutral-500">Đã kiểm tra</div>
                <div className="text-base font-black text-white">
                  {(reportModal.report as any).totalEnrollmentsChecked ?? (reportModal.report as any).totalTeachersChecked}
                </div>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                <div className="text-emerald-400 font-bold">{reportModal.isDryRun ? "Sẽ gửi" : "Đã gửi"}</div>
                <div className="text-base font-black text-emerald-400">{reportModal.report.remindersSent}</div>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                <div className="text-neutral-400">Bỏ qua Cooldown</div>
                <div className="text-base font-black text-neutral-300">{reportModal.report.skippedCooldown}</div>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                <div className="text-neutral-400">Đang hoạt động</div>
                <div className="text-base font-black text-neutral-300">{reportModal.report.skippedActive}</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-60 pr-1">
              {reportModal.report.sentDetails.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-xs">
                  Không có đối tượng nào cần gửi email nhắc nhở trong lượt quét này.
                </div>
              ) : (
                reportModal.report.sentDetails.map((detail: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{detail.studentName || detail.teacherName}</div>
                      <div className="text-neutral-500">
                        {detail.studentEmail || detail.teacherEmail}
                        {detail.className ? ` • Lớp ${detail.className}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-red-400 font-bold">Vắng {detail.inactiveDays} ngày</span>
                      <div className="text-[11px] text-emerald-400">{detail.emailStatus}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setReportModal({ isOpen: false, isDryRun: false, title: "", report: null, type: "student" })}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEND TEST MODAL */}
      {testEmailModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">mark_email_read</span>
                <h3 className="font-bold text-white text-base">Gửi Email Thử Nghiệm</h3>
              </div>
              <button
                onClick={() => setTestEmailModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-neutral-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Role switch in test modal */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTestEmailModal({ ...testEmailModal, role: "student" })}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                  testEmailModal.role === "student"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-neutral-950 text-neutral-400 hover:text-white"
                }`}
              >
                👦 Thử Mẫu Học Sinh
              </button>
              <button
                onClick={() => setTestEmailModal({ ...testEmailModal, role: "teacher" })}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                  testEmailModal.role === "teacher"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                    : "bg-neutral-950 text-neutral-400 hover:text-white"
                }`}
              >
                🎮 Thử Mẫu Giáo Viên
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Email nhận thư test *</label>
                <input
                  type="email"
                  value={testEmailModal.email}
                  onChange={(e) => setTestEmailModal({ ...testEmailModal, email: e.target.value })}
                  placeholder="admin@example.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {testEmailModal.role === "student" ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">Tên bé giả lập</label>
                    <input
                      type="text"
                      value={testEmailModal.name}
                      onChange={(e) => setTestEmailModal({ ...testEmailModal, name: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">Tên lớp học giả lập</label>
                    <input
                      type="text"
                      value={testEmailModal.className}
                      onChange={(e) => setTestEmailModal({ ...testEmailModal, className: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Tên giáo viên giả lập</label>
                  <input
                    type="text"
                    value={testEmailModal.teacherName}
                    onChange={(e) => setTestEmailModal({ ...testEmailModal, teacherName: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
              <button
                onClick={() => setTestEmailModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                onClick={handleSendTestEmail}
                disabled={testEmailModal.isSending}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/30 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">
                  {testEmailModal.isSending ? "progress_activity" : "send"}
                </span>
                {testEmailModal.isSending ? "Đang gửi..." : "Gửi Email Ngay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW EMAIL MODAL FROM HISTORY */}
      {previewModal.isOpen && previewModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">{previewModal.item.title}</h3>
                <p className="text-xs text-neutral-400">
                  Gửi tới: <strong className="text-blue-400">{previewModal.item.studentName}</strong> ({previewModal.item.studentEmail})
                </p>
              </div>
              <button
                onClick={() => setPreviewModal({ isOpen: false, item: null })}
                className="text-neutral-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-xs space-y-2">
              <div className="text-neutral-400">
                <strong>Lớp học:</strong> {previewModal.item.className}
              </div>
              <div className="text-neutral-400">
                <strong>Thời gian gửi:</strong> {new Date(previewModal.item.createdAt).toLocaleString("vi-VN")}
              </div>
              <div className="text-neutral-300 font-medium pt-2 border-t border-neutral-800/80">
                "{previewModal.item.message}"
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPreviewModal({ isOpen: false, item: null })}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
