"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import {
  renameAssignmentGroupAction,
  deleteAssignmentGroupAction,
  updateAssignmentGroupProgressionAction,
  toggleForceUnlockAssignmentGroupAction,
  reorderAssignmentGroupsAction,
  toggleGroupVisibilityAction,
} from "@/actions/material-actions"
import {
  adminCreateAssignmentGroupAction,
  adminBatchMoveAssignmentsAction,
  adminBatchRemoveAssignmentsAction,
} from "@/actions/admin-classes"
import { removeAssignmentFromClass } from "@/app/teacher/classes/[id]/actions"
import { AssignContentModal } from "@/app/teacher/classes/[id]/_components/AssignContentModal"
import { AdminCloneCurriculumModal } from "./AdminCloneCurriculumModal"

export type AdminAssignmentItem = {
  id: string
  slug?: string | null
  title: string
  materialType: string
  level?: string | null
  instructions?: string | null
  deadline?: string | null
  thumbnail?: string | null
  audioUrl?: string | null
  readingText?: string | null
  lessonSlug?: string | null
  lessonId?: string | null
  questionsCount: number
  submittedCount: number
  totalStudents: number
  assignedAt?: string | null
  groupId?: string | null
}

export type AdminGroupItem = {
  id: string
  title: string
  orderIndex: number
  prerequisiteGroupId?: string | null
  prerequisiteGroupTitle?: string | null
  unlockThreshold?: number | null
  forceUnlocked?: boolean
  isHidden?: boolean
  visibleFrom?: string | null
  items: AdminAssignmentItem[]
}

