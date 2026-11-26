
import { PrismaClient } from '@prisma/client'

/**
 * Ensures serverless environments (Vercel) use a compact connection pool per lambda
 * so concurrent requests do not exhaust the Supabase PgBouncer connection limit.
 */
function normalizeDbUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined
  try {
    const parsed = new URL(rawUrl)
    const isServerlessProd =
      process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
    const isPooler =
      parsed.hostname.includes('pooler.supabase.com') || parsed.port === '6543'

    if (isServerlessProd && isPooler) {
      if (!parsed.searchParams.has('pgbouncer')) {
        parsed.searchParams.set('pgbouncer', 'true')
      }
      const currentLimit = Number(parsed.searchParams.get('connection_limit') || '0')
      if (!currentLimit || currentLimit > 3) {
        parsed.searchParams.set('connection_limit', '3')
      }
      if (!parsed.searchParams.has('pool_timeout')) {
        parsed.searchParams.set('pool_timeout', '20')
      }
      if (!parsed.searchParams.has('connect_timeout')) {
        parsed.searchParams.set('connect_timeout', '15')
      }
    }
    return parsed.toString()
  } catch {
    return rawUrl
  }
}

const studentDbUrl = normalizeDbUrl(
  process.env.DATABASE_URL_STUDENT || process.env.DATABASE_URL
)
const teacherDbUrl = normalizeDbUrl(
  process.env.DATABASE_URL_TEACHER ||
    process.env.DATABASE_URL_STUDENT ||
    process.env.DATABASE_URL
)

const createPrismaClient = (url?: string) =>
  new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
  })

declare const globalThis: {
  prismaStudentV1?: PrismaClient
  prismaTeacherV1?: PrismaClient
} & typeof global

export const studentPrisma =
  globalThis.prismaStudentV1 ?? createPrismaClient(studentDbUrl)

// Reuse the exact same pool when student and teacher point to the same DB URL
export const teacherPrisma =
  teacherDbUrl === studentDbUrl
    ? studentPrisma
    : (globalThis.prismaTeacherV1 ?? createPrismaClient(teacherDbUrl))

globalThis.prismaStudentV1 = studentPrisma
globalThis.prismaTeacherV1 = teacherPrisma

/**
 * Helper to select the appropriate Prisma client based on role or hostname
 */
export function getPrisma(roleOrHost?: string) {
  if (
    roleOrHost === 'TEACHER' ||
    (roleOrHost &&
      (roleOrHost.startsWith('teacher.') || roleOrHost.includes('teacher.dolcake')))
  ) {
    return teacherPrisma
  }
  return studentPrisma
}

const prisma = studentPrisma
export default prisma

