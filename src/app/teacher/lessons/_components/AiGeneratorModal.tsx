"use client";

import React, { useState } from 'react';
import { customGenerateLesson } from '@/actions/lesson-ai';

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
    wordCount: 400
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    try {
      console.log('Sending generation request:', formData);
      const res = await customGenerateLesson(formData as any);
      
      if (res && res.success) {
        console.log('Generation success, closing modal');
        // Close modal first for better UX
        onClose();
        // Then notify parent to refresh
        onSuccess();
        // Optional: notification
        alert('Tạo bài học AI thành công!');
      } else if (res && res.error) {
        console.error('Generation error:', res.error);
        alert(`Lỗi: ${res.error}`);
      } else {
        console.error('Unknown response:', res);
        alert('Có lỗi xảy ra: Phản hồi không hợp lệ từ máy chủ.');
      }
    } catch (err: any) {
      console.error('Fatal generation error:', err);
      alert(`Lỗi hệ thống: ${err.message || 'Không xác định'}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-[32px] w-full max-w-lg shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            <h3 className="text-xl font-bold font-headline">AI Assistant Generator</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Chủ đề bài học</label>
            <input 
              required
              type="text"
              value={formData.topic}
              onChange={e => setFormData({...formData, topic: e.target.value})}
              placeholder="Ví dụ: Bảo vệ môi trường, Trí tuệ nhân tạo..."
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Độ dài (từ)</label>
              <select 
                value={formData.wordCount}
                onChange={e => setFormData({...formData, wordCount: parseInt(e.target.value)})}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-medium appearance-none"
              >
                <option value={200}>Ngắn (200 từ)</option>
                <option value={400}>Trung bình (400 từ)</option>
                <option value={700}>Dài (700 từ)</option>
                <option value={1000}>Rất dài (1000 từ)</option>
              </select>
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                    subject: val // Synchronize subject with language
                  });
                }}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-medium appearance-none"
              >
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Tiếng Việt">Tiếng Việt</option>
              </select>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-gray-800 flex items-center justify-end gap-3 text-white">
            <button 
              type="button"
              onClick={onClose}
              className="px-8 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 bg-neutral-900 border border-neutral-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all disabled:opacity-50 shadow-xl active:scale-95"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <span>Đang xử lý nội dung...</span>
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
      </div>
    </div>
  );
};