interface AdminCurriculumTabProps {
  classId: string
  initialGroups: AdminGroupItem[]
  ungroupedAssignments: AdminAssignmentItem[]
  onRefresh: () => void
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  LESSON:   { label: "Lý thuyết",  icon: "school",          bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", text: "text-indigo-400" },
  EXERCISE: { label: "Trắc nghiệm",icon: "quiz",            bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",       text: "text-blue-400" },
  GRAMMAR:  { label: "Ngữ pháp",   icon: "quiz",            bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",       text: "text-blue-400" },
  READING:  { label: "Bài đọc",    icon: "auto_stories",    bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", text: "text-emerald-400" },
  FLASHCARD:{ label: "Flashcard",  icon: "style",           bg: "bg-purple-500/10 text-purple-400 border-purple-500/20", text: "text-purple-400" },
  GAME:     { label: "Trò chơi",   icon: "sports_esports",  bg: "bg-pink-500/10 text-pink-400 border-pink-500/20",       text: "text-pink-400" },
  BOOK:     { label: "Shadowing",  icon: "menu_book",       bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",   text: "text-amber-400" },
}

export function getPreviewUrl(a: AdminAssignmentItem): string {
  if (a.instructions) {
    try {
      const meta = JSON.parse(a.instructions)
      if (meta?.previewUrl) return meta.previewUrl
      if (meta?.playUrl) {
        const url: string = meta.playUrl
        if (
          url.startsWith("/student/game") ||
          url.startsWith("/student/books") ||
          url.startsWith("/grammar") ||
          url.startsWith("/student/lessons")
        ) {
          return `${url}${url.includes("?") ? "&" : "?"}preview=true`
        }
      }
    } catch {}
  }

  const kind = a.materialType || "EXERCISE"
  const isGrammarLesson =
    kind === "LESSON" ||
    a.title.toLowerCase().startsWith("grammar lesson") ||
    a.title.toLowerCase().startsWith("lý thuyết:")

  if (isGrammarLesson) {
    const target = a.lessonSlug || a.lessonId || a.slug || a.id
    return `/student/lessons/${target}?preview=true`
  }

  if (kind === "READING" && (a.lessonId || a.lessonSlug)) {
    return `/student/lessons/${a.lessonSlug || a.lessonId}?preview=true`
  }

  return `/public/assignments/${a.slug || a.id}`
}

export function AdminCurriculumTab({
  classId,
  initialGroups,
  ungroupedAssignments,
  onRefresh,
}: AdminCurriculumTabProps) {
  const [groups, setGroups] = useState<AdminGroupItem[]>(initialGroups)
  const [ungrouped, setUngrouped] = useState<AdminAssignmentItem[]>(ungroupedAssignments)
  const [viewMode, setViewMode] = useState<"grid" | "accordion">("grid")
  const [selectedStage, setSelectedStage] = useState<string>("ALL")
  const [search, setSearch] = useState("")

  // Batch selection
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<Set<string>>(new Set())
  const [isBatchMoving, setIsBatchMoving] = useState(false)
  const [batchTargetGroupId, setBatchTargetGroupId] = useState<string>("")

  // Modals state
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [assignModal, setAssignModal] = useState<{ open: boolean; groupId?: string; groupTitle?: string }>({ open: false })
  const [createGroupModal, setCreateGroupModal] = useState<{ open: boolean; title: string }>({ open: false, title: "" })
  const [renameModal, setRenameModal] = useState<{ open: boolean; groupId: string; currentTitle: string; newTitle: string } | null>(null)
  const [progressionModal, setProgressionModal] = useState<{
    open: boolean
    group: AdminGroupItem
    prerequisiteGroupId: string
    unlockThreshold: number
    forceUnlocked: boolean
    isHidden: boolean
  } | null>(null)

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Sensors for DnD reordering
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Auto-detect Stages across all group titles
  const detectedStages = useMemo(() => {
    const stageMap = new Map<number, { num: number; label: string; count: number }>()

    groups.forEach((g) => {
      // Matches: "[Chặng 1 - A1]", "Chặng 1:", "Chặng 1", "Stage 2"
      const match = g.title.match(/\[?(?:Chặng|Stage)\s*(\d+)(?:\s*-\s*([^\]]+))?\]?/i)
      if (match && match[1]) {
        const num = parseInt(match[1], 10)
        const levelStr = match[2]?.trim()
        const label = levelStr ? `Chặng ${num} (${levelStr})` : `Chặng ${num}`
        const existing = stageMap.get(num)
        if (existing) {
          existing.count += 1
        } else {
          stageMap.set(num, { num, label, count: 1 })
        }
      }
    })

    return Array.from(stageMap.values()).sort((a, b) => a.num - b.num)
  }, [groups])

  // Filter groups
  const filteredGroups = useMemo(() => {
    let result = groups

    // Filter by Stage Tab
    if (selectedStage !== "ALL" && selectedStage !== "UNGROUPED") {
      const stageNum = parseInt(selectedStage, 10)
      result = result.filter((g) => {
        const m = g.title.match(/\[?(?:Chặng|Stage)\s*(\d+)/i)
        return m && parseInt(m[1], 10) === stageNum
      })
    }

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.map((g) => {
        const groupMatches = g.title.toLowerCase().includes(q)
        const matchingItems = g.items.filter(
          (item) => item.title.toLowerCase().includes(q) || item.materialType.toLowerCase().includes(q)
        )
        if (groupMatches) return g
        if (matchingItems.length > 0) return { ...g, items: matchingItems }
        return null
      }).filter(Boolean) as AdminGroupItem[]
    }

    return result
  }, [groups, selectedStage, search])

  // Drag and drop end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = groups.findIndex((g) => g.id === active.id)
    const newIndex = groups.findIndex((g) => g.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(groups, oldIndex, newIndex)
    setGroups(reordered)

    try {
      await reorderAssignmentGroupsAction(classId, reordered.map((g) => g.id))
      showToast("Đã lưu thứ tự các chặng mới!")
    } catch {
      setGroups(groups)
      alert("Lỗi khi sắp xếp lại thứ tự chặng")
    }
  }

  // Create Group
  const handleCreateGroup = async () => {
    if (!createGroupModal.title.trim()) return
    try {
      const res = await adminCreateAssignmentGroupAction(classId, createGroupModal.title.trim())
      if (res.success && res.group) {
        const newGroupItem: AdminGroupItem = {
          id: res.group.id,
          title: res.group.title,
          orderIndex: res.group.orderIndex,
          prerequisiteGroupId: res.group.prerequisiteGroupId,
          prerequisiteGroupTitle: null,
          unlockThreshold: res.group.unlockThreshold,
          forceUnlocked: res.group.forceUnlocked,
          isHidden: res.group.isHidden,
          visibleFrom: res.group.visibleFrom ? (typeof res.group.visibleFrom === 'string' ? res.group.visibleFrom : res.group.visibleFrom.toISOString()) : null,
          items: [],
        }
        setGroups((prev) => [...prev, newGroupItem])
        setCreateGroupModal({ open: false, title: "" })
        showToast(`Đã tạo chặng mới: "${res.group.title}"`)
        onRefresh()
      }
    } catch (e: any) {
      alert(e?.message || "Lỗi tạo chặng")
    }
  }

  // Rename Group
  const handleRenameGroup = async () => {
    if (!renameModal || !renameModal.newTitle.trim()) return
    try {
      const res = await renameAssignmentGroupAction(renameModal.groupId, renameModal.newTitle.trim())
      if (res.success) {
        setGroups((prev) =>
          prev.map((g) => (g.id === renameModal.groupId ? { ...g, title: renameModal.newTitle.trim() } : g))
        )
        showToast("Đã đổi tên chặng thành công!")
        setRenameModal(null)
      }
    } catch (e: any) {
      alert(e?.message || "Lỗi đổi tên chặng")
    }
  }

  // Delete Group
  const handleDeleteGroup = async (groupId: string, groupTitle: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa "${groupTitle}"?\nCác liên kết mở khóa sẽ tự động được nối lại an toàn.`)) {
      return
    }
    try {
      const res = await deleteAssignmentGroupAction(groupId)
      if (res.success) {
        setGroups((prev) => prev.filter((g) => g.id !== groupId))
        showToast(`Đã xóa "${groupTitle}"!`)
        onRefresh()
      }
    } catch (e: any) {
      alert(e?.message || "Lỗi xóa chặng")
    }
  }

  // Save Progression Settings
  const handleSaveProgression = async () => {
    if (!progressionModal) return
    const { group, prerequisiteGroupId, unlockThreshold, forceUnlocked, isHidden } = progressionModal
    try {
      await updateAssignmentGroupProgressionAction(group.id, {
        prerequisiteGroupId: prerequisiteGroupId || null,
        unlockThreshold,
      })
      await toggleForceUnlockAssignmentGroupAction(group.id, forceUnlocked)
      await toggleGroupVisibilityAction(group.id, isHidden)

      setGroups((prev) =>
        prev.map((g) =>
          g.id === group.id
            ? {
                ...g,
                prerequisiteGroupId: prerequisiteGroupId || null,
                unlockThreshold,
                forceUnlocked,
                isHidden,
                prerequisiteGroupTitle: groups.find((x) => x.id === prerequisiteGroupId)?.title || null,
              }
            : g
        )
      )
      showToast("Đã cập nhật cài đặt mở khóa chặng!")
      setProgressionModal(null)
    } catch (e: any) {
      alert(e?.message || "Lỗi cập nhật tiến trình mở khóa")
    }
  }

  // Remove individual assignment
  const handleRemoveAssignment = async (assignmentId: string, title: string) => {
    if (!confirm(`Gỡ bài "${title}" khỏi lớp học?`)) return
    try {
      await removeAssignmentFromClass(classId, assignmentId)
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          items: g.items.filter((a) => a.id !== assignmentId),
        }))
      )
      setUngrouped((prev) => prev.filter((a) => a.id !== assignmentId))
      showToast(`Đã gỡ bài "${title}" khỏi lớp!`)
      onRefresh()
    } catch (e: any) {
      alert(e?.message || "Lỗi gỡ bài")
    }
  }

  // Batch actions
  const toggleSelectAssignment = (id: string) => {
    setSelectedAssignmentIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBatchMove = async () => {
    if (selectedAssignmentIds.size === 0) return
    setIsBatchMoving(true)
    try {
      const targetId = batchTargetGroupId || null
      await adminBatchMoveAssignmentsAction(classId, Array.from(selectedAssignmentIds), targetId)
      showToast(`Đã chuyển ${selectedAssignmentIds.size} bài sang chặng mới!`)
      setSelectedAssignmentIds(new Set())
      onRefresh()
    } catch (e: any) {
      alert(e?.message || "Lỗi chuyển bài")
    } finally {
      setIsBatchMoving(false)
    }
  }

  const handleBatchRemove = async () => {
    if (selectedAssignmentIds.size === 0) return
    if (!confirm(`Bạn có chắc muốn gỡ ${selectedAssignmentIds.size} bài đã chọn khỏi lớp học này?`)) return
    try {
      await adminBatchRemoveAssignmentsAction(classId, Array.from(selectedAssignmentIds))
      showToast(`Đã gỡ ${selectedAssignmentIds.size} bài khỏi lớp!`)
      setSelectedAssignmentIds(new Set())
      onRefresh()
    } catch (e: any) {
      alert(e?.message || "Lỗi gỡ bài hàng loạt")
    }
  }

  const totalAssignmentsCount = groups.reduce((acc, g) => acc + g.items.length, 0) + ungrouped.length

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-4 text-xs font-bold">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Batch Action Bar (Gợi ý 3) */}
      {selectedAssignmentIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 border border-blue-500/50 shadow-2xl shadow-blue-500/20 px-6 py-3.5 rounded-3xl flex items-center gap-4 animate-in slide-in-from-bottom-6 backdrop-blur-md">
          <div className="flex items-center gap-2 pr-3 border-r border-neutral-800">
            <span className="size-6 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">
              {selectedAssignmentIds.size}
            </span>
            <span className="text-white text-xs font-bold">bài đã chọn</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={batchTargetGroupId}
              onChange={(e) => setBatchTargetGroupId(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-medium rounded-xl px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="">-- Chuyển sang Chặng... --</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>

            <button
              onClick={handleBatchMove}
              disabled={!batchTargetGroupId || isBatchMoving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">drive_file_move</span>
              Chuyển
            </button>

            <button
              onClick={handleBatchRemove}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Gỡ khỏi lớp
            </button>

            <button
              onClick={() => setSelectedAssignmentIds(new Set())}
              className="size-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
              title="Bỏ chọn tất cả"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Action Controls & Stage Filter Bar */}
      <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
        {/* Row 1: Search & Main Action Buttons */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="relative flex-grow w-full lg:max-w-md">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-lg">search</span>
            <input
              type="text"
              placeholder="Tìm theo tên chặng hoặc tên bài tập..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-2xl text-white text-xs outline-none focus:border-blue-500 transition-colors font-medium"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-end">
            {/* View Mode Toggle (Gợi ý 2) */}
            <div className="bg-neutral-800 p-1 rounded-2xl border border-neutral-700 flex items-center">
              <button
                onClick={() => setViewMode("grid")}
                title="Dạng thẻ lưới"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">grid_view</span>
                Dạng thẻ
              </button>
              <button
                onClick={() => setViewMode("accordion")}
                title="Dạng cây danh sách thu gọn"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === "accordion"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">view_agenda</span>
                Thu gọn
              </button>
            </div>

            {/* Clone Curriculum Button (Gợi ý 1) */}
            <button
              onClick={() => setShowCloneModal(true)}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-2xl transition-all border border-neutral-700 flex items-center gap-1.5 hover:border-neutral-600"
            >
              <span className="material-symbols-outlined text-blue-400 text-[18px]">content_copy</span>
              Sao chép lộ trình
            </button>

            {/* Create Group Button */}
            <button
              onClick={() => setCreateGroupModal({ open: true, title: "" })}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-2xl transition-all border border-neutral-700 flex items-center gap-1.5 hover:border-neutral-600"
            >
              <span className="material-symbols-outlined text-emerald-400 text-[18px]">add_circle</span>
              Tạo chặng mới
            </button>

            {/* Assign Content Button */}
            <button
              onClick={() => setAssignModal({ open: true })}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">library_add</span>
              Gán học liệu
            </button>
          </div>
        </div>

        {/* Row 2: Smart Stage Filter Tabs (if stages detected) */}
        {detectedStages.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-neutral-800/80 custom-scrollbar pb-1">
            <button
              onClick={() => setSelectedStage("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedStage === "ALL"
                  ? "bg-neutral-100 text-neutral-900"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              Tất cả ({groups.length} chặng)
            </button>

            {detectedStages.map((st) => (
              <button
                key={st.num}
                onClick={() => setSelectedStage(String(st.num))}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedStage === String(st.num)
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                {st.label} ({st.count})
              </button>
            ))}

            {ungrouped.length > 0 && (
              <button
                onClick={() => setSelectedStage("UNGROUPED")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedStage === "UNGROUPED"
                    ? "bg-amber-600 text-white"
                    : "bg-neutral-800 text-amber-400 hover:text-amber-300"
                }`}
              >
                Chưa phân nhóm ({ungrouped.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content: Groups and Assignments */}
      {groups.length === 0 && ungrouped.length === 0 ? (
        <div className="py-20 rounded-3xl bg-neutral-900 border border-neutral-800 text-center space-y-4">
          <div className="size-16 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto border border-blue-500/20">
            <span className="material-symbols-outlined text-3xl">playlist_add</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white mb-1">Lớp học chưa có chương trình học</h3>
            <p className="text-neutral-400 text-xs max-w-md mx-auto">
              Bạn có thể bắt đầu bằng cách tạo chặng mới, sao chép toàn bộ lộ trình từ một lớp mẫu có sẵn, hoặc gán học liệu từ kho.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowCloneModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold border border-neutral-700 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-blue-400 text-[18px]">content_copy</span>
              Sao chép từ lớp mẫu
            </button>
            <button
              onClick={() => setCreateGroupModal({ open: true, title: "Chặng 1: " })}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tạo Chặng 1
            </button>
          </div>
        </div>
      ) : selectedStage === "UNGROUPED" ? (
        /* Ungrouped List */
        <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400">warning</span>
            Bài tập chưa phân nhóm ({ungrouped.length})
          </h3>
          <div className="divide-y divide-neutral-800">
            {ungrouped.map((item) => (
              <AssignmentRowItem
                key={item.id}
                item={item}
                groups={groups}
                isSelected={selectedAssignmentIds.has(item.id)}
                onToggleSelect={() => toggleSelectAssignment(item.id)}
                onRemove={() => handleRemoveAssignment(item.id, item.title)}
                onMoveToGroup={async (gId) => {
                  await adminBatchMoveAssignmentsAction(classId, [item.id], gId)
                  onRefresh()
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        /* DnD Sortable Groups */
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredGroups.map((g) => g.id)} strategy={rectSortingStrategy}>
            <div className={viewMode === "grid" ? "space-y-6" : "space-y-3"}>
              {filteredGroups.map((group, index) => (
                <SortableAdminGroupCard
                  key={group.id}
                  group={group}
                  stepNumber={index + 1}
                  viewMode={viewMode}
                  allGroups={groups}
                  selectedAssignmentIds={selectedAssignmentIds}
                  onToggleSelectAssignment={toggleSelectAssignment}
                  onAddAssignment={() =>
                    setAssignModal({ open: true, groupId: group.id, groupTitle: group.title })
                  }
                  onRename={() =>
                    setRenameModal({
                      open: true,
                      groupId: group.id,
                      currentTitle: group.title,
                      newTitle: group.title,
                    })
                  }
                  onConfigureProgression={() =>
                    setProgressionModal({
                      open: true,
                      group,
                      prerequisiteGroupId: group.prerequisiteGroupId || "",
                      unlockThreshold: group.unlockThreshold ?? 60,
                      forceUnlocked: group.forceUnlocked || false,
                      isHidden: group.isHidden || false,
                    })
                  }
                  onDelete={() => handleDeleteGroup(group.id, group.title)}
                  onRemoveAssignment={handleRemoveAssignment}
                  onMoveAssignment={async (aid, gId) => {
                    await adminBatchMoveAssignmentsAction(classId, [aid], gId)
                    onRefresh()
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Modal: Create Group */}
      {createGroupModal.open && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-white">Tạo Chặng / Nhóm bài mới</h3>
            <p className="text-xs text-neutral-400">
              Nhập tên chặng hoặc bấm gợi ý mẫu bên dưới để tạo nhanh:
            </p>

            {/* Quick Templates */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                `Chặng ${groups.length + 1}: `,
                `[Chặng ${groups.length + 1}] `,
                `Tuần ${groups.length + 1}: `,
                `Module ${groups.length + 1}: `,
              ].map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => setCreateGroupModal((prev) => ({ ...prev, title: tpl }))}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-bold border border-neutral-700 transition-colors"
                >
                  {tpl}
                </button>
              ))}
            </div>

            <input
              type="text"
              autoFocus
              placeholder="Ví dụ: Chặng 1: Nouns & Pronouns..."
              value={createGroupModal.title}
              onChange={(e) => setCreateGroupModal((prev) => ({ ...prev, title: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl text-white text-xs outline-none focus:border-blue-500 font-bold"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCreateGroupModal({ open: false, title: "" })}
                className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white text-xs font-bold"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!createGroupModal.title.trim()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-blue-500/20"
              >
                Tạo chặng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rename Group */}
      {renameModal?.open && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-white">Đổi tên Chặng / Nhóm bài</h3>
            <input
              type="text"
              autoFocus
              value={renameModal.newTitle}
              onChange={(e) => setRenameModal({ ...renameModal, newTitle: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleRenameGroup()}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl text-white text-xs outline-none focus:border-blue-500 font-bold"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRenameModal(null)}
                className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white text-xs font-bold"
              >
                Hủy
              </button>
              <button
                onClick={handleRenameGroup}
                disabled={!renameModal.newTitle.trim()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold"
              >
                Lưu tên mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Progression & Visibility Settings */}
      {progressionModal?.open && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">lock_open</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cài đặt mở khóa & Hiển thị</h3>
                <p className="text-xs text-neutral-400">{progressionModal.group.title}</p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {/* Force Unlock Switch */}
              <div className="p-4 rounded-2xl bg-neutral-800/60 border border-neutral-700/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Mở khóa cưỡng bức (Force Unlock)</p>
                  <p className="text-[11px] text-neutral-400">Mở ngay chặng này cho toàn bộ học sinh mà không cần đạt điều kiện.</p>
                </div>
                <input
                  type="checkbox"
                  checked={progressionModal.forceUnlocked}
                  onChange={(e) =>
                    setProgressionModal({ ...progressionModal, forceUnlocked: e.target.checked })
                  }
                  className="size-5 rounded text-blue-600 cursor-pointer accent-blue-600"
                />
              </div>

              {/* Prerequisite Setting */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">Chặng điều kiện tiên quyết (Prerequisite):</label>
                <select
                  value={progressionModal.prerequisiteGroupId}
                  onChange={(e) =>
                    setProgressionModal({ ...progressionModal, prerequisiteGroupId: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-xs outline-none focus:border-blue-500"
                >
                  <option value="">-- Mở tự do (Không cần chặng trước) --</option>
                  {groups
                    .filter((g) => g.id !== progressionModal.group.id)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                </select>
              </div>

              {/* Threshold */}
              {progressionModal.prerequisiteGroupId && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
                    <span>Ngưỡng hoàn thành chặng trước để mở:</span>
                    <span className="text-blue-400">{progressionModal.unlockThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={progressionModal.unlockThreshold}
                    onChange={(e) =>
                      setProgressionModal({
                        ...progressionModal,
                        unlockThreshold: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              )}

              {/* Hidden Switch */}
              <div className="p-4 rounded-2xl bg-neutral-800/60 border border-neutral-700/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Ẩn chặng này với học sinh</p>
                  <p className="text-[11px] text-neutral-400">Học sinh sẽ không nhìn thấy chặng này trong danh sách bài học.</p>
                </div>
                <input
                  type="checkbox"
                  checked={progressionModal.isHidden}
                  onChange={(e) =>
                    setProgressionModal({ ...progressionModal, isHidden: e.target.checked })
                  }
                  className="size-5 rounded text-rose-600 cursor-pointer accent-rose-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setProgressionModal(null)}
                className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white text-xs font-bold"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveProgression}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20"
              >
                Lưu cài đặt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Clone Curriculum (Gợi ý 1) */}
      {showCloneModal && (
        <AdminCloneCurriculumModal
          currentClassId={classId}
          onClose={() => setShowCloneModal(false)}
          onSuccess={(msg) => {
            showToast(msg)
            onRefresh()
          }}
        />
      )}

      {/* Modal: Assign Content Modal */}
      {assignModal.open && (
        <AssignContentModal
          classId={classId}
          initialGroupId={assignModal.groupId}
          initialGroupTitle={assignModal.groupTitle}
          existingGroups={groups.map((g) => ({ id: g.id, title: g.title }))}
          onClose={() => setAssignModal({ open: false })}
          onAssigned={() => {
            showToast("Đã gán học liệu vào lớp học thành công!")
            onRefresh()
          }}
        />
      )}
    </div>
  )
}

/**
 * Sortable Group Card (Supports both Grid and Accordion View)
 */
function SortableAdminGroupCard({
  group,
  stepNumber,
  viewMode,
  allGroups,
  selectedAssignmentIds,
  onToggleSelectAssignment,
  onAddAssignment,
  onRename,
  onConfigureProgression,
  onDelete,
  onRemoveAssignment,
  onMoveAssignment,
}: {
  group: AdminGroupItem
  stepNumber: number
  viewMode: "grid" | "accordion"
  allGroups: AdminGroupItem[]
  selectedAssignmentIds: Set<string>
  onToggleSelectAssignment: (id: string) => void
  onAddAssignment: () => void
  onRename: () => void
  onConfigureProgression: () => void
  onDelete: () => void
  onRemoveAssignment: (id: string, title: string) => void
  onMoveAssignment: (id: string, targetGroupId: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isHidden = !!group.isHidden

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-3xl border transition-all overflow-hidden ${
        isDragging
          ? "z-50 bg-neutral-900 border-blue-500 shadow-2xl scale-[1.01]"
          : isHidden
          ? "bg-neutral-900/60 border-neutral-800/60 opacity-60 hover:opacity-100"
          : "bg-neutral-900 border-neutral-800 hover:border-neutral-700/80"
      }`}
    >
      {/* Group Header */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 bg-neutral-900/90">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            title="Kéo thả để đổi thứ tự chặng"
            className="size-8 rounded-xl bg-neutral-800/80 text-neutral-400 hover:text-white flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
          </button>

          {/* Toggle Expand (in accordion mode) */}
          {viewMode === "accordion" && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="size-8 rounded-xl bg-neutral-800/80 text-neutral-400 hover:text-white flex items-center justify-center shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isExpanded ? "expand_less" : "expand_more"}
              </span>
            </button>
          )}

          {/* Step Badge & Title */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-extrabold border border-blue-500/20">
                Chặng {stepNumber}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 text-[10px] font-bold border border-neutral-700">
                {group.items.length} bài học
              </span>

              {/* Progression Status Pills */}
              {group.forceUnlocked && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">lock_open</span>
                  Mở cưỡng bức
                </span>
              )}
              {group.prerequisiteGroupTitle && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">link</span>
                  Yêu cầu: {group.prerequisiteGroupTitle} (≥ {group.unlockThreshold}%)
                </span>
              )}
              {group.isHidden && (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">visibility_off</span>
                  Đang ẩn
                </span>
              )}
            </div>

            <h4 className="text-white font-bold text-sm flex items-center gap-2">
              {group.title}
            </h4>
          </div>
        </div>

        {/* Group Actions Bar */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
          <button
            onClick={onAddAssignment}
            title="Thêm bài tập vào chặng này"
            className="px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-400 text-xs font-bold border border-blue-500/20 transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            Gán bài
          </button>

          <button
            onClick={onConfigureProgression}
            title="Cài đặt điều kiện mở khóa & ẩn/hiện"
            className="size-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
          </button>

          <button
            onClick={onRename}
            title="Đổi tên chặng"
            className="size-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>

          <button
            onClick={onDelete}
            title="Xóa chặng này"
            className="size-8 rounded-xl bg-neutral-800 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 border border-neutral-700 hover:border-rose-500/30 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>

      {/* Group Items Body */}
      {isExpanded && (
        <div className="p-3 sm:p-4">
          {group.items.length === 0 ? (
            <div className="py-8 text-center text-neutral-500 text-xs flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-neutral-600">playlist_remove</span>
              Chặng này chưa có bài tập nào.
              <button
                onClick={onAddAssignment}
                className="text-blue-400 font-bold hover:underline text-xs flex items-center gap-1"
              >
                + Gán bài từ kho học liệu ngay
              </button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/60">
              {group.items.map((item) => (
                <AssignmentRowItem
                  key={item.id}
                  item={item}
                  groups={allGroups}
                  isSelected={selectedAssignmentIds.has(item.id)}
                  onToggleSelect={() => onToggleSelectAssignment(item.id)}
                  onRemove={() => onRemoveAssignment(item.id, item.title)}
                  onMoveToGroup={(gId) => onMoveAssignment(item.id, gId)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Individual Assignment Row with Live Preview & Content Health Check Indicators
 */
function AssignmentRowItem({
  item,
  groups,
  isSelected,
  onToggleSelect,
  onRemove,
  onMoveToGroup,
}: {
  item: AdminAssignmentItem
  groups: AdminGroupItem[]
  isSelected: boolean
  onToggleSelect: () => void
  onRemove: () => void
  onMoveToGroup: (targetGroupId: string) => void
}) {
  const typeCfg = TYPE_CONFIG[item.materialType] || TYPE_CONFIG.EXERCISE
  const previewUrl = getPreviewUrl(item)

  // Health Checks (Gợi ý 4)
  const hasAudio = !!item.audioUrl || !!item.readingText
  const hasQuiz = item.questionsCount > 0
  const hasThumbnail = !!item.thumbnail

  return (
    <div
      className={`py-3 px-3 rounded-2xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isSelected ? "bg-blue-500/10 border border-blue-500/30" : "hover:bg-neutral-800/40"
      }`}
    >
      {/* Left: Checkbox, Badge, Title */}
      <div className="flex items-center gap-3">
        {/* Checkbox for Batch Selection (Gợi ý 3) */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="size-4 rounded text-blue-600 accent-blue-600 cursor-pointer shrink-0"
        />

        {/* Thumbnail or Type Icon */}
        <div className="size-10 rounded-xl bg-neutral-800 border border-neutral-700/80 overflow-hidden flex items-center justify-center shrink-0">
          {item.thumbnail ? (
            <img src={item.thumbnail} alt={item.title} className="size-full object-cover" />
          ) : (
            <span className={`material-symbols-outlined text-lg ${typeCfg.text}`}>{typeCfg.icon}</span>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeCfg.bg}`}>
              {typeCfg.label}
            </span>

            {item.level && (
              <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 text-[9px] font-bold">
                {item.level}
              </span>
            )}

            {/* Content Health Check Badges (Gợi ý 4) */}
            <div className="flex items-center gap-1 pl-1">
              <span
                title={hasAudio ? "Đã có Audio TTS / Bài đọc" : "Chưa có audio"}
                className={`size-2 rounded-full ${hasAudio ? "bg-emerald-500" : "bg-neutral-600"}`}
              />
              <span
                title={hasQuiz ? `Có ${item.questionsCount} câu hỏi` : "Chưa có câu hỏi"}
                className={`size-2 rounded-full ${hasQuiz ? "bg-blue-500" : "bg-neutral-600"}`}
              />
              <span
                title={hasThumbnail ? "Đã có hình minh họa" : "Chưa có hình"}
                className={`size-2 rounded-full ${hasThumbnail ? "bg-purple-500" : "bg-neutral-600"}`}
              />
            </div>
          </div>

          <h5 className="text-white text-xs font-bold hover:text-blue-400 transition-colors line-clamp-1">
            {item.title}
          </h5>
        </div>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {/* Move to another group */}
        <select
          value={item.groupId || ""}
          onChange={(e) => onMoveToGroup(e.target.value)}
          className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-[11px] font-medium rounded-xl px-2.5 py-1.5 outline-none focus:border-blue-500 max-w-[140px] truncate"
          title="Chuyển sang chặng khác"
        >
          <option value="">-- Chưa nhóm --</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>

        {/* Live Preview Button */}
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Xem trước bài tập (Học sinh preview)"
          className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px] text-blue-400">visibility</span>
          Xem
        </a>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          title="Gỡ bài khỏi lớp"
          className="size-7 rounded-xl bg-neutral-800 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 border border-neutral-700 hover:border-rose-500/30 flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      </div>
    </div>
  )
}
