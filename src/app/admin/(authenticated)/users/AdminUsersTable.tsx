"use client"

import React, { useState } from "react"
import { EnhancedAdminUser } from "./types"
import { AdminUserItem } from "./AdminUserItem"
import { AdminUserDrawer } from "./AdminUserDrawer"

interface AdminUsersTableProps {
  users: EnhancedAdminUser[]
}

export function AdminUsersTable({ users }: AdminUsersTableProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  return (
    <>
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-neutral-800/50 border-b border-neutral-800">
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest pl-8">
                  Người dùng
                </th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest">
                  Vai trò
                </th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest">
                  Tần suất quay lại (30d)
                </th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest">
                  7 ngày qua
                </th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest">
                  Hoạt động cuối
                </th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest">
                  Ngày tham gia
                </th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest pr-8 text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center text-neutral-500">
                      <span className="material-symbols-outlined text-5xl mb-3 text-neutral-600">
                        person_off
                      </span>
                      <p className="text-base font-bold text-neutral-300">
                        Không tìm thấy người dùng phù hợp
                      </p>
                      <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                        Thử điều chỉnh từ khóa tìm kiếm hoặc chọn lại bộ lọc.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <AdminUserItem
                    key={user.id}
                    user={user}
                    onViewDetail={(id) => setSelectedUserId(id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Profile Drawer */}
      <AdminUserDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </>
  )
}
