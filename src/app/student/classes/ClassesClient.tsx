'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cancelJoinRequest } from './actions';
import { Search, Hourglass, GraduationCap, Book, Loader2 } from 'lucide-react';

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
  translations: {
    searchPlaceholder: string;
    pendingApproval: string;
    waitingTeacher: string;
    cancelRequest: string;
    canceling: string;
    activeClasses: string;
    noClasses: string;
    noClassesMessage: string;
    teacher: string;
    newAssignments: string;
    totalAssignments: string;
    cancelError: string;
  };
}

import { useRouter } from "next/navigation";

export default function ClassesClient({ activeClasses, pendingRequests, translations }: ClassesClientProps) {
  const router = useRouter();
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
      alert(translations.cancelError);
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div className="space-y-12">
      {/* Search Bar */}
      <div className="relative max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 z-10 stroke-[2px]" />
        <input 
          type="text" 
          placeholder={translations.searchPlaceholder} 
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-slate-900 dark:text-white shadow-sm placeholder:text-slate-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Pending Requests Section */}
      {matchedPending.length > 0 && (
        <section className="space-y-6">
           <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {translations.pendingApproval}
            <span className="h-6 px-2 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center justify-center font-bold">
              {matchedPending.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchedPending.map(item => (
              <div key={item.id} className="relative p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-amber-200/50 dark:border-amber-700/30 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Hourglass className="w-6 h-6 stroke-[2px]" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {translations.waitingTeacher}
                  </span>
                </div>
                <div className="mt-5 space-y-1">
                  <h3 className="text-xl font-bold line-clamp-1">{item.class.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{translations.teacher}: {item.class.teacherName}</p>
                </div>
                <div className="mt-6 pt-5 border-t border-slate-200/50 dark:border-slate-700/50 flex gap-3">
                   <button 
                      onClick={() => handleCancelRequest(item.id)}
                      disabled={cancelingId === item.id}
                      className="flex-1 py-2 text-sm font-bold text-red-600 hover:bg-red-50 bg-transparent rounded-xl transition-colors disabled:opacity-50"
                   >
                     {cancelingId === item.id ? translations.canceling : translations.cancelRequest}
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
          {translations.activeClasses}
          <span className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
        </h2>
        
        {matchedActive.length === 0 ? (
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-12 rounded-3xl text-center border-2 border-dashed border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4 stroke-[1.5px]" />
            <h3 className="text-xl font-bold mb-2">{translations.noClasses}</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{translations.noClassesMessage}</p>
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
                <div 
                  key={item.id} 
                  onClick={() => {
                     window.dispatchEvent(new Event("show-global-loader"));
                     router.push(`/student/classes/${item.id}`);
                  }} 
                  className="group relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block cursor-pointer"
                >
                  {/* Decorative Banner */}
                  <div className={`h-24 w-full bg-gradient-to-r ${bgGradient} p-6 relative overflow-hidden`}>
                    <div className="absolute right-0 bottom-0 opacity-20 translate-x-1/4 translate-y-1/4">
                       <GraduationCap className="w-32 h-32 text-white stroke-[1.5px]" />
                    </div>
                  </div>
                  
                  {/* Class Info */}
                  <div className="p-6 relative -mt-10">
                    <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center border-2 border-slate-50 dark:border-slate-700 mb-4 text-xl font-black text-slate-800 dark:text-white">
                       {item.class.name.substring(0,2).toUpperCase()}
                    </div>
                    <div className="space-y-1 mb-6">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors line-clamp-1">{item.class.name}</h3>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{translations.teacher}: {item.class.teacherName}</p>
                    </div>
                    
                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-600/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{translations.newAssignments}</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-lg flex items-center gap-1.5">
                          {item.pendingCount > 0 ? (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          )}
                          {item.pendingCount}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-600/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{translations.totalAssignments}</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                          {item.class.totalAssignments}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
