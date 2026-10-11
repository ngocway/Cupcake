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
  Star,
  FolderKanban,
  FileEdit,
  Target,
  Mic,
  Clock
} from 'lucide-react';
import { ActivityStage, STAGE_ROADMAP_ORDER, sortGroupItems, isScoredAssignment, buildGroupTree } from '../_utils/assignmentOrder';
import { CEFR_LEVELS, GRAMMAR_TOPICS } from '@/lib/grammar-taxonomy';
import dynamic from 'next/dynamic';

const EmbeddedQuizContainer = dynamic(
  () => import('./EmbeddedQuizContainer').then((mod) => mod.EmbeddedQuizContainer)
);
const EmbeddedGrammarContainer = dynamic(
  () => import('./EmbeddedGrammarContainer').then((mod) => mod.EmbeddedGrammarContainer)
);
const EmbeddedBookContainer = dynamic(
  () => import('./EmbeddedBookContainer').then((mod) => mod.EmbeddedBookContainer)
);
const EmbeddedGameContainer = dynamic(
  () => import('./EmbeddedGameContainer').then((mod) => mod.EmbeddedGameContainer)
);
import { AssignmentIconWithProgress } from './AssignmentIconWithProgress';
import { 
  prefetchAssignmentData,
  useAssignmentPreloadProgress,
  queueGroupForPreload,
  promoteAssignmentPriority,
  isAssignmentCached,
  clearPreloadQueue
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
    instructionsTranslations?: any;
    thumbnail?: string | null;
    tags?: string | null;
    grammarLesson?: string | null;
    grammarTopic?: string | null;
    teacher?: { id: string; name: string | null; image: string | null } | null;
    questionsCount?: number;
  };
  assignedAt: string;
  dueDate?: string | null;
  isSubmitted: boolean;
  score?: number | null;
  submittedAt?: string | null;
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
  isWaiting5Am?: boolean;
  unlockAt?: string | null;
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



export interface PastelStyle {
  tileBg: string;
  tileColor: string;
  activeBorder: string;
  badgeBg: string;
  typeKey: 'lesson' | 'exercise' | 'flashcard' | 'game' | 'reading' | 'review';
}

export interface ParsedItemConfig {
  item: StudentGroupItem;
  targetUrl: string;
  embeddedUrl: string;
  kind: string;
  stage: ActivityStage;
  stageLabel: string;
  tooltipText: string;
  cleanTitle: string;
  isReview: boolean;
  iconNode: React.ReactNode;
  badgeClass: string;
  pillColor: string;
  pastel: PastelStyle;
}

/** Helper to clean prefix like "[Chặng 1 - A1]" or "Chặng 1:" from group titles for clean display */
export function cleanGroupTitle(title: string | null | undefined): string {
  if (!title) return '';
  return title
    .replace(/^\[?(?:Chặng|Stage)\s*\d+[^\]]*\]?\s*:\s*/i, '')
    .replace(/^\[?(?:Chặng|Stage)\s*\d+[^\]]*\]?\s*/i, '')
    .trim();
}

export interface StageThemeConfig {
  color: string;
  gradient: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  lightBg: string;
  lightText: string;
  icon: typeof BookOpen;
}

export const STAGE_THEMES: Record<number, StageThemeConfig> = {
  1: {
    color: '#12A375',
    gradient: 'from-[#12A375] to-[#0B7A58]',
    cardBg: '#C2EEDC',
    cardBorder: '#76D5B0',
    textColor: '#064E3B',
    lightBg: '#A7F3D0',
    lightText: '#065F46',
    icon: BookOpen,
  },
  2: {
    color: '#1C7FC2',
    gradient: 'from-[#1C7FC2] to-[#14669E]',
    cardBg: '#C7E6FD',
    cardBorder: '#76BFF6',
    textColor: '#075985',
    lightBg: '#BAE6FD',
    lightText: '#0284C7',
    icon: Sparkles,
  },
  3: {
    color: '#7B5CFA',
    gradient: 'from-[#7B5CFA] to-[#6039EF]',
    cardBg: '#E2D6FE',
    cardBorder: '#AC94FA',
    textColor: '#4C1D95',
    lightBg: '#DDD6FE',
    lightText: '#6D28D9',
    icon: Target,
  },
  4: {
    color: '#E26D33',
    gradient: 'from-[#E26D33] to-[#C95319]',
    cardBg: '#FED7BF',
    cardBorder: '#FA9F6F',
    textColor: '#9A3412',
    lightBg: '#FED7AA',
    lightText: '#C2410C',
    icon: Flame,
  },
  5: {
    color: '#D9436C',
    gradient: 'from-[#D9436C] to-[#BA2B52]',
    cardBg: '#FBCFD8',
    cardBorder: '#F27D9A',
    textColor: '#881337',
    lightBg: '#FECDD3',
    lightText: '#BE123C',
    icon: Award,
  },
  6: {
    color: '#E58A1F',
    gradient: 'from-[#E58A1F] to-[#C26C08]',
    cardBg: '#FEE5A9',
    cardBorder: '#F4BA44',
    textColor: '#78350F',
    lightBg: '#FDE68A',
    lightText: '#B45309',
    icon: GraduationCap,
  },
};

