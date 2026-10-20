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
    id?: string | null;
    title: string;
    instructions?: string | null;
    materialType?: string | null;
    grammarLesson?: string | null;
    grammarTopic?: string | null;
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
  const isDirectHtml = Boolean(
    item.assignment.instructions && 
    !item.assignment.instructions.trim().startsWith('{')
  );
  const isExplicitChildType = 
    kind === 'FLASHCARD' || 
    kind === 'GAME' || 
    kind === 'EXERCISE' || 
    kind === 'GRAMMAR';

  const isExplicitTheory = 
    kind === 'LESSON' || 
    targetUrl.includes('/grammar/') || 
    titleLower.includes('lý thuyết') ||
    titleLower.includes('ly thuyet') ||
    titleLower.includes('grammar lesson');

  const isExplicitReading = 
    !isExplicitTheory && (
      kind === 'READING' || 
      item.assignment.materialType === 'READING' || 
      kind === 'BOOK' || 
      item.assignment.materialType === 'BOOK' ||
      titleLower.includes('bài đọc') || 
      titleLower.includes('bai doc') || 
      titleLower.startsWith('reading:')
    );

  const isGrammarLesson = 
    !isExplicitChildType && !isExplicitReading && (
      kind === 'LESSON' || 
      item.assignment.materialType === 'LESSON' ||
      Boolean(item.assignment.grammarLesson) ||
      Boolean((item.assignment as any).grammarTopic) ||
      (item.assignment.id && item.assignment.id.startsWith('tiny-vocab-day-')) ||
      /^(?:day|ngày)\s*\d+/i.test(titleLower) ||
      isDirectHtml ||
      targetUrl.includes('/grammar/') || 
      titleLower.includes('lý thuyết') ||
      titleLower.includes('ly thuyet') ||
      titleLower.includes('grammar lesson')
    );

  if (isReview) return 'review';
  if (isExplicitReading) return 'reading';
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
      if (meta.lessonKey) {
        lessonKey = lessonKey || String(meta.lessonKey).toLowerCase().trim();
      }
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
  const grammarLessons: T[] = [];
  const readingLessons: T[] = [];
  const nonLessons: T[] = [];

  items.forEach((it) => {
    const stage = getItemStage(it);
    // Nếu là bài đọc thực hành có gán vào bài học cha (ví dụ [BÀI ĐỌC] có grammarLesson khác id của chính nó)
    // thì đây là bài tập con (nonLessons) thuộc bài cha đó chứ KHÔNG PHẢI là bài học cha!
    const isChildReadingExercise = 
      stage === 'reading' && 
      Boolean(it.assignment.grammarLesson && it.assignment.grammarLesson !== it.assignment.id);

    if (stage === 'lesson') {
      grammarLessons.push(it);
    } else if (stage === 'reading' && !isChildReadingExercise) {
      readingLessons.push(it);
    } else {
      nonLessons.push(it);
    }
  });

  // Nếu không có bài lý thuyết hay bài đọc nào trong nhóm, toàn bộ đưa vào supplementary
  if (grammarLessons.length === 0 && readingLessons.length === 0) {
    return {
      clusters: [],
      supplementaryItems: nonLessons,
    };
  }

  // Danh sách các bài học cha (bao gồm cả lý thuyết ngữ pháp và bài đọc / bài học từ vựng theo ngày)
  const parentLessons: T[] = [...grammarLessons, ...readingLessons];
  const clusters: { lesson: T; exercises: T[] }[] = parentLessons.map((lesson) => ({
    lesson,
    exercises: [],
  }));

  const normalizeKey = (k: string) => (k || '').toLowerCase().replace(/^day-\d+-/i, '').replace(/^(grammar|topic):/i, '').trim();

  const extractDayNumber = (str?: string | null): number | null => {
    if (!str) return null;
    const m = str.match(/(?:day|ngày)[-_\s]*0*(\d+)/i);
    if (m && m[1]) return parseInt(m[1], 10);
    return null;
  };

  const extractCoreTitle = (title?: string | null): string => {
    if (!title) return '';
    return title
      .toLowerCase()
      .replace(/^[📘📗📕📙📓📖\s]*\[?(?:lý thuyết|ly thuyet|grammar lesson|grammar exercise|bài tập|thực hành|bài đọc|đọc hiểu|shadowing|flashcard\s*(?:\(\d+\))?|game:[^:]+)\]?:?\s*/i, '')
      .replace(/^(?:day|ngày)\s*\d+[-_\s]*:?\s*/i, '')
      .replace(/^flashcard\s*(?:\(\d+\))?\s*:?\s*/i, '')
      .replace(/^game\s*:\s*[^–—\-:]+[-–—:]\s*/i, '')
      .replace(/\(.*?\)/g, '')
      .trim();
  };

  const lessonMetaList = clusters.map((c, idx) => {
    const l = c.lesson;
    const meta = extractGrammarKey(l);
    const id = (l.assignment.id || '').toLowerCase().trim();
    const lessonKey = (meta.lessonKey || l.assignment.grammarLesson || '').toLowerCase().trim();
    const topicKey = (meta.topicKey || (l.assignment as any).grammarTopic || '').toLowerCase().trim();
    const dayNumber = extractDayNumber(l.assignment.title) ?? extractDayNumber(id) ?? extractDayNumber(lessonKey);
    const coreTitle = extractCoreTitle(l.assignment.title);

    return {
      index: idx,
      id,
      lessonKey,
      topicKey,
      dayNumber,
      coreTitle,
      cleanTitle: meta.cleanTitle,
      normLessonKey: normalizeKey(lessonKey || id),
    };
  });
  const assignedExerciseIds = new Set<string>();

  // Gắn các bài tập / flashcard / game vào bài học cha phù hợp nhất
  nonLessons.forEach((exercise) => {
    const exStage = getItemStage(exercise);
    const exMeta = extractGrammarKey(exercise);
    const exId = (exercise.assignment.id || '').toLowerCase().trim();
    const exLessonKey = (exMeta.lessonKey || exercise.assignment.grammarLesson || '').toLowerCase().trim();
    const exTopicKey = (exMeta.topicKey || (exercise.assignment as any).grammarTopic || '').toLowerCase().trim();
    const exNormKey = normalizeKey(exLessonKey);
    const exDayNumber = extractDayNumber(exercise.assignment.title) ??
                        extractDayNumber(exLessonKey) ??
                        extractDayNumber(exId);
    const exCoreTitle = extractCoreTitle(exercise.assignment.title);

    let matchedClusterIndex = -1;

    // 1. Khớp theo ID bài học hoặc lessonKey (chính xác nhất từ database/instructions hoặc chuẩn hóa)
    if (exLessonKey) {
      matchedClusterIndex = lessonMetaList.findIndex(
        (l) => l.id === exLessonKey ||
               (l.lessonKey && l.lessonKey === exLessonKey) ||
               (l.normLessonKey && exNormKey && l.normLessonKey === exNormKey) ||
               (l.normLessonKey && exNormKey && (l.normLessonKey.includes(exNormKey) || exNormKey.includes(l.normLessonKey)))
      );
    }

    // 2. Khớp theo số Ngày (Day number: Day 01, Day 02, Day 03...)
    if (matchedClusterIndex === -1 && exDayNumber !== null) {
      matchedClusterIndex = lessonMetaList.findIndex((l) => l.dayNumber === exDayNumber);
    }

    // 3. Khớp theo coreTitle (tiêu đề cốt lõi bỏ qua tiền tố Day/Flashcard/Game)
    if (matchedClusterIndex === -1 && exCoreTitle) {
      matchedClusterIndex = lessonMetaList.findIndex((l) => {
        if (!l.coreTitle) return false;
        return (
          l.coreTitle === exCoreTitle ||
          l.coreTitle.includes(exCoreTitle) ||
          exCoreTitle.includes(l.coreTitle)
        );
      });
    }

    // 4. Khớp theo cleanTitle (nếu tiêu đề chứa nhau)
    if (matchedClusterIndex === -1 && exMeta.cleanTitle) {
      matchedClusterIndex = lessonMetaList.findIndex((l) => {
        if (!l.cleanTitle) return false;
        return (
          exMeta.cleanTitle.includes(l.cleanTitle) ||
          l.cleanTitle.includes(exMeta.cleanTitle)
        );
      });
    }

    // 5. Khớp theo topicKey nếu bài tập không có lessonKey riêng và trong nhóm có 1 bài lý thuyết cùng topic
    if (matchedClusterIndex === -1 && !exLessonKey && exTopicKey) {
      const candidates = lessonMetaList.filter((l) => l.topicKey === exTopicKey);
      if (candidates.length === 1) {
        matchedClusterIndex = candidates[0].index;
      }
    }

    // 6. Smart Fallback: Nếu trong nhóm chỉ có duy nhất 1 bài Lý thuyết/Bài học chính VÀ bài tập này KHÔNG PHẢI bài ôn tập (review)
    if (matchedClusterIndex === -1 && clusters.length === 1 && exStage !== 'review') {
      matchedClusterIndex = 0;
    }

    if (matchedClusterIndex !== -1) {
      clusters[matchedClusterIndex].exercises.push(exercise);
      assignedExerciseIds.add(exercise.assignment.id);
    }
  });

  // Sort child exercises within each cluster by pedagogical roadmap order (Flashcard -> Exercise -> Game -> Review)
  // And for games: Word Puzzle (subOrder: 1) -> Type (subOrder: 2)
  clusters.forEach((cluster) => {
    // Tự động sinh 3 Game cho bộ Flashcard nếu bài học có Flashcard mà chưa có game tương ứng
    const flashcardItem = cluster.exercises.find((ex) => {
      const stage = getItemStage(ex);
      return stage === 'flashcard' || ex.assignment.materialType === 'FLASHCARD';
    });

    if (flashcardItem) {
      let topicId = '';
      let topicSlug = '';
      let lessonKey = '';
      if (flashcardItem.assignment.instructions) {
        try {
          const meta = JSON.parse(flashcardItem.assignment.instructions);
          if (meta.topicId) topicId = meta.topicId;
          else if (meta.playUrl) {
            const u = new URL(meta.playUrl, 'http://localhost');
            const t = u.searchParams.get('topic') || u.searchParams.get('topicId');
            if (t) topicId = t;
          }
          if (meta.topicSlug) topicSlug = meta.topicSlug;
          if (meta.lessonKey) lessonKey = meta.lessonKey;
        } catch {}
      }
      if (!lessonKey) {
        lessonKey = (flashcardItem.assignment as any).grammarLesson || cluster.lesson.assignment.id;
      }
      if (!topicId) {
        topicId = flashcardItem.assignment.id;
      }

      const hasScramble = cluster.exercises.some((e) => {
        const title = (e.assignment.title || '').toLowerCase();
        if (title.includes('puzzle') || title.includes('ghép chữ') || title.includes('ghep chu')) return true;
        try {
          const m = JSON.parse(e.assignment.instructions || '{}');
          return m.mode === 'scramble' || m.gameMode === 'puzzle';
        } catch { return false; }
      });

      const hasType = cluster.exercises.some((e) => {
        const title = (e.assignment.title || '').toLowerCase();
        if (title.includes('type') || title.includes('gõ từ') || title.includes('go tu')) return true;
        try {
          const m = JSON.parse(e.assignment.instructions || '{}');
          return m.mode === 'type' || m.gameMode === 'type';
        } catch { return false; }
      });

      const hasMatch = cluster.exercises.some((e) => {
        const title = (e.assignment.title || '').toLowerCase();
        if (title.includes('nối thẻ') || title.includes('noi the') || title.includes('flashcard-match')) return true;
        try {
          const m = JSON.parse(e.assignment.instructions || '{}');
          return m.mode === 'match' || m.gameMode === 'match' || (m.playUrl && m.playUrl.includes('flashcard-match'));
        } catch { return false; }
      });

      if (!hasScramble) {
        cluster.exercises.push({
          ...flashcardItem,
          assignment: {
            ...flashcardItem.assignment,
            id: `${flashcardItem.assignment.id}__game_puzzle`,
            title: 'Game: Ghép chữ (Word Puzzle)',
            materialType: 'FLASHCARD',
            grammarLesson: lessonKey,
            instructions: JSON.stringify({
              kind: 'GAME',
              mode: 'scramble',
              gameMode: 'puzzle',
              subOrder: 1,
              topicId,
              topicSlug,
              lessonKey,
              playUrl: `/flashcards?topic=${topicId}&mode=scramble&embedded=true`,
            }),
          },
          isSubmitted: false,
          score: null,
          submittedAt: null,
        });
      }

      if (!hasType) {
        cluster.exercises.push({
          ...flashcardItem,
          assignment: {
            ...flashcardItem.assignment,
            id: `${flashcardItem.assignment.id}__game_type`,
            title: 'Game: Gõ từ (Type)',
            materialType: 'FLASHCARD',
            grammarLesson: lessonKey,
            instructions: JSON.stringify({
              kind: 'GAME',
              mode: 'type',
              gameMode: 'type',
              subOrder: 2,
              topicId,
              topicSlug,
              lessonKey,
              playUrl: `/flashcards?topic=${topicId}&mode=type&embedded=true`,
            }),
          },
          isSubmitted: false,
          score: null,
          submittedAt: null,
        });
      }

      if (!hasMatch) {
        cluster.exercises.push({
          ...flashcardItem,
          assignment: {
            ...flashcardItem.assignment,
            id: `${flashcardItem.assignment.id}__game_match`,
            title: 'Game: Nối thẻ',
            materialType: 'FLASHCARD',
            grammarLesson: lessonKey,
            instructions: JSON.stringify({
              kind: 'GAME',
              mode: 'match',
              gameMode: 'match',
              subOrder: 3,
              topicId,
              topicSlug,
              lessonKey,
              playUrl: `/student/game/flashcard-match?topicId=${topicId}`,
            }),
          },
          isSubmitted: false,
          score: null,
          submittedAt: null,
        });
      }
    }

    cluster.exercises.sort((a, b) => {
      const stageA = getItemStage(a);
      const stageB = getItemStage(b);

      // Thứ tự các bài con trong 1 ngày: Flashcard (1) -> Games (2) -> Bài đọc hiểu (3) -> Ôn tập (4)
      const CHILD_STAGE_ORDER: Record<string, number> = {
        flashcard: 1,
        game: 2,
        reading: 3,
        exercise: 3,
        review: 4,
      };

      const orderA = CHILD_STAGE_ORDER[stageA] ?? (STAGE_ROADMAP_ORDER[stageA] ?? 99);
      const orderB = CHILD_STAGE_ORDER[stageB] ?? (STAGE_ROADMAP_ORDER[stageB] ?? 99);
      if (orderA !== orderB) return orderA - orderB;

      const getGameSubOrder = (item: any) => {
        let subOrder = 99;
        if (item.assignment.instructions) {
          try {
            const meta = JSON.parse(item.assignment.instructions);
            if (typeof meta.subOrder === 'number') return meta.subOrder;
            if (meta.mode === 'scramble' || meta.gameMode === 'puzzle') return 1;
            if (meta.mode === 'type' || meta.gameMode === 'type') return 2;
            if (meta.mode === 'match' || meta.gameMode === 'match') return 3;
          } catch {}
        }
        const title = (item.assignment.title || '').toLowerCase();
        if (title.includes('puzzle') || title.includes('ghép chữ') || title.includes('ghep chu')) return 1;
        if (title.includes('type') || title.includes('gõ từ') || title.includes('go tu')) return 2;
        if (title.includes('nối thẻ') || title.includes('noi the') || title.includes('flashcard-match')) return 3;
        return subOrder;
      };

      const subA = getGameSubOrder(a);
      const subB = getGameSubOrder(b);
      if (subA !== subB) return subA - subB;

      const timeA = (a as any).assignedAt ? new Date((a as any).assignedAt).getTime() : 0;
      const timeB = (b as any).assignedAt ? new Date((b as any).assignedAt).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;

      return (a.assignment.title || '').localeCompare(b.assignment.title || '');
    });
  });

  const supplementaryItems = nonLessons.filter(
    (ex) => !assignedExerciseIds.has(ex.assignment.id)
  );

  return {
    clusters,
    supplementaryItems,
  };
}

