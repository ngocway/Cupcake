import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'teacher@example.com'
  const password = await bcrypt.hash('123456abc', 10)
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { password, role: 'TEACHER' },
    create: {
      email,
      name: 'Teacher Demo',
      password,
      role: 'TEACHER',
    },
  })
  console.log(`Successfully created or updated teacher account!
Email: ${user.email}
Pass: 123456abc`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
