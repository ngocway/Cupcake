'use client';

import { useSyncExternalStore } from 'react';
import { getStudentGrammarLessonData } from '@/app/student/classes/actions';
import { getStudentQuizRunnerData, getBatchStudentQuizRunnerData } from '@/app/student/assignments/[id]/run/actions';
import { getStudentBookData } from '@/app/student/classes/actions';

// In-memory data caches (persist throughout the client session)
const grammarCache = new Map<string, any>();
const quizCache = new Map<string, any>();
const bookCache = new Map<string, any>();
const gameCache = new Set<string>();

// In-flight request promises to prevent duplicate simultaneous fetches
const pendingRequests = new Map<string, Promise<any>>();

// Preload Progress Store (assignmentId -> percent 0 to 100)
const progressMap = new Map<string, number>();
const progressListeners = new Set<() => void>();
let currentSnapshot: Record<string, number> = {};
let snapshotNeedsUpdate = true;
const emptyServerSnapshot: Record<string, number> = {};

function notifyProgressListeners() {
  snapshotNeedsUpdate = true;
  progressListeners.forEach(fn => fn());
}

export function subscribePreloadProgress(listener: () => void): () => void {
  progressListeners.add(listener);
  return () => {
    progressListeners.delete(listener);
  };
}

export function getPreloadProgressSnapshot(): Record<string, number> {
  if (snapshotNeedsUpdate) {
    const obj: Record<string, number> = {};
    progressMap.forEach((val, key) => {
      obj[key] = val;
    });
    currentSnapshot = obj;
    snapshotNeedsUpdate = false;
  }
  return currentSnapshot;
}

export function getServerPreloadProgressSnapshot(): Record<string, number> {
  return emptyServerSnapshot;
}

/**
 * React hook to subscribe to real-time assignment preloading progress.
 */
export function useAssignmentPreloadProgress(): Record<string, number> {
  return useSyncExternalStore(
    subscribePreloadProgress,
    getPreloadProgressSnapshot,
    getServerPreloadProgressSnapshot
  );
}

export function isAssignmentCached(id: string): boolean {
  return grammarCache.has(id) || quizCache.has(id) || bookCache.has(id) || gameCache.has(id) || (progressMap.get(id) === 100);
}

export function getAssignmentProgress(id: string): number {
  if (isAssignmentCached(id)) return 100;
  return progressMap.get(id) ?? 0;
}

export function setAssignmentProgress(id: string, progress: number) {
  const current = progressMap.get(id);
  const rounded = Math.min(100, Math.max(0, Math.round(progress)));
  if (current === rounded) return;
  progressMap.set(id, rounded);
  notifyProgressListeners();
}

export function getCachedGrammarData(id: string) {
  return grammarCache.get(id);
}
export function setCachedGrammarData(id: string, data: any) {
  grammarCache.set(id, data);
  setAssignmentProgress(id, 100);
}

export function getCachedQuizData(id: string) {
  if (quizCache.has(id)) return quizCache.get(id);
  const plainId = id.split('_')[0];
  if (quizCache.has(plainId)) return quizCache.get(plainId);
  for (const [k, v] of quizCache.entries()) {
    if (k.startsWith(plainId)) return v;
  }
  return undefined;
}
export function setCachedQuizData(id: string, data: any) {
  quizCache.set(id, data);
  setAssignmentProgress(id, 100);
}

export function getCachedBookData(id: string) {
  return bookCache.get(id);
}
export function setCachedBookData(id: string, data: any) {
  bookCache.set(id, data);
  setAssignmentProgress(id, 100);
}

