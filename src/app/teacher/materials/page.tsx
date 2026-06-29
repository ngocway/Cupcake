"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MaterialListItem } from './_components/MaterialListItem';
import { MaterialStatus } from '@prisma/client';
import { createDraftMaterial, bulkDeleteMaterials, bulkRestoreMaterials, bulkPermanentlyDeleteMaterials, createMaterialWithQuestions, bulkPublishMaterials } from '@/actions/material-actions';
import { useSession } from 'next-auth/react';
import { Plus, Sparkles, ArrowLeft, Trash2, RotateCcw, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { AIGeneratorModal } from '@/components/quiz/AIGeneratorModal';
import { QuestionType } from '@/components/quiz/types';

type Assignment = {
  id: string;
  title: string;
  status: MaterialStatus;
  materialType: any;
  subject: string | null;
  gradeLevel: string | null;
  thumbnail: string | null;
  questionCount: number;
  assignedCount: number;
  viewCount: number;
  publicSubmissionCount: number;
  tags: string[];
  targetAudiences?: string[];
  level?: string | null;
  learningGoals?: string[];
  createdAt: string;
  classes?: any[];
  audioUrl?: string | null;
  audioMetadata?: any;
};

export default function MaterialLibraryPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  // This page is the "Bài tập" tab: show exercises by default
  const [typeFilter, setTypeFilter] = useState<string>('EXERCISE');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTrash, setShowTrash] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Advanced Filters
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [learningGoalFilter, setLearningGoalFilter] = useState<string>('ALL');
  const [tagFilter, setTagFilter] = useState<string>('ALL');
  const [config, setConfig] = useState<any>(null);
  const [popularTags, setPopularTags] = useState<string[]>([]);

  useEffect(() => {
    import('@/actions/user-preferences-actions').then(m => m.getOnboardingConfig().then(setConfig));
    import('@/actions/tag-actions').then(m => m.getPopularTags().then(setPopularTags));
  }, []);
  
  // Custom Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    show: boolean;
    type: 'DELETE' | 'RESTORE' | 'PERMANENT_DELETE' | 'PUBLISH';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'DELETE',
    title: '',
    message: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) setSearchQuery(q);

    const handleSearchChange = () => {
      const p = new URLSearchParams(window.location.search);
      setSearchQuery(p.get('q') || '');
    };

    window.addEventListener('search-change', handleSearchChange);
    return () => window.removeEventListener('search-change', handleSearchChange);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('trash') === 'true') setShowTrash(true);
  }, []);

  const [isCreating, setIsCreating] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isCreatingFromAI, setIsCreatingFromAI] = useState(false);

  const handleAIGeneratedQuestions = async (
    results: {
      generatedData: { type: QuestionType; questions: any[] }[];
      metadata?: any;
    }[]
  ) => {
    setIsCreatingFromAI(true);
    try {
      const typeToCreate = typeFilter === 'ALL' ? 'EXERCISE' : typeFilter;
      let firstId = '';

      for (let i = 0; i < results.length; i++) {
        const { generatedData, metadata } = results[i];
        
        const questionsToSave = generatedData.flatMap(({ type, questions }) => {
          return questions.map((gq: any) => {
            let content: any = { ...gq };
            const uuidv4 = () => typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2);
            
            if (type === 'MULTIPLE_CHOICE' && content.options) {
              content.options = content.options.map((opt: any) => ({
                ...opt,
                id: uuidv4()
              }));
              content.allowMultipleAnswers = content.options.filter((o:any)=>o.isCorrect).length > 1;
            }
            if (type === 'TRUE_FALSE') {
              content.displayStyle = 'TRUE_FALSE';
            }
            if (type === 'MATCHING' && content.pairs) {
              content.pairs = content.pairs.map((pair: any) => ({
                ...pair,
                id: uuidv4()
              }));
            }
            if (type === 'CLOZE_TEST') {
              content.caseSensitive = content.caseSensitive ?? false;
            }
            if (type === 'REORDER' && content.items) {
              content.items = content.items.map((item: any) => ({
                ...item,
                id: item.id || uuidv4()
              }));
            }
            
            const explanation = content.explanation;
            const explanationTranslations = content.explanationTranslations || null;
            delete content.explanation;
            delete content.explanationTranslations;

            return {
              type,
              points: 1.0,
              isBanked: false,
              isAiGenerated: true,
              explanation: explanation || '',
              explanationTranslations,
              content
            };
          });
        });

        let finalTitle = metadata?.title || `Bài tập AI mới`;
        if (results.length > 1) {
          const suffix = ` Part ${i + 1}`;
          const cleanTitle = finalTitle.replace(/\s+Part\s+\d+$/i, '').trim();
          finalTitle = `${cleanTitle}${suffix}`;
        } else {
          finalTitle = finalTitle.replace(/\s+Part\s+\d+$/i, '').trim();
        }

        const audienceOrder = ["kindergarten", "kid", "teen", "learner"];
        const primaryAudience = audienceOrder.find(a => metadata?.targetAudiences?.includes(a)) || "kid";
        const primaryLevel = metadata?.audienceLevels?.[primaryAudience] || null;

        const newId = await createMaterialWithQuestions({
          title: finalTitle,
          materialType: typeToCreate,
          questions: questionsToSave,
          shortDescription: metadata?.shortDescription || '',
          instructions: metadata?.instructions || '',
          instructionsTranslations: metadata?.instructionsTranslations || null,
          thumbnailImagePrompt: metadata?.thumbnailImagePrompt || '',
          subject: metadata?.subject,
          targetAudiences: metadata?.targetAudiences,
          audienceLevels: metadata?.audienceLevels,
          learningGoals: metadata?.learningGoals,
          level: primaryLevel || undefined,
        });

        if (i === 0) {
          firstId = newId;
        }
      }

      setShowAIModal(false);
      if (firstId) {
        router.push(`/teacher/materials/${firstId}/edit`);
      }
    } catch (err) {
      console.error('Failed to create material from AI:', err);
      alert('Có lỗi xảy ra khi tạo bài tập từ AI: ' + (err as Error).message);
    } finally {
      setIsCreatingFromAI(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);

  const fetchAssignments = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const url = new URL('/api/assignments', window.location.origin);
      url.searchParams.set('sort', sortOrder);
      url.searchParams.set('trash', showTrash.toString());
      if (typeFilter !== 'ALL') url.searchParams.set('type', typeFilter);
      // Do NOT show lesson-linked practice assignments in the "Bài tập" tab
      url.searchParams.set('excludeLessonLinked', 'true');
      url.searchParams.set('t', Date.now().toString());
      
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.assignments) {
        setAssignments(data.assignments);
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    setCurrentPage(1);
  }, [statusFilter, typeFilter, sortOrder, showTrash]);

  const openConfirm = (type: 'DELETE' | 'RESTORE' | 'PERMANENT_DELETE' | 'PUBLISH') => {
    let title = '';
    let message = '';
    if (type === 'DELETE') {
      title = 'Xóa đã chọn?';
      message = `Bạn có chắc chắn muốn chuyển ${selectedIds.length} bài tập đã chọn vào thùng rác?`;
    } else if (type === 'RESTORE') {
      title = 'Khôi phục đã chọn?';
      message = `Bạn có chắc chắn muốn khôi phục ${selectedIds.length} bài tập đã chọn?`;
    } else if (type === 'PERMANENT_DELETE') {
      title = 'Xóa vĩnh viễn?';
      message = `CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn ${selectedIds.length} bài tập đã chọn và KHÔNG THỂ khôi phục.`;
    } else if (type === 'PUBLISH') {
      title = 'Công khai đã chọn?';
      message = `Bạn có chắc chắn muốn công khai ${selectedIds.length} bài tập đã chọn?`;
    }
    setConfirmConfig({ show: true, type, title, message });
  };

  const executeBulkAction = async () => {
    const { type } = confirmConfig;
    setConfirmConfig(prev => ({ ...prev, show: false }));
    setIsBulkProcessing(true);
    
    try {
      if (type === 'DELETE') {
        await bulkDeleteMaterials(selectedIds);
        setAssignments(prev => prev.filter(a => !selectedIds.includes(a.id)));
      }
      if (type === 'RESTORE') {
        await bulkRestoreMaterials(selectedIds);
        setAssignments(prev => prev.filter(a => !selectedIds.includes(a.id)));
      }
      if (type === 'PERMANENT_DELETE') {
        await bulkPermanentlyDeleteMaterials(selectedIds);
        setAssignments(prev => prev.filter(a => !selectedIds.includes(a.id)));
      }
      if (type === 'PUBLISH') {
        await bulkPublishMaterials(selectedIds);
        setAssignments(prev => prev.map(a => selectedIds.includes(a.id) ? { ...a, status: 'PUBLIC' as MaterialStatus } : a));
      }
      
      setSelectedIds([]);
      fetchAssignments(false);
    } catch (err) {
      console.error('Bulk action failed:', err);
      alert('Thao tác hàng loạt thất bại.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesType = typeFilter === 'ALL' || a.materialType === typeFilter;
    let matchesStatus = true;
    const now = new Date().getTime();

    if (statusFilter === 'DRAFT') {
      matchesStatus = a.status === 'DRAFT';
    } else if (statusFilter === 'ONGOING') {
      matchesStatus = Boolean((a.status === 'PUBLIC' || a.status === 'PRIVATE') &&
             (!a.classes?.length || a.classes.some((c: any) => !c.dueDate || new Date(c.dueDate).getTime() > now)));
    } else if (statusFilter === 'ENDED') {
      matchesStatus = Boolean((a.status === 'PUBLIC' || a.status === 'PRIVATE') &&
             (a.classes && a.classes.length > 0 && a.classes.every((c: any) => c.dueDate && new Date(c.dueDate).getTime() < now)));
    }

    const matchesSubject = subjectFilter === 'ALL' || a.subject === subjectFilter;
    const matchesAge = ageGroupFilter === 'ALL' || (a.targetAudiences && a.targetAudiences.includes(ageGroupFilter));
    const matchesLevel = levelFilter === 'ALL' || a.level === levelFilter;
    const matchesGoal = learningGoalFilter === 'ALL' || (a.learningGoals && a.learningGoals.includes(learningGoalFilter));
    const matchesTag = tagFilter === 'ALL' || (a.tags && a.tags.some(t => t.trim() === tagFilter));

    return matchesSearch && matchesType && matchesStatus && matchesSubject && matchesAge && matchesLevel && matchesGoal && matchesTag;
  });

  const totalItems = filteredAssignments.length;
  const itemsPerPage = 9;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* Quick Actions & Other UI... (kept same as before but ensured pb-24) */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            disabled={isCreating}
            onClick={() => {
              const targetType = typeFilter === 'ALL' ? 'quiz' : typeFilter.toLowerCase();
              router.push(`/teacher/materials/new/edit?type=${targetType}`);
            }}
            className="flex items-center gap-5 p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group disabled:opacity-50"
          >
            <div className="size-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><Plus className="w-8 h-8 stroke-[2px]" /></div>
            <div><h3 className="text-lg font-bold">Tạo bài mới</h3><p className="text-sm text-[#617589]">Soạn thảo câu hỏi thủ công</p></div>
          </button>
          <button 
            disabled={isCreating}
            onClick={() => {
              setShowAIModal(true);
            }}
            className="relative flex items-center gap-5 p-6 bg-gradient-to-br from-indigo-50/80 to-blue-50/80 dark:from-indigo-900/30 dark:to-blue-900/30 backdrop-blur-md rounded-2xl border border-indigo-100 dark:border-indigo-800 hover:shadow-md transition-all text-left group overflow-hidden disabled:opacity-50"
          >
            <div className="size-14 bg-indigo-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform"><Sparkles className="w-8 h-8 stroke-[2px]" /></div>
            <div><h3 className="text-lg font-bold">Tạo bằng AI</h3><p className="text-sm text-[#617589]">T tự động tạo từ tài liệu</p></div>
          </button>
        </div>
      </section>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold tracking-tight">Tất cả bài tập</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowTrash(!showTrash)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all border ${showTrash ? 'bg-slate-100/70 text-slate-700 border-slate-200' : 'text-[#617589] border-[#f0f2f4] hover:bg-slate-50/70 backdrop-blur-md'}`}>
              {showTrash ? <ArrowLeft className="w-5 h-5 stroke-[2px]" /> : <Trash2 className="w-5 h-5 stroke-[2px]" />} {showTrash ? 'Quay lại' : 'Thùng rác'}
            </button>
          </div>
        </div>

        {/* Advanced Filters Bar */}
        <div className="flex flex-wrap items-center gap-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">filter_alt</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Bộ lọc:</span>
          </div>
          
          <select 
            value={subjectFilter}
            onChange={(e) => { setSubjectFilter(e.target.value); setAgeGroupFilter('ALL'); }}
            className="px-4 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">Tất cả môn học</option>
            {config?.subjects?.filter((s:any) => !s.isHidden).map((s:any) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          <select 
            value={ageGroupFilter}
            onChange={(e) => { setAgeGroupFilter(e.target.value); setLearningGoalFilter('ALL'); }}
            className="px-4 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">Tất cả độ tuổi</option>
            {subjectFilter !== 'ALL' 
              ? config?.subjects?.find((s:any) => s.id === subjectFilter)?.ageGroups?.filter((a:any) => a.id !== 'kindergarten').map((a:any) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))
              : [
                  { id: 'kindergarten', label: '🧸 Mầm non (Kindergarten)' },
                  { id: 'kid', label: '🧸 Trẻ em (Kid)' },
                  { id: 'teen', label: '🎒 Thiếu niên (Teen)' },
                  { id: 'learner', label: '🎓 Người học (Learner)' }
                ].map(a => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))
            }
          </select>

          {subjectFilter !== 'ALL' && ageGroupFilter !== 'ALL' && (
            <>
              <select 
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-4 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL">Tất cả cấp độ</option>
                {config?.subjects?.find((s:any) => s.id === subjectFilter)?.ageGroups?.find((a:any) => a.id === ageGroupFilter)?.levels?.map((lvl:any) => (
                  <option key={lvl.id} value={lvl.id}>{lvl.label}</option>
                ))}
              </select>

              <select 
                value={learningGoalFilter}
                onChange={(e) => setLearningGoalFilter(e.target.value)}
                className="px-4 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL">Tất cả mục tiêu học tập</option>
                {config?.subjects?.find((s:any) => s.id === subjectFilter)?.ageGroups?.find((a:any) => a.id === ageGroupFilter)?.goals?.map((goal:any) => (
                  <option key={goal.id} value={goal.id}>{goal.label}</option>
                ))}
              </select>
            </>
          )}

          <select 
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">Tất cả thẻ kỹ năng</option>
            {popularTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        {/* List Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loading ? (
            [...Array(6)].map((_, i) => <div key={i} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-5 rounded-2xl h-48 animate-pulse border border-[#f0f2f4]"></div>)
          ) : (
            filteredAssignments.slice((currentPage - 1) * 9, currentPage * 9).map((a) => (
              <MaterialListItem 
                key={a.id} 
                assignment={a} 
                onDelete={() => {
                  setAssignments(prev => prev.filter(x => x.id !== a.id));
                }}
                onUpdate={(updated) => {
                  setAssignments(prev => prev.map(x => x.id === updated.id ? updated : x));
                }}
                onRefresh={() => fetchAssignments(false)}
                isTrash={showTrash}
                selected={selectedIds.includes(a.id)}
                onSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="flex items-center justify-center size-10 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              const isActive = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`flex items-center justify-center size-10 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                      : 'border border-slate-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="flex items-center justify-center size-10 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Toolbar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[80] bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl px-8 py-4 flex items-center gap-8 animate-in slide-in-from-bottom-10 pointer-events-auto" style={{ minWidth: '400px' }}>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 dark:text-white">Đã chọn {selectedIds.length} mục</span>
              <button onClick={() => setSelectedIds([])} className="text-[10px] font-bold text-primary hover:underline text-left uppercase tracking-widest">Hủy chọn</button>
            </div>
            <div className="h-10 w-px bg-slate-100 dark:bg-gray-700"></div>
            <div className="flex gap-3">
               {showTrash ? (
                 <>
                   <button disabled={isBulkProcessing} onClick={() => openConfirm('RESTORE')} className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all flex items-center gap-2">Khôi phục</button>
                   <button disabled={isBulkProcessing} onClick={() => openConfirm('PERMANENT_DELETE')} className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-all flex items-center gap-2">Xóa vĩnh viễn</button>
                 </>
               ) : (
                 <>
                   <button disabled={isBulkProcessing} onClick={() => openConfirm('PUBLISH')} className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Công khai</button>
                   <button disabled={isBulkProcessing} onClick={() => openConfirm('DELETE')} className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-all flex items-center gap-2">Xóa đã chọn</button>
                 </>
               )}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Confirm Modal */}
      {confirmConfig.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className={`size-16 rounded-full flex items-center justify-center mb-6 ${confirmConfig.type === 'RESTORE' || confirmConfig.type === 'PUBLISH' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                {confirmConfig.type === 'RESTORE' ? (
                  <RotateCcw className="w-8 h-8 stroke-[2px]" />
                ) : confirmConfig.type === 'PUBLISH' ? (
                  <Globe className="w-8 h-8 stroke-[2px]" />
                ) : (
                  <Trash2 className="w-8 h-8 stroke-[2px]" />
                )}
              </div>
              <h3 className="text-xl font-bold text-[#111418] dark:text-white mb-2">{confirmConfig.title}</h3>
              <p className="text-[#617589] dark:text-gray-400 text-sm">{confirmConfig.message}</p>
              <div className="flex gap-3 w-full mt-8">
                <button onClick={() => setConfirmConfig(prev => ({ ...prev, show: false }))} className="flex-1 py-3 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 font-bold rounded-xl hover:bg-slate-200 transition-all uppercase tracking-wide text-xs">Hủy bỏ</button>
                <button onClick={executeBulkAction} className={`flex-1 py-3 text-white font-bold rounded-xl transition-all uppercase tracking-wide text-xs shadow-lg ${confirmConfig.type === 'RESTORE' || confirmConfig.type === 'PUBLISH' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>Xác nhận</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* AI Generator Modal */}
      {showAIModal && (
        <AIGeneratorModal
          assignmentId="new"
          onClose={() => setShowAIModal(false)}
          onQuestionsGenerated={handleAIGeneratedQuestions}
        />
      )}
    </div>
  );
}
