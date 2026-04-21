'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ImpersonateButtons() {
  const router = useRouter()
  const [loading, setLoading] = useState<'TEACHER' | 'STUDENT' | null>(null)

  const handleImpersonate = (role: 'TEACHER' | 'STUDENT') => {
    setLoading(role)
    const url = role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard'
    router.push(url)
  }

  return (
    <div className="flex gap-2 items-center">
      {/* Teacher button */}
      <button
        onClick={() => handleImpersonate('TEACHER')}
        disabled={loading !== null}
        title="Xem giao diện giáo viên"
        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/10 hover:bg-blue-600/25 text-blue-400 hover:text-blue-300 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border border-blue-600/20 hover:border-blue-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading === 'TEACHER' ? (
          <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
        ) : (
          <span className="material-symbols-outlined text-sm">school</span>
        )}
        Teacher
      </button>

      {/* Student button */}
      <button
        onClick={() => handleImpersonate('STUDENT')}
        disabled={loading !== null}
        title="Xem giao diện học sinh"
        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/25 text-emerald-400 hover:text-emerald-300 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border border-emerald-600/20 hover:border-emerald-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading === 'STUDENT' ? (
          <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
        ) : (
          <span className="material-symbols-outlined text-sm">face</span>
        )}
        Student
      </button>
    </div>
  )
}
