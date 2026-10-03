import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    grammarLesson: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    assignment: {
      findMany: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import {
  getLessonGrammarContent,
  saveLessonGrammarContent,
  getLessonExercises,
} from "../actions";

describe("Admin Grammar Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getLessonGrammarContent", () => {
    it("should return instructions and translations when lesson exists", async () => {
      vi.mocked(prisma.grammarLesson.findUnique).mockResolvedValueOnce({
        id: "present-simple",
        instructions: "<p>Formula: S + V(s/es)</p>",
        instructionsTranslations: { vi: "<p>Công thức: S + V(s/es)</p>" },
        updatedAt: new Date(),
      } as any);

      const res = await getLessonGrammarContent("present-simple");
      expect(res).toEqual({
        instructions: "<p>Formula: S + V(s/es)</p>",
        instructionsTranslations: { vi: "<p>Công thức: S + V(s/es)</p>" },
      });
      expect(prisma.grammarLesson.findUnique).toHaveBeenCalledWith({
        where: { id: "present-simple" },
        select: { instructions: true, instructionsTranslations: true },
      });
    });

    it("should return null when lesson does not exist in database", async () => {
      vi.mocked(prisma.grammarLesson.findUnique).mockResolvedValueOnce(null);

      const res = await getLessonGrammarContent("non-existent-lesson");
      expect(res).toBeNull();
    });
  });

  describe("saveLessonGrammarContent", () => {
    it("should upsert instructions and translations successfully", async () => {
      vi.mocked(prisma.grammarLesson.upsert).mockResolvedValueOnce({
        id: "past-simple",
        instructions: "<p>Formula: S + V2/ed</p>",
        instructionsTranslations: { vi: "<p>Công thức: S + V2/ed</p>" },
        updatedAt: new Date(),
      } as any);

      const success = await saveLessonGrammarContent(
        "past-simple",
        "<p>Formula: S + V2/ed</p>",
        { vi: "<p>Công thức: S + V2/ed</p>" }
      );

      expect(success).toBe(true);
      expect(prisma.grammarLesson.upsert).toHaveBeenCalledWith({
        where: { id: "past-simple" },
        update: {
          instructions: "<p>Formula: S + V2/ed</p>",
          instructionsTranslations: { vi: "<p>Công thức: S + V2/ed</p>" },
        },
        create: {
          id: "past-simple",
          instructions: "<p>Formula: S + V2/ed</p>",
          instructionsTranslations: { vi: "<p>Công thức: S + V2/ed</p>" },
        },
      });
    });

    it("should catch errors and return false if database upsert fails", async () => {
      vi.mocked(prisma.grammarLesson.upsert).mockRejectedValueOnce(new Error("Database connection error"));

      const success = await saveLessonGrammarContent(
        "past-simple",
        "<p>Content</p>"
      );

      expect(success).toBe(false);
    });
  });

  describe("getLessonExercises", () => {
    it("should fetch and parse assignments linked to the grammar topic and lesson", async () => {
      const mockAssignments = [
        {
          id: "assign-1",
          slug: "present-simple-quiz-1",
          title: "Present Simple Quiz 1",
          materialType: "EXERCISE",
          status: "PUBLIC",
          createdAt: new Date("2026-01-01"),
          instructions: null,
          questions: [
            { questionText: "He ___ to school every day.", answer: "goes" },
            { questionText: "They ___ soccer on weekends.", answer: "play" },
          ],
          teacher: { name: "Teacher Alice" },
        },
        {
          id: "assign-2",
          slug: "present-simple-quiz-2",
          title: "Present Simple Quiz 2",
          materialType: "EXERCISE",
          status: "PUBLIC",
          createdAt: new Date("2026-01-02"),
          instructions: null,
          questions: {
            items: [
              { questionText: "She ___ English well." },
              { questionText: "We ___ in London." },
              { questionText: "It ___ a lot in summer." },
            ],
          },
          teacher: null,
        },
        {
          id: "assign-3",
          slug: "present-simple-quiz-3",
          title: "Present Simple Quiz 3",
          materialType: "EXERCISE",
          status: "PUBLIC",
          createdAt: new Date("2026-01-03"),
          instructions: null,
          questions: {
            questions: [
              { questionText: "Do you like chocolate?" },
            ],
          },
          teacher: { name: "Teacher Bob" },
        },
      ];

      vi.mocked(prisma.assignment.findMany).mockResolvedValueOnce(mockAssignments as any);

      const exercises = await getLessonExercises("a1", "tenses", "present-simple");

      expect(prisma.assignment.findMany).toHaveBeenCalledWith({
        where: {
          grammarTopic: "tenses",
          grammarLesson: "present-simple",
          deletedAt: null,
        },
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });

      expect(exercises).toHaveLength(3);
      expect(exercises[0].questionCount).toBe(2);
      expect(exercises[0].teacherName).toBe("Teacher Alice");

      expect(exercises[1].questionCount).toBe(3);
      expect(exercises[1].teacherName).toBeNull();

      expect(exercises[2].questionCount).toBe(1);
      expect(exercises[2].teacherName).toBe("Teacher Bob");
    });

    it("should handle questions as null or unrecognized object", async () => {
      const mockAssignments = [
        {
          id: "assign-empty",
          slug: "empty-exercise",
          title: "Empty Exercise",
          materialType: "EXERCISE",
          status: "PUBLIC",
          createdAt: new Date(),
          instructions: null,
          questions: null,
          teacher: null,
        },
      ];

      vi.mocked(prisma.assignment.findMany).mockResolvedValueOnce(mockAssignments as any);

      const exercises = await getLessonExercises("a1", "tenses", "present-simple");
      expect(exercises[0].questionCount).toBe(0);
    });

    it("should return empty array when database call fails", async () => {
      vi.mocked(prisma.assignment.findMany).mockRejectedValueOnce(new Error("DB Failure"));

      const exercises = await getLessonExercises("a1", "tenses", "present-simple");
      expect(exercises).toEqual([]);
    });
  });
});
