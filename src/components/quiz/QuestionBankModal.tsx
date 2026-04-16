"use client";

import React, { useState, useEffect } from 'react';
import { BaseQuestionProps } from './types';
import { getQuestionBank } from '@/actions/material-actions';

export function QuestionBankModal({ isOpen, onClose, onSelect }: { isOpen: boolean; onClose: () => void; onSelect: (questions: any[]) => void }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedFilterTag, setSelectedFilterTag] = useState<string>('');

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await getQuestionBank(searchTerm);
      setQuestions(data);
    } catch (err) {
      console.error('Failed to fetch from question bank:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQuestions();
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  // Handle Enter to search
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchQuestions();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 shadow-inner backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="size-10 bg-amber-500 rounded-xl flex items-center justify-center text-white">
               <span className="material-symbols-outlined">account_balance_wallet</span>
             </div>
             <h3 className="font-bold text-lg">Ngân hàng câu hỏi cá nhân</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
           <div className="relative flex gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                <input 
                  type="text"
                  placeholder="Tìm kiếm câu hỏi (nhấn Enter)..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>
              <button 
                onClick={fetchQuestions}
                className="px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-xl hover:bg-amber-600 transition-all"
              >
                Tìm kiếm
              </button>
           </div>

           {/* Quick Tags Filter */}
           {questions.length > 0 && Array.from(new Set(questions.flatMap(q => q.tags ? q.tags.split(',').filter(Boolean) : []))).length > 0 && (
             <div className="flex items-center gap-2 mt-4 overflow-x-auto custom-scrollbar pb-1">
               <span className="text-[10px] uppercase font-bold text-gray-400 whitespace-nowrap">Lọc theo thẻ:</span>
               <button 
                 onClick={() => setSelectedFilterTag('')}
                 className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedFilterTag === '' ? 'bg-amber-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}
               >
                 Tất cả
               </button>
               {Array.from(new Set(questions.flatMap(q => q.tags ? q.tags.split(',').filter(Boolean) : []))).map((t: any) => (
                 <button 
                   key={t}
                   onClick={() => setSelectedFilterTag(t.trim() === selectedFilterTag ? '' : t.trim())}
                   className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedFilterTag === t.trim() ? 'bg-amber-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}
                 >
                   #{t.trim()}
                 </button>
               ))}
             </div>
           )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-4">
           {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-3">
               <div className="size-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-sm font-medium text-gray-400">Đang truy cập kho dữ liệu...</p>
             </div>
           ) : (() => {
             const displayedQuestions = selectedFilterTag 
               ? questions.filter(q => q.tags && q.tags.split(',').map((t: string) => t.trim()).includes(selectedFilterTag)) 
               : questions;
             
             if (displayedQuestions.length === 0) return (
               <div className="text-center py-20">
                 <p className="text-gray-400">{questions.length === 0 ? 'Kho lưu trữ trống.' : `Không tìm thấy câu hỏi nào với thẻ #${selectedFilterTag}.`}</p>
               </div>
             );
             
             return displayedQuestions.map(q => (
               <div 
                 key={q.id} 
                 onClick={() => {
                   const next = new Set(selectedIds);
                   if (next.has(q.id)) next.delete(q.id);
                   else next.add(q.id);
                   setSelectedIds(next);
                 }}
                 className={`p-4 border ${selectedIds.has(q.id) ? 'border-amber-500 bg-amber-50/10' : 'border-gray-100 dark:border-gray-700'} rounded-2xl hover:border-amber-500/50 hover:bg-amber-50/10 transition-all group flex items-start gap-3 cursor-pointer`}
               >
                  <div className="pt-0.5">
                    <div className={`size-5 rounded flex items-center justify-center transition-colors ${selectedIds.has(q.id) ? 'bg-amber-500 border-amber-500' : 'bg-white border border-gray-300'}`}>
                      {selectedIds.has(q.id) && <span className="material-symbols-outlined text-white text-[14px] font-bold">check</span>}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                       <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded uppercase tracking-wider">{q.type}</span>
                       <span className="text-[10px] font-bold text-gray-400">{q.points} điểm</span>
                       {q.tags && q.tags.split(',').filter(Boolean).map((t: string) => (
                         <span key={t} className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded">#{t.trim()}</span>
                       ))}
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-gray-200 line-clamp-2">
                      {q.type === 'MULTIPLE_CHOICE' ? q.content.questionText : 
                       q.type === 'TRUE_FALSE' ? q.content.statement :
                       q.type === 'CLOZE_TEST' ? q.content.textWithBlanks :
                       q.content.instruction || 'Câu hỏi không có tiêu đề'}
                    </p>
                  </div>
               </div>
             ))
           })()}
        </div>
        
        {selectedIds.size > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end bg-gray-50 dark:bg-gray-900">
            <button 
              onClick={() => {
                const selectedQs = questions.filter(q => selectedIds.has(q.id));
                onSelect(selectedQs);
              }}
              className="px-6 py-2.5 bg-amber-500 text-white font-bold text-sm rounded-xl hover:bg-amber-600 shadow-md shadow-amber-500/20 transition-all"
            >
              Sử dụng {selectedIds.size} câu hỏi đã chọn
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
