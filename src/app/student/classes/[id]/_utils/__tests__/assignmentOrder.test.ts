import { describe, it, expect } from "vitest";
import { getItemStage, sortGroupItems, STAGE_ROADMAP_ORDER } from "../assignmentOrder";

describe("Assignment Ordering & Stage Classification (Grammar Flow)", () => {
  describe("STAGE_ROADMAP_ORDER", () => {
    it("should place theory lessons first and exercises before games", () => {
      expect(STAGE_ROADMAP_ORDER.lesson).toBeLessThan(STAGE_ROADMAP_ORDER.flashcard);
      expect(STAGE_ROADMAP_ORDER.flashcard).toBeLessThan(STAGE_ROADMAP_ORDER.exercise);
      expect(STAGE_ROADMAP_ORDER.exercise).toBeLessThan(STAGE_ROADMAP_ORDER.reading);
      expect(STAGE_ROADMAP_ORDER.reading).toBeLessThan(STAGE_ROADMAP_ORDER.game);
      expect(STAGE_ROADMAP_ORDER.game).toBeLessThan(STAGE_ROADMAP_ORDER.review);
    });
  });

  describe("getItemStage", () => {
    it("should identify a grammar theory lesson by title prefix 'Grammar lesson:'", () => {
      const stage = getItemStage({
        assignment: {
          title: "Grammar lesson: Present Simple",
          materialType: "EXERCISE",
        },
      });
      expect(stage).toBe("lesson");
    });

    it("should identify a grammar theory lesson by title prefix 'Lý thuyết:'", () => {
      const stage = getItemStage({
        assignment: {
          title: "Lý thuyết: Câu điều kiện loại 1",
          materialType: "EXERCISE",
        },
      });
      expect(stage).toBe("lesson");
    });

    it("should identify a grammar lesson from playUrl in instructions JSON", () => {
      const stage = getItemStage({
        assignment: {
          title: "Past Continuous Theory",
          instructions: JSON.stringify({
            playUrl: "/grammar/tenses/past-continuous",
          }),
        },
      });
      expect(stage).toBe("lesson");
    });

    it("should classify materialType LESSON as stage 'lesson'", () => {
      const stage = getItemStage({
        assignment: {
          title: "Introduction to English Tenses",
          materialType: "LESSON",
        },
      });
      expect(stage).toBe("lesson");
    });

    it("should classify materialType GRAMMAR as stage 'exercise'", () => {
      const stage = getItemStage({
        assignment: {
          title: "Present Simple Practice Questions",
          materialType: "GRAMMAR",
        },
      });
      expect(stage).toBe("exercise");
    });

    it("should classify materialType EXERCISE as stage 'exercise'", () => {
      const stage = getItemStage({
        assignment: {
          title: "Multiple Choice Quiz",
          materialType: "EXERCISE",
        },
      });
      expect(stage).toBe("exercise");
    });

    it("should detect review items based on instructions metadata", () => {
      const stage = getItemStage({
        assignment: {
          title: "Grammar lesson: Review Tenses",
          instructions: JSON.stringify({
            section: "REVIEW",
          }),
        },
      });
      expect(stage).toBe("review");
    });
  });

  describe("sortGroupItems", () => {
    it("should sort items by educational stage: lesson -> flashcard -> exercise -> game", () => {
      const items = [
        {
          assignment: {
            title: "Tenses Candy Quiz",
            materialType: "GAME",
          },
        },
        {
          assignment: {
            title: "Present Simple Exercise",
            materialType: "EXERCISE",
          },
        },
        {
          assignment: {
            title: "Grammar lesson: Present Simple",
            materialType: "LESSON",
          },
        },
        {
          assignment: {
            title: "Key Verbs Flashcards",
            materialType: "FLASHCARD",
          },
        },
      ];

      const sorted = sortGroupItems(items);

      expect(sorted[0].assignment.title).toBe("Grammar lesson: Present Simple"); // Stage 1 (lesson)
      expect(sorted[1].assignment.title).toBe("Key Verbs Flashcards");          // Stage 2 (flashcard)
      expect(sorted[2].assignment.title).toBe("Present Simple Exercise");        // Stage 3 (exercise)
      expect(sorted[3].assignment.title).toBe("Tenses Candy Quiz");             // Stage 5 (game)
    });

    it("should secondary-sort by assignedAt date for items in the same stage", () => {
      const items = [
        {
          assignment: { title: "Exercise B", materialType: "EXERCISE" },
          assignedAt: "2026-02-10T10:00:00Z",
        },
        {
          assignment: { title: "Exercise A", materialType: "EXERCISE" },
          assignedAt: "2026-02-05T10:00:00Z",
        },
      ];

      const sorted = sortGroupItems(items);

      expect(sorted[0].assignment.title).toBe("Exercise A");
      expect(sorted[1].assignment.title).toBe("Exercise B");
    });

    it("should tertiary-sort alphabetically by title if stage and assignedAt match", () => {
      const items = [
        {
          assignment: { title: "Zebra Exercise", materialType: "EXERCISE" },
          assignedAt: "2026-02-01T00:00:00Z",
        },
        {
          assignment: { title: "Apple Exercise", materialType: "EXERCISE" },
          assignedAt: "2026-02-01T00:00:00Z",
        },
      ];

      const sorted = sortGroupItems(items);

      expect(sorted[0].assignment.title).toBe("Apple Exercise");
      expect(sorted[1].assignment.title).toBe("Zebra Exercise");
    });
  });
});
