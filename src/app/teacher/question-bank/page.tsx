"use client";

import React, { useState, useEffect } from 'react';
import { getQuestionBank, deleteFromQuestionBank, updateQuestionBankTags } from '@/actions/material-actions';
import Link from 'next/link';

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterTag, setSelectedFilterTag] = useState('');

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await getQuestionBank(searchTerm);
      setQuestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchQuestions();
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const executeDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setDeletingId(id);
    try {
      await deleteFromQuestionBank(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
      alert('Không thể xóa câu hỏi này.');
    } finally {
      setDeletingId(null);
    }
  };

  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  const [editTagsValue, setEditTagsValue] = useState<string>('');

  const startEditTags = (id: string, currentTags: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTagsId(id);
    setEditTagsValue(currentTags || '');
  };

  const saveTags = async (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      await updateQuestionBankTags(id, editTagsValue);
      setQuestions(questions.map(q => q.id === id ? { ...q, tags: editTagsValue } : q));
      setEditingTagsId(null);
    } catch (err) {
      alert('Không thể cập nhật thẻ.');
    }
  };

  const availableTags = Array.from(new Set(questions.flatMap(q => q.tags ? q.tags.split(',').filter(Boolean) : [])));
  const displayedQuestions = selectedFilterTag 
    ? questions.filter(q => q.tags && q.tags.split(',').map((t: string) => t.trim()).includes(selectedFilterTag)) 
    : questions;

  return (
    <div className="w-full flex-1 max-w-5xl mx-auto flex flex-col h-[calc(100vh-80px)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Ngân hàng câu hỏi</h1>
          <p className="text-sm font-bold text-slate-500 dark:text-gray-400 mt-1">Quản lý và chỉnh sửa các câu hỏi cá nhân</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col flex-1 min-h-0">
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input 
              type="text"
              placeholder="Tìm kiếm nội dung, thẻ..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <button 
            onClick={fetchQuestions}
            className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
          >
            Tìm kiếm
          </button>
        </div>

        {questions.length > 0 && availableTags.length > 0 && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto custom-scrollbar pb-2">
            <span className="text-[11px] uppercase font-black text-gray-400 whitespace-nowrap bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 dark:bg-gray-800 dark:border-gray-700">Lọc theo thẻ:</span>
            <button 
              onClick={() => setSelectedFilterTag('')}
              className={`px-4 py-1.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${selectedFilterTag === '' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}
            >
              Tất cả
            </button>
            {availableTags.map((t: any) => (
              <button 
                key={t}
                onClick={() => setSelectedFilterTag(t.trim() === selectedFilterTag ? '' : t.trim())}
                className={`px-4 py-1.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${selectedFilterTag === t.trim() ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}
              >
                #{t.trim()}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
               <div className="size-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Đang tải...</p>
            </div>
          ) : displayedQuestions.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
               <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">inventory_2</span>
               <p className="text-gray-500 dark:text-gray-400 font-medium">Không tìm thấy câu hỏi nào.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {displayedQuestions.map(q => (
                <div key={q.id} className="p-5 border border-gray-100 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span className="text-[10px] font-black px-2.5 py-1 bg-slate-100 dark:bg-gray-700 rounded-lg uppercase tracking-widest text-slate-700 dark:text-gray-300">
                          {q.type}
                        </span>
                        <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                          {q.points} điểm
                        </span>
                        
                        {/* TAGS DISPLAY */}
                        {editingTagsId === q.id ? (
                          <form onSubmit={(e) => saveTags(q.id, e)} className="flex items-center gap-2">
                            <input 
                              type="text" 
                              value={editTagsValue}
                              onChange={(e) => setEditTagsValue(e.target.value)}
                              placeholder="TOEIC, IELTS..."
                              className="text-xs px-3 py-1.5 border border-amber-500 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-700 bg-white dark:bg-gray-900"
                              autoFocus
                            />
                            <button type="submit" className="text-white bg-amber-500 hover:bg-amber-600 size-7 flex items-center justify-center rounded-lg">
                              <span className="material-symbols-outlined text-[16px]">check</span>
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setEditingTagsId(null); }} className="text-gray-500 bg-gray-100 hover:bg-gray-200 size-7 flex items-center justify-center rounded-lg">
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            {q.tags && q.tags.split(',').filter(Boolean).map((t: string) => (
                              <span key={t} className="text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-800">
                                #{t.trim()}
                              </span>
                            ))}
                            <button 
                              onClick={(e) => startEditTags(q.id, q.tags, e)}
                              className="text-[10px] flex items-center gap-1 font-bold px-2 py-0.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span> Edit
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-base font-medium text-slate-800 dark:text-gray-200 line-clamp-3">
                        {q.type === 'MULTIPLE_CHOICE' ? q.content.questionText : 
                         q.type === 'TRUE_FALSE' ? q.content.statement :
                         q.type === 'CLOZE_TEST' ? q.content.textWithBlanks :
                         q.content.instruction || 'Câu hỏi không có tiêu đề'}
                      </p>
                    </div>
                    
                    {confirmDeleteId === q.id ? (
                      <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/10 p-2 rounded-xl border border-red-100 dark:border-red-900/30">
                        <span className="text-xs font-bold text-red-600 dark:text-red-400 whitespace-nowrap hidden sm:inline-block">Xác nhận xóa?</span>
                        <button 
                          onClick={(e) => executeDelete(q.id, e)} 
                          disabled={deletingId === q.id}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center min-w-[60px]"
                        >
                          {deletingId === q.id ? (
                            <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            'Xóa ngay'
                          )}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }} 
                          disabled={deletingId === q.id}
                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold transition-colors"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(q.id); }}
                        title="Xóa câu hỏi"
                        type="button"
                        className="size-10 flex shrink-0 items-center justify-center rounded-xl transition-all text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600 dark:bg-red-900/10 dark:hover:bg-red-900/20"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
