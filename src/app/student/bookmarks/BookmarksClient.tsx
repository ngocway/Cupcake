'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  FileText as AssignmentIcon, 
  Clock, 
  User, 
  ChevronRight,
  Bookmark
} from 'lucide-react';

interface BookmarksClientProps {
  initialLessons: any[];
  initialAssignments: any[];
  translations: {
    savedLessons: string;
    savedAssignments: string;
    minutes: string;
    unlimited: string;
    assignmentLabel: string;
  };
}

export default function BookmarksClient({ 
  initialLessons, 
  initialAssignments, 
  translations 
}: BookmarksClientProps) {
  const [activeTab, setActiveTab] = useState<'lessons' | 'assignments'>('lessons');

  return (
    <div className="space-y-8">
      {/* Tabs — full width on mobile with proper tap targets */}
      <div className="flex gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl w-full">
        <button
          onClick={() => setActiveTab('lessons')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 min-h-[44px] ${
            activeTab === 'lessons'
              ? 'bg-white/80 dark:bg-slate-700/80 shadow-md text-primary dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          {translations.savedLessons}
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 min-h-[44px] ${
            activeTab === 'assignments'
              ? 'bg-white/80 dark:bg-slate-700/80 shadow-md text-primary dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <AssignmentIcon className="w-4 h-4" />
          {translations.savedAssignments}
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'lessons' ? (
          initialLessons.map((lesson) => (
            <Link 
              key={lesson.id} 
              href={`/student/lessons/${lesson.id}`}
              className="group bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Limit thumbnail height to max 200px on mobile */}
              <div className="max-h-48 md:aspect-video relative overflow-hidden">
                <img 
                  src={lesson.thumbnail || "/images/p1_thumb.png"} 
                  alt={lesson.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  style={{ minHeight: '160px' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-black text-slate-900 line-clamp-2 group-hover:text-primary transition-colors">
                  {lesson.title}
                </h3>
                <div className="flex items-center gap-4 pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <User className="w-3.5 h-3.5" />
                    {lesson.teacher?.name}
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          initialAssignments.map((assignment) => (
            <Link 
              key={assignment.id} 
              href={`/student/assignments/${assignment.id}/run`}
              className="group bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="p-4 bg-secondary/10 rounded-2xl text-secondary">
                  <AssignmentIcon className="w-6 h-6" />
                </div>
                <div className="px-4 py-1.5 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
                  {translations.assignmentLabel}
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-6 line-clamp-2 group-hover:text-secondary transition-colors">
                {assignment.title}
              </h3>
              <div className="flex items-center gap-6 pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5" />
                  {assignment.timeLimit ? `${assignment.timeLimit} ${translations.minutes}` : translations.unlimited}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
