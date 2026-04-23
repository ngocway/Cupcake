
"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required.");
  }
}

export async function approveReview(reviewId: string, type: 'lesson' | 'assignment') {
  try {
    await checkAdmin();

    if (type === 'lesson') {
      await prisma.lessonReview.update({
        where: { id: reviewId },
        data: { isApproved: true }
      });
    } else {
      await prisma.assignmentReview.update({
        where: { id: reviewId },
        data: { isApproved: true }
      });
    }

    revalidatePath("/admin/reviews");
    return { success: true, message: "Đã duyệt đánh giá thành công." };
  } catch (error: any) {
    return { success: false, message: error.message || "Lỗi khi duyệt đánh giá." };
  }
}

export async function deleteReview(reviewId: string, type: 'lesson' | 'assignment') {
  try {
    await checkAdmin();

    if (type === 'lesson') {
      await prisma.lessonReview.delete({
        where: { id: reviewId }
      });
    } else {
      await prisma.assignmentReview.delete({
        where: { id: reviewId }
      });
    }

    revalidatePath("/admin/reviews");
    return { success: true, message: "Đã xóa đánh giá thành công." };
  } catch (error: any) {
    return { success: false, message: error.message || "Lỗi khi xóa đánh giá." };
  }
}
