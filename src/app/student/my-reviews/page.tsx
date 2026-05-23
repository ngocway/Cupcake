import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { MyReviewsClient } from "./_components/MyReviewsClient";
import { Star } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";

export default async function MyReviewsPage() {
  const t = await getTranslations("student.reviews");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/student/login");
  }

  const studentId = session.user.id;

  const [lessonReviews, assignmentReviews] = await Promise.all([
    prisma.lessonReview.findMany({
      where: { studentId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            teacher: { select: { name: true, image: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.assignmentReview.findMany({
      where: { studentId },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            teacher: { select: { name: true, image: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return (
    <div className="p-8 space-y-8 min-h-screen bg-transparent">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-primary/10 rounded-2xl">
          <Star className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t("title")}</h1>
          <p className="text-slate-500 font-medium">{t("subtitle")}</p>
        </div>
      </div>

      <MyReviewsClient
        initialLessonReviews={lessonReviews}
        initialAssignmentReviews={assignmentReviews}
        translations={{
          totalReviews: t("totalReviews"),
          approved: t("approved"),
          averageRating: t("averageRating"),
          all: t("all"),
          lessons: t("lessons"),
          assignments: t("assignments"),
          searchPlaceholder: t("searchPlaceholder"),
          noReviews: t("noReviews"),
          noResults: t("noResults"),
          emptyMessage: t("emptyMessage"),
          emptyTypeMessage: t("emptyTypeMessage"),
          explore: t("explore"),
          lesson: t("lesson"),
          assignment: t("assignment"),
          teacher: t("teacher"),
          editReview: t("editReview"),
          deleteReview: t("deleteReview"),
          deleteConfirm: t("deleteConfirm"),
          updateError: t("updateError"),
          deleteError: t("deleteError"),
          placeholder: t("placeholder"),
          saveChanges: t("saveChanges"),
          saving: t("saving"),
          cancel: t("cancel"),
          approvedStatus: t("approvedStatus"),
          pendingStatus: t("pendingStatus"),
          cannotEditApproved: t("cannotEditApproved")
        }}
      />
    </div>
  );
}
