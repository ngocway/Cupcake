"use client"

import React, { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"

interface ClassOption {
  id: string
  name: string
  classCode: string
}

interface AdminUsersFiltersProps {
  initialSearch?: string
  initialRole?: string
  initialFreq?: string
  initialClassId?: string
  classes?: ClassOption[]
}

export function AdminUsersFilters({
  initialSearch = "",
  initialRole = "",
  initialFreq = "",
  initialClassId = "",
  classes = [],
}: AdminUsersFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const q = ((formData.get("q") as string) || "").trim()

    const params = new URLSearchParams(searchParams?.toString() || "")
    if (q) {
      params.set("q", q)
    } else {
      params.delete("q")
    }
    params.set("page", "1")

    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`)
    })
  }

  const handleParamChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set("page", "1")

    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`)
    })
  }

  const handleClearFilters = () => {
    startTransition(() => {
      router.push("/admin/users")
    })
  }

  const hasActiveFilters = Boolean(
    initialSearch || initialRole || initialFreq || initialClassId
  )

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl flex flex-col md:flex-row gap-3 items-center relative">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative flex-grow w-full">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
          search
        </span>
        <input
          name="q"
          type="text"
          defaultValue={initialSearch}
          placeholder="Tìm theo tên hoặc email (nhấn Enter để tìm)..."
          className="w-full pl-12 pr-10 py-3 bg-neutral-800 border border-neutral-700/80 rounded-2xl outline-none focus:border-blue-500 text-white transition-all font-medium placeholder:text-neutral-500 text-sm"
        />
        {isPending && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 size-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </form>

      {/* Dropdown Filters */}
      <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center">
        {/* Class Filter */}
        <select
          value={initialClassId}
          onChange={(e) => handleParamChange("classId", e.target.value)}
          className="bg-neutral-800 border border-neutral-700/80 rounded-2xl px-4 py-3 outline-none text-white focus:border-blue-500 w-full sm:w-auto font-bold text-xs cursor-pointer max-w-[200px] truncate"
        >
          <option value="">Tất cả lớp học</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name} ({cls.classCode})
            </option>
          ))}
        </select>

        {/* Role Filter */}
        <select
          value={initialRole}
          onChange={(e) => handleParamChange("role", e.target.value)}
          className="bg-neutral-800 border border-neutral-700/80 rounded-2xl px-4 py-3 outline-none text-white focus:border-blue-500 w-full sm:w-auto font-bold text-xs cursor-pointer"
        >
          <option value="">Tất cả vai trò</option>
          <option value="TEACHER">Giáo viên</option>
          <option value="STUDENT">Học sinh</option>
        </select>

        {/* Frequency Filter */}
        <select
          value={initialFreq}
          onChange={(e) => handleParamChange("freq", e.target.value)}
          className="bg-neutral-800 border border-neutral-700/80 rounded-2xl px-4 py-3 outline-none text-white focus:border-blue-500 w-full sm:w-auto font-bold text-xs cursor-pointer"
        >
          <option value="">Tất cả tần suất</option>
          <option value="DAILY">Học hàng ngày (≥4d/tuần)</option>
          <option value="WEEKLY">Thỉnh thoảng (1-3d/tuần)</option>
          <option value="AT_RISK">Nguy cơ rời bỏ (≥14d vắng)</option>
          <option value="NEW">Mới tạo (trong 48h)</option>
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-3.5 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/80 rounded-2xl text-xs font-bold text-neutral-300 hover:text-white transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer"
            title="Xóa toàn bộ bộ lọc"
          >
            <span className="material-symbols-outlined text-sm">filter_alt_off</span>
            <span>Đặt lại</span>
          </button>
        )}
      </div>
    </div>
  )
}
