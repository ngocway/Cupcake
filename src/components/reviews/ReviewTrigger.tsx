"use client"

import { useState } from "react"
import { Star, MessageSquare, Send, X, CheckCircle2, Loader2 } from "lucide-react"
import { submitAssignmentReview, submitLessonReview } from "@/actions/reviews"

interface ReviewTriggerProps {
    type: 'assignment' | 'lesson'
    id: string
    isLoggedIn: boolean
    inline?: boolean
}

export function ReviewTrigger({ type, id, isLoggedIn, inline }: ReviewTriggerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) return;
        setLoading(true);
        try {
            const res = type === 'assignment' 
                ? await submitAssignmentReview(id, rating, comment)
                : await submitLessonReview(id, rating, comment);

            if (res.success) {
                setSubmitted(true);
                setTimeout(() => setIsOpen(false), 2000);
            } else {
                alert(res.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isLoggedIn) return null;

    if (inline) {
        return (
            <>
                <button 
                    onClick={() => setIsOpen(true)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-yellow-500 transition-all active:scale-95"
                    title="Đánh giá"
                >
                    <Star className={`w-5 h-5 ${rating > 0 ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                </button>

                {isOpen && (
                    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 w-[380px] animate-in zoom-in-95 duration-300 relative">
                            <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                <X className="w-5 h-5" />
                            </button>

                            {submitted ? (
                                <div className="py-10 text-center space-y-4">
                                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h4 className="text-xl font-black italic">Cảm ơn bạn!</h4>
                                    <p className="text-sm text-slate-500 font-medium">Đánh giá của bạn đã giúp cộng đồng học tập tốt hơn.</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div>
                                        <h4 className="text-2xl font-black font-headline italic">Đánh giá {type === 'assignment' ? 'bài tập' : 'bài học'}?</h4>
                                        <p className="text-sm text-slate-500 font-medium mt-1">Phản hồi của bạn thực sự quý giá với giáo viên.</p>
                                    </div>

                                    <div className="flex justify-center gap-3">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button 
                                                key={star} 
                                                onClick={() => setRating(star)}
                                                className="transition-transform active:scale-90"
                                            >
                                                <Star className={`w-10 h-10 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'} transition-colors`} />
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <MessageSquare className="w-3 h-3" /> Bình luận (Tùy chọn)
                                        </div>
                                        <textarea 
                                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                                            value={comment}
                                            onChange={e => setComment(e.target.value)}
                                            placeholder="Viết cảm nhận của bạn..."
                                        />
                                    </div>

                                    <button 
                                        onClick={handleSubmit}
                                        disabled={rating === 0 || loading}
                                        className="w-full h-14 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-primary transition-all disabled:opacity-30 disabled:hover:bg-slate-950"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Gửi đánh giá"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </>
        )
    }

    return (
        <>
            {!isOpen && (
                <div className="fixed bottom-10 right-10 z-[100]">
                    <button 
                        onClick={() => setIsOpen(true)}
                        className="w-16 h-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 hover:text-yellow-400 hover:border-yellow-100 transition-all group relative"
                    >
                        <Star className="w-8 h-8 group-hover:fill-yellow-400" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping"></div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full"></div>
                    </button>
                </div>
            )}

            {isOpen && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 w-[380px] animate-in zoom-in-95 duration-300 relative">
                        <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors">
                            <X className="w-5 h-5" />
                        </button>

                        {submitted ? (
                            <div className="py-10 text-center space-y-4">
                                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h4 className="text-xl font-black italic">Cảm ơn bạn!</h4>
                                <p className="text-sm text-slate-500 font-medium">Đánh giá của bạn đã giúp cộng đồng học tập tốt hơn.</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-2xl font-black font-headline italic">Đánh giá {type === 'assignment' ? 'bài tập' : 'bài học'}?</h4>
                                    <p className="text-sm text-slate-500 font-medium mt-1">Phản hồi của bạn thực sự quý giá với giáo viên.</p>
                                </div>

                                <div className="flex justify-center gap-3">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button 
                                            key={star} 
                                            onClick={() => setRating(star)}
                                            className="transition-transform active:scale-90"
                                        >
                                            <Star className={`w-10 h-10 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'} transition-colors`} />
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <MessageSquare className="w-3 h-3" /> Bình luận (Tùy chọn)
                                    </div>
                                    <textarea 
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        placeholder="Viết cảm nhận của bạn..."
                                    />
                                </div>

                                <button 
                                    onClick={handleSubmit}
                                    disabled={rating === 0 || loading}
                                    className="w-full h-14 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-primary transition-all disabled:opacity-30 disabled:hover:bg-slate-950"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Gửi đánh giá"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
