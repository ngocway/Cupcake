"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getMyReviews() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Bạn cần đăng nhập.", lessonReviews: [], assignmentReviews: [] };
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

    return {
      success: true,
      lessonReviews,
      assignmentReviews
    };
  } catch (error) {
    console.error("Error fetching my reviews:", error);
    return { success: false, message: "Lỗi khi tải đánh giá.", lessonReviews: [], assignmentReviews: [] };
  }
}

export async function updateMyReview(
  reviewId: string,
  type: "lesson" | "assignment",
  rating: number,
  comment: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Bạn cần đăng nhập." };
    }

    if (rating < 1 || rating > 5) {
      return { success: false, message: "Điểm đánh giá phải từ 1 đến 5." };
    }

    const whereClause = type === "lesson"
      ? { id: reviewId, studentId: session.user.id }
      : { id: reviewId, studentId: session.user.id };

    const existingReview = type === "lesson"
      ? await prisma.lessonReview.findUnique({ where: { id: reviewId } })
      : await prisma.assignmentReview.findUnique({ where: { id: reviewId } });

    if (!existingReview) {
      return { success: false, message: "Không tìm thấy đánh giá." };
    }

    if (existingReview.studentId !== session.user.id) {
      return { success: false, message: "Bạn không có quyền sửa đánh giá này." };
    }

    if (type === "lesson") {
      await prisma.lessonReview.update({
        where: { id: reviewId },
        data: { rating, comment: comment || null, isApproved: false }
      });
      const lessonId = (existingReview as any).lessonId;
      revalidatePath(`/public/lessons/${lessonId}`);
      revalidatePath(`/student/lessons/${lessonId}`);
    } else {
      await prisma.assignmentReview.update({
        where: { id: reviewId },
        data: { rating, comment: comment || null, isApproved: false }
      });
      const assignmentId = (existingReview as any).assignmentId;
      revalidatePath(`/public/assignments/${assignmentId}`);
      revalidatePath(`/student/assignments/${assignmentId}/run`);
    }

    revalidatePath("/student/my-reviews");
    return { success: true, message: "Đánh giá đã được cập nhật." };
  } catch (error) {
    console.error("Error updating review:", error);
    return { success: false, message: "Lỗi khi cập nhật đánh giá." };
  }
}

export async function deleteMyReview(reviewId: string, type: "lesson" | "assignment") {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Bạn cần đăng nhập." };
    }

    const existingReview = type === "lesson"
      ? await prisma.lessonReview.findUnique({ where: { id: reviewId } })
      : await prisma.assignmentReview.findUnique({ where: { id: reviewId } });

    if (!existingReview) {
      return { success: false, message: "Không tìm thấy đánh giá." };
    }

    if (existingReview.studentId !== session.user.id) {
      return { success: false, message: "Bạn không có quyền xóa đánh giá này." };
    }

    if (type === "lesson") {
      await prisma.lessonReview.delete({ where: { id: reviewId } });
      const lessonId = (existingReview as any).lessonId;
      revalidatePath(`/public/lessons/${lessonId}`);
      revalidatePath(`/student/lessons/${lessonId}`);
    } else {
      await prisma.assignmentReview.delete({ where: { id: reviewId } });
      revalidatePath(`/public/assignments/${(existingReview as any).assignmentId}`);
      revalidatePath(`/student/assignments/${(existingReview as any).assignmentId}/run`);
    }

    revalidatePath("/student/my-reviews");
    return { success: true, message: "Đánh giá đã được xóa." };
  } catch (error) {
    console.error("Error deleting review:", error);
    return { success: false, message: "Lỗi khi xóa đánh giá." };
  }
}
