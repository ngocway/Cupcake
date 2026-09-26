import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const isTeacher = session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN';
    if (!session || !isTeacher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: classId } = await params;

    const cls = await prisma.class.findFirst({
      where: { 
        id: classId, 
        ...(session.user.role === 'ADMIN' ? {} : { teacherId: session.user.id }) 
      },
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
        group: true,
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

      let section: 'NEW' | 'REVIEW' = 'NEW';
      if (a.instructions) {
        try {
          const meta = JSON.parse(a.instructions);
          if (meta.section === 'REVIEW') section = 'REVIEW';
        } catch {}
      }

      return {
        id: a.id,
        title: a.title,
        materialType: a.materialType,
        level: a.level,
        instructions: a.instructions,
        deadline: a.deadline,
        isOpen,
        submittedCount,
        totalStudents,
        percentage,
        assignedAt: ac.assignedAt,
        groupId: ac.groupId,
        groupTitle: ac.group?.title || null,
        groupCreatedAt: ac.group?.createdAt || null,
        section,
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
