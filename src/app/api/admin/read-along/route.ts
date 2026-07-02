import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { uploadBufferToR2 } from "@/actions/upload-actions";
import { toSlug } from "@/lib/slugify";

export const maxDuration = 60; // Allow up to 60s for bulk image uploads and R2 transfers

interface ParsedSlide {
  slideNumber: string;
  imageName: string;
  text: string;
}

function parseMarkdownSlides(mdContent: string): ParsedSlide[] {
  const slides: ParsedSlide[] = [];
  // Split the file using slide headers "## Slide <number>"
  const slideBlocks = mdContent.split(/##\s*Slide\s+/i);
  
  // Skip the first block as it contains the main document header/title
  for (let i = 1; i < slideBlocks.length; i++) {
    const block = slideBlocks[i];
    const lines = block.split("\n");
    const slideNumber = lines[0].trim();
    
    let imageName = "";
    let text = "";
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("- Image:")) {
        imageName = trimmedLine.replace("- Image:", "").trim();
      } else if (trimmedLine.startsWith("- Text:")) {
        text = trimmedLine.replace("- Text:", "").trim();
      }
    }
    
    if (slideNumber && imageName) {
      slides.push({
        slideNumber,
        imageName,
        text
      });
    }
  }
  return slides;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const books = await prisma.readAlongBook.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { slides: true }
        }
      }
    });

    return NextResponse.json({ success: true, books });
  } catch (error: any) {
    console.error("[ReadAlong List API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const mdFile = formData.get("mdFile") as File | null;
    const imageFiles = formData.getAll("images") as File[];

    if (!title || !mdFile) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ Tiêu đề và chọn File Markdown (.md)." }, { status: 400 });
    }

    // Generate bookId slug automatically from the title
    const bookId = toSlug(title);
    if (!bookId) {
      return NextResponse.json({ error: "Tiêu đề sách không hợp lệ để tự sinh mã định danh (Slug)." }, { status: 400 });
    }

    // Read and parse markdown content
    const mdText = await mdFile.text();
    const parsedSlides = parseMarkdownSlides(mdText);

    if (parsedSlides.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy trang Slide hợp lệ nào trong file Markdown. Vui lòng kiểm tra lại cấu trúc file." }, { status: 400 });
    }

    // Map uploaded images by filename
    const imageMap = new Map<string, File>();
    for (const file of imageFiles) {
      imageMap.set(file.name, file);
    }

    // Validate that all slides defined in MD have corresponding uploaded images
    const missingImages: string[] = [];
    for (const slide of parsedSlides) {
      if (!imageMap.has(slide.imageName)) {
        missingImages.push(slide.imageName);
      }
    }

    if (missingImages.length > 0) {
      return NextResponse.json({
        error: "Validation Failed: Một số hình ảnh được định nghĩa trong file .md nhưng chưa được upload.",
        missingImages
      }, { status: 400 });
    }

    // Upload files to R2 in sequence
    const slidesToCreate: {
      slideNumber: string;
      imageName: string;
      imageUrl: string;
      text: string;
      orderIndex: number;
    }[] = [];

    for (let i = 0; i < parsedSlides.length; i++) {
      const slide = parsedSlides[i];
      const file = imageMap.get(slide.imageName)!;
      const buffer = Buffer.from(await file.arrayBuffer());
      
      const contentType = file.type || "image/webp";
      const fileName = `read-along/${bookId}/${slide.imageName}`;
      
      // Upload to Cloudflare R2
      const imageUrl = await uploadBufferToR2(buffer, fileName, contentType);
      
      slidesToCreate.push({
        slideNumber: slide.slideNumber,
        imageName: slide.imageName,
        imageUrl,
        text: slide.text,
        orderIndex: i
      });
    }

    // Save transaction in database
    const book = await prisma.$transaction(async (tx) => {
      const existingBook = await tx.readAlongBook.findUnique({
        where: { bookId }
      });

      if (existingBook) {
        // Cascade delete existing slides to write the updated ones
        await tx.readAlongSlide.deleteMany({
          where: { bookId: existingBook.id }
        });

        return await tx.readAlongBook.update({
          where: { bookId },
          data: {
            title,
            mdContent: mdText,
            slides: {
              create: slidesToCreate
            }
          }
        });
      } else {
        return await tx.readAlongBook.create({
          data: {
            bookId,
            title,
            mdContent: mdText,
            slides: {
              create: slidesToCreate
            }
          }
        });
      }
    });

    return NextResponse.json({ success: true, book });
  } catch (error: any) {
    console.error("[ReadAlong POST API] Error:", error);
    return NextResponse.json({ error: error.message || "Đã xảy ra lỗi hệ thống khi xử lý upload." }, { status: 500 });
  }
}
