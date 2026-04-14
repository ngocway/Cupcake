"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

import { AssignContentModal } from './AssignContentModal';
import { remindPendingSubmissions } from '../actions';

type Assignment = {
  id: string;
  title: string;
  materialType: 'EXERCISE' | 'READING' | 'FLASHCARD';
  deadline: string | null;
  isOpen: boolean;
  submittedCount: number;
  totalStudents: number;
  percentage: number;
};

const TYPE_CONFIG: Record<string, { icon: string; bgClass: string; textClass: string }> = {
  EXERCISE: { icon: 'quiz',       bgClass: 'bg-blue-50 dark:bg-blue-900/30',     textClass: 'text-primary' },
  READING:  { icon: 'headphones', bgClass: 'bg-orange-50 dark:bg-orange-900/30',  textClass: 'text-orange-600' },
  FLASHCARD:{ icon: 'edit_note',  bgClass: 'bg-purple-50 dark:bg-purple-900/30',  textClass: 'text-purple-600' },
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
}: {
  classId: string;
  onOpenCountChange?: (count: number) => void;
}) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'ended' | 'draft'>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isReminding, setIsReminding] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = assignments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'ongoing' && a.isOpen) ||
      (statusFilter === 'ended' && !a.isOpen) ||
      (statusFilter === 'draft' && false);
    return matchesSearch && matchesStatus;
  });
  
  const handleRemind = async (assignmentId: string) => {
    setOpenMenuId(null);
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

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#617589]">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
              className="block w-full rounded-xl border border-[#f0f2f4] dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none"
              placeholder="Tìm bài tập..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button 
          onClick={() => setShowAssignModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-primary/90 transition-all active:scale-95 shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Giao bài mới</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-[#f0f2f4] dark:border-gray-800">
        <button 
          onClick={() => setStatusFilter('all')}
          className={`pb-4 text-sm font-bold transition-colors ${statusFilter === 'all' ? 'text-primary border-b-2 border-primary' : 'text-[#617589] hover:text-primary'}`}>
          Tất cả
        </button>
        <button 
          onClick={() => setStatusFilter('ongoing')}
          className={`pb-4 text-sm font-bold transition-colors ${statusFilter === 'ongoing' ? 'text-primary border-b-2 border-primary' : 'text-[#617589] hover:text-primary'}`}>
          Đang diễn ra
        </button>
        <button 
          onClick={() => setStatusFilter('ended')}
          className={`pb-4 text-sm font-bold transition-colors ${statusFilter === 'ended' ? 'text-primary border-b-2 border-primary' : 'text-[#617589] hover:text-primary'}`}>
          Đã kết thúc
        </button>
        <button 
          onClick={() => setStatusFilter('draft')}
          className={`pb-4 text-sm font-bold transition-colors ${statusFilter === 'draft' ? 'text-primary border-b-2 border-primary' : 'text-[#617589] hover:text-primary'}`}>
          Bản nháp
        </button>
      </div>

      {/* Modal */}
      {showAssignModal && (
        <AssignContentModal 
          classId={classId} 
          onClose={() => setShowAssignModal(false)} 
          onAssigned={() => {
            fetchAssignments();
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
          }}
        />
      )}

      {/* Assignment Cards */}
      <div className="flex flex-col gap-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-[#f0f2f4] dark:border-gray-700 p-5 shadow-sm">
              <div className="flex flex-wrap md:flex-nowrap items-center gap-5">
                <div className="size-14 bg-gray-100 dark:bg-gray-700 rounded-2xl animate-pulse" />
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-36 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="w-full md:w-64 space-y-2">
                  <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-[#f0f2f4] dark:border-gray-700 rounded-2xl p-5 shadow-sm text-center py-16 text-[#617589]">
            <div className="flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-[40px] opacity-40">assignment</span>
              <p className="font-medium">
                {searchTerm || statusFilter !== 'all'
                  ? 'Không tìm thấy bài tập nào.'
                  : 'Chưa có bài tập nào được giao cho lớp này.'
                }
              </p>
            </div>
          </div>
        ) : (
          filtered.map((assignment) => {
            const config = TYPE_CONFIG[assignment.materialType] ?? TYPE_CONFIG.EXERCISE;
            return (
              <div
                key={assignment.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-[#f0f2f4] dark:border-gray-700 p-5 shadow-sm hover:border-primary/30 transition-all"
              >
                <div className="flex flex-wrap md:flex-nowrap items-center gap-5">
                  {/* Icon */}
                  <div className={`size-14 ${config.bgClass} ${config.textClass} rounded-2xl flex items-center justify-center shrink-0`}>
                    <span className="material-symbols-outlined text-3xl">{config.icon}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <h3 className="text-lg font-bold truncate">{assignment.title}</h3>
                      {assignment.isOpen ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0">
                          Đang mở
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 shrink-0">
                          Đã đóng
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-[#617589]">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                        <span>Hết hạn: {formatDeadline(assignment.deadline)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-green-600">
                        {assignment.submittedCount}/{assignment.totalStudents} đã nộp
                      </span>
                      <span className="text-[#617589]">{Math.round(assignment.percentage || 0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round(assignment.percentage || 0)}%` }}
                      />
                    </div>
                  </div>

                  {/* 3-dot menu */}
                  <div className="flex items-center justify-end shrink-0 relative" ref={openMenuId === assignment.id ? menuRef : undefined}>
                    <button
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-[#617589]"
                      onClick={() => setOpenMenuId(openMenuId === assignment.id ? null : assignment.id)}
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>

                    {openMenuId === assignment.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-[#f0f2f4] dark:border-gray-700 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-150">
                        <Link
                          href={`/teacher/classes/${classId}/assignments/${assignment.id}`}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-bold text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                        >
                          <span className="material-symbols-outlined text-[20px]">send</span>
                          Gửi bài
                        </Link>
                        <button className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                          <span className="material-symbols-outlined text-[20px] text-[#617589]">edit</span>
                          Chỉnh sửa
                        </button>
                        <button 
                          onClick={() => handleRemind(assignment.id)}
                          disabled={isReminding}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[20px] text-[#617589]">notifications</span>
                          Nhắc nhở
                        </button>
                        <button className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                          <span className="material-symbols-outlined text-[20px] text-[#617589]">schedule</span>
                          Gia hạn
                        </button>
                        <div className="my-1 border-t border-[#f0f2f4] dark:border-gray-700" />
                        <button className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left text-red-600">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-emerald-500 text-white px-5 py-4 rounded-xl shadow-[0_8px_30px_rgb(16,185,129,0.3)] flex items-center gap-4 min-w-[320px] border border-white/20">
            <div className="flex-shrink-0 size-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[20px] font-bold">check</span>
            </div>
            <div className="flex-1 mr-2">
              <p className="text-sm font-bold">Thành công!</p>
              <p className="text-xs font-medium text-white/90">{toastMessage || 'Giao bài tập thành công!'}</p>
            </div>
            <button 
              onClick={() => setShowSuccessToast(false)}
              className="p-1 hover:bg-black/10 rounded-lg transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
