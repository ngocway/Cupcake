import React from "react";
import prisma from "@/lib/prisma";
import { ReviewList } from "@/components/reviews/ReviewList";
import { BookmarkButton } from "@/components/common/BookmarkButton";
import { getAssignmentReviews, getAssignmentInstructions, getAssignmentTeacher } from "./data";
import { BookOpen, ChevronRight } from "lucide-react";

export async function SidebarReviewsWrapper({ assignmentId }: { assignmentId: string }) {
  const reviews = await getAssignmentReviews(assignmentId);
  
  if (reviews.length === 0) return null;

  return (
    <div className="border-t border-outline-variant/20 pt-10 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h3 className="text-xl font-black tracking-tight italic uppercase">Phản hồi học viên</h3>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cảm nhận từ những người đã hoàn thành</p>
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
  const data = await getAssignmentInstructions(id);
  
  if (!data?.instructions && !data?.readingText) return null;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {data.instructions && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">menu_book</span>
            Hướng dẫn làm bài
          </div>
          <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-loose prose-p:text-sm bg-primary/5 p-6 rounded-2xl border border-primary/10">
            <div dangerouslySetInnerHTML={{ __html: data.instructions }} />
          </div>
        </div>
      )}

      {data.readingText && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-secondary font-black text-xs uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">description</span>
            Tài liệu đi kèm
          </div>
          <div className="p-5 bg-secondary/5 rounded-2xl border border-secondary/10 flex items-center justify-between group cursor-pointer hover:bg-secondary/10 transition-all">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-secondary shadow-sm">
                   <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-sm font-black text-on-surface">Đọc tài liệu lý thuyết</span>
             </div>
             <ChevronRight className="w-5 h-5 text-secondary transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      )}
    </div>
  );
}

export async function TeacherInfoWrapper({ id }: { id: string }) {
  const teacher = await getAssignmentTeacher(id);
  if (!teacher) return null;

  return (
    <div className="flex items-center gap-3 py-2 animate-in fade-in duration-300">
       <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-black overflow-hidden">
          {teacher.image ? <img src={teacher.image} alt="" className="w-full h-full object-cover" /> : (teacher.name?.charAt(0) || "T")}
       </div>
       <div className="flex flex-col">
          <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Giảng viên</span>
          <span className="text-sm font-black text-on-surface">{teacher.name || "Cố định"}</span>
       </div>
    </div>
  );
}
