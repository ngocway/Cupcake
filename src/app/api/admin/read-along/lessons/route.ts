import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { toSlug } from "@/lib/slugify";

/**
 * GET /api/admin/read-along/lessons
 * Returns all lessons that have readingText with audio segments.
 * Includes `hasBook: true` for lessons that already have a book created from them.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Fetch all existing book IDs to detect duplicates
    const existingBooks = await prisma.readAlongBook.findMany({
      select: { bookId: true }
    });
    const existingBookIds = new Set(existingBooks.map(b => b.bookId));

    // Query via Assignment (which holds readingText)
    const assignments = await prisma.assignment.findMany({
      where: {
        lesson: { isNot: null },
        readingText: { not: null },
        deletedAt: null,
      },
      select: {
        id: true,
        readingText: true,
        lesson: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            slug: true,
            deletedAt: true,
            isBlocked: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const lessonData = assignments
      .filter(a => a.lesson && !a.lesson.deletedAt && !a.lesson.isBlocked && a.readingText)
      .map(a => {
        const html = a.readingText!;
        const audioUrlMatches = html.match(/data-audio-url="[^"]+"/g) || [];
        const slug = toSlug(a.lesson!.title);
        // A book is considered "already created" if a book with matching slug exists
        const hasBook = slug ? existingBookIds.has(slug) : false;

        return {
          id: a.lesson!.id,
          title: a.lesson!.title,
          thumbnail: a.lesson!.thumbnail,
          slug: a.lesson!.slug,
          audioSegmentCount: audioUrlMatches.length,
          hasBook,
        };
      })
      .filter(l => l.audioSegmentCount > 0);

    return NextResponse.json({ success: true, lessons: lessonData });
  } catch (error: any) {
    console.error("[ReadAlong Lessons API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
