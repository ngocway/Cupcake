import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'newest'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = 12
    const skip = (page - 1) * limit

    const leWhere: any = { deletedAt: null, isPremium: false, assignment: { status: 'PUBLIC' } }
    const reWhere: any = { status: 'PUBLIC', deletedAt: null, materialType: 'READING' }

    if (search) {
      const searchFilter = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
      leWhere.OR = searchFilter
      reWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [lessons, lessonsTotal, readingLessons, readingTotal] = await Promise.all([
      prisma.lesson.findMany({
        where: leWhere,
        include: {
          teacher: { select: { id: true, name: true, image: true } },
          _count: { select: { reviews: true } }
        },
        orderBy: sort === 'popular' ? { viewsCount: 'desc' } : { createdAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.lesson.count({ where: leWhere }),
      prisma.assignment.findMany({
        where: reWhere,
        include: {
          teacher: { select: { id: true, name: true, image: true } },
          _count: { select: { reviews: true } }
        },
        orderBy: sort === 'popular' ? { viewCount: 'desc' } : { createdAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.assignment.count({ where: reWhere })
    ])

    const allItems = [
      ...lessons.map(l => ({ ...l, type: 'VIDEO_LESSON' })),
      ...readingLessons.map(a => ({ 
        ...a, 
        type: 'READING_LESSON',
        description: a.shortDescription,
        viewsCount: a.viewCount,
        _count: { reviews: a._count.reviews }
      }))
    ].sort((a, b) => {
      if (sort === 'popular') return (b.viewsCount || 0) - (a.viewsCount || 0)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }).slice(0, limit)

    const total = lessonsTotal + readingTotal
    return NextResponse.json({ items: allItems, total, hasMore: total > skip + limit, page })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ items: [], total: 0, hasMore: false, page: 1 })
  }
}
