"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrashListItem } from './_components/TrashListItem';
import { MaterialStatus } from '@prisma/client';
import { ArrowLeft, Trash2, Check, RotateCcw } from 'lucide-react';
import { bulkRestoreMaterials, bulkPermanentlyDeleteMaterials } from '@/actions/material-actions';

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
  createdAt: string;
};

export default function MaterialsTrashPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    show: boolean;
    type: 'RESTORE' | 'PERMANENT_DELETE' | '';
    title: string;
    message: string;
  }>({ show: false, type: '', title: '', message: '' });

  const fetchDeletedAssignments = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/assignments', window.location.origin);
      url.searchParams.set('trash', 'true');
      
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.assignments) {
        setAssignments(data.assignments);
      }
    } catch (err) {
      console.error('Failed to fetch deleted assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedAssignments();
  }, []);

  const openConfirm = (type: 'RESTORE' | 'PERMANENT_DELETE') => {
    let title = '';
    let message = '';
    if (type === 'RESTORE') {
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
      if (type === 'RESTORE') {
        await bulkRestoreMaterials(selectedIds);
        setAssignments(prev => prev.filter(a => !selectedIds.includes(a.id)));
      } else if (type === 'PERMANENT_DELETE') {
        await bulkPermanentlyDeleteMaterials(selectedIds);
        setAssignments(prev => prev.filter(a => !selectedIds.includes(a.id)));
      }
      setSelectedIds([]);
    } catch (err) {
      console.error('Bulk action failed:', err);
      alert('Thao tác hàng loạt thất bại.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-24">
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between border-b border-[#f0f2f4] dark:border-gray-800 pb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[#617589] dark:text-gray-400 mb-2">
              <Link href="/teacher/materials" className="hover:text-primary transition-colors flex items-center gap-1 text-sm">
                <ArrowLeft className="w-[18px] h-[18px]" />
                <span>Thư viện bài tập</span>
              </Link>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Thùng rác</h1>
            <p className="text-[#617589] dark:text-gray-400">
              {loading ? 'Đang tải...' : `Bạn đang có ${assignments.length} bài tập trong thùng rác.`}
            </p>
          </div>
        </div>

        {/* Bulk Selection Header */}
        {!loading && assignments.length > 0 && (
          <div className="flex items-center gap-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-gray-700">
            <button
              onClick={() => {
                if (selectedIds.length === assignments.length) {
                  setSelectedIds([]);
                } else {
                  setSelectedIds(assignments.map(a => a.id));
                }
              }}
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                selectedIds.length === assignments.length
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white border-slate-300 dark:bg-slate-700 dark:border-slate-500 text-transparent hover:border-primary'
              }`}
            >
              {selectedIds.length === assignments.length && <Check className="w-4 h-4 stroke-[3px]" />}
            </button>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {selectedIds.length === assignments.length ? 'Hủy chọn tất cả' : 'Chọn tất cả'} ({assignments.length} bài tập)
            </span>
          </div>
        )}

        {/* Assignment List */}
        <div className="flex flex-col gap-3">
          {loading ? (
            // Skeleton Loading
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-4 rounded-xl h-24 animate-pulse border border-[#f0f2f4] dark:border-slate-700"></div>
            ))
          ) : (
            <>
              {assignments.map((assignment) => (
                <TrashListItem 
                  key={assignment.id} 
                  assignment={assignment} 
                  onAction={() => {
                    setAssignments(prev => prev.filter(a => a.id !== assignment.id));
                    setSelectedIds(prev => prev.filter(id => id !== assignment.id));
                  }}
                  selected={selectedIds.includes(assignment.id)}
                  onSelect={(id) => {
                    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                  }}
                />
              ))}
            </>
          )}

          {!loading && assignments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border-2 border-dashed border-[#f0f2f4] dark:border-slate-700 mt-4 text-center p-8">
              <div className="size-20 bg-gray-50 dark:bg-gray-700/50 text-gray-300 dark:text-gray-600 rounded-full flex items-center justify-center mb-6">
                <Trash2 className="w-14 h-14 stroke-[1.5px]" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Thùng rác trống</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Các bài tập mà bạn xóa sẽ xuất hiện ở đây. Bạn có thể khôi phục lại chúng bất cứ lúc nào.</p>
              <Link 
                href="/teacher/materials"
                className="mt-8 px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all inline-block"
              >
                Quay lại thư viện
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[80] bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl px-8 py-4 flex items-center gap-8 animate-in slide-in-from-bottom-10 pointer-events-auto" style={{ minWidth: '400px' }}>
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-900 dark:text-white">Đã chọn {selectedIds.length} mục</span>
            <button onClick={() => setSelectedIds([])} className="text-[10px] font-bold text-primary hover:underline text-left uppercase tracking-widest">Hủy chọn</button>
          </div>
          <div className="h-10 w-px bg-slate-100 dark:bg-gray-700"></div>
          <div className="flex gap-3">
             <button disabled={isBulkProcessing} onClick={() => openConfirm('RESTORE')} className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all flex items-center gap-2">Khôi phục</button>
             <button disabled={isBulkProcessing} onClick={() => openConfirm('PERMANENT_DELETE')} className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-all flex items-center gap-2">Xóa vĩnh viễn</button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmConfig.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className={`size-16 rounded-full flex items-center justify-center mb-6 ${confirmConfig.type === 'RESTORE' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                {confirmConfig.type === 'RESTORE' ? (
                  <RotateCcw className="w-8 h-8 stroke-[2px]" />
                ) : (
                  <Trash2 className="w-8 h-8 stroke-[2px]" />
                )}
              </div>
              <h3 className="text-xl font-bold text-[#111418] dark:text-white mb-2">{confirmConfig.title}</h3>
              <p className="text-[#617589] dark:text-gray-400 text-sm">{confirmConfig.message}</p>
              <div className="flex gap-3 w-full mt-8">
                <button onClick={() => setConfirmConfig(prev => ({ ...prev, show: false }))} className="flex-1 py-3 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 font-bold rounded-xl hover:bg-slate-200 transition-all uppercase tracking-wide text-xs">Hủy bỏ</button>
                <button onClick={executeBulkAction} className={`flex-1 py-3 text-white font-bold rounded-xl transition-all uppercase tracking-wide text-xs shadow-lg ${confirmConfig.type === 'RESTORE' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>{isBulkProcessing ? 'Đang xử lý...' : 'Xác nhận'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
