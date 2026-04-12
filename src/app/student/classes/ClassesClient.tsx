'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cancelJoinRequest } from './actions';

type FormattedClassInfo = {
  id: string;
  status: string;
  joinedAt: Date;
  class: {
    id: string;
    name: string;
    teacherName: string;
    totalAssignments: number;
  };
  pendingCount: number;
};

interface ClassesClientProps {
  activeClasses: FormattedClassInfo[];
  pendingRequests: FormattedClassInfo[];
}

export default function ClassesClient({ activeClasses, pendingRequests }: ClassesClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const matchedActive = activeClasses.filter(c => 
    c.class.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.class.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const matchedPending = pendingRequests.filter(c => 
    c.class.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.class.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCancelRequest = async (classId: string) => {
    setCancelingId(classId);
    try {
      await cancelJoinRequest(classId);
    } catch (err) {
      alert("Lỗi khi hủy yêu cầu");
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div className="space-y-12">
      {/* Search Bar */}
      <div className="relative max-w-lg">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant z-10">
          search
        </span>
        <input 
          type="text" 
          placeholder="Tìm kiếm theo tên lớp hoặc giáo viên..." 
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Pending Requests Section */}
      {matchedPending.length > 0 && (
        <section className="space-y-6">
           <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Đang chờ duyệt
            <span className="h-6 px-2 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center justify-center font-bold">
              {matchedPending.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchedPending.map(item => (
              <div key={item.id} className="relative p-6 bg-surface-container-lowest border border-amber-200/50 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">hourglass_empty</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Chờ giáo viên
                  </span>
                </div>
                <div className="mt-5 space-y-1">
                  <h3 className="text-xl font-bold line-clamp-1">{item.class.name}</h3>
                  <p className="text-on-surface-variant text-sm font-medium">GV: {item.class.teacherName}</p>
                </div>
                <div className="mt-6 pt-5 border-t border-outline-variant/20 flex gap-3">
                   <button 
                      onClick={() => handleCancelRequest(item.id)}
                      disabled={cancelingId === item.id}
                      className="flex-1 py-2 text-sm font-bold text-red-600 hover:bg-red-50 bg-transparent rounded-xl transition-colors disabled:opacity-50"
                   >
                     {cancelingId === item.id ? 'Đang hủy...' : 'Hủy yêu cầu'}
                   </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Classes Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          Lớp đang học
          <span className="w-2 h-2 bg-primary rounded-full"></span>
        </h2>
        
        {matchedActive.length === 0 ? (
          <div className="bg-surface-container-low p-12 rounded-3xl text-center border-2 border-dashed border-outline-variant/30">
            <span className="material-symbols-outlined text-5xl text-outline-variant/50 mb-4 block">class</span>
            <h3 className="text-xl font-bold mb-2">Chưa có lớp học nào</h3>
            <p className="text-on-surface-variant mb-6">Bạn chưa tham gia lớp học nào, hoặc không tìm thấy lớp phù hợp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchedActive.map((item, i) => {
              // Select a playful gradient based on index
              const gradients = [
                'from-blue-500 to-indigo-600',
                'from-emerald-400 to-teal-500',
                'from-orange-400 to-red-500',
                'from-violet-500 to-fuchsia-500',
                'from-cyan-400 to-blue-500'
              ];
              const bgGradient = gradients[i % gradients.length];

              return (
                <Link href={`/student/classes/${item.id}`} key={item.id} className="group relative bg-surface-container-lowest border border-outline-variant/20 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block">
                  {/* Decorative Banner */}
                  <div className={`h-24 w-full bg-gradient-to-r ${bgGradient} p-6 relative overflow-hidden`}>
                    <div className="absolute right-0 bottom-0 opacity-20 translate-x-1/4 translate-y-1/4">
                       <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                         school
                       </span>
                    </div>
                  </div>
                  
                  {/* Class Info */}
                  <div className="p-6 relative -mt-10">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow flex items-center justify-center border-2 border-slate-50 mb-4 text-xl font-black text-slate-800">
                       {item.class.name.substring(0,2).toUpperCase()}
                    </div>
                    <div className="space-y-1 mb-6">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{item.class.name}</h3>
                      <p className="text-sm font-medium text-slate-500">Giáo viên: {item.class.teacherName}</p>
                    </div>
                    
                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nhiệm vụ mới</p>
                        <p className="font-bold text-slate-800 text-lg flex items-center gap-1.5">
                          {item.pendingCount > 0 ? (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          )}
                          {item.pendingCount}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng bài tập</p>
                        <p className="font-bold text-slate-800 text-lg">
                          {item.class.totalAssignments}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
