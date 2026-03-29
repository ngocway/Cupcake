"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MaterialListItem } from './_components/MaterialListItem';
import { MaterialStatus } from '@prisma/client';
import { createDraftMaterial } from '@/actions/material-actions';

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

export default function MaterialLibraryPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const id = await createDraftMaterial('EXERCISE');
      router.push(`/teacher/materials/${id}/edit`);
    } catch (err) {
      console.error('Failed to create material:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/assignments', window.location.origin);
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);
      url.searchParams.set('sort', sortOrder);
      
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
    setCurrentPage(1); // Reset page on filter/sort change
  }, [statusFilter, sortOrder]);

  const filteredAssignments = assignments.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const itemsPerPage = 9; // 9 items + 1 create card = 10 cells (even grid)
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const currentItems = filteredAssignments.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Quick Actions */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            disabled={isCreating}
            onClick={handleCreate}
            className="flex items-center gap-5 p-6 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group disabled:opacity-50"
          >
            <div className="size-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[32px]">add</span>
            </div>
            <div>
              <h3 className="text-lg font-bold">Tạo bài mới</h3>
              <p className="text-sm text-[#617589]">Soạn thảo câu hỏi thủ công</p>
            </div>
          </button>
          
          <button className="relative flex items-center gap-5 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 hover:shadow-md transition-all text-left group overflow-hidden">
            <div className="size-14 bg-indigo-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[32px]">auto_awesome</span>
            </div>
            <div>
              <h3 className="text-lg font-bold">Tạo bằng AI</h3>
              <p className="text-sm text-[#617589]">Tự động tạo từ tài liệu của bạn</p>
            </div>
            <span className="absolute top-3 right-3 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-700">COMING SOON</span>
          </button>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between border-b border-[#f0f2f4] dark:border-gray-800 pb-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold tracking-tight">Tất cả bài tập</h1>
            <p className="text-[#617589] dark:text-gray-400">
              {loading ? 'Đang tải...' : `Bạn đang quản lý ${assignments.length} bộ bài tập và tài liệu học tập.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-[#f0f2f4] dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-[#f0f2f4] transition-colors outline-none pr-10"
              >
                <option value="ALL">Lọc</option>
                <option value="DRAFT">Bản nháp</option>
                <option value="PUBLIC">Công khai</option>
                <option value="PRIVATE">Riêng tư</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] pointer-events-none text-[#617589]">filter_list</span>
            </div>
            <div className="relative">
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="appearance-none flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-[#f0f2f4] dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-[#f0f2f4] transition-colors outline-none pr-10"
              >
                <option value="desc">Mới nhất</option>
                <option value="asc">Cũ nhất</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] pointer-events-none text-[#617589]">sort</span>
            </div>
          </div>
        </div>

        {/* Assignment List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loading ? (
            // Skeleton Loading
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-5 rounded-2xl h-48 animate-pulse border border-[#f0f2f4] dark:border-gray-700"></div>
            ))
          ) : (
            <>
              {currentItems.map((assignment) => (
                <MaterialListItem 
                  key={assignment.id} 
                  assignment={assignment} 
                  onDelete={() => {
                    setAssignments(prev => prev.filter(a => a.id !== assignment.id));
                  }}
                  onRefresh={fetchAssignments}
                />
              ))}
              
            </>
          )}

          {!loading && filteredAssignments.length === 0 && (
            <div className="lg:col-span-2 flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-[#f0f2f4] dark:border-gray-700 mt-4 h-full">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">folder_open</span>
              <p className="text-slate-500 font-medium">Bạn chưa có bài tập nào thuộc danh mục này.</p>
            </div>
          )}
        </div>

        {/* Pagination UI */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 py-4">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="size-10 flex items-center justify-center rounded-lg border border-[#f0f2f4] dark:border-gray-700 text-[#617589] hover:bg-white dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            
            {[...Array(totalPages)].map((_, i) => {
              const pageIdx = i + 1;
              const isCurrent = pageIdx === currentPage;
              
              return (
                <button 
                  key={pageIdx}
                  onClick={() => setCurrentPage(pageIdx)}
                  className={`size-10 flex items-center justify-center rounded-lg font-medium text-sm transition-colors border ${
                    isCurrent 
                      ? 'bg-primary text-white font-bold border-primary' 
                      : 'hover:bg-white dark:hover:bg-gray-800 text-[#617589] border-transparent hover:border-[#f0f2f4] dark:hover:border-gray-700'
                  }`}
                >
                  {pageIdx}
                </button>
              );
            })}

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="size-10 flex items-center justify-center rounded-lg border border-[#f0f2f4] dark:border-gray-700 text-[#617589] hover:bg-white dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
