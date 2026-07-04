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
    const body = await req.json();

    // --- Toggle book status: { status: "DRAFT" | "PUBLISHED" } ---
    if (body.status !== undefined) {
      if (body.status !== "DRAFT" && body.status !== "PUBLISHED") {
        return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
      }
      const updated = await prisma.readAlongBook.update({
        where: { id: bookId },
        data: { status: body.status },
      });
      return NextResponse.json({ success: true, book: updated });
    }

    // --- Reorder slides: { order: string[] } ---
    if (body.order && Array.isArray(body.order)) {
      const order: string[] = body.order;
      await prisma.$transaction(
        order.map((slideId, index) =>
          prisma.readAlongSlide.update({
            where: { id: slideId, bookId },
            data: { orderIndex: index },
          })
        )
      );
      return NextResponse.json({ success: true });
    }

    // --- Update slide text: { slideId, text } ---
    const { slideId, text } = body;
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
    const body = await req.json();
    const { slideId } = body;

    // ── CREATE EMPTY SLIDE at end (no slideId provided) ──
    if (!slideId) {
      const lastSlide = await prisma.readAlongSlide.findFirst({
        where: { bookId },
        orderBy: { orderIndex: "desc" },
      });
      const nextIndex = lastSlide ? lastSlide.orderIndex + 1 : 0;
      const slideNumber = String(nextIndex + 1).padStart(2, "0");

      const newSlide = await prisma.readAlongSlide.create({
        data: {
          bookId,
          slideNumber,
          imageName: null,
          imageUrl: null,
          text: "",
          audioUrl: null,
          orderIndex: nextIndex,
        },
      });
      return NextResponse.json({ success: true, slide: newSlide });
    }

    // ── CLONE SLIDE (slideId provided) ──
    const original = await prisma.readAlongSlide.findFirst({
      where: { id: slideId, bookId },
    });

    if (!original) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    const insertAtIndex = original.orderIndex + 1;

    const newSlide = await prisma.$transaction(async (tx) => {
      await tx.readAlongSlide.updateMany({
        where: { bookId, orderIndex: { gte: insertAtIndex } },
        data: { orderIndex: { increment: 1 } },
      });

      const cloned = await tx.readAlongSlide.create({
        data: {
          bookId,
          slideNumber: `copy-${crypto.randomUUID().slice(0, 8)}`,
          imageName: original.imageName,
          imageUrl: original.imageUrl,
          text: original.text,
          audioUrl: null,
          orderIndex: insertAtIndex,
        },
      });

      return cloned;
    });

    return NextResponse.json({ success: true, slide: newSlide });
  } catch (error: any) {
    console.error("[ReadAlong Clone Slide API] Error:", error);
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
