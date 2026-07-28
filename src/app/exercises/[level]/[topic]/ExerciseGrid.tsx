"use client";
import { ExerciseCardHorizontal } from "@/components/public/ContentCards";

export function ExerciseGrid({
  exercises,
  isLoggedIn,
}: {
  exercises: any[];
  isLoggedIn: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-6">
      {exercises.map((ex) => (
        <ExerciseCardHorizontal key={ex.id} item={ex} isLoggedIn={isLoggedIn} />
      ))}
    </div>
  );
}
