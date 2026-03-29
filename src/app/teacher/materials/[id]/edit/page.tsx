"use client";

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { QuizEditor } from '@/components/quiz/QuizEditor';
import { FlashcardEditor } from '@/components/quiz/FlashcardEditor';
import { ReadingBuilder } from '@/components/quiz/ReadingBuilder';

export default function MaterialEditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const id = params.id as string;
  const type = searchParams.get('type') || 'quiz'; // Read from query param initially
  
  // Note: In a real app we would load initial data from DB via a server component 
  // and pass it as props, then initialize `useMaterialEditorStore(initialData)`.
  
  if (type === 'flashcard') {
    return <FlashcardEditor />;
  }
  
  if (type === 'reading') {
    return <ReadingBuilder />;
  }
  
  return <QuizEditor />;
}
