"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AddStudentModal } from './_components/AddStudentModal';
import { StudentUpdateModal } from './_components/StudentUpdateModal';
import { ClassQRModal } from './_components/ClassQRModal';
import { AssignmentsTab } from './_components/AssignmentsTab';

type Student = {
  id: string;
  name: string;
  email: string;
  status: string;
  isManagedAccount: boolean;
  pin?: string;
};

export default function ClassDashboard() {
  const params = useParams();
  const classId = params.id as string;

  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [className, setClassName] = useState('Lớp học');
  const [activeTab, setActiveTab] = useState<'students' | 'assignments' | 'grades'>('students');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [selectedStudentForUpdate, setSelectedStudentForUpdate] = useState<Student | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [openAssignmentCount, setOpenAssignmentCount] = useState(0);

  const handleCopyJoinLink = async () => {
    const url = `${window.location.origin}/join/${joinCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      /* fallback: select input */ 
    }
  };

  // Join code from DB
  const [joinCode, setJoinCode] = useState('...');

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/classes/${classId}/students`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students ?? []);
        setJoinCode(data.class?.joinCode ?? '');
        setClassName(data.class?.name ?? 'Lớp học');
      }
    } catch (err) {
      console.error('Failed to load students', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudents(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col gap-4">
        <nav className="flex text-sm text-[#617589] dark:text-gray-400 gap-2 items-center">
          <Link className="hover:text-primary transition-colors" href="/teacher/classes">Lớp học</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#111418] dark:text-white font-medium">{className}</span>
        </nav>
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight">{className}</h1>
            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-[#617589]">
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-sm font-bold border border-blue-100 dark:border-blue-800">
              <span className="material-symbols-outlined text-[18px]">group</span>
              {students.length} học sinh
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-sm font-bold border border-orange-100 dark:border-orange-800">
              <span className="material-symbols-outlined text-[18px]">assignment</span>
              {openAssignmentCount} bài tập đang giao
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#f0f2f4] dark:border-gray-800 -mt-2">
        <nav className="flex gap-8">
          <button onClick={() => setActiveTab('students')} className={`py-4 text-sm transition-all ${activeTab === 'students' ? 'font-bold tab-active' : 'font-medium text-[#617589] hover:text-primary'}`}>Học sinh</button>
          <button onClick={() => setActiveTab('assignments')} className={`py-4 text-sm transition-all ${activeTab === 'assignments' ? 'font-bold tab-active' : 'font-medium text-[#617589] hover:text-primary'}`}>Bài tập</button>
          <button onClick={() => setActiveTab('grades')} className={`py-4 text-sm transition-all ${activeTab === 'grades' ? 'font-bold tab-active' : 'font-medium text-[#617589] hover:text-primary'}`}>Bảng điểm</button>
        </nav>
      </div>

      {/* Tab: STUDENTS */}
      {activeTab === 'students' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#f0f2f4] dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-lg">Mã tham gia lớp học</h3>
              <p className="text-sm text-[#617589]">Chia sẻ liên kết này để học sinh tự tham gia lớp học</p>
            </div>
            <div className="flex flex-1 max-w-xl items-center gap-3">
              <div className="flex-1 relative">
                <input 
                  className="w-full bg-[#f0f2f4] dark:bg-gray-900 border-none rounded-xl py-2.5 pl-4 pr-20 text-sm font-medium focus:ring-primary/50" 
                  readOnly 
                  type="text" 
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${joinCode}`}
                />
                <button
                  onClick={handleCopyJoinLink}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 font-bold text-xs px-2 py-1 rounded transition-colors ${isCopied ? 'text-emerald-600' : 'text-primary hover:text-primary/80'}`}
                >
                  {isCopied ? 'Đã sao chép!' : 'Sao chép'}
                </button>
              </div>
              <button
                onClick={() => setIsQRModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 border border-[#f0f2f4] dark:border-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-primary/30 hover:text-primary transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                Hiện mã QR
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#617589]">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input 
                className="block w-full rounded-xl border border-[#f0f2f4] dark:border-gray-700 bg-white dark:bg-gray-800 py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 transition-all" 
                placeholder="Tìm tên học sinh..." 
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => setIsAddStudentModalOpen(true)} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              <span>Thêm học sinh</span>
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#f0f2f4] dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  {selectedStudents.length === 0 ? (
                    <tr className="default-header bg-gray-50 dark:bg-gray-900/50 border-b border-[#f0f2f4] dark:border-gray-700">
                      <th className="px-6 py-4 w-10">
                        <input 
                          className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4" 
                          type="checkbox"
                          checked={false}
                          onChange={toggleAll}
                        />
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Họ và tên</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Mã PIN</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider w-10"></th>
                    </tr>
                  ) : (
                    <tr className="bulk-action-bar-active bg-blue-50 dark:bg-blue-900/40 border-b border-blue-100 dark:border-blue-800">
                      <th className="px-6 py-3 w-10">
                        <input 
                          className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer" 
                          type="checkbox"
                          checked={selectedStudents.length === students.length}
                          onChange={toggleAll}
                        />
                      </th>
                      <th className="px-6 py-3" colSpan={5}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-primary">Đã chọn {selectedStudents.length} học sinh</span>
                          <div className="flex gap-2">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                              <span>Xoá</span>
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-primary hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors">
                              <span className="material-symbols-outlined text-[20px]">mail</span>
                              <span>Gửi mail</span>
                            </button>
                          </div>
                        </div>
                      </th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-[#f0f2f4] dark:divide-gray-700">
                  {isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4"><div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-44 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                        <td className="px-6 py-4"><div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                      </tr>
                    ))
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-[#617589]">
                          <span className="material-symbols-outlined text-[40px] opacity-40">group_off</span>
                          <p className="font-medium">{searchTerm ? 'Không tìm thấy học sinh nào.' : 'Chưa có học sinh nào trong lớp.'}</p>
                          {!searchTerm && (
                            <button
                              onClick={() => setIsAddStudentModalOpen(true)}
                              className="text-primary font-semibold hover:underline text-sm"
                            >
                              + Thêm học sinh ngay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => {
                      const isSelected = selectedStudents.includes(student.id);
                      return (
                        <tr key={student.id} className={`transition-colors ${isSelected ? 'bg-blue-50/30 dark:bg-primary/5' : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/30'}`}>
                          <td className="px-6 py-4">
                            <input 
                              className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer" 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleStudent(student.id)}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <span 
                              className="font-semibold text-sm cursor-pointer hover:text-primary hover:underline"
                              onClick={() => setSelectedStudentForUpdate(student)}
                            >
                              {student.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#617589]">{student.email}</td>
                          <td className="px-6 py-4">
                            {student.isManagedAccount ? (
                              <div className="flex items-center gap-2 text-[#617589]">
                                <span className="font-mono pt-1 text-lg leading-none">••••</span>
                                <button className="hover:text-primary transition-colors">
                                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-[#617589] italic">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {student.status === 'ACTIVE' ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold status-registered">ĐÃ ĐĂNG KÝ</span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold status-invited">ĐÃ MỜI</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => setSelectedStudentForUpdate(student)}
                              className="text-[#617589] hover:text-[#111418] dark:hover:text-white transition-colors"
                            >
                              <span className="material-symbols-outlined">more_horiz</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-[#f0f2f4] dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-[#617589]">Hiển thị {filteredStudents.length} trong số {students.length} học sinh</p>
              <div className="flex items-center gap-2">
                <button className="p-1 rounded border border-[#f0f2f4] dark:border-gray-700 hover:bg-white transition-colors disabled:opacity-50" disabled>
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button className="size-8 rounded bg-primary text-white text-xs font-bold">1</button>
                <button className="size-8 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-medium">2</button>
                <button className="size-8 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-medium">3</button>
                <button className="p-1 rounded border border-[#f0f2f4] dark:border-gray-700 hover:bg-white transition-colors">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Tab: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <AssignmentsTab classId={classId} onOpenCountChange={setOpenAssignmentCount} />
      )}

      {/* Tab: GRADES Placeholder */}
      {activeTab === 'grades' && (
        <div className="animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 border border-[#f0f2f4] dark:border-gray-700 rounded-2xl p-5 shadow-sm text-center py-20 text-[#617589]">
            <h3 className="font-bold text-[#111418] dark:text-white text-lg mb-2">Bảng điểm</h3>
            <p className="max-w-md mx-auto mb-6 text-sm">Tính năng Bảng điểm đang được phát triển. Dưới đây là ví dụ hiển thị trạng thái nộp bài.</p>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex flex-col items-center bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-[#f0f2f4] dark:border-gray-700 min-w-32">
                 <span className="font-bold text-[#111418] dark:text-white text-sm">Nguyễn Văn An</span>
                 <span className="text-emerald-600 font-bold mt-2">9.5 đ</span>
              </div>
              <div className="flex flex-col items-center bg-orange-50/50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900/50 min-w-32 relative">
                 <div className="absolute -top-3 right-[-10px] bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">Nộp muộn</div>
                 <span className="font-bold text-[#111418] dark:text-white text-sm">Lê Hoàng Cường</span>
                 <span className="text-[#617589] font-bold mt-2">7.2 đ</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <AddStudentModal 
        isOpen={isAddStudentModalOpen} 
        onClose={() => setIsAddStudentModalOpen(false)} 
        classId={classId} 
        onAddSuccess={() => {
          setIsAddStudentModalOpen(false);
          fetchStudents();
        }} 
      />

      <StudentUpdateModal 
        isOpen={!!selectedStudentForUpdate} 
        onClose={() => setSelectedStudentForUpdate(null)} 
        student={selectedStudentForUpdate} 
        onUpdateSuccess={(updated) => {
          setStudents(prev => prev.map(s =>
            s.id === updated.id ? { ...s, name: updated.name, email: updated.email } : s
          ));
          setSelectedStudentForUpdate(null);
        }}
      />

      <ClassQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        className={className}
        joinCode={joinCode}
      />

    </div>
  );
}
