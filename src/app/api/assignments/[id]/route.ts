import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const assignment = await prisma.assignment.findUnique({
      where: { id, teacherId: session.user.id },
      include: { questions: { orderBy: { orderIndex: 'asc' } } }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Không tìm thấy bài tập' }, { status: 404 });
    }

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        status: assignment.status,
        questions: assignment.questions.map(q => {
          // Parse the stringified JSON from the database
          const parsed = JSON.parse(q.content);
          return {
            ...parsed,
            id: q.id, // Use DB id if available, or stay as is
            type: q.type,
            points: q.points,
            explanation: q.explanation,
            mediaType: q.mediaType,
            mediaUrl: q.mediaUrl,
            imageUrl: q.imageUrl,
            audioUrl: q.audioUrl,
            videoUrl: q.videoUrl,
          };
        })
      }
    });
  } catch (err) {
    console.error('[GET /api/assignments/[id]]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
