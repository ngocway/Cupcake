const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const publicAssignments = await prisma.assignment.findMany({
    where: { status: 'PUBLIC' },
    take: 3
  });

  for (const app of publicAssignments) {
    await prisma.assignment.update({
      where: { id: app.id },
      data: {
        tags: 'Cấp tốc,Mẹo làm bài,Từ vựng,HOT',
        viewCount: 9999,
        publicSubmissionCount: 777,
        shortDescription: 'BÀI TẬP SIÊU CẤP VIP PRO - ĐÃ ĐƯỢC CẬP NHẬT METADATA.'
      }
    });
    console.log(`BOOSTED: ${app.title}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
