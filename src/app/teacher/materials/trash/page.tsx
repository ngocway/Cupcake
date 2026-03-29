"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrashListItem } from './_components/TrashListItem';
import { MaterialStatus } from '@prisma/client';

type Assignment = {
  id: string;
  title: string;
  status: MaterialStatus;
  materialType: any;
  subject: string | null;
  gradeLevel: string | null;
  thumbnail: string | null;
  questionCount: number;
  assignedCount: number;
  createdAt: string;
};

export default function MaterialsTrashPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeletedAssignments = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/assignments', window.location.origin);
      url.searchParams.set('trash', 'true');
      
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.assignments) {
        setAssignments(data.assignments);
      }
    } catch (err) {
      console.error('Failed to fetch deleted assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedAssignments();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between border-b border-[#f0f2f4] dark:border-gray-800 pb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[#617589] dark:text-gray-400 mb-2">
              <Link href="/teacher/materials" className="hover:text-primary transition-colors flex items-center gap-1 text-sm">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Thư viện bài tập</span>
              </Link>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Thùng rác</h1>
            <p className="text-[#617589] dark:text-gray-400">
              {loading ? 'Đang tải...' : `Bạn đang có ${assignments.length} bài tập trong thùng rác.`}
            </p>
          </div>
        </div>

        {/* Assignment List */}
        <div className="flex flex-col gap-3">
          {loading ? (
            // Skeleton Loading
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl h-24 animate-pulse border border-[#f0f2f4] dark:border-gray-700"></div>
            ))
          ) : (
            <>
              {assignments.map((assignment) => (
                <TrashListItem 
                  key={assignment.id} 
                  assignment={assignment} 
                  onAction={() => {
                    setAssignments(prev => prev.filter(a => a.id !== assignment.id));
                  }}
                />
              ))}
            </>
          )}

          {!loading && assignments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-[#f0f2f4] dark:border-gray-700 mt-4 text-center p-8">
              <div className="size-20 bg-gray-50 dark:bg-gray-700/50 text-gray-300 dark:text-gray-600 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-6xl">delete_outline</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Thùng rác trống</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Các bài tập mà bạn xóa sẽ xuất hiện ở đây. Bạn có thể khôi phục lại chúng bất cứ lúc nào.</p>
              <Link 
                href="/teacher/materials"
                className="mt-8 px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all inline-block"
              >
                Quay lại thư viện
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
