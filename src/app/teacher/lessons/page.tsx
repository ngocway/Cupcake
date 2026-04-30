"use client";

import React, { useState, useEffect } from 'react';
import { ReadingExerciseBuilder } from '@/components/quiz/ReadingExerciseBuilder';
import { bulkDeleteMaterials, bulkRestoreMaterials, bulkPermanentlyDeleteMaterials, createDraftLesson } from '@/actions/material-actions';
import { MaterialListItem } from '../materials/_components/MaterialListItem';
import { AiGeneratorModal } from './_components/AiGeneratorModal';

export default function LessonsPage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  // Custom Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    show: boolean;
    type: 'DELETE' | 'RESTORE' | 'PERMANENT_DELETE';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'DELETE',
    title: '',
    message: ''
  });

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lessons?trash=${showTrash}&t=${Date.now()}`);
      const data = await res.json();
      
      const normalizedLessons = (data.lessons || []).map((l: any) => ({
        ...l,
        // API returns a flattened lesson+assignment shape; keep fallbacks for backward compatibility
        id: l.id || l.assignment?.id,
        status: l.status || l.assignment?.status || 'DRAFT',
        materialType: l.materialType || l.assignment?.materialType || 'READING',
        subject: l.subject ?? l.assignment?.subject ?? null,
        gradeLevel: l.gradeLevel ?? l.assignment?.gradeLevel ?? null,
        thumbnail: l.thumbnail ?? l.assignment?.thumbnail ?? null,
        questionCount: l.questionCount ?? l.assignment?._count?.questions ?? 0,
        assignedCount: l.assignedCount ?? l.assignment?._count?.targetClasses ?? 0,
        viewCount: l.viewCount ?? l.viewsCount ?? 0,
        publicSubmissionCount: l.publicSubmissionCount ?? l.assignment?.publicSubmissionCount ?? 0,
        createdAt: l.createdAt
      }));
      
      setLessons(normalizedLessons);
    } catch (err) {
      console.error('Failed to fetch lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [showTrash]);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const id = await createDraftLesson();
      setEditingId(id);
    } catch (err) {
      console.error('Failed to create lesson:', err);
      alert('Không thể tạo bài học mới.');
    } finally {
      setIsCreating(false);
    }
  };

  const openConfirm = (type: 'DELETE' | 'RESTORE' | 'PERMANENT_DELETE') => {
    let title = '';
    let message = '';
    if (type === 'DELETE') {
      title = 'Xóa đã chọn?';
      message = `Bạn có chắc chắn muốn chuyển ${selectedIds.length} bài học đã chọn vào thùng rác?`;
    } else if (type === 'RESTORE') {
      title = 'Khôi phục đã chọn?';
      message = `Bạn có chắc chắn muốn khôi phục ${selectedIds.length} bài học đã chọn?`;
    } else if (type === 'PERMANENT_DELETE') {
      title = 'Xóa vĩnh viễn?';
      message = `CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn ${selectedIds.length} bài học đã chọn và KHÔNG THỂ khôi phục.`;
    }
    setConfirmConfig({ show: true, type, title, message });
  };

  const executeBulkAction = async () => {
    const { type } = confirmConfig;
    setConfirmConfig(prev => ({ ...prev, show: false }));
    setIsBulkProcessing(true);
    
    try {
      if (type === 'DELETE') await bulkDeleteMaterials(selectedIds);
      if (type === 'RESTORE') await bulkRestoreMaterials(selectedIds);
      if (type === 'PERMANENT_DELETE') await bulkPermanentlyDeleteMaterials(selectedIds);
      
      // Optimistic UI
      setLessons(prev => prev.filter(l => !selectedIds.includes(l.id)));
      setSelectedIds([]);
      fetchLessons();
    } catch (err) {
      console.error('Bulk action failed:', err);
      alert('Thao tác hàng loạt thất bại. Vui lòng thử lại.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  if (editingId) {
    return (
      <ReadingExerciseBuilder 
        assignmentId={editingId} 
        onBack={() => {
          setEditingId(null);
          fetchLessons();
        }} 
      />
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight">Tất cả bài học</h1>
          <p className="text-[#617589] dark:text-gray-400 text-sm mt-1">
            {showTrash ? 'Quản lý các bài học đã xóa.' : 'Quản lý danh sách các bài học Reading.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowTrash(!showTrash)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all border ${
              showTrash 
                ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-gray-800 dark:text-white dark:border-gray-700' 
                : 'text-[#617589] border-[#f0f2f4] dark:border-gray-700 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined">{showTrash ? 'arrow_back' : 'delete'}</span>
            {showTrash ? 'Quay lại' : 'Thùng rác'}
          </button>
          <button onClick={() => setShowAiModal(true)} className="flex items-center gap-2 px-6 py-3 bg-neutral-800 text-blue-400 border border-neutral-700 rounded-xl font-bold text-sm hover:bg-neutral-700 transition-all shadow-sm">
            <span className="material-symbols-outlined text-xl">auto_awesome</span> AI Assistant
          </button>
          {!showTrash && (
            <button 
              onClick={handleCreate}
              disabled={isCreating}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined">add_circle</span> {isCreating ? 'Đang tạo...' : 'Tạo bài học'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-5 rounded-2xl h-48 animate-pulse border border-[#f0f2f4] dark:border-gray-700"></div>
          ))
        ) : (
          <>
            {lessons.map((lesson) => (
              <MaterialListItem 
                key={lesson.id}
                assignment={lesson}
                onEdit={setEditingId}
                onDelete={() => {
                  setLessons(prev => prev.filter(l => l.id !== lesson.id));
                  fetchLessons();
                }}
                onRefresh={fetchLessons}
                isTrash={showTrash}
                selected={selectedIds.includes(lesson.id)}
                onSelect={(id) => {
                  setSelectedIds(prev => 
                    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                  );
                }}
              />
            ))}
          </>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div 
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[80] bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow-2xl rounded-2xl px-8 py-4 flex items-center gap-8 animate-in slide-in-from-bottom-10"
          style={{ minWidth: '400px' }}
        >
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-900 dark:text-white">Đã chọn {selectedIds.length} mục</span>
            <button onClick={() => setSelectedIds([])} className="text-[10px] font-bold text-primary hover:underline text-left uppercase tracking-widest">Hủy chọn</button>
          </div>
          <div className="h-10 w-px bg-slate-100 dark:bg-gray-700"></div>
          <div className="flex gap-3">
            {showTrash ? (
              <>
                <button 
                  disabled={isBulkProcessing}
                  onClick={() => openConfirm('RESTORE')}
                  className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">restore</span> {isBulkProcessing ? 'Đang xử lý...' : 'Khôi phục'}
                </button>
                <button 
                  disabled={isBulkProcessing}
                  onClick={() => openConfirm('PERMANENT_DELETE')}
                  className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_forever</span> {isBulkProcessing ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                </button>
              </>
            ) : (
              <button 
                disabled={isBulkProcessing}
                onClick={() => openConfirm('DELETE')}
                className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-all flex items-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span> {isBulkProcessing ? 'Đang xóa...' : 'Xóa đã chọn'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Custom Confirm Modal for Bulk Actions */}
      {confirmConfig.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className={`size-16 rounded-full flex items-center justify-center mb-6 ${
                confirmConfig.type === 'RESTORE' 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-500'
              }`}>
                <span className="material-symbols-outlined text-[32px]">
                  {confirmConfig.type === 'RESTORE' ? 'restore' : confirmConfig.type === 'PERMANENT_DELETE' ? 'delete_forever' : 'delete'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#111418] dark:text-white mb-2">{confirmConfig.title}</h3>
              <p className="text-[#617589] dark:text-gray-400 text-sm">{confirmConfig.message}</p>
              
              <div className="flex gap-3 w-full mt-8">
                <button 
                  onClick={() => setConfirmConfig(prev => ({ ...prev, show: false }))}
                  className="flex-1 py-3 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-gray-600 transition-all uppercase tracking-wide text-xs"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={executeBulkAction}
                  className={`flex-1 py-3 text-white font-bold rounded-xl transition-all uppercase tracking-wide text-xs shadow-lg ${
                    confirmConfig.type === 'RESTORE' 
                      ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' 
                      : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                  }`}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAiModal && (
        <AiGeneratorModal onClose={() => setShowAiModal(false)} onSuccess={fetchLessons} />
      )}
    </div>
  );
}
