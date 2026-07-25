import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/books?level=a1
 *
 * Returns PUBLISHED books, optionally filtered by CEFR level.
 * Used by LandingPage priority-fetch: current level first, others in background.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const level = searchParams.get('level') || ''

  const where: any = { status: 'PUBLISHED' }
  if (level) where.level = level

  try {
    const books = await prisma.readAlongBook.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        bookId: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        level: true,
        slides: {
          orderBy: { orderIndex: 'asc' },
          take: 1,
          select: { imageUrl: true, slideNumber: true, orderIndex: true }
        },
        _count: { select: { slides: true } }
      }
    })

    return NextResponse.json(
      { items: books },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60'
        }
      }
    )
  } catch (e) {
    console.error('[/api/books] Error:', e)
    return NextResponse.json({ items: [] }, { status: 500 })
  }
}
