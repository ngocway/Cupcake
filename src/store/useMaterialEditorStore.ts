import { create } from 'zustand';
import { BaseQuestionProps } from '@/components/quiz/types';

interface MaterialEditorState {
  id: string | null;
  title: string;
  type: 'EXERCISE' | 'READING' | 'FLASHCARD';
  questions: BaseQuestionProps[];
  isSaving: boolean;
  lastSavedAt: Date | null;
  
  // Actions
  initializeMaterial: (id: string, title: string, type: 'EXERCISE' | 'READING' | 'FLASHCARD', questions: BaseQuestionProps[]) => void;
  updateTitle: (title: string) => void;
  setQuestions: (questions: BaseQuestionProps[] | ((prev: BaseQuestionProps[]) => BaseQuestionProps[])) => void;
  addQuestion: (question: BaseQuestionProps) => void;
  updateQuestion: (id: string, data: Partial<BaseQuestionProps>) => void;
  removeQuestion: (id: string) => void;
  setSavingStatus: (isSaving: boolean, date?: Date) => void;
}

export const useMaterialEditorStore = create<MaterialEditorState>((set) => ({
  id: null,
  title: 'Bài tập mới',
  type: 'EXERCISE',
  questions: [],
  isSaving: false,
  lastSavedAt: null,
  
  initializeMaterial: (id, title, type, questions) => set({ id, title, type, questions }),
  
  updateTitle: (title) => set({ title }),
  
  setQuestions: (updater) => set((state) => ({ 
    questions: typeof updater === 'function' ? updater(state.questions) : updater 
  })),
  
  addQuestion: (q) => set((state) => ({ 
    questions: [...state.questions, q] 
  })),
  
  updateQuestion: (id, data) => set((state) => ({
    questions: state.questions.map((q) => q.id === id ? { ...q, ...data } : q)
  })),
  
  removeQuestion: (id) => set((state) => ({
    questions: state.questions.filter((q) => q.id !== id)
  })),
  
  setSavingStatus: (isSaving, date) => set((state) => ({ 
    isSaving, 
    lastSavedAt: date ?? state.lastSavedAt 
  })),
}));
