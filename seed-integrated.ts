import { PrismaClient, Role, MaterialStatus, MaterialType, QuestionType, MediaType } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Integrated Lesson...");

  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });

  if (!student || !teacher) return;

  // 1. Create Integrated Assignment
  const assignment = await prisma.assignment.create({
    data: {
      title: "Bài học về Hệ Mặt Trời (Integrated)",
      status: 'PUBLIC',
      materialType: 'READING',
      teacherId: teacher.id,
      readingText: `
        <h2>Khám phá Hệ Mặt Trời</h2>
        <p>Hệ Mặt Trời của chúng ta bao gồm Mặt Trời và tất cả các thiên thể quay quanh nó do lực hấp dẫn. Trong đó có 8 hành tinh chính: Sao Thủy, Sao Kim, Trái Đất, Sao Hỏa, Sao Mộc, Sao Thổ, Sao Thiên Vương và Sao Hải Vương.</p>
        <p><strong>Mặt Trời</strong> là ngôi sao ở trung tâm, cung cấp năng lượng cho sự sống trên Trái Đất thông qua quá trình quang hợp.</p>
        <p>Các hành tinh được chia thành hai nhóm: Hành tinh đất đá (như Trái Đất) và hành tinh khí khổng lồ (như Sao Mộc).</p>
      `,
      questions: {
        create: [
          {
            content: "Có bao nhiêu hành tinh chính trong Hệ Mặt Trời?",
            type: 'MULTIPLE_CHOICE',
            orderIndex: 0,
            points: 10,
          },
          {
            content: "Hành tinh nào được gọi là hành tinh đỏ?",
            type: 'MULTIPLE_CHOICE',
            orderIndex: 1,
            points: 10,
          }
        ]
      }
    }
  });

  // 2. Create Lesson and link to Assignment
  const lesson = await prisma.lesson.create({
    data: {
      title: "Thiên văn học cơ bản: Hệ Mặt Trời",
      description: "Học về các hành tinh và cấu trúc của Hệ Mặt Trời thông qua bài đọc và video.",
      videoUrl: "https://www.youtube.com/watch?v=libKVRa01L8",
      teacherId: teacher.id,
      assignmentId: assignment.id,
      isPremium: false,
      isEditorChoice: true
    }
  });

  console.log(`Seeded Integrated Lesson: ${lesson.title}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
