'use client'

import { User, Star, BookOpen, BookOpenCheck as AssignmentIcon, Palette, ChevronRight } from "lucide-react"
import Link from "next/link"

interface TeacherInfo {
  id: string
  name: string | null
  image: string | null
  professionalTitle: string | null
  bio: string | null
  isPortfolioPublished: boolean
  _count: {
    lessons: number
    assignments: number
  }
}

interface RelatedItem {
  id: string
  title: string
  thumbnail: string | null
  teacher: {
    name: string | null
  }
  type?: "LESSON" | "ASSIGNMENT"
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
    <aside className="w-80 border-r border-outline-variant/30 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 shrink-0 overflow-y-auto custom-scrollbar">
       <div className="p-8 space-y-10">
          {/* Teacher Profile */}
          <div className="space-y-6">
             <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 rounded-[2rem] bg-white dark:bg-slate-800 p-1 shadow-magazine-shadow border border-outline-variant/20 overflow-hidden">
                   {teacher.image ? (
                     <img src={teacher.image} alt={teacher.name || ""} className="w-full h-full object-cover rounded-[1.8rem]" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                        <User className="w-10 h-10" />
                     </div>
                   )}
                </div>
                <div>
                   <h3 className="font-black text-xl tracking-tight text-slate-900 dark:text-white">{teacher.name}</h3>
                   <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mt-1">{teacher.professionalTitle || "Giáo viên"}</p>
                </div>
             </div>

             <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic text-center px-4">
                   "{teacher.bio || "Giáo viên tâm huyết với nghề."}"
                </p>
                
                <div className="flex flex-col gap-3">
                   {teacher.isPortfolioPublished && (
                      <Link 
                        href={`/profile/${teacher.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-5 py-3 bg-slate-900 dark:bg-primary text-white rounded-2xl font-black text-[10px] tracking-widest uppercase hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                      >
                         <span className="flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            Xem Portfolio
                         </span>
                         <ChevronRight className="w-4 h-4" />
                      </Link>
                   )}
                   <div className="grid grid-cols-2 gap-3">
                      <Link 
                        href={isGuest ? `/public/teachers/${teacher.id}/lessons` : `/student/lessons?teacherId=${teacher.id}`}
                        className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-outline-variant/20 text-center hover:border-primary/50 transition-colors group"
                      >
                         <p className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{teacher._count?.lessons || 0}</p>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Bài học</p>
                      </Link>
                      <Link 
                        href={isGuest ? `/public/teachers/${teacher.id}/assignments` : `/student/assignments?teacherId=${teacher.id}`}
                        className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-outline-variant/20 text-center hover:border-primary/50 transition-colors group"
                      >
                         <p className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{teacher._count?.assignments || 0}</p>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Bài tập</p>
                      </Link>
                   </div>
                </div>
             </div>
          </div>

          {/* Related Content */}
          <div className="space-y-6">
             <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <h4 className="font-black text-sm uppercase tracking-[0.2em] text-slate-900 dark:text-white">Gợi ý cho bạn</h4>
             </div>
             
             <div className="space-y-4">
                {relatedItems.map((item) => {
                   const isLesson = item.type === "LESSON" || !item.type && !item.id.startsWith("assignment");
                   const href = isLesson 
                    ? (isGuest ? `/public/lessons/${item.id}` : `/student/lessons/${item.id}`)
                    : (isGuest ? `/public/assignments/${item.id}?direct=true` : `/student/assignments/${item.id}/run?direct=true`);
                   
                   return (
                    <Link 
                      key={item.id} 
                      href={href}
                      className="flex gap-4 group hover:bg-white dark:hover:bg-slate-800 p-3 rounded-2xl transition-all border border-transparent hover:border-outline-variant/20"
                    >
                       <div className="w-16 h-16 rounded-xl bg-slate-200 shrink-0 overflow-hidden">
                          {item.thumbnail ? (
                             <img src={item.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-400">
                                {isLesson ? <BookOpen className="w-6 h-6" /> : <AssignmentIcon className="w-6 h-6" />}
                             </div>
                          )}
                       </div>
                       <div className="flex flex-col justify-center gap-1 overflow-hidden">
                          <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.title}</h5>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{item.teacher.name}</p>
                       </div>
                    </Link>
                   );
                })}
             </div>
          </div>
       </div>
    </aside>
  )
}
