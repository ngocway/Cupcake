
"use client";

import React, { useState } from "react";
import { Star, Send, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { submitLessonReview } from "@/actions/reviews";

interface Props {
  lessonId: string;
  isLoggedIn: boolean;
  isPublic: boolean;
  onSuccess?: () => void;
}

export default function ReviewForm({ lessonId, isLoggedIn, isPublic, onSuccess }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-center space-y-4">
        <p className="text-slate-500 font-bold">Vui lòng đăng nhập để đánh giá bài học này.</p>
      </div>
    );
  }

  if (!isPublic) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-8 text-center space-y-4 flex flex-col items-center">
        <AlertCircle className="w-8 h-8 text-amber-500" />
        <p className="text-amber-700 font-bold">Chỉ có thể đánh giá các bài học công khai (Public).</p>
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
      const result = await submitLessonReview(lessonId, rating, comment);
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
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex gap-4 md:gap-6">
        {/* User Avatar */}
        <div className="hidden sm:block shrink-0">
          <div className="w-14 h-14 rounded-full border-2 border-surface-container-lowest overflow-hidden shadow-sm">
             <img 
               src="https://lh3.googleusercontent.com/aida-public/AB6AXuDERD3CAOw3EdIBC_wduFwUqzJakBbvxkgAKsELngGm7IeR1beorLOaO6m3Q392re_z1fi8jyZNXUL66bT9gYxwOeLxPjIYNh679-2rLqMgB73m0wx4E3K3xhRt3wdIS9KwGAK-BrLnfj0p4DGn_s8FTg3MOaulDqkpTW9PDs695ntc5x5L_5ug80krUnIKKuOnTdZCXf32_i7fcwkxrtPA-pTlJa8JG8IDeevMiPtGfQmtJITynEJLkvmd4HnCL8LFBtMqkRkVaH8" 
               alt="User" 
               className="w-full h-full object-cover"
             />
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 space-y-6">
          <div className="relative group">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ suy nghĩ hoặc đặt câu hỏi của bạn về bài học này..."
              rows={4}
              className="w-full bg-surface-container-highest rounded-xl p-6 text-on-surface focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-surface-container-lowest transition-all border border-transparent focus:border-primary/20 resize-none placeholder-on-surface-variant/50 font-body text-lg shadow-inner"
            />
            
            {/* Bottom Bar inside Textarea container-like area */}
            <div className="absolute bottom-4 right-4 flex items-center gap-4">
              <div className="flex items-center gap-1.5 bg-surface-container-low/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                {[...Array(5)].map((_, i) => {
                  const starValue = i + 1;
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHover(starValue)}
                      onMouseLeave={() => setHover(0)}
                      className="transition-transform active:scale-90"
                    >
                      <Star 
                        className={`w-4 h-4 ${
                          starValue <= (hover || rating) 
                            ? 'text-amber-400 fill-amber-400' 
                            : 'text-on-surface-variant/20'
                        }`} 
                      />
                    </button>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-secondary text-on-secondary px-8 py-2.5 rounded-full font-label text-sm font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-secondary/20 disabled:opacity-50"
              >
                {isSubmitting ? "..." : "GỬI"}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest px-2">
             <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
             Đánh giá sẽ được kiểm duyệt để đảm bảo môi trường học tập tích cực
          </div>
        </div>
      </div>
    </form>
  );
}
