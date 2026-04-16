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
    const baseAssignment = await prisma.assignment.findFirst({
      where: {
        id: id,
        teacherId: session.user.id,
        deletedAt: null
      }
    });

    if (!baseAssignment) {
      return NextResponse.json({ error: 'Không tìm thấy bài tập' }, { status: 404 });
    }

    // Fetch questions using standard prisma as it's not changes
    const questions = await prisma.question.findMany({
      where: { assignmentId: id },
      orderBy: { orderIndex: 'asc' }
    });

    return NextResponse.json({
      assignment: {
        id: baseAssignment.id,
        title: baseAssignment.title,
        status: baseAssignment.status,
        readingText: baseAssignment.readingText,
        videoUrl: baseAssignment.videoUrl || null,
        audioUrl: baseAssignment.audioUrl || null,
        subject: baseAssignment.subject || null,
        gradeLevel: baseAssignment.gradeLevel || null,
        shortDescription: baseAssignment.shortDescription || null,
        tags: baseAssignment.tags || "",
        questions: questions.map(q => {
          // Parse the stringified JSON from the database with safety
          let parsed = {};
          try {
            parsed = JSON.parse(q.content);
          } catch (e) {
            console.error('Failed to parse question content:', q.id, e);
          }
          
          return {
            id: q.id,
            type: q.type,
            points: q.points,
            explanation: q.explanation,
            content: parsed,
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
