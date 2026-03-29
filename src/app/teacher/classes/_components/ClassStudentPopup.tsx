'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Student {
  id: string;
  name: string;
  email: string;
  status: string;
  isManagedAccount: boolean;
}

interface ClassStudentPopupProps {
  classId: string;
  className: string;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}

export function ClassStudentPopup({ classId, className, anchorRef, onClose }: ClassStudentPopupProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch(`/api/classes/${classId}/students`);
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students ?? []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [classId]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose, anchorRef]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const statusLabel = (status: string) =>
    status === 'ACTIVE'
      ? <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Đang học</span>
      : <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Đã mời</span>;

  return (
    <div
      ref={popupRef}
      className="absolute z-50 right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-[#f0f2f4] dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#f0f2f4] dark:border-gray-800 flex items-center justify-between gap-2">
        <div>
          <p className="font-bold text-sm text-[#111418] dark:text-white truncate">{className}</p>
          <p className="text-xs text-[#617589]">{isLoading ? '...' : `${students.length} học sinh`}</p>
        </div>
        <button
          onClick={onClose}
          className="size-7 flex items-center justify-center rounded-full hover:bg-[#f0f2f4] dark:hover:bg-gray-800 text-[#617589] transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-[#f0f2f4] dark:border-gray-800">
        <div className="flex items-center gap-2 bg-[#f0f2f4] dark:bg-gray-800 rounded-lg px-3 py-1.5">
          <span className="material-symbols-outlined text-[16px] text-[#617589]">search</span>
          <input
            className="flex-1 bg-transparent text-xs text-[#111418] dark:text-white placeholder-[#617589] outline-none"
            placeholder="Tìm học sinh..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-[#617589] hover:text-[#111418]">
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Student list */}
      <div className="max-h-72 overflow-y-auto">
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <span className="material-symbols-outlined text-[28px] text-[#617589] animate-spin">progress_activity</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#617589]">
            <span className="material-symbols-outlined text-[32px] block mb-1 opacity-30">group_off</span>
            {search ? 'Không tìm thấy học sinh nào.' : 'Chưa có học sinh trong lớp.'}
          </div>
        ) : (
          <ul className="divide-y divide-[#f0f2f4] dark:divide-gray-800">
            {filtered.map(s => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8f9fa] dark:hover:bg-gray-800/50 transition-colors">
                {/* Avatar */}
                <div className="size-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/60 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {(s.name || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#111418] dark:text-white truncate">{s.name}</p>
                  <p className="text-[10px] text-[#617589] truncate">{s.email}</p>
                </div>
                <div className="shrink-0">
                  {statusLabel(s.status)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#f0f2f4] dark:border-gray-800 bg-[#f8f9fa] dark:bg-gray-900/50">
        <Link
          href={`/teacher/classes/${classId}`}
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:underline"
          onClick={onClose}
        >
          Quản lý lớp học
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
