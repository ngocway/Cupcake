
import { PrismaClient } from '@prisma/client'

// Client Singletons for Student & Teacher DBs
const getStudentPrismaClient = () => {
  const url = process.env.DATABASE_URL_STUDENT || process.env.DATABASE_URL
  return new PrismaClient({
    datasources: url ? { db: { url } } : undefined
  })
}

const getTeacherPrismaClient = () => {
  const url = process.env.DATABASE_URL_TEACHER || process.env.DATABASE_URL_STUDENT || process.env.DATABASE_URL
  return new PrismaClient({
    datasources: url ? { db: { url } } : undefined
  })
}

declare const globalThis: {
  prismaStudentV1?: ReturnType<typeof getStudentPrismaClient>;
  prismaTeacherV1?: ReturnType<typeof getTeacherPrismaClient>;
} & typeof global;

export const studentPrisma = globalThis.prismaStudentV1 ?? getStudentPrismaClient()
export const teacherPrisma = globalThis.prismaTeacherV1 ?? getTeacherPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaStudentV1 = studentPrisma
  globalThis.prismaTeacherV1 = teacherPrisma
}

/**
 * Helper to select the appropriate Prisma client based on role or hostname
 */
export function getPrisma(roleOrHost?: string) {
  if (roleOrHost === 'TEACHER' || (roleOrHost && (roleOrHost.startsWith('teacher.') || roleOrHost.includes('teacher.dolcake')))) {
    return teacherPrisma
  }
  return studentPrisma
}

const prisma = studentPrisma
export default prisma

