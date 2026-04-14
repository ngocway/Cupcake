"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

type Assignment = {
  id: string;
  title: string;
  materialType: 'EXERCISE' | 'READING' | 'FLASHCARD';
  defaultPoints: number;
};

type Submission = {
  id: string;
  score: number | null;
  submittedAt: string;
};

type StudentGrades = {
  id: string;
  name: string;
  email: string;
  isManagedAccount: boolean;
  pin: string | null;
  submissions: Record<string, Submission>;
};

export function GradesTab({ classId }: { classId: string }) {
  const [data, setData] = useState<{ assignments: Assignment[], students: StudentGrades[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchGrades = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/classes/${classId}/grades`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Failed to load grades', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGrades();
  }, [classId]);

  const filteredStudents = useMemo(() => {
    if (!data) return [];
    return data.students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const handleExportCSV = () => {
    if (!data) return;

    // BOM for UTF-8 in Excel
    const BOM = '\uFEFF';
    let csv = BOM + 'Họ và tên,Email,Mã PIN';
    
    data.assignments.forEach(a => {
      csv += `,"${a.title.replace(/"/g, '""')}"`;
    });
    csv += '\n';

    data.students.forEach(s => {
      csv += `"${s.name.replace(/"/g, '""')}","${s.email}","${s.pin || ''}"`;
      data.assignments.forEach(a => {
        const sub = s.submissions[a.id];
        csv += `,${sub ? sub.score ?? 'Đã nộp' : '-'}`;
      });
      csv += '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bang-diem-${classId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-full bg-gray-100 dark:bg-gray-800 rounded-xl" />
        <div className="h-[400px] w-full bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800" />
      </div>
    );
  }

  if (!data || data.assignments.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-[#f0f2f4] dark:border-gray-700 rounded-2xl p-16 text-center text-[#617589]">
        <span className="material-symbols-outlined text-[48px] opacity-30 mb-4">analytics</span>
        <h3 className="font-bold text-[#111418] dark:text-white text-lg">Chưa có dữ liệu điểm</h3>
        <p className="max-w-xs mx-auto text-sm mt-2">Hãy giao bài tập và đợi học sinh nộp bài để xem bảng điểm tổng hợp.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#617589]">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </div>
          <input
            className="block w-full rounded-xl border border-[#f0f2f4] dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
            placeholder="Tìm tên học sinh..."
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
          Xuất file Excel
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#f0f2f4] dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-[#f0f2f4] dark:border-gray-700">
                <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider w-64 sticky left-0 z-10 bg-gray-50 dark:bg-gray-900/50 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  Học sinh
                </th>
                {data.assignments.map(a => (
                  <th key={a.id} className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider text-center border-l border-[#f0f2f4] dark:border-gray-700 min-w-[120px]">
                    <div className="truncate" title={a.title}>{a.title}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f4] dark:divide-gray-700">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                  <td className="px-6 py-4 sticky left-0 z-10 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-[#111418] dark:text-white truncate">{student.name}</span>
                      <span className="text-xs text-[#617589] truncate">{student.email}</span>
                    </div>
                  </td>
                  {data.assignments.map(a => {
                    const submission = student.submissions[a.id];
                    return (
                      <td key={a.id} className="px-6 py-4 text-center border-l border-[#f0f2f4] dark:border-gray-700">
                        {submission ? (
                          <Link 
                            href={`/teacher/classes/${classId}/assignments/${a.id}?studentId=${student.id}`}
                            className="inline-flex flex-col items-center hover:scale-110 transition-transform"
                          >
                            <span className={`text-sm font-extrabold ${submission.score !== null ? 'text-primary' : 'text-emerald-600'}`}>
                              {submission.score !== null ? submission.score.toFixed(1) : 'Đã nộp'}
                            </span>
                            <span className="text-[10px] text-[#617589] opacity-0 group-hover:opacity-100 transition-opacity">Xem bài</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-300 dark:text-gray-600 font-medium">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-[#f0f2f4] dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-[#617589]">Hiển thị {filteredStudents.length} học sinh</p>
          <div className="flex items-center gap-4 text-xs font-medium text-[#617589]">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" /> Điểm số
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" /> Chưa chấm (hoàn thành)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
