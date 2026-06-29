const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'onboarding_config' }
  });
  console.log("Current onboarding_config setting value:", JSON.stringify(setting?.value, null, 2));
}
main().finally(() => prisma.$disconnect());
