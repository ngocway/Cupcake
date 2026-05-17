import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/feed?type=exercises|lessons[&categoryId=...][&search=...]
 *
 * Returns popular content from HomepageFeed (sorted by viewCount).
 * Called client-side in the background after the page has already rendered
 * with newest data — enabling instant sort switching without a full page reload.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type       = searchParams.get('type')        // 'exercises' | 'lessons'
  const categoryId = searchParams.get('categoryId')
  const search     = searchParams.get('search')
  const userType   = searchParams.get('userType')

  const contentType = type === 'lessons' ? 'LESSON' : 'EXERCISE'

  const where: any = { status: 'PUBLIC', contentType }
  if (categoryId) where.categoryId = categoryId
  if (search)     where.title = { contains: search, mode: 'insensitive' }
  if (userType) {
    where.OR = [
      { targetAudiences: { has: userType } },
      { targetAudiences: { equals: [] } }
    ]
  }

  const items = await prisma.homepageFeed.findMany({
    where,
    orderBy: { viewCount: 'desc' },
    take: 12
  })

  const mapped = items.map(item => ({
    ...item,
    id: item.sourceId,
    teacher: {
      id:    item.teacherId,
      name:  item.teacherName,
      image: item.teacherImage
    },
    _count: { reviews: item.reviewCount },
    ...(type === 'lessons' ? { type: 'VIDEO_LESSON' } : {})
  }))

  return NextResponse.json(
    { items: mapped },
    {
      headers: {
        // Cache at the edge for 5 minutes — matches unstable_cache TTL
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
      }
    }
  )
}
