import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user?.role !== 'TEACHER' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isTrash = searchParams.get('trash') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const skip = (page - 1) * limit;

    const whereClause = {
      teacherId: session.user.id,
      deletedAt: isTrash ? { not: null } : null,
    };

    const [lessons, total] = await Promise.all([
      prisma.lesson.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          description: true,
          videoUrl: true,
          viewsCount: true,
          createdAt: true,
          isPremium: true,
          price: true,
          targetAudiences: true,
          teacher: {
            select: {
              name: true
            }
          },
          assignment: {
            select: {
              id: true,
              materialType: true,
              status: true,
              subject: true,
              gradeLevel: true,
              thumbnail: true,
              targetAudiences: true,
              tags: true,
              publicSubmissionCount: true,
              _count: {
                select: {
                  questions: true,
                  targetClasses: true
                }
              }
            }
          },
          _count: {
            select: { 
              reviews: true
            },
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.lesson.count({ where: whereClause })
    ]);

    return NextResponse.json({
      lessons: lessons.map(l => ({
        id: l.assignment?.id || l.id,
        lessonId: l.id,
        title: l.title,
        status: l.assignment?.status || 'DRAFT',
        materialType: l.assignment?.materialType || 'READING',
        description: l.description,
        videoUrl: l.videoUrl,
        viewCount: l.viewsCount,
        subject: l.assignment?.subject || null,
        gradeLevel: l.assignment?.gradeLevel || null,
        thumbnail: l.assignment?.thumbnail || null,
        tags: (l.assignment?.tags || "").split(",").map(t => t.trim()).filter(Boolean),
        questionCount: l.assignment?._count?.questions || 0,
        assignedCount: l.assignment?._count?.targetClasses || 0,
        publicSubmissionCount: l.assignment?.publicSubmissionCount || 0,
        targetAudiences: l.targetAudiences?.length ? l.targetAudiences : (l.assignment?.targetAudiences || []),
        createdAt: l.createdAt,
        teacher: l.teacher,
        isPremium: l.isPremium,
        price: l.price
      })),
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error('[GET /api/lessons]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
