'use client';

import { useSyncExternalStore } from 'react';
import { getStudentGrammarLessonData } from '@/app/student/classes/actions';
import { getStudentQuizRunnerData } from '@/app/student/assignments/[id]/run/actions';
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
  return quizCache.get(id);
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

export async function fetchGrammarDataWithCache(id: string, force = false): Promise<any> {
  if (!force && grammarCache.has(id)) {
    setAssignmentProgress(id, 100);
    return grammarCache.get(id);
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
}

const preloadQueue: QueueEntry[] = [];
const inProgressAids = new Set<string>();
const smoothTimers = new Map<string, ReturnType<typeof setInterval>>();
const MAX_CONCURRENT_PRELOADS = 3;

function startSmoothProgress(id: string) {
  if (smoothTimers.has(id)) return;
  setAssignmentProgress(id, 20);
  let current = 20;
  const timer = setInterval(() => {
    // Fast, responsive asymptotic progress approach
    current = Math.min(92, Math.round(current + (92 - current) * 0.3));
    setAssignmentProgress(id, current);
    if (current >= 91) {
      clearInterval(timer);
      smoothTimers.delete(id);
    }
  }, 90);
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

function processPreloadQueue() {
  while (inProgressAids.size < MAX_CONCURRENT_PRELOADS && preloadQueue.length > 0) {
    const entry = preloadQueue.shift();
    if (!entry) break;
    const item = entry.item;
    const aid = item.assignment.id;

    if (isAssignmentCached(aid)) {
      setAssignmentProgress(aid, 100);
      continue;
    }

    if (inProgressAids.has(aid)) {
      continue;
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
      titleLower.startsWith('grammar lesson') ||
      titleLower.startsWith('lý thuyết:') ||
      (item.assignment.instructions && item.assignment.instructions.includes('/grammar/'))
    );
    const isBook = !isGame && !isGrammar && (
      kind === 'READING' ||
      kind === 'BOOK' ||
      matType === 'READING' ||
      (item.assignment.instructions && item.assignment.instructions.includes('/student/books/'))
    );
    const isExercise = !isGame && !isGrammar && !isBook;

    let fetchPromise: Promise<any>;
    if (isGame) {
      gameCache.add(aid);
      fetchPromise = new Promise(resolve => setTimeout(resolve, 200));
    } else if (isGrammar) {
      fetchPromise = fetchGrammarDataWithCache(aid);
    } else if (isBook) {
      fetchPromise = fetchBookDataWithCache(aid);
    } else {
      fetchPromise = fetchQuizDataWithCache(aid, false, true);
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
}

/**
 * Queue all items in an expanded group for preloading with priority ordering:
 * 1. Active item (Priority 100)
 * 2. Next uncompleted item (Priority 80)
 * 3. Remaining items in order (Priority 50 - index)
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
  activeAssignmentId?: string | null
) {
  if (!items || items.length === 0) return;

  // Find next uncompleted item
  const uncompletedIndex = items.findIndex(i => !i.isSubmitted);
  const uncompletedId = uncompletedIndex >= 0 ? items[uncompletedIndex]?.assignment?.id : null;

  items.forEach((item, index) => {
    const aid = item.assignment?.id;
    if (!aid || aid.startsWith('locked_')) return;

    if (isAssignmentCached(aid)) {
      setAssignmentProgress(aid, 100);
      return;
    }

    let priority = 50 - index;
    if (aid === activeAssignmentId) {
      priority = 100;
    } else if (aid === uncompletedId) {
      priority = 80;
    }

    const existingIdx = preloadQueue.findIndex(e => e.item.assignment.id === aid);
    if (existingIdx >= 0) {
      if (priority > preloadQueue[existingIdx].priority) {
        preloadQueue[existingIdx].priority = priority;
      }
    } else {
      preloadQueue.push({ item, priority });
    }
  });

  // Sort queue by priority descending
  preloadQueue.sort((a, b) => b.priority - a.priority);
  processPreloadQueue();
}

/**
 * Promote an assignment to top priority (e.g. when user clicks on it).
 */
export function promoteAssignmentPriority(assignmentId: string) {
  if (!assignmentId) return;
  const existingIdx = preloadQueue.findIndex(e => e.item.assignment.id === assignmentId);
  if (existingIdx >= 0) {
    preloadQueue[existingIdx].priority = 999;
    preloadQueue.sort((a, b) => b.priority - a.priority);
  }
  processPreloadQueue();
}

/**
 * Pre-fetches a single assignment's data into memory silently.
 */
export function prefetchAssignmentData(item: { assignment: { id: string; materialType: string; instructions?: string | null; title: string } }) {
  const aid = item?.assignment?.id;
  if (!aid || aid.startsWith('locked_')) return;

  if (isAssignmentCached(aid)) {
    setAssignmentProgress(aid, 100);
    return;
  }

  const existingIdx = preloadQueue.findIndex(e => e.item.assignment.id === aid);
  if (existingIdx >= 0) {
    preloadQueue[existingIdx].priority = 95;
  } else {
    preloadQueue.push({ item, priority: 95 });
  }
  preloadQueue.sort((a, b) => b.priority - a.priority);
  processPreloadQueue();
}
