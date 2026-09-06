"use server";

import {
  saveCandyQuizGameAction,
  getCandyQuizGameDetailsAction,
  SaveCandyQuizPayload,
  QuizRound,
  QuizQuestion,
  QuizQuestionOption,
} from "./candy-quiz-actions";

export type { QuizRound, QuizQuestion, QuizQuestionOption, SaveCandyQuizPayload };

export async function saveTreasureHuntGameAction(data: Omit<SaveCandyQuizPayload, "gameMode">) {
  return saveCandyQuizGameAction({
    ...data,
    gameMode: "treasure-hunt",
  });
}

export async function getTreasureHuntGameDetailsAction(topicId: string) {
  return getCandyQuizGameDetailsAction(topicId);
}
