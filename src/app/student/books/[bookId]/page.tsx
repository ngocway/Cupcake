import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import BookReaderClient from "./BookReaderClient";

export const dynamic = "force-dynamic";

export default async function StudentBookReaderPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;

  const book = await prisma.readAlongBook.findUnique({
    where: { bookId },
    include: {
      slides: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!book) {
    notFound();
  }

  const formattedBook = {
    id: book.id,
    bookId: book.bookId,
    title: book.title,
    slides: book.slides.map((s) => ({
      id: s.id,
      slideNumber: s.slideNumber,
      imageUrl: s.imageUrl,
      imageName: s.imageName,
      text: s.text,
      audioUrl: s.audioUrl ?? null,
      orderIndex: s.orderIndex,
    })),
  };

  return <BookReaderClient book={formattedBook} />;
}
