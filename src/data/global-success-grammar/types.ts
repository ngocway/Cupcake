export interface GrammarExample {
  en: string;
  vi: string;
  emoji?: string;
}

export interface GrammarPoint {
  titleEn: string;
  titleVi: string;
  formula?: string;
  usageVi: string;
  usageEn: string;
  examples: GrammarExample[];
  tipVi?: string;
  tipEn?: string;
}

export interface GrammarPracticeQuestion {
  id: string;
  /** 100% English prompt only */
  prompt: string;
  /** 100% English options only (4 choices) */
  options: [string, string, string, string];
  correctIndex: number;
  explanationEn: string;
  explanationVi: string;
}

export interface UnitGrammarLesson {
  grade: number;
  unit: number;
  unitTitle: string;
  /** True for Grades 1–2 (shows "Mẫu câu trọng tâm" / "Key Sentences") */
  isSentencePattern?: boolean;
  summaryPoints: GrammarPoint[];
  questions: GrammarPracticeQuestion[];
}
