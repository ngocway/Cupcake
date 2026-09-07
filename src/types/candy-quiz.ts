export interface QuizQuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  imageUrl?: string;
  options: QuizQuestionOption[];
}

export interface QuizRound {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

export interface SaveCandyQuizPayload {
  topicId?: string;
  title: string;
  gradeLevel?: string;
  rounds: QuizRound[];
  gameMode?: string;
}
