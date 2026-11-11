import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

// Secret key to prevent unauthorized cache busting
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || "dolcake-revalidate-2026";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tags = [
    "global-success-all",
    "global-success-counts",
    "global-success-grade-1",
    "global-success-grade-2",
    "global-success-grade-3",
    "global-success-grade-4",
    "global-success-grade-5",
    "global-success-grade-6",
    "global-success-grade-7",
    "global-success-grade-8",
    "global-success-grade-9",
    "global-success-grade-10",
    "global-success-grade-11",
    "global-success-grade-12",
  ];

  for (const tag of tags) {
    revalidateTag(tag);
  }

  return NextResponse.json({
    success: true,
    message: `Revalidated ${tags.length} cache tags`,
    tags,
    timestamp: new Date().toISOString(),
  });
}

