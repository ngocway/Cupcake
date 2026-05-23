import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncToHomepageFeed } from "@/lib/feed-sync";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { lessonIds } = await req.json();

  if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
    return NextResponse.json({ error: "No lesson IDs provided" }, { status: 400 });
  }

  let synced = 0;
  for (const id of lessonIds) {
    try {
      await syncToHomepageFeed(id, "LESSON");
      synced++;
    } catch (err) {
      console.error(`[FeedSync API] Failed to sync lesson ${id}:`, err);
    }
  }

  return NextResponse.json({ success: true, synced });
}
