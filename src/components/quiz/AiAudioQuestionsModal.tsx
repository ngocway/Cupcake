"use client";

import React, { useState } from 'react';
import { Sparkles, X, Music } from 'lucide-react';

interface AiAudioQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (counts: {
    mcq: number;
    tf: number;
    cloze: number;
    matching: number;
  }) => void;
  isGenerating?: boolean;
}

export function AiAudioQuestionsModal({ isOpen, onClose, onConfirm, isGenerating }: AiAudioQuestionsModalProps) {
  const [mcqCount, setMcqCount] = useState(2);
  const [tfCount, setTfCount] = useState(2);
  const [clozeCount, setClozeCount] = useState(0);
  const [matchingCount, setMatchingCount] = useState(0);

  if (!isOpen) return null;

  const totalQuestions = mcqCount + tfCount + clozeCount + matchingCount;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col relative">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Music className="w-5 h-5 text-emerald-50" />
            </div>
            <h3 className="text-lg font-bold font-headline tracking-tight">Tạo câu hỏi từ Audio</h3>
          </div>
          <button onClick={onClose} disabled={isGenerating} className="p-1.5 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Hệ thống sẽ quét các đoạn audio đã được tạo trong bài học và sử dụng AI để tự động tạo câu hỏi bám sát nội dung của các đoạn audio đó.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-2 transition-all hover:border-emerald-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trắc nghiệm</span>
              <input 
                type="number" 
                min="0" max="10" 
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 font-bold text-slate-800 dark:text-white text-base focus:ring-2 focus:ring-emerald-500 outline-none" 
                value={mcqCount} 
                onChange={e => setMcqCount(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={isGenerating}
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-2 transition-all hover:border-emerald-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đúng / Sai</span>
              <input 
                type="number" 
                min="0" max="10" 
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 font-bold text-slate-800 dark:text-white text-base focus:ring-2 focus:ring-emerald-500 outline-none" 
                value={tfCount} 
                onChange={e => setTfCount(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={isGenerating}
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-2 transition-all hover:border-emerald-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Điền từ</span>
              <input 
                type="number" 
                min="0" max="10" 
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 font-bold text-slate-800 dark:text-white text-base focus:ring-2 focus:ring-emerald-500 outline-none" 
                value={clozeCount} 
                onChange={e => setClozeCount(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={isGenerating}
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-2 transition-all hover:border-emerald-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nối từ</span>
              <input 
                type="number" 
                min="0" max="10" 
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 font-bold text-slate-800 dark:text-white text-base focus:ring-2 focus:ring-emerald-500 outline-none" 
                value={matchingCount} 
                onChange={e => setMatchingCount(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={isGenerating}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={() => onConfirm({ mcq: mcqCount, tf: tfCount, cloze: clozeCount, matching: matchingCount })}
            disabled={isGenerating || totalQuestions === 0}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                Đang xử lý...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Tạo {totalQuestions} câu hỏi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
