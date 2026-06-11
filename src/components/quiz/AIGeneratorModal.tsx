"use client";

import React, { useState } from 'react';
import { QuestionType } from './types';
import { generateQuizQuestions } from '@/actions/ai-quiz-generator';

interface AIGeneratorModalProps {
  onClose: () => void;
  onQuestionsGenerated: (generatedData: { type: QuestionType, questions: any[] }[], metadata?: any) => void;
}

export function AIGeneratorModal({ onClose, onQuestionsGenerated }: AIGeneratorModalProps) {
  const [topic, setTopic] = useState('');
  const [distribution, setDistribution] = useState<Record<QuestionType, number>>({
    MULTIPLE_CHOICE: 5,
    TRUE_FALSE: 0,
    CLOZE_TEST: 0,
    MATCHING: 0,
    REORDER: 0
  });
  const [difficulty, setDifficulty] = useState('A1');
  const [language, setLanguage] = useState('VI');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const totalCount = Object.values(distribution).reduce((acc, val) => acc + (val || 0), 0);

  const handleDistributionChange = (type: QuestionType, delta: number) => {
    setDistribution(prev => {
      const newVal = (prev[type] || 0) + delta;
      if (newVal < 0) return prev;
      return { ...prev, [type]: newVal };
    });
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Vui lòng nhập chủ đề hoặc từ khóa.');
      return;
    }
    if (totalCount === 0) {
      setError('Vui lòng chọn số lượng câu hỏi ít nhất là 1.');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    
    try {
      const promises = [];
      const types = Object.keys(distribution) as QuestionType[];
      
      for (const type of types) {
        if (distribution[type] > 0) {
          promises.push(
            generateQuizQuestions({
              topic,
              count: distribution[type],
              type,
              difficulty,
              language,
              includeMetadata: false // Do not generate or overwrite title, descriptions, etc.
            }).then(data => ({ type, data }))
          );
        }
      }
      
      const results = await Promise.all(promises);
      
      const validResults = results.map(r => ({
        type: r.type,
        questions: r.data.questions || []
      }));
      
      // Pass validResults and undefined for metadata so it doesn't overwrite anything
      onQuestionsGenerated(validResults, undefined);
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
            {/* Distribution */}
            <div className="flex flex-col gap-4 sm:col-span-2 mb-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Phân bổ câu hỏi (Tổng: {totalCount} câu)</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Trắc nghiệm */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-[20px]">🔘</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Trắc nghiệm</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => handleDistributionChange('MULTIPLE_CHOICE', -1)} className="size-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 transition-colors text-slate-600 dark:text-slate-300">-</button>
                    <span className="text-sm font-bold w-4 text-center text-slate-700 dark:text-slate-300">{distribution.MULTIPLE_CHOICE}</span>
                    <button type="button" onClick={() => handleDistributionChange('MULTIPLE_CHOICE', 1)} className="size-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 transition-colors text-slate-600 dark:text-slate-300">+</button>
                  </div>
                </div>

                {/* Đúng/Sai */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-[20px]">✅</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Đúng / Sai</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => handleDistributionChange('TRUE_FALSE', -1)} className="size-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 transition-colors text-slate-600 dark:text-slate-300">-</button>
                    <span className="text-sm font-bold w-4 text-center text-slate-700 dark:text-slate-300">{distribution.TRUE_FALSE}</span>
                    <button type="button" onClick={() => handleDistributionChange('TRUE_FALSE', 1)} className="size-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 transition-colors text-slate-600 dark:text-slate-300">+</button>
                  </div>
                </div>

                {/* Điền từ */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-[20px]">📝</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Điền từ</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => handleDistributionChange('CLOZE_TEST', -1)} className="size-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 transition-colors text-slate-600 dark:text-slate-300">-</button>
                    <span className="text-sm font-bold w-4 text-center text-slate-700 dark:text-slate-300">{distribution.CLOZE_TEST}</span>
                    <button type="button" onClick={() => handleDistributionChange('CLOZE_TEST', 1)} className="size-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 transition-colors text-slate-600 dark:text-slate-300">+</button>
                  </div>
                </div>
                
                {/* Nối cặp */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-[20px]">🔗</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nối cặp</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => handleDistributionChange('MATCHING', -1)} className="size-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 transition-colors text-slate-600 dark:text-slate-300">-</button>
                    <span className="text-sm font-bold w-4 text-center text-slate-700 dark:text-slate-300">{distribution.MATCHING}</span>
                    <button type="button" onClick={() => handleDistributionChange('MATCHING', 1)} className="size-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 transition-colors text-slate-600 dark:text-slate-300">+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Difficulty */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Độ khó</label>
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none"
              >
                <option value="A1">A1 (Beginner)</option>
                <option value="A2">A2 (Elementary)</option>
                <option value="B1">B1 (Intermediate)</option>
                <option value="B2">B2 (Upper Intermediate)</option>
                <option value="C1">C1 (Advanced)</option>
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
