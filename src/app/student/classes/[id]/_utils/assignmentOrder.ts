export type ActivityStage = 'lesson' | 'flashcard' | 'exercise' | 'reading' | 'game' | 'review' | 'other';

/**
 * Lộ trình học tập chuẩn (Phương án 1):
 * 1. Lý thuyết (Học kiến thức mới trước)
 * 2. Từ vựng (Nạp từ khóa / Flashcards)
 * 3. Bài tập (Thực hành vận dụng)
 * 4. Đọc hiểu & Nói / Shadowing (Vận dụng tổng hợp)
 * 5. Trò chơi (Củng cố hào hứng qua Game)
 * 6. Ôn tập (Ôn luyện kiến thức cũ / tổng kết)
 * 7. Khác
 */
export const STAGE_ROADMAP_ORDER: Record<ActivityStage, number> = {
  lesson: 1,
  flashcard: 2,
  exercise: 3,
  reading: 4,
  game: 5,
  review: 6,
  other: 7,
};

/**
 * Xác định chặng học tập (stage) của một bài học từ metadata
 */
export function getItemStage(item: {
  assignment: {
    title: string;
    instructions?: string | null;
    materialType?: string | null;
  };
}): ActivityStage {
  let kind = (item.assignment.materialType || 'EXERCISE').toUpperCase();
  let isReview = false;
  let targetUrl = '';

  if (item.assignment.instructions) {
    try {
      const meta = JSON.parse(item.assignment.instructions);
      if (meta.playUrl) targetUrl = meta.playUrl;
      if (meta.kind) kind = meta.kind.toUpperCase();
      if (meta.section === 'REVIEW' || meta.isReview) isReview = true;
    } catch {}
  }

  const titleLower = (item.assignment.title || '').toLowerCase();
  const isGrammarLesson = 
    kind === 'LESSON' || 
    targetUrl.includes('/grammar/') || 
    titleLower.startsWith('grammar lesson') ||
    titleLower.startsWith('lý thuyết:');

  if (isReview) return 'review';
  if (isGrammarLesson || kind === 'LESSON') return 'lesson';
  if (kind === 'GAME') return 'game';
  if (kind === 'READING' || kind === 'BOOK') return 'reading';
  if (kind === 'FLASHCARD') return 'flashcard';
  if (kind === 'GRAMMAR' || kind === 'EXERCISE') return 'exercise';
  return 'exercise';
}

/**
 * Sắp xếp các bài học trong một nhóm theo đúng tiến trình học tập sư phạm (Server & Client an toàn)
 */
export function sortGroupItems<T extends {
  assignment: {
    title: string;
    instructions?: string | null;
    materialType?: string | null;
  };
  assignedAt?: string | null;
}>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const stageA = getItemStage(a);
    const stageB = getItemStage(b);

    const orderA = STAGE_ROADMAP_ORDER[stageA] ?? 99;
    const orderB = STAGE_ROADMAP_ORDER[stageB] ?? 99;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // Nếu cùng chặng: Sắp xếp theo ngày giao trước đến sau (assignedAt asc)
    const timeA = a.assignedAt ? new Date(a.assignedAt).getTime() : 0;
    const timeB = b.assignedAt ? new Date(b.assignedAt).getTime() : 0;
    if (timeA !== timeB) {
      return timeA - timeB;
    }

    return (a.assignment.title || '').localeCompare(b.assignment.title || '');
  });
}
