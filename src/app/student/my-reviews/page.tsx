import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { MyReviewsClient } from "./_components/MyReviewsClient";
import { Star } from "lucide-react";

export default async function MyReviewsPage() {
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
    <div className="p-8 space-y-8 min-h-screen bg-slate-50">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-primary/10 rounded-2xl">
          <Star className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Đánh giá của tôi</h1>
          <p className="text-slate-500 font-medium">Quản lý các đánh giá bạn đã gửi</p>
        </div>
      </div>

      <MyReviewsClient
        initialLessonReviews={lessonReviews}
        initialAssignmentReviews={assignmentReviews}
      />
    </div>
  );
}
