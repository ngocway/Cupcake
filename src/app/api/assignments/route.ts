import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sort = searchParams.get('sort') || 'desc'; // 'asc' or 'desc'
    const status = searchParams.get('status'); // DRAFT, PRIVATE, PUBLIC
    const isTrash = searchParams.get('trash') === 'true';

    const assignments = await prisma.assignment.findMany({
      where: {
        teacherId: session.user.id,
        ...(status ? { status: status as any } : {}),
        deletedAt: isTrash ? { not: null } : null,
      },
      include: {
        _count: {
          select: { 
            questions: true,
            targetClasses: true
          },
        },
        targetClasses: {
          include: {
            class: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: sort as 'asc' | 'desc' },
    });

    return NextResponse.json({
      assignments: assignments.map(a => ({
        id: a.id,
        title: a.title,
        status: a.status,
        materialType: a.materialType,
        subject: a.subject,
        gradeLevel: a.gradeLevel,
        thumbnail: a.thumbnail,
        questionCount: a._count.questions,
        assignedCount: a._count.targetClasses,
        classes: a.targetClasses.map(tc => ({
          id: tc.class.id,
          name: tc.class.name,
          startDate: tc.startDate,
          assignedAt: tc.assignedAt,
          dueDate: tc.dueDate,
        })),
        createdAt: a.createdAt,
      })),
      total: assignments.length,
    });
  } catch (err) {
    console.error('[GET /api/assignments]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
