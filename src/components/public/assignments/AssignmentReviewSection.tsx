
import React from "react";
import { Star, User, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import AssignmentReviewForm from "./AssignmentReviewForm";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  student: {
    name: string | null;
    image: string | null;
  };
}

interface Props {
  reviews: Review[];
  assignmentId: string;
  isLoggedIn: boolean;
  isPublic: boolean;
}

export default function AssignmentReviewSection({ reviews, assignmentId, isLoggedIn, isPublic }: Props) {
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <section className="space-y-12 pb-20">
      <div className="space-y-10">
        <AssignmentReviewForm 
          assignmentId={assignmentId} 
          isLoggedIn={isLoggedIn} 
          isPublic={isPublic} 
        />
      </div>

      <div className="flex items-center justify-between border-b border-surface-container pb-6">
         <div className="space-y-1">
            <h2 className="text-2xl font-black text-on-surface">Đánh giá & Nhận xét</h2>
            <p className="text-on-surface-variant/40 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
               <MessageSquare className="w-4 h-4" />
               {reviews.length} Phản hồi từ cộng đồng
            </p>
         </div>
         {reviews.length > 0 && (
           <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                 <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                 <span className="text-3xl font-black text-on-surface">{averageRating}</span>
              </div>
              <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest mt-1">Điểm trung bình</p>
           </div>
         )}
      </div>

      {reviews.length === 0 ? (
        <div className="py-20 bg-surface-container-lowest rounded-[20px] border border-surface-container shadow-sm text-center space-y-4">
           <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mx-auto">
              <Star className="w-8 h-8 text-on-surface-variant/20" />
           </div>
           <p className="text-on-surface-variant/40 font-bold italic">Chưa có đánh giá nào cho bài tập này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-surface-container-lowest rounded-[20px] p-8 border border-surface-container shadow-sm hover:shadow-md transition-shadow space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-low overflow-hidden">
                       {review.student.image ? (
                         <img src={review.student.image} alt="" className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary"><User className="w-6 h-6" /></div>
                       )}
                    </div>
                    <div>
                       <h4 className="font-black text-on-surface">{review.student.name || "Học viên ẩn danh"}</h4>
                       <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">
                          {format(review.createdAt, "dd/MM/yyyy", { locale: vi })}
                       </p>
                    </div>
                 </div>
                 <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-on-surface-variant/20'}`} 
                      />
                    ))}
                 </div>
              </div>
              <p className="text-on-surface-variant leading-relaxed font-medium">
                 {review.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
