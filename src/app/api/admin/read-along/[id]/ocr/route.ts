import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const maxDuration = 60;

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
    const { slideId } = await req.json();

    if (!slideId) {
      return NextResponse.json({ error: "slideId is required" }, { status: 400 });
    }

    const slide = await prisma.readAlongSlide.findFirst({
      where: { id: slideId, bookId },
    });

    if (!slide) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    if (!slide.imageUrl) {
      return NextResponse.json({ error: "Slide ch\u01b0a c\u00f3 \u1ea3nh." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 500 });
    }

    // Fetch the image and convert to base64
    const imageRes = await fetch(slide.imageUrl);
    if (!imageRes.ok) {
      return NextResponse.json({ error: "Kh\u00f4ng th\u1ec3 t\u1ea3i \u1ea3nh \u0111\u1ec3 x\u1eed l\u00fd." }, { status: 500 });
    }
    const imageBuffer = await imageRes.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString("base64");
    const mimeType = imageRes.headers.get("content-type") || "image/png";

    // Call Gemini Vision to extract text
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inlineData: { mimeType, data: base64 } },
                { text: "This is a page from a children's storybook. Extract ALL visible text from this image exactly as it appears. Return ONLY the text content, with no explanations, labels, or commentary. If there is no text, return an empty string." },
              ],
            },
          ],
          generationConfig: { temperature: 0, maxOutputTokens: 512 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errData = await geminiRes.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Gemini API error: ${geminiRes.status}`);
    }

    const geminiData = await geminiRes.json();
    const extractedText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    // Save to DB
    await prisma.readAlongSlide.update({
      where: { id: slideId },
      data: { text: extractedText },
    });

    return NextResponse.json({ success: true, text: extractedText });
  } catch (error: any) {
    console.error("[ReadAlong OCR API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}