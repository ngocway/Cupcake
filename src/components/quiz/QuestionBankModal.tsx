"use client";

import React, { useState, useEffect } from 'react';
import { BaseQuestionProps } from './types';

export function QuestionBankModal({ isOpen, onClose, onSelect }: { isOpen: boolean; onClose: () => void; onSelect: (q: any) => void }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Simulate fetching from QuestionBank
      setTimeout(() => {
        setQuestions([
          {
            id: 'bank-1',
            type: 'MULTIPLE_CHOICE',
            points: 1,
            explanation: 'Explain...',
            content: { questionText: 'What is the capital of France?', options: [{ text: 'Paris', isCorrect: true }, { text: 'London', isCorrect: false }] }
          },
          {
            id: 'bank-2',
            type: 'TRUE_FALSE',
            points: 1,
            content: { statement: 'React is a backend framework.', isTrue: false }
          }
        ]);
        setLoading(false);
      }, 500);
    }
  }, [isOpen]);

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
           <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input 
                type="text"
                placeholder="Tìm kiếm câu hỏi trong kho..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-4">
           {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-3">
               <div className="size-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-sm font-medium text-gray-400">Đang truy cập kho dữ liệu...</p>
             </div>
           ) : questions.length === 0 ? (
             <div className="text-center py-20">
               <p className="text-gray-400">Kho lưu trữ trống.</p>
             </div>
           ) : (
             questions.map(q => (
               <div key={q.id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-2xl hover:border-amber-500/50 hover:bg-amber-50/10 transition-all group flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded uppercase tracking-wider">{q.type}</span>
                       <span className="text-[10px] font-bold text-gray-400">{q.points} điểm</span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-gray-200 line-clamp-2">
                      {q.type === 'MULTIPLE_CHOICE' ? q.content.questionText : q.content.statement}
                    </p>
                  </div>
                  <button 
                    onClick={() => onSelect(q)}
                    className="px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-xl hover:bg-amber-600 shadow-md shadow-amber-500/20 transition-all opacity-0 group-hover:opacity-100"
                  >
                    Sử dụng
                  </button>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
}
