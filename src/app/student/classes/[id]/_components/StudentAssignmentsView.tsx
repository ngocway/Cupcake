"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { 
  FolderOpen, 
  CheckCircle2, 
  CircleDashed, 
  ArrowRight, 
  ArrowLeft, 
  Calendar, 
  BookOpen, 
  Gamepad2, 
  Layers, 
  BookText, 
  ClipboardList,
  Search,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Check,
  Lock,
  Award,
  GraduationCap,
  X,
  Volume2,
  RotateCcw,
  Maximize2,
  Minimize2,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronsUpDown,
  Flame,
  Star
} from 'lucide-react';
import { ActivityStage, STAGE_ROADMAP_ORDER, sortGroupItems } from '../_utils/assignmentOrder';
import { EmbeddedQuizContainer } from './EmbeddedQuizContainer';
import { EmbeddedGrammarContainer } from './EmbeddedGrammarContainer';
import { EmbeddedBookContainer } from './EmbeddedBookContainer';
import { EmbeddedGameContainer } from './EmbeddedGameContainer';
import { AssignmentIconWithProgress } from './AssignmentIconWithProgress';
import { 
  prefetchAssignmentData,
  useAssignmentPreloadProgress,
  queueGroupForPreload,
  promoteAssignmentPriority,
  isAssignmentCached
} from '../_utils/assignmentCache';
export type { ActivityStage };
export { STAGE_ROADMAP_ORDER, sortGroupItems };

export interface StudentGroupItem {
  assignment: {
    id: string;
    slug?: string | null;
    title: string;
    materialType: string;
    level?: string | null;
    instructions?: string | null;
    thumbnail?: string | null;
    tags?: string | null;
    teacher?: { id: string; name: string | null; image: string | null } | null;
    questionsCount?: number;
  };
  assignedAt: string;
  dueDate?: string | null;
  isSubmitted: boolean;
  score?: number | null;
  classId?: string;
  groupId?: string;
}

export interface StudentAssignmentGroup {
  id: string;
  title: string;
  createdAt: string | null;
  prerequisiteGroupId?: string | null;
  prerequisiteGroupTitle?: string | null;
  unlockThreshold?: number;
  forceUnlocked?: boolean;
  isLocked?: boolean;
  lockReason?: string;
  prerequisiteTotalCount?: number;
  prerequisiteCompletedCount?: number;
  prerequisitePercent?: number;
  items: StudentGroupItem[];
}

export interface StudentAssignmentsViewProps {
  assignmentGroups: StudentAssignmentGroup[];
  initialGroupId?: string | null;
  initialViewAll?: boolean;
  initialAssignmentId?: string | null;
  initialTab?: string | null;
  classId?: string;
  currentClass?: {
    id: string;
    name: string;
    gradeLevel?: string | null;
    joinCode?: string | null;
    teacher?: any;
  };
  enrolledClasses?: {
    id: string;
    name: string;
    gradeLevel?: string | null;
  }[];
  heroBanner?: React.ReactNode;
}



export interface ParsedItemConfig {
  item: StudentGroupItem;
  targetUrl: string;
  embeddedUrl: string;
  kind: string;
  stage: ActivityStage;
  stageLabel: string;
  cleanTitle: string;
  isReview: boolean;
  iconNode: React.ReactNode;
  badgeClass: string;
  pillColor: string;
}

/** Helper to format score to at most 1 decimal place (e.g. 9.333333333333334 -> "9.3", 10 -> "10") */
export function formatScore(score: number | null | undefined): string {
  if (typeof score !== 'number' || isNaN(score)) return '';
  const rounded = Math.round(score * 10) / 10;
  return rounded.toString();
}

