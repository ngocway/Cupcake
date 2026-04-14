"use client"

import { signOut } from "next-auth/react"

export default function LogoutButton() {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="text-neutral-500 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10"
      title="Đăng xuất"
    >
      <span className="material-symbols-outlined text-xl">logout</span>
    </button>
  )
}
