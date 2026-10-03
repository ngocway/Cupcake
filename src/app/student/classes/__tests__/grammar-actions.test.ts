import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/cached-queries", () => ({
  fetchWithRedis: vi.fn((key: string, ttl: number, fn: () => Promise<any>) => fn()),
  invalidateStudentClassesCache: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    assignment: {
      findFirst: vi.fn(),
    },
    grammarLesson: {
      findUnique: vi.fn(),
    },
    submission: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getStudentGrammarLessonData, completeGrammarLesson } from "../actions";

describe("Student Grammar Lesson Learning Flow Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStudentGrammarLessonData", () => {
    it("should throw Unauthorized when user is not logged in", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any);
      await expect(getStudentGrammarLessonData("grammar-as-1")).rejects.toThrow("Unauthorized");
    });

    it("should throw error if assignment cannot be found", async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: "student-1" } } as any);
      vi.mocked(prisma.assignment.findFirst).mockResolvedValueOnce(null);

      await expect(getStudentGrammarLessonData("missing-id")).rejects.toThrow("Không tìm thấy bài học");
    });

    it("should return grammar lesson data and unsubmitted status when no prior submission", async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: "student-1" } } as any);

      vi.mocked(prisma.assignment.findFirst).mockResolvedValueOnce({
        id: "as-1",
        title: "Present Simple Lesson",
        slug: "present-simple-lesson",
        level: "a1",
        grammarLesson: "present-simple",
        instructions: "<p>Basic Instructions</p>",
        instructionsTranslations: null,
        updatedAt: new Date(),
        teacher: { id: "t-1", name: "Alice", image: null },
      } as any);

      vi.mocked(prisma.grammarLesson.findUnique).mockResolvedValueOnce({
        instructions: "<p>Grammar Lesson Rules: S + V</p>",
        instructionsTranslations: { vi: "<p>Quy tắc ngữ pháp: S + V</p>" },
        updatedAt: new Date(),
      } as any);

      vi.mocked(prisma.submission.findFirst).mockResolvedValueOnce(null);

      const result = await getStudentGrammarLessonData("as-1");

      expect(result).toMatchObject({
        assignmentId: "as-1",
        title: "Present Simple Lesson",
        level: "a1",
        topicId: "tenses",
        lessonId: "present-simple",
        instructions: "<p>Grammar Lesson Rules: S + V</p>",
        instructionsTranslations: { vi: "<p>Quy tắc ngữ pháp: S + V</p>" },
        isSubmitted: false,
        score: null,
      });
    });

    it("should resolve topic and lesson from instructions playUrl when grammarLesson field is null", async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: "student-1" } } as any);

      vi.mocked(prisma.assignment.findFirst).mockResolvedValueOnce({
        id: "as-custom-url",
        title: "Custom URL Lesson",
        slug: "custom-url-lesson",
        level: "a2",
        grammarLesson: null,
        instructions: JSON.stringify({
          playUrl: "/grammar/tenses/past-simple",
        }),
        instructionsTranslations: null,
        updatedAt: new Date(),
        teacher: null,
      } as any);

      vi.mocked(prisma.grammarLesson.findUnique).mockResolvedValueOnce({
        instructions: "<p>Past Simple Content</p>",
        instructionsTranslations: null,
        updatedAt: new Date(),
      } as any);

      vi.mocked(prisma.submission.findFirst).mockResolvedValueOnce({
        id: "sub-1",
        score: 10,
        submittedAt: new Date(),
      } as any);

      const result = await getStudentGrammarLessonData("as-custom-url");

      expect(result.lessonId).toBe("past-simple");
      expect(result.topicId).toBe("tenses");
      expect(result.isSubmitted).toBe(true);
      expect(result.score).toBe(10);
    });
  });

  describe("completeGrammarLesson", () => {
    it("should throw Unauthorized when user is not logged in", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any);
      await expect(completeGrammarLesson("as-1")).rejects.toThrow("Unauthorized");
    });

    it("should throw error if assignment is not found", async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: "student-1" } } as any);
      vi.mocked(prisma.assignment.findFirst).mockResolvedValueOnce(null);

      await expect(completeGrammarLesson("non-existent")).rejects.toThrow("Không tìm thấy bài học");
    });

    it("should update existing submission with score 10 and submittedAt date", async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: "student-1" } } as any);

      vi.mocked(prisma.assignment.findFirst).mockResolvedValueOnce({ id: "as-1" } as any);
      vi.mocked(prisma.submission.findFirst).mockResolvedValueOnce({
        id: "existing-sub-1",
      } as any);
      vi.mocked(prisma.submission.update).mockResolvedValueOnce({
        id: "existing-sub-1",
      } as any);

      const res = await completeGrammarLesson("as-1", "class-1", "group-1");

      expect(res.success).toBe(true);
      expect(res.submissionId).toBe("existing-sub-1");
      expect(prisma.submission.update).toHaveBeenCalledWith({
        where: { id: "existing-sub-1" },
        data: {
          submittedAt: expect.any(Date),
          score: 10,
        },
      });
    });

    it("should create new submission with score 10 and attemptNumber 1 if none exists", async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: "student-1" } } as any);

      vi.mocked(prisma.assignment.findFirst).mockResolvedValueOnce({ id: "as-2" } as any);
      vi.mocked(prisma.submission.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.submission.create).mockResolvedValueOnce({
        id: "new-sub-1",
      } as any);

      const res = await completeGrammarLesson("as-2", "class-1", "group-1");

      expect(res.success).toBe(true);
      expect(res.submissionId).toBe("new-sub-1");
      expect(prisma.submission.create).toHaveBeenCalledWith({
        data: {
          studentId: "student-1",
          assignmentId: "as-2",
          classId: "class-1",
          groupId: "group-1",
          submittedAt: expect.any(Date),
          score: 10,
          attemptNumber: 1,
        },
        select: { id: true },
      });
    });
  });
});
