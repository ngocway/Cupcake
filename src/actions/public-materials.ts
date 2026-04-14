"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function getPublicMaterials(params?: { 
    search?: string, 
    category?: string, 
    sort?: 'newest' | 'popular' | 'trending',
    page?: number,
    limit?: number
}) {
    try {
        const search = params?.search || "";
        const category = params?.category === "Tất cả" ? "" : params?.category || "";
        const sort = params?.sort || 'newest';
        const page = params?.page || 1;
        const limit = params?.limit || 9;
        const skip = (page - 1) * limit;

        const where: any = {
            status: "PUBLIC",
            deletedAt: null,
            ...(search ? {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { shortDescription: { contains: search, mode: 'insensitive' } },
                    { tags: { contains: search, mode: 'insensitive' } }
                ]
            } : {}),
            ...(category ? { subject: category } : {})
        };

        const orderBy: any = {};
        if (sort === 'newest') orderBy.createdAt = 'desc';
        else if (sort === 'popular') orderBy.viewCount = 'desc';
        else if (sort === 'trending') orderBy.publicSubmissionCount = 'desc';

        const session = await auth();
        const userId = session?.user?.id;

        const publicAssignments = await prisma.assignment.findMany({
            where,
            include: {
                teacher: {
                    select: { id: true, name: true, image: true, bio: true }
                },
                _count: {
                    select: { questions: true }
                },
                ...(userId ? {
                    favoriteAssignments: { where: { studentId: userId } }
                } : {})
            },
            orderBy,
            take: limit,
            skip: skip
        })

        const totalCount = await prisma.assignment.count({ where });

        const publicLessons = await prisma.lesson.findMany({
            where: {
                deletedAt: null,
                isPremium: false
            },
            include: {
                teacher: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 9
        })

        const processedAssignments = publicAssignments.map((a: any) => ({
            ...a,
            tags: a.tags ? a.tags.split(',').filter(Boolean) : [],
            isBookmarked: userId ? (a.favoriteAssignments && a.favoriteAssignments.length > 0) : false
        }))

        return {
            assignments: processedAssignments,
            lessons: publicLessons,
            total: totalCount,
            hasMore: totalCount > (skip + limit)
        }
    } catch (error) {
        console.error("Error fetching public materials:", error)
        return { assignments: [], lessons: [], total: 0, hasMore: false }
    }
}

export async function incrementPublicView(id: string) {
    try {
        await prisma.assignment.update({
            where: { id, status: 'PUBLIC' },
            data: { viewCount: { increment: 1 } }
        });
        return { success: true };
    } catch (error) {
        console.error("Error incrementing view count:", error);
        return { success: false };
    }
}

export async function incrementPublicSubmission(id: string) {
    try {
        await prisma.assignment.update({
            where: { id, status: 'PUBLIC' },
            data: { publicSubmissionCount: { increment: 1 } }
        });
        return { success: true };
    } catch (error) {
        console.error("Error incrementing submission count:", error);
        return { success: false };
    }
}

export async function toggleFavoriteAssignment(assignmentId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: "Yêu cầu đăng nhập" };

        const userId = session.user.id;

        const existing = await prisma.favoriteAssignment.findUnique({
            where: {
                studentId_assignmentId: {
                    studentId: userId,
                    assignmentId: assignmentId
                }
            }
        });

        if (existing) {
            await prisma.favoriteAssignment.delete({
                where: {
                    studentId_assignmentId: {
                        studentId: userId,
                        assignmentId: assignmentId
                    }
                }
            });
            revalidatePath("/");
            return { success: true, action: "unfavorited" };
        } else {
            await prisma.favoriteAssignment.create({
                data: {
                    studentId: userId,
                    assignmentId: assignmentId
                }
            });
            revalidatePath("/");
            return { success: true, action: "favorited" };
        }
    } catch (error) {
        console.error("Error toggling favorite:", error);
        return { error: "Lỗi hệ thống" };
    }
}
