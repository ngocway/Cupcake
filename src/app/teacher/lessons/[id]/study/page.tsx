import React from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import StudyClient from './StudyClient';

export default async function TeacherStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'TEACHER') {
    redirect('/login');
  }

  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { orderIndex: 'asc' }
      },
      flashcardDeck: {
        include: {
          cards: {
            orderBy: { orderIndex: 'asc' }
          }
        }
      }
    }
  });

  if (!assignment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl font-bold">Bài học không tồn tại.</p>
      </div>
    );
  }

  return (
    <StudyClient assignment={assignment as any} />
  );
}
