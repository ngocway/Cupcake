import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { LandingPage } from "@/components/public/LandingPage"

const LIMIT = 12

async function getInitialData() {
  const session = await auth()
  const userId = session?.user?.id

  const exWhere = { status: "PUBLIC" as const, deletedAt: null, materialType: { in: ["EXERCISE", "FLASHCARD"] } }
  const leWhere = { deletedAt: null, isPremium: false, assignment: { status: "PUBLIC" as const } }
  const reWhere = { status: "PUBLIC" as const, deletedAt: null, materialType: "READING" }

  const [exercises, exercisesTotal, lessons, lessonsTotal, readingLessons, rawTags] = await Promise.all([
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
      where: reWhere,
      include: {
        teacher: { select: { id: true, name: true, image: true } },
        _count: { select: { reviews: true } },
        ...(userId ? { favoriteAssignments: { where: { studentId: userId } } } : {})
      },
      orderBy: { createdAt: "desc" },
      take: LIMIT
    }),
    prisma.assignment.findMany({
      where: { status: "PUBLIC", deletedAt: null, tags: { not: null } },
      select: { tags: true }
    })
  ])

  const allLessons = [
    ...lessons.map(l => ({ ...l, type: 'VIDEO_LESSON' })),
    ...readingLessons.map(a => ({ 
      ...a, 
      type: 'READING_LESSON',
      description: a.shortDescription,
      viewsCount: a.viewCount,
      _count: { reviews: a._count.reviews }
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())


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
    initialLessons: allLessons,
    hasMoreLessons: (lessonsTotal + readingLessons.length) > LIMIT,
    allTags
  }
}

export default async function HomePage() {
  const data = await getInitialData()
  return <LandingPage {...data} />
}
