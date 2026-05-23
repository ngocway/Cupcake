import React from "react";
import prisma from "@/lib/prisma";
import { ReviewList } from "@/components/reviews/ReviewList";
import { BookmarkButton } from "@/components/common/BookmarkButton";
import { getAssignmentReviews, getAssignmentInstructions, getAssignmentTeacher } from "./data";
import { BookOpen, ChevronRight, FileText, FileImage } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function SidebarReviewsWrapper({ assignmentId }: { assignmentId: string }) {
  const [reviews, t] = await Promise.all([
    getAssignmentReviews(assignmentId),
    getTranslations("student.quiz")
  ]);
  
  if (reviews.length === 0) return null;

  return (
    <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-10 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h3 className="text-xl font-black tracking-tight italic uppercase text-slate-900 dark:text-white">{t("studentFeedback")}</h3>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t("feedbackSubtitle")}</p>
      </div>
      <ReviewList reviews={reviews as any} />
    </div>
  );
}

export async function BookmarkWrapper({ 
  assignmentId, 
  studentId 
}: { 
  assignmentId: string; 
  studentId: string;
}) {
  const favorite = await prisma.favoriteAssignment.findFirst({
    where: { assignmentId, studentId },
    select: { studentId: true }
  });

  return (
    <BookmarkButton 
      type="assignment" 
      id={assignmentId} 
      initialIsBookmarked={!!favorite} 
      className="scale-90"
    />
  );
}

export async function InstructionsWrapper({ id }: { id: string }) {
  const [data, t] = await Promise.all([
    getAssignmentInstructions(id),
    getTranslations("student.quiz")
  ]);
  
  if (!data?.instructions && !data?.readingText) return null;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {data.instructions && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-500 font-black text-xs uppercase tracking-widest">
            <FileText className="w-4 h-4 stroke-[2px]" />
            {t("instructions")}
          </div>
          <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-loose prose-p:text-sm bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-500/10">
            <div dangerouslySetInnerHTML={{ __html: data.instructions }} />
          </div>
        </div>
      )}

      {data.readingText && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-widest">
            <FileImage className="w-4 h-4 stroke-[2px]" />
            {t("studyMaterial")}
          </div>
          <div className="p-5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-500/10 flex items-center justify-between group cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-500 shadow-sm">
                   <BookOpen className="w-5 h-5 stroke-[2px]" />
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">{t("studyMaterial")}</span>
             </div>
             <ChevronRight className="w-5 h-5 text-emerald-500 transform group-hover:translate-x-1 transition-transform stroke-[2px]" />
          </div>
        </div>
      )}
    </div>
  );
}

export async function TeacherInfoWrapper({ id }: { id: string }) {
  const [teacher, t] = await Promise.all([
    getAssignmentTeacher(id),
    getTranslations("student.assignmentRun")
  ]);
  if (!teacher) return null;

  return (
    <div className="flex items-center gap-3 py-2 animate-in fade-in duration-300">
       <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-black overflow-hidden">
          {teacher.image ? <img src={teacher.image} alt="" className="w-full h-full object-cover" /> : (teacher.name?.charAt(0) || "T")}
       </div>
       <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("instructor")}</span>
          <span className="text-sm font-black text-slate-900 dark:text-white">{teacher.name || "Cố định"}</span>
       </div>
    </div>
  );
}
