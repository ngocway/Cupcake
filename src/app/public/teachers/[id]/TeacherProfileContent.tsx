"use client";

import React, { useState } from "react";
import Image from "next/image";
import { User, MapPin, Briefcase, GraduationCap, LayoutGrid, BookOpen, FileEdit } from "lucide-react";
import { LessonCard, ExerciseCard } from "@/components/public/ContentCards";

export function TeacherProfileContent({ 
  teacher, 
  allContent, 
  isLoggedIn 
}: { 
  teacher: any; 
  allContent: any[]; 
  isLoggedIn: boolean; 
}) {
  const [filter, setFilter] = useState<'all' | 'lessons' | 'assignments'>('all');

  const filteredContent = allContent.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'lessons') return item.itemType === 'lesson';
    if (filter === 'assignments') return item.itemType === 'assignment';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
      {/* Profile Card */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-800/40 shadow-2xl rounded-[3rem] p-8 md:p-12 mb-16 relative overflow-hidden">
         {/* decorative blob */}
         <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-secondary/10 to-transparent rounded-full pointer-events-none"></div>

         <div className="flex flex-col md:flex-row gap-8 items-start">
           {/* Avatar */}
           <div className="w-40 h-40 shrink-0 rounded-[2rem] border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-white relative">
             {teacher.image ? (
               <Image src={teacher.image} alt={teacher.name || "Teacher"} fill className="object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                 <User className="w-16 h-16" />
               </div>
             )}
           </div>

           {/* Info */}
           <div className="flex-1 space-y-4 pt-2 z-10 relative">
             <div>
               <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{teacher.name}</h1>
               <p className="text-sm font-black text-primary uppercase tracking-widest mt-1">
                 {teacher.professionalTitle || "Teacher"}
               </p>
             </div>

             <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
               {teacher.bio || "Passionate educator with years of experience in teaching and training. Always striving to deliver inspiring and engaging lessons."}
             </p>

             <div className="flex flex-wrap gap-4 pt-2">
               {teacher.location && (
                 <div className="flex items-center gap-2 text-sm text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                   <MapPin className="w-4 h-4 text-rose-500" />
                   {teacher.location}
                 </div>
               )}
               {teacher.teachingExperience && (
                 <div className="flex items-center gap-2 text-sm text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                   <Briefcase className="w-4 h-4 text-amber-500" />
                   {teacher.teachingExperience}
                 </div>
               )}
               {teacher.education && (
                 <div className="flex items-center gap-2 text-sm text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                   <GraduationCap className="w-4 h-4 text-emerald-500" />
                   {teacher.education}
                 </div>
               )}
             </div>
             
             {/* Expertise Tags */}
             {teacher.expertiseTags && (
                <div className="flex flex-wrap gap-2 pt-4">
                  {teacher.expertiseTags.split(',').filter(Boolean).map((tag: string) => (
                     <span key={tag} className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                       {tag.trim()}
                     </span>
                  ))}
                </div>
             )}
           </div>

           {/* Stats / Interactive Filters */}
           <div className="shrink-0 flex flex-row md:flex-col gap-4 md:gap-5 z-10 relative">
             <div 
               className={`relative group flex flex-col items-center justify-center w-28 h-28 md:w-32 md:h-32 rounded-[2rem] cursor-pointer transition-all duration-500 border-2 select-none overflow-hidden
                 ${filter === 'lessons' 
                   ? 'bg-primary border-primary shadow-xl shadow-primary/30 scale-105' 
                   : 'bg-slate-50/80 dark:bg-slate-800/80 border-white dark:border-slate-700 shadow-lg backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl'}`}
               onClick={() => setFilter(filter === 'lessons' ? 'all' : 'lessons')}
             >
               {filter === 'lessons' && <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>}
               <div className={`text-3xl md:text-4xl font-black z-10 transition-colors duration-300 ${filter === 'lessons' ? 'text-white' : 'text-slate-800 dark:text-white group-hover:text-primary'}`}>
                 {teacher.lessons.length}
               </div>
               <div className={`text-[10px] md:text-xs font-black uppercase tracking-widest mt-2 z-10 flex items-center gap-1.5 transition-colors duration-300 ${filter === 'lessons' ? 'text-white/90' : 'text-slate-500 group-hover:text-primary/70'}`}>
                 <BookOpen className="w-3.5 h-3.5" />
                 Lessons
               </div>
             </div>

             <div 
               className={`relative group flex flex-col items-center justify-center w-28 h-28 md:w-32 md:h-32 rounded-[2rem] cursor-pointer transition-all duration-500 border-2 select-none overflow-hidden
                 ${filter === 'assignments' 
                   ? 'bg-secondary border-secondary shadow-xl shadow-secondary/30 scale-105' 
                   : 'bg-slate-50/80 dark:bg-slate-800/80 border-white dark:border-slate-700 shadow-lg backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 hover:border-secondary/30 hover:-translate-y-1 hover:shadow-xl'}`}
               onClick={() => setFilter(filter === 'assignments' ? 'all' : 'assignments')}
             >
               {filter === 'assignments' && <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>}
               <div className={`text-3xl md:text-4xl font-black z-10 transition-colors duration-300 ${filter === 'assignments' ? 'text-white' : 'text-slate-800 dark:text-white group-hover:text-secondary'}`}>
                 {teacher.assignments.length}
               </div>
               <div className={`text-[10px] md:text-xs font-black uppercase tracking-widest mt-2 z-10 flex items-center gap-1.5 transition-colors duration-300 ${filter === 'assignments' ? 'text-white/90' : 'text-slate-500 group-hover:text-secondary/70'}`}>
                 <FileEdit className="w-3.5 h-3.5" />
                 Assignments
               </div>
             </div>
           </div>
         </div>
      </div>

      {/* Content Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-secondary" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            {filter === 'lessons' ? "Teacher's Lessons" : filter === 'assignments' ? "Teacher's Assignments" : "Teacher's Library"}
          </h2>
        </div>

        {filteredContent.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredContent.map((item: any) => (
              item.itemType === 'lesson' 
                ? <LessonCard key={`l-${item.id}`} item={item} isLoggedIn={isLoggedIn} />
                : <ExerciseCard key={`a-${item.id}`} item={item} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
               <BookOpen className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No content available</h3>
            <p className="text-slate-500 mt-2">This teacher has not published any {filter === 'lessons' ? 'lessons' : filter === 'assignments' ? 'assignments' : 'content'} yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
