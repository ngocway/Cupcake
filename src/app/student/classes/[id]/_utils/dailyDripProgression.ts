import { isScoredAssignment } from './assignmentOrder';

export interface GroupWithSubmissions {
  id: string;
  title: string;
  orderIndex?: number;
  createdAt?: string | null;
  prerequisiteGroupId?: string | null;
  prerequisiteGroupTitle?: string | null;
  unlockThreshold?: number;
  forceUnlocked?: boolean;
  isLocked?: boolean;
  lockReason?: string;
  isWaiting5Am?: boolean;
  unlockAt?: string | null;
  items: Array<{
    assignment: {
      id: string;
      title: string;
      materialType: string;
      instructions?: string | null;
      questionsCount?: number;
    };
    isSubmitted: boolean;
    score?: number | null;
    submittedAt?: string | null;
  }>;
}

/**
 * Calculates the next 05:00 AM (Vietnam Time, UTC+7) unlock timestamp.
 * Rule (Option A):
 * - If completion was between 00:00 and 04:59 AM (VN time): unlocks at 05:00 AM same day.
 * - If completion was at 05:00 AM or later (VN time): unlocks at 05:00 AM the next day.
 */
export function getNext5AmUnlockDate(completionDate: Date): Date {
  const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
  // Convert completionDate to VN local date components
  const vnCompletion = new Date(completionDate.getTime() + VN_OFFSET_MS);

  const vnYear = vnCompletion.getUTCFullYear();
  const vnMonth = vnCompletion.getUTCMonth();
  const vnDay = vnCompletion.getUTCDate();
  const vnHour = vnCompletion.getUTCHours();

  let targetDay = vnDay;
  if (vnHour >= 5) {
    targetDay += 1;
  }

  // 05:00:00.000 in VN time is targetDay at 05:00:00 UTC - 7 hours
  const targetVnTimestamp = Date.UTC(vnYear, vnMonth, targetDay, 5, 0, 0, 0);
  return new Date(targetVnTimestamp - VN_OFFSET_MS);
}

/**
 * Checks if a group is 100% completed according to the rule:
 * - Must complete 100% of scored assignments (Grammar exercises & Reading questions).
 * - Non-scored items (theory, games, flashcards, shadowing) are optional.
 * - If a group has 0 scored items, all existing items in that group must be submitted.
 */
export function isGroupFullyCompleted(group: GroupWithSubmissions): boolean {
  if (!group.items || group.items.length === 0) return false;

  const scoredItems = group.items.filter(isScoredAssignment);

  if (scoredItems.length > 0) {
    const completedScored = scoredItems.filter((item) => item.isSubmitted).length;
    return completedScored === scoredItems.length;
  }

  // If no scored items, check if all items in the group have been submitted
  return group.items.every((item) => item.isSubmitted);
}

/**
 * Gets the completion timestamp of a group (the latest submittedAt among scored items).
 */
export function getGroupCompletionTime(group: GroupWithSubmissions): Date {
  const scoredItems = group.items.filter(isScoredAssignment);
  const itemsToCheck = scoredItems.length > 0 ? scoredItems : group.items;

  let latestTime = 0;
  for (const item of itemsToCheck) {
    if (item.submittedAt) {
      const t = new Date(item.submittedAt).getTime();
      if (t > latestTime) latestTime = t;
    }
  }

  // Fallback to now if no timestamp is present
  return latestTime > 0 ? new Date(latestTime) : new Date();
}

export interface DailyDripResult<T extends GroupWithSubmissions> {
  visibleGroups: T[];
  highestUnlockedIndex: number;
  pendingUnlockGroupIndex: number | null;
  pendingUnlockTime: Date | null;
}

/**
 * Applies the Daily Drip progression rule to a list of groups for a student:
 * 1. Day 1 is always unlocked.
 * 2. Finishing a day unlocks the next day at 05:00 AM (same day if completed 00:00-04:59, next day if >= 05:00).
 * 3. Sliding window: Student always sees up to 2 locked days ahead.
 *    - All days up to highestUnlockedIndex are UNLOCKED.
 *    - highestUnlockedIndex + 1 and highestUnlockedIndex + 2 are LOCKED PREVIEW.
 *    - highestUnlockedIndex + 3 and beyond are HIDDEN.
 */
