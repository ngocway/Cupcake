import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const teacherEmail = 'teacher@example.com'
  let teacher = await prisma.user.findUnique({ where: { email: teacherEmail } })
  
  if (!teacher) {
    const password = await bcrypt.hash('123456abc', 10)
    teacher = await prisma.user.create({
      data: {
        email: teacherEmail,
        name: 'Teacher Demo',
        password,
        role: 'TEACHER',
      }
    })
    console.log('Created teacher@example.com');
  } else {
    console.log('Found teacher@example.com');
  }

  // Create 5 classes
  const classes = [];
  const suffix = Math.floor(Math.random() * 10000); // make it random to avoid unique constraint if re-run

  for (let i = 1; i <= 5; i++) {
    const classCode = `ENG10-${suffix}-0${i}`;
    const newClass = await prisma.class.upsert({
      where: { classCode: classCode },
      update: {},
      create: {
        name: `Lớp tiếng Anh 10 - Nhóm ${i} (Demo)`,
        description: `Lớp học mẫu số ${i} dùng để demo hệ thống.`,
        gradeLevel: 'Grade 10',
        classCode: classCode,
        joinCode: `J-${suffix}-${i}`,
        teacherId: teacher.id
      }
    });
    classes.push(newClass);
    console.log(`Created class ${newClass.name}`);

    // Create 20 students per class
    // Doing it sequentially so it isn't too many db connections at once
    for (let j = 1; j <= 20; j++) {
      const studentEmail = `student_${suffix}_${i}_${j}@example.com`;
      const student = await prisma.user.upsert({
        where: { email: studentEmail },
        update: {},
        create: {
          email: studentEmail,
          name: `Học sinh ${j} (Nhóm ${i})`,
          password: await bcrypt.hash('student123', 10),
          role: 'STUDENT',
        }
      });
      
      // Assign student to class
      await prisma.classEnrollment.upsert({
        where: { studentId_classId: { studentId: student.id, classId: newClass.id } },
        update: {},
        create: {
          studentId: student.id,
          classId: newClass.id,
          nickname: `HV ${j}`,
          status: 'ACTIVE'
        }
      });
    }
  }

  console.log("Created 100 students (20 per class) successfully.")

  // Create 10 assignments
  for (let a = 1; a <= 10; a++) {
    // Generate some random dates for due date so it looks nice on UI
    const assignedAt = new Date();
    assignedAt.setDate(assignedAt.getDate() - Math.floor(Math.random() * 5));
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 10) + 1);

    const assignment = await prisma.assignment.create({
      data: {
        title: `Bài tập rèn luyện ${a}: Ngữ pháp và Từ vựng (Demo)`,
        status: 'PUBLIC',
        materialType: 'EXERCISE',
        teacherId: teacher.id,
        defaultPoints: 1.0,
        gradeLevel: 'Grade 10',
        subject: 'English',
        themeColor: ['#00adef', '#ff5722', '#4caf50', '#9c27b0', '#ff9800'][a%5],
        isAiGenerated: false
      }
    });

    // Create 10 questions for this assignment
    for (let q = 1; q <= 10; q++) {
      const questionContent = {
        questionText: `Câu số ${q}: Hãy chọn phương án đúng nhất để hoàn thành câu dưới đây?`,
        allowMultipleAnswers: false,
        options: [
          { id: `opt_${q}_1`, text: 'Đáp án A (Đúng)', isCorrect: true },
          { id: `opt_${q}_2`, text: 'Đáp án B', isCorrect: false },
          { id: `opt_${q}_3`, text: 'Đáp án C', isCorrect: false },
          { id: `opt_${q}_4`, text: 'Đáp án D', isCorrect: false },
        ]
      };

      await prisma.question.create({
        data: {
          assignmentId: assignment.id,
          type: 'MULTIPLE_CHOICE',
          orderIndex: q,
          points: 1,
          content: JSON.stringify(questionContent),
          explanation: 'Đây là giải thích chi tiết cho câu trả lời A giúp học sinh dễ dàng hiểu bài hơn.'
        }
      });
    }

    // Assign this assignment to all 5 classes
    for (const cls of classes) {
      await prisma.assignmentClass.create({
        data: {
          assignmentId: assignment.id,
          classId: cls.id,
        }
      });
    }

    console.log(`Created assignment ${assignment.title} with 10 questions mapped to 5 classes.`);
  }

  console.log("Demo data generation complete!");
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
