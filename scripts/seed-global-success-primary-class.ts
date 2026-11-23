import "dotenv/config";
import prisma from "../src/lib/prisma";

async function main() {
  // Reuse the same official Dolcake teacherId as tiny-vocab-wonders
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
      throw new Error("No teacher user found to own global-success-primary class");
    }
    teacherId = anyTeacher.id;
  }

  const cls = await prisma.class.upsert({
    where: { id: "global-success-primary" },
    update: {
      name: "Global Success Tiểu học: Hành Trình Đảo Tiếng Anh (Lớp 1–5)",
      description:
        "Lớp học tương tác miễn phí bám sát 100% sách giáo khoa Tiếng Anh Global Success Lớp 1–5 (92 Units). Khám phá bản đồ đảo 3D với 5 trạm học & chơi mỗi Unit: Từ vựng, Hội thoại, Ngữ pháp có loa bản xứ, Game phản xạ và Kiểm tra tổng hợp.",
      gradeLevel: "Tiểu học (Lớp 1–5)",
      thumbnail: "/assests/Classes/thumbnails/class-thumb-vocab-45-days.png",
      classCode: "GLOBAL15",
      joinCode: "GLOBAL15",
      isJoinable: true,
      autoApprove: true,
      dailyDripUnlock: false,
      deletedAt: null,
      isBlocked: false,
    },
    create: {
      id: "global-success-primary",
      name: "Global Success Tiểu học: Hành Trình Đảo Tiếng Anh (Lớp 1–5)",
      description:
        "Lớp học tương tác miễn phí bám sát 100% sách giáo khoa Tiếng Anh Global Success Lớp 1–5 (92 Units). Khám phá bản đồ đảo 3D với 5 trạm học & chơi mỗi Unit: Từ vựng, Hội thoại, Ngữ pháp có loa bản xứ, Game phản xạ và Kiểm tra tổng hợp.",
      gradeLevel: "Tiểu học (Lớp 1–5)",
      thumbnail: "/assests/Classes/thumbnails/class-thumb-vocab-45-days.png",
      classCode: "GLOBAL15",
      joinCode: "GLOBAL15",
      isJoinable: true,
      autoApprove: true,
      dailyDripUnlock: false,
      teacherId,
    },
  });

  console.log("Upserted Class:", cls.id, "| joinCode:", cls.joinCode, "| name:", cls.name);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
