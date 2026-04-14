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
  viewCount: number;
  publicSubmissionCount: number;
  tags: string[];
  createdAt: string;
  classes?: any[];
};

export default function MaterialLibraryPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTrash, setShowTrash] = useState(false);
  
  useEffect(() => {
    // Initial load from URL
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
      url.searchParams.set('sort', sortOrder);
      url.searchParams.set('trash', showTrash.toString());
      
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
  }, [statusFilter, typeFilter, sortOrder, showTrash]);

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Exclude READING materials from this page as they should be in the Lessons page
    if (a.materialType === 'READING') return false;

    let matchesType = true;
    if (typeFilter !== 'ALL') {
      matchesType = a.materialType === typeFilter;
    }

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
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold tracking-tight">Tất cả bài tập</h1>
            <p className="text-[#617589] dark:text-gray-400 text-sm mt-1">
              Bạn đang quản lý {filteredAssignments.length} bộ bài tập và tài liệu học tập.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowTrash(!showTrash)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                showTrash 
                  ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-gray-800 dark:text-white dark:border-gray-700' 
                  : 'text-[#617589] border-[#f0f2f4] dark:border-gray-700 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{showTrash ? 'arrow_back' : 'delete'}</span>
              {showTrash ? 'Quay lại' : 'Thùng rác'}
            </button>
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

        {/* Tabs */}
        <div className="flex gap-8 border-b border-[#f0f2f4] dark:border-gray-800">
          <button 
            onClick={() => setStatusFilter('ALL')}
            className={`pb-4 text-sm font-bold transition-colors ${statusFilter === 'ALL' ? 'text-primary border-b-2 border-primary' : 'text-[#617589] hover:text-primary'}`}
          >
            Tất cả
          </button>
          <button 
            onClick={() => setStatusFilter('ONGOING')}
            className={`pb-4 text-sm font-bold transition-colors ${statusFilter === 'ONGOING' ? 'text-primary border-b-2 border-primary' : 'text-[#617589] hover:text-primary'}`}
          >
            Đang diễn ra
          </button>
          <button 
            onClick={() => setStatusFilter('ENDED')}
            className={`pb-4 text-sm font-bold transition-colors ${statusFilter === 'ENDED' ? 'text-primary border-b-2 border-primary' : 'text-[#617589] hover:text-primary'}`}
          >
            Đã kết thúc
          </button>
          <button 
            onClick={() => setStatusFilter('DRAFT')}
            className={`pb-4 text-sm font-bold transition-colors ${statusFilter === 'DRAFT' ? 'text-primary border-b-2 border-primary' : 'text-[#617589] hover:text-primary'}`}
          >
            Bản nháp
          </button>
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {[
            { id: 'ALL', label: 'Tất cả loại', icon: 'filter_list' },
            { id: 'EXERCISE', label: 'Quiz', icon: 'quiz' },
            { id: 'FLASHCARD', label: 'Flashcards', icon: 'style' }
          ].map(type => (
            <button
              key={type.id}
              onClick={() => setTypeFilter(type.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                typeFilter === type.id 
                  ? 'bg-primary text-white border-primary shadow-md transform scale-105' 
                  : 'bg-white dark:bg-gray-800 text-slate-500 border-slate-200 dark:border-gray-700 hover:border-primary/50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{type.icon}</span>
              {type.label}
            </button>
          ))}
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
                  onDelete={fetchAssignments}
                  onRefresh={fetchAssignments}
                  isTrash={showTrash}
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
