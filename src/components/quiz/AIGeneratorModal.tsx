"use client";

import React, { useState } from 'react';
import { QuestionType } from './types';
import { generateQuizQuestions } from '@/actions/ai-quiz-generator';

interface AIGeneratorModalProps {
  onClose: () => void;
  onQuestionsGenerated: (questions: any[], type: QuestionType) => void;
}

export function AIGeneratorModal({ onClose, onQuestionsGenerated }: AIGeneratorModalProps) {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState<number>(5);
  const [type, setType] = useState<QuestionType>('MULTIPLE_CHOICE');
  const [difficulty, setDifficulty] = useState('Dễ (Cơ bản)');
  const [language, setLanguage] = useState('VI');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Vui lòng nhập chủ đề hoặc từ khóa.');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    
    try {
      const data = await generateQuizQuestions({
        topic,
        count,
        type,
        difficulty,
        language
      });
      
      if (data && data.questions) {
        onQuestionsGenerated(data.questions, type);
      } else {
        throw new Error('Dữ liệu trả về bị lỗi. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo câu hỏi.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-gray-800 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-slate-100 dark:border-gray-800 bg-indigo-50/50 dark:bg-indigo-900/10">
          <div className="size-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px]">auto_awesome</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Tạo bài tập bằng AI (Beta)</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Thiết lập để hệ thống tự động sinh ra các câu hỏi phù hợp với bài giảng của bạn.</p>
          </div>
          <button 
            onClick={onClose}
            className="size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-3">
              <span className="material-symbols-outlined shrink-0 text-[20px]">error</span>
              <p>{error}</p>
            </div>
          )}

          {/* Topic */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Từ khóa / Chủ đề <span className="text-red-500">*</span></label>
            <textarea 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="VD: Thì hiện tại đơn, Cuộc khởi nghĩa Hai Bà Trưng, Phương trình bậc 2..."
              className="resize-none h-24 p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Count */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Số lượng câu hỏi</label>
              <select 
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none"
              >
                <option value={3}>3 câu</option>
                <option value={5}>5 câu</option>
                <option value={10}>10 câu</option>
                <option value={15}>15 câu</option>
              </select>
            </div>

            {/* Type */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Loại bài tập</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none"
              >
                <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                <option value="TRUE_FALSE">Đúng / Sai</option>
                <option value="CLOZE_TEST" disabled>Điền từ (Đang cập nhật)</option>
                <option value="MATCHING" disabled>Nối cặp (Đang cập nhật)</option>
              </select>
            </div>

            {/* Difficulty */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Độ khó</label>
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none"
              >
                <option value="Dễ (Cơ bản)">Dễ (Cơ bản)</option>
                <option value="Trung bình (Vận dụng)">Trung bình (Vận dụng)</option>
                <option value="Khó (Vận dụng cao)">Khó (Vận dụng cao)</option>
              </select>
            </div>

            {/* Language */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Ngôn ngữ đầu ra</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none"
              >
                <option value="VI">Tiếng Việt</option>
                <option value="EN">Tiếng Anh</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-gray-800 flex justify-end gap-3 bg-slate-50 dark:bg-gray-800/50">
          <button 
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-8 py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                Đang tạo...
              </>
            ) : (
              <>
                Tạo bài tập
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
