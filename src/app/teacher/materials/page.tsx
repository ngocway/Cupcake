"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MaterialListItem } from './_components/MaterialListItem';
import { MaterialStatus } from '@prisma/client';
import { createDraftMaterial, bulkDeleteMaterials, bulkRestoreMaterials, bulkPermanentlyDeleteMaterials } from '@/actions/material-actions';
import { useSession } from 'next-auth/react';

type Assignment = {
  id: string;
  title: string;
  status: MaterialStatus;
  materialType: any;
  subject: string | null;
  gradeLevel: string | null;
  thumbnail: string | null;
  questionCount: number;
  assignedCount: number;
  viewCount: number;
  publicSubmissionCount: number;
  tags: string[];
  createdAt: string;
  classes?: any[];
};

export default function MaterialLibraryPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  // This page is the "Bài tập" tab: show exercises by default
  const [typeFilter, setTypeFilter] = useState<string>('EXERCISE');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) setSearchQuery(q);

    const handleSearchChange = () => {
      const p = new URLSearchParams(window.location.search);
      setSearchQuery(p.get('q') || '');
    };

    window.addEventListener('search-change', handleSearchChange);
    return () => window.removeEventListener('search-change', handleSearchChange);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('trash') === 'true') setShowTrash(true);
  }, []);

  const [isCreating, setIsCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/assignments', window.location.origin);
      url.searchParams.set('sort', sortOrder);
      url.searchParams.set('trash', showTrash.toString());
      if (typeFilter !== 'ALL') url.searchParams.set('type', typeFilter);
      // Do NOT show lesson-linked practice assignments in the "Bài tập" tab
      url.searchParams.set('excludeLessonLinked', 'true');
      url.searchParams.set('t', Date.now().toString());
      
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.assignments) {
        setAssignments(data.assignments);
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    setCurrentPage(1);
  }, [statusFilter, typeFilter, sortOrder, showTrash]);

  const openConfirm = (type: 'DELETE' | 'RESTORE' | 'PERMANENT_DELETE') => {
    let title = '';
    let message = '';
    if (type === 'DELETE') {
      title = 'Xóa đã chọn?';
      message = `Bạn có chắc chắn muốn chuyển ${selectedIds.length} bài tập đã chọn vào thùng rác?`;
    } else if (type === 'RESTORE') {
      title = 'Khôi phục đã chọn?';
      message = `Bạn có chắc chắn muốn khôi phục ${selectedIds.length} bài tập đã chọn?`;
    } else if (type === 'PERMANENT_DELETE') {
      title = 'Xóa vĩnh viễn?';
      message = `CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn ${selectedIds.length} bài tập đã chọn và KHÔNG THỂ khôi phục.`;
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
      setAssignments(prev => prev.filter(a => !selectedIds.includes(a.id)));
      setSelectedIds([]);
      fetchAssignments();
    } catch (err) {
      console.error('Bulk action failed:', err);
      alert('Thao tác hàng loạt thất bại.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesType = typeFilter === 'ALL' || a.materialType === typeFilter;
    let matchesStatus = true;
    const now = new Date().getTime();

    if (statusFilter === 'DRAFT') {
      matchesStatus = a.status === 'DRAFT';
    } else if (statusFilter === 'ONGOING') {
      matchesStatus = Boolean((a.status === 'PUBLIC' || a.status === 'PRIVATE') &&
             (!a.classes?.length || a.classes.some((c: any) => !c.dueDate || new Date(c.dueDate).getTime() > now)));
    } else if (statusFilter === 'ENDED') {
      matchesStatus = Boolean((a.status === 'PUBLIC' || a.status === 'PRIVATE') &&
             (a.classes && a.classes.length > 0 && a.classes.every((c: any) => c.dueDate && new Date(c.dueDate).getTime() < now)));
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* Quick Actions & Other UI... (kept same as before but ensured pb-24) */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            disabled={isCreating}
            onClick={async () => {
              setIsCreating(true);
              try {
                const id = await createDraftMaterial('EXERCISE');
                router.push(`/teacher/materials/${id}/edit`);
              } finally { setIsCreating(false); }
            }}
            className="flex items-center gap-5 p-6 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group disabled:opacity-50"
          >
            <div className="size-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-[32px]">add</span></div>
            <div><h3 className="text-lg font-bold">Tạo bài mới</h3><p className="text-sm text-[#617589]">Soạn thảo câu hỏi thủ công</p></div>
          </button>
          <button 
            disabled={isCreating}
            onClick={async () => {
              if (session?.user?.role !== 'ADMIN') { alert('Chức năng Tạo bằng AI hiện tại chỉ dành cho Super Admin.'); return; }
              setIsCreating(true);
              try {
                const id = await createDraftMaterial('EXERCISE');
                router.push(`/teacher/materials/${id}/edit?ai=true`);
              } finally { setIsCreating(false); }
            }}
            className="relative flex items-center gap-5 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 hover:shadow-md transition-all text-left group overflow-hidden disabled:opacity-50"
          >
            <div className="size-14 bg-indigo-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-[32px]">auto_awesome</span></div>
            <div><h3 className="text-lg font-bold">Tạo bằng AI</h3><p className="text-sm text-[#617589]">Tự động tạo từ tài liệu</p></div>
          </button>
        </div>
      </section>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold tracking-tight">Tất cả bài tập</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowTrash(!showTrash)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all border ${showTrash ? 'bg-slate-100 text-slate-700 border-slate-200' : 'text-[#617589] border-[#f0f2f4] hover:bg-slate-50'}`}>
              <span className="material-symbols-outlined text-[20px]">{showTrash ? 'arrow_back' : 'delete'}</span> {showTrash ? 'Quay lại' : 'Thùng rác'}
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loading ? (
            [...Array(6)].map((_, i) => <div key={i} className="bg-white dark:bg-gray-800 p-5 rounded-2xl h-48 animate-pulse border border-[#f0f2f4]"></div>)
          ) : (
            filteredAssignments.slice((currentPage - 1) * 9, currentPage * 9).map((a) => (
              <MaterialListItem 
                key={a.id} 
                assignment={a} 
                onDelete={() => {
                  setAssignments(prev => prev.filter(x => x.id !== a.id));
                  fetchAssignments();
                }}
                onRefresh={fetchAssignments}
                isTrash={showTrash}
                selected={selectedIds.includes(a.id)}
                onSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
              />
            ))
          )}
        </div>

        {/* Toolbar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[80] bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow-2xl rounded-2xl px-8 py-4 flex items-center gap-8 animate-in slide-in-from-bottom-10 pointer-events-auto" style={{ minWidth: '400px' }}>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 dark:text-white">Đã chọn {selectedIds.length} mục</span>
              <button onClick={() => setSelectedIds([])} className="text-[10px] font-bold text-primary hover:underline text-left uppercase tracking-widest">Hủy chọn</button>
            </div>
            <div className="h-10 w-px bg-slate-100 dark:bg-gray-700"></div>
            <div className="flex gap-3">
               {showTrash ? (
                 <>
                   <button disabled={isBulkProcessing} onClick={() => openConfirm('RESTORE')} className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all flex items-center gap-2">Khôi phục</button>
                   <button disabled={isBulkProcessing} onClick={() => openConfirm('PERMANENT_DELETE')} className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-all flex items-center gap-2">Xóa vĩnh viễn</button>
                 </>
               ) : (
                 <button disabled={isBulkProcessing} onClick={() => openConfirm('DELETE')} className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-all flex items-center gap-2">Xóa đã chọn</button>
               )}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Confirm Modal */}
      {confirmConfig.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className={`size-16 rounded-full flex items-center justify-center mb-6 ${confirmConfig.type === 'RESTORE' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                <span className="material-symbols-outlined text-[32px]">{confirmConfig.type === 'RESTORE' ? 'restore' : 'delete'}</span>
              </div>
              <h3 className="text-xl font-bold text-[#111418] dark:text-white mb-2">{confirmConfig.title}</h3>
              <p className="text-[#617589] dark:text-gray-400 text-sm">{confirmConfig.message}</p>
              <div className="flex gap-3 w-full mt-8">
                <button onClick={() => setConfirmConfig(prev => ({ ...prev, show: false }))} className="flex-1 py-3 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 font-bold rounded-xl hover:bg-slate-200 transition-all uppercase tracking-wide text-xs">Hủy bỏ</button>
                <button onClick={executeBulkAction} className={`flex-1 py-3 text-white font-bold rounded-xl transition-all uppercase tracking-wide text-xs shadow-lg ${confirmConfig.type === 'RESTORE' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>Xác nhận</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
