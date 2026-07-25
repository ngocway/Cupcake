"use client";

import { useEffect } from "react";
import { fetchQuestionsForLobby } from "./actions";
import { useContentStore } from "@/store/useContentStore";

export function QuizPrefetcher({ assignmentId }: { assignmentId: string }) {
  const setPendingQuizData = useContentStore(s => s.setPendingQuizData);

  useEffect(() => {
    // Fetch questions immediately and seed into Zustand store.
    // quiz/page.tsx will consume them on navigation — no DB round-trip needed.
    fetchQuestionsForLobby(assignmentId)
      .then(questions => {
        if (questions && questions.length > 0) {
          setPendingQuizData({ assignmentId, questions });
        }
      })
      .catch(() => {
        // Silent fail — quiz/page.tsx will fetch normally as fallback
      });
  // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  return null;
}
