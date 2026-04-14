import prisma from "@/lib/prisma"
import AnalyticsDashboard from "./AnalyticsDashboard"
import { startOfDay, subDays, format } from "date-fns"

export default async function AdminAnalyticsPage() {
  const now = new Date()
  const thirtyDaysAgo = subDays(now, 30)

  // Fetch Users growth
  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      role: { in: ['TEACHER', 'STUDENT'] }
    },
    select: { createdAt: true, role: true }
  })

  // Fetch Content growth
  const lessons = await prisma.lesson.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true }
  })

  const assignments = await prisma.assignment.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true }
  })

  // Top content
  const [topLessons, topAssignments] = await Promise.all([
    prisma.lesson.findMany({
      orderBy: { viewsCount: 'desc' },
      take: 5,
      include: { teacher: { select: { name: true } } }
    }),
    prisma.assignment.findMany({
      orderBy: { viewCount: 'desc' }, // Use viewCount for assignments too
      take: 5,
      include: { teacher: { select: { name: true } } }
    })
  ])

  // Process growth data into a daily format for Recharts
  const growthData = Array.from({ length: 30 }).map((_, i) => {
    const date = subDays(now, 29 - i)
    const dateStr = format(date, 'MMM dd')
    const start = startOfDay(date)
    const nextDay = subDays(start, -1)

    const dailyTeachers = users.filter(u => u.role === 'TEACHER' && u.createdAt >= start && u.createdAt < nextDay).length
    const dailyStudents = users.filter(u => u.role === 'STUDENT' && u.createdAt >= start && u.createdAt < nextDay).length
    const dailyLessons = lessons.filter(l => l.createdAt >= start && l.createdAt < nextDay).length
    const dailyAssignments = assignments.filter(a => a.createdAt >= start && a.createdAt < nextDay).length

    return {
      name: dateStr,
      teachers: dailyTeachers,
      students: dailyStudents,
      lessons: dailyLessons,
      assignments: dailyAssignments
    }
  })

  return (
    <div className="p-8">
      <AnalyticsDashboard 
        growthData={growthData} 
        topLessons={topLessons} 
        topAssignments={topAssignments}
      />
    </div>
  )
}
