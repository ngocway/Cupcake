"use client";

import { useEffect } from "react";
import { prewarmQuestionsAction } from "./actions";

export function QuizPrefetcher({ assignmentId }: { assignmentId: string }) {
  useEffect(() => {
    // Chỉ kích hoạt sau 1s để nhường tài nguyên cho các render quan trọng ban đầu
    const timer = setTimeout(() => {
      prewarmQuestionsAction(assignmentId).catch(() => {
        // Im lặng nếu lỗi, đây chỉ là prefetch
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [assignmentId]);

  return null;
}
