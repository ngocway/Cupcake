"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';

import { AssignContentModal } from './AssignContentModal';
import { remindPendingSubmissions, removeAssignmentFromClass } from '../actions';
import { renameAssignmentGroupAction, deleteAssignmentGroupAction } from '@/actions/material-actions';

export type Assignment = {
  id: string;
  title: string;
  materialType: 'EXERCISE' | 'READING' | 'FLASHCARD' | 'LESSON' | 'GAME' | 'BOOK';
  level?: string | null;
  instructions?: string | null;
  deadline: string | null;
  isOpen: boolean;
  submittedCount: number;
  totalStudents: number;
  percentage: number;
  assignedAt?: string | null;
  groupId?: string | null;
  groupTitle?: string | null;
  groupCreatedAt?: string | null;
  section?: 'NEW' | 'REVIEW';
};

const TYPE_CONFIG: Record<string, { label: string; icon: string; bgClass: string; textClass: string; badgeClass: string }> = {
  LESSON:   { label: 'Grammar lesson', icon: 'school',          bgClass: 'bg-indigo-50 dark:bg-indigo-900/30', textClass: 'text-indigo-600', badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  EXERCISE: { label: 'Grammar', icon: 'quiz',          bgClass: 'bg-blue-50 dark:bg-blue-900/30',     textClass: 'text-primary', badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  READING:  { label: 'Reading', icon: 'auto_stories',  bgClass: 'bg-emerald-50 dark:bg-emerald-900/30', textClass: 'text-emerald-600', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  FLASHCARD:{ label: 'Flashcard', icon: 'style',       bgClass: 'bg-purple-50 dark:bg-purple-900/30',  textClass: 'text-purple-600', badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  GAME:     { label: 'Game',    icon: 'sports_esports',bgClass: 'bg-pink-50 dark:bg-pink-900/30',     textClass: 'text-pink-600', badgeClass: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
  BOOK:     { label: 'Shadowing', icon: 'menu_book',   bgClass: 'bg-amber-50 dark:bg-amber-900/30',   textClass: 'text-amber-600', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
};

function formatDeadline(deadline: string | null) {
  if (!deadline) return 'Không giới hạn';
  const d = new Date(deadline);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} - ${hours}:${minutes}`;
}

export function AssignmentsTab({
  classId,
  onOpenCountChange,
  initialAssignments,
  isAdmin = false,
}: {
  classId: string;
  onOpenCountChange?: (count: number) => void;
  initialAssignments?: Assignment[];
  isAdmin?: boolean;
}) {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments ?? []);
  const [isLoading, setIsLoading] = useState(!initialAssignments);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'ended'>('all');
  
  // Drill-down view state: when not null, shows that group's details
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Group 3-dot menu and assignment 3-dot menu
  const [openGroupMenuId, setOpenGroupMenuId] = useState<string | null>(null);
  const [openAssignmentMenuId, setOpenAssignmentMenuId] = useState<string | null>(null);

  // Assign modal state (supports both new group or adding to existing group)
  const [assignModalState, setAssignModalState] = useState<{
    open: boolean;
    groupId?: string;
    groupTitle?: string;
  }>({ open: false });

  // Rename modal state
  const [renameModal, setRenameModal] = useState<{
    open: boolean;
    groupId: string;
    newTitle: string;
  } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  // Success Toast & Remind state
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isReminding, setIsReminding] = useState(false);

  // Confirm dialog for remove assignment
  const [confirmRemove, setConfirmRemove] = useState<{
    assignmentId: string;
    title: string;
  } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const groupMenuRef = useRef<HTMLDivElement>(null);
  const assignmentMenuRef = useRef<HTMLDivElement>(null);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/classes/${classId}/assignments`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments ?? []);
        onOpenCountChange?.(data.openCount ?? 0);
      }
    } catch (err) {
      console.error('Failed to load assignments', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialAssignments) {
      fetchAssignments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (groupMenuRef.current && !groupMenuRef.current.contains(e.target as Node)) {
        setOpenGroupMenuId(null);
      }
      if (assignmentMenuRef.current && !assignmentMenuRef.current.contains(e.target as Node)) {
        setOpenAssignmentMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      const matchesSearch = 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.groupTitle && a.groupTitle.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'ongoing' && a.isOpen) ||
        (statusFilter === 'ended' && !a.isOpen);
      return matchesSearch && matchesStatus;
    });
  }, [assignments, searchTerm, statusFilter]);

  // Group assignments by Group (or legacy ungrouped)
  const groupedAssignments = useMemo(() => {
    const map = new Map<string, {
      id: string;
      title: string;
      createdAt: string | null;
      items: Assignment[];
    }>();

    filtered.forEach((a) => {
      const gId = a.groupId || `ungrouped_${a.groupTitle || 'general'}`;
      const gTitle = a.groupTitle || 'Bài tập lẻ / Chưa phân nhóm';
      if (!map.has(gId)) {
        map.set(gId, {
          id: gId,
          title: gTitle,
          createdAt: a.groupCreatedAt || null,
          items: [],
        });
      }
      map.get(gId)!.items.push(a);
    });

    return Array.from(map.values());
  }, [filtered]);

  // Find active group if in drill-down mode
  const activeGroup = useMemo(() => {
    if (!activeGroupId) return null;
    return groupedAssignments.find(g => g.id === activeGroupId) || null;
  }, [activeGroupId, groupedAssignments]);

  const handleRemind = async (assignmentId: string) => {
    setOpenAssignmentMenuId(null);
    setIsReminding(true);
    try {
      const res = await remindPendingSubmissions(classId, assignmentId);
      if (res.success) {
        setToastMessage(`Đã gửi nhắc nhở cho ${res.count} học sinh chưa nộp bài.`);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Không thể gửi nhắc nhở');
    } finally {
      setIsReminding(false);
    }
  };

  const handleRemoveAssignment = async () => {
    if (!confirmRemove) return;
    setIsRemoving(true);
    try {
      await removeAssignmentFromClass(classId, confirmRemove.assignmentId);
      // Optimistic UI: remove from local state immediately
      setAssignments((prev) => prev.filter((a) => a.id !== confirmRemove.assignmentId));
      setToastMessage(`Đã gỡ "${confirmRemove.title}" khỏi lớp.`);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err: any) {
      alert('Gỡ bài thất bại: ' + (err?.message || 'Có lỗi xảy ra'));
    } finally {
      setIsRemoving(false);
      setConfirmRemove(null);
    }
  };

  const handleRenameGroup = async () => {
    if (!renameModal || !renameModal.newTitle.trim()) return;
    setIsRenaming(true);
    try {
      if (renameModal.groupId.startsWith('ungrouped_')) {
        alert('Không thể đổi tên nhóm mặc định này.');
        return;
      }
      await renameAssignmentGroupAction(renameModal.groupId, renameModal.newTitle.trim());
      setToastMessage('Đã đổi tên nhóm bài tập thành công!');
      setShowSuccessToast(true);
      setRenameModal(null);
      await fetchAssignments();
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err: any) {
      alert('Đổi tên thất bại: ' + (err?.message || 'Có lỗi xảy ra'));
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupTitle: string) => {
    setOpenGroupMenuId(null);
    if (groupId.startsWith('ungrouped_')) {
      alert('Không thể xóa nhóm mặc định này.');
      return;
    }
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa nhóm bài tập "${groupTitle}"?\nCác bài tập trong nhóm này sẽ được gỡ khỏi lớp.`);
    if (!confirmed) return;

    try {
      await deleteAssignmentGroupAction(groupId);
      if (activeGroupId === groupId) {
        setActiveGroupId(null);
      }
      setToastMessage(`Đã xóa nhóm bài tập "${groupTitle}".`);
      setShowSuccessToast(true);
      await fetchAssignments();
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err: any) {
      alert('Xóa nhóm thất bại: ' + (err?.message || 'Có lỗi xảy ra'));
    }
  };

  // Helper to calculate kind breakdown in group
  const getGroupKindBreakdown = (items: Assignment[]) => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      let kind = item.materialType as string;
      if (item.instructions) {
        try {
          const meta = JSON.parse(item.instructions);
          if (meta?.kind) kind = meta.kind;
        } catch {}
      }
      counts[kind] = (counts[kind] || 0) + 1;
    });

    return Object.entries(counts).map(([kind, count]) => {
      const config = TYPE_CONFIG[kind] || TYPE_CONFIG.EXERCISE;
      return {
        label: config.label,
        count,
        badgeClass: config.badgeClass,
      };
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Search and Top Bar (Visible when not drilled down or at top) */}
      {!activeGroup && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative max-w-sm w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#617589]">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input
                  className="block w-full rounded-xl border border-[#f0f2f4] dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                  placeholder="Tìm theo tên bài hoặc tên nhóm..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <button 
              onClick={() => setAssignModalState({ open: true })}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-primary/90 transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Giao nhóm bài mới</span>
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-8 border-b border-[#f0f2f4] dark:border-gray-800">
            <button 
              onClick={() => setStatusFilter('all')}
              className={`pb-4 text-sm font-bold transition-colors cursor-pointer ${statusFilter === 'all' ? 'text-primary border-b-2 border-primary' : 'text-[#617589] hover:text-primary'}`}>
              Tất cả ({groupedAssignments.length} nhóm)
            </button>
            <button 
              onClick={() => setStatusFilter('ongoing')}
              className={`pb-4 text-sm font-bold transition-colors cursor-pointer ${statusFilter === 'ongoing' ? 'text-primary border-b-2 border-primary' : 'text-[#617589] hover:text-primary'}`}>
              Đang mở
            </button>
            <button 
              onClick={() => setStatusFilter('ended')}
              className={`pb-4 text-sm font-bold transition-colors cursor-pointer ${statusFilter === 'ended' ? 'text-primary border-b-2 border-primary' : 'text-[#617589] hover:text-primary'}`}>
              Đã kết thúc
            </button>
          </div>
        </>
      )}

      {/* VIEW 1: DRILL-DOWN GROUP DETAIL VIEW */}
      {activeGroup ? (
        <div className="flex flex-col gap-6 animate-in slide-in-from-left-2 duration-200">
          {/* Back button & Action controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setActiveGroupId(null)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold text-[#617589] hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span>Quay lại danh sách nhóm</span>
            </button>

            <div className="flex items-center gap-2.5">
              {!activeGroup.id.startsWith('ungrouped_') && (
                <>
                  <button
                    onClick={() => setRenameModal({ open: true, groupId: activeGroup.id, newTitle: activeGroup.title })}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-[#111418] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    <span>Đổi tên nhóm</span>
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(activeGroup.id, activeGroup.title)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-white dark:bg-gray-800 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    <span>Xóa nhóm</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setAssignModalState({ open: true, groupId: activeGroup.id, groupTitle: activeGroup.title })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Thêm bài vào nhóm này</span>
              </button>
            </div>
          </div>

          {/* Group Header Banner */}
          <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-transparent dark:from-gray-800/90 dark:via-gray-800/60 dark:to-transparent border border-blue-100/70 dark:border-gray-700 p-6 rounded-3xl shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-3xl font-bold">folder_open</span>
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-black text-[#111418] dark:text-white">
                      {activeGroup.title}
                    </h2>
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-primary text-white shrink-0">
                      {activeGroup.items.length} bài
                    </span>
                  </div>
                  {activeGroup.createdAt && (
                    <p className="text-xs text-[#617589] flex items-center gap-1 mt-1 font-medium">
                      <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                      Ngày giao: {new Date(activeGroup.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              </div>

              {/* Average completion rate */}
              <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
                <div className="text-right">
                  <p className="text-[11px] font-bold text-[#617589] uppercase tracking-wider">Tiến độ nộp bài tb</p>
                  <p className="text-lg font-black text-primary">
                    {activeGroup.items.length > 0
                      ? Math.round(activeGroup.items.reduce((acc, c) => acc + (c.percentage || 0), 0) / activeGroup.items.length)
                      : 0}%
                  </p>
                </div>
                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{
                      width: `${activeGroup.items.length > 0
                        ? Math.round(activeGroup.items.reduce((acc, c) => acc + (c.percentage || 0), 0) / activeGroup.items.length)
                        : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Child Assignments: Separated into Bài mới & Ôn bài */}
          {(() => {
            const newItems = activeGroup.items.filter((i) => {
              try {
                const meta = i.instructions ? JSON.parse(i.instructions) : {};
                return meta?.section !== 'REVIEW';
              } catch { return true; }
            });

            const reviewItems = activeGroup.items.filter((i) => {
              try {
                const meta = i.instructions ? JSON.parse(i.instructions) : {};
                return meta?.section === 'REVIEW';
              } catch { return false; }
            });

            const renderCard = (assignment: Assignment, isReview: boolean) => {
              let kind = assignment.materialType as string;
              if (assignment.instructions) {
                try {
                  const meta = JSON.parse(assignment.instructions);
                  if (meta?.kind) kind = meta.kind;
                } catch {}
              }
              const config = TYPE_CONFIG[kind] ?? TYPE_CONFIG[assignment.materialType] ?? TYPE_CONFIG.EXERCISE;
              const displayTitle = assignment.title.replace(/^Lý thuyết:\s*/i, 'Grammar lesson: ');

              return (
                <div
                  key={assignment.id}
                  className={`bg-white dark:bg-gray-800 rounded-3xl border p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-xl transition-all duration-200 group relative ${
                    isReview 
                      ? 'border-amber-200/80 dark:border-amber-900/50 hover:border-amber-400' 
                      : 'border-[#f0f2f4] dark:border-gray-700/80 hover:border-primary/40'
                  }`}
                >
                  <div>
                    {/* Top Row: Icon + Badges + 3-dot Menu */}
                    <div className="flex items-start justify-between gap-3 mb-3.5">
                      <div className={`size-12 ${config.bgClass} ${config.textClass} rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                        <span className="material-symbols-outlined text-2xl font-bold">{config.icon}</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {isReview && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Ôn bài
                          </span>
                        )}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.badgeClass}`}>
                          {config.label}
                        </span>
                        {assignment.level && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {assignment.level.toUpperCase()}
                          </span>
                        )}
                        {assignment.isOpen ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Đang mở
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                            Đã đóng
                          </span>
                        )}

                        {/* 3-dot menu */}
                        <div className="relative" ref={openAssignmentMenuId === assignment.id ? assignmentMenuRef : undefined}>
                          <button
                            type="button"
                            className="size-8 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full flex items-center justify-center text-[#617589] hover:text-[#111418] dark:hover:text-white transition-colors cursor-pointer"
                            onClick={() => setOpenAssignmentMenuId(openAssignmentMenuId === assignment.id ? null : assignment.id)}
                          >
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                          </button>

                          {openAssignmentMenuId === assignment.id && (
                            <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                              <Link
                                href={`/teacher/classes/${classId}/assignments/${assignment.id}`}
                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                              >
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                Xem kết quả làm bài
                              </Link>
                              <button 
                                onClick={() => handleRemind(assignment.id)}
                                disabled={isReminding}
                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left disabled:opacity-50 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px] text-[#617589]">notifications</span>
                                Nhắc nhở nộp bài
                              </button>
                              {isAdmin && (
                                <>
                                  <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                                  <button
                                    onClick={() => {
                                      setOpenAssignmentMenuId(null);
                                      setConfirmRemove({ assignmentId: assignment.id, title: assignment.title });
                                    }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">link_off</span>
                                    Gỡ bài khỏi lớp
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-base font-extrabold text-[#111418] dark:text-white line-clamp-2 mt-2 group-hover:text-primary transition-colors">
                      {displayTitle}
                    </h4>

                    {/* Deadline */}
                    <div className="flex items-center gap-1.5 text-xs text-[#617589] mt-2 font-medium">
                      <span className="material-symbols-outlined text-[15px]">event</span>
                      <span>Hạn: {formatDeadline(assignment.deadline)}</span>
                    </div>
                  </div>

                  {/* Bottom Progress Bar & Link */}
                  <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/60">
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-green-600">
                        {assignment.submittedCount}/{assignment.totalStudents} đã nộp
                      </span>
                      <span className="text-[#617589] font-black">{Math.round(assignment.percentage || 0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round(assignment.percentage || 0)}%` }}
                      />
                    </div>

                    <Link
                      href={`/teacher/classes/${classId}/assignments/${assignment.id}`}
                      className="flex items-center justify-between text-xs font-bold text-primary group-hover:text-primary/80 transition-colors pt-1"
                    >
                      <span>Xem kết quả chi tiết</span>
                      <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </div>
              );
            };

            return (
              <div className="flex flex-col gap-8">
                {/* 1. BÀI HỌC MỚI */}
                {newItems.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">menu_book</span>
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-[#111418] dark:text-white">
                        BÀI HỌC MỚI ({newItems.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {newItems.map((a) => renderCard(a, false))}
                    </div>
                  </div>
                )}

                {/* 2. ÔN TẬP CỦNG CỐ */}
                {reviewItems.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">history_edu</span>
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-[#111418] dark:text-white">
                        ÔN TẬP CỦNG CỐ ({reviewItems.length})
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        Ôn bài
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {reviewItems.map((a) => renderCard(a, true))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      ) : (
        /* VIEW 2: GRID OF GROUP CARDS (Cách 1) */
        <div>
          {isLoading ? (
            /* Loading skeletons in grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl border border-[#f0f2f4] dark:border-gray-700 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="size-12 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  </div>
                  <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-100 dark:bg-gray-750 rounded animate-pulse" />
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mt-4" />
                </div>
              ))}
            </div>
          ) : groupedAssignments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-[#f0f2f4] dark:border-gray-700 rounded-3xl p-8 shadow-sm text-center py-16 text-[#617589]">
              <div className="flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-[52px] opacity-40">folder_open</span>
                <p className="font-bold text-base">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Không tìm thấy nhóm bài tập nào phù hợp.'
                    : 'Chưa có nhóm bài tập nào được giao cho lớp này.'
                  }
                </p>
                <p className="text-xs text-[#617589]">Bấm nút &quot;Giao nhóm bài mới&quot; để tạo nhóm và giao bài cho học sinh.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedAssignments.map((group) => {
                const totalItems = group.items.length;
                const avgPercentage = totalItems > 0
                  ? Math.round(group.items.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / totalItems)
                  : 0;
                const kinds = getGroupKindBreakdown(group.items);

                return (
                  <div
                    key={group.id}
                    onClick={() => setActiveGroupId(group.id)}
                    className="group relative bg-white dark:bg-gray-800 rounded-3xl border border-[#f0f2f4] dark:border-gray-700/80 hover:border-primary/40 dark:hover:border-primary/40 p-6 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header of Card: Folder Icon, Item Count Badge, 3-dot Menu */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="size-12 rounded-2xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <span className="material-symbols-outlined text-2xl font-bold">folder</span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300">
                            {group.items.filter(i => {
                              try { return JSON.parse(i.instructions || '{}').section !== 'REVIEW'; } catch { return true; }
                            }).length} bài mới
                          </span>
                          {group.items.some(i => {
                            try { return JSON.parse(i.instructions || '{}').section === 'REVIEW'; } catch { return false; }
                          }) && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                              {group.items.filter(i => {
                                try { return JSON.parse(i.instructions || '{}').section === 'REVIEW'; } catch { return false; }
                              }).length} ôn bài
                            </span>
                          )}

                          {/* 3-dot action menu for group */}
                          <div 
                            className="relative"
                            ref={openGroupMenuId === group.id ? groupMenuRef : undefined}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="size-8 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full flex items-center justify-center text-[#617589] hover:text-[#111418] dark:hover:text-white transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenGroupMenuId(openGroupMenuId === group.id ? null : group.id);
                              }}
                            >
                              <span className="material-symbols-outlined text-[20px]">more_vert</span>
                            </button>

                            {openGroupMenuId === group.id && (
                              <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-30 animate-in fade-in zoom-in-95 duration-150">
                                {!group.id.startsWith('ungrouped_') && (
                                  <button
                                    onClick={() => {
                                      setOpenGroupMenuId(null);
                                      setRenameModal({ open: true, groupId: group.id, newTitle: group.title });
                                    }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors text-left cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[18px] text-gray-500">edit</span>
                                    <span>Đổi tên nhóm</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setOpenGroupMenuId(null);
                                    setAssignModalState({ open: true, groupId: group.id, groupTitle: group.title });
                                  }}
                                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                  <span>Thêm bài vào nhóm này</span>
                                </button>
                                {!group.id.startsWith('ungrouped_') && (
                                  <button
                                    onClick={() => handleDeleteGroup(group.id, group.title)}
                                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left cursor-pointer border-t border-gray-100 dark:border-gray-750"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                    <span>Xóa nhóm bài tập</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Group Title */}
                      <h3 className="text-lg font-black text-[#111418] dark:text-white line-clamp-2 group-hover:text-primary transition-colors">
                        {group.title}
                      </h3>

                      {/* Date */}
                      {group.createdAt && (
                        <p className="text-xs text-[#617589] flex items-center gap-1 mt-1 font-medium">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                          Ngày giao: {new Date(group.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      )}

                      {/* Kinds badges breakdown */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        {kinds.map((k, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${k.badgeClass}`}
                          >
                            {k.count} {k.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Progress Bar & Footer */}
                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/60">
                      <div className="flex items-center justify-between text-xs font-bold text-[#617589] mb-1.5">
                        <span>Tiến độ nộp bài</span>
                        <span className="text-primary font-black">{avgPercentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${avgPercentage}%` }}
                        />
                      </div>

                      {/* CTA Button */}
                      <div className="mt-4 flex items-center justify-between text-xs font-bold text-primary group-hover:text-primary/90">
                        <span>Xem chi tiết nhóm</span>
                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Giao bài tập (Tạo mới hoặc Thêm vào nhóm có sẵn) */}
      {assignModalState.open && (
        <AssignContentModal 
          classId={classId} 
          initialGroupId={assignModalState.groupId}
          initialGroupTitle={assignModalState.groupTitle}
          onClose={() => setAssignModalState({ open: false })} 
          onAssigned={() => {
            fetchAssignments();
            setToastMessage('Đã cập nhật bài tập cho lớp thành công!');
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
          }}
        />
      )}

      {/* Modal: Đổi tên nhóm bài tập */}
      {renameModal?.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-1">
              Đổi tên nhóm bài tập
            </h3>
            <p className="text-xs text-[#617589] mb-4">
              Nhập tên mới cho nhóm bài tập này. Tên mới sẽ hiển thị cho cả giáo viên và học sinh.
            </p>

            <input
              type="text"
              value={renameModal.newTitle}
              onChange={(e) => setRenameModal({ ...renameModal, newTitle: e.target.value })}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/40 text-[#111418] dark:text-white transition-all"
              placeholder="Nhập tên nhóm bài..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleRenameGroup();
                }
              }}
            />

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setRenameModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#617589] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isRenaming || !renameModal.newTitle.trim()}
                onClick={handleRenameGroup}
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isRenaming ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog: Gỡ bài khỏi lớp */}
      {confirmRemove && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[22px]">link_off</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111418] dark:text-white">Gỡ bài khỏi lớp?</h3>
                <p className="text-xs text-[#617589] mt-0.5">Thao tác này không thể hoàn tác.</p>
              </div>
            </div>

            <p className="text-sm text-[#617589] dark:text-gray-300 mb-5 bg-gray-50 dark:bg-gray-900 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
              Bạn có chắc muốn gỡ bài{' '}
              <span className="font-bold text-[#111418] dark:text-white">
                &ldquo;{confirmRemove.title}&rdquo;
              </span>{' '}
              khỏi lớp này không?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isRemoving}
                onClick={() => setConfirmRemove(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#617589] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isRemoving}
                onClick={handleRemoveAssignment}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                {isRemoving ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    Đang gỡ...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">link_off</span>
                    Xác nhận gỡ bài
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-emerald-500 text-white px-5 py-4 rounded-xl shadow-[0_8px_30px_rgb(16,185,129,0.3)] flex items-center gap-4 min-w-[320px] border border-white/20">
            <div className="flex-shrink-0 size-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[20px] font-bold">check</span>
            </div>
            <div className="flex-1 mr-2">
              <p className="text-sm font-bold">Thành công!</p>
              <p className="text-xs font-medium text-white/90">{toastMessage || 'Thao tác thành công!'}</p>
            </div>
            <button 
              onClick={() => setShowSuccessToast(false)}
              className="p-1 hover:bg-black/10 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
