"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { MaterialStatus, MaterialType } from '@/generated/client';
import { duplicateMaterial, deleteMaterial, syncAssignmentClasses, getTeacherClasses, updateMaterialStatus, unassignMaterialFromClass, restoreMaterial, permanentlyDeleteMaterial } from '@/actions/material-actions';
import { useRouter } from 'next/navigation';
import { AssignModal, ClassOption } from '@/components/quiz/AssignModal';
import { MaterialAnalyticsModal } from './MaterialAnalyticsModal';
import {
  Check, Edit2, FileEdit, Lock, Globe, MoreHorizontal, Eye, Copy, 
  GraduationCap, Edit, LineChart, Trash2, HelpCircle, 
  CheckCircle, List, Users, PlayCircle, Calendar, Clock, 
  PlusCircle, RefreshCw, Send, X, Link2
} from 'lucide-react';
import { toast } from 'sonner';

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
  viewCount: number;
  publicSubmissionCount: number;
  tags: string[];
  classes?: { 
    id: string; 
    name: string;
    startDate?: string | null;
    assignedAt?: string;
    dueDate?: string | null;
  }[];
  createdAt: string;
  lessonId?: string;
  targetAudiences?: string[];
};

const STATUS_CONFIG: Record<MaterialStatus, { label: string; icon: any; className: string }> = {
  DRAFT: { label: 'BẢN NHÁP', icon: FileEdit, className: 'badge-draft' },
  PUBLIC: { label: 'CÔNG KHAI', icon: Globe, className: 'bg-green-500 text-white' },
  PRIVATE: { label: 'RIÊNG TƯ', icon: Lock, className: 'bg-gray-500 text-white' },
};

