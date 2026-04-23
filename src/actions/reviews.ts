
"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function submitLessonReview(lessonId: string, rating: number, comment: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Bạn cần đăng nhập để thực hiện chức năng này." };
    }

    const studentId = session.user.id;

    // 1. Check if lesson is PUBLIC
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { assignment: { select: { status: true } } }
    });

    if (!lesson || lesson.assignment?.status !== "PUBLIC") {
      return { success: false, message: "Chỉ có thể đánh giá bài học công khai." };
    }

    // 2. Check if student already reviewed
    const existingReview = await prisma.lessonReview.findUnique({
      where: {
        studentId_lessonId: {
          studentId,
          lessonId
        }
      }
    });

    if (existingReview) {
      return { success: false, message: "Bạn đã đánh giá bài học này rồi." };
    }

    // 3. Create review (isApproved = false by default)
    await prisma.lessonReview.create({
      data: {
        lessonId,
        studentId,
        rating,
        comment
      }
    });

    revalidatePath(`/public/lessons/${lessonId}`);
    revalidatePath(`/student/lessons/${lessonId}`);
    return { 
      success: true, 
      message: "Đánh giá của bạn đã được gửi và đang chờ quản trị viên phê duyệt." 
    };

  } catch (error) {
    console.error("Error submitting review:", error);
    return { success: false, message: "Đã có lỗi xảy ra. Vui lòng thử lại sau." };
  }
}

export async function submitAssignmentReview(assignmentId: string, rating: number, comment: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Bạn cần đăng nhập để thực hiện chức năng này." };
    }

    const studentId = session.user.id;

    // 1. Check if assignment is PUBLIC
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { status: true }
    });

    if (!assignment || assignment.status !== "PUBLIC") {
      return { success: false, message: "Chỉ có thể đánh giá bài tập công khai." };
    }

    // 2. Check if student already reviewed
    const existingReview = await prisma.assignmentReview.findUnique({
      where: {
        studentId_assignmentId: {
          studentId,
          assignmentId
        }
      }
    });

    if (existingReview) {
      return { success: false, message: "Bạn đã đánh giá bài tập này rồi." };
    }

    // 3. Create review (with moderation)
    await prisma.assignmentReview.create({
      data: {
        assignmentId,
        studentId,
        rating,
        comment: comment || null
      }
    });

    revalidatePath(`/student/assignments/${assignmentId}/run`);
    return { 
      success: true, 
      message: "Đánh giá của bạn đã được gửi và đang chờ quản trị viên phê duyệt." 
    };

  } catch (error) {
    console.error("Error submitting assignment review:", error);
    return { success: false, message: "Đã có lỗi xảy ra. Vui lòng thử lại sau." };
  }
}
