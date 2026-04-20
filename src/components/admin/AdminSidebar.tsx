"use client"

import Link from "use-client"
import LinkNext from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

interface AdminSidebarProps {
  userName: string | null | undefined
}

export default function AdminSidebar({ userName }: AdminSidebarProps) {
  const pathname = usePathname()

  const navGroups = [
    {
      label: "Core Management",
      items: [
        { href: "/admin/dashboard", icon: "dashboard", label: "Tổng quan" },
        { href: "/admin/users", icon: "group", label: "Người dùng" },
        { href: "/admin/materials", icon: "auto_stories", label: "Học liệu" },
        { href: "/admin/classes", icon: "school", label: "Lớp học" },
      ]
    },
    {
      label: "Administration",
      items: [
        { href: "/admin/staff", icon: "badge", label: "Nhân sự Admin" },
        { href: "/admin/roles", icon: "admin_panel_settings", label: "Phân quyền Role" },
      ]
    },
    {
      label: "Operations",
      items: [
        { href: "/admin/verifications", icon: "verified_user", label: "Xác minh" },
        { href: "/admin/reviews", icon: "rate_review", label: "Duyệt đánh giá" },
        { href: "/admin/moderation", icon: "report", label: "Kiểm duyệt" },
        { href: "/admin/analytics", icon: "monitoring", label: "Phân tích sâu" },
      ]
    },
    {
      label: "Preferences",
      items: [
        { href: "/admin/settings", icon: "settings", label: "Cấu hình hệ thống" },
      ]
    }
  ]

  return (
    <aside className="w-72 bg-neutral-950 border-r border-neutral-800 flex flex-col sticky top-0 h-screen">
      <div className="p-8 border-b border-neutral-800">
        <LinkNext href="/admin/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <span className="material-symbols-outlined text-white">castle</span>
          </div>
          <span className="font-display font-black text-xl tracking-tighter text-white">CUPCAKES</span>
        </LinkNext>
      </div>

      <nav className="flex-grow p-6 space-y-8 overflow-y-auto custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4">
              {group.label}
            </p>
            <div className="space-y-2">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname?.startsWith(item.href))
                return (
                  <LinkNext 
                    key={item.href}
                    href={item.href} 
                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                      isActive 
                        ? "bg-blue-600/10 text-blue-500 border border-blue-600/20" 
                        : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-xl ${isActive ? "text-blue-500" : "text-neutral-500 group-hover:text-blue-500"} transition-colors`}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-bold">{item.label}</span>
                  </LinkNext>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-6 border-t border-neutral-800">
        <div className="flex items-center gap-3 p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-500">face</span>
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-sm font-bold text-white truncate">{userName}</p>
            <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-tighter">Super Admin</p>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="text-neutral-500 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10"
            title="Đăng xuất"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
