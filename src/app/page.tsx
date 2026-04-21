import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { LandingPage } from "@/components/public/LandingPage"

const LIMIT = 12

async function getInitialData() {
  const session = await auth()
  const userId = session?.user?.id

  const exWhere = { status: "PUBLIC" as const, deletedAt: null }
  const leWhere = { deletedAt: null, isPremium: false, assignment: { status: "PUBLIC" as const } }

  const [exercises, exercisesTotal, lessons, lessonsTotal, rawTags] = await Promise.all([
    prisma.assignment.findMany({
      where: exWhere,
      include: {
        teacher: { select: { id: true, name: true, image: true } },
        _count: { select: { questions: true } },
        ...(userId ? { favoriteAssignments: { where: { studentId: userId } } } : {})
      },
      orderBy: { createdAt: "desc" },
      take: LIMIT
    }),
    prisma.assignment.count({ where: exWhere }),
    prisma.lesson.findMany({
      where: leWhere,
      include: {
        teacher: { select: { id: true, name: true, image: true } },
        _count: { select: { reviews: true } }
      },
      orderBy: { createdAt: "desc" },
      take: LIMIT
    }),
    prisma.lesson.count({ where: leWhere }),
    prisma.assignment.findMany({
      where: { status: "PUBLIC", deletedAt: null, tags: { not: null } },
      select: { tags: true }
    })
  ])

  const allTags = [...new Set(
    rawTags.flatMap(a => (a.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean))
  )].sort()

  const processedExercises = exercises.map((a: any) => ({
    ...a,
    tags: a.tags ? a.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
    isBookmarked: userId ? (a.favoriteAssignments?.length > 0) : false,
    favoriteAssignments: undefined
  }))

  return {
    session: session ? {
      id: session.user.id!,
      name: session.user.name ?? null,
      image: session.user.image ?? null,
      role: (session.user as any).role ?? null
    } : null,
    initialExercises: processedExercises,
    hasMoreExercises: exercisesTotal > LIMIT,
    initialLessons: lessons,
    hasMoreLessons: lessonsTotal > LIMIT,
    allTags
  }
}

export default async function HomePage() {
  const data = await getInitialData()
  return <LandingPage {...data} />
}
