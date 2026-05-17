import { MessageSquare, CheckCircle, Star } from "lucide-react";

interface StatsProps {
  totalReviews: number;
  approvedReviews: number;
  averageRating: number;
  translations: any;
}

export function MyReviewsStats({ totalReviews, approvedReviews, averageRating, translations }: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-4 bg-primary/10 rounded-2xl text-primary">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{translations.totalReviews}</p>
          <p className="text-2xl font-black text-slate-900">{totalReviews}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-4 bg-green-100 rounded-2xl text-green-600">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{translations.approved}</p>
          <p className="text-2xl font-black text-slate-900">{approvedReviews}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-4 bg-amber-100 rounded-2xl text-amber-600">
          <Star className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{translations.averageRating}</p>
          <p className="text-2xl font-black text-slate-900">
            {totalReviews > 0 ? averageRating.toFixed(1) : "0.0"}
          </p>
        </div>
      </div>
    </div>
  );
}
