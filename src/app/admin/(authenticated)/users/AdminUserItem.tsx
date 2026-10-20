"use client"

import React, { useState } from "react"
import { adminToggleBlockUser } from "@/actions/admin-users"
import { EnhancedAdminUser } from "./types"

interface AdminUserItemProps {
  user: EnhancedAdminUser
  onViewDetail: (userId: string) => void
}

export function AdminUserItem({ user, onViewDetail }: AdminUserItemProps) {
  const [localIsBlocked, setLocalIsBlocked] = useState(user.isBlocked || false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const handleToggleBlock = async () => {
    setIsToggling(true)
    try {
      await adminToggleBlockUser(user.id, !localIsBlocked)
      setLocalIsBlocked(!localIsBlocked)
      setShowConfirm(false)
    } catch {
      alert("Lỗi cập nhật trạng thái chặn!")
    } finally {
      setIsToggling(false)
    }
  }

  // Frequency badge styling
  const getFrequencyBadge = () => {
    switch (user.frequencyTag) {
      case "DAILY":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            ● Hàng ngày
          </span>
        )
      case "WEEKLY":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
            ● Thỉnh thoảng
          </span>
        )
      case "AT_RISK":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
            ● Nguy cơ rời bỏ
          </span>
        )
      case "NEW":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 whitespace-nowrap">
            ● Mới tham gia
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700/60 whitespace-nowrap">
            ○ Không hoạt động
          </span>
        )
    }
  }

  // Format last active text
  const formatLastActive = (date: Date | null) => {
    if (!date) return { text: "Chưa có", isOnline: false }
    const now = Date.now()
    const diffMin = Math.round((now - new Date(date).getTime()) / 60000)

    if (diffMin < 10) return { text: "Vừa online", isOnline: true }
    if (diffMin < 60) return { text: `${diffMin} phút trước`, isOnline: true }
    if (diffMin < 24 * 60) {
      const hours = Math.round(diffMin / 60)
      return { text: `${hours} giờ trước`, isOnline: false }
    }
    const days = Math.round(diffMin / (24 * 60))
    if (days === 1) return { text: "Hôm qua", isOnline: false }
    return { text: `${days} ngày trước`, isOnline: false }
  }

  const lastActive = formatLastActive(user.lastActiveAt)

  return (
    <tr className="hover:bg-neutral-800/30 transition-colors group">
      {/* 1. User Info */}
      <td className="p-4 pl-8">
        <div className="flex items-center gap-3.5">
          <div className="relative size-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-white shrink-0">
            {user.name ? user.name[0].toUpperCase() : "U"}
            {lastActive.isOnline && (
              <span className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-500 border-2 border-neutral-900" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white font-black text-sm flex items-center gap-1.5 truncate max-w-[200px]">
              {user.name || "Không tên"}
              {localIsBlocked && (
                <span className="material-symbols-outlined text-rose-500 text-sm" title="Tài khoản bị chặn">
                  block
                </span>
              )}
            </p>
            <p className="text-neutral-500 text-xs font-medium truncate max-w-[220px]">{user.email}</p>
          </div>
        </div>
      </td>

      {/* 2. Role */}
      <td className="p-4">
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            user.role === "TEACHER"
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          }`}
        >
          {user.role}
        </span>
      </td>

      {/* 3. Return Frequency */}
      <td className="p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">
              {user.activeDays30}/30 ngày
            </span>
            {user.streak >= 2 && (
              <span className="text-[11px] font-black text-amber-400" title={`Chuỗi học ${user.streak} ngày liên tiếp`}>
                🔥 {user.streak}d
              </span>
            )}
          </div>
          {getFrequencyBadge()}
        </div>
      </td>

      {/* 4. Mini 7-Day Activity Dots */}
      <td className="p-4">
        <div className="flex items-center gap-1">
          {user.recent7Days.map((d, i) => (
            <div
              key={i}
              className={`size-3 rounded-full transition-transform hover:scale-125 cursor-pointer ${
                d.active
                  ? "bg-emerald-400 shadow-sm shadow-emerald-500/40"
                  : "bg-neutral-800 border border-neutral-700/60"
              }`}
              title={`${d.dayLabel} (${d.dateStr}): ${d.active ? "Đã vào học" : "Không vào"}`}
            />
          ))}
        </div>
      </td>

      {/* 5. Last Active */}
      <td className="p-4">
        <div className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
          <span
            className={`size-2 rounded-full shrink-0 ${
              lastActive.isOnline ? "bg-emerald-400 animate-pulse" : "bg-neutral-600"
            }`}
          />
          <span>{lastActive.text}</span>
        </div>
      </td>

      {/* 6. Joined Date */}
      <td className="p-4 text-xs text-neutral-500 font-medium">
        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
      </td>

      {/* 7. Actions */}
      <td className="p-4 pr-8 text-right">
        <div className="flex items-center justify-end gap-2">
          {/* Detail Drawer Button */}
          <button
            onClick={() => onViewDetail(user.id)}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 hover:text-white border border-neutral-700/80 transition-all flex items-center gap-1 cursor-pointer"
            title="Xem chi tiết lịch sử học & timeline"
          >
            <span className="material-symbols-outlined text-sm">visibility</span>
            <span className="hidden md:inline">Chi tiết</span>
          </button>

          {/* Block / Unblock Button */}
          {showConfirm ? (
            <div
              className={`flex items-center gap-1.5 border rounded-xl px-2 py-1 ${
                localIsBlocked
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-rose-500/10 border-rose-500/20"
              }`}
            >
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isToggling}
                className="px-2 py-1 text-xs font-bold text-neutral-400 hover:text-white cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleToggleBlock}
                disabled={isToggling}
                className={`px-2.5 py-1 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  localIsBlocked
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-rose-500 hover:bg-rose-600"
                }`}
              >
                {isToggling ? (
                  <div className="size-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : localIsBlocked ? (
                  "Mở"
                ) : (
                  "Khóa"
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className={`size-8 rounded-xl bg-neutral-800 flex items-center justify-center transition-all border border-neutral-700 cursor-pointer ${
                localIsBlocked
                  ? "hover:bg-emerald-500/10 text-emerald-500 hover:text-emerald-400"
                  : "hover:bg-rose-500/10 text-neutral-500 hover:text-rose-500"
              }`}
              title={localIsBlocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
            >
              <span className="material-symbols-outlined text-sm">
                {localIsBlocked ? "lock_open" : "block"}
              </span>
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
