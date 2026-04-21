
"use client";

import React, { useState } from "react";
import { Star, Send, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { submitAssignmentReview } from "@/actions/reviews";

interface Props {
  assignmentId: string;
  isLoggedIn: boolean;
  isPublic: boolean;
  onSuccess?: () => void;
}

export default function AssignmentReviewForm({ assignmentId, isLoggedIn, isPublic, onSuccess }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-[20px] p-8 text-center space-y-4">
        <p className="text-on-surface-variant font-bold">Vui lòng đăng nhập để đánh giá bài tập này.</p>
      </div>
    );
  }

  if (!isPublic) {
    return (
      <div className="bg-secondary/5 border border-secondary/20 rounded-[20px] p-8 text-center space-y-4 flex flex-col items-center">
        <AlertCircle className="w-8 h-8 text-secondary" />
        <p className="text-on-surface font-bold">Chỉ có thể đánh giá các bài tập công khai (Public).</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá!");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitAssignmentReview(assignmentId, rating, comment);
      if (result.success) {
        toast.success(result.message);
        setRating(0);
        setComment("");
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-primary/20 rounded-[20px] p-8 lg:p-10 shadow-xl shadow-primary/5 space-y-8">
      <div className="space-y-4">
        <h3 className="text-xl font-black text-on-surface flex items-center gap-2">
           Viết đánh giá của bạn
           <div className="h-1 flex-1 bg-surface-container rounded-full" />
        </h3>
        <p className="text-sm text-on-surface-variant/60 font-medium">
           Chia sẻ trải nghiệm của bạn về bài tập này để giúp các học viên khác nhé!
        </p>
      </div>

      <div className="space-y-6">
        {/* Star Rating */}
        <div className="flex flex-col items-center gap-3 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
           <p className="text-xs font-black text-on-surface-variant/40 uppercase tracking-widest">Mức độ hài lòng</p>
           <div className="flex items-center gap-2">
             {[...Array(5)].map((_, i) => {
               const starValue = i + 1;
               return (
                 <button
                   type="button"
                   key={i}
                   className="transition-transform active:scale-90"
                   onClick={() => setRating(starValue)}
                   onMouseEnter={() => setHover(starValue)}
                   onMouseLeave={() => setHover(0)}
                 >
                   <Star 
                     className={`w-10 h-10 transition-colors ${
                       starValue <= (hover || rating) 
                         ? 'text-amber-400 fill-amber-400' 
                         : 'text-on-surface-variant/20'
                     }`} 
                   />
                 </button>
               );
             })}
           </div>
           {rating > 0 && (
              <p className="text-sm font-black text-primary animate-in fade-in zoom-in duration-300">
                 {rating === 5 ? 'Tuyệt vời!' : rating === 4 ? 'Rất tốt' : rating === 3 ? 'Bình thường' : rating === 2 ? 'Kém' : 'Rất kém'}
              </p>
           )}
        </div>

        {/* Comment Textarea */}
        <div className="space-y-2">
           <textarea
             value={comment}
             onChange={(e) => setComment(e.target.value)}
             placeholder="Nhập nhận xét của bạn tại đây..."
             className="w-full min-h-[120px] p-6 bg-surface-container-low border border-outline-variant/10 rounded-xl text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all font-medium"
           />
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-surface-container">
         <div className="flex items-center gap-2 text-on-surface-variant/40 bg-surface-container-low px-4 py-2 rounded-full">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Đánh giá của bạn giúp cộng đồng phát triển hơn</span>
         </div>
         <button
           type="submit"
           disabled={isSubmitting}
           className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-primary text-on-primary rounded-lg font-black text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
         >
           {isSubmitting ? (
             <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
           ) : (
             <>
               GỬI ĐÁNH GIÁ
               <Send className="w-4 h-4" />
             </>
           )}
         </button>
      </div>
    </form>
  );
}
