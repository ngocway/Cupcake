"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MaterialStatus, MaterialType } from '@prisma/client';
import { syncAssignmentClasses, getTeacherClasses, updateMaterialStatus, unassignMaterialFromClass, duplicateMaterial, deleteMaterial } from '@/actions/material-actions';
import { AssignModal, ClassOption } from '@/components/quiz/AssignModal';
import { MaterialAnalyticsModal } from './MaterialAnalyticsModal';
import { useRouter } from 'next/navigation';

type Assignment = {
  id: string;
  title: string;
  status: MaterialStatus;
  materialType: MaterialType;
  subject: string | null;
  gradeLevel: string | null;
  thumbnail: string | null;
  questionCount: number;
  assignedCount: number;
  classes?: { 
    id: string; 
    name: string;
    startDate?: string | null;
    assignedAt?: string;
    dueDate?: string | null;
  }[];
  createdAt: string;
};

const STATUS_CONFIG: Record<MaterialStatus, { label: string; icon: string; className: string }> = {
  DRAFT: { label: 'BẢN NHÁP', icon: 'edit_note', className: 'badge-draft' },
  PUBLIC: { label: 'CÔNG KHAI', icon: 'public', className: 'bg-green-500/90 text-white' },
  PRIVATE: { label: 'RIÊNG TƯ', icon: 'lock', className: 'bg-gray-800/90 text-white' },
};

