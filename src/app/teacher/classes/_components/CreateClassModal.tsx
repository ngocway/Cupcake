"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateClassModal({ isOpen, onClose, onSuccess }: CreateClassModalProps) {
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedColor, setSelectedColor] = useState("bg-blue-500");
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameRef.current?.value.trim();
    if (!name) return;
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: descRef.current?.value.trim() }),
      });

      if (!res.ok) {
        let msg = `Lỗi ${res.status}`;
        try { const d = await res.json(); msg = d.error || msg; } catch { /* empty */ }
        throw new Error(msg);
      }

      const newClass = await res.json();
      onSuccess?.();
      onClose();
      router.push(`/teacher/classes/${newClass.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-indigo-500",
    "bg-purple-500",
    "bg-slate-700"
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#111418]/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#111418] dark:text-white">Tạo lớp học mới</h2>
          <button 
            onClick={onClose}
            className="size-10 flex items-center justify-center rounded-full hover:bg-[#f0f2f4] dark:hover:bg-gray-800 text-[#617589] transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="px-8 py-4">
          <form id="createClassForm" onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[#111418] dark:text-gray-200">Tên lớp <span className="text-red-500">*</span></label>
              <input 
                ref={nameRef}
                className="w-full h-12 px-4 rounded-xl border border-[#e5e7eb] dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base" 
                placeholder="Ví dụ: Lớp 10A1" 
                required 
                type="text"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[#111418] dark:text-gray-200">Mô tả / Niên khóa</label>
              <input 
                ref={descRef}
                className="w-full h-12 px-4 rounded-xl border border-[#e5e7eb] dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base" 
                placeholder="Nhập mô tả hoặc niên khóa học..." 
                type="text"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[#111418] dark:text-gray-200">Ảnh bìa &amp; Màu sắc</label>
              <div className="grid grid-cols-5 gap-3">
                <button 
                  className="aspect-video col-span-2 rounded-xl border-2 border-dashed border-[#e5e7eb] dark:border-gray-700 flex flex-col items-center justify-center gap-1 text-[#617589] hover:border-primary hover:text-primary transition-all group" 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
                  <span className="text-[10px] font-bold">Tải ảnh lên</span>
                </button>
                <div className="col-span-3 flex flex-wrap gap-2.5 items-center pl-2">
                  {colors.map(color => (
                    <button 
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`size-8 rounded-full ${color} transition-transform ${selectedColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-110'}`} 
                      type="button" 
                    />
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>

        {error && (
          <p className="px-8 text-sm text-red-600 font-medium">{error}</p>
        )}
        
        <div className="px-8 pb-8 pt-4 flex items-center justify-end gap-3 border-t border-[#f0f2f4] dark:border-gray-800 mt-4">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-bold text-[#617589] hover:bg-[#f0f2f4] dark:hover:bg-gray-800 transition-colors"
          >
            Hủy
          </button>
          <button 
            type="submit"
            form="createClassForm"
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang tạo...' : 'Tạo lớp'}
          </button>
        </div>
      </div>
    </div>
  );
}
