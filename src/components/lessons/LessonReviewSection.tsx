import React from "react";
import { Star, User, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import ReviewForm from "./ReviewForm";

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
  lessonId: string;
  isLoggedIn: boolean;
  isPublic: boolean;
}

export default function LessonReviewSection({ reviews, lessonId, isLoggedIn, isPublic }: Props) {
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <section className="space-y-12 pb-20">
      <div className="space-y-10">
        <ReviewForm 
          lessonId={lessonId} 
          isLoggedIn={isLoggedIn} 
          isPublic={isPublic} 
        />
      </div>

      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
         <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900">Đánh giá & Nhận xét</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
               <MessageSquare className="w-4 h-4" />
               {reviews.length} Phản hồi từ học viên
            </p>
         </div>
         {reviews.length > 0 && (
           <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                 <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                 <span className="text-3xl font-black text-slate-900">{averageRating}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Điểm trung bình</p>
           </div>
         )}
      </div>

      {reviews.length === 0 ? (
        <div className="py-20 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm text-center space-y-4">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Star className="w-8 h-8 text-slate-200" />
           </div>
           <p className="text-slate-400 font-bold italic">Chưa có đánh giá nào cho bài học này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden">
                       {review.student.image ? (
                         <img src={review.student.image} alt="" className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary"><User className="w-6 h-6" /></div>
                       )}
                    </div>
                    <div>
                       <h4 className="font-black text-slate-900">{review.student.name || "Học viên ẩn danh"}</h4>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {format(review.createdAt, "dd/MM/yyyy", { locale: vi })}
                       </p>
                    </div>
                 </div>
                 <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
                      />
                    ))}
                 </div>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                 {review.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
