import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

export const getLessonDetail = (id: string) => unstable_cache(
  async () => {
    return prisma.lesson.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        videoUrl: true,
        teacherId: true,
        teacher: {
          select: {
            id: true,
            name: true,
            image: true,
            professionalTitle: true,
            bio: true,
            isPortfolioPublished: true,
            _count: {
              select: { lessons: true, assignments: true }
            }
          }
        },
        assignment: {
          select: {
            id: true,
            slug: true,
            title: true,
            thumbnail: true,
            _count: { select: { questions: true } }
          }
        },
        favorites: {
          select: { studentId: true }
        }
      }
    });
  },
  ["lesson-detail", id],
  { revalidate: 300, tags: ["lessons", "assignment"] }
)();

export const getLessonReadingText = async (lessonId: string) => {
  const assignment = await prisma.assignment.findFirst({
    where: { lesson: { id: lessonId } },
    select: { readingText: true }
  });
  return assignment?.readingText ?? null;
};

export const getLessonReviews = (lessonId: string) => unstable_cache(
  async () => {
    return prisma.lessonReview.findMany({
      where: { lessonId, isApproved: true },
      include: {
        student: {
          select: { name: true, image: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
  },
  ["lesson-reviews", lessonId],
  { revalidate: 300, tags: ["lessons", "reviews"] }
)();

export const getRelatedLessons = (teacherId: string, lessonId: string) => unstable_cache(
  async () => {
    return prisma.lesson.findMany({
      where: {
        id: { not: lessonId },
        teacherId: teacherId,
        deletedAt: null,
        isBlocked: false
      },
      take: 5,
      select: {
        id: true,
        slug: true,
        title: true
      }
    });
  },
  ["related-lessons", teacherId, lessonId],
  { revalidate: 600, tags: ["lessons"] }
)();
