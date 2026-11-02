"use client"

import React, { useEffect, useState, useMemo, useCallback } from "react"
import {
  adminGetClassBehaviorAnalyticsAction,
  type ClassBehaviorEventItem,
} from "@/actions/admin-classes"
import type { AdminStudentItem } from "./AdminStudentsTab"

interface AdminClassAnalyticsTabProps {
  classId: string
  students: AdminStudentItem[]
  selectedStudentId?: string | null
  onSelectStudentId?: (studentId: string | null) => void
}

type AnalyticsData = Awaited<
  ReturnType<typeof adminGetClassBehaviorAnalyticsAction>
>

export function AdminClassAnalyticsTab({
  classId,
  students,
  selectedStudentId = null,
  onSelectStudentId,
}: AdminClassAnalyticsTabProps) {
  const [rangeDays, setRangeDays] = useState<number>(30)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | "island" | "station" | "game" | "locked" | "submission"
  >("all")
  const [studentFilter, setStudentFilter] = useState<string>(
    selectedStudentId || "ALL"
  )

  useEffect(() => {
    if (selectedStudentId) {
      setStudentFilter(selectedStudentId)
    }
  }, [selectedStudentId])

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminGetClassBehaviorAnalyticsAction(classId, rangeDays)
      setData(res)
    } catch (err) {
      console.error("Failed to load class behavior analytics:", err)
    } finally {
      setLoading(false)
    }
  }, [classId, rangeDays])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const filteredEvents = useMemo(() => {
    if (!data) return []
    return data.recentEvents.filter((ev) => {
      if (categoryFilter !== "all" && ev.category !== categoryFilter) {
        return false
      }
      if (studentFilter !== "ALL" && ev.userId !== studentFilter) {
        return false
      }
      return true
    })
  }, [data, categoryFilter, studentFilter])

  const totalStationInteractions = useMemo(() => {
    if (!data) return 1
    const sum = data.stationsSummary.reduce(
      (acc, s) => acc + s.clicks + s.completions,
      0
    )
    return Math.max(sum, 1)
  }, [data])

  const totalGameInteractions = useMemo(() => {
    if (!data) return 1
    const sum = data.gamesSummary.reduce(
      (acc, g) => acc + g.clicks + g.completions,
      0
    )
    return Math.max(sum, 1)
  }, [data])

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-3xl bg-neutral-900 border border-neutral-800"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-3xl bg-neutral-900 border border-neutral-800" />
          <div className="h-80 rounded-3xl bg-neutral-900 border border-neutral-800" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-12 text-center rounded-3xl bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-bold">
        Không thể tải dữ liệu phân tích hành vi lớp học.
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Controls Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400 text-xl">
              monitoring
            </span>
            Phân tích chuyên sâu Hành vi Học sinh (Đảo • 3 Trạm • 4 Games)
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Theo dõi lượt bấm xem thử các đảo, tỷ lệ chọn 3 trạm học và mức độ yêu thích của 4 trò chơi phản xạ.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setRangeDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  rangeDays === d
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {d} ngày
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold flex items-center gap-1.5 border border-neutral-700 transition-colors cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <span
              className={`material-symbols-outlined text-base ${
                loading ? "animate-spin text-blue-400" : ""
              }`}
            >
              refresh
            </span>
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 1. KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Tương tác Đảo (Map)
            </span>
            <span className="material-symbols-outlined text-blue-400 text-lg">
              explore
            </span>
          </div>
          <p className="text-2xl font-black text-white">
            {data.kpis.totalIslandOpens + data.kpis.totalIslandPreviews}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">
            🚀 Mở học: <strong className="text-white">{data.kpis.totalIslandOpens}</strong> • 👀 Xem trước:{" "}
            <strong className="text-sky-400">{data.kpis.totalIslandPreviews}</strong>
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Bấm chọn 3 Trạm
            </span>
            <span className="material-symbols-outlined text-emerald-400 text-lg">
              flag
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-400">
            {data.kpis.totalStationClicks}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">
            ✅ Đã nộp hoàn thành:{" "}
            <strong className="text-emerald-300">{data.kpis.totalSubmissions}</strong> lượt
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Lượt chọn 4 Game
            </span>
            <span className="material-symbols-outlined text-amber-400 text-lg">
              sports_esports
            </span>
          </div>
          <p className="text-2xl font-black text-amber-400">
            {data.kpis.totalGameSelects}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">
            👤 Học sinh tương tác:{" "}
            <strong className="text-white">{data.kpis.activeStudentsCount}</strong> bé
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
              Tò mò bấm Đảo khóa
            </span>
            <span className="material-symbols-outlined text-rose-400 text-lg">
              lock
            </span>
          </div>
          <p className="text-2xl font-black text-rose-400">
            {data.kpis.totalLockedClicks}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">
            Đo mức độ hào hứng muốn mở bài mới
          </p>
        </div>
      </div>

      {/* 2. Deep-Dive Panels: 3 Stations (Screen 2) & 4 Games (Screen 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: 3 Stations Funnel */}
        <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <span>🎯 Sức hút 3 Trạm Học Tập (Popup Ngày)</span>
              </h4>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                So sánh lượt bấm vào từng trạm và số lần hoàn thành thực tế
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              3 Trạm / Ngày
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {data.stationsSummary.map((st, idx) => {
              const combined = st.clicks + st.completions
              const sharePercent = Math.round(
                (combined / totalStationInteractions) * 100
              )
              const barColors = [
                "from-emerald-500 to-teal-400",
                "from-amber-500 to-orange-400",
                "from-sky-500 to-blue-400",
              ]
              return (
                <div
                  key={st.id}
                  className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/90 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-white">
                      {st.name}
                    </span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-blue-400 font-bold">
                        👆 {st.clicks} lượt bấm
                      </span>
                      <span className="text-emerald-400 font-bold">
                        ✅ {st.completions} hoàn thành
                      </span>
                      <span className="text-neutral-400 font-semibold">
                        ({st.uniqueStudents} bé)
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${
                        barColors[idx % barColors.length]
                      } transition-all duration-500`}
                      style={{ width: `${Math.max(sharePercent, combined > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: 4 Games Ranking */}
        <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <span>🎮 Xếp hạng 4 Game Phản Xạ Yêu Thích</span>
              </h4>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Trò chơi nào được các bé bấm chọn nhiều nhất ở Trạm 2
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
              4 Games
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {data.gamesSummary.map((g, idx) => {
              const combined = g.clicks + g.completions
              const sharePercent = Math.round(
                (combined / totalGameInteractions) * 100
              )
              const barColors = [
                "from-amber-500 to-orange-400",
                "from-pink-500 to-rose-400",
                "from-sky-500 to-blue-400",
                "from-violet-500 to-purple-400",
              ]
              return (
                <div
                  key={g.id}
                  className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800/90 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-amber-300 text-[10px] font-extrabold border border-neutral-700">
                        {g.badge}
                      </span>
                      <span className="text-xs font-extrabold text-white">
                        {g.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-amber-400 font-bold">
                        👆 {g.clicks} chọn
                      </span>
                      <span className="text-emerald-400 font-bold">
                        ✅ {g.completions} xong
                      </span>
                      {g.avgScore !== null && (
                        <span className="text-sky-400 font-bold">
                          ⭐ TB: {g.avgScore}đ
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${
                        barColors[idx % barColors.length]
                      } transition-all duration-500`}
                      style={{ width: `${Math.max(sharePercent, combined > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 3. Island / Day Heatmap (Day 1 -> 15+) */}
      <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-black text-white">
              🏝️ Bản đồ nhiệt Tương tác từng Đảo (Theo Ngày học)
            </h4>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Biết ngay đảo nào được học sinh bấm xem thử nhiều nhất, đảo nào hay bị bấm khi đang khóa
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-neutral-400 flex-wrap">
            <span>🚀 Mở học</span>
            <span>👀 Xem trước (Kéo ra giữa)</span>
            <span>🔒 Bấm lúc đang khóa</span>
            <span>✅ Bài nộp xong</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {data.daysSummary.map((d) => {
            const hasActivity =
              d.opens > 0 ||
              d.previews > 0 ||
              d.lockedClicks > 0 ||
              d.completions > 0
            return (
              <div
                key={d.dayNumber}
                className={`p-3.5 rounded-2xl border transition-colors ${
                  hasActivity
                    ? "bg-neutral-950 border-blue-500/30"
                    : "bg-neutral-950/40 border-neutral-800/70 opacity-75"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-[10px] font-black">
                    Đảo {d.dayNumber}
                  </span>
                  {d.completions > 0 && (
                    <span className="text-[10px] font-bold text-emerald-400">
                      ✅ {d.completions}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-white truncate mb-2.5">
                  {d.title}
                </p>
                <div className="grid grid-cols-3 gap-1 text-center pt-2 border-t border-neutral-800/80 text-[10px]">
                  <div title="Lượt bấm mở đảo">
                    <p className="font-black text-white">{d.opens}</p>
                    <p className="text-neutral-500">🚀 Mở</p>
                  </div>
                  <div title="Lượt bấm kéo đảo từ phía sau ra giữa để xem">
                    <p className="font-black text-sky-400">{d.previews}</p>
                    <p className="text-neutral-500">👀 Xem</p>
                  </div>
                  <div title="Lượt bấm khi đảo đang khóa">
                    <p className="font-black text-rose-400">{d.lockedClicks}</p>
                    <p className="text-neutral-500">🔒 Khóa</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. Live Student Behavior Stream & Student Filter */}
      <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-black text-white">
              ⏱️ Nhật ký Hành vi Học sinh Chi tiết ({filteredEvents.length})
            </h4>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Lịch sử từng cú click chuột vào đảo, trạm học, trò chơi và hoàn thành bài của từng học sinh
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Student Dropdown Filter */}
            <select
              value={studentFilter}
              onChange={(e) => {
                const val = e.target.value
                setStudentFilter(val)
                onSelectStudentId?.(val === "ALL" ? null : val)
              }}
              className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-700 text-xs font-bold text-white outline-none focus:border-blue-500"
            >
              <option value="ALL">👥 Tất cả học sinh ({students.length})</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  👤 {s.name || s.email} {s.pin ? `(PIN: ${s.pin})` : ""}
                </option>
              ))}
            </select>

            {/* Category Filter Pills */}
            {(
              [
                { id: "all", label: "Tất cả" },
                { id: "island", label: "🏝️ Bấm Đảo" },
                { id: "station", label: "🎯 Chọn Trạm" },
                { id: "game", label: "🎮 Chọn Game" },
                { id: "locked", label: "🔒 Đảo khóa" },
                { id: "submission", label: "✅ Hoàn thành" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 text-xs font-medium">
            Chưa có sự kiện nào khớp với bộ lọc hiện tại. Hãy thử bấm vào các Đảo, Trạm hoặc Game bên trang Học sinh rồi nhấn &ldquo;Làm mới&rdquo;!
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80 max-h-[480px] overflow-y-auto pr-1">
            {filteredEvents.map((ev) => {
              const badgeStyles: Record<
                ClassBehaviorEventItem["category"],
                string
              > = {
                island:
                  "bg-blue-500/10 text-blue-400 border-blue-500/20",
                station:
                  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                game: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                locked: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                submission:
                  "bg-purple-500/10 text-purple-400 border-purple-500/20",
              }

              return (
                <div
                  key={ev.id}
                  className="py-3 px-2 hover:bg-neutral-800/30 rounded-xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-extrabold shrink-0 mt-0.5 ${
                        badgeStyles[ev.category]
                      }`}
                    >
                      {ev.dayNumber ? `Ngày ${ev.dayNumber}` : "Lớp học"}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">{ev.label}</p>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5 flex-wrap">
                        <span className="font-semibold text-neutral-300">
                          👤 {ev.studentName}
                        </span>
                        {ev.subLabel && (
                          <>
                            <span>•</span>
                            <span>{ev.subLabel}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {ev.device === "mobile"
                            ? "📱 Điện thoại"
                            : ev.device === "tablet"
                            ? "📟 Máy tính bảng"
                            : "💻 Máy tính"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] text-neutral-500 font-medium whitespace-nowrap">
                    {new Date(ev.createdAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}{" "}
                    • {new Date(ev.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

