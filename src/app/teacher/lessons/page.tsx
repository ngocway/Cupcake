"use client";

import React, { useState, useEffect } from 'react';
import { ReadingExerciseBuilder } from '@/components/quiz/ReadingExerciseBuilder';
import { bulkDeleteMaterials, bulkRestoreMaterials, bulkPermanentlyDeleteMaterials, createDraftLesson } from '@/actions/material-actions';
import { MaterialListItem } from '../materials/_components/MaterialListItem';
import { AiGeneratorModal } from './_components/AiGeneratorModal';
import { ArrowLeft, Trash2, Sparkles, PlusCircle, RotateCcw, Rss } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function LessonsPage() {
  const { data: session } = useSession();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'MANUAL' | 'AI' | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
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

  const fetchLessons = async (pageNum: number = 1, append: boolean = false) => {
    if (pageNum === 1) setLoading(true);
    else setIsLoadingMore(true);

    try {
      const res = await fetch(`/api/lessons?trash=${showTrash}&page=${pageNum}&limit=12&t=${Date.now()}`);
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
      if (append) {
        setLessons(prev => [...prev, ...normalizedLessons]);
      } else {
        setLessons(normalizedLessons);
      }
      
      setHasMore(data.lessons.length === 12);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch lessons:', err);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchLessons(1, false);
  }, [showTrash]);

  const loadMore = () => {
    if (!loading && !isLoadingMore && hasMore) {
      fetchLessons(page + 1, true);
    }
  };

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
      setPendingAction(null);
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

  const handleSyncFeed = async () => {
    setIsSyncing(true);
    try {
      const publicLessons = lessons.filter(l => l.status === 'PUBLIC');
      if (publicLessons.length === 0) {
        alert('Không có bài học PUBLIC nào để đồng bộ.');
        return;
      }
      const res = await fetch('/api/feed/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonIds: publicLessons.map(l => l.lessonId || l.id) })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Đã đồng bộ ${data.synced} bài học lên trang chủ!`);
      } else {
        alert(data.error || 'Đồng bộ thất bại.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi đồng bộ feed.');
    } finally {
      setIsSyncing(false);
    }
  };

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
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all border backdrop-blur-md ${
              showTrash 
                ? 'bg-slate-100/80 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-white dark:border-slate-700' 
                : 'bg-white/60 text-[#617589] border-[#f0f2f4] dark:bg-slate-800/60 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
            }`}
          >
            {showTrash ? <ArrowLeft className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
            {showTrash ? 'Quay lại' : 'Thùng rác'}
          </button>
          {session?.user?.role === 'ADMIN' && (
            <button 
              onClick={handleSyncFeed}
              disabled={isSyncing}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500/90 backdrop-blur-md text-white border border-orange-400 rounded-xl font-bold text-sm hover:bg-orange-600 transition-all shadow-sm disabled:opacity-50"
            >
              <Rss className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Đang đồng bộ...' : 'Feed homepage'}
            </button>
          )}
          <button 
            onClick={() => setShowAiModal(true)} 
            className="flex items-center gap-2 px-6 py-3 bg-neutral-800/80 backdrop-blur-md text-blue-400 border border-neutral-700 rounded-xl font-bold text-sm hover:bg-neutral-700 transition-all shadow-sm"
          >
            <Sparkles className="w-5 h-5" /> AI Assistant
          </button>
          {!showTrash && (
            <button 
              onClick={() => handleCreate()}
              disabled={isCreating}
              className="flex items-center gap-2 px-6 py-3 bg-primary/90 backdrop-blur-md text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
            >
              <PlusCircle className="w-5 h-5" /> {isCreating ? 'Đang tạo...' : 'Tạo bài học'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-5 rounded-2xl h-48 animate-pulse border border-[#f0f2f4] dark:border-slate-700"></div>
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

      {hasMore && !loading && (
        <div className="flex justify-center mt-6">
          <button 
            onClick={loadMore}
            disabled={isLoadingMore}
            className="px-6 py-3 bg-slate-100/60 hover:bg-slate-200/60 backdrop-blur-md dark:bg-slate-800/60 dark:hover:bg-slate-700/60 text-slate-700 dark:text-gray-300 rounded-xl font-bold transition-all"
          >
            {isLoadingMore ? 'Đang tải...' : 'Tải thêm'}
          </button>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div 
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[80] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl px-8 py-4 flex items-center gap-8 animate-in slide-in-from-bottom-10"
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
                  className="px-6 py-2.5 bg-emerald-500/90 backdrop-blur-md text-white rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw className="w-[18px] h-[18px]" /> {isBulkProcessing ? 'Đang xử lý...' : 'Khôi phục'}
                </button>
                <button 
                  disabled={isBulkProcessing}
                  onClick={() => openConfirm('PERMANENT_DELETE')}
                  className="px-6 py-2.5 bg-red-500/90 backdrop-blur-md text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-[18px] h-[18px]" /> {isBulkProcessing ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                </button>
              </>
            ) : (
              <button 
                disabled={isBulkProcessing}
                onClick={() => openConfirm('DELETE')}
                className="px-6 py-2.5 bg-red-500/90 backdrop-blur-md text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-all flex items-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                <Trash2 className="w-[18px] h-[18px]" /> {isBulkProcessing ? 'Đang xóa...' : 'Xóa đã chọn'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Custom Confirm Modal for Bulk Actions */}
      {confirmConfig.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className={`size-16 rounded-full flex items-center justify-center mb-6 ${
                confirmConfig.type === 'RESTORE' 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-500'
              }`}>
                {confirmConfig.type === 'RESTORE' ? <RotateCcw className="w-8 h-8" /> : <Trash2 className="w-8 h-8" />}
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
        <AiGeneratorModal 
          isOpen={showAiModal} 
          onClose={() => {
            setShowAiModal(false);
            setPendingAction(null);
          }} 
          onSuccess={(newId) => {
            fetchLessons();
            if (newId) {
              setEditingId(newId);
            }
          }} 
        />
      )}
    </div>
  );
}
