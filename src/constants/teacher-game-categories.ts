/**
 * Single Source of Truth for Teacher Portal Game Categorization.
 * Enforces strict 1-to-1 mapping between creation menu categories and created game lists.
 */

export type TeacherGameCategory = "match" | "choice" | "fill" | "flip" | "quiz";

export interface CategoryDefinition {
  key: TeacherGameCategory;
  title: string;
  createTab: string;
  listTab: string;
  gameModes: string[];
}

export const TEACHER_GAME_CATEGORIES: Record<TeacherGameCategory, CategoryDefinition> = {
  // 1. Nhóm Nối Cặp
  match: {
    key: "match",
    title: "Nối cặp",
    createTab: "match",
    listTab: "my-match-games",
    gameModes: [
      "match",
      "line",
      "conveyor-drop",
      "match-image-text",
      "match-image-image",
      "match-text-text",
    ],
  },

  // 2. Nhóm Toán Học
  choice: {
    key: "choice",
    title: "Toán học",
    createTab: "choice",
    listTab: "my-choice-games",
    gameModes: [
      "choice-shooter",
      "choice-egg",
      "choice",
    ],
  },

  // 3. Nhóm Lật Ảnh
  flip: {
    key: "flip",
    title: "Lật ảnh",
    createTab: "flip",
    listTab: "my-flip-games",
    gameModes: [
      "flip",
      "flip-image-image",
      "flip-image-text",
    ],
  },

  // 4. Nhóm Trắc Nghiệm
  quiz: {
    key: "quiz",
    title: "Trắc nghiệm",
    createTab: "quiz",
    listTab: "my-quiz-games",
    gameModes: [
      "candy-quiz",
      "treasure-hunt",
      "shooter-quiz",
      "quiz",
    ],
  },

  // 5. Nhóm Điền Ô Trống
  fill: {
    key: "fill",
    title: "Điền ô trống",
    createTab: "fill",
    listTab: "my-fill-games",
    gameModes: [
      "fill",
      "fill-blank",
    ],
  },
};

/**
 * Get all allowed gameModes for a category.
 */
export function getCategoryGameModes(category: TeacherGameCategory): string[] {
  return TEACHER_GAME_CATEGORIES[category]?.gameModes || [];
}

/**
 * Determine which category a given gameMode belongs to.
 */
export function getCategoryByGameMode(gameMode?: string | null): TeacherGameCategory {
  if (!gameMode) return "match";
  for (const cat of Object.values(TEACHER_GAME_CATEGORIES)) {
    if (cat.gameModes.includes(gameMode)) {
      return cat.key;
    }
  }
  return "match";
}
