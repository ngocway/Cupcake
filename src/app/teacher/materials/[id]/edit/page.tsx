"use client";

import React, { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { QuizEditor } from '@/components/quiz/QuizEditor';
import { FlashcardEditor } from '@/components/quiz/FlashcardEditor';
import { ReadingExerciseBuilder } from '@/components/quiz/ReadingExerciseBuilder';

function MaterialEditContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const id = params.id as string;
  const type = searchParams.get('type') || 'quiz'; 
  
  if (type === 'flashcard') {
    return <FlashcardEditor />;
  }
  
  if (type === 'reading' || type === 'READING') {
    return <ReadingExerciseBuilder assignmentId={id} />;
  }
  
  return <QuizEditor />;
}

export default function MaterialEditPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center animate-pulse">Loading editor...</div>}>
      <MaterialEditContent />
    </Suspense>
  );
}
