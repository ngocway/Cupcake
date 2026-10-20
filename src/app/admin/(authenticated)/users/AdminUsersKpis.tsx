import React from "react"
import { UserKpiData } from "./kpis"

interface AdminUsersKpisProps {
  data: UserKpiData
}

export function AdminUsersKpis({ data }: AdminUsersKpisProps) {
  return (
    <div className="space-y-3">
      {data.className && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 text-xs font-bold w-fit">
          <span className="material-symbols-outlined text-sm">school</span>
          <span>
            Đang xem báo cáo riêng cho lớp:{" "}
            <span className="text-white font-extrabold">{data.className}</span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Active Hôm nay */}
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl relative overflow-hidden group hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Active Hôm nay (DAU)
            </span>
            <div className="size-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">bolt</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{data.dau}</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              Đang hoạt động
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2 font-medium">
            Trên tổng số <span className="text-neutral-300 font-bold">{data.mau}</span> người dùng trong 30 ngày (MAU)
          </p>
        </div>

        {/* 2. Tài khoản mới 7 ngày */}
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl relative overflow-hidden group hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              {data.className ? "Thành viên mới (7 ngày)" : "Đăng ký mới (7 ngày)"}
            </span>
            <div className="size-9 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">person_add</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">+{data.newUsers7d}</span>
            <span className="text-xs font-semibold text-blue-400">tài khoản</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-2 font-medium">
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-[10px]">
              {data.newTeachers7d} Giáo viên
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
              {data.newStudents7d} Học sinh
            </span>
          </div>
        </div>

        {/* 3. Tỷ lệ giữ chân / Quay lại */}
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl relative overflow-hidden group hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Tỷ lệ giữ chân (Retention)
            </span>
            <div className="size-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">published_with_changes</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{data.retentionRate}%</span>
            <span className="text-xs font-semibold text-indigo-400">quay lại</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2 font-medium">
            Tỷ lệ học sinh học <span className="text-neutral-300 font-bold">≥ 2 ngày</span> trong tháng
          </p>
        </div>

        {/* 4. Học sinh chăm chỉ (Streakers) */}
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl relative overflow-hidden group hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Học chăm chỉ (Streak)
            </span>
            <div className="size-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">local_fire_department</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400">🔥 {data.streakersCount}</span>
            <span className="text-xs font-semibold text-neutral-400">học sinh</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2 font-medium">
            Duy trì vào học đều <span className="text-neutral-300 font-bold">≥ 3 ngày</span> trong tháng
          </p>
        </div>
      </div>
    </div>
  )
}
