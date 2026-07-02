import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const book = await prisma.readAlongBook.findUnique({
      where: { id },
      include: {
        slides: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, book });
  } catch (error: any) {
    console.error("[ReadAlong Detail API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: bookId } = await params;
    const { slideId, text } = await req.json();

    if (!slideId || text === undefined) {
      return NextResponse.json({ error: "slideId and text are required" }, { status: 400 });
    }

    const slide = await prisma.readAlongSlide.findFirst({
      where: { id: slideId, bookId },
    });

    if (!slide) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    const updated = await prisma.readAlongSlide.update({
      where: { id: slideId },
      data: { text },
    });

    return NextResponse.json({ success: true, slide: updated });
  } catch (error: any) {
    console.error("[ReadAlong Slide Update API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Cascade delete automatically handles removing ReadAlongSlide records
    await prisma.readAlongBook.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[ReadAlong Delete API] Error:", error);
    return NextResponse.json({ error: error.message || "Không thể xóa sách khỏi cơ sở dữ liệu." }, { status: 500 });
  }
}
