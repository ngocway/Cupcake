"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { customGenerateLesson } from '@/actions/lesson-ai';
import 'react-quill-new/dist/quill.snow.css';

// Import ReactQuill dynamically to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface AiGeneratorModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    subject: 'Tiếng Anh',
    difficulty: 'MEDIUM',
    language: 'Tiếng Anh',
    questionCount: 5,
    providedPassage: '',
    additionalInstructions: '',
    generateVocab: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    try {
      console.log('Sending generation request:', formData);
      const res = await customGenerateLesson({
        ...formData,
        gradeLevel: "10", // Default or get from somewhere
        wordCount: 0 // Not used when passage provided
      } as any);
      
      if (res && res.success) {
        console.log('Generation success, closing modal');
        onClose();
        onSuccess();
        alert('Tạo bài học AI thành công!');
      } else if (res && res.error) {
        console.error('Generation error:', res.error);
        alert(`Lỗi: ${res.error}`);
      }
    } catch (err: any) {
      console.error('Fatal generation error:', err);
      alert(`Lỗi hệ thống: ${err.message || 'Không xác định'}`);
    } finally {
      setLoading(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-[32px] w-full max-w-2xl shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            <h3 className="text-xl font-bold font-headline">AI Assistant Generator</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tiêu đề / Chủ đề bài học</label>
            <input 
              required
              type="text"
              value={formData.topic}
              onChange={e => setFormData({...formData, topic: e.target.value})}
              placeholder="Ví dụ: Bảo vệ môi trường, Trí tuệ nhân tạo..."
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nội dung bài đọc (Rich Text)</label>
            <div className="quill-container rounded-2xl overflow-hidden border-2 border-slate-50 dark:border-gray-800 focus-within:border-blue-500 transition-all bg-slate-50 dark:bg-gray-800">
              <ReactQuill 
                theme="snow"
                value={formData.providedPassage}
                onChange={(content) => setFormData({...formData, providedPassage: content})}
                modules={quillModules}
                placeholder="Dán hoặc nhập nội dung bài học vào đây..."
                className="bg-white dark:bg-gray-900 min-h-[200px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Hướng dẫn tạo câu hỏi (Tùy chọn)</label>
            <textarea 
              value={formData.additionalInstructions}
              onChange={e => setFormData({...formData, additionalInstructions: e.target.value})}
              placeholder="Ví dụ: Tập trung vào thì hiện tại tiếp diễn, hoặc các cấu trúc ngữ pháp có trong bài..."
              rows={2}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-medium resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Số câu hỏi</label>
              <input 
                type="number" 
                min={1} 
                max={20}
                value={formData.questionCount}
                onChange={e => setFormData({...formData, questionCount: parseInt(e.target.value)})}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Cấp độ</label>
              <select 
                value={formData.difficulty}
                onChange={e => setFormData({...formData, difficulty: e.target.value})}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-medium appearance-none"
              >
                <option value="EASY">Dễ</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HARD">Khó</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Ngôn ngữ bài đọc</label>
              <select 
                value={formData.language}
                onChange={e => {
                  const val = e.target.value;
                  setFormData({
                    ...formData, 
                    language: val as any,
                    subject: val 
                  });
                }}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-medium appearance-none"
              >
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Tiếng Việt">Tiếng Việt</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800 rounded-2xl border-2 border-transparent hover:border-blue-500/20 transition-all">
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined ${formData.generateVocab ? 'text-blue-500' : 'text-slate-400'}`}>
                translate
              </span>
              <div>
                <p className="text-sm font-bold">Bật chức năng từ vựng</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">Tự động trích xuất và giải thích các từ vựng mới</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({...formData, generateVocab: !formData.generateVocab})}
              className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${formData.generateVocab ? 'bg-blue-600' : 'bg-slate-300 dark:bg-gray-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.generateVocab ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-gray-800 flex items-center justify-end gap-3 shrink-0">
            <button 
              type="button"
              onClick={onClose}
              className="px-8 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit"
              disabled={loading || !formData.providedPassage}
              className="flex-1 bg-neutral-900 text-white border border-neutral-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all disabled:opacity-50 shadow-xl active:scale-95"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <span>Đang phân tích nội dung...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <span>Tạo bài học ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
        
        <style jsx global>{`
          .ql-container {
            font-family: inherit;
            font-size: 16px;
            border: none !important;
          }
          .ql-toolbar {
            border: none !important;
            border-bottom: 1px solid #e2e8f0 !important;
            background: #f8fafc;
          }
          .dark .ql-toolbar {
            background: #1e293b;
            border-bottom: 1px solid #334155 !important;
          }
          .ql-editor {
            min-height: 200px;
            max-height: 400px;
            overflow-y: auto;
          }
          .dark .ql-editor.ql-blank::before {
            color: #94a3b8;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #475569;
          }
        `}</style>
      </div>
    </div>
  );
};