/** Helper to parse metadata and URLs for each student assignment item */
export function parseItemConfig(item: StudentGroupItem): ParsedItemConfig {
  let targetUrl = `/student/assignments/${item.assignment.id}/run`;
  let kind = 'EXERCISE';
  let isReview = false;

  if (item.assignment.instructions) {
    try {
      const meta = JSON.parse(item.assignment.instructions);
      if (meta.playUrl) targetUrl = meta.playUrl;
      if (meta.kind) kind = meta.kind;
      if (meta.section === 'REVIEW' || meta.isReview) isReview = true;
    } catch {}
  }

  const isGrammarLesson = 
    kind === 'LESSON' || 
    targetUrl.includes('/grammar/') || 
    item.assignment.title.toLowerCase().startsWith('grammar lesson') ||
    item.assignment.title.toLowerCase().startsWith('lý thuyết:');

  if (isGrammarLesson) {
    kind = 'LESSON';
  } else if (item.assignment.materialType === 'READING') {
    kind = 'READING';
  } else if (item.assignment.materialType === 'FLASHCARD') {
    kind = 'FLASHCARD';
  } else if (kind === 'GRAMMAR' || kind === 'EXERCISE') {
    kind = 'EXERCISE';
  }

  // Ensure routing query params & direct one-hop targetUrl for exercises
  if (kind === 'EXERCISE') {
    if (targetUrl.endsWith('/run')) {
      targetUrl = `/student/assignments/${item.assignment.id}/run/quiz`;
    }
    if (!targetUrl.includes('direct=true')) {
      const separator = targetUrl.includes('?') ? '&' : '?';
      targetUrl = `${targetUrl}${separator}direct=true`;
    }
  } else if (kind === 'READING' || kind === 'GRAMMAR') {
    if (!targetUrl.includes('direct=true')) {
      const separator = targetUrl.includes('?') ? '&' : '?';
      targetUrl = `${targetUrl}${separator}direct=true`;
    }
  }
  if (!targetUrl.includes('fromClass=true')) {
    const separator = targetUrl.includes('?') ? '&' : '?';
    targetUrl = `${targetUrl}${separator}fromClass=true`;
  }
  if (targetUrl && !targetUrl.includes('assignmentId=')) {
    const separator = targetUrl.includes('?') ? '&' : '?';
    targetUrl = `${targetUrl}${separator}assignmentId=${item.assignment.id}`;
  }
  if (item.classId && !targetUrl.includes('classId=')) {
    const separator = targetUrl.includes('?') ? '&' : '?';
    targetUrl = `${targetUrl}${separator}classId=${item.classId}`;
  }
  if (item.groupId && !targetUrl.includes('groupId=')) {
    const separator = targetUrl.includes('?') ? '&' : '?';
    targetUrl = `${targetUrl}${separator}groupId=${item.groupId}`;
  }

  // Create embedded URL with embedded=true
  const embedSeparator = targetUrl.includes('?') ? '&' : '?';
  const embeddedUrl = `${targetUrl}${embedSeparator}embedded=true`;

  const cleanTitle = item.assignment.title.replace(
    /^(Lý thuyết|Bài tập|Grammar lesson|Grammar exercise|Reading|Bài đọc):\s*/i, ''
  );

  // Determine stage
  let stage: ActivityStage = 'exercise';
  let stageLabel = 'Bài tập';
  let iconNode = <ClipboardList className="w-4 h-4 stroke-[2px]" />;
  let badgeClass = 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60';
  let pillColor = 'bg-blue-500';

  if (isReview) {
    stage = 'review';
    stageLabel = 'Ôn tập';
    iconNode = <RotateCcw className="w-4 h-4 stroke-[2px]" />;
    badgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60';
    pillColor = 'bg-amber-500';
  } else if (kind === 'LESSON') {
    stage = 'lesson';
    stageLabel = 'Lý thuyết';
    iconNode = <BookOpen className="w-4 h-4 stroke-[2px]" />;
    badgeClass = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60';
    pillColor = 'bg-indigo-500';
  } else if (kind === 'GAME') {
    stage = 'game';
    stageLabel = 'Game';
    iconNode = <Gamepad2 className="w-4 h-4 stroke-[2px]" />;
    badgeClass = 'bg-pink-50 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 border-pink-200/60 dark:border-pink-800/60';
    pillColor = 'bg-pink-500';
  } else if (kind === 'READING') {
    stage = 'reading';
    stageLabel = 'Đọc hiểu';
    iconNode = <BookText className="w-4 h-4 stroke-[2px]" />;
    badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60';
    pillColor = 'bg-emerald-500';
  } else if (kind === 'BOOK') {
    stage = 'reading';
    stageLabel = 'Shadowing';
    iconNode = <Volume2 className="w-4 h-4 stroke-[2px]" />;
    badgeClass = 'bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200/60 dark:border-teal-800/60';
    pillColor = 'bg-teal-500';
  } else if (kind === 'FLASHCARD') {
    stage = 'flashcard';
    stageLabel = 'Từ vựng';
    iconNode = <Layers className="w-4 h-4 stroke-[2px]" />;
    badgeClass = 'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/60';
    pillColor = 'bg-purple-500';
  }

  return {
    item,
    targetUrl,
    embeddedUrl,
    kind,
    stage,
    stageLabel,
    cleanTitle,
    isReview,
    iconNode,
    badgeClass,
    pillColor,
  };
}



