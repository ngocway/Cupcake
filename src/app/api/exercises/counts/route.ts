import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const revalidate = 300; // cache 5 minutes

/**
 * GET /api/exercises/counts
 * Returns exercise counts grouped by topic+level.
 * Response: { "tenses_a1": 5, "tenses_a2": 3, ... }
 */
export async function GET() {
  const rows = await prisma.assignment.groupBy({
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

  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (!row.grammarTopic || !row.level) continue;
    // Normalize level to lowercase
    const lvl = row.level.toLowerCase();
    const key = `${row.grammarTopic}_${lvl}`;
    counts[key] = (counts[key] ?? 0) + row._count.id;
  }

  return NextResponse.json(counts);
}
