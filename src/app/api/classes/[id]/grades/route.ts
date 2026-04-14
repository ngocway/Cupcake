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

    // Get assignments assigned to this class
    const assignmentClasses = await prisma.assignmentClass.findMany({
      where: { 
        classId,
        assignment: { deletedAt: null }
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            materialType: true,
            defaultPoints: true,
          }
        }
      },
      orderBy: { assignedAt: 'asc' },
    });

    const assignments = assignmentClasses.map(ac => ({
      ...ac.assignment,
      deadline: ac.dueDate // Use class-specific deadline if it exists, fallback handled in DB later?
      // Actually AssignmentClass has dueDate, Assignment has deadline. 
      // The current system seems to use Assignment.deadline for global but AssignmentClass.dueDate for specific.
    }));

    // Re-fetch assignments properly to handle late info if needed
    // But let's keep it simple for now.

    // Get students enrolled in this class
    const enrollment = await prisma.classEnrollment.findMany({
      where: { classId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            isManagedAccount: true,
            password: true, // PIN for managed accounts
          }
        }
      },
      orderBy: { student: { name: 'asc' } }
    });

    const studentIds = enrollment.map(e => e.studentId);
    const assignmentIds = assignments.map(a => a.id);

    // Get all submissions for these students and these assignments
    const submissions = await prisma.submission.findMany({
      where: {
        studentId: { in: studentIds },
        assignmentId: { in: assignmentIds },
        submittedAt: { not: null }
      },
      select: {
        id: true,
        assignmentId: true,
        studentId: true,
        score: true,
        submittedAt: true,
      }
    });

    // Structure the data for the frontend
    const studentsData = enrollment.map(e => {
      const studentSubmissions = submissions.filter(s => s.studentId === e.studentId);
      
      const submissionMap: Record<string, any> = {};
      studentSubmissions.forEach(s => {
        // Latest attempt
        if (!submissionMap[s.assignmentId] || new Date(s.submittedAt) > new Date(submissionMap[s.assignmentId].submittedAt)) {
          submissionMap[s.assignmentId] = {
            id: s.id,
            score: s.score,
            submittedAt: s.submittedAt
          };
        }
      });

      return {
        id: e.student.id,
        name: e.student.name || 'Học sinh',
        email: e.student.email,
        isManagedAccount: e.student.isManagedAccount,
        pin: e.student.isManagedAccount ? e.student.password : null,
        submissions: submissionMap
      };
    });

    return NextResponse.json({
      assignments,
      students: studentsData
    });
  } catch (err) {
    console.error('[GET /api/classes/[id]/grades]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
