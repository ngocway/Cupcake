import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Updating password for student@example.com...')

  const newPassword = '123456@Abc'
  const hashedPassword = await hash(newPassword, 10)

  const user = await prisma.user.update({
    where: { email: 'student@example.com' },
    data: { password: hashedPassword }
  })

  console.log(`Password updated successfully for ${user.email}`)
  console.log(`New password: ${newPassword}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
