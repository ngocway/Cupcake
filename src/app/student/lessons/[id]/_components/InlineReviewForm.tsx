"use client";

import { useState } from "react";
import { submitLessonReview } from "@/actions/reviews";
import { Star, MessageSquare, Loader2, CheckCircle2, PenLine, ChevronUp } from "lucide-react";
import { LoginModal } from "@/components/LoginButton";
import { useRouter } from "next/navigation";

interface InlineReviewFormProps {
  lessonId: string;
  isLoggedIn: boolean;
}

export function InlineReviewForm({ lessonId, isLoggedIn }: InlineReviewFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleButtonClick = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setErrorMessage("Please select a star rating.");
      return;
    }
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await submitLessonReview(lessonId, rating, comment);
      if (res.success) {
        setSubmitted(true);
        router.refresh();
      } else {
        setErrorMessage(res.message || "Unable to submit review.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {!submitted ? (
        <button
          onClick={handleButtonClick}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] uppercase tracking-wide shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 whitespace-nowrap"
        >
          {isOpen ? (
            <>
              <ChevronUp className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Close form</span>
            </>
          ) : (
            <>
              <PenLine className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Write a review</span>
            </>
          )}
        </button>
      ) : (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2 animate-in fade-in duration-300">
          <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
          <p className="text-xs font-bold text-emerald-800">Thank you for your review!</p>
          <p className="text-[11px] text-emerald-600 font-medium">Your review is pending approval.</p>
        </div>
      )}

      {isOpen && !submitted && (
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-md space-y-4 text-left animate-in slide-in-from-top-3 duration-300">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Select rating:
            </label>
            <div className="flex items-center gap-1.5 justify-center py-2 bg-slate-50 rounded-xl border border-slate-100">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-125 active:scale-90"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      (hoverRating || rating) >= star
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              Your comment:
            </label>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-h-[90px] outline-none"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your review here..."
            />
          </div>

          {errorMessage && (
            <p className="text-[11px] font-bold text-rose-500 text-center">{errorMessage}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={rating === 0 || loading}
            className="w-full h-11 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Submit Review"
            )}
          </button>
        </div>
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        defaultView="studentLogin"
      />
    </div>
  );
}
