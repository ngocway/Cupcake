const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Update some public assignments with tags and counts
  const apps = await prisma.assignment.findMany({
    where: { status: 'PUBLIC' },
    take: 5
  });

  const sampleTags = ['English', 'Grammar', 'Exam', 'Beginner', 'Vocabulary'];

  for (let i = 0; i < apps.length; i++) {
    const tags = sampleTags.slice(0, 2 + (i % 3)).join(',');
    await prisma.assignment.update({
      where: { id: apps[i].id },
      data: {
        tags: tags,
        viewCount: 150 + i * 23,
        publicSubmissionCount: 45 + i * 7,
        shortDescription: `Đây là mô tả mẫu cho bài tập ${apps[i].title}. Giúp học sinh nắm vững kiến thức cơ bản.`
      }
    });
    console.log(`Updated ${apps[i].title} with tags: ${tags}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
