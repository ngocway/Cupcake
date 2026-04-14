"use client";

import React, { useState, useEffect } from 'react';
import { updateStudentNote } from '../actions';

interface StudentNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: { id: string; name: string; notes?: string } | null;
  classId: string;
  onSuccess: (newNotes: string) => void;
}

export function StudentNoteModal({ isOpen, onClose, student, classId, onSuccess }: StudentNoteModalProps) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setNotes(student.notes || '');
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateStudentNote(classId, student.id, notes);
      if (res.success) {
        onSuccess(notes);
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert('Không thể lưu ghi chú');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">edit_note</span>
            </div>
            <div>
              <h3 className="font-bold text-lg">Ghi chú chuyên môn</h3>
              <p className="text-xs text-[#617589]">{student.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-6">
          <label className="block text-sm font-bold mb-2">Nội dung ghi chú</label>
          <textarea
            className="w-full h-40 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none"
            placeholder="Ví dụ: Học sinh nắm vững ngữ pháp nhưng kỹ năng nói còn hạn chế..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <p className="mt-2 text-[11px] text-[#617589] flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Ghi chú này là riêng tư, chỉ mình bạn có thể xem.
          </p>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-[#617589] hover:bg-gray-200 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[20px]">save</span>
            )}
            Lưu ghi chú
          </button>
        </div>
      </div>
    </div>
  );
}
