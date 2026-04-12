import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const lesson = await prisma.lesson.findFirst({ where: { title: 'Thiên văn học cơ bản: Hệ Mặt Trời' } });
  console.log(JSON.stringify(lesson, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
