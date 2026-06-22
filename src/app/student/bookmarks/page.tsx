import React from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Bookmark,
  BookOpen,
  FileText as AssignmentIcon,
  ChevronRight,
  Clock,
  User,
  Search,
  Plus,
  ArrowRight
} from 'lucide-react';
import { getTranslations, getLocale } from "next-intl/server";
import BookmarksClient from "./BookmarksClient";

export default async function BookmarksPage() {
  const t = await getTranslations("student.bookmarks");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user?.id) redirect('/student/login');

  const userId = session.user.id;

  // Fetch bookmarked lessons
  const bookmarkedLessons = await prisma.favoriteLesson.findMany({
    where: { studentId: userId },
    include: {
      lesson: {
        include: {
          teacher: {
            select: { name: true, image: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch bookmarked assignments
  const bookmarkedAssignments = await prisma.favoriteAssignment.findMany({
    where: { studentId: userId },
    include: {
      assignment: {
        include: {
          teacher: {
            select: { name: true, image: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const hasBookmarks = bookmarkedLessons.length > 0 || bookmarkedAssignments.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-5 group">
          <div className="p-5 bg-primary/10 rounded-[2rem] group-hover:scale-110 transition-transform duration-500">
            <Bookmark className="w-10 h-10 text-primary fill-primary/20" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{t("title")}</h1>
            <p className="text-slate-500 font-medium text-lg">{t("subtitle")}</p>
          </div>
        </div>
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder={t("searchPlaceholder")}
            className="w-full pl-12 pr-6 py-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all font-medium text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {!hasBookmarks ? (
        <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[3rem] p-6 sm:p-20 text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="w-12 h-12 text-slate-300 dark:text-slate-500" />
          </div>
          <div className="max-w-md mx-auto space-y-4">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white">{t("noBookmarks")}</h2>
            <p className="text-slate-500 font-medium leading-relaxed italic">
              {t("emptyStateMessage")}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link href="/library?type=LESSON" className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-3">
              {t("exploreLessons")}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/library?type=ASSIGNMENT" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20 flex items-center gap-3">
              {t("viewAssignments")}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      ) : (
        <BookmarksClient
          initialLessons={bookmarkedLessons.map(b => b.lesson)}
          initialAssignments={bookmarkedAssignments.map(b => b.assignment)}
          translations={{
            savedLessons: t("savedLessons", { count: bookmarkedLessons.length }),
            savedAssignments: t("savedAssignments", { count: bookmarkedAssignments.length }),
            minutes: t("minutes"),
            unlimited: t("unlimited"),
            assignmentLabel: t("assignmentLabel")
          }}
        />
      )}
    </div>
  );
}
