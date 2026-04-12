"use server"

import prisma from "@/lib/prisma"

export async function getPublicMaterials() {
    try {
        const publicAssignments = await prisma.assignment.findMany({
            where: {
                status: "PUBLIC",
                deletedAt: null
            },
            include: {
                teacher: {
                    select: {
                        name: true,
                        image: true
                    }
                },
                _count: {
                    select: { questions: true }
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 9
        })

        const publicLessons = await prisma.lesson.findMany({
            where: {
                deletedAt: null,
                // In our current schema, lessons don't have a status field directly, 
                // but they are linked to assignments which do, or they are just standalone.
                // Let's assume for now all lessons not deleted are public or we filter by isPremium.
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

        return {
            assignments: publicAssignments,
            lessons: publicLessons
        }
    } catch (error) {
        console.error("Error fetching public materials:", error)
        return { assignments: [], lessons: [] }
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
