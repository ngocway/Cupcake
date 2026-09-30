import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { fetchWithRedis } from '@/lib/cached-queries';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Use Redis cache (TTL 60s) to achieve sub-millisecond response time
  const data = await fetchWithRedis(`student:classes:${userId}`, 60, async () => {
    // 1. Fetch enrollments with minimal required fields
    const enrollments = await prisma.classEnrollment.findMany({
      where: { studentId: userId },
      select: {
        classId: true,
        status: true,
        joinedAt: true,
        class: {
          select: {
            id: true,
            name: true,
            teacher: {
              select: { id: true, name: true, email: true, image: true }
            },
            _count: {
              select: { assignments: true }
            }
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });

    const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');

    // 2. Fetch only classId and dueDate (NO heavy Assignment joins/blobs)
    const assignedToMe = activeEnrollments.length > 0
      ? await prisma.assignmentClass.findMany({
          where: {
            classId: { in: activeEnrollments.map(e => e.classId) }
          },
          select: {
            classId: true,
            dueDate: true
          }
        })
      : [];

    const now = new Date();

    const formattedEnrollments = enrollments.map(e => {
      let pendingCount = 0;
      if (e.status === 'ACTIVE') {
        pendingCount = assignedToMe.filter(a => 
          a.classId === e.classId && 
          (!a.dueDate || now < new Date(a.dueDate))
        ).length;
      }

      return {
        id: e.classId,
        status: e.status,
        joinedAt: e.joinedAt,
        class: {
          id: e.class.id,
          name: e.class.name,
          teacherName: e.class.teacher.name || e.class.teacher.email,
          totalAssignments: e.class._count.assignments
        },
        pendingCount
      };
    });

    const activeClasses = formattedEnrollments.filter(e => e.status === 'ACTIVE');
    const pendingRequests = formattedEnrollments.filter(e => e.status === 'PENDING');

    return { activeClasses, pendingRequests };
  });

  return NextResponse.json(data);
}
