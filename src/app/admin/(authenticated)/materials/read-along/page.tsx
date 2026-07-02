import prisma from "@/lib/prisma";
import ReadAlongListClient from "./ReadAlongListClient";

export const dynamic = "force-dynamic";

export default async function ReadAlongPage() {
  const books = await prisma.readAlongBook.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      slides: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Quản lý Sách Read-Along</h1>
        <p className="text-neutral-400 text-sm">
          Tải lên, cấu hình và quản lý kho sách đọc cùng bé với công nghệ AI tự động chấm điểm phát âm từng từ.
        </p>
      </div>

      <ReadAlongListClient initialBooks={books} />
    </div>
  );
}
