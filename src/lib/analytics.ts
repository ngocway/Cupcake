import { track } from "@vercel/analytics";

export type EventName =
  // 1. Auth
  | "auth_login"
  | "auth_signup"
  // 2. Class Lifecycle
  | "teacher_class_created"
  | "teacher_class_share_code"
  | "teacher_student_added"
  | "student_class_joined"
  | "teacher_class_assign_content"
  // 3. Teacher Game Creator
  | "teacher_game_saved"
  | "teacher_game_share_link"
  | "teacher_game_ai_used"
  | "teacher_game_ai_applied"
  // 4. Student Gaming & Flashcards
  | "game_started"
  | "game_completed"
  | "game_replay"
  | "flashcard_audio_played"
  | "flashcard_flipped"
  | "flashcard_practice_completed"
  // 5. Assignments
  | "student_assignment_submitted"
  // 6. 45 Days Courses (Vocab & Grammar) & Navigation
  | "course_day_selected"
  | "course_activity_switched"
  | "course_locked_day_clicked"
  | "vocab_card_revealed"
  | "vocab_card_audio_played"
  | "vocab_restart_clicked"
  | "vocab_mode_changed"
  | "vocab_day_completed"
  | "grammar_theory_started"
  | "grammar_rule_expanded"
  | "grammar_quiz_started"
  | "grammar_day_completed"
  // 7. Adventure Map & Station Funnel Events
  | "island_preview_slide"
  | "island_open_modal"
  | "island_locked_click"
  | "station_card_clicked"
  | "game_picker_opened"
  | "game_picker_selected";

export type EventProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Safely track custom events to both Vercel Analytics and internal Admin Analytics DB.
 * Handles client-side execution, suppresses runtime errors so UI never breaks.
 */
export function trackEvent(name: EventName, properties?: EventProperties) {
  if (typeof window === "undefined") return;

  try {
    // Clean properties: omit undefined values
    const cleanedProps: Record<string, string | number | boolean | null> = {};
    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        if (value !== undefined) {
          cleanedProps[key] = value;
        }
      }
    }

    // 1. Send to Vercel Analytics
    track(name, cleanedProps);

    // 2. Non-blocking fire-and-forget to internal Admin DB
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: name,
        props: cleanedProps,
      }),
      keepalive: true,
    }).catch(() => {});

    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics Event] ${name}:`, cleanedProps);
    }
  } catch (err) {
    // Non-blocking: never let analytics crash the app
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Analytics Error] Failed to track ${name}:`, err);
    }
  }
}
