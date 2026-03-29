import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: classId } = await params;

    const cls = await prisma.class.findFirst({
      where: { id: classId, teacherId: session.user.id },
    });

    if (!cls) {
      return NextResponse.json({ error: 'Lớp học không tồn tại' }, { status: 404 });
    }

    // Count total enrolled students
    const totalStudents = await prisma.classEnrollment.count({
      where: { classId },
    });

    // Get assignments assigned to this class
    const assignmentClasses = await prisma.assignmentClass.findMany({
      where: { 
        classId,
        assignment: { deletedAt: null }
      },
      include: {
        assignment: {
          include: {
            _count: {
              select: {
                submissions: {
                  where: { submittedAt: { not: null } },
                },
              },
            },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    const now = new Date();

    const assignments = assignmentClasses.map((ac) => {
      const a = ac.assignment;
      const isOpen = a.deadline ? new Date(a.deadline) > now : true;
      const submittedCount = a._count.submissions;
      const percentage = totalStudents > 0
        ? Math.round((submittedCount / totalStudents) * 100)
        : 0;

      return {
        id: a.id,
        title: a.title,
        materialType: a.materialType,
        deadline: a.deadline,
        isOpen,
        submittedCount,
        totalStudents,
        percentage,
        assignedAt: ac.assignedAt,
      };
    });

    // Count currently open assignments
    const openCount = assignments.filter((a) => a.isOpen).length;

    return NextResponse.json({ assignments, openCount });
  } catch (err) {
    console.error('[GET /api/classes/[id]/assignments]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
