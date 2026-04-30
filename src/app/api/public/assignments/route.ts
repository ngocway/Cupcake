import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const tagsParam = searchParams.get('tags') || ''
    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : []
    const subject = searchParams.get('subject') || ''
    const gradeLevel = searchParams.get('gradeLevel') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const sort = searchParams.get('sort') || 'newest'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = 12
    const skip = (page - 1) * limit

    const where: any = { status: 'PUBLIC', deletedAt: null, lesson: null }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (subject) where.subject = subject
    if (gradeLevel) where.gradeLevel = gradeLevel
    if (categoryId) {
      where.categories = { some: { id: categoryId } }
    }
    if (tags.length > 0) {
      where.AND = tags.map((tag: string) => ({
        tags: { contains: tag, mode: 'insensitive' }
      }))
    }

    const orderBy: any =
      sort === 'popular' ? { viewCount: 'desc' } :
      sort === 'trending' ? { publicSubmissionCount: 'desc' } :
      { createdAt: 'desc' }

    const session = await auth()
    const userId = session?.user?.id

    const [items, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        include: {
          teacher: { select: { id: true, name: true, image: true } },
          _count: { select: { questions: true } },
          ...(userId ? { favoriteAssignments: { where: { studentId: userId } } } : {})
        },
        orderBy,
        take: limit,
        skip
      }),
      prisma.assignment.count({ where })
    ])

    return NextResponse.json({
      items: items.map(a => ({
        ...a,
        tags: a.tags ? a.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        isBookmarked: userId ? ((a as any).favoriteAssignments?.length > 0) : false,
        favoriteAssignments: undefined
      })),
      total,
      hasMore: total > skip + limit,
      page
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ items: [], total: 0, hasMore: false, page: 1 })
  }
}
