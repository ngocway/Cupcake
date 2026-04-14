"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function updateTeacherProfile(data: {
    name?: string,
    bio?: string,
    professionalTitle?: string,
    expertiseTags?: string,
    socialLinks?: string,
    coverImage?: string,
    image?: string,
    isPortfolioPublished?: boolean,
    hourlyRate?: number,
    location?: string,
    education?: string,
    teachingExperience?: string
}) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "TEACHER") {
            return { error: "Không có quyền thực hiện" };
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: data.name,
                bio: data.bio,
                professionalTitle: data.professionalTitle,
                expertiseTags: data.expertiseTags,
                socialLinks: data.socialLinks,
                coverImage: data.coverImage,
                image: data.image,
                isPortfolioPublished: data.isPortfolioPublished,
                hourlyRate: data.hourlyRate,
                location: data.location,
                education: data.education,
                teachingExperience: data.teachingExperience
            }
        });

        revalidatePath("/teacher/profile");
        revalidatePath(`/teacher/profile/${session.user.id}`);
        revalidatePath(`/profile/${session.user.id}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { error: "Lỗi hệ thống khi cập nhật hồ sơ" };
    }
}


export async function getTeacherProfile(teacherId: string) {
    try {
        const currentSession = await auth();
        const currentUserId = currentSession?.user?.id;

        const teacher = await prisma.user.findUnique({
            where: { id: teacherId },
            include: {
                _count: {
                    select: {
                        followers: true,
                        lessons: { where: { deletedAt: null } },
                        assignments: { where: { status: "PUBLIC", deletedAt: null } },
                        classesCreated: { where: { deletedAt: null } }
                    }
                },
                followers: currentUserId ? { where: { followerId: currentUserId } } : false
            }
        });

        if (!teacher || teacher.role !== "TEACHER") return null;

        // Aggregate impact stats (UC 10.2)
        const assignmentEngagement = await prisma.assignment.aggregate({
            where: { teacherId, status: "PUBLIC", deletedAt: null },
            _sum: {
                viewCount: true,
                publicSubmissionCount: true
            }
        });

        const lessonViews = await prisma.lesson.aggregate({
            where: { teacherId, deletedAt: null },
            _sum: {
                viewsCount: true
            }
        });

        // Fetch public content for profile
        const publicAssignments = await prisma.assignment.findMany({
            where: { teacherId, status: "PUBLIC", deletedAt: null },
            include: { _count: { select: { questions: true } } },
            orderBy: { createdAt: "desc" },
            take: 6
        });

        const publicLessons = await prisma.lesson.findMany({
            where: { teacherId, deletedAt: null, isPremium: false },
            orderBy: { createdAt: "desc" },
            take: 6
        });

        const publicClasses = await prisma.class.findMany({
            where: { teacherId, deletedAt: null, isJoinable: true },
            take: 4
        });

        // UC 10.3 / 11.4: Real satisfaction score
        const assignmentReviews = await prisma.assignmentReview.aggregate({
            where: { assignment: { teacherId } },
            _avg: { rating: true },
            _count: { rating: true }
        });

        const lessonReviews = await prisma.lessonReview.aggregate({
            where: { lesson: { teacherId } },
            _avg: { rating: true },
            _count: { rating: true }
        });

        const avgA = assignmentReviews._avg.rating || 0;
        const avgL = lessonReviews._avg.rating || 0;
        const countA = assignmentReviews._count.rating;
        const countL = lessonReviews._count.rating;

        // Weighted average
        const satisfactionScore = (countA + countL > 0) 
            ? ((avgA * countA) + (avgL * countL)) / (countA + countL)
            : 5.0; // Default to 5.0 if no reviews yet

        return {
            ...teacher,
            isFollowing: teacher.followers ? teacher.followers.length > 0 : false,
            assignments: publicAssignments,
            lessons: publicLessons,
            classes: publicClasses,
            stats: {
                followers: teacher._count.followers,
                lessons: teacher._count.lessons,
                assignments: teacher._count.assignments,
                classes: teacher._count.classesCreated,
                totalViews: (assignmentEngagement._sum.viewCount || 0) + (lessonViews._sum.viewsCount || 0),
                totalSubmissions: (assignmentEngagement._sum.publicSubmissionCount || 0),
                satisfaction: satisfactionScore
            }
        };
    } catch (error) {
        console.error("Error fetching teacher profile:", error);
        return null;
    }
}

export async function toggleFollowTeacher(teacherId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: "Cần đăng nhập để theo dõi" };

        const followerId = session.user.id;
        if (followerId === teacherId) return { error: "Bạn không thể theo dõi chính mình" };

        const existing = await prisma.follower.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId: teacherId
                }
            }
        });

        if (existing) {
            await prisma.follower.delete({
                where: {
                    followerId_followingId: {
                        followerId,
                        followingId: teacherId
                    }
                }
            });
            revalidatePath(`/profile/${teacherId}`);
            return { success: true, action: "unfollowed" };
        } else {
            await prisma.follower.create({
                data: {
                    followerId,
                    followingId: teacherId
                }
            });
            revalidatePath(`/profile/${teacherId}`);
            return { success: true, action: "followed" };
        }
    } catch (error) {
        console.error("Error toggling follow:", error);
        return { error: "Lỗi hệ thống" };
    }
}

export async function getTeacherReviews(teacherId: string) {
    try {
        const aReviews = await prisma.assignmentReview.findMany({
            where: { assignment: { teacherId } },
            include: { student: { select: { name: true, image: true } } },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        const lReviews = await prisma.lessonReview.findMany({
            where: { lesson: { teacherId } },
            include: { student: { select: { name: true, image: true } } },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        return [...aReviews, ...lReviews].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);
    } catch (error) {
        console.error("Error fetching teacher reviews:", error);
        return [];
    }
}
