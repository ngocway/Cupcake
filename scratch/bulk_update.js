const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.assignment.updateMany({
    where: { status: 'PUBLIC', deletedAt: null },
    data: {
      tags: 'Exam,HOT,Featured',
      viewCount: 1234,
      publicSubmissionCount: 456,
      shortDescription: 'Đây là tài liệu học tập được tối ưu hóa cho kỳ thi sắp tới.'
    }
  });
  console.log('Updated all public assignments:', result.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
