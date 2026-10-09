import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { optimizeAndUploadFirstValidToR2, optimizeAndUploadToR2 } from "@/lib/server-image-uploader";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { url, urls } = body;

    const candidateUrls: string[] = Array.isArray(urls)
      ? urls.filter((u): u is string => typeof u === "string" && Boolean(u.trim()))
      : typeof url === "string" && Boolean(url.trim())
      ? [url.trim()]
      : [];

    if (candidateUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid url/urls parameter" },
        { status: 400 }
      );
    }

    const subFolder = `uploads/${session.user.id}`;
    const optimizedUrl = await optimizeAndUploadFirstValidToR2(candidateUrls, subFolder);

    return NextResponse.json({
      success: true,
      url: optimizedUrl,
    });
  } catch (error: any) {
    console.error("[/api/upload/url-fast] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process image" },
      { status: 500 }
    );
  }
}