const TYPE_COLORS: Record<string, string> = {
  'Toán học': 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'Tiếng Anh': 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Ngữ Văn': 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  'Khoa học': 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  'Lịch sử': 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showClassesPopup, setShowClassesPopup] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState<ClassOption[]>([]);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const handleSyncClasses = async (data: any) => {
    try {
      await syncAssignmentClasses(assignment.id, data);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Lỗi khi giao bài.');
    }
  };

  const handleUnassign = async (classId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy giao bài cho lớp này?')) return;
    try {
      await unassignMaterialFromClass(assignment.id, classId);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi hủy giao bài');
    }
  };

  const handleStatusChange = async (newStatus: MaterialStatus) => {
    if (newStatus === assignment.status) {
      setIsMenuOpen(false);
      return;
    }
    try {
      await updateMaterialStatus(assignment.id, newStatus);
      setIsMenuOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const openAssignModal = async () => {
    if (assignment.status === 'DRAFT') {
      alert('Không thể giao bài tập đang ở trạng thái Bản nháp. Vui lòng chuyển sang trạng thái Riêng tư hoặc Công khai trước khi giao bài.');
      return;
    }
    try {
      const classes = await getTeacherClasses();
      setTeacherClasses(classes);
      setIsAssignModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('Không thể tải danh sách lớp học.');
    }
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowClassesPopup(false);
      }
    };
    if (isMenuOpen || showClassesPopup) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMenuOpen, showClassesPopup]);

  const status = STATUS_CONFIG[assignment.status] || STATUS_CONFIG.DRAFT;
  const dateStr = new Date(assignment.createdAt).toLocaleDateString('vi-VN');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group border border-transparent hover:border-primary/20 flex flex-col">
      {/* Thumbnail Area */}
      <div 
        className="relative aspect-video bg-cover bg-center bg-[#f0f2f4] dark:bg-gray-700 flex items-center justify-center overflow-hidden" 
        style={assignment.thumbnail ? { backgroundImage: `url("${assignment.thumbnail}")` } : undefined}
      >
        {!assignment.thumbnail && (
          <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-gray-500">
            <span className="material-symbols-outlined text-[48px]">quiz</span>
          </div>
        )}
        {assignment.thumbnail && !assignment.thumbnail.includes('dicebear.com') && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <div className={`${status.className} backdrop-blur-md text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm`}>
            <span className="material-symbols-outlined text-[12px]">{status.icon}</span> 
            {status.label}
          </div>
          <div className="relative" ref={isMenuOpen ? menuRef : undefined}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="size-8 bg-white/95 backdrop-blur rounded-lg flex items-center justify-center text-[#111418] shadow-sm hover:bg-white transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-700 rounded-xl shadow-xl border border-[#f0f2f4] dark:border-gray-600 py-1 z-30 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                <div className="px-4 py-2 border-b border-[#f0f2f4] dark:border-gray-600 bg-slate-50/50 dark:bg-gray-800/50">
                  <span className="text-[10px] font-bold text-[#617589] uppercase tracking-wider">Trạng thái</span>
                </div>
                <button 
                  onClick={() => handleStatusChange('DRAFT')}
                  disabled={assignment.assignedCount > 0}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between gap-2 ${
                    assignment.status === 'DRAFT' 
                      ? 'text-primary font-bold' 
                      : (assignment.assignedCount > 0 ? 'text-slate-300 cursor-not-allowed opacity-50' : 'hover:bg-[#f0f2f4] dark:hover:bg-gray-600')
                  }`}
                  title={assignment.assignedCount > 0 ? "Không thể chuyển về Bản nháp khi bài tập đang được giao cho lớp" : ""}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">edit_note</span> Bản nháp
                  </span>
                  {assignment.assignedCount > 0 && <span className="material-symbols-outlined text-[14px]">lock</span>}
                </button>
                <button 
                  onClick={() => handleStatusChange('PRIVATE')}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${assignment.status === 'PRIVATE' ? 'text-primary font-bold' : 'hover:bg-[#f0f2f4] dark:hover:bg-gray-600'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">lock</span> Riêng tư
                </button>
                <button 
                  onClick={() => handleStatusChange('PUBLIC')}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${assignment.status === 'PUBLIC' ? 'text-primary font-bold' : 'hover:bg-[#f0f2f4] dark:hover:bg-gray-600'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">public</span> Công khai
                </button>
                
                <div className="h-[1px] bg-[#f0f2f4] dark:bg-gray-600 my-1"></div>
                
                <div className="px-4 py-1.5 bg-slate-50/30 dark:bg-gray-800/30">
                  <span className="text-[10px] font-bold text-[#617589] uppercase tracking-wider">Thao tác</span>
                </div>
                <Link 
                  href={`/student/assignments/${assignment.id}/run`}
                  target="_blank"
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[#f0f2f4] dark:hover:bg-gray-600 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span> Xem trước
                </Link>
                <button 
                  onClick={() => {
                    duplicateMaterial(assignment.id).then(newId => router.push(`/teacher/materials/${newId}/edit`));
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[#f0f2f4] dark:hover:bg-gray-600 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">content_copy</span> Nhân bản
                </button>
                <button 
                  onClick={() => router.push(`/student/assignments/${assignment.id}/run?direct=true`)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[#f0f2f4] dark:hover:bg-gray-600 flex items-center gap-2 text-indigo-600 font-semibold"
                >
                  <span className="material-symbols-outlined text-[18px]">school</span> Học ngay
                </button>
                <Link 
                  href={`/teacher/materials/${assignment.id}/edit`}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[#f0f2f4] dark:hover:bg-gray-600 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span> Chỉnh sửa
                </Link>
                <button 
                  onClick={() => {
                    setShowAnalyticsModal(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[#f0f2f4] dark:hover:bg-gray-600 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">analytics</span> Thống kê
                </button>
                <button 
                  onClick={async () => {
                    if (confirm('Bạn có chắc chắn muốn xóa bài tập này?')) {
                      await deleteMaterial(assignment.id);
                      router.refresh();
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span> Xóa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-bold text-lg leading-snug line-clamp-1 group-hover:text-primary transition-colors">
            {assignment.title}
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {assignment.subject && (
              <span className={`px-2 py-0.5 ${TYPE_COLORS[assignment.subject] || 'bg-gray-100 text-gray-600'} text-[11px] font-semibold rounded-full`}>
                {assignment.subject}
              </span>
            )}
            {assignment.gradeLevel && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-[11px] font-semibold rounded-full">
                {assignment.gradeLevel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-3 text-sm text-[#617589]">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">quiz</span> {assignment.questionCount} câu hỏi
            </div>
            {assignment.assignedCount > 0 && (
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowClassesPopup(!showClassesPopup);
                  }}
                  className="flex items-center gap-1 text-primary font-semibold hover:bg-primary/5 px-1.5 py-0.5 rounded transition-colors group/popup"
                >
                  <span className="material-symbols-outlined text-[16px] group-hover/popup:animate-pulse">overview</span> {assignment.assignedCount} lớp
                </button>

                    {showClassesPopup && (
                      <div 
                        ref={popupRef}
                        className="absolute bottom-full left-0 mb-4 w-[380px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-gray-700 overflow-hidden z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 text-primary p-2 rounded-lg">
                              <span className="material-symbols-outlined">assignment_turned_in</span>
                            </div>
                            <h2 className="text-base font-bold text-slate-800 dark:text-gray-100">Quản lý giao bài</h2>
                          </div>
                          <button 
                            onClick={() => setShowClassesPopup(false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition-colors p-1"
                          >
                            <span className="material-symbols-outlined text-[20px]">close</span>
                          </button>
                        </div>

                        {/* Content List */}
                        <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                          {assignment.classes?.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-sm">
                              Chưa có lớp học nào.
                            </div>
                          ) : (
                            assignment.classes?.map((cls, idx) => (
                              <React.Fragment key={cls.id}>
                                <div className="group flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-gray-600">
                                  <div className="flex items-center gap-3.5">
                                    <div className="size-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
                                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-slate-900 dark:text-gray-100 leading-tight">{cls.name}</span>
                                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
                                        {cls.startDate && (
                                          <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                                            <span className="material-symbols-outlined text-[13px]">play_circle</span>
                                            Bắt đầu: {new Date(cls.startDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                                          </div>
                                        )}
                                        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-gray-400">
                                          <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                                          Giao: {cls.assignedAt ? new Date(cls.assignedAt).toLocaleDateString('vi-VN') : '---'}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-medium text-red-500">
                                          <span className="material-symbols-outlined text-[13px]">alarm</span>
                                          Hạn: {cls.dueDate ? new Date(cls.dueDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'Không có'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => handleUnassign(cls.id)}
                                    className="px-2.5 py-1.5 border border-red-200 dark:border-red-900/30 text-red-500 text-[11px] font-bold rounded-lg hover:bg-red-500 hover:text-white dark:hover:bg-red-600 transition-all"
                                  >
                                    Hủy giao
                                  </button>
                                </div>
                                {idx < (assignment.classes?.length || 0) - 1 && (
                                  <div className="mx-4 border-b border-slate-50 dark:border-gray-700/50"></div>
                                )}
                              </React.Fragment>
                            ))
                          )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 bg-slate-50 dark:bg-gray-800/50 border-t border-slate-100 dark:border-gray-700 flex gap-2">
                          <button 
                            onClick={() => setShowClassesPopup(false)}
                            className="flex-1 py-2 px-4 bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300 font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-gray-600 transition-colors uppercase tracking-wide text-[10px]"
                          >
                            Đóng
                          </button>
                          <button 
                            onClick={() => {
                              setShowClassesPopup(false);
                              openAssignModal();
                            }}
                            className="flex-1 py-2 px-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-md shadow-primary/20 transition-colors uppercase tracking-wide text-[10px] flex items-center justify-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[16px]">add_circle</span>
                            Giao mới
                          </button>
                        </div>
                      </div>
                    )}
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span> {dateStr}
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-3 border-t border-[#f0f2f4] dark:border-gray-700">
          <button 
            onClick={openAssignModal}
            className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-bold transition-all shadow-sm ${
              assignment.status === 'DRAFT'
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">assignment</span>
            Giao bài
          </button>
          <Link 
            href={`/teacher/materials/${assignment.id}/edit`}
            className="size-9 flex items-center justify-center border border-[#f0f2f4] dark:border-gray-700 rounded-lg hover:bg-[#f0f2f4] dark:hover:bg-gray-700 transition-colors text-[#617589]"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </Link>
        </div>
      </div>
      {/* Modals */}
      <AssignModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={handleSyncClasses}
        classes={teacherClasses}
        initialSelectedIds={assignment.classes?.map(c => c.id) || []}
      />
      <MaterialAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        assignmentId={assignment.id}
        title={assignment.title}
      />
    </div>
  );
}
