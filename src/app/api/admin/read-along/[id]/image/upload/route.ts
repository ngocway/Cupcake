import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { uploadBufferToR2 } from "@/actions/upload-actions";

export const maxDuration = 60;

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: bookId } = await params;
    const formData = await req.formData();
    const slideId = formData.get("slideId") as string;
    const isThumbnail = formData.get("isThumbnail") === "true";
    const file = formData.get("file") as File | null;

    if (!isThumbnail && !slideId) {
      return NextResponse.json({ error: "slideId or isThumbnail is required" }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ error: "Chỉ cho phép file ảnh (JPEG, PNG, WebP, GIF)." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "jpg";

    if (isThumbnail) {
      const imageName = `thumbnail-${Date.now()}.${ext}`;
      const r2Path = `read-along/${bookId}/${imageName}`;
      const imageUrl = await uploadBufferToR2(buffer, r2Path, file.type);

      await prisma.readAlongBook.update({
        where: { id: bookId },
        data: { thumbnailUrl: imageUrl },
      });

      return NextResponse.json({ success: true, imageUrl, imageName });
    }

    const slide = await prisma.readAlongSlide.findFirst({
      where: { id: slideId, bookId },
    });
    if (!slide) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    const imageName = `slide-${slideId}-${Date.now()}.${ext}`;
    const r2Path = `read-along/${bookId}/${imageName}`;
    const imageUrl = await uploadBufferToR2(buffer, r2Path, file.type);

    await prisma.readAlongSlide.update({
      where: { id: slideId },
      data: { imageUrl, imageName },
    });

    return NextResponse.json({ success: true, imageUrl, imageName });
  } catch (error: any) {
    console.error("[ReadAlong Image Upload] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}