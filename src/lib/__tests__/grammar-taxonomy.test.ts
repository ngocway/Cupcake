import { describe, it, expect } from "vitest";
import {
  CEFR_LEVELS,
  GRAMMAR_TOPICS,
  ALL_LESSONS_FLAT,
  getLevelConfig,
  getTopicById,
  getLessonsForTopicAndLevel,
  getTopicsForLevel,
  normalizeLevelId,
  LESSON_FORMULAS,
  getDbLevelVariants,
  type CefrLevel,
} from "../grammar-taxonomy";

describe("Grammar Taxonomy Utilities", () => {
  describe("CEFR_LEVELS", () => {
    it("should define the 5 standard CEFR levels in order", () => {
      expect(CEFR_LEVELS).toHaveLength(5);
      expect(CEFR_LEVELS.map((l) => l.id)).toEqual(["a1", "a2", "b1", "b2", "c1"]);
    });

    it("should have visual styling configurations for each level", () => {
      for (const lvl of CEFR_LEVELS) {
        expect(lvl.label).toBe(lvl.id.toUpperCase());
        expect(lvl.color).toMatch(/^text-/);
        expect(lvl.bg).toMatch(/^bg-/);
        expect(lvl.border).toMatch(/^border-/);
        expect(lvl.ring).toMatch(/^ring-/);
      }
    });
  });

  describe("GRAMMAR_TOPICS & ALL_LESSONS_FLAT", () => {
    it("should have unique topic IDs and valid fields", () => {
      const topicIds = new Set<string>();
      const validCefr: CefrLevel[] = ["a1", "a2", "b1", "b2", "c1"];

      for (const topic of GRAMMAR_TOPICS) {
        expect(topicIds.has(topic.id)).toBe(false);
        topicIds.add(topic.id);

        expect(topic.id).toBeTruthy();
        expect(topic.label).toBeTruthy();
        expect(topic.labelVi).toBeTruthy();
        expect(topic.icon).toBeTruthy();
        expect(topic.lessons.length).toBeGreaterThan(0);

        const lessonIds = new Set<string>();
        for (const lesson of topic.lessons) {
          expect(lessonIds.has(lesson.id)).toBe(false);
          lessonIds.add(lesson.id);
          expect(lesson.id).toBeTruthy();
          expect(lesson.label).toBeTruthy();
          expect(validCefr).toContain(lesson.level);
        }
      }
    });

    it("should flatten all lessons with topic metadata in ALL_LESSONS_FLAT", () => {
      const totalLessons = GRAMMAR_TOPICS.reduce((sum, t) => sum + t.lessons.length, 0);
      expect(ALL_LESSONS_FLAT).toHaveLength(totalLessons);

      const first = ALL_LESSONS_FLAT[0];
      expect(first).toHaveProperty("topicId");
      expect(first).toHaveProperty("topicLabel");
      expect(first).toHaveProperty("topicIcon");
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("label");
      expect(first).toHaveProperty("level");
    });
  });

  describe("getLevelConfig", () => {
    it("should return configuration for valid CEFR level", () => {
      const a1Config = getLevelConfig("a1");
      expect(a1Config).toBeDefined();
      expect(a1Config?.id).toBe("a1");
      expect(a1Config?.label).toBe("A1");
    });

    it("should handle case-insensitive level strings", () => {
      expect(getLevelConfig("B2")?.id).toBe("b2");
      expect(getLevelConfig("C1")?.id).toBe("c1");
    });

    it("should return undefined for invalid level", () => {
      expect(getLevelConfig("c2")).toBeUndefined();
      expect(getLevelConfig("unknown")).toBeUndefined();
    });
  });

  describe("getTopicById", () => {
    it("should find an existing topic by id", () => {
      const tenses = getTopicById("tenses");
      expect(tenses).toBeDefined();
      expect(tenses?.id).toBe("tenses");
      expect(tenses?.label).toBe("Tenses");
      expect(tenses?.labelVi).toBe("Các thì");
    });

    it("should return undefined for non-existent topic id", () => {
      expect(getTopicById("non-existent-topic")).toBeUndefined();
    });
  });

  describe("getLessonsForTopicAndLevel", () => {
    it("should filter lessons for a given topic and level", () => {
      const a1Tenses = getLessonsForTopicAndLevel("tenses", "a1");
      expect(a1Tenses.length).toBeGreaterThan(0);
      expect(a1Tenses.every((l) => l.level === "a1")).toBe(true);
      expect(a1Tenses.map((l) => l.id)).toContain("present-simple");
      expect(a1Tenses.map((l) => l.id)).toContain("present-continuous");
    });

    it("should return empty array for non-existent topic or level with no lessons", () => {
      expect(getLessonsForTopicAndLevel("unknown-topic", "a1")).toEqual([]);
      expect(getLessonsForTopicAndLevel("advanced-grammar", "a1")).toEqual([]);
    });
  });

  describe("getTopicsForLevel", () => {
    it("should return topics containing lessons at the specified level", () => {
      const c1Topics = getTopicsForLevel("c1");
      expect(c1Topics.length).toBeGreaterThan(0);
      expect(c1Topics.map((t) => t.id)).toContain("advanced-grammar");
      expect(c1Topics.map((t) => t.id)).toContain("tenses");

      for (const topic of c1Topics) {
        expect(topic.lessons.some((l) => l.level === "c1")).toBe(true);
      }
    });

    it("should return empty array if no topics match level", () => {
      expect(getTopicsForLevel("c2")).toEqual([]);
    });
  });

  describe("normalizeLevelId", () => {
    it("should normalize beginner/pre-a1 strings to a1", () => {
      expect(normalizeLevelId("pre-a1")).toBe("a1");
      expect(normalizeLevelId("pre-a1-a1")).toBe("a1");
      expect(normalizeLevelId("a1")).toBe("a1");
      expect(normalizeLevelId("PRE-A1")).toBe("a1");
    });

    it("should normalize elementary strings to a2", () => {
      expect(normalizeLevelId("a2")).toBe("a2");
      expect(normalizeLevelId("elementary")).toBe("a2");
      expect(normalizeLevelId("ELEMENTARY")).toBe("a2");
    });

    it("should normalize b1, b2, c1 levels", () => {
      expect(normalizeLevelId("b1")).toBe("b1");
      expect(normalizeLevelId("B1")).toBe("b1");
      expect(normalizeLevelId("b2")).toBe("b2");
      expect(normalizeLevelId("c1")).toBe("c1");
    });

    it("should handle comma-separated values by using the first token", () => {
      expect(normalizeLevelId("a2, elementary")).toBe("a2");
      expect(normalizeLevelId("pre-a1, a1")).toBe("a1");
    });

    it("should return null for invalid, empty, or undefined levels", () => {
      expect(normalizeLevelId(null)).toBeNull();
      expect(normalizeLevelId(undefined)).toBeNull();
      expect(normalizeLevelId("")).toBeNull();
      expect(normalizeLevelId("c2")).toBeNull();
      expect(normalizeLevelId("advanced-mastery")).toBeNull();
    });
  });

  describe("getDbLevelVariants", () => {
    it("should return all DB variations for A1 including pre-a1 and pre-a1-a1", () => {
      const a1Vars = getDbLevelVariants("a1");
      expect(a1Vars).toContain("a1");
      expect(a1Vars).toContain("A1");
      expect(a1Vars).toContain("pre-a1");
      expect(a1Vars).toContain("pre-a1-a1");
    });

    it("should return DB variations for A2 including elementary", () => {
      const a2Vars = getDbLevelVariants("a2");
      expect(a2Vars).toContain("a2");
      expect(a2Vars).toContain("A2");
      expect(a2Vars).toContain("elementary");
    });

    it("should return standard lower and uppercase for b1, b2, c1", () => {
      expect(getDbLevelVariants("b1")).toEqual(["b1", "B1"]);
      expect(getDbLevelVariants("b2")).toEqual(["b2", "B2"]);
      expect(getDbLevelVariants("c1")).toEqual(["c1", "C1"]);
    });
  });

  describe("LESSON_FORMULAS", () => {
    it("should provide formula strings for core grammar lessons", () => {
      expect(LESSON_FORMULAS["present-simple"]).toBe("S + V / V-s/es");
      expect(LESSON_FORMULAS["past-simple"]).toBe("S + V2 (did)");
      expect(LESSON_FORMULAS["present-perfect"]).toBe("S + have/has + V3");
      expect(LESSON_FORMULAS["zero-conditional"]).toContain("If + V");
    });
  });
});
