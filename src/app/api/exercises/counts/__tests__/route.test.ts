import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    assignment: {
      groupBy: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { GET } from "../route";

describe("Grammar Exercise Counts API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should aggregate exercise counts by grammarTopic and lowercase level", async () => {
    vi.mocked(prisma.assignment.groupBy).mockResolvedValueOnce([
      { grammarTopic: "tenses", level: "a1", _count: { id: 5 } },
      { grammarTopic: "tenses", level: "A1", _count: { id: 3 } }, // should merge with lowercase a1
      { grammarTopic: "nouns", level: "a2", _count: { id: 4 } },
      { grammarTopic: null, level: "a1", _count: { id: 2 } }, // should skip
      { grammarTopic: "pronouns", level: null, _count: { id: 1 } }, // should skip
    ] as any);

    const response = await GET();
    const data = await response.json();

    expect(prisma.assignment.groupBy).toHaveBeenCalledWith({
      by: ["grammarTopic", "level"],
      where: {
        materialType: "EXERCISE",
        status: "PUBLIC",
        deletedAt: null,
        grammarTopic: { not: null },
        level: { not: null },
      },
      _count: { id: true },
    });

    expect(data).toEqual({
      tenses_a1: 8,
      nouns_a2: 4,
    });
  });

  it("should return empty object if no matching assignments found", async () => {
    vi.mocked(prisma.assignment.groupBy).mockResolvedValueOnce([]);

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({});
  });
});
