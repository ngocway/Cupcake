"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function submitAssignmentReview(data: {
    assignmentId: string,
    rating: number,
    comment?: string
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: "Cần đăng nhập để đánh giá" };

        const userId = session.user.id;

        // Check if already reviewed
        const existing = await prisma.assignmentReview.findUnique({
            where: {
                studentId_assignmentId: {
                    studentId: userId,
                    assignmentId: data.assignmentId
                }
            }
        });

        if (existing) return { error: "Bạn đã đánh giá bài tập này rồi" };

        await prisma.assignmentReview.create({
            data: {
                studentId: userId,
                assignmentId: data.assignmentId,
                rating: data.rating,
                comment: data.comment
            }
        });

        revalidatePath(`/join/${data.assignmentId}`);
        return { success: true };
    } catch (error) {
        console.error("Error submitting assignment review:", error);
        return { error: "Lỗi hệ thống khi gửi đánh giá" };
    }
}

export async function submitLessonReview(data: {
    lessonId: string,
    rating: number,
    comment?: string
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: "Cần đăng nhập để đánh giá" };

        const userId = session.user.id;

        const existing = await prisma.lessonReview.findUnique({
            where: {
                studentId_lessonId: {
                    studentId: userId,
                    lessonId: data.lessonId
                }
            }
        });

        if (existing) return { error: "Bạn đã đánh giá bài học này rồi" };

        await prisma.lessonReview.create({
            data: {
                studentId: userId,
                lessonId: data.lessonId,
                rating: data.rating,
                comment: data.comment
            }
        });

        revalidatePath(`/lessons/${data.lessonId}`);
        return { success: true };
    } catch (error) {
        console.error("Error submitting lesson review:", error);
        return { error: "Lỗi hệ thống" };
    }
}

export async function getReviews(type: 'assignment' | 'lesson', id: string) {
    try {
        if (type === 'assignment') {
            const reviews = await prisma.assignmentReview.findMany({
                where: { assignmentId: id },
                include: { student: { select: { name: true, image: true } } },
                orderBy: { createdAt: 'desc' }
            });
            return reviews;
        } else {
            const reviews = await prisma.lessonReview.findMany({
                where: { lessonId: id },
                include: { student: { select: { name: true, image: true } } },
                orderBy: { createdAt: 'desc' }
            });
            return reviews;
        }
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
}