const SUBJECT_CONFIG: Record<string, string> = {
  'Toán học': 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'Tiếng Anh': 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Ngữ Văn': 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  'Khoa học': 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  'Lịch sử': 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const AUDIENCE_CONFIG: Record<string, { label: string; className: string }> = {
  kids:     { label: 'Kid',      className: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  teens:    { label: 'Teen',     className: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
  adults:   { label: 'Adult',    className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  business: { label: 'Business', className: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

export function MaterialListItem({ 
  assignment, 
  onDelete, 
  onEdit,
  onUpdate,
  onRefresh,
  isTrash,
  selected,
  onSelect
}: { 
  assignment: Assignment, 
  onDelete: () => void,
  onEdit?: (id: string) => void,
  onUpdate?: (assignment: Assignment) => void,
  onRefresh?: () => void,
  isTrash?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClassesPopup, setShowClassesPopup] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState<ClassOption[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; left: number }>({ top: 0, left: 0 });

  const updateMenuPos = useCallback(() => {
    if (menuBtnRef.current) {
      const rect = menuBtnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const menuHeight = 350; // Ước lượng chiều cao menu

      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        // Mở ngược lên trên
        setMenuPos({
          bottom: window.innerHeight - rect.top + 8,
          left: rect.right - 192,
        });
      } else {
        // Mở xuống dưới
        setMenuPos({
          top: rect.bottom + 8,
          left: rect.right - 192,
        });
      }
    }
  }, []);

  const handleShare = () => {
    const path = assignment.lessonId 
      ? `/public/lessons/${assignment.lessonId}` 
      : `/public/assignments/${assignment.id}`;
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
    toast.success(assignment.lessonId ? 'Đã sao chép đường dẫn bài học' : 'Đã sao chép đường dẫn bài tập');
    setIsMenuOpen(false);
  };

  const handleRestore = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsProcessing(true);
    try {
      await restoreMaterial(assignment.id);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi khôi phục bài tập');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePermanentDelete = async () => {
    setIsProcessing(true);
    setShowDeleteModal(false);
    try {
      await permanentlyDeleteMaterial(assignment.id);
      if (onDelete) onDelete();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa vĩnh viễn');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      // Check if click is outside both the trigger button area and the portal dropdown
      if (isMenuOpen) {
        const isInsideBtn = menuRef.current?.contains(target);
        const isInsideDropdown = menuDropdownRef.current?.contains(target);
        if (!isInsideBtn && !isInsideDropdown) {
          setIsMenuOpen(false);
        }
      }
      if (popupRef.current && !popupRef.current.contains(target)) {
        setShowClassesPopup(false);
      }
    };
    if (isMenuOpen || showClassesPopup) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMenuOpen, showClassesPopup]);

  // Recalculate menu position on scroll/resize when open
  useEffect(() => {
    if (!isMenuOpen) return;
    updateMenuPos();
    const handleScrollOrResize = () => updateMenuPos();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isMenuOpen, updateMenuPos]);

  const handleEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (isTrash) {
      alert('Không thể chỉnh sửa bài tập trong thùng rác. Vui lòng khôi phục trước.');
      return;
    }
    
    if (onEdit) {
      onEdit(assignment.id);
    } else {
      const typeMap: Record<string, string> = {
        'EXERCISE': 'quiz',
        'READING': 'reading',
        'FLASHCARD': 'flashcard'
      };
      const typeParam = typeMap[assignment.materialType] || 'quiz';
      router.push(`/teacher/materials/${assignment.id}/edit?type=${typeParam}`);
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  const handleUnassign = async (classId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  const handleStatusChange = async (newStatus: MaterialStatus, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (newStatus === assignment.status) {
      setIsMenuOpen(false);
      return;
    }
    setIsProcessing(true);
    try {
      await updateMaterialStatus(assignment.id, newStatus);
      setIsMenuOpen(false);
      if (onUpdate) {
        onUpdate({ ...assignment, status: newStatus });
      }
      if (onRefresh) onRefresh();
      else router.refresh();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật trạng thái');
    } finally {
      setIsProcessing(false);
    }
  };

  const openAssignModal = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  const handleDuplicate = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsProcessing(true);
    try {
      const newId = await duplicateMaterial(assignment.id);
      setIsMenuOpen(false);
      if (onEdit) {
        onEdit(newId);
      } else {
        router.push(`/teacher/materials/${newId}/edit`);
      }
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
      <div 
        onClick={() => handleEdit()}
        className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-0 rounded-2xl border transition-all group flex flex-col relative overflow-visible ${
          selected 
            ? 'border-primary ring-2 ring-primary/10 shadow-lg' 
            : 'border-slate-200 dark:border-gray-700 shadow-md hover:border-primary/40 hover:shadow-lg'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* Selection Checkbox */}
        <div className={`absolute top-4 left-4 z-20 transition-all duration-200 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(assignment.id);
            }}
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
              selected 
                ? 'bg-primary border-primary text-white' 
                : 'bg-white/90 border-slate-300 text-transparent'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3px]" />
          </button>
        </div>
        
        <div className="p-4 flex flex-col h-full">
          <div className="flex gap-4">
            <div 
              onClick={(e) => { e.stopPropagation(); handleEdit(); }}
              className="w-[120px] h-[90px] rounded-xl bg-slate-100/50 dark:bg-slate-700/50 overflow-hidden flex-shrink-0 cursor-pointer border border-slate-200/60 dark:border-slate-700 relative group/thumb"
            >
              <img 
                src={assignment.thumbnail || `https://api.dicebear.com/7.x/identicon/svg?seed=${assignment.id}&backgroundColor=f0f2f4`} 
                alt={assignment.title}
                className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-all">
                <Edit2 className="text-white w-5 h-5 stroke-[2px]" />
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`${status.className} text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wider flex items-center gap-1`}>
                      <status.icon className="w-2.5 h-2.5" />
                      {status.label}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                      <span className="flex items-center gap-1" title="Số câu hỏi"><HelpCircle className="w-3 h-3" />{assignment.questionCount}</span>
                      <span className="flex items-center gap-1" title="Lượt xem"><Eye className="w-3 h-3" />{assignment.viewCount || 0}</span>
                      <span className="flex items-center gap-1" title="Lượt làm bài"><CheckCircle className="w-3 h-3" />{assignment.publicSubmissionCount || 0}</span>
                    </div>
                  </div>
                  <h3 
                    onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                    className="font-extrabold text-base text-[#111418] dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors cursor-pointer"
                    title={assignment.title}
                  >
                    {assignment.title}
                  </h3>
                  {/* Audience badges */}
                  {assignment.targetAudiences && assignment.targetAudiences.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {assignment.targetAudiences.map(aud => {
                        const cfg = AUDIENCE_CONFIG[aud];
                        if (!cfg) return null;
                        return (
                          <span key={aud} className={`${cfg.className} text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider`}>
                            {cfg.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                {!isTrash && (
                  <div className="relative group/menu shrink-0 -mt-1 -mr-1" ref={menuRef}>
                    <button 
                      ref={menuBtnRef}
                      onClick={(e) => { e.stopPropagation(); updateMenuPos(); setIsMenuOpen(!isMenuOpen); }}
                      className="size-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {isMenuOpen && typeof document !== 'undefined' && createPortal(
                      <div 
                        ref={menuDropdownRef}
                        className="fixed w-48 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-xl shadow-xl border border-[#f0f2f4] dark:border-slate-600 py-1 z-[9999] animate-in fade-in zoom-in-95 duration-100 overflow-y-auto max-h-[80vh]"
                        style={{ 
                          ...(menuPos.top !== undefined ? { top: menuPos.top } : { bottom: menuPos.bottom }), 
                          left: menuPos.left 
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-4 py-2 border-b border-[#f0f2f4] dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50">
                          <span className="text-[10px] font-bold text-[#617589] uppercase tracking-wider">Trạng thái</span>
                        </div>
                        <button 
                          onClick={(e) => handleStatusChange('DRAFT', e)}
                          disabled={assignment.assignedCount > 0}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between gap-2 ${
                            assignment.status === 'DRAFT' 
                              ? 'text-primary font-bold' 
                              : (assignment.assignedCount > 0 ? 'text-slate-300 cursor-not-allowed opacity-50' : 'hover:bg-[#f0f2f4] dark:hover:bg-gray-600')
                          }`}
                          title={assignment.assignedCount > 0 ? "Không thể chuyển về Bản nháp khi bài tập đang được giao" : ""}
                        >
                          <span className="flex items-center gap-2">
                            <FileEdit className="w-[18px] h-[18px]" /> Bản nháp
                          </span>
                          {assignment.assignedCount > 0 && <Lock className="w-[14px] h-[14px]" />}
                        </button>
                        <button 
                          onClick={(e) => handleStatusChange('PRIVATE', e)}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${assignment.status === 'PRIVATE' ? 'text-primary font-bold' : 'hover:bg-[#f0f2f4] dark:hover:bg-gray-600'}`}
                        >
                          <Lock className="w-[18px] h-[18px]" /> Riêng tư
                        </button>
                        <button 
                          onClick={(e) => handleStatusChange('PUBLIC', e)}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${assignment.status === 'PUBLIC' ? 'text-primary font-bold' : 'hover:bg-[#f0f2f4] dark:hover:bg-gray-600'}`}
                        >
                          <Globe className="w-[18px] h-[18px]" /> Công khai
                        </button>
                        
                        <div className="h-[1px] bg-[#f0f2f4] dark:bg-gray-600 my-1"></div>
                        
                        <div className="px-4 py-1.5 bg-slate-50/30 dark:bg-gray-800/30">
                          <span className="text-[10px] font-bold text-[#617589] uppercase tracking-wider">Thao tác</span>
                        </div>
                        <Link 
                          href={assignment.lessonId ? `/student/lessons/${assignment.lessonId}` : `/student/assignments/${assignment.id}/run`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-[#f0f2f4] dark:hover:bg-gray-600 flex items-center gap-2"
                        >
                          <Eye className="w-[18px] h-[18px]" /> Xem trước
                        </Link>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleShare(); }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-[#f0f2f4] dark:hover:bg-gray-600 flex items-center gap-2"
                        >
                          <Link2 className="w-[18px] h-[18px]" /> Chia sẻ
                        </button>
                        <button 
                          onClick={handleDuplicate}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-[#f0f2f4] dark:hover:bg-gray-600 flex items-center gap-2"
                        >
                          <Copy className="w-[18px] h-[18px]" /> Nhân bản
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const url = assignment.lessonId ? `/student/lessons/${assignment.lessonId}` : `/student/assignments/${assignment.id}/run?direct=true`;
                            router.push(url); 
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-[#f0f2f4] dark:hover:bg-gray-600 flex items-center gap-2 text-indigo-600 font-semibold"
                        >
                          <GraduationCap className="w-[18px] h-[18px]" /> Học ngay
                        </button>
                        <button 
                          onClick={handleEdit}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-[#f0f2f4] dark:hover:bg-gray-600 flex items-center gap-2"
                        >
                          <Edit className="w-[18px] h-[18px]" /> Chỉnh sửa
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAnalyticsModal(true);
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-[#f0f2f4] dark:hover:bg-gray-600 flex items-center gap-2"
                        >
                          <LineChart className="w-[18px] h-[18px]" /> Thống kê
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteModal(true);
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <Trash2 className="w-[18px] h-[18px]" /> Xóa
                        </button>
                      </div>,
                      document.body
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-end justify-between mt-auto pt-2">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {dateStr}
                    </span>
                    {assignment.assignedCount > 0 && (
                      <div className="relative">
                        <span className="text-slate-300 mx-0.5">•</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowClassesPopup(!showClassesPopup); }}
                          className="flex items-center gap-1 text-primary font-bold hover:underline"
                        >
                          <List className="w-3 h-3" /> Giao cho {assignment.assignedCount} lớp
                        </button>
                        {showClassesPopup && (
                          <div 
                            ref={popupRef}
                            className="absolute bottom-full left-0 mb-4 w-[400px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-gray-700">
                              <div className="flex items-center gap-3">
                                <div className="bg-primary/10 text-primary p-2 rounded-lg">
                                  <CheckCircle className="w-6 h-6" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-gray-100">Quản lý giao bài</h2>
                              </div>
                              <button 
                                onClick={() => setShowClassesPopup(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition-colors p-1"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

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
                                          <Users className="w-6 h-6 stroke-[2.5px]" />
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-[15px] font-bold text-slate-900 dark:text-gray-100 leading-tight">{cls.name}</span>
                                          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 min-h-[16px]">
                                            {cls.startDate && (
                                              <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                                                <PlayCircle className="w-[14px] h-[14px]" />
                                                Bắt đầu: {new Date(cls.startDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                                              </div>
                                            )}
                                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-gray-400">
                                              <Calendar className="w-[14px] h-[14px]" />
                                              Giao: {cls.assignedAt ? new Date(cls.assignedAt).toLocaleDateString('vi-VN') : '---'}
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px] font-medium text-red-500">
                                              <Clock className="w-[14px] h-[14px]" />
                                              Hạn: {cls.dueDate ? new Date(cls.dueDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'Không có'}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <button 
                                        onClick={(e) => handleUnassign(cls.id, e)}
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
                                <PlusCircle className="w-4 h-4" />
                                Giao cho lớp mới
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center flex-wrap gap-1.5">
                    {Array.isArray(assignment.tags) && assignment.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold rounded">
                         #{tag}
                      </span>
                    ))}
                    {assignment.tags?.length > 2 && (
                      <span className="text-[10px] text-slate-400 font-bold px-1">+{assignment.tags.length - 2}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isTrash ? (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }}
                        className="size-7 rounded-md border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center shadow-sm"
                        title="Xóa vĩnh viễn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={handleRestore}
                        className="bg-emerald-600 dark:bg-emerald-700 text-white h-7 px-2.5 rounded-md text-[11px] font-bold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Khôi phục
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          const url = assignment.lessonId ? `/student/lessons/${assignment.lessonId}` : `/student/assignments/${assignment.id}/run?direct=true`;
                          router.push(url);
                        }}
                        className="h-7 px-2.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        Học thử
                      </button>
                      <button 
                        onClick={openAssignModal}
                        className="h-7 px-3 rounded-md text-[11px] font-bold bg-primary text-white hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm shadow-primary/20"
                      >
                        <Send className="w-3 h-3" />
                        Giao bài
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="size-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6">
                <Trash2 className="w-8 h-8 stroke-[2px]" />
              </div>
              <h3 className="text-xl font-bold text-[#111418] dark:text-white mb-2">{isTrash ? 'Xóa vĩnh viễn?' : 'Xóa bài tập?'}</h3>
              <p className="text-[#617589] dark:text-gray-400 text-sm">
                {isTrash ? (
                  <>Hành động này sẽ xóa vĩnh viễn bài tập <strong className="text-[#111418] dark:text-white">"{assignment.title}"</strong> và không thể khôi phục lại.</>
                ) : (
                  <>Bạn có chắc chắn muốn chuyển bài tập <strong className="text-[#111418] dark:text-white">"{assignment.title}"</strong> vào thùng rác?</>
                )}
                {assignment.assignedCount > 0 && !isTrash && (
                  <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">
                    Lưu ý: Bài tập này đang được giao cho {assignment.assignedCount} lớp. Việc xóa sẽ làm bài tập này không còn hiển thị với học sinh.
                  </span>
                )}
                {!isTrash && <span className="block mt-2">Bạn có thể khôi phục lại bài tập này trong mục Thùng rác.</span>}
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
                onClick={isTrash ? handlePermanentDelete : handleDelete}
                className="flex-1 px-4 py-4 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-l border-[#f0f2f4] dark:border-gray-700 flex items-center justify-center gap-2"
                disabled={isProcessing}
              >
                {isProcessing ? 'Đang lý...' : (isTrash ? 'Xác nhận xóa vĩnh viễn' : 'Xác nhận xóa')}
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

      <MaterialAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        assignmentId={assignment.id}
        title={assignment.title}
      />
    </>
  );
}
