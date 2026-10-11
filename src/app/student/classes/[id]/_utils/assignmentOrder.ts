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
    titleLower.includes('lý thuyết') ||
    titleLower.includes('ly thuyet') ||
    titleLower.includes('grammar lesson');

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

/**
 * Kiểm tra xem bài học có được tính vào điểm số và % hoàn thành nhóm bài không.
 * Quy tắc:
 * - CHỈ CÓ: Grammar exercises (exercise, grammar, review trắc nghiệm) và Reading (bài đọc hiểu) là ĐƯỢC TÍNH.
 * - KHÔNG TÍNH: Lesson grammar (lý thuyết), Game (trò chơi), Shadowing / Book, Flashcard.
 */
export function isScoredAssignment(item: {
  assignment: {
    title: string;
    instructions?: string | null;
    materialType?: string | null;
  };
}): boolean {
  let kind = (item.assignment.materialType || 'EXERCISE').toUpperCase();
  let targetUrl = '';
  if (item.assignment.instructions) {
    try {
      const meta = JSON.parse(item.assignment.instructions);
      if (meta.playUrl) targetUrl = meta.playUrl;
      if (meta.kind) kind = meta.kind.toUpperCase();
    } catch {}
  }
  const titleLower = (item.assignment.title || '').toLowerCase();
  const isGrammarLesson = 
    kind === 'LESSON' || 
    targetUrl.includes('/grammar/') || 
    titleLower.includes('lý thuyết') ||
    titleLower.includes('ly thuyet') ||
    titleLower.includes('grammar lesson');

  // Lý thuyết không tính
  if (isGrammarLesson || kind === 'LESSON') return false;

  // Game không tính
  if (kind === 'GAME') return false;

  // Shadowing / Book không tính
  if (kind === 'BOOK' || targetUrl.includes('/student/books/')) return false;

  // Flashcard không tính
  if (kind === 'FLASHCARD') return false;

  // Chỉ tính Grammar Exercise (kể cả review trắc nghiệm) và Reading
  if (kind === 'EXERCISE' || kind === 'GRAMMAR' || kind === 'READING') return true;

  return false;
}

/**
 * Trích xuất identifier của bài ngữ pháp từ assignment (grammarLesson hoặc từ rawId/playUrl/title)
 */
