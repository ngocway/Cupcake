import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const sort = searchParams.get('sort') || 'newest'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = 12
    const skip = (page - 1) * limit

    const leWhere: any = { deletedAt: null, isPremium: false, assignment: { status: 'PUBLIC' } }

    if (categoryId) {
      leWhere.assignment = {
        status: 'PUBLIC',
        categories: { some: { id: categoryId } }
      }
    }

    if (search) {
      leWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [lessons, lessonsTotal] = await Promise.all([
      prisma.lesson.findMany({
        where: leWhere,
        include: {
          teacher: { select: { id: true, name: true, image: true } },
          _count: { select: { reviews: true } },
          assignment: { select: { videoUrl: true, audioUrl: true, thumbnail: true } }
        },
        orderBy: sort === 'popular' ? { viewsCount: 'desc' } : { createdAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.lesson.count({ where: leWhere })
    ])

    const allItems = lessons.map(l => ({ 
      ...l, 
      type: 'VIDEO_LESSON',
      videoUrl: l.assignment?.videoUrl || l.videoUrl,
      audioUrl: l.assignment?.audioUrl,
      thumbnail: l.assignment?.thumbnail || null
    }))

    return NextResponse.json({ items: allItems, total: lessonsTotal, hasMore: lessonsTotal > skip + limit, page })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ items: [], total: 0, hasMore: false, page: 1 })
  }
}