export function applyDailyDripProgression<T extends GroupWithSubmissions>(
  groups: T[],
  options?: {
    now?: Date;
    isTeacherOrAdmin?: boolean;
  }
): DailyDripResult<T> {
  const now = options?.now ?? new Date();
  const isTeacherOrAdmin = options?.isTeacherOrAdmin ?? false;

  if (groups.length === 0) {
    return {
      visibleGroups: [],
      highestUnlockedIndex: -1,
      pendingUnlockGroupIndex: null,
      pendingUnlockTime: null,
    };
  }

  // If Teacher or Admin: do not lock or hide any groups by drip
  if (isTeacherOrAdmin) {
    groups.forEach((g) => {
      g.isLocked = false;
      g.isWaiting5Am = false;
      g.unlockAt = null;
    });
    return {
      visibleGroups: groups,
      highestUnlockedIndex: groups.length - 1,
      pendingUnlockGroupIndex: null,
      pendingUnlockTime: null,
    };
  }

  let highestUnlockedIndex = 0; // Day 1 (index 0) is unlocked by default
  let pendingUnlockGroupIndex: number | null = null;
  let pendingUnlockTime: Date | null = null;

  // Evaluate sequential completion of groups
  for (let i = 0; i < groups.length; i++) {
    const grp = groups[i];
    const completed = isGroupFullyCompleted(grp);

    if (i === highestUnlockedIndex) {
      if (completed) {
        if (i + 1 < groups.length) {
          const compTime = getGroupCompletionTime(grp);
          const unlockTime = getNext5AmUnlockDate(compTime);

          if (now.getTime() >= unlockTime.getTime()) {
            // Already 05:00 AM or later -> unlock next group and continue loop
            highestUnlockedIndex = i + 1;
          } else {
            // Waiting for 05:00 AM!
            pendingUnlockGroupIndex = i + 1;
            pendingUnlockTime = unlockTime;
            break;
          }
        }
      } else {
        // Group i not yet fully completed -> stop advancing unlocked index
        break;
      }
    }
  }

  // Calculate visible range (Sliding Window: highestUnlockedIndex + 2 locked days ahead)
  // Example: highestUnlockedIndex = 0 -> visible indexes: 0, 1, 2 (total 3 days)
  const maxVisibleIndex = Math.min(groups.length - 1, highestUnlockedIndex + 2);
  const visibleGroups: T[] = [];

  for (let i = 0; i <= maxVisibleIndex; i++) {
    const grp = groups[i];

    if (i <= highestUnlockedIndex) {
      grp.isLocked = false;
      grp.isWaiting5Am = false;
      grp.unlockAt = null;
    } else {
      grp.isLocked = true;

      if (i === pendingUnlockGroupIndex && pendingUnlockTime) {
        grp.isWaiting5Am = true;
        grp.unlockAt = pendingUnlockTime.toISOString();

        // Format friendly unlock message in VN time
        const vnUnlock = new Date(pendingUnlockTime.getTime() + 7 * 60 * 60 * 1000);
        const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const isSameDay = vnUnlock.getUTCDate() === vnNow.getUTCDate();
        const dateStr = `${String(vnUnlock.getUTCDate()).padStart(2, '0')}/${String(vnUnlock.getUTCMonth() + 1).padStart(2, '0')}`;
        const dayLabel = isSameDay ? 'sáng nay' : 'sáng mai';

        grp.lockReason = `Bạn đã hoàn thành bài hôm nay! Bài này sẽ mở vào 05:00 ${dayLabel} (${dateStr}).`;
      } else {
        grp.isWaiting5Am = false;
        grp.unlockAt = null;
        const prevGroup = groups[i - 1];
        grp.lockReason = `Cần hoàn thành 100% bài tập của "${prevGroup?.title || 'bài trước'}" để mở khóa.`;
      }
    }

    visibleGroups.push(grp);
  }

  return {
    visibleGroups,
    highestUnlockedIndex,
    pendingUnlockGroupIndex,
    pendingUnlockTime,
  };
}
