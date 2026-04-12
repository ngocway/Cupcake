"use client";

import React, { useState, useEffect } from 'react';
import { ReadingExerciseBuilder } from '@/components/quiz/ReadingExerciseBuilder';
import { createDraftMaterial } from '@/actions/material-actions';
import { MaterialListItem } from '../materials/_components/MaterialListItem';

export default function LessonsPage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showTrash, setShowTrash] = useState(false);

  const fetchLessons = async () => {
    setLoading(true);
    try {
      // Fetch READING materials - check trash status
      const res = await fetch(`/api/assignments?type=READING&trash=${showTrash}`);
      const data = await res.json();
      setLessons(data.assignments || []);
    } catch (err) {
      console.error('Failed to fetch lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [showTrash]);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const id = await createDraftMaterial('READING');
      setEditingId(id);
    } catch (err) {
      console.error('Failed to create lesson:', err);
      alert('Không thể tạo bài học mới. Vui lòng thử lại.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  if (editingId) {
    return (
      <ReadingExerciseBuilder 
        assignmentId={editingId} 
        onBack={() => {
          setEditingId(null);
          fetchLessons();
        }} 
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight">Tất cả bài học</h1>
          <p className="text-[#617589] dark:text-gray-400 text-sm mt-1">
            {showTrash ? 'Quản lý các bài học đã xóa (có thể khôi phục).' : 'Quản lý danh sách các bài học Reading mà bạn đã tạo.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowTrash(!showTrash)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all border ${
              showTrash 
                ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-gray-800 dark:text-white dark:border-gray-700' 
                : 'text-[#617589] border-[#f0f2f4] dark:border-gray-700 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined">{showTrash ? 'arrow_back' : 'delete'}</span>
            {showTrash ? 'Quay lại' : 'Thùng rác'}
          </button>
          {!showTrash && (
            <button 
              onClick={handleCreate}
              disabled={isCreating}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined">add_circle</span>
              {isCreating ? 'Đang khởi tạo...' : 'Tạo bài học'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-5 rounded-2xl h-48 animate-pulse border border-[#f0f2f4] dark:border-gray-700"></div>
          ))
        ) : (
          <>
            {lessons.map((lesson) => (
              <MaterialListItem 
                key={lesson.id}
                assignment={lesson}
                onEdit={handleEdit}
                onDelete={fetchLessons}
                onRefresh={fetchLessons}
                isTrash={showTrash}
              />
            ))}
            {lessons.length === 0 && (
              <div className="lg:col-span-2 flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-[#f0f2f4] dark:border-gray-700">
                <div className="size-20 bg-slate-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-slate-300">
                   <span className="material-symbols-outlined text-[40px]">
                     {showTrash ? 'delete' : 'menu_book'}
                   </span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  {showTrash ? 'Thùng rác trống' : 'Chưa có bài học nào'}
                </h3>
                <p className="text-slate-500 font-medium mt-1">
                  {showTrash 
                    ? 'Quay lại danh sách chính để quản lý bài học.' 
                    : 'Hãy nhấn "Tạo bài học" để bắt đầu soạn thảo nội dung.'
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
