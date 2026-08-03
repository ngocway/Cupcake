"use client";

import { useTranslations } from "next-intl";
import { User, Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LoginPromptModal } from "./LoginPromptModal";

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
    tags?: string | null;
    readingText?: string | null;
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
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  return (
    <aside className="w-full flex flex-col bg-transparent space-y-6">
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
       <div className="bg-white/70 backdrop-blur-xl border-2 border-emerald-100 rounded-[28px] p-5 sm:p-6 space-y-5 shadow-xl shadow-primary/5">
          <h4 className="font-headline text-xs font-black text-[#8C826D] uppercase tracking-widest mb-4 px-1">{t("relatedLessons")}</h4>
          
          <div className="space-y-3">
             {relatedItems.map((item) => {
                const getWordCount = (html?: string | null) => {
                  if (html) {
                    const clean = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
                    if (clean) {
                      const words = clean.split(" ").filter(Boolean).length;
                      if (words > 0) return `${words} words`;
                    }
                  }
                  return "60+ words";
                };

                const wordCountText = getWordCount(item.assignment?.readingText);

                const itemContent = (
                  <>
                    <div className="w-24 aspect-video rounded-[10px] overflow-hidden shrink-0 shadow-sm relative border-2 border-white bg-emerald-100">
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
                       <h5 className="text-[13px] font-black text-[#3E3524] line-clamp-2 leading-snug group-hover:text-[#12A375] transition-colors">
                         {item.title}
                       </h5>
                       <span className="text-xs font-normal text-slate-400">
                         {wordCountText}
                       </span>
                     </div>
                  </>
                );

                // Guest: use plain div (no Link) to avoid triggering Next.js router/loading spinner
                if (isGuest) {
                  return (
                    <div
                      key={item.id}
                      onClick={() => setShowLoginModal(true)}
                      className="flex items-center gap-3 p-2 -mx-2 hover:bg-emerald-50 rounded-2xl transition-all duration-300 group cursor-pointer"
                    >
                      {itemContent}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={`/student/lessons/${item.slug || item.id}`}
                    className="flex items-center gap-3 p-2 -mx-2 hover:bg-emerald-50 rounded-2xl transition-all duration-300 group"
                  >
                    {itemContent}
                  </Link>
                );
             })}

             {relatedItems.length === 0 && (
                <p className="text-xs italic text-slate-400 text-center py-4">{t("noRelatedLessons")}</p>
             )}
          </div>
       </div>

       {/* Login Prompt Modal */}
       <LoginPromptModal
         isOpen={showLoginModal}
         onClose={() => setShowLoginModal(false)}
       />
    </aside>
  );
}
