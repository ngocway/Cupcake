"use client";

import React from "react";
import { User, ChevronRight, Play } from "lucide-react";
import Link from "next/link";

interface TeacherInfo {
  id: string;
  name: string | null;
  image: string | null;
  professionalTitle: string | null;
  bio: string | null;
  isPortfolioPublished: boolean;
  _count: {
    lessons: number;
    assignments: number;
  };
}

interface RelatedItem {
  id: string;
  title: string;
  thumbnail: string | null;
}

export function LearningSidebar({ 
  teacher, 
  relatedItems,
  isGuest = false
}: { 
  teacher: TeacherInfo
  relatedItems: RelatedItem[]
  isGuest?: boolean
}) {
  return (
    <aside className="w-full h-full flex flex-col bg-transparent overflow-y-auto no-scrollbar p-10 pt-7 space-y-10">
       {/* Teacher Profile Card */}
       <div className="glass rounded-3xl p-8 space-y-8 flex flex-col items-center text-center shadow-xl">
          <div className="space-y-4 flex flex-col items-center w-full">
             <div className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-white">
                {teacher.image ? (
                  <img src={teacher.image} alt={teacher.name || ""} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                     <User className="w-12 h-12" />
                  </div>
                )}
             </div>
             
             <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{teacher.name}</h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{teacher.professionalTitle || "Giảng viên tại Học viện"}</p>
             </div>
          </div>

          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed max-w-[280px]">
             {teacher.bio || "Giảng viên tâm huyết với nhiều năm kinh nghiệm trong lĩnh vực giáo dục và đào tạo."}
          </p>

          <Link 
             href={`/public/teachers/${teacher.id}`}
             className="w-full py-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-full font-black text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center"
          >
             Xem Hồ Sơ
          </Link>
       </div>

       {/* Related Lessons Card */}
       <div className="glass rounded-3xl p-8 space-y-6 shadow-xl">
          <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Bài học liên quan</h4>
          
          <div className="space-y-4">
             {relatedItems.map((item) => (
                <Link 
                  key={item.id}
                  href={`/public/lessons/${item.id}`}
                  className="flex items-center gap-4 group"
                >
                   <div className="w-20 h-14 rounded-[4px] bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 shadow-sm relative border border-white/20">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                           <Play className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <h5 className="text-xs font-black text-slate-800 dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {item.title}
                      </h5>
                   </div>
                </Link>
             ))}

             {relatedItems.length === 0 && (
                <p className="text-xs italic text-slate-400 text-center py-4">Chưa có bài học liên quan nào.</p>
             )}
          </div>
       </div>
    </aside>
  );
}
