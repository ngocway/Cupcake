import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { LandingPage } from "@/components/public/LandingPage"

const LIMIT = 12

async function getInitialData() {
  const session = await auth()
  const userId = session?.user?.id

  const exWhere = { status: "PUBLIC" as const, deletedAt: null, lesson: null }
  const leWhere = { deletedAt: null, isPremium: false, assignment: { status: "PUBLIC" as const } }

  const [assignments, assignmentsTotal, lessons, lessonsTotal, rawTags, categoryTree] = await Promise.all([
    prisma.assignment.findMany({
      where: exWhere,
      include: {
        teacher: { select: { id: true, name: true, image: true } },
        _count: { select: { questions: true, reviews: true } },
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
        _count: { select: { reviews: true } },
        assignment: { select: { videoUrl: true, audioUrl: true, thumbnail: true } }
      },
      orderBy: { createdAt: "desc" },
      take: LIMIT
    }),
    prisma.lesson.count({ where: leWhere }),
    prisma.assignment.findMany({
      where: { status: "PUBLIC", deletedAt: null, tags: { not: null } },
      select: { tags: true }
    }),
    prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true
              }
            }
          }
        }
      },
      orderBy: { orderIndex: 'asc' }
    })
  ])

  const allLessons = lessons.map(l => ({ 
    ...l, 
    type: 'VIDEO_LESSON',
    videoUrl: l.assignment?.videoUrl || l.videoUrl,
    audioUrl: l.assignment?.audioUrl,
    thumbnail: l.assignment?.thumbnail || null
  }))

  const allTags = [...new Set(
    rawTags.flatMap(a => (a.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean))
  )].sort()

  const processedAssignments = assignments.map((a: any) => ({
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
    initialExercises: processedAssignments,
    hasMoreExercises: assignmentsTotal > LIMIT,
    initialLessons: allLessons,
    hasMoreLessons: lessonsTotal > LIMIT,
    allTags,
    categoryTree
  }
}

export default async function HomePage() {
  const data = await getInitialData()
  return <LandingPage {...data} />
}
