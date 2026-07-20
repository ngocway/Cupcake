import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { path } = await req.json();
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

    const session = await auth();
    const userId = session?.user?.id || null;

    const ip = req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");
    const userAgent = req.headers.get("user-agent") || "";

    await prisma.pageViewLog.create({
      data: {
        path,
        userId,
        ipHash,
        userAgent,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to track page view:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
