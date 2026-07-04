import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { uploadBufferToR2 } from "@/actions/upload-actions";
import { toSlug } from "@/lib/slugify";

export const maxDuration = 60;

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Parse readingText HTML and extract sentence groups with their audio URLs.
 * Each group ends at an inline-audio-marker span.
 * Returns an array of { text, audioUrl } objects.
 */
function parseReadingTextSegments(html: string): { text: string; audioUrl: string }[] {
  // Split on inline-audio-marker spans, capturing the data-audio-url
  // Pattern: anything up to the marker span → that's the text for this page
  const markerRegex = /<span[^>]+class="[^"]*inline-audio-marker[^"]*"[^>]+data-audio-url="([^"]+)"[^>]*>.*?<\/span>/gi;

  const segments: { text: string; audioUrl: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = markerRegex.exec(html)) !== null) {
    const segmentHtml = html.slice(lastIndex, match.index);
    const audioUrl = match[1];
    // Strip HTML tags to get plain text
    const plainText = segmentHtml
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();

    if (plainText && audioUrl) {
      segments.push({ text: plainText, audioUrl });
    }
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last marker (no audio)
  if (lastIndex < html.length) {
    const remainingHtml = html.slice(lastIndex);
    const plainText = remainingHtml
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (plainText) {
      segments.push({ text: plainText, audioUrl: "" });
    }
  }

  return segments;
}

/**
 * Generate a unique bookId slug, appending a counter if needed.
 */
async function generateUniqueBookId(baseSlug: string): Promise<string> {
  let candidate = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await prisma.readAlongBook.findUnique({ where: { bookId: candidate } });
    if (!existing) return candidate;
    candidate = `${baseSlug}-${counter++}`;
  }
}

// ─────────────────────────────────────────────────────────────
//  GET — list all books
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const books = await prisma.readAlongBook.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { slides: true } }
      }
    });
    return NextResponse.json({ success: true, books });
  } catch (error: any) {
    console.error("[ReadAlong List API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
//  POST — create book (method: "lesson" | "images")
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    // Both methods use FormData
    const formData = await req.formData();
    const method = formData.get("method") as string | null;

    // ── METHOD: lesson ──────────────────────────────────────
    if (method === "lesson") {
      const lessonId = formData.get("lessonId") as string;
      if (!lessonId) {
        return NextResponse.json({ error: "lessonId is required." }, { status: 400 });
      }

      // Fetch via Assignment (which holds readingText & audio markers)
      const assignment = await prisma.assignment.findFirst({
        where: {
          lesson: { id: lessonId },
          deletedAt: null,
        },
        select: {
          readingText: true,
          lesson: { select: { id: true, title: true } }
        }
      });

      if (!assignment?.lesson) {
        return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
      }
      if (!assignment.readingText) {
        return NextResponse.json({ error: "Lesson has no reading text with audio segments." }, { status: 400 });
      }

      const segments = parseReadingTextSegments(assignment.readingText);
      if (segments.length === 0) {
        return NextResponse.json({ error: "No audio segments found in lesson." }, { status: 400 });
      }

      const title = assignment.lesson.title;
      const baseSlug = toSlug(title);
      if (!baseSlug) {
        return NextResponse.json({ error: "Cannot generate slug from lesson title." }, { status: 400 });
      }
      const bookId = await generateUniqueBookId(baseSlug);

      // Build slides — copy text + audioUrl, no image yet
      const slidesToCreate = segments.map((seg, i) => ({
        slideNumber: String(i + 1).padStart(2, "0"),
        imageName: null,
        imageUrl: null,
        text: seg.text,
        audioUrl: seg.audioUrl || null,
        orderIndex: i,
      }));

      const book = await prisma.readAlongBook.create({
        data: {
          bookId,
          title,
          mdContent: "",
          slides: { create: slidesToCreate }
        }
      });

      return NextResponse.json({ success: true, book });
    }

    // ── METHOD: images ──────────────────────────────────────
    if (method === "images") {
      const title = (formData.get("title") as string)?.trim();
      if (!title) {
        return NextResponse.json({ error: "Title is required." }, { status: 400 });
      }

      const imageFiles = formData.getAll("images") as File[];
      if (imageFiles.length === 0) {
        return NextResponse.json({ error: "At least one image is required." }, { status: 400 });
      }

      const baseSlug = toSlug(title);
      if (!baseSlug) {
        return NextResponse.json({ error: "Invalid title for slug generation." }, { status: 400 });
      }
      const bookId = await generateUniqueBookId(baseSlug);

      // Upload all images to R2 in order
      const slidesToCreate: {
        slideNumber: string;
        imageName: string;
        imageUrl: string;
        text: string;
        audioUrl: null;
        orderIndex: number;
      }[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const buffer = Buffer.from(await file.arrayBuffer());
        const contentType = file.type || "image/jpeg";
        const ext = file.name.split(".").pop() || "jpg";
        const imageName = `slide_${String(i + 1).padStart(2, "0")}.${ext}`;
        const r2Path = `read-along/${bookId}/${imageName}`;
        const imageUrl = await uploadBufferToR2(buffer, r2Path, contentType);

        slidesToCreate.push({
          slideNumber: String(i + 1).padStart(2, "0"),
          imageName,
          imageUrl,
          text: "",
          audioUrl: null,
          orderIndex: i,
        });
      }

      const book = await prisma.readAlongBook.create({
        data: {
          bookId,
          title,
          mdContent: "",
          slides: { create: slidesToCreate }
        }
      });

      return NextResponse.json({ success: true, book });
    }

    return NextResponse.json({ error: "Invalid method. Use 'lesson' or 'images'." }, { status: 400 });

  } catch (error: any) {
    console.error("[ReadAlong POST API] Error:", error);
    return NextResponse.json({ error: error.message || "System error." }, { status: 500 });
  }
}
