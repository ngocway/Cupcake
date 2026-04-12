"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { BaseQuestionProps, QuestionType, MediaType } from './types';
import { autoSaveMaterial, syncAssignmentClasses } from '@/actions/material-actions';
import { MultipleChoiceBuilder } from './MultipleChoiceBuilder';
import { ClozeTestBuilder } from './ClozeTestBuilder';
import { MatchingBuilder } from './MatchingBuilder';
import { TrueFalseBuilder } from './TrueFalseBuilder';
import { ReorderBuilder } from './ReorderBuilder';

import { Button } from '@/components/ui/button';

const QUESTION_TYPES: { value: QuestionType; label: string; icon: string }[] = [
  { value: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm', icon: '🔘' },
  { value: 'CLOZE_TEST', label: 'Điền từ', icon: '📝' },
  { value: 'TRUE_FALSE', label: 'Đúng / Sai', icon: '✅' },
  { value: 'MATCHING', label: 'Nối cặp', icon: '🔗' },
  { value: 'REORDER', label: 'Sắp xếp lại', icon: '🔃' },
];

export function QuizEditor() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const assignToClassId = searchParams.get('assignToClass');

  const [questions, setQuestions] = useState<BaseQuestionProps[]>([
    { id: '1', type: 'MULTIPLE_CHOICE', points: 1.0 }
  ]);
  const [activeId, setActiveId] = useState<string>('1');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const [title, setTitle] = useState('Toán lớp 5 - Tuần 12');
  const [subject, setSubject] = useState('Toán học');
  const [gradeLevel, setGradeLevel] = useState('Lớp 5');
  const [shortDescription, setShortDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [saveStatus, setSaveStatus] = useState<'SAVED' | 'SAVING' | 'ERROR'>('SAVED');
  const [loading, setLoading] = useState(id !== 'new');

  // Initial fetch
  useEffect(() => {
    if (!id || id === 'new') return;

    const fetchAssignment = async () => {
      try {
        const res = await fetch(`/api/assignments/${id}`);
        const data = await res.json();
        if (data.assignment) {
          setTitle(data.assignment.title);
          setSubject(data.assignment.subject || 'Khác');
          setGradeLevel(data.assignment.gradeLevel || 'Khác');
          setShortDescription(data.assignment.shortDescription || '');
          setTags(data.assignment.tags ? data.assignment.tags.split(',').filter(Boolean) : []);
          
          if (data.assignment.questions?.length > 0) {
            setQuestions(data.assignment.questions);
            setActiveId(data.assignment.questions[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch assignment:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [id]);

  // Auto-save logic
  useEffect(() => {
    if (!id || id === 'new' || loading) return;

    const timer = setTimeout(async () => {
      setSaveStatus('SAVING');
      try {
        await autoSaveMaterial({
          id,
          title,
          type: 'EXERCISE',
          questions,
          subject,
          gradeLevel,
          shortDescription,
          tags: tags.join(',')
        });
        setSaveStatus('SAVED');
      } catch (err) {
        console.error('Auto-save failed:', err);
        setSaveStatus('ERROR');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [questions, title, id, loading]);

  const handleFinish = async () => {
    const validQuestions = questions.filter(q => isQuestionValid(q));
    
    if (validQuestions.length === 0) {
      alert('Bài tập phải có ít nhất 1 câu hỏi hoàn chỉnh (đầy đủ nội dung và đáp án đúng) mới có thể hoàn tất.');
      return;
    }

    setSaveStatus('SAVING');
    try {
      if (id && id !== 'new') {
        // Save only valid questions for the final version
        await autoSaveMaterial({ 
          id, 
          title, 
          type: 'EXERCISE', 
          questions: validQuestions,
          subject,
          gradeLevel,
          shortDescription,
          tags: tags.join(',')
        });
        
        // If we came from a class assignment flow, assign it now
        if (assignToClassId) {
          await syncAssignmentClasses(id, [assignToClassId]);
        }
      }
      
      // If we came from a class, go back to that class
      if (assignToClassId) {
        router.push(`/teacher/classes/${assignToClassId}`);
      } else {
        router.push('/teacher/materials');
      }
    } catch (err) {
      console.error('Failed to finish:', err);
      setSaveStatus('ERROR');
      alert('Có lỗi xảy ra khi hoàn tất: ' + (err as Error).message);
    }
  };

  const handleBack = () => {
    const validQuestions = questions.filter(q => isQuestionValid(q));
    if (validQuestions.length === 0) {
      if (!confirm('Bài tập chưa có câu hỏi nào hoàn thiện. Bạn có muốn thoát ra không? (Bài tập sẽ được lưu dưới dạng Bản nháp và có thể được chỉnh sửa sau)')) {
        return;
      }
    }
    router.back();
  };

  const activeQuestion = questions.find(q => q.id === activeId);
  const activeIdx = questions.findIndex(q => q.id === activeId);

  const handleAddQuestion = () => {
    const id = Date.now().toString();
    setQuestions([...questions, { id, type: 'MULTIPLE_CHOICE', points: 1.0 }]);
    setActiveId(id);
  };

  const handleRemoveQuestion = (id: string) => {
    if (questions.length <= 1) return;
    const newQ = questions.filter(q => q.id !== id);
    setQuestions(newQ);
    if (activeId === id) setActiveId(newQ[0].id);
  };

  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadType, setUploadType] = useState<MediaType>('NONE');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleToolbarMediaClick = (type: MediaType) => {
    setUploadType(type);
    setShowUploadModal(true);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const simulateUpload = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    // Create a local preview URL
    const previewUrl = URL.createObjectURL(file);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        setUploadProgress(100);
        clearInterval(interval);
        
        // Finalize upload
        setTimeout(() => {
          const mediaData: Partial<BaseQuestionProps> = {};
          if (uploadType === 'IMAGE') mediaData.imageUrl = previewUrl;
          if (uploadType === 'AUDIO') mediaData.audioUrl = previewUrl;
          if (uploadType === 'VIDEO') mediaData.videoUrl = previewUrl;
          updateActiveQuestion(mediaData);
          setShowUploadModal(false);
          setIsUploading(false);
        }, 500);
      } else {
        setUploadProgress(progress);
      }
    }, 300);
  };

  const handleDuplicate = (id: string) => {
    const q = questions.find(q => q.id === id);
    if (!q) return;
    const newId = Date.now().toString();
    const newQuestions = [...questions];
    const idx = newQuestions.findIndex(q => q.id === id);
    newQuestions.splice(idx + 1, 0, { ...q, id: newId });
    setQuestions(newQuestions);
    setActiveId(newId);
  };

  const updateActiveQuestion = (data: Partial<BaseQuestionProps>) => {
    setQuestions(questions.map(q => q.id === activeId ? { ...q, ...data } : q));
  };
  
  const getQuestionPreviewText = (q: BaseQuestionProps, idx: number) => {
    const content = q.content;
    const defaultText = `Nội dung câu hỏi số ${idx + 1}`;
    
    if (!content) return defaultText;

    let text = '';
    switch (q.type) {
      case 'MULTIPLE_CHOICE':
        text = (content as any).questionText;
        break;
      case 'CLOZE_TEST':
        text = (content as any).textWithBlanks;
        break;
      case 'TRUE_FALSE':
        text = (content as any).statement;
        break;
      case 'MATCHING':
      case 'REORDER':
        text = (content as any).instruction;
        break;
    }

    return text?.trim() || defaultText;
  };

  const isQuestionContentValid = (q: BaseQuestionProps | undefined): boolean => {
    if (!q) return false;
    if (!q.content) return false;
    
    switch (q.type) {
      case 'MULTIPLE_CHOICE': {
        const c = q.content as any;
        const hasText = !!c.questionText?.trim();
        const validOptions = c.options?.filter((o: any) => o.text?.trim()) || [];
        const hasEnoughOptions = validOptions.length >= 2;
        const hasCorrect = c.options?.some((o: any) => o.isCorrect);
        return hasText && hasEnoughOptions && hasCorrect;
      }
      case 'TRUE_FALSE': {
        const c = q.content as any;
        return !!c.statement?.trim();
      }
      case 'CLOZE_TEST': {
        const c = q.content as any;
        return !!c.textWithBlanks?.trim() && /\{\{.+\}\}/.test(c.textWithBlanks);
      }
      case 'MATCHING': {
        const c = q.content as any;
        const hasInstruction = !!c.instruction?.trim();
        const validPairs = c.pairs?.filter((p: any) => (p.leftText?.trim() || p.leftImageUrl) && p.rightText?.trim()) || [];
        return hasInstruction && validPairs.length >= 2;
      }
      case 'REORDER': {
        const c = q.content as any;
        const hasInstruction = !!c.instruction?.trim();
        const validItems = c.items?.filter((i: any) => i.text?.trim()) || [];
        return hasInstruction && validItems.length >= 2;
      }
      default:
        return true;
    }
  };

  const isQuestionValid = (q: BaseQuestionProps | undefined): boolean => {
    if (!q) return false;
    if (q.mediaType && q.mediaType !== 'NONE' && !q.mediaUrl?.trim()) return false;
    return isQuestionContentValid(q);
  };

  const getValidationMessage = (q: BaseQuestionProps | undefined): string | null => {
    if (!q) return null;
    if (q.mediaType && q.mediaType !== 'NONE' && !q.mediaUrl?.trim()) {
      return q.mediaType === 'IMAGE' ? "Hãy nhập đường dẫn ảnh" : "Hãy nhập đường dẫn âm thanh";
    }
    if (!q.content) return "Chưa có nội dung câu hỏi";
    
    switch (q.type) {
      case 'MULTIPLE_CHOICE': {
        const c = q.content as any;
        if (!c.questionText?.trim()) return "Hãy nhập nội dung câu hỏi";
        const validCount = c.options?.filter((o: any) => o.text?.trim()).length || 0;
        if (validCount < 2) return "Cần ít nhất 2 đáp án có nội dung";
        if (!c.options?.some((o: any) => o.isCorrect)) return "Hãy chọn câu trả lời đúng";
        break;
      }
      case 'TRUE_FALSE':
        if (!(q.content as any).statement?.trim()) return "Hãy nhập nội dung nhận định";
        break;
      case 'CLOZE_TEST': {
        const c = q.content as any;
        if (!c.textWithBlanks?.trim()) return "Hãy nhập nội dung đoạn văn";
        if (!c.textWithBlanks.includes('{{')) return "Bôi đen từ hoặc dùng {{đáp án}} để tạo ô trống";
        if (!/\{\{.+\}\}/.test(c.textWithBlanks)) return "Nội dung ô trống {{...}} không được để trống";
        break;
      }
      case 'MATCHING':
        if (!(q.content as any).instruction?.trim()) return "Hãy nhập yêu cầu nối cặp";
        if (((q.content as any).pairs?.length || 0) < 2) return "Hãy thêm ít nhất 2 cặp nối";
        break;
      case 'REORDER':
        if (!(q.content as any).instruction?.trim()) return "Hãy nhập yêu cầu sắp xếp";
        if (((q.content as any).items?.length || 0) < 2) return "Hãy thêm ít nhất 2 mục để sắp xếp";
        break;
    }
    return null;
  };

  const isValid = isQuestionValid(activeQuestion);
  const validationMsg = getValidationMessage(activeQuestion);

  const renderActiveBuilder = () => {
    if (!activeQuestion) return null;
    
    const commonProps = {
      onChange: (content: any) => updateActiveQuestion({ content })
    };

    switch (activeQuestion.type) {
      case 'MULTIPLE_CHOICE': return <MultipleChoiceBuilder key={activeId} {...commonProps} initialData={activeQuestion.content as any} />;
      case 'CLOZE_TEST': return <ClozeTestBuilder key={activeId} {...commonProps} initialData={activeQuestion.content as any} />;
      case 'MATCHING': return <MatchingBuilder key={activeId} {...commonProps} initialData={activeQuestion.content as any} />;
      case 'TRUE_FALSE': return <TrueFalseBuilder key={activeId} {...commonProps} initialData={activeQuestion.content as any} />;
      case 'REORDER': return <ReorderBuilder key={activeId} {...commonProps} initialData={activeQuestion.content as any} />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Đang tải bài tập...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-[#111418] dark:text-white antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white dark:bg-background-dark border-b border-slate-200 dark:border-gray-800 px-6 py-3">
        <div className="max-w-full mx-auto flex items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <button 
              onClick={handleBack}
              className="flex items-center justify-center size-10 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white">
                <span className="material-symbols-outlined">quiz</span>
              </div>
              <div>
                <h1 className="text-sm font-medium text-slate-500">Soạn thảo bài tập</h1>
                <input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-[#111418] dark:text-white text-lg font-bold leading-tight bg-transparent border-none p-0 focus:ring-0 w-full"
                  placeholder="Nhập tiêu đề bài tập..."
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              saveStatus === 'SAVING' ? 'bg-blue-50 text-blue-600' : 
              saveStatus === 'ERROR' ? 'bg-red-50 text-red-600' :
              'bg-slate-100 dark:bg-gray-800 text-slate-600'
            }`}>
              <span className={`material-symbols-outlined text-[18px] ${saveStatus === 'SAVING' ? 'animate-spin' : ''}`}>
                {saveStatus === 'SAVING' ? 'sync' : saveStatus === 'ERROR' ? 'error' : 'cloud_done'}
              </span>
              <span>
                {saveStatus === 'SAVING' ? 'Đang lưu...' : 
                 saveStatus === 'ERROR' ? 'Lỗi khi lưu' : 'Đã lưu tự động'}
              </span>
            </div>
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              Thiết lập
            </button>
            <button 
              onClick={handleFinish}
              className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
            >
              Hoàn tất
            </button>
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-gray-800"></div>
            <div className="size-10 rounded-full bg-cover bg-center border-2 border-primary/20" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAlOHmtRlO6R5xL8_QJ-36iMPv9rWpvRfflE-8idgokAjNZ2e_HERgldVCxzJCO-0LhaoO1n9OlPE1xEjQzrhVhyIH679ChB_jeqVsdIZgPz6ApgfpVmedqtePVkdOgbN8x2U2HsRcTGPjsgQYRRrIr49dDpqlko8YcvRFYgPaEtG6P8IsxtyH8BAxyiWtcP2q2-8T2gcH44vWSCq3boBRnOMhABMTfcgJW_MH0zO4qDaTxJXLIeS345zPaWkjPFEtedRzWzzOCtbaW')" }}></div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 w-full px-6 py-8 gap-8">
        {/* Sidebar */}
        <aside className="w-1/5 shrink-0 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Danh sách câu hỏi</h3>
            <span className="text-xs font-bold bg-slate-200 px-2 py-0.5 rounded text-slate-600">{questions.length}/15</span>
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar pr-2">
            {questions.map((q, idx) => (
              <button 
                key={q.id}
                onClick={() => setActiveId(q.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  activeId === q.id 
                    ? 'bg-primary/5 border-2 border-primary' 
                    : 'bg-white border-slate-200 shadow-sm hover:border-primary/30'
                } text-left`}
              >
                <span className={`flex-shrink-0 size-6 rounded-md flex items-center justify-center text-xs font-bold ${
                  activeId === q.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {idx + 1}
                </span>
                <p className={`text-sm ${activeId === q.id ? 'font-bold text-primary' : 'font-medium'} line-clamp-2`}>
                  {getQuestionPreviewText(q, idx)}
                </p>
              </button>
            ))}
            <button 
              disabled={!isValid}
              onClick={handleAddQuestion}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed transition-all group ${
                !isValid 
                  ? 'opacity-40 cursor-not-allowed border-slate-200' 
                  : 'border-slate-200 hover:border-primary/50 hover:bg-primary/5'
              }`}
              title={validationMsg || ""}
            >
              <span className={`material-symbols-outlined ${!isValid ? 'text-slate-300' : 'text-slate-400 group-hover:text-primary'}`}>add</span>
              <span className={`text-sm font-bold ${!isValid ? 'text-slate-300' : 'text-slate-500 group-hover:text-primary'}`}>Thêm câu hỏi</span>
            </button>
          </div>
        </aside>

        {/* Main Editor */}
        <main className="w-4/5 min-w-0">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden flex flex-col min-h-[700px]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-400 uppercase">Câu {activeIdx + 1}</span>
                <div className="relative">
                  <button 
                    onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-primary/20"
                  >
                    <span>{QUESTION_TYPES.find(t => t.value === activeQuestion?.type)?.icon} {QUESTION_TYPES.find(t => t.value === activeQuestion?.type)?.label}</span>
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </button>
                  {showTypeDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="flex flex-col p-1">
                          {QUESTION_TYPES.map(t => (
                            <button 
                              key={t.value}
                              onClick={() => {
                                // Initialize default content for new type
                                let defaultContent = {};
                                switch(t.value) {
                                  case 'MULTIPLE_CHOICE':
                                    defaultContent = { questionText: '', options: [{ id: '1', text: '', isCorrect: true }, { id: '2', text: '', isCorrect: false }] };
                                    break;
                                  case 'TRUE_FALSE':
                                    defaultContent = { statement: '', isTrue: true, displayStyle: 'TRUE_FALSE' };
                                    break;
                                  case 'CLOZE_TEST':
                                    defaultContent = { textWithBlanks: '' };
                                    break;
                                  case 'MATCHING':
                                    defaultContent = { instruction: '', pairs: [] };
                                    break;
                                  case 'REORDER':
                                    defaultContent = { instruction: '', items: [] };
                                    break;
                                }

                                updateActiveQuestion({ type: t.value, content: defaultContent as any });
                                setShowTypeDropdown(false);
                              }}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                                activeQuestion?.type === t.value 
                                  ? 'bg-primary/10 text-primary font-bold' 
                                  : 'hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-600 dark:text-slate-300 font-medium'
                              }`}
                            >
                              <span className="text-lg">{t.icon}</span>
                              <span>{t.label}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-1">
                  <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"><span className="material-symbols-outlined text-[20px]">format_bold</span></button>
                  <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"><span className="material-symbols-outlined text-[20px]">format_italic</span></button>
                  <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"><span className="material-symbols-outlined text-[20px]">format_underlined</span></button>
                  <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
                  
                  <button 
                    onClick={() => handleToolbarMediaClick('IMAGE')}
                    className={`p-1.5 rounded transition-all ${activeQuestion?.imageUrl ? 'bg-primary text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                    title="Đính kèm hình ảnh"
                  >
                    <span className="material-symbols-outlined text-[20px]">image</span>
                  </button>
                  
                  <button 
                    onClick={() => handleToolbarMediaClick('AUDIO')}
                    className={`p-1.5 rounded transition-all ${activeQuestion?.audioUrl ? 'bg-primary text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                    title="Đính kèm âm thanh"
                  >
                    <span className="material-symbols-outlined text-[20px]">mic</span>
                  </button>

                  <button 
                    onClick={() => handleToolbarMediaClick('VIDEO')}
                    className={`p-1.5 rounded transition-all ${activeQuestion?.videoUrl ? 'bg-primary text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                    title="Đính kèm video"
                  >
                    <span className="material-symbols-outlined text-[20px]">movie</span>
                  </button>

                  <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"><span className="material-symbols-outlined text-[20px]">functions</span></button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <span className="uppercase tracking-wider text-xs font-bold">Điểm:</span>
                  <input 
                    className="w-16 h-9 rounded-lg border-slate-200 text-center font-bold text-primary focus:ring-primary focus:border-primary" 
                    step="0.1" 
                    type="number" 
                    value={activeQuestion?.points}
                    onChange={(e) => updateActiveQuestion({ points: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            
            <div className="p-8 flex flex-col gap-6 flex-1">
              {/* Media Preview Section (Image, Audio, and Video) with Fallback */}
              {(activeQuestion?.imageUrl || activeQuestion?.audioUrl || activeQuestion?.videoUrl || activeQuestion?.mediaUrl) && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(activeQuestion.imageUrl || (activeQuestion.mediaType === 'IMAGE' && activeQuestion.mediaUrl)) && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">image</span>
                            Ảnh đính kèm
                          </span>
                          <button 
                            onClick={() => updateActiveQuestion({ imageUrl: undefined, mediaUrl: activeQuestion.mediaType === 'IMAGE' ? undefined : activeQuestion.mediaUrl })}
                            className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Gỡ
                          </button>
                        </div>
                        <div className="flex justify-center p-3 bg-slate-50/50 dark:bg-gray-900/50 rounded-xl border border-dashed border-slate-100 dark:border-gray-700">
                          <img 
                            src={activeQuestion.imageUrl || (activeQuestion.mediaType === 'IMAGE' ? activeQuestion.mediaUrl : undefined)} 
                            alt="Preview" 
                            className="max-h-[120px] rounded-lg object-contain shadow-sm"
                          />
                        </div>
                      </div>
                    )}

                    {(activeQuestion.audioUrl || (activeQuestion.mediaType === 'AUDIO' && activeQuestion.mediaUrl)) && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">mic</span>
                            Âm thanh
                          </span>
                          <button 
                            onClick={() => updateActiveQuestion({ audioUrl: undefined, mediaUrl: activeQuestion.mediaType === 'AUDIO' ? undefined : activeQuestion.mediaUrl })}
                            className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Gỡ
                          </button>
                        </div>
                        <div className="flex flex-col items-center gap-3 p-3 bg-slate-50/50 dark:bg-gray-900/50 rounded-xl border border-dashed border-slate-100 dark:border-gray-700">
                          <div className="size-8 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">volume_up</span>
                          </div>
                          <audio 
                            key={activeQuestion.audioUrl || activeQuestion.mediaUrl}
                            controls 
                            src={activeQuestion.audioUrl || (activeQuestion.mediaType === 'AUDIO' ? activeQuestion.mediaUrl : undefined)} 
                            className="w-full h-8 scale-90 outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {(activeQuestion.videoUrl || (activeQuestion.mediaType === 'VIDEO' && activeQuestion.mediaUrl)) && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">movie</span>
                            Video đính kèm
                          </span>
                          <button 
                            onClick={() => updateActiveQuestion({ videoUrl: undefined, mediaUrl: activeQuestion.mediaType === 'VIDEO' ? undefined : activeQuestion.mediaUrl })}
                            className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Gỡ
                          </button>
                        </div>
                        <div className="flex justify-center p-3 bg-slate-50/50 dark:bg-gray-900/50 rounded-xl border border-dashed border-slate-100 dark:border-gray-700">
                          <video 
                            key={activeQuestion.videoUrl || activeQuestion.mediaUrl}
                            controls 
                            src={activeQuestion.videoUrl || (activeQuestion.mediaType === 'VIDEO' ? activeQuestion.mediaUrl : undefined)} 
                            className="max-h-[120px] rounded-lg shadow-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="h-[1px] bg-slate-100 dark:bg-gray-700 w-full mb-2"></div>
                </div>
              )}

              {renderActiveBuilder()}
              {!isValid && validationMsg && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-500 animate-in fade-in slide-in-from-bottom-2">
                  <span className="material-symbols-outlined text-[20px]">error</span>
                  <span className="text-sm font-bold uppercase tracking-wide">{validationMsg}</span>
                </div>
              )}
            </div>

            <div className="px-8 py-6 border-t border-slate-100 dark:border-gray-700 bg-slate-50/30 flex flex-col gap-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-8">
                  {activeQuestion?.explanation !== undefined ? (
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-primary flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px]">add_comment</span>
                          Lời giải thích chi tiết
                        </span>
                        <button 
                          onClick={() => updateActiveQuestion({ explanation: undefined })}
                          className="text-xs text-slate-400 hover:text-red-500"
                        >Xóa</button>
                      </div>
                      <textarea 
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-1 focus:ring-primary outline-none text-sm min-h-[80px]"
                        placeholder="Nhập lời giải hoặc hướng dẫn chi tiết..."
                        value={activeQuestion.explanation || ''}
                        onChange={(e) => updateActiveQuestion({ explanation: e.target.value })}
                      />
                    </div>
                  ) : (
                    <button 
                      onClick={() => updateActiveQuestion({ explanation: '' })}
                      className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px]">add_comment</span>
                      <span>+ Thêm lời giải thích chi tiết</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-gray-700">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleRemoveQuestion(activeId)}
                    className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">delete</span>
                    <span className="text-sm font-bold">Xóa câu</span>
                  </button>
                  <button 
                    onClick={() => handleDuplicate(activeId)}
                    className="p-2.5 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">content_copy</span>
                    <span className="text-sm font-bold">Nhân bản</span>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200/60 rounded-xl transition-colors">Hủy</button>
                  <button 
                    disabled={!isValid}
                    onClick={handleAddQuestion}
                    className={`px-8 py-2.5 font-bold rounded-xl shadow-md transition-all flex items-center gap-2 ${
                      !isValid
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-secondary text-white hover:bg-secondary/90 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    <span>Lưu & Thêm câu mới</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  {uploadType === 'IMAGE' ? 'image' : uploadType === 'AUDIO' ? 'mic' : 'movie'}
                </span>
                Tải lên {uploadType === 'IMAGE' ? 'hình ảnh' : uploadType === 'AUDIO' ? 'âm thanh' : 'video'}
              </h3>
              <button 
                disabled={isUploading}
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {!isUploading ? (
              <div 
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  if (uploadType === 'IMAGE') input.accept = 'image/*';
                  else if (uploadType === 'AUDIO') input.accept = 'audio/*';
                  else if (uploadType === 'VIDEO') input.accept = 'video/*';
                  
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const maxSize = uploadType === 'VIDEO' ? 200 * 1024 * 1024 : 10 * 1024 * 1024;
                      
                      if (file.size > maxSize) {
                        alert(`Dung lượng file quá lớn. Tối đa là ${uploadType === 'VIDEO' ? '200MB' : '10MB'}. Vui lòng chọn tệp khác.`);
                        return;
                      }
                      simulateUpload(file);
                    }
                  };
                  input.click();
                }}
                className="border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <div className="size-16 bg-slate-50 dark:bg-gray-900 rounded-full flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[40px]">upload_file</span>
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-700 dark:text-slate-200">Bấm để chọn file từ máy tính</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Dung lượng tối đa {uploadType === 'VIDEO' ? '200MB' : '10MB'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 py-6">
                <div className="flex justify-between items-end mb-2">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Đang tải tệp lên...</p>
                    <p className="text-xs text-slate-400">Vui lòng đợi trong giây lát</p>
                  </div>
                  <span className="text-sm font-black text-primary">{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="mt-8 flex justify-end gap-3">
              <button 
                disabled={isUploading}
                onClick={() => setShowUploadModal(false)}
                className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <span className="material-symbols-outlined text-[28px]">settings</span>
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-950 font-headline italic">Thiết lập học liệu</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tối ưu hóa nội dung cho Thư viện cộng đồng</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-8">
              {/* Basic Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Môn học</label>
                    <select 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:ring-primary focus:border-primary outline-none appearance-none"
                    >
                       {['Tiếng Anh', 'Toán học', 'Ngữ Văn', 'Khoa học', 'Lịch sử', 'Công nghệ', 'Khác'].map(s => (
                         <option key={s} value={s}>{s}</option>
                       ))}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Khối lớp</label>
                    <select 
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:ring-primary focus:border-primary outline-none appearance-none"
                    >
                       {['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12', 'Đại học', 'Khác'].map(g => (
                         <option key={g} value={g}>{g}</option>
                       ))}
                    </select>
                 </div>
              </div>

              {/* Short Description */}
              <div className="space-y-2">
                 <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mô tả ngắn (Hiển thị ở Thư viện)</label>
                    <span className={`text-[10px] font-bold ${shortDescription.length > 200 ? 'text-red-500' : 'text-slate-400'}`}>
                      {shortDescription.length} / 200
                    </span>
                 </div>
                 <textarea 
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value.slice(0, 200))}
                    placeholder="Nhập mô tả ngắn để học sinh dễ dàng tìm thấy bài tập của bạn..."
                    className="w-full p-5 rounded-3xl border border-slate-200 bg-slate-50 min-h-[120px] focus:ring-primary focus:border-primary outline-none text-slate-700 font-medium leading-relaxed resize-none"
                 />
              </div>

              {/* Tagging System */}
              <div className="space-y-4">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Gắn thẻ bài học (Tags)</label>
                 
                 <div className="flex flex-wrap gap-2">
                    {['Tiếng Anh', 'Toán học', 'Ngữ pháp', 'Từ vựng', 'TOEIC', 'IELTS', 'Lớp 10', 'Lớp 11', 'Lớp 12', 'Ôn thi'].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => {
                          if (tags.includes(tag)) setTags(tags.filter(t => t !== tag));
                          else setTags([...tags, tag]);
                        }}
                        className={`px-5 py-2 rounded-full text-[11px] font-bold transition-all ${
                          tags.includes(tag) 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                         {tag}
                      </button>
                    ))}
                 </div>

                 <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-[24px] border border-slate-100">
                    <input 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !tags.includes(val)) {
                            setTags([...tags, val]);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                      placeholder="Nhập thẻ riêng và nhấn Enter..."
                      className="bg-transparent border-none outline-none text-sm flex-1 px-4 py-2 font-medium"
                    />
                    <div className="px-3 py-1 bg-slate-200 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custom</div>
                 </div>

                 {/* Custom tags preview with delete */}
                 <div className="flex flex-wrap gap-3 mt-2">
                    {tags.filter(t => !['Tiếng Anh', 'Toán học', 'Ngữ pháp', 'Từ vựng', 'TOEIC', 'IELTS', 'Lớp 10', 'Lớp 11', 'Lớp 12', 'Ôn thi'].includes(t)).map(t => (
                      <div key={t} className="px-4 py-1.5 bg-yellow-400/10 text-yellow-600 rounded-lg text-xs font-bold border border-yellow-400/20 flex items-center gap-2">
                         #{t}
                         <button onClick={() => setTags(tags.filter(tag => tag !== t))} className="p-0.5 hover:bg-yellow-400/20 rounded-full">
                           <span className="material-symbols-outlined text-[14px]">close</span>
                         </button>
                      </div>
                    ))}
                 </div>
              </div>
            </div>

            <div className="mt-12 flex justify-end gap-3 pt-8 border-t border-slate-100">
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="px-10 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-full shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                Lưu thiết lập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
