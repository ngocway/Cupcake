"use client";

import React, { useState, useMemo } from 'react';
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
  Check
} from 'lucide-react';
import { LearningFlowLanes } from './LearningFlowLanes';

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
}

export interface StudentAssignmentGroup {
  id: string;
  title: string;
  createdAt: string | null;
  items: StudentGroupItem[];
}

export interface StudentAssignmentsViewProps {
  assignmentGroups: StudentAssignmentGroup[];
  initialGroupId?: string | null;
  initialViewAll?: boolean;
  classId?: string;
}

export function StudentAssignmentsView({ 
  assignmentGroups,
  initialGroupId = null,
  initialViewAll = false,
  classId
}: StudentAssignmentsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const urlGroupId = searchParams.get('groupId') ?? initialGroupId;
  const isViewAll = searchParams.get('viewAll') === 'true' || (initialViewAll && !searchParams.has('groupId'));

  const activeGroupId = useMemo(() => {
    if (urlGroupId && assignmentGroups.some((g) => g.id === urlGroupId)) {
      return urlGroupId;
    }
    if (!isViewAll && assignmentGroups.length === 1) {
      return assignmentGroups[0].id;
    }
    return null;
  }, [urlGroupId, isViewAll, assignmentGroups]);

  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeGroup = useMemo(() => {
    return activeGroupId 
      ? assignmentGroups.find((g) => g.id === activeGroupId) || null
      : null;
  }, [activeGroupId, assignmentGroups]);

  const handleSelectGroup = (groupId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('groupId', groupId);
    params.delete('viewAll');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleBackToGroupList = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('groupId');
    if (assignmentGroups.length === 1) {
      params.set('viewAll', 'true');
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  // Helper to parse kind, targetUrl and UI representation for an item
  const getItemConfig = (item: StudentGroupItem) => {
    let targetUrl = `/student/assignments/${item.assignment.id}/run`;
    let kind = 'EXERCISE';
    let label = 'Grammar exercise';

    if (item.assignment.instructions) {
      try {
        const meta = JSON.parse(item.assignment.instructions);
        if (meta.playUrl) targetUrl = meta.playUrl;
        if (meta.kind) kind = meta.kind;
      } catch {}
    }

    if (kind === 'GRAMMAR' || kind === 'EXERCISE') {
      if (item.assignment.materialType === 'READING') {
        kind = 'READING';
      } else if (item.assignment.materialType === 'FLASHCARD') {
        kind = 'FLASHCARD';
      } else {
        kind = 'EXERCISE';
      }
    }

    if (kind === 'EXERCISE' || kind === 'READING' || kind === 'GRAMMAR') {
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

    let iconNode = <ClipboardList className="w-5 h-5 stroke-[1.8px]" />;
    let boxClass = 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    let badgeClass = 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60';
    label = 'Grammar exercise';

    if (kind === 'LESSON') {
      iconNode = <BookOpen className="w-5 h-5 stroke-[1.8px]" />;
      boxClass = 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400';
      badgeClass = 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60';
      label = 'Grammar lesson';
    } else if (kind === 'EXERCISE') {
      iconNode = <ClipboardList className="w-5 h-5 stroke-[1.8px]" />;
      boxClass = 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      badgeClass = 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60';
      label = 'Grammar exercise';
    } else if (kind === 'GAME') {
      iconNode = <Gamepad2 className="w-5 h-5 stroke-[1.8px]" />;
      boxClass = 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400';
      badgeClass = 'bg-pink-100/80 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 border border-pink-200/60 dark:border-pink-800/60';
      label = 'Game';
    } else if (kind === 'BOOK') {
      iconNode = <BookOpen className="w-5 h-5 stroke-[1.8px]" />;
      boxClass = 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
      badgeClass = 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60';
      label = 'Shadowing';
    } else if (kind === 'FLASHCARD') {
      iconNode = <Layers className="w-5 h-5 stroke-[1.8px]" />;
      boxClass = 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      badgeClass = 'bg-purple-100/80 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60';
      label = 'Flashcard';
    } else if (kind === 'READING') {
      iconNode = <BookText className="w-5 h-5 stroke-[1.8px]" />;
      boxClass = 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
      badgeClass = 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60';
      label = 'Reading';
    }

    return { targetUrl, kind, label, iconNode, boxClass, badgeClass };
  };

  // Helper to count kinds breakdown in group
  const getKindBreakdown = (items: StudentGroupItem[]) => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      let kind = 'Grammar exercise';
      if (item.assignment.instructions) {
        try {
          const meta = JSON.parse(item.assignment.instructions);
          if (meta.kind === 'LESSON') kind = 'Grammar lesson';
          else if (meta.kind === 'GAME') kind = 'Game';
          else if (meta.kind === 'FLASHCARD') kind = 'Flashcard';
          else if (meta.kind === 'READING') kind = 'Reading';
          else if (meta.kind === 'BOOK') kind = 'Shadowing';
          else if (meta.kind === 'EXERCISE' || meta.kind === 'GRAMMAR') kind = 'Grammar exercise';
        } catch {}
      } else if (item.assignment.materialType === 'READING') {
        kind = 'Reading';
      } else if (item.assignment.materialType === 'FLASHCARD') {
        kind = 'Flashcard';
      }
      counts[kind] = (counts[kind] || 0) + 1;
    });

    return Object.entries(counts).map(([label, count]) => ({ label, count }));
  };

  // Filter groups
  const filteredGroups = useMemo(() => {
    return assignmentGroups.filter((group) => {
      const totalInGroup = group.items.length;
      const completedInGroup = group.items.filter(i => i.isSubmitted).length;
      const isCompleted = totalInGroup > 0 && completedInGroup === totalInGroup;

      if (filterTab === 'completed' && !isCompleted) return false;
      if (filterTab === 'pending' && isCompleted) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = group.title.toLowerCase().includes(query);
        const matchItem = group.items.some(i => i.assignment.title.toLowerCase().includes(query));
        if (!matchTitle && !matchItem) return false;
      }

      return true;
    });
  }, [assignmentGroups, filterTab, searchQuery]);

  const totalGroupsCount = assignmentGroups.length;
  const completedGroupsCount = assignmentGroups.filter(g => g.items.length > 0 && g.items.every(i => i.isSubmitted)).length;
  const pendingGroupsCount = totalGroupsCount - completedGroupsCount;

  if (assignmentGroups.length === 0) {
    return (
      <div className="p-12 text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-dashed border-slate-200/80 dark:border-slate-700/80 rounded-3xl shadow-xs space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto text-slate-400">
          <FolderOpen className="w-7 h-7 stroke-[1.8px]" />
        </div>
        <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200">Chưa có bài tập nào</h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
          Giáo viên chưa giao bài tập cho lớp học này. Vui lòng quay lại sau hoặc liên hệ với giáo viên phụ trách nhé!
        </p>
      </div>
    );
  }

  /* VIEW 1: DRILL-DOWN INTO SINGLE GROUP */
  if (activeGroup) {
    const totalInGroup = activeGroup.items.length;
    const completedInGroup = activeGroup.items.filter(i => i.isSubmitted).length;
    const groupPercent = totalInGroup > 0 ? Math.round((completedInGroup / totalInGroup) * 100) : 0;
    const isAllCompleted = totalInGroup > 0 && completedInGroup === totalInGroup;

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Back Button */}
        <div>
          <button
            onClick={handleBackToGroupList}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5px]" />
            <span>Quay lại danh sách nhóm bài</span>
          </button>
        </div>

        {/* Group Header Bento */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-[1.75rem] p-6 sm:p-7 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
                <FolderOpen className="w-7 h-7 stroke-[2px]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {activeGroup.title}
                  </h2>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/50">
                    {totalInGroup} bài học
                  </span>
                </div>
                {activeGroup.createdAt && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 inline text-slate-400" />
                    Ngày giao: {new Date(activeGroup.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                )}
              </div>
            </div>

            {/* Progress summary indicator */}
            <div className="bg-slate-50 dark:bg-slate-900/60 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-xs font-black flex items-center gap-1.5 ${
                  isAllCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {isAllCompleted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 inline" />
                      Hoàn thành toàn bộ ({completedInGroup}/{totalInGroup})
                    </>
                  ) : (
                    <>
                      <CircleDashed className="w-4 h-4 inline" />
                      Tiến độ: {completedInGroup}/{totalInGroup} đã làm ({groupPercent}%)
                    </>
                  )}
                </span>
              </div>
              <div className="w-40 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isAllCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                  }`}
                  style={{ width: `${groupPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Child Items: Rendered into Pedagogical Learning Flow Lanes */}
        <LearningFlowLanes items={activeGroup.items} />
      </div>
    );
  }

  /* VIEW 2: BENTO GRID OF GROUP CARDS */
  return (
    <div className="space-y-6">
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Tất cả ({totalGroupsCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'pending'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Cần làm ({pendingGroupsCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'completed'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Đã xong ({completedGroupsCount})
          </button>
        </div>

        {/* Search input (if there are groups) */}
        {assignmentGroups.length > 1 && (
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên bài..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        )}
      </div>

      {/* Filtered Empty State */}
      {filteredGroups.length === 0 ? (
        <div className="p-10 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl space-y-2">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
            Không tìm thấy nhóm bài tập nào phù hợp với bộ lọc.
          </p>
          <button
            type="button"
            onClick={() => { setFilterTab('all'); setSearchQuery(''); }}
            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredGroups.map((group) => {
            const totalInGroup = group.items.length;
            const completedInGroup = group.items.filter(i => i.isSubmitted).length;
            const groupPercent = totalInGroup > 0 ? Math.round((completedInGroup / totalInGroup) * 100) : 0;
            const isAllCompleted = totalInGroup > 0 && completedInGroup === totalInGroup;
            const pendingInGroup = totalInGroup - completedInGroup;

            const newCount = group.items.filter(i => {
              try { return JSON.parse(i.assignment.instructions || '{}').section !== 'REVIEW'; } catch { return true; }
            }).length;
            const reviewCount = group.items.filter(i => {
              try { return JSON.parse(i.assignment.instructions || '{}').section === 'REVIEW'; } catch { return false; }
            }).length;

            return (
              <div
                key={group.id}
                onClick={() => handleSelectGroup(group.id)}
                className="group relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/70 dark:border-slate-700/70 rounded-[1.75rem] p-6 hover:shadow-2xl hover:border-indigo-400/60 dark:hover:border-indigo-500/60 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs"
              >
                {/* Top Accent Gradient Bar */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                <div>
                  {/* Top Bar: Icon + Status Pills */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-violet-500/10 dark:from-blue-500/20 dark:to-violet-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-xs">
                      <BookOpen className="w-5 h-5 stroke-[2px]" />
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50">
                        {newCount} bài mới
                      </span>
                      {reviewCount > 0 && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800/50">
                          {reviewCount} ôn bài
                        </span>
                      )}
                      {isAllCompleted ? (
                        <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/70 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 inline" />
                          Hoàn thành
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {completedInGroup}/{totalInGroup} bài
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Group Title */}
                  <h3 className="font-black text-lg text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                    {group.title}
                  </h3>

                  {/* Assigned Date */}
                  {group.createdAt && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 inline text-slate-400" />
                      Ngày giao: {new Date(group.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  )}

                  {/* Mini Task Capsules (Interactive Preview) */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      <span>Lộ trình bài học</span>
                      <span>{totalInGroup} bài</span>
                    </div>

                    {group.items.slice(0, 3).map((item) => {
                      const cfg = getItemConfig(item);
                      const titleClean = item.assignment.title.replace(/^(Lý thuyết|Bài tập|Grammar lesson|Grammar exercise):\s*/i, '');

                      return (
                        <div 
                          key={item.assignment.id} 
                          className="flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-slate-50/90 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-800 transition-all text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-5 h-5 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-xs border border-slate-100 dark:border-slate-700">
                              {cfg.kind === 'GAME' ? (
                                <Gamepad2 className="w-3 h-3 text-pink-500" />
                              ) : cfg.kind === 'LESSON' ? (
                                <BookOpen className="w-3 h-3 text-indigo-500" />
                              ) : cfg.kind === 'READING' ? (
                                <BookText className="w-3 h-3 text-emerald-500" />
                              ) : cfg.kind === 'FLASHCARD' ? (
                                <Layers className="w-3 h-3 text-purple-500" />
                              ) : (
                                <ClipboardList className="w-3 h-3 text-blue-500" />
                              )}
                            </div>
                            <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                              {titleClean}
                            </span>
                          </div>

                          {item.isSubmitted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px] shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3px]" />
                              Xong
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-semibold text-[10px] shrink-0 border border-amber-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              Chưa làm
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {group.items.length > 3 && (
                      <div className="px-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 pt-0.5">
                        <Sparkles className="w-3 h-3" />
                        <span>+{group.items.length - 3} hoạt động học tập khác...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress & CTA Footer */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                  {/* Progress info */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Tiến độ bài làm</span>
                    <span className={`font-black ${isAllCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                      {completedInGroup}/{totalInGroup} bài ({groupPercent}%)
                    </span>
                  </div>

                  {/* Segmented Step Bar (Stories style) */}
                  <div className="flex items-center gap-1.5 w-full">
                    {group.items.map((it, idx) => (
                      <div 
                        key={idx}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                          it.isSubmitted 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-xs' 
                            : 'bg-slate-200/80 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Smart Bento CTA Button */}
                  <div className="pt-1">
                    <div className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-between bg-slate-100/90 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-600/60 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white group-hover:border-transparent group-hover:shadow-md transition-all duration-300">
                      <span>
                        {isAllCompleted
                          ? 'Xem lại bài đã học' 
                          : `Vào làm bài (còn ${pendingInGroup} bài)`}
                      </span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
