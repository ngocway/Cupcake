
"use client";

import React, { useState } from "react";
import { CheckCircle, Trash2, Star, User as UserIcon, BookOpen, Clock } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { approveReview, deleteReview } from "@/actions/admin-reviews";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: Date;
  student: {
    name: string | null;
    image: string | null;
    email: string | null;
  };
  lesson: {
    title: string;
    id: string;
  };
}

interface Props {
  reviews: Review[];
}

export default function ReviewManagementClient({ reviews: initialReviews }: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoading(id);
    try {
      const result = await approveReview(id);
      if (result.success) {
        toast.success(result.message);
        setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: true } : r));
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error("Lỗi khi duyệt đánh giá");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.")) return;
    
    setLoading(id);
    try {
      const result = await deleteReview(id);
      if (result.success) {
        toast.success(result.message);
        setReviews(prev => prev.filter(r => r.id !== id));
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error("Lỗi khi xóa đánh giá");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      {reviews.map((review) => (
        <tr key={review.id} className="group hover:bg-slate-50/50 transition-colors">
          <td className="px-8 py-6">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                   {review.student.image ? (
                     <img src={review.student.image} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                        <UserIcon className="w-5 h-5" />
                     </div>
                   )}
                </div>
                <div className="min-w-0">
                   <p className="font-black text-slate-900 truncate max-w-[200px]">{review.student.name || "N/A"}</p>
                   <div className="flex items-center gap-1.5 text-slate-400">
                      <BookOpen className="w-3 h-3 text-primary" />
                      <p className="text-[10px] font-bold truncate max-w-[150px] uppercase tracking-wider">{review.lesson.title}</p>
                   </div>
                </div>
             </div>
          </td>
          <td className="px-8 py-6">
             <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-3 h-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
                  />
                ))}
             </div>
          </td>
          <td className="px-8 py-6">
             <p className="text-sm text-slate-600 font-medium line-clamp-2 max-w-[300px]">
                {review.comment || <span className="text-slate-300 italic">Không có nhận xét</span>}
             </p>
          </td>
          <td className="px-8 py-6">
             <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-3 h-3" />
                <span className="text-[10px] font-bold">{format(new Date(review.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}</span>
             </div>
          </td>
          <td className="px-8 py-6">
             {review.isApproved ? (
               <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100 text-[10px] font-black uppercase tracking-widest">
                  <CheckCircle className="w-3 h-3" />
                  HIỂN THỊ
               </span>
             ) : (
               <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 text-[10px] font-black uppercase tracking-widest">
                  <Clock className="w-3 h-3" />
                  CHỜ DUYỆT
               </span>
             )}
          </td>
          <td className="px-8 py-6 text-right">
             <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!review.isApproved && (
                  <button
                    onClick={() => handleApprove(review.id)}
                    disabled={loading === review.id}
                    className="p-2.5 bg-green-500 text-white rounded-xl hover:scale-110 active:scale-90 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
                    title="Duyệt đánh giá"
                  >
                     {loading === review.id ? (
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                       <CheckCircle className="w-4 h-4" />
                     )}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={loading === review.id}
                  className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white hover:scale-110 active:scale-90 transition-all shadow-lg shadow-red-500/5 disabled:opacity-50"
                  title="Xóa đánh giá"
                >
                   {loading === review.id ? (
                       <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                     ) : (
                       <Trash2 className="w-4 h-4" />
                     )}
                </button>
             </div>
          </td>
        </tr>
      ))}
    </>
  );
}
