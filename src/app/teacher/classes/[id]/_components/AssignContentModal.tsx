"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMyAssignments, assignToClass, createDraftMaterial } from '@/actions/material-actions';

interface AssignContentModalProps {
  classId: string;
  onClose: () => void;
  onAssigned?: () => void;
}

const TYPE_CONFIG: Record<string, { icon: string; bgClass: string; textClass: string }> = {
  EXERCISE: { icon: 'menu_book',  bgClass: 'bg-blue-50 dark:bg-blue-900/30',     textClass: 'text-primary' },
  READING:  { icon: 'headphones', bgClass: 'bg-orange-50 dark:bg-orange-900/30',  textClass: 'text-orange-600' },
  FLASHCARD:{ icon: 'spellcheck', bgClass: 'bg-purple-50 dark:bg-purple-900/30',  textClass: 'text-purple-600' },
};

export function AssignContentModal({ classId, onClose, onAssigned }: AssignContentModalProps) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('ALL');
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const data = await getMyAssignments();
        setAssignments(data);
      } catch (err) {
        console.error('Failed to load library', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLibrary();
  }, []);

  const handleAssign = async (assignmentId: string) => {
    setIsAssigning(assignmentId);
    try {
      await assignToClass(assignmentId, classId);
      onAssigned?.();
      onClose();
    } catch (err) {
      console.error('Failed to assign', err);
      alert('Giao bài thất bại: ' + (err as Error).message);
    } finally {
      setIsAssigning(null);
    }
  };

  const handleCreateAndAssign = async () => {
    setCreating(true);
    try {
      const newId = await createDraftMaterial('EXERCISE');
      // No longer assign here, we assign on finish in the editor
      onClose();
      router.push(`/teacher/materials/${newId}/edit?assignToClass=${classId}`);
    } catch (err) {
      console.error('Failed to create and prepare', err);
      alert('Tạo bài thất bại: ' + (err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const filtered = assignments.filter(a => 
    (searchTerm === '' || a.title.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (category === 'ALL' || a.subject === category) // Assuming subject is used as category
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-background-dark w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f2f4] dark:border-gray-800">
          <h2 className="text-xl font-bold">Giao bài tập mới</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#f0f2f4] dark:hover:bg-gray-800 rounded-full text-[#617589] transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-[#f0f2f4] dark:border-gray-800 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#617589]">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input 
              className="block w-full rounded-xl border border-[#f0f2f4] dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
              placeholder="Tìm bài tập trong thư viện..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative min-w-[180px]">
            <select 
              className="appearance-none block w-full rounded-xl border border-[#f0f2f4] dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-4 pr-10 text-sm font-medium focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="ALL">Tất cả danh mục</option>
              <option value="NGỮ PHÁP">Ngữ pháp</option>
              <option value="TỪ VỰNG">Từ vựng</option>
              <option value="ĐỌC HIỂU">Đọc hiểu</option>
              <option value="NGHE">Nghe</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#617589]">
              <span className="material-symbols-outlined text-[20px]">expand_more</span>
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Create options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Create Manual */}
            <button 
              onClick={handleCreateAndAssign}
              disabled={creating}
              className="flex items-center gap-4 p-4 border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 rounded-2xl transition-all group text-left disabled:opacity-50"
            >
              <div className="size-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl font-bold">add</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[#111418] dark:text-white">Tạo bài mới</h4>
                <p className="text-xs text-[#617589] mt-0.5">Soạn thảo câu hỏi thủ công</p>
              </div>
            </button>

            {/* Create with AI */}
            <div className="flex items-center gap-4 p-4 bg-primary/[0.03] border border-primary/10 rounded-2xl relative group overflow-hidden opacity-80 cursor-not-allowed">
              <div className="size-12 bg-primary text-white rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">auto_awesome</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[#111418] dark:text-white flex items-center gap-2">
                  Tạo bằng AI
                </h4>
                <p className="text-xs text-[#617589] mt-0.5">Tự động tạo từ tài liệu của bạn</p>
              </div>
              <div className="absolute top-2 right-2">
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-lg uppercase tracking-wider">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>

          <div className="h-px bg-[#f0f2f4] dark:bg-gray-800 mb-6 mx-2" />
          
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-[#617589] opacity-50">
              <span className="material-symbols-outlined text-[48px] mb-2">auto_stories</span>
              <p>Thư viện trống hoặc không tìm thấy bài tập phù hợp.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filtered.map((ass) => {
                const config = TYPE_CONFIG[ass.materialType] || TYPE_CONFIG.EXERCISE;
                return (
                  <div key={ass.id} className="flex items-center gap-4 p-4 hover:bg-[#f0f2f4] dark:hover:bg-gray-800/50 rounded-xl transition-all group">
                    <div className={`size-12 ${config.bgClass} ${config.textClass} rounded-xl flex items-center justify-center shrink-0`}>
                      <span className="material-symbols-outlined text-2xl">{config.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#111418] dark:text-white truncate">{ass.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-xs text-[#617589]">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">format_list_bulleted</span> 
                          {ass._count?.questions || 0} câu hỏi
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">history</span> 
                          {new Date(ass.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => window.open(`/teacher/materials/${ass.id}/edit`, '_blank')}
                        className="p-2 border border-[#d1d5db] dark:border-gray-600 text-[#617589] hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center group/tooltip relative"
                        title="Xem trước/Chỉnh sửa"
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Xem trước / Sửa</span>
                      </button>
                      <button 
                        disabled={isAssigning === ass.id}
                        onClick={() => handleAssign(ass.id)}
                        className={`bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm disabled:opacity-50`}
                      >
                        {isAssigning === ass.id ? 'Đang giao...' : 'Chọn'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#f0f2f4] dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-[#617589] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
}
