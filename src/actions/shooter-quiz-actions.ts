"use server";

import {
  saveCandyQuizGameAction,
  getCandyQuizGameDetailsAction,
} from "./candy-quiz-actions";
import type {
  QuizRound,
  QuizQuestion,
  QuizQuestionOption,
  SaveCandyQuizPayload,
} from "@/types/candy-quiz";

export async function saveShooterQuizGameAction(data: Omit<SaveCandyQuizPayload, "gameMode">) {
  return saveCandyQuizGameAction({
    ...data,
    gameMode: "shooter-quiz",
  });
}

export async function getShooterQuizGameDetailsAction(topicId: string) {
  return getCandyQuizGameDetailsAction(topicId);
}
