import { Star, MessageCircle, Clock } from "lucide-react"

interface Review {
    id: string
    rating: number
    comment: string | null
    createdAt: Date
    student: {
        name: string | null
        image: string | null
    }
}

interface ReviewListProps {
    reviews: Review[]
}

export function ReviewList({ reviews }: ReviewListProps) {
    if (reviews.length === 0) return (
        <div className="py-20 text-center space-y-4 opacity-50">
            <MessageCircle className="w-16 h-16 mx-auto text-slate-200" />
            <p className="font-bold text-slate-400 uppercase tracking-widest">Chưa có đánh giá nào cho nội dung này.</p>
        </div>
    );

    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

    return (
        <div className="space-y-12">
            {/* Header Summary */}
            <div className="flex flex-col md:flex-row items-center gap-10 bg-slate-50 p-10 rounded-[40px]">
                <div className="text-center md:text-left">
                    <div className="text-6xl font-black font-headline italic text-slate-950">{avgRating.toFixed(1)}</div>
                    <div className="flex gap-1 mt-2 justify-center md:justify-start">
                        {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-5 h-5 ${avgRating >= s ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                        ))}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4">Dựa trên {reviews.length} đánh giá</p>
                </div>

                <div className="flex-1 space-y-3 w-full max-w-xs">
                    {[5, 4, 3, 2, 1].map(stars => {
                        const count = reviews.filter(r => r.rating === stars).length;
                        const pct = (count / reviews.length) * 100;
                        return (
                            <div key={stars} className="flex items-center gap-4">
                                <span className="text-[10px] font-black w-10">{stars} Sao</span>
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 w-8">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Individual Reviews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {reviews.map((review) => (
                    <div key={review.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-50">
                                    <img src={review.student.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.student.name}`} alt="S" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900">{review.student.name || "Học sinh"}</p>
                                    <div className="flex gap-0.5 mt-0.5">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} className={`w-3 h-3 ${review.rating >= s ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                <Clock className="w-3 h-3" /> {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        
                        {review.comment && (
                            <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                "{review.comment}"
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
