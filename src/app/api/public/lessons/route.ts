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

    const where: any = { deletedAt: null, isPremium: false, assignment: { status: 'PUBLIC' } }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const orderBy: any =
      sort === 'popular' ? { viewsCount: 'desc' } : { createdAt: 'desc' }

    const [items, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        include: {
          teacher: { select: { id: true, name: true, image: true } },
          _count: { select: { reviews: true } }
        },
        orderBy,
        take: limit,
        skip
      }),
      prisma.lesson.count({ where })
    ])

    return NextResponse.json({ items, total, hasMore: total > skip + limit, page })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ items: [], total: 0, hasMore: false, page: 1 })
  }
}
