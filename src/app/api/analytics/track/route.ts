import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const rawText = await req.text();
    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ ok: true });
    }
    let body: any;
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ ok: true });
    }
    const { path, event, props } = body || {};

    const session = await auth();
    const userId = session?.user?.id || null;

    const ip = req.headers.get("x-forwarded-for") || (req as any).ip || "127.0.0.1";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");
    const userAgent = req.headers.get("user-agent") || "";

    // Case 1: Custom Student / User Interaction Event
    if (event && typeof event === "string") {
      const classId = props?.classId ? String(props.classId) : "global";
      const qs = new URLSearchParams();
      if (props && typeof props === "object") {
        for (const [k, v] of Object.entries(props)) {
          if (v !== undefined && v !== null && k !== "classId") {
            qs.set(k, String(v));
          }
        }
      }
      const queryStr = qs.toString();
      const eventPath = `/__event__/class/${encodeURIComponent(classId)}/${encodeURIComponent(event)}${queryStr ? `?${queryStr}` : ""}`;

      prisma.pageViewLog.create({
        data: {
          path: eventPath,
          userId,
          ipHash,
          userAgent,
        },
      }).catch((err) => {
        console.error("Failed to track custom event:", err);
      });

      return NextResponse.json({ ok: true });
    }

    // Case 2: Standard Page View
    if (!path) return NextResponse.json({ error: "Path required" }, { status: 400 });

    // Double check: Ignore assets and API paths
    const cleanPath = path.split("?")[0];
    if (
      cleanPath.startsWith("/api") ||
      cleanPath.startsWith("/_next") ||
      cleanPath.includes(".")
    ) {
      return NextResponse.json({ ok: true });
    }

    // Non-blocking fire-and-forget write to DB so response returns in <10ms
    prisma.pageViewLog.create({
      data: {
        path,
        userId,
        ipHash,
        userAgent,
      },
    }).catch((err) => {
      console.error("Failed to track page view:", err);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to track analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
