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

export async function saveTreasureHuntGameAction(data: Omit<SaveCandyQuizPayload, "gameMode">) {
  return saveCandyQuizGameAction({
    ...data,
    gameMode: "treasure-hunt",
  });
}

export async function getTreasureHuntGameDetailsAction(topicId: string) {
  return getCandyQuizGameDetailsAction(topicId);
}
