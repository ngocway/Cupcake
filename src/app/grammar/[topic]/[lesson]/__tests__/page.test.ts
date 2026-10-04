import { describe, it, expect, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    grammarLesson: { findUnique: vi.fn() },
    assignment: { findMany: vi.fn() },
  },
}));

import { generateMetadata } from "../page";

describe("Grammar Lesson Page Metadata", () => {
  it("should generate SEO metadata for a valid grammar topic and lesson", async () => {
    const params = Promise.resolve({
      topic: "tenses",
      lesson: "present-simple",
    });

    const metadata = await generateMetadata({ params });

    expect(metadata.title).toBe("Present Simple: Rules, Examples & Exercises");
    expect(metadata.description).toContain("Master the Present Simple with clear rules");
    expect(metadata.description).toContain("A1 practice exercises");
    expect(metadata.alternates?.canonical).toBe("/grammar/tenses/present-simple");
    expect(metadata.openGraph?.url).toBe("https://dolcake.com/grammar/tenses/present-simple");
    expect((metadata.openGraph as any)?.type).toBe("article");
  });

  it("should return fallback title when topic or lesson is invalid", async () => {
    const params = Promise.resolve({
      topic: "unknown-topic",
      lesson: "unknown-lesson",
    });

    const metadata = await generateMetadata({ params });

    expect(metadata.title).toBe("Grammar");
  });
});
