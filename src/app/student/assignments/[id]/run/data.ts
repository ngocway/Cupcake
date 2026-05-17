import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

export const getAssignmentMeta = (id: string) => unstable_cache(
  async () => {
    return prisma.assignment.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: {
        id: true,
        slug: true,
        title: true,
        timeLimit: true,
        deadline: true,
        maxAttempts: true,
        defaultPoints: true,
        focusMode: true,
        _count: { select: { questions: true } }
      }
    });
  },
  ["assignment-meta", id],
  { revalidate: 300, tags: ["assignment"] }
)();

export const getAssignmentInstructions = (id: string) => unstable_cache(
  async () => {
    return prisma.assignment.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { instructions: true, readingText: true }
    });
  },
  ["assignment-instructions", id],
  { revalidate: 600, tags: ["assignment", "assignments"] }
)();

export const getAssignmentTeacher = (id: string) => unstable_cache(
  async () => {
    const assignment = await prisma.assignment.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: {
        teacher: {
          select: {
            id: true,
            name: true,
            image: true,
            professionalTitle: true,
            bio: true,
            isPortfolioPublished: true,
            _count: { select: { lessons: true, assignments: true } }
          }
        }
      }
    });
    return assignment?.teacher;
  },
  ["assignment-teacher", id],
  { revalidate: 600, tags: ["assignment", "assignments"] }
)();

export const getAssignmentReviews = (assignmentId: string) => unstable_cache(
  async () => {
    return prisma.assignmentReview.findMany({
      where: { assignmentId, isApproved: true },
      take: 3,
      include: { student: { select: { name: true, image: true } } },
      orderBy: { createdAt: "desc" }
    });
  },
  ["assignment-reviews", assignmentId],
  { revalidate: 600, tags: ["assignment", "reviews"] }
)();

export const prewarmAssignmentQuestions = async (assignmentId: string) => {
  // Hàm này chỉ gọi để Prisma cache lại query câu hỏi
  return prisma.question.findMany({
    where: { assignmentId },
    orderBy: { orderIndex: "asc" },
    select: { id: true } // Chỉ lấy ID để nhẹ, nhưng đủ để warm up DB cache
  });
};
