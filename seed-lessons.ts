import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Starting lesson seeding...");

  // 1. Find or create a teacher
  let teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  if (!teacher) {
    teacher = await prisma.user.create({
      data: {
        name: "Teacher Nam",
        email: "nam.teacher@example.com",
        role: "TEACHER"
      }
    });
    console.log("Created Teacher Nam");
  }

  // 2. Find the current student (Ngoc) or first student
  let student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  if (!student) {
    student = await prisma.user.create({
      data: {
        name: "Ngoc",
        email: "ngoc.student@example.com",
        role: "STUDENT"
      }
    });
    console.log("Created Student Ngoc");
  }

  // 3. Ensure enrollment in a class taught by Teacher Nam
  let cls = await prisma.class.findFirst({ where: { teacherId: teacher.id } });
  if (!cls) {
    cls = await prisma.class.create({
      data: {
        name: "Physics Honors",
        teacherId: teacher.id,
        joinCode: "PHYS101"
      }
    });
    console.log("Created Physics Honors class");
  }

  const enrollment = await prisma.classEnrollment.findUnique({
    where: { studentId_classId: { studentId: student.id, classId: cls.id } }
  });

  if (!enrollment) {
    await prisma.classEnrollment.create({
      data: { studentId: student.id, classId: cls.id }
    });
    console.log(`Enrolled ${student.name} into ${cls.name}`);
  }

  // 4. Create "Assigned" Lessons (from Teacher Nam)
  await prisma.lesson.create({
    data: {
      title: "Cơ học lượng tử - Bài 1: Lưỡng tính sóng hạt",
      description: "Tìm hiểu về thí nghiệm khe đôi và bản chất của ánh sáng trong vật lý hiện đại.",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      teacherId: teacher.id,
      isPremium: true,
      viewsCount: 125,
      isEditorChoice: true
    }
  });

  await prisma.lesson.create({
    data: {
      title: "Ôn tập giữa kỳ: Điện từ trường",
      description: "Tổng hợp các công thức quan trọng và bài tập vận dụng về định luật Faraday và Maxwell.",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      teacherId: teacher.id,
      isPremium: false,
      viewsCount: 89
    }
  });

  // 5. Create "Public/Free" Lessons (from a different teacher)
  const strangerTeacher = await prisma.user.create({
    data: {
      name: "Global Educator",
      email: `edu_${Date.now()}@global.com`,
      role: "TEACHER"
    }
  });

  await prisma.lesson.create({
    data: {
      title: "English for Travel: Airport & Hotel",
      description: "Essential phrases for your next international trip. Easy and fun!",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      teacherId: strangerTeacher.id,
      isPremium: false,
      viewsCount: 1250,
      isEditorChoice: true
    }
  });

  await prisma.lesson.create({
    data: {
      title: "Lập trình Python căn bản",
      description: "Dành cho người mới bắt đầu: Biến, kiểu dữ liệu và cấu trúc điều khiển.",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      teacherId: strangerTeacher.id,
      isPremium: false,
      viewsCount: 3400
    }
  });

  console.log("Seeded 4 lessons for testing.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
