import React from "react"
import { UserKpiData } from "./kpis"

interface AdminUsersActivityChartProps {
  trend: UserKpiData["sevenDayTrend"]
  peakHourRange: string
  className?: string | null
}

export function AdminUsersActivityChart({
  trend,
  peakHourRange,
  className,
}: AdminUsersActivityChartProps) {
  const maxVisits = Math.max(...trend.map((t) => t.visits), 10)

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-6">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400 text-lg">insights</span>
            <h2 className="text-base font-bold text-white tracking-tight">
              {className
                ? `Xu hướng truy cập & Làm bài — ${className}`
                : "Xu hướng truy cập & Làm bài (7 ngày qua)"}
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            {className
              ? `Thống kê hoạt động của học sinh thuộc lớp ${className} trong 7 ngày.`
              : "Theo dõi lưu lượng người học và số bài tập được nộp mỗi ngày trên toàn hệ thống."}
          </p>
        </div>

        {/* Peak Hours Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
          <span className="material-symbols-outlined text-sm text-amber-400">schedule</span>
          <span>
            Khung giờ vàng:{" "}
            <span className="text-white font-extrabold">{peakHourRange}</span>
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs font-semibold text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-blue-500" />
          <span>Lượt truy cập</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-emerald-400" />
          <span>Bài tập / Quiz đã nộp</span>
        </div>
      </div>

      {/* Bar Chart Grid */}
      <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-4 border-t border-neutral-800/80 items-end min-h-[160px]">
        {trend.map((item, idx) => {
          const heightPercent = Math.max(12, Math.round((item.visits / maxVisits) * 100))
          const isLatest = idx === trend.length - 1

          return (
            <div
              key={item.date}
              className="flex flex-col items-center gap-2 group cursor-pointer relative"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-neutral-950 border border-neutral-700 px-3 py-1.5 rounded-xl shadow-2xl text-[11px] whitespace-nowrap text-center">
                <p className="font-bold text-white">
                  {item.dayLabel} ({item.date})
                </p>
                <p className="text-blue-400 font-semibold">{item.visits} lượt xem</p>
                <p className="text-emerald-400 font-semibold">{item.submissions} bài nộp</p>
              </div>

              {/* Bar Container */}
              <div className="w-full max-w-[48px] h-32 flex items-end justify-center gap-1.5 p-1 rounded-2xl bg-neutral-850/60 group-hover:bg-neutral-800 transition-all border border-neutral-800/60 group-hover:border-neutral-700">
                {/* Visits bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-3 sm:w-4 rounded-lg transition-all ${
                    isLatest
                      ? "bg-gradient-to-t from-blue-600 to-cyan-400 shadow-md shadow-blue-500/30"
                      : "bg-blue-500/80 group-hover:bg-blue-400"
                  }`}
                />
                {/* Submissions indicator */}
                {item.submissions > 0 && (
                  <div
                    style={{
                      height: `${Math.min(
                        100,
                        Math.max(
                          15,
                          Math.round((item.submissions / Math.max(1, maxVisits / 2)) * 100)
                        )
                      )}%`,
                    }}
                    className="w-1.5 sm:w-2 rounded-lg bg-emerald-400/90 group-hover:bg-emerald-300 transition-all"
                  />
                )}
              </div>

              {/* Day Label */}
              <div className="text-center">
                <p
                  className={`text-xs font-bold ${
                    isLatest ? "text-blue-400" : "text-neutral-300"
                  }`}
                >
                  {item.dayLabel}
                </p>
                <p className="text-[10px] text-neutral-500 font-medium">{item.date}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
