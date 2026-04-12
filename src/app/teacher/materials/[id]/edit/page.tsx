"use client";

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { QuizEditor } from '@/components/quiz/QuizEditor';
import { FlashcardEditor } from '@/components/quiz/FlashcardEditor';
import { ReadingExerciseBuilder } from '@/components/quiz/ReadingExerciseBuilder';

export default function MaterialEditPage() {
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
