"use client";

import React, { useState, useRef, useEffect } from 'react';
import { restoreMaterial, permanentlyDeleteMaterial } from '@/actions/material-actions';
import { MaterialStatus, MaterialType } from '@prisma/client';

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
  createdAt: string;
  deletedAt?: Date;
};

const SUBJECT_CONFIG: Record<string, string> = {
  'Toán học': 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'Tiếng Anh': 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Ngữ Văn': 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  'Khoa học': 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  'Lịch sử': 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export function TrashListItem({ assignment, onAction }: { assignment: Assignment, onAction: () => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPermDeleteModal, setShowPermDeleteModal] = useState(false);

  const handleRestore = async () => {
    setIsProcessing(true);
    try {
      await restoreMaterial(assignment.id);
      onAction();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi khôi phục');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePermDelete = async () => {
    setIsProcessing(true);
    setShowPermDeleteModal(false);
    try {
      await permanentlyDeleteMaterial(assignment.id);
      onAction();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa vĩnh viễn');
    } finally {
      setIsProcessing(false);
    }
  };

  const dateStr = new Date(assignment.createdAt).toLocaleDateString('vi-VN');

  return (
    <>
      <div className={`bg-white dark:bg-gray-800 p-4 rounded-xl border border-[#f0f2f4] dark:border-gray-700 hover:border-primary/40 transition-all group flex items-center gap-5 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Thumbnail */}
        <div 
          className="size-16 rounded-lg bg-cover bg-center shrink-0 border border-gray-100 dark:border-gray-700 bg-[#f0f2f4]"
          style={assignment.thumbnail ? { backgroundImage: `url(${assignment.thumbnail})` } : undefined}
        >
          {!assignment.thumbnail && (
            <div className="w-full h-full flex items-center justify-center text-[#617589]">
              <span className="material-symbols-outlined">image</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-bold text-lg text-[#111418] dark:text-white truncate">
              {assignment.title}
            </h3>
            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">
              ĐÃ XÓA
            </span>
          </div>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
            <div className="flex items-center gap-1.5">
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
            <div className="flex items-center gap-4 text-sm text-[#617589]">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">quiz</span> 
                <span>{assignment.questionCount} câu</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span> 
                <span>{dateStr}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <button 
            onClick={handleRestore}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all rounded-lg font-bold text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">restore</span>
            Khôi phục
          </button>
          <button 
            onClick={() => setShowPermDeleteModal(true)}
            disabled={isProcessing}
            className="flex items-center justify-center size-10 border border-[#f0f2f4] dark:border-gray-700 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors text-[#617589]"
            title="Xóa vĩnh viễn"
          >
            <span className="material-symbols-outlined text-[20px]">delete_forever</span>
          </button>
        </div>
      </div>

      {/* Permanently Delete Confirmation Modal */}
      {showPermDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="size-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[32px]">warning</span>
              </div>
              <h3 className="text-xl font-bold text-[#111418] dark:text-white mb-2">Xóa vĩnh viễn?</h3>
              <p className="text-[#617589] dark:text-gray-400 text-sm">
                Thao tác này sẽ xóa vĩnh viễn bài tập <strong className="text-[#111418] dark:text-white">"{assignment.title}"</strong>. 
                Bạn sẽ không thể khôi phục lại được nữa.
              </p>
            </div>
            <div className="flex border-t border-[#f0f2f4] dark:border-gray-700">
              <button 
                onClick={() => setShowPermDeleteModal(false)}
                className="flex-1 px-4 py-4 text-sm font-bold text-[#617589] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isProcessing}
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handlePermDelete}
                className="flex-1 px-4 py-4 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-l border-[#f0f2f4] dark:border-gray-700 flex items-center justify-center gap-2"
                disabled={isProcessing}
              >
                {isProcessing ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