export function StudentAssignmentsView({ 
  assignmentGroups,
  initialGroupId = null,
  initialViewAll = false,
  initialAssignmentId = null,
  initialTab = null,
  classId,
  currentClass,
  enrolledClasses = [],
  heroBanner
}: StudentAssignmentsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Sidebar collapse state (default false to prevent SSR hydration mismatch)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dolcake_classroom_sidebar_collapsed');
      if (saved === 'true') {
        setIsSidebarCollapsed(true);
      }
    } catch {}
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('dolcake_classroom_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Fullscreen / Zen mode for Canvas (Area 3)
  const [isZenMode, setIsZenMode] = useState(false);

  // Class Switcher Dropdown state
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const classDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target as Node)) {
        setIsClassDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Real-time Submissions state (allows optimistic updates on completion)
  const [submissionsState, setSubmissionsState] = useState<Record<string, { isSubmitted: boolean; score: number | null }>>(() => {
    const initialMap: Record<string, { isSubmitted: boolean; score: number | null }> = {};
    assignmentGroups.forEach(g => {
      g.items.forEach(it => {
        initialMap[it.assignment.id] = {
          isSubmitted: it.isSubmitted,
          score: it.score ?? null,
        };
      });
    });
    return initialMap;
  });

  // Locked modal & Unlocked celebration states
  const [lockedGroupModal, setLockedGroupModal] = useState<StudentAssignmentGroup | null>(null);
  const [unlockedCelebration, setUnlockedCelebration] = useState<{ id: string; title: string } | null>(null);

  // Search query in Area 1
  const [searchQuery, setSearchQuery] = useState('');

  // Determine target group to open on initial load (closest in-progress or uncompleted)
  const initialTargetGroupId = useMemo(() => {
    const paramGid = searchParams.get('groupId') ?? initialGroupId;
    if (paramGid && assignmentGroups.some(g => g.id === paramGid)) {
      return paramGid;
    }
    const paramAid = searchParams.get('assignmentId') ?? initialAssignmentId;
    if (paramAid) {
      const foundGrp = assignmentGroups.find(g => g.items.some(i => i.assignment.id === paramAid));
      if (foundGrp) return foundGrp.id;
    }

    // 1. Nhóm đang làm dở (in-progress): !isLocked, có bài đã làm và còn bài chưa làm
    const inProgress = assignmentGroups.find(g => {
      if (g.isLocked || g.items.length === 0) return false;
      const completed = g.items.filter(i => submissionsState[i.assignment.id]?.isSubmitted).length;
      return completed > 0 && completed < g.items.length;
    });
    if (inProgress) return inProgress.id;

    // 2. Nhóm chưa làm kế tiếp mà không bị khóa (!isLocked, 0 bài đã làm)
    const notStarted = assignmentGroups.find(g => {
      if (g.isLocked || g.items.length === 0) return false;
      const completed = g.items.filter(i => submissionsState[i.assignment.id]?.isSubmitted).length;
      return completed === 0;
    });
    if (notStarted) return notStarted.id;

    // 3. Nếu đã hoàn thành tất cả: chọn nhóm mở mới nhất (cuối danh sách)
    const unlockedGroups = assignmentGroups.filter(g => !g.isLocked && g.items.length > 0);
    if (unlockedGroups.length > 0) {
      return unlockedGroups[unlockedGroups.length - 1].id;
    }

    return assignmentGroups[0]?.id || '';
  }, [assignmentGroups, searchParams, initialGroupId, initialAssignmentId, submissionsState]);

  // Selected Group ID
  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => initialTargetGroupId);

  // Real-time preload progress of assignments in background queue
  const preloadProgress = useAssignmentPreloadProgress();

  // Expanded Groups in Accordion Tree (Single Accordion: Only target group is expanded by default)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    return initialTargetGroupId ? { [initialTargetGroupId]: true } : {};
  });

  // Single Accordion: Toggle expand for a group. If expanding, collapse all other groups.
  const toggleGroupExpand = (groupId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const grp = assignmentGroups.find(g => g.id === groupId);
    if (grp?.isLocked) {
      setLockedGroupModal(grp);
      return;
    }

    setExpandedGroups(prev => {
      const isCurrentlyExpanded = !!prev[groupId];
      if (isCurrentlyExpanded) {
        // Collapse if already open
        return {};
      }
      // Single Accordion: Expand ONLY this group and queue preload
      if (grp && grp.items.length > 0) {
        queueGroupForPreload(grp.items, activeAssignmentId);
      }
      return { [groupId]: true };
    });
  };

  // Active Group object
  const activeGroup = useMemo(() => {
    return assignmentGroups.find(g => g.id === selectedGroupId) || assignmentGroups[0] || null;
  }, [assignmentGroups, selectedGroupId]);

  // Parsed items for active group
  const activeGroupParsedItems = useMemo<ParsedItemConfig[]>(() => {
    if (!activeGroup) return [];
    return activeGroup.items.map(parseItemConfig);
  }, [activeGroup]);

  // Selected Assignment ID: prefer first uncompleted item in the active target group
  const [activeAssignmentId, setActiveAssignmentId] = useState<string>(() => {
    const paramAid = searchParams.get('assignmentId') ?? initialAssignmentId;
    const initialGrp = assignmentGroups.find(g => g.id === initialTargetGroupId) || assignmentGroups[0];
    if (paramAid && initialGrp?.items.some(i => i.assignment.id === paramAid)) {
      return paramAid;
    }
    // Prefer first uncompleted item in the target group
    const firstUncompleted = initialGrp?.items.find(i => !submissionsState[i.assignment.id]?.isSubmitted);
    return firstUncompleted?.assignment.id || initialGrp?.items[0]?.assignment.id || '';
  });

  // Active Item Config
  const activeItemConfig = useMemo(() => {
    return activeGroupParsedItems.find(p => p.item.assignment.id === activeAssignmentId) || activeGroupParsedItems[0] || null;
  }, [activeGroupParsedItems, activeAssignmentId]);

  // Stage Tabs available in active group
  const availableStages = useMemo(() => {
    if (!activeGroupParsedItems.length) return [];
    const stageOrder: ActivityStage[] = ['lesson', 'flashcard', 'exercise', 'reading', 'game', 'review', 'other'];
    const stageMeta: Record<ActivityStage, { label: string; icon: React.ReactNode }> = {
      lesson: { label: 'Lý thuyết', icon: <BookOpen className="w-4 h-4" /> },
      flashcard: { label: 'Từ vựng', icon: <Layers className="w-4 h-4" /> },
      exercise: { label: 'Bài tập', icon: <ClipboardList className="w-4 h-4" /> },
      reading: { label: 'Đọc & Nói', icon: <BookText className="w-4 h-4" /> },
      game: { label: 'Trò chơi', icon: <Gamepad2 className="w-4 h-4" /> },
      review: { label: 'Ôn tập', icon: <RotateCcw className="w-4 h-4" /> },
      other: { label: 'Khác', icon: <Sparkles className="w-4 h-4" /> },
    };

    const stagesMap = new Map<ActivityStage, ParsedItemConfig[]>();
    activeGroupParsedItems.forEach(it => {
      const list = stagesMap.get(it.stage) || [];
      list.push(it);
      stagesMap.set(it.stage, list);
    });

    return stageOrder
      .filter(s => (stagesMap.get(s)?.length || 0) > 0)
      .map(stageId => ({
        id: stageId,
        label: stageMeta[stageId].label,
        icon: stageMeta[stageId].icon,
        items: stagesMap.get(stageId) || [],
      }));
  }, [activeGroupParsedItems]);

  // Active Stage Tab in Area 2
  const [activeStageId, setActiveStageId] = useState<ActivityStage>(() => {
    const paramTab = (searchParams.get('tab') ?? initialTab) as ActivityStage;
    if (paramTab && availableStages.some(s => s.id === paramTab)) {
      return paramTab;
    }
    return activeItemConfig?.stage || availableStages[0]?.id || 'exercise';
  });

  // Sync active stage with active item when active item changes
  useEffect(() => {
    if (activeItemConfig && activeItemConfig.stage !== activeStageId) {
      setActiveStageId(activeItemConfig.stage);
    }
  }, [activeItemConfig]);


  // Synchronize URL query params
  const updateQueryParams = (groupId: string, assignmentId: string, stageId: string) => {
    try {
      const params = new URLSearchParams(window.location.search);
      params.set('groupId', groupId);
      params.set('assignmentId', assignmentId);
      params.set('tab', stageId);
      params.delete('viewAll');
      const query = params.toString();
      window.history.pushState(null, '', query ? `${pathname}?${query}` : pathname);
    } catch {}
  };

  // Switch to a new Group
  const handleSelectGroup = (groupId: string) => {
    const grp = assignmentGroups.find(g => g.id === groupId);
    if (!grp) return;

    if (grp.isLocked) {
      setLockedGroupModal(grp);
      return;
    }

    setSelectedGroupId(groupId);
    // Single Accordion: Only this group is expanded
    setExpandedGroups({ [groupId]: true });

    // Pick first uncompleted item or first item
    const uncompleted = grp.items.find(i => !submissionsState[i.assignment.id]?.isSubmitted);
    const chosen = uncompleted || grp.items[0];

    if (grp.items.length > 0) {
      queueGroupForPreload(grp.items, chosen?.assignment?.id);
    }

    if (chosen) {
      const cfg = parseItemConfig(chosen);
      setActiveAssignmentId(chosen.assignment.id);
      setActiveStageId(cfg.stage);
      updateQueryParams(groupId, chosen.assignment.id, cfg.stage);
    } else {
      updateQueryParams(groupId, '', '');
    }
  };

  // Switch to a new Assignment
  const handleSelectAssignment = (item: StudentGroupItem, parentGroupId: string) => {
    const grp = assignmentGroups.find(g => g.id === parentGroupId);
    if (grp?.isLocked) {
      setLockedGroupModal(grp);
      return;
    }

    const aid = item.assignment.id;
    const progress = preloadProgress[aid] ?? 0;
    const isReady = aid === activeAssignmentId || progress >= 100 || isAssignmentCached(aid);
    if (!isReady) {
      return; // Do nothing if not yet loaded and ready
    }

    promoteAssignmentPriority(item.assignment.id);

    const cfg = parseItemConfig(item);
    setSelectedGroupId(parentGroupId);
    setExpandedGroups({ [parentGroupId]: true });
    setActiveAssignmentId(item.assignment.id);
    setActiveStageId(cfg.stage);
    updateQueryParams(parentGroupId, item.assignment.id, cfg.stage);
  };

  // Switch Stage Tab (Area 2)
  const handleSelectStageTab = (stageId: ActivityStage) => {
    setActiveStageId(stageId);
    const stageObj = availableStages.find(s => s.id === stageId);
    if (stageObj && stageObj.items.length > 0) {
      // If currently selected item is already in this stage, keep it; else select first item in stage
      const itemInStage = stageObj.items.find(i => i.item.assignment.id === activeAssignmentId);
      const chosenItem = itemInStage || stageObj.items[0];
      setActiveAssignmentId(chosenItem.item.assignment.id);
      updateQueryParams(selectedGroupId, chosenItem.item.assignment.id, stageId);
    }
  };

  // Next Activity CTA
  const handleNextActivity = () => {
    if (!activeGroup) return;

    // Find index of current item in activeGroup
    const currentIndex = activeGroup.items.findIndex(i => i.assignment.id === activeAssignmentId);
    if (currentIndex >= 0 && currentIndex < activeGroup.items.length - 1) {
      // Next item in current group
      const nextItem = activeGroup.items[currentIndex + 1];
      handleSelectAssignment(nextItem, activeGroup.id);
      return;
    }

    // Try finding next unlocked group
    const currentGroupIndex = assignmentGroups.findIndex(g => g.id === activeGroup.id);
    if (currentGroupIndex >= 0 && currentGroupIndex < assignmentGroups.length - 1) {
      const nextGroup = assignmentGroups[currentGroupIndex + 1];
      if (!nextGroup.isLocked && nextGroup.items.length > 0) {
        handleSelectGroup(nextGroup.id);
      }
    }
  };

  // Completion handler to update assignment submission status and score in parent state
  const handleActivityComplete = useCallback((score: number | null, assignmentId: string) => {
    const roundedScore = typeof score === 'number' ? Math.round(score * 10) / 10 : null;
    setSubmissionsState(prev => {
      const current = prev[assignmentId];
      const newScore = roundedScore ?? current?.score ?? null;
      if (current?.isSubmitted && current?.score === newScore) {
        return prev;
      }
      return {
        ...prev,
        [assignmentId]: {
          isSubmitted: true,
          score: newScore
        }
      };
    });
  }, []);

  // Listen to message events (e.g. from interactive game iframe or background processes)
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      if (
        data.type === 'ACTIVITY_COMPLETED' ||
        data.type === 'CANDY_GAME_PROGRESS' || 
        data.type === 'GAME_PROGRESS' ||
        data.type === 'MATCH_GAME_PROGRESS' ||
        data.type === 'QUIZ_SUBMITTED'
      ) {
        const targetAid = data.assignmentId || activeAssignmentId;
        const score = typeof data.score === 'number' ? data.score : null;
        if (targetAid) {
          handleActivityComplete(score, targetAid);
        }
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [activeAssignmentId, handleActivityComplete]);

  // Instant preloader: Silently pre-fetches assignment data into memory
  const preloadAssignment = useCallback((item: StudentGroupItem) => {
    prefetchAssignmentData(item);
  }, []);

  // Smart background preload: Preload all items in active group via concurrency-limited queue
  useEffect(() => {
    if (activeGroup && !activeGroup.isLocked && activeGroup.items.length > 0) {
      queueGroupForPreload(activeGroup.items, activeAssignmentId);
    }
  }, [activeGroup?.id, activeAssignmentId]);

  // Keep-Alive Pool: Preserves visited component instances and their user progress in DOM
  const [visitedConfigs, setVisitedConfigs] = useState<Record<string, ParsedItemConfig>>(() => {
    if (activeItemConfig) {
      return { [activeItemConfig.item.assignment.id]: activeItemConfig };
    }
    return {};
  });

  useEffect(() => {
    if (activeItemConfig) {
      const aid = activeItemConfig.item.assignment.id;
      setVisitedConfigs(prev => {
        if (prev[aid]) return prev;
        return {
          ...prev,
          [aid]: activeItemConfig,
        };
      });
    }
  }, [activeItemConfig]);

  // When switching groups, reset pool to the new active item
  useEffect(() => {
    if (activeItemConfig) {
      setVisitedConfigs({ [activeItemConfig.item.assignment.id]: activeItemConfig });
    }
  }, [selectedGroupId]);

  const currentItemKind = activeItemConfig ? parseItemConfig(activeItemConfig.item).kind : null;
  const currentItemStage = activeItemConfig?.stage;

  // Activity classification for instant native rendering (Prioritize Game & Lesson before Book & Quiz)
  const isCurrentGame = Boolean(
    activeItemConfig && (
      currentItemKind === 'GAME' ||
      currentItemStage === 'game' ||
      activeItemConfig.item.assignment.materialType === 'GAME' ||
      parseItemConfig(activeItemConfig.item).targetUrl.includes('/game/') ||
      parseItemConfig(activeItemConfig.item).targetUrl.includes('/games/')
    )
  );

  const isCurrentLesson = Boolean(
    activeItemConfig && !isCurrentGame && (
      currentItemKind === 'LESSON' ||
      currentItemStage === 'lesson' ||
      activeItemConfig.item.assignment.materialType === 'LESSON' ||
      parseItemConfig(activeItemConfig.item).targetUrl.includes('/grammar/') ||
      activeItemConfig.item.assignment.title.toLowerCase().startsWith('grammar lesson') ||
      activeItemConfig.item.assignment.title.toLowerCase().startsWith('lý thuyết:')
    )
  );

  const isCurrentBook = Boolean(
    activeItemConfig && !isCurrentGame && !isCurrentLesson && (
      currentItemKind === 'READING' ||
      currentItemKind === 'BOOK' ||
      currentItemStage === 'reading' ||
      activeItemConfig.item.assignment.materialType === 'READING' ||
      parseItemConfig(activeItemConfig.item).targetUrl.includes('/student/books/')
    )
  );

  const isCurrentQuiz = Boolean(
    activeItemConfig && !isCurrentGame && !isCurrentLesson && !isCurrentBook
  );

  // Overall student progress calculation
  const overallStats = useMemo(() => {
    let total = 0;
    let completed = 0;
    assignmentGroups.forEach(g => {
      g.items.forEach(it => {
        total++;
        if (submissionsState[it.assignment.id]?.isSubmitted) {
          completed++;
        }
      });
    });
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [assignmentGroups, submissionsState]);

  // Filter groups in tree based on search query
  const searchFilteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return assignmentGroups;
    const q = searchQuery.toLowerCase().trim();
    return assignmentGroups.map(group => {
      const matchGroup = group.title.toLowerCase().includes(q);
      const matchingItems = group.items.filter(it => it.assignment.title.toLowerCase().includes(q));
      if (matchGroup || matchingItems.length > 0) {
        return {
          ...group,
          items: matchGroup ? group.items : matchingItems,
        };
      }
      return null;
    }).filter(Boolean) as StudentAssignmentGroup[];
  }, [assignmentGroups, searchQuery]);

  // Current active submission status
  const currentSubmission = activeItemConfig ? submissionsState[activeItemConfig.item.assignment.id] : null;
  const isCurrentSubmitted = currentSubmission?.isSubmitted;
  const currentScore = currentSubmission?.score;

  if (assignmentGroups.length === 0) {
    return (
      <div className="space-y-6">
        {heroBanner}
        <div className="p-12 text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-dashed border-slate-200/80 dark:border-slate-700/80 rounded-3xl shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto text-slate-400">
            <FolderOpen className="w-7 h-7 stroke-[1.8px]" />
          </div>
          <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200">Chưa có bài tập nào</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
            Giáo viên chưa giao bài tập cho lớp học này. Vui lòng quay lại sau nhé!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full transition-all duration-300 ${isZenMode ? 'fixed inset-0 z-[100] bg-slate-950 p-2 sm:p-4 overflow-hidden' : 'space-y-4'}`}>
      
      {/* ── UNIFIED 3-AREA WORKSPACE ── */}
      <div className={`flex flex-col lg:flex-row items-stretch gap-4 sm:gap-5 w-full ${isZenMode ? 'h-full' : 'min-h-[820px]'}`}>

        {/* ══════════════════════════════════════════════════════════════════
            KHU VỰC 1: SIDEBAR CÂY ĐIỀU HƯỚNG (Hierarchy Tree Drawer)
            ══════════════════════════════════════════════════════════════════ */}
        {!isZenMode && !isSidebarCollapsed && (
          /* Khi mở menu: Hiển thị sidebar đầy đủ. Khi thu gọn: Ẩn hoàn toàn để khung bài làm chiếm 100% mép trái */
          <aside className="w-full lg:w-[330px] xl:w-[360px] transition-all duration-300 flex flex-col shrink-0 animate-in fade-in slide-in-from-left-3 duration-200">
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-[1.75rem] shadow-sm flex flex-col h-full overflow-hidden max-h-[860px]">
                
                {/* 1.1 Header: Class Selector & Collapse Toggle */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 relative">
                  <div className="relative flex-1 min-w-0" ref={classDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsClassDropdownOpen(prev => !prev)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-4 h-4 stroke-[2.2px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Lớp học hiện tại</p>
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                            {currentClass?.name || 'Lớp học của tôi'}
                          </h4>
                        </div>
                      </div>
                      <ChevronsUpDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
                    </button>

                    {/* Class Dropdown */}
                    {isClassDropdownOpen && enrolledClasses.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-200">
                        <p className="text-[10px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">Đổi lớp học:</p>
                        {enrolledClasses.map(cls => (
                          <Link
                            key={cls.id}
                            href={`/student/classes/${cls.id}`}
                            onClick={() => setIsClassDropdownOpen(false)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                              cls.id === currentClass?.id 
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-black' 
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                            }`}
                          >
                            <span className="truncate">{cls.name}</span>
                            {cls.id === currentClass?.id && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={toggleSidebar}
                    title="Thu gọn menu"
                    className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  >
                    <PanelLeftClose className="w-4 h-4 stroke-[2px]" />
                  </button>
                </div>

                {/* Sidebar Content (Search Box & Accordion Tree) */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* 1.2 Search Box */}
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm bài học..."
                        className="w-full pl-9 pr-8 py-2 bg-slate-100/70 dark:bg-slate-800/70 text-slate-800 dark:text-white placeholder-slate-400 text-xs rounded-xl border border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 1.4 Hierarchical Accordion Tree (Groups & Assignments) */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2.5 custom-scrollbar">
                    {searchFilteredGroups.map((group, groupIdx) => {
                      const totalInGrp = group.items.length;
                      const completedInGrp = group.items.filter(i => submissionsState[i.assignment.id]?.isSubmitted).length;
                      const isGrpActive = group.id === selectedGroupId;
                      const isExpanded = !!expandedGroups[group.id];

                      return (
                        <div 
                          key={group.id}
                          className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                            isGrpActive 
                              ? 'border-blue-200 dark:border-blue-800/60 bg-blue-50/20 dark:bg-blue-950/20' 
                              : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/30'
                          }`}
                        >
                          {/* Group Header Row */}
                          <div
                            onClick={() => handleSelectGroup(group.id)}
                            onMouseEnter={() => {
                              if (!group.isLocked && group.items.length > 0) {
                                preloadAssignment(group.items[0]);
                                queueGroupForPreload(group.items);
                              }
                            }}
                            className={`flex items-center justify-between gap-2 p-3 text-left transition-colors cursor-pointer select-none ${
                              isGrpActive 
                                ? 'bg-blue-100/40 dark:bg-blue-900/30 text-blue-950 dark:text-blue-100' 
                                : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => toggleGroupExpand(group.id, e)}
                                className="w-5 h-5 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700/60 flex items-center justify-center text-slate-400 transition-colors shrink-0"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 stroke-[2.5px]" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 stroke-[2.5px]" />
                                )}
                              </button>

                              <div className="min-w-0">
                                <h4 className="text-xs font-black truncate leading-tight">
                                  {group.title}
                                </h4>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {group.isLocked ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-black">
                                  <Lock className="w-3 h-3" /> Khóa
                                </span>
                              ) : (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                  completedInGrp === totalInGrp && totalInGrp > 0
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black'
                                    : 'bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-400'
                                }`}>
                                  {completedInGrp}/{totalInGrp}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Children Items (Level 3: Assignments in Group) */}
                          {isExpanded && !group.isLocked && (
                            <div className="py-1 px-1.5 space-y-1 border-t border-slate-100 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60">
                              {group.items.map((item) => {
                                const parsed = parseItemConfig(item);
                                const isItemActive = item.assignment.id === activeAssignmentId;
                                const isSubmitted = submissionsState[item.assignment.id]?.isSubmitted;
                                const itemScore = submissionsState[item.assignment.id]?.score;
                                const itemProgress = preloadProgress[item.assignment.id] ?? 0;
                                const isItemReady = isItemActive || itemProgress >= 100 || isAssignmentCached(item.assignment.id);

                                return (
                                  <button
                                    key={item.assignment.id}
                                    type="button"
                                    aria-disabled={!isItemReady}
                                    onClick={(e) => {
                                      if (!isItemReady) {
                                        e.preventDefault();
                                        return;
                                      }
                                      handleSelectAssignment(item, group.id);
                                    }}
                                    onMouseEnter={() => preloadAssignment(item)}
                                    title={!isItemReady ? 'Đang chuẩn bị dữ liệu...' : undefined}
                                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-all ${
                                      isItemActive
                                        ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-500/20 translate-x-1 cursor-pointer'
                                        : isItemReady
                                          ? 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 cursor-pointer active:scale-[0.99]'
                                          : 'opacity-55 text-slate-400 dark:text-slate-500 cursor-wait select-none'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <AssignmentIconWithProgress
                                        progress={itemProgress}
                                        isItemActive={isItemActive}
                                        badgeClass={parsed.badgeClass}
                                        iconNode={parsed.iconNode}
                                      />
                                      <span className="truncate leading-snug">
                                        {parsed.cleanTitle}
                                      </span>
                                    </div>

                                    <div className="shrink-0 flex items-center gap-1">
                                      {isSubmitted ? (
                                        <div className={`flex items-center gap-1 text-[10px] font-black ${
                                          isItemActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'
                                        }`}>
                                          {typeof itemScore === 'number' && (
                                            <span>{formatScore(itemScore)}</span>
                                          )}
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                        </div>
                                      ) : (
                                        <CircleDashed className={`w-3.5 h-3.5 ${
                                          isItemActive 
                                            ? 'text-white/60' 
                                            : !isItemReady && itemProgress > 0
                                              ? 'text-blue-400 dark:text-blue-500 animate-pulse'
                                              : 'text-slate-300 dark:text-slate-600'
                                        }`} />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            KHU VỰC 2 & 3: MAIN VIEW (Header + Stage Tabs + Embedded Canvas)
            ══════════════════════════════════════════════════════════════════ */}
        <main className="flex-1 flex flex-col min-w-0 gap-3 sm:gap-4 transition-all duration-300">
          
          {/* ════════════════════════════════════════════════════════════════
              KHU VỰC 2: TOP ACTION BAR & STAGES TABS (Chặng học tập)
              ════════════════════════════════════════════════════════════════ */}
          {!isSidebarCollapsed && (
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-[1.75rem] p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
              
              {/* Top row: Breadcrumb, Title & Global Action CTAs */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-1 flex-wrap">
                    <span>{currentClass?.name || 'Lớp học'}</span>
                    <span>/</span>
                    <span className="text-slate-600 dark:text-slate-300 truncate">{activeGroup?.title}</span>
                  </div>

                  {/* Active Activity Title */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                      {activeItemConfig?.cleanTitle || 'Chọn bài học để bắt đầu'}
                    </h2>

                    {/* Status Badges */}
                    {activeItemConfig && (
                      <div className="flex items-center gap-1.5">
                        {isCurrentSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200/60 dark:border-emerald-800/60">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{typeof currentScore === 'number' ? formatScore(currentScore) : 'Đã làm'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-extrabold text-[11px]">
                            <CircleDashed className="w-3.5 h-3.5" /> Chưa làm
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            {/* Bottom row: Stages Tabs (Các chặng: Ôn tập, Ngữ pháp, Bài tập, Game, Đọc hiểu...) */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-1.5 overflow-x-auto min-w-0 custom-scrollbar">
                {availableStages.map(stage => {
                  const isActiveStage = stage.id === activeStageId;
                  const completedInStage = stage.items.filter(i => submissionsState[i.item.assignment.id]?.isSubmitted).length;
                  const isStageAllDone = stage.items.length > 0 && completedInStage === stage.items.length;

                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => handleSelectStageTab(stage.id)}
                      onMouseEnter={() => {
                        if (stage.items[0]) preloadAssignment(stage.items[0].item);
                      }}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                        isActiveStage
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                          : 'bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="shrink-0">{stage.icon}</span>
                      <span>{stage.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                        isActiveStage 
                          ? 'bg-white/25 text-white' 
                          : isStageAllDone 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}>
                        {stage.items.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Toggle Focus / Thu gọn button moved to Area 2 */}
              {!isZenMode && (
                <button
                  type="button"
                  title="Thu gọn menu & thanh trên để tối đa khung làm bài"
                  onClick={toggleSidebar}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-bold text-xs transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
                >
                  <PanelLeftClose className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Thu gọn</span>
                </button>
              )}
            </div>
          </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              KHU VỰC 3: MAIN EMBEDDED ACTIVITY CANVAS
              ════════════════════════════════════════════════════════════════ */}
          <div className={`relative flex-1 bg-white dark:bg-slate-900 rounded-[1.75rem] border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${
            isZenMode ? 'h-[calc(100vh-140px)]' : isSidebarCollapsed ? 'min-h-[760px] xl:min-h-[850px]' : 'min-h-[640px] xl:min-h-[720px]'
          }`}>
            
            {/* Floating Expand button when sidebar is collapsed (moved to top-right) */}
            {isSidebarCollapsed && !isZenMode && (
              <button
                type="button"
                title="Mở lại menu bài học & thanh điều hướng"
                onClick={toggleSidebar}
                className="absolute top-3 right-3 sm:right-4 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-blue-600 dark:text-blue-400 border border-slate-200/80 dark:border-slate-700/80 shadow-md hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <PanelLeftOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mở thanh điều hướng</span>
              </button>
            )}

            {/* Embedded Activity Canvas (Keep-Alive Pool: 100% Native & 0ms Instant Switch) */}
            <div className="relative flex-1 w-full h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
              {Object.keys(visitedConfigs).length > 0 ? (
                Object.values(visitedConfigs).map((cfg) => {
                  const aid = cfg.item.assignment.id;
                  const isActive = activeAssignmentId === aid;
                  const itemKind = parseItemConfig(cfg.item).kind;
                  const itemStage = cfg.stage;

                  const isGame = Boolean(
                    itemKind === 'GAME' ||
                    itemStage === 'game' ||
                    cfg.item.assignment.materialType === 'GAME' ||
                    parseItemConfig(cfg.item).targetUrl.includes('/game/') ||
                    parseItemConfig(cfg.item).targetUrl.includes('/games/')
                  );

                  const isLesson = Boolean(
                    !isGame && (
                      itemKind === 'LESSON' ||
                      itemStage === 'lesson' ||
                      cfg.item.assignment.materialType === 'LESSON' ||
                      parseItemConfig(cfg.item).targetUrl.includes('/grammar/') ||
                      cfg.item.assignment.title.toLowerCase().startsWith('grammar lesson') ||
                      cfg.item.assignment.title.toLowerCase().startsWith('lý thuyết:')
                    )
                  );

                  const isBook = Boolean(
                    !isGame && !isLesson && (
                      itemKind === 'READING' ||
                      itemKind === 'BOOK' ||
                      itemStage === 'reading' ||
                      cfg.item.assignment.materialType === 'READING' ||
                      parseItemConfig(cfg.item).targetUrl.includes('/student/books/')
                    )
                  );

                  const isQuiz = Boolean(!isGame && !isLesson && !isBook);

                  return (
                    <div
                      key={aid}
                      className={`w-full h-full ${
                        isActive
                          ? 'relative block opacity-100 z-10'
                          : 'absolute inset-0 pointer-events-none opacity-0 z-0'
                      }`}
                      style={{ display: isActive ? 'block' : 'none' }}
                    >
                      {isGame ? (
                        <EmbeddedGameContainer
                          assignment={cfg.item.assignment}
                          onComplete={handleActivityComplete}
                        />
                      ) : isLesson ? (
                        <EmbeddedGrammarContainer
                          assignmentId={aid}
                          classId={classId}
                          groupId={cfg.item.groupId}
                          onComplete={handleActivityComplete}
                          onNextActivity={handleNextActivity}
                        />
                      ) : isBook ? (
                        <EmbeddedBookContainer
                          assignmentId={aid}
                          onComplete={handleActivityComplete}
                        />
                      ) : (
                        <EmbeddedQuizContainer
                          assignmentId={aid}
                          classId={classId}
                          groupId={cfg.item.groupId}
                          onComplete={handleActivityComplete}
                        />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                  <BookOpen className="w-12 h-12 stroke-[1.5px] mb-3 text-slate-300" />
                  <p className="font-bold text-sm">Vui lòng chọn một bài học từ menu bên trái.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          LOCKED GROUP MODAL (Giải thích điều kiện mở khóa nhóm)
          ══════════════════════════════════════════════════════════════════ */}
      {lockedGroupModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-amber-300 dark:border-amber-800 shadow-2xl p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setLockedGroupModal(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-8 h-8 stroke-[2px]" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-black text-[11px] uppercase tracking-wider">
                Nhóm bài đang tạm khóa
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white pt-1">
                {lockedGroupModal.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed pt-1">
                {lockedGroupModal.lockReason || 'Bạn cần hoàn thành nhóm bài trước để mở khóa nhóm bài này.'}
              </p>
            </div>

            {/* Prerequisite progress bar */}
            {lockedGroupModal.prerequisiteGroupId && (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-left space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300 truncate">
                    Tiến độ "{lockedGroupModal.prerequisiteGroupTitle}":
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-black shrink-0">
                    {lockedGroupModal.prerequisitePercent}% / {lockedGroupModal.unlockThreshold}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, lockedGroupModal.prerequisitePercent || 0)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {lockedGroupModal.prerequisiteGroupId && (
                <button
                  type="button"
                  onClick={() => {
                    const prereqId = lockedGroupModal.prerequisiteGroupId!;
                    setLockedGroupModal(null);
                    handleSelectGroup(prereqId);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Vào làm nhóm trước ngay →</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setLockedGroupModal(null)}
                className="w-full py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          UNLOCKED CELEBRATION MODAL (Ăn mừng mở khóa thành công)
          ══════════════════════════════════════════════════════════════════ */}
      {unlockedCelebration && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-emerald-400 dark:border-emerald-600 shadow-2xl p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
              <Sparkles className="w-10 h-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black text-xs uppercase tracking-wider">
                🎉 Mở khóa thành công!
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white pt-1">
                {unlockedCelebration.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed pt-1">
                Tuyệt vời! Bạn đã hoàn thành đủ chỉ tiêu bài học trước và chính thức mở khóa nhóm bài này. Hãy bắt đầu chinh phục ngay nào!
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const gid = unlockedCelebration.id;
                  setUnlockedCelebration(null);
                  handleSelectGroup(gid);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Khám phá nhóm bài này ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setUnlockedCelebration(null)}
                className="w-full py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
