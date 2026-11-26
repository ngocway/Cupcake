import "dotenv/config";
import prisma from "../src/lib/prisma";

async function main() {
  const vocabClass = await prisma.class.findUnique({
    where: { id: "tiny-vocab-wonders" },
    select: { teacherId: true },
  });

  let teacherId = vocabClass?.teacherId;
  if (!teacherId) {
    const anyTeacher = await prisma.user.findFirst({
      where: { role: { in: ["TEACHER", "ADMIN"] } },
      select: { id: true },
    });
    if (!anyTeacher) {
      throw new Error("No teacher user found to own phonics-45-days class");
    }
    teacherId = anyTeacher.id;
  }

  const cls = await prisma.class.upsert({
    where: { id: "phonics-45-days" },
    update: {
      name: "Bé Giỏi Phonics 45 Ngày: Làm Chủ Đánh Vần Tiếng Anh (45-Day Phonics Master)",
      description:
        "Hành trình 45 ngày làm chủ 45 họ vần CVC cốt lõi tiếng Anh cho bé Mầm non & Lớp 1 (4–8 tuổi) qua 4 trạm: Máy ghép vần tương tác, Thẻ từ hoạt hình, Game phản xạ và Truyện ngắn Decodable.",
      gradeLevel: "Mầm non & Lớp 1",
      thumbnail: "/assests/Classes/thumbnails/class-thumb-vocab-45-days.png",
      classCode: "PHONICS45",
      joinCode: "PHONICS45",
      isJoinable: true,
      autoApprove: true,
      dailyDripUnlock: false,
      deletedAt: null,
      isBlocked: false,
    },
    create: {
      id: "phonics-45-days",
      name: "Bé Giỏi Phonics 45 Ngày: Làm Chủ Đánh Vần Tiếng Anh (45-Day Phonics Master)",
      description:
        "Hành trình 45 ngày làm chủ 45 họ vần CVC cốt lõi tiếng Anh cho bé Mầm non & Lớp 1 (4–8 tuổi) qua 4 trạm: Máy ghép vần tương tác, Thẻ từ hoạt hình, Game phản xạ và Truyện ngắn Decodable.",
      gradeLevel: "Mầm non & Lớp 1",
      thumbnail: "/assests/Classes/thumbnails/class-thumb-vocab-45-days.png",
      classCode: "PHONICS45",
      joinCode: "PHONICS45",
      teacherId,
      isJoinable: true,
      autoApprove: true,
      dailyDripUnlock: false,
      deletedAt: null,
      isBlocked: false,
    },
  });

  console.log("Upserted phonics class successfully:", cls.id, cls.name);
}

main().finally(() => prisma.$disconnect());