export async function fetchGrammarDataWithCache(
  id: string, 
  force = false,
  initialData?: { instructions?: string | null; instructionsTranslations?: any }
): Promise<any> {
  const existing = grammarCache.get(id);
  if (!force && existing?.instructions && !String(existing.instructions).trim().startsWith('{')) {
    setAssignmentProgress(id, 100);
    return existing;
  }
  const cleanInitial = (initialData?.instructions && !initialData.instructions.trim().startsWith('{'))
    ? initialData.instructions
    : null;
  if (!force && cleanInitial) {
    const primed = {
      assignmentId: id,
      instructions: cleanInitial,
      instructionsTranslations: initialData?.instructionsTranslations || null,
    };
    grammarCache.set(id, primed);
    setAssignmentProgress(id, 100);
    return primed;
  }
  const key = `grammar_${id}`;
  if (!force && pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  const p = getStudentGrammarLessonData(id)
    .then(data => {
      grammarCache.set(id, data);
      setAssignmentProgress(id, 100);
      pendingRequests.delete(key);
      return data;
    })
    .catch(err => {
      pendingRequests.delete(key);
      throw err;
    });
  pendingRequests.set(key, p);
  return p;
}

export async function fetchQuizDataWithCache(
  id: string, 
  force = false, 
  forPreload = false,
  classId?: string,
  groupId?: string
): Promise<any> {
  const cacheKey = `${id}_${classId || ''}_${groupId || ''}`;
  if (!force && quizCache.has(cacheKey)) {
    setAssignmentProgress(id, 100);
    return quizCache.get(cacheKey);
  }
  const key = `quiz_${cacheKey}_${forPreload ? 'preload' : 'run'}`;
  if (!force && pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  const p = getStudentQuizRunnerData(id, force, forPreload, classId, groupId)
    .then(data => {
      // Preserve existing submissionId if prev had one
      const prev = quizCache.get(cacheKey);
      if (prev?.submissionId && !data.submissionId) {
        data.submissionId = prev.submissionId;
        data.submissionScore = prev.submissionScore;
      }
      quizCache.set(id, data);
      quizCache.set(cacheKey, data);
      setAssignmentProgress(id, 100);
      pendingRequests.delete(key);
      return data;
    })
    .catch(err => {
      pendingRequests.delete(key);
      throw err;
    });
  pendingRequests.set(key, p);
  return p;
}

export async function fetchBookDataWithCache(id: string, force = false): Promise<any> {
  if (!force && bookCache.has(id)) {
    setAssignmentProgress(id, 100);
    return bookCache.get(id);
  }
  const key = `book_${id}`;
  if (!force && pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  const p = getStudentBookData(id)
    .then(data => {
      bookCache.set(id, data);
      setAssignmentProgress(id, 100);
      pendingRequests.delete(key);
      return data;
    })
    .catch(err => {
      pendingRequests.delete(key);
      throw err;
    });
  pendingRequests.set(key, p);
  return p;
}

// ══════════════════════════════════════════════════════════════════
// SMART CONCURRENCY-LIMITED PRELOAD QUEUE & PROGRESS SIMULATION
// ══════════════════════════════════════════════════════════════════

interface QueueEntry {
  item: {
    assignment: {
      id: string;
      materialType: string;
      instructions?: string | null;
      title: string;
    };
  };
  priority: number;
  classId?: string;
  groupId?: string;
}

const preloadQueue: QueueEntry[] = [];
const inProgressAids = new Set<string>();
const smoothTimers = new Map<string, ReturnType<typeof setInterval>>();
// Pure sequential preload: exactly 1 item at a time to prevent DB spikes and maximize responsiveness
const MAX_CONCURRENT_PRELOADS = 1;

function startSmoothProgress(id: string) {
  if (smoothTimers.has(id)) return;
  setAssignmentProgress(id, 20);
  let current = 20;
  const startTime = Date.now();
  const timer = setInterval(() => {
    const elapsed = Date.now() - startTime;
    if (elapsed < 1000) {
      // First 1s: smoothly advance 20% -> 60%
      current = Math.min(60, Math.round(20 + (elapsed / 1000) * 40));
    } else if (elapsed < 2500) {
      // 1s - 2.5s: advance steadily 60% -> 85%
      current = Math.min(85, Math.round(60 + ((elapsed - 1000) / 1500) * 25));
    } else if (elapsed < 5000) {
      // 2.5s - 5s: gentle continuous progression 85% -> 95%
      current = Math.min(95, Math.round(85 + ((elapsed - 2500) / 2500) * 10));
    } else {
      // Beyond 5s: slow crawl up to 98% (never completely freezes)
      current = Math.min(98, current + 1);
    }
    setAssignmentProgress(id, current);
  }, 100);
  smoothTimers.set(id, timer);
}

function finishSmoothProgress(id: string, success: boolean) {
  const timer = smoothTimers.get(id);
  if (timer) {
    clearInterval(timer);
    smoothTimers.delete(id);
  }
  setAssignmentProgress(id, success ? 100 : 0);
}

function launchPreloadItem(entry: QueueEntry) {
  const item = entry.item;
  const aid = item.assignment.id;
  const classId = entry.classId;
  const groupId = entry.groupId;

  if (isAssignmentCached(aid)) {
    setAssignmentProgress(aid, 100);
    return;
  }
  if (inProgressAids.has(aid)) {
    return;
  }

  inProgressAids.add(aid);
  startSmoothProgress(aid);

  const matType = item.assignment.materialType;
  let kind = matType;
  if (item.assignment.instructions) {
    try {
      const meta = JSON.parse(item.assignment.instructions);
      if (meta.kind) kind = meta.kind;
    } catch {}
  }

  const titleLower = item.assignment.title.toLowerCase();
  const isGame = kind === 'GAME' || matType === 'GAME';
  const isGrammar = !isGame && (
    kind === 'LESSON' ||
    matType === 'LESSON' ||
    titleLower.includes('lý thuyết') ||
    titleLower.includes('ly thuyet') ||
    titleLower.includes('grammar lesson') ||
    (item.assignment.instructions && item.assignment.instructions.includes('/grammar/'))
  );
  const isBook = !isGame && !isGrammar && (
    kind === 'READING' ||
    kind === 'BOOK' ||
    matType === 'READING' ||
    (item.assignment.instructions && item.assignment.instructions.includes('/student/books/'))
  );

  let fetchPromise: Promise<any>;
  if (isGame) {
    gameCache.add(aid);
    fetchPromise = new Promise(resolve => setTimeout(resolve, 200));
  } else if (isGrammar) {
    const ins = item.assignment.instructions?.trim();
    const isDirectHtml = Boolean(ins && !ins.startsWith('{'));
    if (isDirectHtml) {
      grammarCache.set(aid, {
        assignmentId: aid,
        instructions: item.assignment.instructions,
        instructionsTranslations: (item.assignment as any).instructionsTranslations || null,
      });
      finishSmoothProgress(aid, true);
      inProgressAids.delete(aid);
      return;
    }
    fetchPromise = fetchGrammarDataWithCache(aid);
  } else if (isBook) {
    fetchPromise = fetchBookDataWithCache(aid);
  } else {
    fetchPromise = fetchQuizDataWithCache(aid, false, true, classId, groupId);
  }

  fetchPromise
    .then(() => {
      finishSmoothProgress(aid, true);
    })
    .catch((err) => {
      console.warn(`[Preload] Assignment ${aid} failed to preload:`, err);
      finishSmoothProgress(aid, false);
    })
    .finally(() => {
      inProgressAids.delete(aid);
      processPreloadQueue();
    });
}

function processPreloadQueue(forceFirst = false) {
  if (forceFirst && preloadQueue.length > 0) {
    const entry = preloadQueue.shift();
    if (entry) {
      launchPreloadItem(entry);
    }
  }
  while (inProgressAids.size < MAX_CONCURRENT_PRELOADS && preloadQueue.length > 0) {
    const entry = preloadQueue.shift();
    if (!entry) break;
    launchPreloadItem(entry);
  }
}

/**
 * Clear pending preload queue when switching groups or user selections.
 */
export function clearPreloadQueue() {
  preloadQueue.length = 0;
}

/**
 * High-speed batch preload: Fetches all remaining exercises of a group in 1 single Server Action.
 */
export async function batchPreloadGroupQuizzes(
  exerciseIds: string[],
  classId?: string,
  groupId?: string
) {
  const needed = exerciseIds.filter(id => !isAssignmentCached(id) && !inProgressAids.has(id));
  if (needed.length === 0) return;

  needed.forEach(id => {
    inProgressAids.add(id);
    startSmoothProgress(id);
  });

  try {
    const results = await getBatchStudentQuizRunnerData(needed, classId, groupId);
    needed.forEach(id => {
      const data = results[id];
      if (data) {
        const cacheKey = `${id}_${classId || ''}_${groupId || ''}`;
        quizCache.set(id, data);
        quizCache.set(cacheKey, data);
        finishSmoothProgress(id, true);
      } else {
        finishSmoothProgress(id, false);
      }
    });
  } catch (err) {
    console.warn('[Preload] Batch preload failed:', err);
    needed.forEach(id => finishSmoothProgress(id, false));
  } finally {
    needed.forEach(id => inProgressAids.delete(id));
  }
}

/**
 * Queue all items in an expanded group for preloading:
 * 1. Priority 1: Priority item (active item or immediate next uncompleted item) loads first (~1s).
 * 2. Priority 2: Remaining exercises of the group are batch-loaded together in 1 single network request (~2s).
 */
export function queueGroupForPreload(
  items: Array<{
    assignment: {
      id: string;
      materialType: string;
      instructions?: string | null;
      title: string;
    };
    isSubmitted?: boolean;
  }>,
  activeAssignmentId?: string | null,
  classId?: string,
  groupId?: string
) {
  if (!items || items.length === 0) return;

  const exerciseItems: typeof items = [];
  const otherItems: typeof items = [];

  items.forEach(item => {
    const aid = item.assignment?.id;
    if (!aid || aid.startsWith('locked_') || isAssignmentCached(aid)) {
      if (aid) setAssignmentProgress(aid, 100);
      return;
    }

    const matType = item.assignment.materialType;
    let kind = matType;
    if (item.assignment.instructions) {
      try {
        const meta = JSON.parse(item.assignment.instructions);
        if (meta.kind) kind = meta.kind;
      } catch {}
    }
    const titleLower = item.assignment.title.toLowerCase();
    const isGame = kind === 'GAME' || matType === 'GAME';
    const isGrammar = !isGame && (
      kind === 'LESSON' ||
      matType === 'LESSON' ||
      titleLower.includes('lý thuyết') ||
      titleLower.includes('ly thuyet') ||
      titleLower.includes('grammar lesson') ||
      (item.assignment.instructions && item.assignment.instructions.includes('/grammar/'))
    );
    const isBook = !isGame && !isGrammar && (
      kind === 'READING' ||
      kind === 'BOOK' ||
      matType === 'READING' ||
      (item.assignment.instructions && item.assignment.instructions.includes('/student/books/'))
    );

    if (isGame || isGrammar || isBook) {
      otherItems.push(item);
    } else {
      exerciseItems.push(item);
    }
  });

  // Preload other items (Grammar / Game / Book) quickly
  otherItems.forEach(item => {
    const aid = item.assignment.id;
    const matType = item.assignment.materialType;
    let kind = matType;
    if (item.assignment.instructions) {
      try {
        const meta = JSON.parse(item.assignment.instructions);
        if (meta.kind) kind = meta.kind;
      } catch {}
    }
    const titleLower = item.assignment.title.toLowerCase();
    const isGrammar = (
      kind === 'LESSON' ||
      matType === 'LESSON' ||
      titleLower.includes('lý thuyết') ||
      titleLower.includes('ly thuyet') ||
      titleLower.includes('grammar lesson') ||
      (item.assignment.instructions && item.assignment.instructions.includes('/grammar/'))
    );
    const ins = item.assignment.instructions?.trim();
    const isDirectHtml = Boolean(ins && !ins.startsWith('{'));
    if (isGrammar && isDirectHtml) {
      grammarCache.set(aid, {
        assignmentId: aid,
        instructions: item.assignment.instructions,
        instructionsTranslations: (item.assignment as any).instructionsTranslations || null,
      });
      setAssignmentProgress(aid, 100);
      return;
    }
    prefetchAssignmentData(item);
  });

  if (exerciseItems.length === 0) return;

  // 1. Identify priority item: active exercise or first uncompleted exercise
  const activeExercise = exerciseItems.find(i => i.assignment.id === activeAssignmentId);
  const firstUncompleted = exerciseItems.find(i => !i.isSubmitted);
  const priorityItem = activeExercise || firstUncompleted || exerciseItems[0];

  // 2. Build ordered list: priority item first, then remaining exercises in natural sequence
  const orderedExerciseItems: typeof exerciseItems = [];
  if (priorityItem) {
    orderedExerciseItems.push(priorityItem);
  }
  exerciseItems.forEach(it => {
    if (it.assignment.id !== priorityItem?.assignment.id) {
      orderedExerciseItems.push(it);
    }
  });

  // 3. Enqueue all exercises sequentially with descending priority (100, 90, 80...)
  orderedExerciseItems.forEach((it, idx) => {
    const aid = it.assignment.id;
    if (isAssignmentCached(aid)) {
      setAssignmentProgress(aid, 100);
      return;
    }
    const priority = 100 - idx * 10;
    const existingIdx = preloadQueue.findIndex(e => e.item.assignment.id === aid);
    if (existingIdx >= 0) {
      preloadQueue[existingIdx].priority = priority;
      if (classId) preloadQueue[existingIdx].classId = classId;
      if (groupId) preloadQueue[existingIdx].groupId = groupId;
    } else {
      preloadQueue.push({ item: it, priority, classId, groupId });
    }
  });

  // Sort queue by priority descending so the active/next item always executes first
  preloadQueue.sort((a, b) => b.priority - a.priority);

  // Trigger sequential worker (only 1 item runs at a time due to MAX_CONCURRENT_PRELOADS = 1)
  processPreloadQueue();
}

/**
 * Promote an assignment to top priority (e.g. when user clicks on it).
 */
export function promoteAssignmentPriority(assignmentId: string, classId?: string, groupId?: string) {
  if (!assignmentId) return;
  if (isAssignmentCached(assignmentId)) {
    setAssignmentProgress(assignmentId, 100);
    return;
  }
  const existingIdx = preloadQueue.findIndex(e => e.item.assignment.id === assignmentId);
  if (existingIdx >= 0) {
    const [entry] = preloadQueue.splice(existingIdx, 1);
    entry.priority = 9999;
    if (classId) entry.classId = classId;
    if (groupId) entry.groupId = groupId;
    preloadQueue.unshift(entry);
  }
  // Express Lane: Immediately start user-clicked item without waiting in queue
  processPreloadQueue(true);
}

/**
 * Pre-fetches a single assignment's data into memory silently.
 */
export function prefetchAssignmentData(
  item: { assignment: { id: string; materialType: string; instructions?: string | null; title: string } },
  classId?: string,
  groupId?: string
) {
  const aid = item?.assignment?.id;
  if (!aid || aid.startsWith('locked_')) return;

  if (isAssignmentCached(aid)) {
    setAssignmentProgress(aid, 100);
    return;
  }

  const existingIdx = preloadQueue.findIndex(e => e.item.assignment.id === aid);
  if (existingIdx >= 0) {
    preloadQueue[existingIdx].priority = 95;
    if (classId) preloadQueue[existingIdx].classId = classId;
    if (groupId) preloadQueue[existingIdx].groupId = groupId;
  } else {
    preloadQueue.push({ item, priority: 95, classId, groupId });
  }
  preloadQueue.sort((a, b) => b.priority - a.priority);
  processPreloadQueue();
}