export const DEFAULT_STAGE_THEME: StageThemeConfig = {
  color: '#12A375',
  gradient: 'from-[#12A375] to-[#0B7A58]',
  cardBg: '#C2EEDC',
  cardBorder: '#76D5B0',
  textColor: '#064E3B',
  lightBg: '#A7F3D0',
  lightText: '#065F46',
  icon: BookOpen,
};

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

  const titleLower = item.assignment.title.toLowerCase();
  const isGrammarLesson = 
    kind === 'LESSON' || 
    targetUrl.includes('/grammar/') || 
    titleLower.includes('lý thuyết') ||
    titleLower.includes('ly thuyet') ||
    titleLower.includes('grammar lesson');

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

  // Determine stage & pastel visual styling matching homepage tiles
  let stage: ActivityStage = 'exercise';
  let stageLabel = 'Bài tập';
  let tooltipText = 'Exercise';
  let iconNode = <FileEdit className="w-3.5 h-3.5 stroke-[2.3px]" />;
  let badgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80';
  let pillColor = 'bg-blue-500';
  let pastel: PastelStyle = {
    tileBg: '#CFE9FC',
    tileColor: '#1C7FC2',
    activeBorder: '#3FA9F5',
    badgeBg: 'bg-[#CFE9FC] text-[#1C7FC2]',
    typeKey: 'exercise'
  };

  if (isReview) {
    stage = 'review';
    stageLabel = 'Ôn tập';
    tooltipText = 'Review';
    iconNode = <Target className="w-3.5 h-3.5 stroke-[2.3px]" />;
    badgeClass = 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80';
    pillColor = 'bg-amber-500';
    pastel = {
      tileBg: '#FFF3D6',
      tileColor: '#C26C08',
      activeBorder: '#E58A1F',
      badgeBg: 'bg-[#FFF3D6] text-[#C26C08]',
      typeKey: 'review'
    };
  } else if (kind === 'LESSON') {
    stage = 'lesson';
    stageLabel = 'Lý thuyết';
    tooltipText = 'Grammar lesson';
    iconNode = <BookOpen className="w-3.5 h-3.5 stroke-[2.3px]" />;
    badgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80';
    pillColor = 'bg-emerald-500';
    pastel = {
      tileBg: '#C4EFE0',
      tileColor: '#0B7A58',
      activeBorder: '#0B7A58',
      badgeBg: 'bg-[#C4EFE0] text-[#0B7A58]',
      typeKey: 'lesson'
    };
  } else if (kind === 'GAME') {
    stage = 'game';
    stageLabel = 'Game';
    tooltipText = 'Game';
    iconNode = <Gamepad2 className="w-3.5 h-3.5 stroke-[2.3px]" />;
    badgeClass = 'bg-pink-100 text-pink-700 dark:bg-pink-950/70 dark:text-pink-300 border border-pink-200/80 dark:border-pink-800/80';
    pillColor = 'bg-pink-500';
    pastel = {
      tileBg: '#FCD5DF',
      tileColor: '#D9436C',
      activeBorder: '#FF6F96',
      badgeBg: 'bg-[#FCD5DF] text-[#D9436C]',
      typeKey: 'game'
    };
  } else if (kind === 'READING' || kind === 'BOOK') {
    stage = 'reading';
    stageLabel = kind === 'BOOK' ? 'Shadowing' : 'Đọc hiểu';
    tooltipText = kind === 'BOOK' ? 'Shadowing' : 'Reading';
    iconNode = kind === 'BOOK' ? <Mic className="w-3.5 h-3.5 stroke-[2.3px]" /> : <BookText className="w-3.5 h-3.5 stroke-[2.3px]" />;
    badgeClass = 'bg-orange-100 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/80';
    pillColor = 'bg-orange-500';
    pastel = {
      tileBg: '#FFE0CC',
      tileColor: '#E26D33',
      activeBorder: '#E26D33',
      badgeBg: 'bg-[#FFE0CC] text-[#E26D33]',
      typeKey: 'reading'
    };
  } else if (kind === 'FLASHCARD') {
    stage = 'flashcard';
    stageLabel = 'Từ vựng';
    tooltipText = 'Flashcard';
    iconNode = <Layers className="w-3.5 h-3.5 stroke-[2.3px]" />;
    badgeClass = 'bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/80';
    pillColor = 'bg-violet-500';
    pastel = {
      tileBg: '#DFD7FC',
      tileColor: '#5A3EDB',
      activeBorder: '#7B5CFA',
      badgeBg: 'bg-[#DFD7FC] text-[#5A3EDB]',
      typeKey: 'flashcard'
    };
  }

  return {
    item,
    targetUrl,
    embeddedUrl,
    kind,
    stage,
    stageLabel,
    tooltipText,
    cleanTitle,
    isReview,
    iconNode,
    badgeClass,
    pillColor,
    pastel,
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

  // Stages detected across course assignment groups (e.g. Chặng 1, Chặng 2, ...)
  const courseStages = useMemo(() => {
    const stageMap = new Map<number, {
      number: number;
      levels: Set<string>;
      groups: StudentAssignmentGroup[];
    }>();

    assignmentGroups.forEach(g => {
      const match = g.title.match(/\[?(?:Chặng|Stage)\s*(\d+)(?:\s*-\s*([^\]]+))?\]?/i);
      if (match) {
        const num = parseInt(match[1], 10);
        const level = match[2]?.trim();
        if (!stageMap.has(num)) {
          stageMap.set(num, { number: num, levels: new Set(), groups: [] });
        }
        const entry = stageMap.get(num)!;
        if (level) entry.levels.add(level);
        entry.groups.push(g);
      }
    });

    if (stageMap.size <= 1) return [];

    const sortedNumbers = Array.from(stageMap.keys()).sort((a, b) => a - b);
    return sortedNumbers.map(num => {
      const entry = stageMap.get(num)!;
      const levelsArr = Array.from(entry.levels);
      const levelStr = levelsArr.length > 0 ? levelsArr.join('-') : '';
      const theme = STAGE_THEMES[num] || DEFAULT_STAGE_THEME;
      return {
        id: `stage-${num}`,
        number: num,
        label: `Chặng ${num}`,
        levelLabel: levelStr,
        fullLabel: levelStr ? `Chặng ${num} (${levelStr})` : `Chặng ${num}`,
        groups: entry.groups,
        firstGroupId: entry.groups[0]?.id || '',
        theme,
      };
    });
  }, [assignmentGroups]);

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

  // Determine which stage should be expanded by default based on initial target group
  const initialTargetStageId = useMemo(() => {
    if (!courseStages.length) return null;
    const targetGroup = assignmentGroups.find(g => g.id === initialTargetGroupId);
    if (targetGroup) {
      const match = targetGroup.title.match(/\[?(?:Chặng|Stage)\s*(\d+)/i);
      if (match) {
        return `stage-${parseInt(match[1], 10)}`;
      }
    }
    return courseStages[0]?.id || null;
  }, [assignmentGroups, initialTargetGroupId, courseStages]);

  // Stage Accordion state (Single Accordion: Only 1 stage open at a time)
  const [expandedStageId, setExpandedStageId] = useState<string | null>(() => initialTargetStageId);

  // Toggle stage accordion (clicking open collapses any other open stage)
  const handleToggleStage = (stageId: string) => {
    setExpandedStageId(prev => (prev === stageId ? null : stageId));
  };

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
      if (groupId !== selectedGroupId) {
        clearPreloadQueue();
      }
      if (grp && grp.items.length > 0) {
        queueGroupForPreload(grp.items, activeAssignmentId, classId, groupId);
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

    // Auto expand parent stage if this group belongs to a stage
    const match = grp.title.match(/\[?(?:Chặng|Stage)\s*(\d+)/i);
    if (match) {
      const stageNum = parseInt(match[1], 10);
      setExpandedStageId(`stage-${stageNum}`);
    }

    if (groupId !== selectedGroupId) {
      clearPreloadQueue();
    }
    setSelectedGroupId(groupId);
    // Single Accordion: Only this group is expanded
    setExpandedGroups({ [groupId]: true });

    // Pick first uncompleted item or first item
    const uncompleted = grp.items.find(i => !submissionsState[i.assignment.id]?.isSubmitted);
    const chosen = uncompleted || grp.items[0];

    if (grp.items.length > 0) {
      queueGroupForPreload(grp.items, chosen?.assignment?.id, classId, groupId);
    }

    if (chosen) {
      const cfg = parseItemConfig(chosen);
      prefetchAssignmentData(chosen, classId, groupId);
      promoteAssignmentPriority(chosen.assignment.id, classId, groupId);
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

    if (parentGroupId !== selectedGroupId) {
      clearPreloadQueue();
    }

    // Always immediately promote preloading priority and unblock interaction
    prefetchAssignmentData(item, classId, parentGroupId);
    promoteAssignmentPriority(item.assignment.id, classId, parentGroupId);

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
      prefetchAssignmentData(chosenItem.item);
      promoteAssignmentPriority(chosenItem.item.assignment.id);
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
      queueGroupForPreload(activeGroup.items, activeAssignmentId, classId, activeGroup.id);
    }
  }, [activeGroup?.id, activeAssignmentId, classId]);

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

  // Combined visited configs to guarantee immediate mounting with 0-frame delay
  const displayConfigs = useMemo(() => {
    const map = { ...visitedConfigs };
    if (activeItemConfig) {
      map[activeItemConfig.item.assignment.id] = activeItemConfig;
    }
    return map;
  }, [visitedConfigs, activeItemConfig]);

  // Real-time preload progress for currently active assignment
  const activeAssignmentProgress = activeAssignmentId ? (preloadProgress[activeAssignmentId] ?? 0) : 100;
  const isActiveAssignmentCached = activeAssignmentId ? isAssignmentCached(activeAssignmentId) : true;
  const isCurrentItemLoading = Boolean(
    activeAssignmentId &&
    activeItemConfig &&
    !isActiveAssignmentCached &&
    activeAssignmentProgress < 100
  );
  const currentItemSplashPercent = Math.max(15, activeAssignmentProgress || 20);

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

  const activeTitleLower = activeItemConfig?.item?.assignment?.title?.toLowerCase() || '';
  const isCurrentLesson = Boolean(
    activeItemConfig && !isCurrentGame && (
      currentItemKind === 'LESSON' ||
      currentItemStage === 'lesson' ||
      activeItemConfig.item.assignment.materialType === 'LESSON' ||
      parseItemConfig(activeItemConfig.item).targetUrl.includes('/grammar/') ||
      activeTitleLower.includes('lý thuyết') ||
      activeTitleLower.includes('ly thuyet') ||
      activeTitleLower.includes('grammar lesson')
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

  // Overall student progress calculation (only scored assignments: exercises & reading)
  const overallStats = useMemo(() => {
    let total = 0;
    let completed = 0;
    assignmentGroups.forEach(g => {
      g.items.forEach(it => {
        if (isScoredAssignment(it)) {
          total++;
          if (submissionsState[it.assignment.id]?.isSubmitted) {
            completed++;
          }
        }
      });
    });
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [assignmentGroups, submissionsState]);

  // Metadata for active grammar lesson (for rendering level & topic badge on top action bar)
  const activeGrammarMeta = useMemo(() => {
    if (!isCurrentLesson || !activeItemConfig) return null;
    const assignment = activeItemConfig.item.assignment;
    let lessonId = assignment.grammarLesson || '';
    let topicId = assignment.grammarTopic || '';

    if (assignment.instructions) {
      try {
        const meta = JSON.parse(assignment.instructions);
        if (meta.rawId) {
          const raw = String(meta.rawId);
          if (raw.startsWith('grammar:')) {
            const parts = raw.replace(/^grammar:/, '').split(':');
            if (parts.length >= 2) {
              topicId = parts[0];
              lessonId = parts[1];
            } else if (parts.length === 1) {
              lessonId = parts[0];
            }
          } else {
            lessonId = raw;
          }
        }
        if (meta.playUrl) {
          const parts = meta.playUrl.replace(/^\/grammar\//, '').split('/');
          if (parts.length >= 2) {
            topicId = parts[0];
            lessonId = parts[1].split('?')[0];
          }
        }
      } catch {}
    }

    if (!topicId && lessonId) {
      const found = GRAMMAR_TOPICS.find(t => t.lessons.some(l => l.id === lessonId));
      if (found) topicId = found.id;
    }

    const topic = GRAMMAR_TOPICS.find(t => t.id === topicId);
    const lesson = topic?.lessons.find(l => l.id === lessonId);
    const rawLvl = (assignment.level || lesson?.level || 'a1').toLowerCase();
    const lvlCfg = CEFR_LEVELS.find(l => l.id === rawLvl) || CEFR_LEVELS[0];
    const topicLabel = topic?.label || 'Sentence Structure';

    return { lvlCfg, topicLabel };
  }, [isCurrentLesson, activeItemConfig]);

  // Search query filter: filter groups per stage or flat list
  const isSearching = Boolean(searchQuery.trim());

  const searchFilteredStages = useMemo(() => {
    if (!courseStages.length) return [];
    if (!isSearching) {
      return courseStages;
    }
    const q = searchQuery.toLowerCase().trim();
    return courseStages.map(stage => {
      const matchingGroups = stage.groups.map(group => {
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

      if (matchingGroups.length > 0) {
        return {
          ...stage,
          groups: matchingGroups,
        };
      }
      return null;
    }).filter(Boolean) as typeof courseStages;
  }, [courseStages, searchQuery, isSearching]);

  const searchFilteredGroups = useMemo(() => {
    if (!isSearching) return assignmentGroups;
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
  }, [assignmentGroups, searchQuery, isSearching]);

  // Current active submission status
  const currentSubmission = activeItemConfig ? submissionsState[activeItemConfig.item.assignment.id] : null;
  const isCurrentSubmitted = currentSubmission?.isSubmitted;
  const currentScore = currentSubmission?.score;

  // Render function for each Group card in the tree (Day card + nested activities)
  const renderGroupCard = (group: StudentAssignmentGroup, groupIdx: number) => {
    const scoredItems = group.items.filter(isScoredAssignment);
    const totalInGrp = scoredItems.length;
    const completedInGrp = scoredItems.filter(i => submissionsState[i.assignment.id]?.isSubmitted).length;
    const isGrpActive = group.id === selectedGroupId;
    const isExpanded = !!expandedGroups[group.id];
    const displayTitle = cleanGroupTitle(group.title);

    return (
      <div 
        key={group.id}
        className={`rounded-[18px_14px_18px_14px] border border-[#F0E2BF]/80 dark:border-slate-800/80 transition-all duration-300 overflow-hidden ${
          isGrpActive 
            ? 'bg-[#FFF9EC]/90 dark:bg-amber-950/20 shadow-xs' 
            : 'bg-white/75 dark:bg-slate-800/40 hover:bg-white hover:border-[#F0E2BF]'
        }`}
      >
        {/* Group Header Row */}
        <div
          onClick={() => handleSelectGroup(group.id)}
          onMouseEnter={() => {
            if (!group.isLocked && group.items.length > 0) {
              preloadAssignment(group.items[0]);
              queueGroupForPreload(group.items, undefined, classId, group.id);
            }
          }}
          title={displayTitle}
          className={`flex items-center justify-between gap-2 p-3 text-left transition-colors cursor-pointer select-none font-['Baloo_2',_'Nunito',_sans-serif] ${
            isGrpActive 
              ? 'text-[#C26C08] dark:text-amber-200' 
              : 'text-[#3E3524] dark:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={(e) => toggleGroupExpand(group.id, e)}
              className="w-5 h-5 rounded-md hover:bg-amber-100/60 dark:hover:bg-slate-700/60 flex items-center justify-center text-[#8C826D] transition-colors shrink-0 cursor-pointer"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 stroke-[2.5px]" />
              ) : (
                <ChevronRight className="w-4 h-4 stroke-[2.5px]" />
              )}
            </button>

            <div className="min-w-0">
              <h4 className="text-[12.5px] font-bold truncate leading-tight" title={displayTitle}>
                {displayTitle}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {group.isLocked ? (
              group.isWaiting5Am ? (
                <span 
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#CFE9FC] text-[#1C7FC2] border border-[#3FA9F5]/40 text-[10px] font-black"
                  title={group.lockReason}
                >
                  <Clock className="w-3 h-3 text-[#1C7FC2] stroke-[2.2px] animate-pulse" />
                  <span>Mở 05:00</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FFE0CC] text-[#E26D33] text-[10px] font-black border border-[#E26D33]/30">
                  <Lock className="w-3 h-3" /> Khóa
                </span>
              )
            ) : (
              <span className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded-lg transition-colors ${
                completedInGrp === totalInGrp && totalInGrp > 0
                  ? 'bg-[#C4EFE0] text-[#0B7A58] border border-[#0B7A58]/30'
                  : 'bg-[#F4EBD4] dark:bg-slate-700 text-[#8C826D] dark:text-slate-300'
              }`}>
                {completedInGrp}/{totalInGrp}
              </span>
            )}
          </div>
        </div>

        {/* Children Items */}
        {isExpanded && !group.isLocked && (() => {
          const tree = buildGroupTree(group.items);

          const renderItemButton = (item: StudentGroupItem, isChild = false) => {
            const parsed = parseItemConfig(item);
            const isItemActive = item.assignment.id === activeAssignmentId;
            const isSubmitted = submissionsState[item.assignment.id]?.isSubmitted;
            const itemScore = submissionsState[item.assignment.id]?.score;
            const itemProgress = preloadProgress[item.assignment.id] ?? 0;
            const isItemReady = isItemActive || itemProgress >= 100 || isAssignmentCached(item.assignment.id);

            const isPreloading = !isItemReady && itemProgress > 0 && itemProgress < 100;

            const itemIconNode = isChild && (parsed.stage === 'review' || parsed.stage === 'exercise')
              ? <FileEdit className="w-3.5 h-3.5 stroke-[2.3px]" />
              : parsed.iconNode;

            return (
              <div key={item.assignment.id} className="relative flex items-center group/item">
                {/* Visual tree connecting branch for child items */}
                {isChild && (
                  <div className="absolute left-2.5 top-0 bottom-1/2 w-3.5 border-l-2 border-b-2 border-[#F0E2BF] dark:border-slate-700 rounded-bl-lg pointer-events-none" />
                )}

                <button
                  type="button"
                  onClick={() => handleSelectAssignment(item, group.id)}
                  onMouseEnter={() => preloadAssignment(item)}
                  title={parsed.cleanTitle}
                  style={
                    isItemActive
                      ? {
                          backgroundColor: `${parsed.pastel.tileBg}66`,
                          color: parsed.pastel.tileColor,
                        }
                      : undefined
                  }
                  className={`relative w-full flex items-center justify-between gap-2 px-2.5 py-2 text-left transition-all font-['Baloo_2',_'Nunito',_sans-serif] rounded-xl border border-transparent cursor-pointer ${
                    isChild ? 'ml-5 sm:ml-6 pl-2.5' : ''
                  } ${
                    isItemActive
                      ? 'font-extrabold shadow-2xs'
                      : 'bg-white/75 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 text-[#3E3524] dark:text-slate-200 font-bold hover:shadow-2xs hover:scale-[1.01] active:scale-[0.99]'
                  }`}
                >
                  {/* Left Accent Pill (Notion / Linear style) */}
                  {isItemActive && (
                    <span 
                      className="absolute left-1 top-1.5 bottom-1.5 w-1 rounded-full shadow-2xs transition-all"
                      style={{ backgroundColor: parsed.pastel.activeBorder }}
                    />
                  )}

                  <div className="flex items-center gap-2 min-w-0">
                    <div 
                      style={{
                        backgroundColor: isItemActive ? 'white' : parsed.pastel.tileBg,
                        color: parsed.pastel.tileColor,
                      }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform shadow-2xs ${
                        isItemActive ? 'scale-105' : 'group-hover/item:scale-105'
                      }`}
                    >
                      {itemIconNode}
                    </div>
                    <span 
                      className={`truncate leading-snug font-bold ${isChild ? 'text-[11.5px]' : 'text-xs'}`}
                      title={parsed.cleanTitle}
                    >
                      {parsed.cleanTitle}
                    </span>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    {isSubmitted ? (
                      <div className="flex items-center gap-1 text-[10.5px] font-black text-[#0B7A58]">
                        {typeof itemScore === 'number' && parsed.stage !== 'lesson' && (
                          <span>{formatScore(itemScore)}</span>
                        )}
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0B7A58]" />
                      </div>
                    ) : isPreloading ? (
                      <div 
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/70 text-[10px] font-black shadow-2xs"
                        title={`Chưa sẵn sàng (Đang tải trước: ${itemProgress}%)`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                        <span className="hidden sm:inline">Chưa sẵn sàng</span>
                        <span className="tabular-nums text-[9px] font-bold opacity-85">({itemProgress}%)</span>
                      </div>
                    ) : isItemReady ? (
                      <div 
                        className="flex items-center justify-center px-1"
                        title="Sẵn sàng (Mở tức thì 0ms)"
                      >
                        <span className="relative flex h-2 w-2">
                          {isItemActive && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                          )}
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                        </span>
                      </div>
                    ) : (
                      <div 
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 text-[10px] font-bold"
                        title="Chưa sẵn sàng (Đang chờ tải)"
                      >
                        <CircleDashed className="w-2.5 h-2.5 shrink-0" />
                        <span className="hidden sm:inline">Chưa sẵn sàng</span>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          };

          return (
            <div className="p-2 space-y-1.5 border-t border-[#F0E2BF]/70 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50">
              {/* Cụm Cha - Con: Lý thuyết & Bài tập liên quan */}
              {tree.clusters.map((cluster) => (
                <div key={cluster.lesson.assignment.id} className="space-y-1">
                  {/* Bài Lý thuyết cha */}
                  {renderItemButton(cluster.lesson, false)}

                  {/* Các bài tập con (Always expanded) */}
                  {cluster.exercises.length > 0 && (
                    <div className="relative pl-1 space-y-1 pt-0.5">
                      {/* Trục dọc nối nhánh cây */}
                      {cluster.exercises.length > 1 && (
                        <div className="absolute left-[13px] top-0 bottom-3 w-0.5 bg-[#F0E2BF] dark:bg-slate-700 pointer-events-none" />
                      )}
                      {cluster.exercises.map((ex) => renderItemButton(ex, true))}
                    </div>
                  )}
                </div>
              ))}

              {/* Cụm Luyện tập bổ trợ & Ôn tập (Các bài không thuộc lý thuyết nào) */}
              {tree.supplementaryItems.length > 0 && (
                <div className="pt-1.5 space-y-1 border-t border-[#F0E2BF]/60 dark:border-slate-800/40">
                  {tree.clusters.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 cefr-redesign-section-label">
                      <FolderKanban className="w-3 h-3 text-[#8C826D]" />
                      <span>Luyện tập bổ trợ & Ôn tập</span>
                    </div>
                  )}
                  {tree.supplementaryItems.map((item) => renderItemButton(item, false))}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    );
  };

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
    <div className={`w-full transition-all duration-300 font-['Nunito',_sans-serif] ${isZenMode ? 'fixed inset-0 z-[100] bg-slate-950 p-2 sm:p-4 overflow-hidden' : 'space-y-4'}`}>
      
      {/* Dynamic Font Loading for Baloo 2 & Nunito */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />

      <style>{`
        .cefr-redesign-section-label {
          font-family: 'Baloo 2', 'Nunito', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .06em;
          color: #8C826D;
          text-transform: uppercase;
          padding: 0 2px;
        }

        @keyframes book-shake {
          0%, 100% { transform: rotate(0); }
          25% { transform: rotate(-7deg); }
          75% { transform: rotate(7deg); }
        }
        @keyframes flash-flip-anim {
          0%, 100% { transform: rotate(0) scale(1); }
          50% { transform: rotate(12deg) scale(1.12); }
        }
        @keyframes wiggle-gamepad {
          0%, 100% { transform: rotate(0); }
          25% { transform: rotate(-10deg) scale(1.1); }
          75% { transform: rotate(10deg) scale(1.1); }
        }
        @keyframes pencil-write-anim {
          0%, 100% { transform: translate(0, 0) rotate(0); }
          50% { transform: translate(3px, -3px) rotate(12deg); }
        }
        @keyframes book-float-anim {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes cap-bounce {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-4px) rotate(-6deg); }
        }
      `}</style>

      {/* ── UNIFIED 3-AREA WORKSPACE ── */}
      <div className={`flex flex-col lg:flex-row items-stretch gap-4 sm:gap-5 w-full ${isZenMode ? 'h-full' : 'min-h-[820px]'}`}>

        {/* ══════════════════════════════════════════════════════════════════
            KHU VỰC 1: SIDEBAR CÂY ĐIỀU HƯỚNG (Hierarchy Tree Drawer)
            ══════════════════════════════════════════════════════════════════ */}
        {!isZenMode && !isSidebarCollapsed && (
          <aside className="w-full lg:w-[330px] xl:w-[360px] transition-all duration-300 flex flex-col shrink-0 animate-in fade-in slide-in-from-left-3 duration-200">
              <div className="bg-[#FBF3DF]/75 dark:bg-slate-900/90 backdrop-blur-md border border-[#F0E2BF] dark:border-slate-800 rounded-[24px] shadow-sm flex flex-col h-full overflow-hidden max-h-[860px]">
                
                {/* 1.1 Header: Class Selector & Collapse Toggle */}
                <div className="p-3.5 border-b border-[#F0E2BF]/80 dark:border-slate-800/80 flex flex-col gap-2 relative">
                  <div className="flex items-center justify-between">
                    <p className="cefr-redesign-section-label">
                      Lớp học hiện tại
                    </p>
                    <button
                      type="button"
                      onClick={toggleSidebar}
                      title="Thu gọn menu"
                      className="w-7 h-7 rounded-xl bg-white/70 hover:bg-white dark:bg-slate-800 text-[#8C826D] hover:text-[#3E3524] border border-[#F0E2BF] dark:border-slate-700 flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-2xs"
                    >
                      <PanelLeftClose className="w-3.5 h-3.5 stroke-[2.2px]" />
                    </button>
                  </div>

                  <div className="relative w-full" ref={classDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsClassDropdownOpen(prev => !prev)}
                      className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-[16px] bg-white dark:bg-slate-800 text-slate-800 dark:text-white transition-all text-left group cursor-pointer active:scale-[0.99] border-2 ${
                        isClassDropdownOpen
                          ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20 shadow-md'
                          : 'border-slate-200/90 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500/60 shadow-xs hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                          isClassDropdownOpen
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50'
                        }`}>
                          <GraduationCap className="w-4 h-4 stroke-[2.3px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 
                            className="text-sm font-extrabold text-slate-800 dark:text-white truncate font-['Baloo_2',_'Nunito',_sans-serif] leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                            title={currentClass?.name || 'Lớp học của tôi'}
                          >
                            {currentClass?.name || 'Lớp học của tôi'}
                          </h4>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 shrink-0 ${
                        isClassDropdownOpen
                          ? 'rotate-180 text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 group-hover:text-indigo-500'
                      }`} />
                    </button>

                    {/* Class Dropdown */}
                    {isClassDropdownOpen && enrolledClasses.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white/98 dark:bg-slate-800/98 backdrop-blur-md border border-slate-200/90 dark:border-slate-700 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] p-2 space-y-1 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-2 pt-1 pb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                            Đổi lớp học:
                          </span>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/50">
                            {enrolledClasses.length} lớp
                          </span>
                        </div>
                        {enrolledClasses.map(cls => (
                          <Link
                            key={cls.id}
                            href={`/student/classes/${cls.id}`}
                            onClick={() => setIsClassDropdownOpen(false)}
                            title={cls.name}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-['Baloo_2',_'Nunito',_sans-serif] font-bold transition-all ${
                              cls.id === currentClass?.id 
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs' 
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-700/60 hover:text-slate-900 border border-transparent'
                            }`}
                          >
                            <span className="truncate">{cls.name}</span>
                            {cls.id === currentClass?.id && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar Content (Accordion Tree) */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* 1.3 Hierarchical Accordion Tree (Stages, Groups & Assignments) */}
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar">
                    {courseStages.length > 1 ? (
                      <div className="space-y-2.5">
                        {searchFilteredStages.map((stage) => {
                          const isExpanded = isSearching || expandedStageId === stage.id;
                          const StageIcon = stage.theme.icon;
                          
                          // Calculate completed days in this stage
                          const completedDays = stage.groups.filter(g => {
                            const scored = g.items.filter(isScoredAssignment);
                            return scored.length > 0 && scored.every(i => submissionsState[i.assignment.id]?.isSubmitted);
                          }).length;
                          const isStageFullyCompleted = completedDays === stage.groups.length && stage.groups.length > 0;
                          const containsActiveGroup = stage.groups.some(g => g.id === selectedGroupId);

                          return (
                            <div 
                              key={stage.id}
                              style={
                                isExpanded
                                  ? { borderColor: `${stage.theme.color}70` }
                                  : { 
                                      backgroundColor: stage.theme.cardBg, 
                                      borderColor: stage.theme.cardBorder,
                                    }
                              }
                              className={`rounded-[18px] transition-all duration-300 overflow-hidden ${
                                isExpanded
                                  ? 'border-2 bg-white/95 dark:bg-slate-900/90 shadow-xs'
                                  : containsActiveGroup
                                    ? 'border-2 shadow-xs ring-2 ring-indigo-400/20'
                                    : 'border-2 shadow-2xs hover:shadow-xs hover:brightness-[0.98] dark:hover:brightness-110'
                              }`}
                            >
                              {/* Stage Header Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleStage(stage.id)}
                                className={`w-full flex items-center justify-between gap-2.5 p-2.5 sm:p-3 transition-all text-left cursor-pointer select-none font-['Baloo_2',_'Nunito',_sans-serif] ${
                                  isExpanded
                                    ? `bg-gradient-to-r ${stage.theme.gradient} text-white shadow-sm`
                                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div 
                                    style={!isExpanded ? { backgroundColor: 'white', color: stage.theme.color, borderColor: stage.theme.cardBorder } : undefined}
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                                      isExpanded 
                                        ? 'bg-white/20 text-white scale-105' 
                                        : 'shadow-xs border-2'
                                    }`}
                                  >
                                    <StageIcon className="w-4 h-4 stroke-[2.3px]" />
                                  </div>
                                  
                                  <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                                    <h3 
                                      style={!isExpanded ? { color: stage.theme.textColor } : undefined}
                                      className={`text-[13px] sm:text-sm font-black truncate leading-tight ${isExpanded ? 'text-white' : ''}`}
                                    >
                                      {stage.label}
                                    </h3>
                                    {stage.levelLabel && (
                                      <span 
                                        style={!isExpanded ? { backgroundColor: 'white', color: stage.theme.textColor, borderColor: stage.theme.cardBorder } : undefined}
                                        className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-extrabold ${
                                          isExpanded
                                            ? 'bg-white/20 text-white'
                                            : 'border shadow-2xs'
                                        }`}
                                      >
                                        {stage.levelLabel}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span 
                                    style={!isExpanded ? { backgroundColor: 'white', color: stage.theme.textColor, borderColor: stage.theme.cardBorder } : undefined}
                                    className={`text-[10px] font-black px-2 py-0.5 rounded-lg transition-colors ${
                                      isExpanded
                                        ? 'bg-white/20 text-white'
                                        : isStageFullyCompleted
                                          ? 'border shadow-2xs font-black'
                                          : 'border shadow-2xs'
                                    }`}
                                  >
                                    {isStageFullyCompleted ? '✓ Hoàn thành' : `${completedDays}/${stage.groups.length} ngày`}
                                  </span>

                                  <ChevronDown 
                                    style={!isExpanded ? { color: stage.theme.textColor } : undefined}
                                    className={`w-4 h-4 transition-transform duration-300 ${
                                      isExpanded 
                                        ? 'text-white rotate-180' 
                                        : ''
                                    }`} 
                                  />
                                </div>
                              </button>

                              {/* Stage Groups (Days) Body */}
                              {isExpanded && (
                                <div className="p-2 sm:p-2.5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200 bg-white/70 dark:bg-slate-900/60">
                                  {stage.groups.map((group, groupIdx) => renderGroupCard(group, groupIdx))}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {searchFilteredStages.length === 0 && (
                          <div className="p-6 text-center text-[#8C826D] dark:text-slate-500 text-xs font-['Baloo_2',_'Nunito',_sans-serif]">
                            <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#8C826D]" />
                            <p className="font-bold">Không tìm thấy bài học nào</p>
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="mt-2 text-[#12A375] font-extrabold hover:underline cursor-pointer"
                            >
                              Xóa tìm kiếm
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {searchFilteredGroups.map((group, groupIdx) => renderGroupCard(group, groupIdx))}
                        {searchFilteredGroups.length === 0 && (
                          <div className="p-6 text-center text-[#8C826D] dark:text-slate-500 text-xs font-['Baloo_2',_'Nunito',_sans-serif]">
                            <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#8C826D]" />
                            <p className="font-bold">Không tìm thấy bài học nào</p>
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="mt-2 text-[#12A375] font-extrabold hover:underline cursor-pointer"
                            >
                              Xóa tìm kiếm
                            </button>
                          </div>
                        )}
                      </div>
                    )}
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
              KHU VỰC 2: TOP ACTION BAR (Tiêu đề bài học & Điều hướng nhanh)
              ════════════════════════════════════════════════════════════════ */}
          {!isSidebarCollapsed && (
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-[#F0E2BF]/80 dark:border-slate-800/80 rounded-[24px] p-3.5 sm:p-4 shadow-xs animate-in fade-in slide-in-from-top-3 duration-200 font-['Nunito',_sans-serif]">
              
              {/* Top row: Breadcrumb, Title & Global Action CTAs */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-1 flex-wrap">
                    <span title={currentClass?.name || 'Lớp học'}>{currentClass?.name || 'Lớp học'}</span>
                    <span>/</span>
                    <span className="text-slate-600 dark:text-slate-300 truncate" title={cleanGroupTitle(activeGroup?.title)}>{cleanGroupTitle(activeGroup?.title)}</span>
                  </div>

                  {/* Active Activity Title */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 
                      className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight"
                      title={activeItemConfig?.cleanTitle || 'Chọn bài học để bắt đầu'}
                    >
                      {activeItemConfig?.cleanTitle || 'Chọn bài học để bắt đầu'}
                    </h2>

                    {/* Status Badges - Ẩn hoàn toàn khi là bài Lý thuyết */}
                    {activeItemConfig && !isCurrentLesson && (
                      <div className="flex items-center gap-1.5">
                        {isCurrentSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200/60 dark:border-emerald-800/60">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{typeof currentScore === 'number' ? formatScore(currentScore) : 'Đã làm'}</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-extrabold text-[11px]">
                              <CircleDashed className="w-3.5 h-3.5" /> Chưa làm
                            </span>
                            {isActiveAssignmentCached ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-black text-[10.5px] border border-emerald-200/60 dark:border-emerald-900/60 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Sẵn sàng
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 font-black text-[10.5px] border border-amber-200/60 dark:border-amber-900/60 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Chưa sẵn sàng
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vị trí bôi đỏ: Badge trình độ & chủ đề khi là bài lý thuyết + Nút Thu gọn sidebar */}
                <div className="shrink-0 flex items-center gap-2">
                  {isCurrentLesson && activeGrammarMeta && (
                    <>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${activeGrammarMeta.lvlCfg.bg} ${activeGrammarMeta.lvlCfg.color} border ${activeGrammarMeta.lvlCfg.border}`}>
                        {activeGrammarMeta.lvlCfg.label}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        {activeGrammarMeta.topicLabel}
                      </span>
                    </>
                  )}

                  {!isZenMode && (
                    <button
                      type="button"
                      title="Thu gọn menu & thanh trên để tối đa khung làm bài"
                      onClick={toggleSidebar}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-bold text-xs transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700/60 shadow-xs"
                    >
                      <PanelLeftClose className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Thu gọn</span>
                    </button>
                  )}
                </div>
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
            <div className="relative flex-1 w-full h-full bg-white dark:bg-slate-900 overflow-hidden">
              {/* ── Area 3: Soft Splash Loading Overlay (Hướng 3: Mỏng nhẹ, êm dịu, không gián đoạn) ── */}
              {isCurrentItemLoading && activeItemConfig && (
                <div 
                  key={`splash-${activeAssignmentId}`}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-white/92 dark:bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-200"
                >
                  <div className="relative flex flex-col items-center max-w-sm w-full mx-auto text-center space-y-4">
                    {/* Soft pulsating glow behind icon */}
                    <div 
                      className="absolute -top-3 w-28 h-28 rounded-full blur-2xl opacity-40 animate-pulse pointer-events-none"
                      style={{ backgroundColor: activeItemConfig.pastel.activeBorder }}
                    />

                    {/* Item Icon Card with soft bounce */}
                    <div 
                      className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/80 dark:border-slate-800 transition-transform animate-bounce"
                      style={{
                        backgroundColor: activeItemConfig.pastel.tileBg,
                        color: activeItemConfig.pastel.tileColor,
                      }}
                    >
                      <div className="scale-150">
                        {activeItemConfig.iconNode}
                      </div>
                    </div>

                    {/* Stage Badge & Title */}
                    <div className="space-y-1.5 w-full">
                      <div 
                        className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-2xs"
                        style={{
                          backgroundColor: activeItemConfig.pastel.tileBg,
                          color: activeItemConfig.pastel.tileColor,
                        }}
                      >
                        <Sparkles className="w-3 h-3 animate-spin" />
                        <span>{activeItemConfig.stageLabel}</span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white line-clamp-2 px-2">
                        {activeItemConfig.cleanTitle}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        {currentItemSplashPercent >= 85 
                          ? 'Sẵn sàng khởi chạy bài tập...' 
                          : currentItemSplashPercent >= 50 
                            ? 'Đang chuẩn bị nội dung bài học...' 
                            : 'Đang kết nối dữ liệu câu hỏi...'}
                      </p>
                    </div>

                    {/* Smooth Progress Bar */}
                    <div className="w-56 sm:w-64 space-y-1.5 pt-1">
                      <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-sky-500 to-emerald-500 transition-all duration-300 ease-out relative overflow-hidden"
                          style={{ width: `${currentItemSplashPercent}%` }}
                        >
                          <div className="absolute inset-0 bg-white/30 animate-pulse" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10.5px] font-black text-slate-400 dark:text-slate-500 px-1">
                        <span>
                          {currentItemSplashPercent >= 85 
                            ? 'Hoàn tất dữ liệu' 
                            : currentItemSplashPercent >= 50 
                              ? 'Tối ưu hóa dữ liệu' 
                              : 'Tải nội dung'}
                        </span>
                        <span className="tabular-nums">{currentItemSplashPercent}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {Object.keys(displayConfigs).length > 0 ? (
                Object.values(displayConfigs).map((cfg) => {
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

                  const itemTitleLower = (cfg.item.assignment.title || '').toLowerCase();
                  const isLesson = Boolean(
                    !isGame && (
                      itemKind === 'LESSON' ||
                      itemStage === 'lesson' ||
                      cfg.item.assignment.materialType === 'LESSON' ||
                      parseItemConfig(cfg.item).targetUrl.includes('/grammar/') ||
                      itemTitleLower.includes('lý thuyết') ||
                      itemTitleLower.includes('ly thuyet') ||
                      itemTitleLower.includes('grammar lesson')
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
                          initialInstructions={
                            cfg.item.assignment.instructions && !cfg.item.assignment.instructions.trim().startsWith('{')
                              ? cfg.item.assignment.instructions
                              : null
                          }
                          initialInstructionsTranslations={
                            cfg.item.assignment.instructions && !cfg.item.assignment.instructions.trim().startsWith('{')
                              ? cfg.item.assignment.instructionsTranslations
                              : null
                          }
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

            {lockedGroupModal.isWaiting5Am ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
                  <Clock className="w-8 h-8 stroke-[2.2px] animate-pulse" />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-black text-[11px] uppercase tracking-wider">
                    Bài học tiếp theo
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white pt-1">
                    {lockedGroupModal.title}
                  </h3>
                  <div className="bg-blue-50/80 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200/70 dark:border-blue-800/60 text-left space-y-2 my-2">
                    <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-black text-xs">
                      <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Bạn đã hoàn thành bài học hôm nay!</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                      {lockedGroupModal.lockReason}
                    </p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold pt-1">
                      💡 Mỗi ngày 1 bài giúp não bộ ghi nhớ sâu và bền vững. Hãy nghỉ ngơi và quay lại vào 05:00 nhé!
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-md">
                  <Lock className="w-8 h-8 stroke-[2px]" />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-black text-[11px] uppercase tracking-wider">
                    Nhóm bài đang tạm khóa
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white pt-1">
                    {cleanGroupTitle(lockedGroupModal.title)}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed pt-1">
                    {lockedGroupModal.lockReason || 'Bạn cần hoàn thành nhóm bài trước để mở khóa nhóm bài này.'}
                  </p>
                </div>
              </>
            )}

            {/* Prerequisite progress bar */}
            {lockedGroupModal.prerequisiteGroupId && (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-left space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300 truncate">
                    Tiến độ "{cleanGroupTitle(lockedGroupModal.prerequisiteGroupTitle)}":
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
                {cleanGroupTitle(unlockedCelebration.title)}
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
