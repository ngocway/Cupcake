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
    <section className="space-y-16 animate-in fade-in duration-1000">
      {/* Review Form Area */}
      <div className="relative">
        <ReviewForm 
          lessonId={lessonId} 
          isLoggedIn={isLoggedIn} 
          isPublic={isPublic} 
        />
      </div>

      {/* Reviews List */}
      <div className="space-y-10">
        <div className="flex items-center justify-between border-b border-surface-container pb-6 px-2">
           <div className="space-y-1">
              <h3 className="text-xl font-headline font-black text-on-background uppercase tracking-tighter italic">
                 Cộng đồng học tập
              </h3>
              <p className="text-on-surface-variant/50 text-[10px] font-black uppercase tracking-[0.2em]">
                 {reviews.length} Ý kiến & Thảo luận
              </p>
           </div>
           
           {reviews.length > 0 && (
             <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-xl border border-white/40 shadow-sm">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-lg font-black text-on-background tracking-tighter">{averageRating}</span>
             </div>
           )}
        </div>

        {reviews.length === 0 ? (
          <div className="py-20 bg-surface-container-low/20 rounded-[2.5rem] border border-dashed border-primary/20 text-center space-y-4">
             <div className="w-16 h-16 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto border border-white/40 shadow-inner">
                <Star className="w-8 h-8 text-primary/10" />
             </div>
             <p className="text-on-surface-variant/40 font-bold italic text-sm">Chưa có thảo luận nào. Hãy là người đầu tiên chia sẻ!</p>
          </div>
        ) : (
          <div className="space-y-12">
            {reviews.map((review) => (
              <div key={review.id} className="flex gap-4 md:gap-6 group">
                {/* Avatar */}
                <div className="shrink-0">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-md group-hover:scale-110 transition-transform duration-500">
                    {review.student.image ? (
                      <img src={review.student.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary-container text-on-primary-container font-black text-lg">
                        {review.student.name?.charAt(0) || "U"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-baseline gap-3">
                      <h4 className="font-headline font-extrabold text-on-background tracking-tight">
                        {review.student.name || "Học viên ẩn danh"}
                      </h4>
                      <span className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">
                        {format(review.createdAt, "dd MMM, yyyy", { locale: vi })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-on-surface-variant/10'}`} 
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-on-surface-variant font-body text-lg leading-relaxed max-w-3xl">
                    {review.comment}
                  </p>

                  <div className="flex items-center gap-6 pt-2">
                    <button className="flex items-center gap-2 text-[10px] font-black text-on-surface-variant/40 hover:text-primary uppercase tracking-widest transition-colors">
                      <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                      Hữu ích
                    </button>
                    <button className="flex items-center gap-2 text-[10px] font-black text-on-surface-variant/40 hover:text-primary uppercase tracking-widest transition-colors">
                      <span className="material-symbols-outlined text-[18px]">reply</span>
                      Phản hồi
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
