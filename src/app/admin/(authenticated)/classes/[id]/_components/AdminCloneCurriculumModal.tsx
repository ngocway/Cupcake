"use client"

import React, { useState, useEffect } from "react"
import { adminGetClassesForCloneAction, adminCloneCurriculumAction } from "@/actions/admin-classes"

interface AdminCloneCurriculumModalProps {
  currentClassId: string
  onClose: () => void
  onSuccess: (message: string) => void
}

type CloneCandidate = {
  id: string
  name: string
  classCode: string
  teacher: { name: string | null; email: string | null }
  _count: { assignmentGroups: number; assignments: number }
}

export function AdminCloneCurriculumModal({
  currentClassId,
  onClose,
  onSuccess,
}: AdminCloneCurriculumModalProps) {
  const [candidates, setCandidates] = useState<CloneCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [isCloning, setIsCloning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function loadCandidates() {
      try {
        setLoading(true)
        const list = await adminGetClassesForCloneAction(currentClassId)
        setCandidates(list)
        if (list.length > 0) {
          setSelectedClassId(list[0].id)
        }
      } catch (err: any) {
        setError(err?.message || "Không thể tải danh sách lớp mẫu")
      } finally {
        setLoading(false)
      }
    }
    loadCandidates()
  }, [currentClassId])

  const selectedClass = candidates.find(c => c.id === selectedClassId)

  const handleClone = async () => {
    if (!selectedClassId) return
    setIsCloning(true)
    setError(null)
    try {
      const res = await adminCloneCurriculumAction(selectedClassId, currentClassId)
      if (res.success) {
        onSuccess(`Đã sao chép thành công ${res.clonedGroups} chặng và ${res.clonedAssignments} bài tập!`)
        onClose()
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi khi sao chép giáo trình")
    } finally {
      setIsCloning(false)
    }
  }

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.classCode.toLowerCase().includes(search.toLowerCase()) ||
    (c.teacher.name || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <span className="material-symbols-outlined text-xl">content_copy</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Sao chép lộ trình từ lớp mẫu</h3>
              <p className="text-xs text-neutral-400">Nhân bản toàn bộ chặng, bài tập và cấu hình mở khóa sang lớp này</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="size-8 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-lg">search</span>
            <input 
              type="text"
              placeholder="Tìm lớp mẫu theo tên hoặc mã lớp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-xs outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* List of classes */}
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {loading ? (
              <div className="py-12 text-center text-neutral-500 text-xs flex flex-col items-center gap-2">
                <div className="size-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Đang tìm các lớp có dữ liệu giáo trình...
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="py-8 text-center text-neutral-500 text-xs">
                Không tìm thấy lớp học nào có sẵn giáo trình để sao chép.
              </div>
            ) : (
              filteredCandidates.map((c) => {
                const isSelected = c.id === selectedClassId
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedClassId(c.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10"
                        : "bg-neutral-800/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-5 rounded-full border flex items-center justify-center ${isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-neutral-600"}`}>
                        {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                      </div>
                      <div>
                        <p className="text-white text-xs font-bold">{c.name}</p>
                        <p className="text-[11px] text-neutral-400">
                          Mã: <span className="text-neutral-300 font-medium">{c.classCode}</span> • GV: {c.teacher.name || c.teacher.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-[10px] font-bold text-neutral-300 border border-neutral-700">
                        {c._count.assignmentGroups} chặng
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                        {c._count.assignments} bài
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Selected Preview Notice */}
          {selectedClass && (
            <div className="p-4 rounded-2xl bg-neutral-800/60 border border-neutral-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-200">
                <span>Dữ liệu sẽ sao chép:</span>
                <span className="text-blue-400">
                  {selectedClass._count.assignmentGroups} Chặng / {selectedClass._count.assignments} Bài tập
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Tất cả chặng, bài học (Lý thuyết, Trắc nghiệm, Flashcard, Sách đọc, Game) và thứ tự mở khóa sẽ được sao chép và bổ sung vào lớp này.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-800 bg-neutral-900/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isCloning}
            className="px-5 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 text-xs font-bold hover:bg-neutral-800 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleClone}
            disabled={isCloning || !selectedClassId || loading}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            {isCloning ? (
              <>
                <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang sao chép...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                <span>Bắt đầu sao chép</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