export function extractGrammarKey(item: {
  assignment: {
    title: string;
    instructions?: string | null;
    grammarLesson?: string | null;
    grammarTopic?: string | null;
  };
}): { lessonKey: string; topicKey: string; cleanTitle: string } {
  let lessonKey = (item.assignment.grammarLesson || '').toLowerCase().trim();
  let topicKey = (item.assignment.grammarTopic || '').toLowerCase().trim();

  if (item.assignment.instructions) {
    try {
      const meta = JSON.parse(item.assignment.instructions);
      if (meta.rawId) {
        const raw = String(meta.rawId).toLowerCase();
        if (raw.startsWith('grammar:')) {
          const parts = raw.replace(/^grammar:/, '').split(':');
          if (parts.length >= 2) {
            topicKey = topicKey || parts[0];
            lessonKey = lessonKey || parts[1];
          } else if (parts.length === 1) {
            lessonKey = lessonKey || parts[0];
          }
        }
      }
      if (meta.playUrl) {
        const parts = String(meta.playUrl).toLowerCase().replace(/^\/grammar\//, '').split('/');
        if (parts.length >= 2) {
          topicKey = topicKey || parts[0];
          lessonKey = lessonKey || parts[1].split('?')[0];
        }
      }
    } catch {}
  }

  // Chuẩn hóa tiêu đề để so khớp tương đồng (loại bỏ tiền tố bài giảng, emoji, [lý thuyết], ngày XX)
  const cleanTitle = (item.assignment.title || '')
    .toLowerCase()
    .replace(/^[📘📗📕📙📓📖\s]*\[?(?:lý thuyết|ly thuyet|grammar lesson|grammar exercise|bài tập|thực hành)\]?:?\s*/i, '')
    .replace(/^ngày\s*\d+\s*:\s*/i, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[:\-–—].*$/, '')
    .trim();

  return { lessonKey, topicKey, cleanTitle };
}

export interface GroupTreeStructure<T> {
  clusters: {
    lesson: T;
    exercises: T[];
  }[];
  supplementaryItems: T[];
}

/**
 * Xây dựng cây phân cấp Cha (Lý thuyết) - Con (Bài tập liên quan) cho một nhóm bài học
 */
export function buildGroupTree<T extends {
  assignment: {
    id: string;
    title: string;
    instructions?: string | null;
    materialType?: string | null;
    grammarLesson?: string | null;
    grammarTopic?: string | null;
  };
}>(items: T[]): GroupTreeStructure<T> {
  const lessons: T[] = [];
  const nonLessons: T[] = [];

  items.forEach((it) => {
    if (getItemStage(it) === 'lesson') {
      lessons.push(it);
    } else {
      nonLessons.push(it);
    }
  });

  // Nếu không có bài lý thuyết nào trong nhóm, toàn bộ đưa vào supplementary
  if (lessons.length === 0) {
    return {
      clusters: [],
      supplementaryItems: nonLessons,
    };
  }

  const clusters: { lesson: T; exercises: T[] }[] = lessons.map((lesson) => ({
    lesson,
    exercises: [],
  }));

  const normalizeKey = (k: string) => (k || '').toLowerCase().replace(/^day-\d+-/i, '').replace(/^(grammar|topic):/i, '').trim();

  const lessonMetaList = lessons.map((l) => {
    const meta = extractGrammarKey(l);
    return {
      ...meta,
      normLessonKey: normalizeKey(meta.lessonKey),
    };
  });
  const assignedExerciseIds = new Set<string>();

  // Gắn các bài tập vào bài lý thuyết phù hợp nhất
  nonLessons.forEach((exercise) => {
    const exStage = getItemStage(exercise);
    const exMeta = extractGrammarKey(exercise);
    const exNormKey = normalizeKey(exMeta.lessonKey);
    let matchedClusterIndex = -1;

    // 1. Khớp theo lessonKey (chính xác nhất từ database/instructions hoặc chuẩn hóa bỏ day-XX-)
    if (exNormKey) {
      matchedClusterIndex = lessonMetaList.findIndex(
        (l) => (l.normLessonKey && l.normLessonKey === exNormKey) ||
               (l.lessonKey && (l.lessonKey.includes(exNormKey) || exNormKey.includes(l.normLessonKey)))
      );
    }

    // 2. Khớp theo cleanTitle (nếu tiêu đề chứa nhau)
    if (matchedClusterIndex === -1 && exMeta.cleanTitle) {
      matchedClusterIndex = lessonMetaList.findIndex((l) => {
        if (!l.cleanTitle) return false;
        return (
          exMeta.cleanTitle.includes(l.cleanTitle) ||
          l.cleanTitle.includes(exMeta.cleanTitle)
        );
      });
    }

    // 3. Khớp theo topicKey nếu bài tập không có lessonKey riêng và trong nhóm có 1 bài lý thuyết cùng topic
    if (matchedClusterIndex === -1 && !exMeta.lessonKey && exMeta.topicKey) {
      const candidates = lessonMetaList
        .map((l, idx) => (l.topicKey === exMeta.topicKey ? idx : -1))
        .filter((idx) => idx !== -1);
      if (candidates.length === 1) {
        matchedClusterIndex = candidates[0];
      }
    }

    // 4. Smart Fallback: Nếu trong nhóm chỉ có duy nhất 1 bài Lý thuyết VÀ bài tập này KHÔNG PHẢI bài ôn tập (review)
    // (tức là bài thực hành mới của ngày hôm đó), tự động gán vào làm con của bài lý thuyết duy nhất đó!
    if (matchedClusterIndex === -1 && lessons.length === 1 && exStage !== 'review') {
      matchedClusterIndex = 0;
    }

    if (matchedClusterIndex !== -1) {
      clusters[matchedClusterIndex].exercises.push(exercise);
      assignedExerciseIds.add(exercise.assignment.id);
    }
  });

  const supplementaryItems = nonLessons.filter(
    (ex) => !assignedExerciseIds.has(ex.assignment.id)
  );

  return {
    clusters,
    supplementaryItems,
  };
}

