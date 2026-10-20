import React from "react"
import Link from "next/link"

interface AdminUsersPaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
  baseUrl: string
  currentParams: Record<string, string | undefined>
}

export function AdminUsersPagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  baseUrl,
  currentParams,
}: AdminUsersPaginationProps) {
  if (totalCount === 0) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalCount)

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams()
    Object.entries(currentParams).forEach(([key, val]) => {
      if (val && key !== "page") {
        params.set(key, val)
      }
    })
    params.set("page", page.toString())
    return `${baseUrl}?${params.toString()}`
  }

  // Calculate visible page numbers
  const getPageNumbers = () => {
    const delta = 2
    const range: (number | string)[] = []

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      range.unshift("...")
    }
    if (currentPage + delta < totalPages - 1) {
      range.push("...")
    }

    range.unshift(1)
    if (totalPages > 1) {
      range.push(totalPages)
    }

    return range
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-neutral-900/60 border border-neutral-800 rounded-3xl">
      <div className="text-xs font-semibold text-neutral-400">
        Hiển thị <span className="text-white font-bold">{startItem}</span> -{" "}
        <span className="text-white font-bold">{endItem}</span> trên tổng số{" "}
        <span className="text-blue-400 font-bold">{totalCount}</span> người dùng
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          {/* Previous */}
          {currentPage > 1 ? (
            <Link
              href={buildPageUrl(currentPage - 1)}
              className="size-9 rounded-xl bg-neutral-850 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-300 hover:text-white flex items-center justify-center transition-colors text-sm"
              title="Trang trước"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </Link>
          ) : (
            <div className="size-9 rounded-xl bg-neutral-900 border border-neutral-800/60 text-neutral-600 flex items-center justify-center cursor-not-allowed">
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </div>
          )}

          {/* Page numbers */}
          {pageNumbers.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 text-neutral-600 font-bold select-none text-xs"
                >
                  ...
                </span>
              )
            }

            const pageNum = p as number
            const isActive = pageNum === currentPage

            return (
              <Link
                key={pageNum}
                href={buildPageUrl(pageNum)}
                className={`size-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105"
                    : "bg-neutral-850 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-400 hover:text-white"
                }`}
              >
                {pageNum}
              </Link>
            )
          })}

          {/* Next */}
          {currentPage < totalPages ? (
            <Link
              href={buildPageUrl(currentPage + 1)}
              className="size-9 rounded-xl bg-neutral-850 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-300 hover:text-white flex items-center justify-center transition-colors text-sm"
              title="Trang tiếp"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </Link>
          ) : (
            <div className="size-9 rounded-xl bg-neutral-900 border border-neutral-800/60 text-neutral-600 flex items-center justify-center cursor-not-allowed">
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
