import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock openai
vi.mock("@/lib/openai", () => ({
  default: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

import { detectGrammarFromTitle, generateTitleFromGrammar } from "../grammar-detect";
import openai from "@/lib/openai";

describe("Grammar Detection Actions", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("detectGrammarFromTitle", () => {
    it("should return null for empty or whitespace-only title", async () => {
      expect(await detectGrammarFromTitle("")).toBeNull();
      expect(await detectGrammarFromTitle("   ")).toBeNull();
    });

    it("should match lesson directly by lesson label (exact confidence)", async () => {
      const res = await detectGrammarFromTitle("Practice Present Simple Tense");
      expect(res).not.toBeNull();
      expect(res?.confidence).toBe("exact");
      expect(res?.grammarTopic).toBe("tenses");
      expect(res?.grammarLesson).toBe("present-simple");
      expect(res?.level).toBe("a1");
    });

    it("should match topic by English topic name when lesson not in title", async () => {
      const res = await detectGrammarFromTitle("Comprehensive Guide to Adjectives");
      expect(res).not.toBeNull();
      expect(res?.confidence).toBe("exact");
      expect(res?.grammarTopic).toBe("adjectives");
    });

    it("should match topic by Vietnamese topic name (exact confidence)", async () => {
      const res = await detectGrammarFromTitle("Bài tập về Các thì");
      expect(res).not.toBeNull();
      expect(res?.confidence).toBe("exact");
      expect(res?.grammarTopic).toBe("tenses");
    });

    it("should match common aliases like simple present to present-simple", async () => {
      const res = await detectGrammarFromTitle("Simple present tense quiz");
      expect(res).not.toBeNull();
      expect(res?.confidence).toBe("exact");
      expect(res?.grammarTopic).toBe("tenses");
      expect(res?.grammarLesson).toBe("present-simple");
    });

    it("should not falsely match common single words like both without grammar context", async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_API_KEY;

      const res = await detectGrammarFromTitle("Both dogs are brown");
      expect(res).toBeNull();
    });

    it("should fall back to Gemini AI when title does not match taxonomy strings", async () => {
      process.env.GEMINI_API_KEY = "mock-api-key";

      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    level: "b1",
                    grammarTopic: "conditionals",
                    grammarLesson: "second-conditional",
                  }),
                },
              ],
            },
          },
        ],
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });
      global.fetch = mockFetch;

      const res = await detectGrammarFromTitle("Hypothetical situations with unreal dreams");
      expect(res).not.toBeNull();
      expect(res?.confidence).toBe("ai");
      expect(res?.level).toBe("b1");
      expect(res?.grammarTopic).toBe("conditionals");
      expect(res?.grammarLesson).toBe("second-conditional");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should return null if Gemini API returns invalid or unparseable JSON", async () => {
      process.env.GEMINI_API_KEY = "mock-api-key";

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: "Sorry, I cannot classify this." }] } }] }),
      });

      const res = await detectGrammarFromTitle("Random title unrelated to English");
      expect(res).toBeNull();
    });

    it("should return null if Gemini API returns an invalid CEFR level", async () => {
      process.env.GEMINI_API_KEY = "mock-api-key";

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      level: "z9",
                      grammarTopic: "tenses",
                      grammarLesson: "present-simple",
                    }),
                  },
                ],
              },
            },
          ],
        }),
      });

      const res = await detectGrammarFromTitle("Unusual grammar query");
      expect(res).toBeNull();
    });

    it("should return null if Gemini API fails with HTTP error", async () => {
      process.env.GEMINI_API_KEY = "mock-api-key";

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const res = await detectGrammarFromTitle("Unusual grammar query");
      expect(res).toBeNull();
    });

    it("should return null if no Gemini API key is configured and string matching fails", async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_API_KEY;

      const res = await detectGrammarFromTitle("Random unknown title");
      expect(res).toBeNull();
    });
  });

  describe("generateTitleFromGrammar", () => {
    it("should return null if OPENAI_API_KEY is missing", async () => {
      delete process.env.OPENAI_API_KEY;

      const res = await generateTitleFromGrammar({
        level: "a1",
        grammarTopic: "tenses",
        grammarLesson: "present-simple",
      });

      expect(res).toBeNull();
    });

    it("should generate and return a trimmed sub-exercise title", async () => {
      process.env.OPENAI_API_KEY = "mock-openai-key";

      vi.mocked(openai.chat.completions.create).mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: '"Present Simple: Daily Routines"',
            },
          },
        ],
      } as any);

      const res = await generateTitleFromGrammar({
        level: "a1",
        grammarTopic: "tenses",
        grammarLesson: "present-simple",
      });

      expect(res).toBe("Present Simple: Daily Routines");
      expect(openai.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gpt-4o-mini",
        })
      );
    });

    it("should include excluded titles in the prompt to prevent duplicates", async () => {
      process.env.OPENAI_API_KEY = "mock-openai-key";

      vi.mocked(openai.chat.completions.create).mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "Present Simple: Third Person Singular",
            },
          },
        ],
      } as any);

      const res = await generateTitleFromGrammar({
        level: "a1",
        grammarTopic: "tenses",
        grammarLesson: "present-simple",
        exclude: ["Present Simple: Daily Routines", "Present Simple: Habits"],
      });

      expect(res).toBe("Present Simple: Third Person Singular");
      const callArg = vi.mocked(openai.chat.completions.create).mock.calls[0][0];
      const systemContent = callArg.messages[0].content as string;
      expect(systemContent).toContain('Do NOT use any of these already-used titles: "Present Simple: Daily Routines", "Present Simple: Habits"');
    });

    it("should handle OpenAI error gracefully and return null", async () => {
      process.env.OPENAI_API_KEY = "mock-openai-key";

      vi.mocked(openai.chat.completions.create).mockRejectedValueOnce(
        new Error("OpenAI API rate limit exceeded")
      );

      const res = await generateTitleFromGrammar({
        level: "a1",
        grammarTopic: "tenses",
        grammarLesson: "present-simple",
      });

      expect(res).toBeNull();
    });
  });
});
