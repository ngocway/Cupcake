import React from "react"

export default function AdminUsersLoading() {
  return (
    <div className="p-6 md:p-8 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-9 w-72 bg-neutral-800 rounded-2xl" />
          <div className="h-4 w-96 bg-neutral-800/60 rounded-lg" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-28 bg-neutral-800 rounded" />
              <div className="size-8 rounded-xl bg-neutral-800" />
            </div>
            <div className="h-8 w-20 bg-neutral-800 rounded-lg" />
            <div className="h-3 w-36 bg-neutral-800/50 rounded" />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-5 w-60 bg-neutral-800 rounded" />
          <div className="h-7 w-44 bg-neutral-800 rounded-xl" />
        </div>
        <div className="grid grid-cols-7 gap-4 pt-4 border-t border-neutral-800 items-end h-32">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-10 h-24 bg-neutral-800/60 rounded-xl" />
              <div className="h-3 w-8 bg-neutral-800 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl flex flex-col md:flex-row gap-3.5 items-center">
        <div className="h-12 bg-neutral-800 rounded-2xl flex-grow w-full" />
        <div className="h-12 w-full md:w-36 bg-neutral-800 rounded-2xl" />
        <div className="h-12 w-full md:w-44 bg-neutral-800 rounded-2xl" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-800/50 border-b border-neutral-800">
              <th className="p-4 pl-8"><div className="h-3 w-28 bg-neutral-700/50 rounded" /></th>
              <th className="p-4"><div className="h-3 w-16 bg-neutral-700/50 rounded" /></th>
              <th className="p-4"><div className="h-3 w-28 bg-neutral-700/50 rounded" /></th>
              <th className="p-4"><div className="h-3 w-20 bg-neutral-700/50 rounded" /></th>
              <th className="p-4"><div className="h-3 w-24 bg-neutral-700/50 rounded" /></th>
              <th className="p-4"><div className="h-3 w-20 bg-neutral-700/50 rounded" /></th>
              <th className="p-4 pr-8 text-right"><div className="h-3 w-16 bg-neutral-700/50 rounded ml-auto" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="hover:bg-neutral-800/20">
                <td className="p-4 pl-8">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-neutral-800 shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-28 bg-neutral-800 rounded" />
                      <div className="h-3 w-40 bg-neutral-800/60 rounded" />
                    </div>
                  </div>
                </td>
                <td className="p-4"><div className="h-5 w-16 bg-neutral-800 rounded-full" /></td>
                <td className="p-4"><div className="h-4 w-24 bg-neutral-800 rounded" /></td>
                <td className="p-4">
                  <div className="flex gap-1">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <div key={j} className="size-3 rounded-full bg-neutral-800" />
                    ))}
                  </div>
                </td>
                <td className="p-4"><div className="h-4 w-20 bg-neutral-800 rounded" /></td>
                <td className="p-4"><div className="h-4 w-20 bg-neutral-800 rounded" /></td>
                <td className="p-4 pr-8 text-right"><div className="h-8 w-20 bg-neutral-800 rounded-xl ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
