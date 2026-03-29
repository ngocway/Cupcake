"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MaterialStatus, MaterialType } from '@prisma/client';
import { duplicateMaterial, deleteMaterial, syncAssignmentClasses, getTeacherClasses, updateMaterialStatus, unassignMaterialFromClass } from '@/actions/material-actions';
import { useRouter } from 'next/navigation';
import { AssignModal, ClassOption } from '@/components/quiz/AssignModal';

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

const STATUS_CONFIG: Record<MaterialStatus, { label: string; className: string }> = {
  DRAFT: { label: 'BẢN NHÁP', className: 'badge-draft' },
  PUBLIC: { label: 'CÔNG KHAI', className: 'bg-green-500 text-white' },
  PRIVATE: { label: 'RIÊNG TƯ', className: 'bg-gray-500 text-white' },
};

const SUBJECT_CONFIG: Record<string, string> = {
  'Toán học': 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'Tiếng Anh': 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Ngữ Văn': 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  'Khoa học': 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  'Lịch sử': 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export function MaterialListItem({ 
  assignment, 
  onDelete, 
  onRefresh 
}: { 
  assignment: Assignment, 
  onDelete: () => void,
  onRefresh?: () => void
}) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClassesPopup, setShowClassesPopup] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState<ClassOption[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

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

  const handleEdit = () => {
    if (assignment.assignedCount > 0) {
      alert('Không thể chỉnh sửa bài tập đã được giao cho lớp học. Vui lòng gỡ bài tập khỏi lớp học trước khi sửa.');
      return;
    }
    router.push(`/teacher/materials/${assignment.id}/edit`);
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    setShowDeleteModal(false);
    try {
      await deleteMaterial(assignment.id);
      setIsMenuOpen(false);
      onDelete();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa bài tập');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnassign = async (classId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy giao bài cho lớp này?')) return;
    setIsProcessing(true);
    try {
      await unassignMaterialFromClass(assignment.id, classId);
      if (onRefresh) onRefresh();
      else router.refresh();
      // Keep popup open for a moment or let refresh handle it
    } catch (err: any) {
      alert(err.message || 'Lỗi khi hủy giao bài');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncClasses = async (data: any) => {
    try {
      await syncAssignmentClasses(assignment.id, data);
      if (onRefresh) onRefresh();
      else router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Lỗi khi giao bài.');
    }
  };

  const handleStatusChange = async (newStatus: MaterialStatus) => {
    if (newStatus === assignment.status) {
      setIsMenuOpen(false);
      return;
    }
    setIsProcessing(true);
    try {
      await updateMaterialStatus(assignment.id, newStatus);
      setIsMenuOpen(false);
      if (onRefresh) onRefresh();
      else router.refresh();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật trạng thái');
    } finally {
      setIsProcessing(false);
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

  const handleDuplicate = async () => {
    setIsProcessing(true);
    try {
      const newId = await duplicateMaterial(assignment.id);
      setIsMenuOpen(false);
      router.push(`/teacher/materials/${newId}/edit`);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi nhân bản');
    } finally {
      setIsProcessing(false);
    }
  };

  const status = STATUS_CONFIG[assignment.status] || STATUS_CONFIG.DRAFT;
  const dateStr = new Date(assignment.createdAt).toLocaleDateString('vi-VN');

  return (
    <>
      <div className={`bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-md hover:border-primary/40 hover:shadow-lg transition-all group flex flex-col gap-4 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 
                onClick={handleEdit}
                className="font-bold text-lg text-[#111418] dark:text-white truncate group-hover:text-primary transition-colors cursor-pointer"
              >
                {assignment.title}
              </h3>
              <span className={`${status.className} text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 uppercase`}>
                {status.label}
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              {assignment.subject && (
                <span className={`px-2 py-0.5 ${SUBJECT_CONFIG[assignment.subject] || 'bg-gray-100 text-gray-600'} text-[11px] font-semibold rounded-full`}>
                  {assignment.subject}
                </span>
              )}
              {assignment.gradeLevel && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-[11px] font-semibold rounded-full">
                  {assignment.gradeLevel}
                </span>
              )}
            </div>
          </div>
          <div className="relative group/menu shrink-0" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="size-8 flex items-center justify-center rounded-lg hover:bg-[#f0f2f4] dark:hover:bg-gray-700 transition-colors text-[#617589]"
            >
              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-700 rounded-xl shadow-xl border border-[#f0f2f4] dark:border-gray-600 py-1 z-20 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
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
                  title={assignment.assignedCount > 0 ? "Không thể chuyển về Bản nháp khi bài tập đang được giao" : ""}
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
                  onClick={handleDuplicate}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[#f0f2f4] dark:hover:bg-gray-600 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">content_copy</span> Nhân bản
                </button>
                <button 
                  onClick={handleEdit}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[#f0f2f4] dark:hover:bg-gray-600 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span> Chỉnh sửa
                </button>
                <button 
                  onClick={() => {
                    setShowDeleteModal(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span> Xóa
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#f0f2f4] dark:border-gray-700/50">
          <div className="flex items-center gap-3 text-sm text-[#617589]">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">quiz</span> {assignment.questionCount}
            </div>
            
            {assignment.assignedCount > 0 && (
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowClassesPopup(!showClassesPopup);
                  }}
                  className="flex items-center gap-1 text-primary font-semibold hover:bg-primary/5 px-1.5 py-0.5 rounded transition-colors group/popup text-[13px]"
                >
                  <span className="material-symbols-outlined text-[16px] group-hover/popup:animate-pulse">overview</span> 
                  <span>{assignment.assignedCount} lớp</span>
                </button>

                {showClassesPopup && (
                  <div 
                    ref={popupRef}
                    className="absolute bottom-full left-0 mb-4 w-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-gray-700 overflow-hidden z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary p-2 rounded-lg">
                          <span className="material-symbols-outlined">assignment_turned_in</span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-gray-100">Quản lý giao bài</h2>
                      </div>
                      <button 
                        onClick={() => setShowClassesPopup(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition-colors p-1"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    {/* Content List */}
                    <div className="p-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                      {assignment.classes?.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          Chưa có lớp học nào được giao bài tập này.
                        </div>
                      ) : (
                        assignment.classes?.map((cls, idx) => (
                          <React.Fragment key={cls.id}>
                            <div className="group flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-gray-600">
                              <div className="flex items-center gap-4">
                                <div className="size-11 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
                                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[15px] font-bold text-slate-900 dark:text-gray-100 leading-tight">{cls.name}</span>
                                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 min-h-[16px]">
                                    {cls.startDate && (
                                      <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                                        <span className="material-symbols-outlined text-[14px]">play_circle</span>
                                        Bắt đầu: {new Date(cls.startDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-gray-400">
                                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                      Giao: {cls.assignedAt ? new Date(cls.assignedAt).toLocaleDateString('vi-VN') : '---'}
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] font-medium text-red-500">
                                      <span className="material-symbols-outlined text-[14px]">alarm</span>
                                      Hạn: {cls.dueDate ? new Date(cls.dueDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'Không có'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleUnassign(cls.id)}
                                className="px-3 py-1.5 border border-red-200 dark:border-red-900/30 text-red-500 text-[12px] font-bold rounded-lg hover:bg-red-500 hover:text-white dark:hover:bg-red-600 transition-all"
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
                    <div className="p-4 bg-slate-50 dark:bg-gray-800/50 border-t border-slate-100 dark:border-gray-700 flex gap-3">
                      <button 
                        onClick={() => setShowClassesPopup(false)}
                        className="flex-1 py-1.5 px-4 bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300 font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-gray-600 transition-colors uppercase tracking-wide text-[10px]"
                      >
                        Đóng
                      </button>
                      <button 
                        onClick={() => {
                          setShowClassesPopup(false);
                          openAssignModal();
                        }}
                        className="flex-1 py-1.5 px-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-md shadow-primary/20 transition-colors uppercase tracking-wide text-[10px] flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">add_circle</span>
                        Giao cho lớp mới
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span> {dateStr}
            </div>
          </div>
          <button 
            onClick={openAssignModal}
            className="bg-primary text-white h-9 px-4 rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"
          >
            Giao bài
          </button>
        </div>
      </div>

      {/* Custom Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="size-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[32px]">delete_forever</span>
              </div>
              <h3 className="text-xl font-bold text-[#111418] dark:text-white mb-2">Xóa bài tập?</h3>
              <p className="text-[#617589] dark:text-gray-400 text-sm">
                Bạn có chắc chắn muốn chuyển bài tập <strong className="text-[#111418] dark:text-white">"{assignment.title}"</strong> vào thùng rác? 
                {assignment.assignedCount > 0 && <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">Lưu ý: Bài tập này đang được giao cho {assignment.assignedCount} lớp. Việc xóa sẽ làm bài tập này không còn hiển thị với học sinh.</span>}
                <span className="block mt-2">Bạn có thể khôi phục lại bài tập này trong mục Thùng rác.</span>
              </p>
            </div>
            <div className="flex border-t border-[#f0f2f4] dark:border-gray-700">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-4 text-sm font-bold text-[#617589] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isProcessing}
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 px-4 py-4 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-l border-[#f0f2f4] dark:border-gray-700 flex items-center justify-center gap-2"
                disabled={isProcessing}
              >
                {isProcessing ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modals */}
      <AssignModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={handleSyncClasses}
        classes={teacherClasses}
        initialSelectedIds={assignment.classes?.map(c => c.id) || []}
      />
    </>
  );
}
