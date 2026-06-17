"use client";

import { useTranslations } from "next-intl";
import { User, Play } from "lucide-react";
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
  slug?: string | null;
  title: string;
  thumbnail: string | null;
  assignment?: {
    tags: string | null;
  } | null;
}

export function LearningSidebar({ 
  teacher, 
  relatedItems,
  isGuest = false
}: { 
  teacher: TeacherInfo | null
  relatedItems: RelatedItem[]
  isGuest?: boolean
}) {
  const t = useTranslations("header");
  
  return (
    <aside className="w-full h-full flex flex-col bg-transparent overflow-y-auto no-scrollbar p-10 pt-7 space-y-10">
       {/* Teacher Profile Card */}
       {teacher?.isPortfolioPublished && (
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
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{teacher.professionalTitle || t("teacherTitle")}</p>
               </div>
            </div>

            <p className="text-lg font-medium text-slate-600 dark:text-slate-300 leading-loose max-w-[280px]">
               {teacher.bio || t("defaultBio")}
            </p>

            <Link 
               href={`/public/teachers/${teacher.id}`}
               className="w-full py-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-full font-black text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center"
            >
               {t("viewProfile")}
            </Link>
         </div>
       )}

       {/* Related Lessons Card */}
       <div className="glass rounded-3xl p-6 md:p-8 space-y-6 shadow-xl border border-white/10">
          <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t("relatedLessons")}</h4>
          
          <div className="space-y-3">
             {relatedItems.map((item) => {
                const tag = item.assignment?.tags
                  ? item.assignment.tags.split(',')[0]?.trim()
                  : null;

                return (
                   <Link 
                     key={item.id}
                     href={isGuest 
                       ? `/public/lessons/${item.slug || item.id}`
                       : `/student/lessons/${item.slug || item.id}`
                     }
                     className="flex items-center gap-4 p-2 -mx-2 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded-2xl transition-all duration-300 group"
                   >
                      <div className="w-28 aspect-video rounded-[3px] bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 shadow-sm relative border border-white/20">
                         {item.thumbnail ? (
                           <img src={item.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100 dark:from-slate-800 dark:to-slate-700">
                              <Play className="w-5 h-5 text-orange-500 fill-orange-500/20" />
                           </div>
                         )}
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                      </div>
                      <div className="flex-1 overflow-hidden flex flex-col gap-1.5">
                         <h5 className="text-[13px] font-black text-slate-800 dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                           {item.title}
                         </h5>
                         {tag ? (
                           <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 px-2 py-0.5 rounded-md w-fit">
                             #{tag}
                           </span>
                         ) : (
                           <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md w-fit">
                             Lesson
                           </span>
                         )}
                      </div>
                   </Link>
                );
             })}

             {relatedItems.length === 0 && (
                <p className="text-xs italic text-slate-400 text-center py-4">{t("noRelatedLessons")}</p>
             )}
          </div>
       </div>
    </aside>
  );
}
