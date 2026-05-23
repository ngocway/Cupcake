import { Star, Clock, CheckCircle, Trash2, Edit2, BookOpen, FileQuestion, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { deleteMyReview, updateMyReview } from "@/actions/my-reviews";
import { useState } from "react";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: Date;
  type: "lesson" | "assignment";
  targetTitle: string;
  targetId: string;
  teacher?: { name: string | null; image: string | null } | null;
}

interface MyReviewCardProps {
  review: ReviewItem;
  onUpdate: () => void;
  onDelete: (id: string) => void;
  translations: any;
}

export function MyReviewCard({ review, onUpdate, onDelete, translations }: MyReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editComment, setEditComment] = useState(review.comment || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await updateMyReview(review.id, review.type, editRating, editComment);
      if (result.success) {
        setIsEditing(false);
        onUpdate();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert(translations.updateError);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(translations.deleteConfirm)) return;
    setLoading(true);
    try {
      const result = await deleteMyReview(review.id, review.type);
      if (result.success) {
        onDelete(review.id);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert(translations.deleteError);
    } finally {
      setLoading(false);
    }
  };

  const targetLink = review.type === "lesson"
    ? `/student/lessons/${review.targetId}`
    : `/student/assignments/${review.targetId}/run`;

  const TypeIcon = review.type === "lesson" ? BookOpen : FileQuestion;
  const typeLabel = review.type === "lesson" ? translations.lesson : translations.assignment;

  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 group">
      {isEditing ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${review.type === "lesson" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"}`}>
                <TypeIcon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{typeLabel}</span>
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {format(new Date(review.createdAt), "dd/MM/yyyy")}
            </span>
          </div>

          <div className="text-center space-y-3">
            <p className="font-black text-slate-900 text-lg">{review.targetTitle}</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setEditRating(star)} className="transition-transform active:scale-90">
                  <Star
                    className={`w-8 h-8 ${editRating >= star ? "text-yellow-400 fill-yellow-400" : "text-slate-200"} transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>

          <textarea
            className="w-full bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-md border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px] text-slate-900 dark:text-white"
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
            placeholder={translations.placeholder}
          />

          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 h-12 bg-slate-100/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              {translations.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 h-12 bg-slate-950 text-white rounded-xl font-bold text-sm hover:bg-primary transition-colors disabled:opacity-50"
            >
              {loading ? translations.saving : translations.saveChanges}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${review.type === "lesson" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"}`}>
                <TypeIcon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{typeLabel}</span>
            </div>

            <div className="flex items-center gap-2">
              {review.isApproved ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50/50 dark:bg-green-900/50 backdrop-blur-md text-green-600 dark:text-green-400 rounded-full border border-green-100 dark:border-green-800 text-[10px] font-black uppercase tracking-widest">
                  <CheckCircle className="w-3 h-3" />
                  {translations.approvedStatus}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50/50 dark:bg-amber-900/50 backdrop-blur-md text-amber-600 dark:text-amber-400 rounded-full border border-amber-100 dark:border-amber-800 text-[10px] font-black uppercase tracking-widest">
                  <Clock className="w-3 h-3" />
                  {translations.pendingStatus}
                </span>
              )}
            </div>
          </div>

          <a
            href={targetLink}
            className="block mb-4 group/title"
          >
            <h3 className="font-black text-slate-900 text-lg hover:text-primary transition-colors flex items-center gap-2">
              {review.targetTitle}
              <ExternalLink className="w-4 h-4 opacity-0 group-hover/title:opacity-100 transition-opacity" />
            </h3>
            {review.teacher && (
              <p className="text-sm text-slate-500 font-medium mt-1">
                {translations.teacher}: {review.teacher.name || "N/A"}
              </p>
            )}
          </a>

          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${review.rating >= star ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`}
              />
            ))}
            <span className="text-sm font-bold text-slate-600 ml-2">{review.rating}/5</span>
          </div>

          {review.comment && (
            <p className="text-sm font-medium text-slate-600 leading-relaxed italic mb-6 line-clamp-3">
              "{review.comment}"
            </p>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Clock className="w-3 h-3" />
              {format(new Date(review.createdAt), "dd/MM/yyyy HH:mm")}
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditing(true)}
                disabled={review.isApproved}
                className="p-2.5 bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title={review.isApproved ? translations.cannotEditApproved : translations.editReview}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="p-2.5 bg-red-50/50 dark:bg-red-900/50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                title={translations.deleteReview}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
