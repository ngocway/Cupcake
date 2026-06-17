import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getShuffledIds } from '@/lib/cached-queries'

/**
 * GET /api/feed?type=exercises|lessons[&categoryId=...][&search=...]
 *
 * Returns random paginated content from HomepageFeed (using getShuffledIds).
 * Called client-side in the background for infinite scroll.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type       = searchParams.get('type')        // 'exercises' | 'lessons'
  const goal       = searchParams.get('goal') || searchParams.get('categoryId') || ''
  const search     = searchParams.get('search') || ''
  const userType   = searchParams.get('userType') || ''
  const subject    = searchParams.get('subject') || ''
  const level      = searchParams.get('level') || ''

  const pageStr    = searchParams.get('page') || '1'
  const limitStr   = searchParams.get('limit') || '12'
  const page       = parseInt(pageStr, 10)
  const limit      = parseInt(limitStr, 10)
  const skip       = (page - 1) * limit

  const contentType = type === 'lessons' ? 'LESSON' : 'EXERCISE'

  const randomIds = await getShuffledIds(contentType, goal, search, userType, subject, level)
  const slicedIds = randomIds.slice(skip, skip + limit)
  const hasMore = skip + limit < randomIds.length

  const results = slicedIds.length > 0
    ? await prisma.homepageFeed.findMany({ where: { id: { in: slicedIds } } })
    : []

  // Restore random order
  results.sort((a, b) => slicedIds.indexOf(a.id) - slicedIds.indexOf(b.id))

  const mapped = results.map(item => ({
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
    { items: mapped, hasMore },
    {
      headers: {
        // Cache at the edge for 5 minutes — matches unstable_cache TTL
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
      }
    }
  )
}
