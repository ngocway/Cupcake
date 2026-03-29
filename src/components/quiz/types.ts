export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "CLOZE_TEST"
  | "MATCHING"
  | "TRUE_FALSE"
  | "REORDER";

export type QuestionContent = 
  | MultipleChoiceContent 
  | ClozeTestContent 
  | MatchingContent 
  | TrueFalseContent 
  | ReorderContent;

export type MediaType = "NONE" | "IMAGE" | "VIDEO" | "AUDIO";

export type BaseQuestionProps = {
  id: string;
  points: number;
  explanation?: string;
  type: QuestionType;
  content?: QuestionContent;
  mediaType?: MediaType;
  mediaUrl?: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
};

export type MultipleChoiceContent = {
  questionText: string;
  allowMultipleAnswers: boolean;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
};

export type ClozeTestContent = {
  textWithBlanks: string;
  caseSensitive: boolean;
};

export type MatchingPair = {
  id: string;
  leftImageUrl?: string;
  leftText?: string;
  rightText: string;
};

export type MatchingContent = {
  instruction: string;
  presentationType: "IMAGE_ANSWER" | "QUESTION_ANSWER";
  pairs: MatchingPair[];
};

export type TrueFalseContent = {
  statement: string;
  isTrue: boolean;
  displayStyle?: "TRUE_FALSE" | "DUNG_SAI" | "YES_NO";
};

export type ReorderItem = {
  id: string;
  text: string;
  orderIndex: number;
};

export type ReorderContent = {
  instruction: string;
  items: ReorderItem[];
};
