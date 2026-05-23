"use client";

import { useState } from "react";
import { Star, BookOpen, FileQuestion, Search, MessageSquare } from "lucide-react";
import { MyReviewCard } from "./MyReviewCard";
import { MyReviewsStats } from "./MyReviewsStats";

interface LessonReview {
  id: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: Date;
  lesson: {
    id: string;
    title: string;
    thumbnail: string | null;
    teacher: { name: string | null; image: string | null } | null;
  };
}

interface AssignmentReview {
  id: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: Date;
  assignment: {
    id: string;
    title: string;
    thumbnail: string | null;
    teacher: { name: string | null; image: string | null } | null;
  };
}

interface Props {
  initialLessonReviews: LessonReview[];
  initialAssignmentReviews: AssignmentReview[];
  translations: any; // Using any for simplicity as it's passed down
}

type TabType = "all" | "lesson" | "assignment";

export function MyReviewsClient({ initialLessonReviews, initialAssignmentReviews, translations }: Props) {
  const [lessonReviews, setLessonReviews] = useState(initialLessonReviews);
  const [assignmentReviews, setAssignmentReviews] = useState(initialAssignmentReviews);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const combinedReviews = [
    ...lessonReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      isApproved: r.isApproved,
      createdAt: r.createdAt,
      type: "lesson" as const,
      targetTitle: r.lesson.title,
      targetId: r.lesson.id,
      teacher: r.lesson.teacher,
    })),
    ...assignmentReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      isApproved: r.isApproved,
      createdAt: r.createdAt,
      type: "assignment" as const,
      targetTitle: r.assignment.title,
      targetId: r.assignment.id,
      teacher: r.assignment.teacher,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredReviews = combinedReviews.filter((r) => {
    const matchesTab = activeTab === "all" || r.type === activeTab;
    const matchesSearch = r.targetTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const totalReviews = combinedReviews.length;
  const approvedReviews = combinedReviews.filter((r) => r.isApproved).length;
  const averageRating = totalReviews > 0
    ? combinedReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
    : 0;

  const handleUpdate = () => {
    setRefreshKey((k) => k + 1);
    window.location.reload();
  };

  const handleDelete = (id: string) => {
    setLessonReviews((prev) => prev.filter((r) => r.id !== id));
    setAssignmentReviews((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-8" key={refreshKey}>
      <MyReviewsStats
        totalReviews={totalReviews}
        approvedReviews={approvedReviews}
        averageRating={averageRating}
        translations={translations}
      />

      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl p-1.5">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "all"
                   ? "bg-white/80 dark:bg-slate-700/80 shadow-sm text-slate-900 dark:text-white"
                   : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {translations.all} ({combinedReviews.length})
            </button>
            <button
              onClick={() => setActiveTab("lesson")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                activeTab === "lesson"
                  ? "bg-white/80 dark:bg-slate-700/80 shadow-sm text-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              {translations.lessons} ({lessonReviews.length})
            </button>
            <button
              onClick={() => setActiveTab("assignment")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                activeTab === "assignment"
                  ? "bg-white/80 dark:bg-slate-700/80 shadow-sm text-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <FileQuestion className="w-4 h-4" />
              {translations.assignments} ({assignmentReviews.length})
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={translations.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all w-full md:w-64 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {filteredReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredReviews.map((review) => (
              <MyReviewCard
                key={review.id}
                review={review}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                translations={translations}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="w-10 h-10 text-slate-200 dark:text-slate-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">{translations.noReviews}</h3>
              <p className="text-slate-500 font-medium max-w-sm mx-auto">
                {searchQuery
                  ? translations.noResults
                  : activeTab === "all"
                  ? translations.emptyMessage
                  : translations.emptyTypeMessage.replace("{type}", activeTab === "lesson" ? translations.lesson.toLowerCase() : translations.assignment.toLowerCase())}
              </p>
            </div>
            {!searchQuery && (
              <a
                href={activeTab === "lesson" ? "/student/lessons" : "/student/assignments"}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-950 text-white rounded-2xl font-bold text-sm hover:bg-primary transition-colors"
              >
                <Star className="w-4 h-4" />
                {translations.explore} {activeTab === "lesson" ? translations.lessons.toLowerCase() : translations.assignments.toLowerCase()}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
