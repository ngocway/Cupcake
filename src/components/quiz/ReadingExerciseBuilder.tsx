"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { autoSaveMaterial } from '@/actions/material-actions';
import { InstructionsModal } from './InstructionsModal';
import { generateVocabularyDetails } from '@/actions/ai-actions';
import { DUMMY_DICTIONARY } from '@/lib/dictionary-data';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const uuidv4 = () => typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2);

function SortableQuestionItem({ 
  q, 
  idx, 
  onEdit, 
  onDelete 
}: { 
  q: any, 
  idx: number, 
  onEdit: () => void, 
  onDelete: () => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: q.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-6 bg-white dark:bg-gray-800 rounded-3xl border transition-all group cursor-grab active:cursor-grabbing ${
        isDragging ? 'border-primary shadow-xl ring-2 ring-primary/20' : 'border-slate-100 dark:border-gray-700 hover:border-primary/30 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex gap-4">
          <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
            {idx + 1}
          </div>
          <div className="space-y-2">
            <p className="font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
              {q.questionText}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-slate-100 dark:bg-gray-700 rounded text-[10px] font-bold text-slate-500 uppercase">
                {q.type === 'TRUE_FALSE' ? 'Đúng/Sai' : 'Trắc nghiệm'}
              </span>
              <span className="px-2 py-1 bg-primary/5 rounded text-[10px] font-bold text-primary uppercase">
                {q.points} Điểm
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onEdit} 
            className="size-10 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center justify-center text-slate-400 hover:text-primary transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onDelete} 
            className="size-10 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
          <div className="size-10 flex items-center justify-center text-slate-300">
            <span className="material-symbols-outlined">drag_indicator</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReadingExerciseBuilder({ 
  assignmentId: initialId, 
  onBack 
}: { 
  assignmentId?: string, 
  onBack?: () => void 
}) {
  const router = useRouter();
  const [assignmentId, setAssignmentId] = useState<string>(initialId || 'clp_reading_001');

  const handleBack = async () => {
    if (onBack) {
      onBack();
      return;
    }

    setSavingStatus('saving');
    try {
      // Final save
      const editor = document.getElementById('rich-text-editor');
      const contentHtml = editor?.innerHTML || '';
      
      await autoSaveMaterial({
        id: assignmentId || initialId || 'clp_reading_001',
        title,
        type: 'READING',
        questions: questions, 
        readingText: contentHtml,
        videoUrl: videoUrl,
        audioUrl: audioUrl,
        subject,
        gradeLevel,
        shortDescription,
        instructions,
        tags: tags.join(',')
      });
      setSavingStatus('saved');
      
      // Smart redirect
      router.push('/teacher/materials');
    } catch (error) {
      console.error('Final save failed:', error);
      if (confirm('Lỗi khi lưu thay đổi cuối cùng. Bạn vẫn muốn thoát chứ?')) {
        router.push('/teacher/materials');
      }
    }
  };
  const [title, setTitle] = useState('Reading Exercise: Modern Ethics');
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [assignmentStatus, setAssignmentStatus] = useState<'DRAFT' | 'PRIVATE' | 'PUBLIC'>('DRAFT');
  const [validationModal, setValidationModal] = useState<{show: boolean, missingTitle: boolean, missingContent: boolean}>({show: false, missingTitle: false, missingContent: false});
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Metadata States
  const [subject, setSubject] = useState('Toán học');
  const [gradeLevel, setGradeLevel] = useState('Lớp 10');
  const [shortDescription, setShortDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imageControlPos, setImageControlPos] = useState({ top: 0, left: 0 });
  const [textToolbarPos, setTextToolbarPos] = useState({ top: 0, left: 0, show: false });
  const [vocabForm, setVocabForm] = useState<{
    word: string;
    pronunciation: string;
    meaningVi: string;
    explanationEn: string;
    examples: string;
    image: string;
    range: Range | null;
    isEdit?: boolean;
    vocabId?: string;
  } | null>(null);

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'passage' | 'questions' | 'vocabulary'>('passage');
  const [vocabEnabled, setVocabEnabled] = useState(false);
  const [showVocabDisableWarning, setShowVocabDisableWarning] = useState(false);
  const [vocabList, setVocabList] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionModal, setQuestionModal] = useState<{
    isOpen: boolean;
    type: 'TRUE_FALSE' | 'MULTIPLE_CHOICE' | 'NONE';
    isMultiple: boolean;
    editingIndex?: number;
  }>({ isOpen: false, type: 'NONE', isMultiple: false });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((q) => q.id === active.id);
        const newIndex = items.findIndex((q) => q.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems;
      });
      // Trigger save after a small delay to ensure state update
      setTimeout(() => handleSave(), 100);
    }
  };

  const [hoveredVocab, setHoveredVocab] = useState<{
    vocabId: string;
    word: string;
    pronunciation: string;
    meaningVi: string;
    explanationEn: string;
    examples: string;
    image: string;
    rect: DOMRect | null;
    side: 'top' | 'bottom' | 'left' | 'right';
  } | null>(null);

  const handleDeleteVocab = (vocabId: string) => {
    const marker = document.querySelector(`[data-vocab-id="${vocabId}"]`);
    if (marker) {
      const innerSpan = marker.querySelector('span');
      const text = innerSpan?.textContent || marker.textContent || '';
      marker.replaceWith(document.createTextNode(text));
      setHoveredVocab(null);
      setTimeout(handleSave, 100);
    }
  };

  const refreshVocabList = () => {
    const editor = document.getElementById('rich-text-editor');
    if (!editor) return;
    const markers = editor.querySelectorAll('.custom-vocab-marker');
    const newList = Array.from(markers).map(m => ({
      vocabId: m.getAttribute('data-vocab-id') || '',
      word: m.getAttribute('data-word') || '',
      pronunciation: m.getAttribute('data-pronunciation') || '',
      meaningVi: m.getAttribute('data-meaning-vi') || '',
      explanationEn: m.getAttribute('data-explanation-en') || '',
      examples: m.getAttribute('data-examples') || '',
      image: m.getAttribute('data-image') || ''
    }));
    setVocabList(newList);
  };

  const handleEditVocabFromList = (v: any) => {
    setVocabForm({
      ...v,
      isEdit: true,
      range: null
    });
  };

  const isFetched = useRef(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeTab === 'vocabulary') refreshVocabList();
  }, [activeTab]);

  useEffect(() => {
    async function init() {
      if (isFetched.current) return;
      isFetched.current = true;
      
      const targetId = initialId || 'clp_reading_001';
      setAssignmentId(targetId);

      try {
        const res = await fetch(`/api/assignments/${targetId}`);
        const data = await res.json();
        if (data.assignment) {
          setTitle(data.assignment.title);
          setAssignmentStatus(data.assignment.status);
          setVideoUrl(data.assignment.videoUrl || '');
          setAudioUrl(data.assignment.audioUrl || '');
          if (data.assignment.questions) {
            const normalizedQuestions = data.assignment.questions.map((q: any) => {
              let content = q.content || {};
              if (typeof content === 'string') {
                try {
                  content = JSON.parse(content);
                } catch (e) {
                  content = {};
                }
              }
              
              const rawOptions = q.options || content.options || content.data?.options || [];
              const options = Array.isArray(rawOptions) ? rawOptions.map((opt: any, oIdx: number) => ({
                id: opt.id || `opt-${oIdx}-${Math.random().toString(36).substr(2, 9)}`,
                ...opt
              })) : [];
              
              const qText = q.questionText || q.question || q.statement || 
                            content.questionText || content.question || content.statement || 
                            content.data?.questionText || content.data?.question || '';

              return {
                ...q,
                questionText: qText,
                options: options,
                correctAnswer: q.type === 'TRUE_FALSE' 
                  ? (content.isTrue === false ? 'false' : (q.correctAnswer || 'true')) 
                  : (q.correctAnswer || '')
              };
            });

            setQuestions(normalizedQuestions);
          }

          if (data.assignment.readingText) {
            const editor = document.getElementById('rich-text-editor');
            if (editor) {
              editor.innerHTML = data.assignment.readingText;
              // Auto-enable vocab if markers exist
              const hasMarkers = editor.querySelectorAll('.custom-vocab-marker').length > 0;
              if (hasMarkers) setVocabEnabled(true);
            }
          }
          if (data.assignment.subject) setSubject(data.assignment.subject);
          if (data.assignment.gradeLevel) setGradeLevel(data.assignment.gradeLevel);
          if (data.assignment.shortDescription) setShortDescription(data.assignment.shortDescription);
          if (data.assignment.instructions) setInstructions(data.assignment.instructions);
          if (data.assignment.tags) {
             setTags(data.assignment.tags.split(',').filter(Boolean));
          }
          
          setIsInitialLoadDone(true);
        }
      } catch (err) {
        console.error('Initial fetch failed:', err);
      }
    }
    init();
  }, [initialId]);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) return alert('Video dung lượng quá lớn (tối đa 100MB)');
      const reader = new FileReader();
      reader.onload = (event) => {
        setVideoUrl(event.target?.result as string);
        setTimeout(handleSave, 100);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) return alert('Audio dung lượng quá lớn (tối đa 20MB)');
      const reader = new FileReader();
      reader.onload = (event) => {
        setAudioUrl(event.target?.result as string);
        setTimeout(handleSave, 100);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (customTitle?: string) => {
    const idToSave = assignmentId || initialId || 'clp_reading_001';
    if (!idToSave) return;
    
    setSavingStatus('saving');
    try {
      const editor = document.getElementById('rich-text-editor');
      const contentHtml = editor?.innerHTML || '';
      
      await autoSaveMaterial({
        id: idToSave,
        title: customTitle || title,
        type: 'READING',
        questions: questions.map(q => ({
          ...q,
          content: {
            ...(typeof q.content === 'object' ? q.content : {}),
            questionText: q.questionText,
            options: q.options,
            isTrue: q.type === 'TRUE_FALSE' ? q.correctAnswer === 'true' : undefined
          }
        })), 
        readingText: contentHtml,
        videoUrl: videoUrl,
        audioUrl: audioUrl,
        subject,
        gradeLevel,
        shortDescription,
        instructions,
        tags: tags.join(',')
      });
      
      setSavingStatus('saved');
      setLastSaved(new Date());
      setTimeout(() => setSavingStatus('idle'), 2000);
    } catch (error) {
      console.error('Save failed:', error);
      setSavingStatus('error');
    }
  };

  useEffect(() => {
    if (!isInitialLoadDone) return;
    const timer = setTimeout(() => handleSave(), 3000);
    return () => clearTimeout(timer);
  }, [title, questions, subject, gradeLevel, shortDescription, tags, instructions, isInitialLoadDone]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageInsert = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgHtml = `<img src="${event.target?.result}" alt="Inserted" draggable="true" style="max-width: 100%; width: 50%; display: inline-block; border-radius: 0.75rem; margin: 0.5rem; cursor: move; transition: all 0.2s;" class="custom-editable-image" />&nbsp;`;
        const editor = document.getElementById('rich-text-editor');
        if (editor && document.activeElement !== editor) {
            editor.focus();
        }
        document.execCommand('insertHTML', false, imgHtml);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const editor = document.getElementById('rich-text-editor');
      const wrapper = document.getElementById('editor-wrapper');

      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        if (editor && editor.contains(range.commonAncestorContainer) && wrapper) {
          const rect = range.getBoundingClientRect();
          const wrapperRect = wrapper.getBoundingClientRect();
          setTextToolbarPos({
            show: true,
            top: rect.top - wrapperRect.top - 65,
            left: rect.left - wrapperRect.left + (rect.width / 2)
          });
          return;
        }
      }
      setTimeout(() => setTextToolbarPos(prev => ({ ...prev, show: false })), 150);
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const handleOpenVocabForm = (e: React.MouseEvent) => {
    e.preventDefault();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString().trim() !== '') {
      const range = selection.getRangeAt(0);
      setVocabForm({
        word: selection.toString().trim(),
        pronunciation: '',
        meaningVi: '',
        explanationEn: '',
        examples: '',
        image: '',
        range
      });
    }
  };

  const handleVocabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vocabForm) return;
    if (!vocabForm.isEdit && !vocabForm.range) return;

    const vocabId = vocabForm.isEdit ? vocabForm.vocabId : 'vocab-' + Date.now();
    const html = `<span 
        class="relative inline-block custom-vocab-marker group/marker" 
        data-vocab-id="${vocabId}" 
        data-word="${vocabForm.word}" 
        data-pronunciation="${vocabForm.pronunciation || ''}" 
        data-meaning-vi="${vocabForm.meaningVi || ''}" 
        data-explanation-en="${vocabForm.explanationEn || ''}" 
        data-examples="${vocabForm.examples || ''}" 
        data-image="${vocabForm.image || ''}"
        contenteditable="false"
      ><span class="bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-bold px-1.5 py-0.5 rounded-md cursor-help border-b-2 border-emerald-500 hover:bg-emerald-200/90 dark:hover:bg-emerald-900/60 transition-all duration-200">${vocabForm.word}</span></span>&nbsp;`;

    if (vocabForm.isEdit) {
      const existingElement = document.querySelector(`[data-vocab-id="${vocabId}"]`);
      if (existingElement) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const newElement = tempDiv.firstElementChild;
        if (newElement) {
          existingElement.replaceWith(newElement);
          newElement.after(document.createTextNode('\u00A0'));
        }
      }
    } else if (vocabForm.range) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(vocabForm.range);
      const editor = document.getElementById('rich-text-editor');
      if (editor && document.activeElement !== editor) {
          editor.focus();
      }
      document.execCommand('insertHTML', false, html);
    }
    setVocabForm(null);
    setTimeout(handleSave, 100);
  };

  const handleAiFill = async () => {
    if (!vocabForm) return;
    setIsAiLoading(true);
    const word = vocabForm.word.trim().replace(/[.,!?;:]/g, '');
    const cleanLookup = word.toLowerCase();
    
    const localData = DUMMY_DICTIONARY[cleanLookup];
    if (localData) {
      setVocabForm(prev => {
        if (!prev) return null;
        return {
          ...prev,
          pronunciation: localData.pronunciation || '',
          meaningVi: localData.meaningVi || '',
          explanationEn: localData.explanationEn || '',
          examples: localData.examples || '',
          image: localData.image || ''
        };
      });
      setIsAiLoading(false);
      return;
    }

    try {
      const result = await generateVocabularyDetails(word);
      if (result && !result.error) {
        setVocabForm(prev => {
          if (!prev) return null;
          return {
            ...prev,
            word: result.word || prev.word,
            pronunciation: result.pronunciation || '...',
            meaningVi: result.meaningVi || `(Nghĩa của từ "${prev.word}")`,
            explanationEn: result.explanationEn || '',
            examples: Array.isArray(result.examples) ? result.examples.join('\n') : (result.examples || ''),
            image: `https://source.unsplash.com/featured/400x300/?${encodeURIComponent(result.imageSearchKeywords || word)}` 
          };
        });
        setIsAiLoading(false);
        return;
      }
    } catch (error) {
      console.error('AI autofill error:', error);
    }

    try {
      const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanLookup}`);
      const dictData = await dictRes.json();
      let p = '';
      let exEn = '';
      let exs = '';
      if (Array.isArray(dictData) && dictData.length > 0) {
        const entry = dictData[0];
        p = entry.phonetic?.replace(/\//g, '') || entry.phonetics?.find((ph: any) => ph.text)?.text?.replace(/\//g, '') || '';
        const firstM = entry.meanings?.[0];
        if (firstM) {
          exEn = firstM.definitions?.[0]?.definition || '';
          exs = firstM.definitions?.[0]?.example || '';
        }
      }
      const transRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi`);
      const transData = await transRes.json();
      const mVi = transData?.responseData?.translatedText || '';
      setVocabForm(prev => {
        if (!prev) return null;
        return { ...prev, pronunciation: p || '...', meaningVi: mVi || `(Nghĩa của từ "${prev.word}")`, explanationEn: exEn || `Definition for '${prev.word}' not found.`, examples: exs || `Example of using ${prev.word} in context.`, image: `https://loremflickr.com/400/300/${encodeURIComponent(word)},professional` };
      });
    } catch (innerError) {
      setVocabForm(prev => { if (!prev) return null; return { ...prev, pronunciation: `/.../`, meaningVi: `(Lỗi kết nối AI)`, explanationEn: `Could not fetch data for "${prev.word}". Please fill in manually.`, examples: '', image: `https://loremflickr.com/400/300/abstract,academic` }; });
    } finally {
      setIsAiLoading(false);
    }
  };

  const updateImageToolbarPosition = (img: HTMLImageElement) => {
    const wrapper = document.getElementById('editor-wrapper');
    if (wrapper && img) {
      const wrapperRect = wrapper.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();
      setImageControlPos({
        top: Math.max(0, imgRect.top - wrapperRect.top - 60),
        left: imgRect.left - wrapperRect.left + (imgRect.width / 2)
      });
    }
  };

  const handleImageModify = (action: () => void) => {
    if (!selectedImage) return;
    action();
    requestAnimationFrame(() => {
      updateImageToolbarPosition(selectedImage);
      handleSave();
    });
  };

  const handleEditorMouseMove = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const marker = target.closest('.custom-vocab-marker') as HTMLElement;
    if (marker) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      const rect = marker.getBoundingClientRect();
      const popupHeight = 450;
      const popupWidth = 320;
      let side: 'top' | 'bottom' | 'left' | 'right' = 'top';
      if (rect.top < popupHeight) {
        side = 'bottom';
      } else if (window.innerHeight - rect.bottom < popupHeight) {
        side = 'top';
      }
      setHoveredVocab({
        vocabId: marker.getAttribute('data-vocab-id') || '',
        word: marker.getAttribute('data-word') || '',
        pronunciation: marker.getAttribute('data-pronunciation') || '',
        meaningVi: marker.getAttribute('data-meaning-vi') || '',
        explanationEn: marker.getAttribute('data-explanation-en') || '',
        examples: marker.getAttribute('data-examples') || '',
        image: marker.getAttribute('data-image') || '',
        rect,
        side
      });
    } else {
      if (!hoveredVocab) return;
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => setHoveredVocab(null), 100);
    }
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const vocabMarker = target.closest('.custom-vocab-marker') as HTMLElement;
    if (vocabMarker) {
      e.preventDefault();
      e.stopPropagation();
      setVocabForm({
        word: vocabMarker.getAttribute('data-word') || '',
        pronunciation: vocabMarker.getAttribute('data-pronunciation') || '',
        meaningVi: vocabMarker.getAttribute('data-meaning-vi') || '',
        explanationEn: vocabMarker.getAttribute('data-explanation-en') || '',
        examples: vocabMarker.getAttribute('data-examples') || '',
        image: vocabMarker.getAttribute('data-image') || '',
        isEdit: true,
        vocabId: vocabMarker.getAttribute('data-vocab-id') || '',
        range: null
      });
      return;
    }
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      setSelectedImage(img);
      document.querySelectorAll('#rich-text-editor img').forEach(i => (i as HTMLElement).style.boxShadow = 'none');
      img.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.4)';
      updateImageToolbarPosition(img);
    } else {
      setSelectedImage(null);
      document.querySelectorAll('#rich-text-editor img').forEach(img => (img as HTMLElement).style.boxShadow = 'none');
    }
  };

  const handleOpenAddQuestion = (type: 'TRUE_FALSE' | 'MULTIPLE_CHOICE', isMultiple: boolean) => {
    setQuestionModal({ isOpen: true, type, isMultiple });
  };

  const handleSaveQuestion = (q: any) => {
    const questionWithId = { ...q, id: q.id || uuidv4() };
    if (questionModal.editingIndex !== undefined) {
      const newQs = [...questions];
      newQs[questionModal.editingIndex] = questionWithId;
      setQuestions(newQs);
    } else {
      setQuestions([...questions, questionWithId]);
    }
    setQuestionModal({ isOpen: false, type: 'NONE', isMultiple: false });
    setTimeout(() => handleSave(), 100);
  };

  return (
    <div className="flex bg-surface font-body text-on-surface h-[calc(100vh-120px)] overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative">
      {showInstructionsModal && (
        <InstructionsModal 
          initialValue={instructions}
          onClose={() => setShowInstructionsModal(false)}
          onSave={(val) => setInstructions(val)}
        />
      )}
      <style>{`
        .editorial-shadow { box-shadow: 0 8px 24px rgba(25, 27, 35, 0.06); }
        .glass-panel { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(67, 70, 85, 0.1); }
        .custom-vocab-marker { z-index: 1; position: relative; }
        .custom-vocab-marker:hover { z-index: 100 !important; }
      `}</style>
      
      <aside className="bg-surface-container flex flex-col h-full w-64 border-r border-[#c3c6d7] dark:border-gray-800 z-20 shrink-0">
        <div className="px-6 py-4">
           {onBack && (
             <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-4 font-bold text-xs">
               <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại danh sách
             </button>
           )}
           <h1 className="text-lg font-black text-blue-700 font-headline mb-1 leading-tight">Reading Exercise Builder</h1>
           <p className="text-[10px] font-semibold font-label text-slate-500 uppercase tracking-widest mt-2">Teacher Dashboard</p>
        </div>
        <div className="px-4 mb-8">
          <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-1 border border-black/5 dark:border-white/5">
            <span className="text-blue-700 font-bold font-headline text-sm">English Grade 10</span>
            <span className="text-slate-500 font-label text-xs">Unit 4: Modern Ethics</span>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('passage')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-label text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'passage' 
                ? 'text-blue-700 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm border-l-4 border-blue-700' 
                : 'text-slate-500 hover:text-blue-600 hover:bg-[#f0f2f4] dark:hover:bg-gray-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">edit_note</span> Passage Editor
          </button>

          {vocabEnabled && (
            <button 
              onClick={() => {
                if (activeTab === 'passage') refreshVocabList();
                setActiveTab('vocabulary');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 font-label text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'vocabulary' 
                  ? 'text-blue-700 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm border-l-4 border-blue-700' 
                  : 'text-slate-500 hover:text-blue-600 hover:bg-[#f0f2f4] dark:hover:bg-gray-800'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">translate</span> Vocabulary Bank
            </button>
          )}
          <button 
            onClick={() => setActiveTab('questions')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-label text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'questions' 
                ? 'text-blue-700 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm border-l-4 border-blue-700' 
                : 'text-slate-500 hover:text-blue-600 hover:bg-[#f0f2f4] dark:hover:bg-gray-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">quiz</span> Question Bank
          </button>
          
          <button 
            onClick={() => setShowInstructionsModal(true)}
            className={`w-full flex items-center gap-3 px-4 py-3 font-label text-xs font-semibold rounded-xl transition-all ${
              showInstructionsModal 
                ? 'text-blue-700 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm border-l-4 border-blue-700' 
                : 'text-slate-500 hover:text-blue-600 hover:bg-[#f0f2f4] dark:hover:bg-gray-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span> Hướng dẫn làm bài
          </button>
          {/* Multimedia Attachments */}
          <div className="px-4 mt-8 space-y-6">
            <div className="flex flex-col gap-3">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Multimedia Attachments</h3>
               
               {/* Video Upload */}
               <div className="px-4">
                  <div className="group relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-primary/50 dark:hover:border-primary/30 transition-all cursor-pointer overflow-hidden min-h-[100px]">
                     {videoUrl ? (
                       <div className="w-full flex flex-col items-center">
                          <div className="size-10 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg flex items-center justify-center mb-2">
                             <span className="material-symbols-outlined text-[24px]">movie</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 truncate w-full text-center">Video đã tải lên</span>
                          <button onClick={() => { setVideoUrl(''); setTimeout(handleSave, 100); }} className="absolute top-2 right-2 size-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-all opacity-0 group-hover:opacity-100 shadow-sm">
                             <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                       </div>
                     ) : (
                       <>
                          <input type="file" accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleVideoUpload} />
                          <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-[28px]">video_call</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 group-hover:text-primary transition-colors">Tải lên Video</span>
                       </>
                     )}
                  </div>
               </div>

               {/* Audio Upload */}
               <div className="px-4">
                  <div className="group relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-primary/50 dark:hover:border-primary/30 transition-all cursor-pointer overflow-hidden min-h-[100px]">
                     {audioUrl ? (
                       <div className="w-full flex flex-col items-center">
                          <div className="size-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-lg flex items-center justify-center mb-2">
                             <span className="material-symbols-outlined text-[24px]">audiotrack</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 truncate w-full text-center">Audio đã tải lên</span>
                          <button onClick={() => { setAudioUrl(''); setTimeout(handleSave, 100); }} className="absolute top-2 right-2 size-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-all opacity-0 group-hover:opacity-100 shadow-sm">
                             <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                       </div>
                     ) : (
                       <>
                          <input type="file" accept="audio/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleAudioUpload} />
                          <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-[28px]">mic_none</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 group-hover:text-primary transition-colors">Tải lên Audio</span>
                       </>
                     )}
                  </div>
               </div>
            </div>
          </div>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col bg-surface relative overflow-hidden min-w-0">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center w-full px-8 py-4 z-10 shrink-0">
          <div className="flex flex-col flex-1 max-w-2xl mr-4">
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-headline font-extrabold text-xl text-slate-900 dark:text-white tracking-tight bg-transparent border-none outline-none focus:ring-0 p-0 m-0 w-full"
              placeholder="Nhập tiêu đề bài tập..."
            />
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${savingStatus === 'saving' ? 'bg-amber-400 animate-pulse' : 'bg-secondary'}`}></span>
              <span className="text-[10px] font-label font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {savingStatus === 'saving' ? 'Đang lưu...' : lastSaved ? `Đã lưu lúc ${lastSaved.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Tự động lưu...'}
              </span>
              <div className={`ml-3 px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border ${
                assignmentStatus === 'DRAFT' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                assignmentStatus === 'PRIVATE' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                {assignmentStatus === 'DRAFT' ? 'Bản nháp' : assignmentStatus === 'PRIVATE' ? 'Riêng tư' : 'Công khai'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="px-5 py-2 rounded-lg flex items-center border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
            >
              <span className="flex items-center gap-2 text-[13px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                <span className="material-symbols-outlined text-[18px] group-hover:rotate-45 transition-transform">settings</span> Thiết lập
              </span>
            </button>

            <div className="px-5 py-2 rounded-lg flex items-center border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer" onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageInsert} />
              <span className="flex items-center gap-2 text-[13px] font-bold text-primary dark:text-primary-fixed uppercase tracking-wide">
                <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span> Chèn Ảnh
              </span>
            </div>
            <button 
              onClick={() => handleSave()} 
              disabled={savingStatus === 'saving'} 
              className={`px-8 py-2.5 bg-primary text-white rounded-lg font-label text-xs font-bold uppercase tracking-wider editorial-shadow transition-all ${savingStatus === 'saving' ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
            >
              {savingStatus === 'saving' ? 'Đang lưu...' : 'Lưu bài học'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full custom-scrollbar relative flex flex-col">
          {/* Passage Editor - Keep in DOM to allow vocabulary management from other tabs */}
          <div className={activeTab !== 'passage' ? 'hidden' : 'block'}>
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 pb-12 px-6 lg:px-0 mt-8">
              <div id="editor-wrapper" className="bg-surface-container-lowest dark:bg-gray-900 rounded-2xl p-8 lg:p-14 min-h-[800px] editorial-shadow relative border border-gray-200/50 dark:border-gray-800">
                <div
                  className={`absolute top-6 right-8 flex items-center gap-3 px-4 py-2 rounded-full border cursor-pointer transition-all select-none ${
                    vocabEnabled
                      ? 'bg-secondary-container/20 border-secondary/20 hover:bg-secondary-container/40'
                      : 'bg-slate-100/80 dark:bg-gray-800/80 border-slate-200 dark:border-gray-700 hover:bg-slate-200/80'
                  }`}
                  onClick={() => {
                    if (vocabEnabled) {
                      const ed = document.getElementById('rich-text-editor');
                      const count = ed?.querySelectorAll('.custom-vocab-marker').length ?? 0;
                      if (count > 0) { setShowVocabDisableWarning(true); return; }
                      if (activeTab === 'vocabulary') setActiveTab('passage');
                    }
                    setVocabEnabled(v => !v);
                  }}
                  title={vocabEnabled ? 'Tắt chức năng bôi đen từ vựng' : 'Bật chức năng bôi đen từ vựng'}
                >
                  <span className={`material-symbols-outlined text-[16px] ${ vocabEnabled ? 'text-secondary' : 'text-slate-400' }`}>info</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${ vocabEnabled ? 'text-secondary-dark dark:text-secondary-fixed' : 'text-slate-400' }`}>
                    {vocabEnabled ? 'Bôi đen để tạo từ vựng mới' : 'Bật chức năng từ vựng'}
                  </span>
                  {/* Inline toggle */}
                  <span
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                      vocabEnabled ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      vocabEnabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </span>
                </div>
                
                {vocabEnabled && textToolbarPos.show && (
                  <div className="absolute -translate-x-1/2 glass-panel bg-white/95 dark:bg-gray-800/95 px-2 py-1.5 rounded-xl transition-all duration-200 z-40 border border-primary/20 shadow-lg animate-in fade-in" style={{ top: textToolbarPos.top + 'px', left: textToolbarPos.left + 'px' }}>
                    <div className="flex items-center">
                      <span onMouseDown={handleOpenVocabForm} className="flex items-center gap-1.5 text-[12px] font-bold text-primary uppercase tracking-widest cursor-pointer hover:bg-primary/20 px-3 py-1.5 bg-primary/10 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-[16px]">translate</span> Tạo Từ Vựng
                      </span>
                    </div>
                  </div>
                )}

                {selectedImage && (
                  <div className="absolute -translate-x-1/2 glass-panel bg-white/95 dark:bg-gray-800/95 px-5 py-2 rounded-full flex items-center gap-5 shadow-lg z-30 border border-primary/20 animate-in fade-in transition-all duration-200" style={{ top: imageControlPos.top + 'px', left: imageControlPos.left + 'px' }}>
                    <div className="flex items-center gap-2 border-r border-slate-200 dark:border-gray-700 pr-5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">Căn lề</span>
                      <span onMouseDown={(e) => { e.preventDefault(); handleImageModify(() => { selectedImage.style.display = 'inline-block'; selectedImage.style.float = 'left'; selectedImage.style.margin = '0 1.5rem 1.5rem 0'; }); }} className="material-symbols-outlined text-[18px] text-slate-600 cursor-pointer hover:text-primary transition-colors">align_horizontal_left</span>
                      <span onMouseDown={(e) => { e.preventDefault(); handleImageModify(() => { selectedImage.style.display = 'block'; selectedImage.style.float = 'none'; selectedImage.style.margin = '1.5rem auto'; }); }} className="material-symbols-outlined text-[18px] text-slate-600 cursor-pointer hover:text-primary transition-colors">align_horizontal_center</span>
                      <span onMouseDown={(e) => { e.preventDefault(); handleImageModify(() => { selectedImage.style.display = 'inline-block'; selectedImage.style.float = 'right'; selectedImage.style.margin = '0 0 1.5rem 1.5rem'; }); }} className="material-symbols-outlined text-[18px] text-slate-600 cursor-pointer hover:text-primary transition-colors">align_horizontal_right</span>
                    </div>
                    <div className="flex items-center gap-2 border-r border-slate-200 dark:border-gray-700 pr-5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">Kích thước</span>
                      <button onMouseDown={(e) => { e.preventDefault(); handleImageModify(() => { selectedImage.style.width = '25%'; }); }} className="px-2 py-1 text-[10px] font-black bg-slate-100 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-primary hover:text-white transition-all">S</button>
                      <button onMouseDown={(e) => { e.preventDefault(); handleImageModify(() => { selectedImage.style.width = '50%'; }); }} className="px-2 py-1 text-[10px] font-black bg-slate-100 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-primary hover:text-white transition-all">M</button>
                      <button onMouseDown={(e) => { e.preventDefault(); handleImageModify(() => { selectedImage.style.width = '75%'; }); }} className="px-2 py-1 text-[10px] font-black bg-slate-100 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-primary hover:text-white transition-all">L</button>
                      <button onMouseDown={(e) => { e.preventDefault(); handleImageModify(() => { selectedImage.style.width = '100%'; }); }} className="px-2 py-1 text-[10px] font-black bg-slate-100 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-primary hover:text-white transition-all">MAX</button>
                    </div>
                    <span onMouseDown={(e) => { e.preventDefault(); selectedImage.remove(); setSelectedImage(null); handleSave(); }} className="material-symbols-outlined text-[18px] text-red-500 cursor-pointer hover:text-red-700 transition-colors" title="Xóa ảnh">delete</span>
                  </div>
                )}

                <article id="rich-text-editor" onClick={handleEditorClick} onMouseMove={handleEditorMouseMove} onInput={() => handleSave()} onBlur={() => handleSave()} className="prose prose-slate dark:prose-invert max-w-none outline-none focus:outline-none min-h-[500px]" contentEditable suppressContentEditableWarning>
                  <h3 className="font-headline font-bold text-3xl mb-8 leading-tight text-slate-900 dark:text-white">Navigating the Grey: Ethics in the Digital Age</h3>
                  <div className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 font-body mb-6"> Bôi đen từ mới để thiết lập vocabulary chi tiết. </div>
                </article>
              </div>
            </div>
          </div>

          {activeTab === 'questions' ? (
            <div className="w-full max-w-5xl mx-auto mt-8 px-6 pb-12">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black font-headline text-slate-900 dark:text-white">Question Bank</h2>
                  <p className="text-slate-500 font-label text-xs uppercase tracking-widest mt-1">Manage Lesson Assessment</p>
                </div>
                <div className="flex gap-3">
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-[13px] editorial-shadow hover:scale-105 active:scale-95 transition-all">
                      <span className="material-symbols-outlined text-[20px]">add_circle</span> Tạo câu hỏi
                    </button>
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-black/5 p-2 hidden group-hover:block animate-in fade-in slide-in-from-top-2 z-50">
                      <button onClick={() => handleOpenAddQuestion('TRUE_FALSE', false)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                        <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Đúng / Sai</span>
                      </button>
                      <button onClick={() => handleOpenAddQuestion('MULTIPLE_CHOICE', false)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                        <span className="material-symbols-outlined text-blue-500">radio_button_checked</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Trắc nghiệm 1 đáp án</span>
                      </button>
                      <button onClick={() => handleOpenAddQuestion('MULTIPLE_CHOICE', true)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                        <span className="material-symbols-outlined text-purple-500">library_add_check</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Nhiều đáp án đúng</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-slate-200 dark:border-gray-800 rounded-3xl py-20 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[40px] text-slate-300">quiz</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-400">Chưa có câu hỏi nào</h3>
                  <p className="text-slate-400 text-sm mt-1">Hãy bắt đầu tạo câu hỏi để kiểm tra kiến thức học sinh</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={questions.map(q => q.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {questions.map((q, idx) => (
                        <SortableQuestionItem 
                          key={q.id || `q-${idx}`}
                          q={q}
                          idx={idx}
                          onEdit={() => setQuestionModal({ isOpen: true, type: q.type, isMultiple: q.isMultiple, editingIndex: idx })}
                          onDelete={() => {
                            if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
                              const newQs = questions.filter((_, i) => i !== idx);
                              setQuestions(newQs);
                              setTimeout(handleSave, 100);
                            }
                          }}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-5xl mx-auto mt-8 px-6 pb-12 overflow-hidden flex flex-col h-full overflow-y-auto custom-scrollbar">
               <div className="flex items-center justify-between mb-8 shrink-0">
                <div>
                  <h2 className="text-2xl font-black font-headline text-slate-900 dark:text-white">Vocabulary Bank</h2>
                  <p className="text-slate-500 font-label text-xs uppercase tracking-widest mt-1">Manage all terms in this lesson</p>
                </div>
              </div>

              <div className="flex-1">
                {vocabList.length === 0 ? (
                  <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-slate-200 dark:border-gray-800 rounded-3xl py-20 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-[40px] text-slate-300">translate</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-400">Chưa có từ vựng nào</h3>
                    <p className="text-slate-400 text-sm mt-1">Hãy bôi đen văn bản trong Passage Editor để tạo từ mới</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
                    {vocabList.map((vocab) => (
                      <div key={vocab.vocabId} className="group bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                        {vocab.image && (
                          <div className="h-32 w-full shrink-0 relative">
                            <img src={vocab.image} className="w-full h-full object-cover" alt={vocab.word} />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all"></div>
                          </div>
                        )}
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-2">
                             <div>
                               <h4 className="text-lg font-black font-headline text-slate-900 dark:text-white">{vocab.word}</h4>
                               <p className="text-sm font-mono text-indigo-600 dark:text-indigo-400">/{vocab.pronunciation}/</p>
                             </div>
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditVocabFromList(vocab)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all">
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button onClick={() => {
                                  handleDeleteVocab(vocab.vocabId);
                                  refreshVocabList();
                                }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all">
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                             </div>
                          </div>
                          <div className="space-y-3 mt-2 flex-1">
                             <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Nghĩa Tiếng Việt</span>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{vocab.meaningVi}</p>
                             </div>
                             {vocab.explanationEn && (
                               <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">English</span>
                                  <p className="text-[12px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{vocab.explanationEn}</p>
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {questionModal.isOpen && (
          <QuestionModalInternal 
            type={questionModal.type} 
            isMultiple={questionModal.isMultiple}
            onClose={() => setQuestionModal({ isOpen: false, type: 'NONE', isMultiple: false })} 
            onSave={handleSaveQuestion}
            initialData={questionModal.editingIndex !== undefined ? questions[questionModal.editingIndex] : null}
          />
        )}

        {vocabForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-[550px] max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold font-headline flex items-center gap-2 text-slate-900 dark:text-white">
                  <span className="material-symbols-outlined text-primary">{vocabForm.isEdit ? 'edit_note' : 'translate'}</span>
                  {vocabForm.isEdit ? 'Chỉnh Sửa Từ Vựng' : 'Thiết Lập Từ Vựng'}
                </h3>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleAiFill} disabled={isAiLoading} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 editorial-shadow">
                    {isAiLoading ? <span className="animate-spin material-symbols-outlined text-[18px]">autorenew</span> : <span className="material-symbols-outlined text-[18px]">auto_awesome</span>}
                    {isAiLoading ? "AI Đang Nghĩ..." : "AI Tự Điền"}
                  </button>
                  {vocabForm.isEdit && (
                    <button type="button" onClick={() => { const existingElement = document.querySelector(`[data-vocab-id="${vocabForm.vocabId}"]`); if (existingElement) { const text = existingElement.querySelector('span')?.textContent || vocabForm.word; existingElement.replaceWith(document.createTextNode(text)); } setVocabForm(null); }} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  )}
                </div>
              </div>
              <form onSubmit={handleVocabSubmit} className="space-y-4 font-body">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Từ vựng</label>
                      <input type="text" value={vocabForm.word} onChange={e => setVocabForm({...vocabForm, word: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phiên âm</label>
                      <input type="text" value={vocabForm.pronunciation} onChange={e => setVocabForm({...vocabForm, pronunciation: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none font-mono" />
                    </div>
                  </div>
                  <div className="w-32 h-32 shrink-0">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ảnh minh họa</label>
                    <div className="w-full h-full rounded-xl border-2 border-dashed border-slate-200 dark:border-gray-700 overflow-hidden relative group cursor-pointer" onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => setVocabForm({...vocabForm, image: ev.target?.result as string}); reader.readAsDataURL(file); } }; input.click(); }}>
                      {vocabForm.image ? <img src={vocabForm.image} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center justify-center h-full text-slate-400"><span className="material-symbols-outlined text-[24px]">image</span><span className="text-[9px] font-bold mt-1 uppercase">Upload</span></div>}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nghĩa Tiếng Việt</label>
                  <input type="text" value={vocabForm.meaningVi} onChange={e => setVocabForm({...vocabForm, meaningVi: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none" required />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Giải nghĩa Tiếng Anh</label>
                  <textarea value={vocabForm.explanationEn} onChange={e => setVocabForm({...vocabForm, explanationEn: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none min-h-[80px]"></textarea>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ví dụ (mỗi dòng một ví dụ)</label>
                  <textarea value={vocabForm.examples} onChange={e => setVocabForm({...vocabForm, examples: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none min-h-[80px]"></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-gray-800">
                  <button type="button" onClick={() => setVocabForm(null)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-800 transition-colors">Hủy</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-blue-700 transition-colors editorial-shadow">Lưu Từ Vựng</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {hoveredVocab && hoveredVocab.rect && (
          <div 
            className={`fixed z-[9999] w-80 glass-panel bg-white/95 dark:bg-gray-800/95 rounded-2xl p-0 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 pointer-events-auto border border-black/5 dark:border-white/10`}
            style={{ 
              top: hoveredVocab.side === 'bottom' ? hoveredVocab.rect.bottom + 12 : (hoveredVocab.side === 'top' ? 'auto' : (hoveredVocab.side === 'right' || hoveredVocab.side === 'left' ? hoveredVocab.rect.top : 'auto')),
              bottom: hoveredVocab.side === 'top' ? (window.innerHeight - hoveredVocab.rect.top) + 12 : 'auto',
              left: hoveredVocab.side === 'right' ? hoveredVocab.rect.right + 12 : (hoveredVocab.side === 'left' ? hoveredVocab.rect.left - 320 - 12 : Math.max(12, Math.min(window.innerWidth - 332, hoveredVocab.rect.left + (hoveredVocab.rect.width/2) - 160))),
            }}
            onMouseEnter={() => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); }}
            onMouseLeave={() => setHoveredVocab(null)}
          >
            {hoveredVocab.image ? (
              <div className="w-full h-36 overflow-hidden relative">
                <img src={hoveredVocab.image} className="w-full h-full object-cover" alt={hoveredVocab.word} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-0.5 font-label">Vocabulary Word</p>
                  <h3 className="text-xl font-black leading-tight font-headline">{hoveredVocab.word}</h3>
                </div>
              </div>
            ) : (
              <div className="px-5 pt-5 pb-3 bg-gradient-to-br from-indigo-50/50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-indigo-100/50 dark:border-gray-700">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5 font-label">Vocabulary Word</p>
                <h3 className="text-2xl font-black text-indigo-900 dark:text-indigo-200 font-headline leading-tight">{hoveredVocab.word}</h3>
              </div>
            )}

            <div className="p-5 space-y-4">
              {hoveredVocab.pronunciation && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-500 text-lg">volume_up</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono text-base font-medium tracking-wide">/{hoveredVocab.pronunciation}/</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 font-label">Nghĩa Tiếng Việt</p>
                  <p className="text-[15px] font-bold text-slate-800 dark:text-slate-100">{hoveredVocab.meaningVi || 'Đang cập nhật...'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 font-label">English Explanation</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-label">{hoveredVocab.explanationEn || 'No explanation available.'}</p>
                </div>
              </div>

              {hoveredVocab.examples && (
                <div className="pt-4 border-t border-slate-100 dark:border-gray-700/50">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 font-label">Ví dụ minh họa</p>
                  <div className="max-h-[140px] overflow-y-auto custom-scrollbar space-y-2">
                    {hoveredVocab.examples.split('\n').filter(Boolean).map((ex, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-gray-900 p-3 rounded-lg border border-slate-100 dark:border-gray-700">
                        <p className="text-xs italic text-slate-700 dark:text-slate-400">"{ex}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => handleDeleteVocab(hoveredVocab.vocabId)}
                  className="px-3 py-2.5 rounded-lg border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center shadow-sm"
                  title="Xóa từ vựng này"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
                <button className="flex-1 bg-primary hover:bg-blue-700 text-white py-2.5 rounded-lg font-label text-[12px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">bookmark_add</span> Add to Lesson List
                </button>
              </div>
            </div>
            
            {(hoveredVocab.side === 'top' || hoveredVocab.side === 'bottom') && (
               <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-800 border-slate-200/50 dark:border-gray-700 rotate-45 z-[-1] shadow-sm`} style={{ [hoveredVocab.side === 'bottom' ? 'top' : 'bottom']: '-8px', borderTopWidth: hoveredVocab.side === 'bottom' ? 1 : 0, borderLeftWidth: hoveredVocab.side === 'bottom' ? 1 : 0, borderBottomWidth: hoveredVocab.side === 'top' ? 1 : 0, borderRightWidth: hoveredVocab.side === 'top' ? 1 : 0, }} />
            )}
          </div>
        )}

        {/* Vocab disable warning modal */}
        {showVocabDisableWarning && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-white/10">
              <div className="p-10 flex flex-col items-center text-center">
                <div className="size-20 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-full flex items-center justify-center mb-8 shadow-inner ring-8 ring-amber-50/50 dark:ring-amber-900/10">
                  <span className="material-symbols-outlined text-[40px]">warning</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Không thể tắt tính năng từ vựng</h3>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                  Bài học đang có <strong>các từ vựng đã được tạo</strong>. Hãy xoá tất cả từ vựng trong mục <em>Vocabulary Bank</em> trước khi tắt tính năng này.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowVocabDisableWarning(false)}
                    className="flex-1 py-4 border-2 border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all"
                  >
                    Đã hiểu
                  </button>
                  <button
                    onClick={() => {
                      setShowVocabDisableWarning(false);
                      if (activeTab !== 'vocabulary') refreshVocabList();
                      setActiveTab('vocabulary');
                    }}
                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-sm editorial-shadow hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                  >
                    Đi đến Vocabulary Bank
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Validation Modal */}
        {validationModal.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-white/10">
              <div className="p-10 flex flex-col items-center text-center">
                <div className="size-20 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-full flex items-center justify-center mb-8 shadow-inner ring-8 ring-amber-50/50 dark:ring-amber-900/10">
                  <span className="material-symbols-outlined text-[40px]">error_outline</span>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Thông tin chưa đầy đủ</h3>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                  Dữ liệu của bạn <strong>vẫn được hệ thống tự động lưu dưới dạng Bản nháp</strong>. Tuy nhiên, để có thể chuyển sang Riêng tư hoặc Công khai, bạn cần hoàn thiện:
                </p>

                <div className="w-full space-y-3 mb-10">
                  {validationModal.missingTitle && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                      <span className="material-symbols-outlined text-red-500">title</span>
                      <span className="text-sm font-bold text-red-700 dark:text-red-400">Tiêu đề đang bị trống</span>
                    </div>
                  )}
                  {validationModal.missingContent && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                      <span className="material-symbols-outlined text-red-500">short_text</span>
                      <span className="text-sm font-bold text-red-700 dark:text-red-400 text-left">Nội dung bài đọc chưa đạt yêu cầu (từ 50 ký tự trở lên)</span>
                    </div>
                  )}
                </div>

                <button 
                   onClick={() => setValidationModal({ ...validationModal, show: false })}
                   className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm editorial-shadow hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                >
                  ĐÃ HIỂU, ĐỂ TÔI NHẬP LẠI
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-white/10 flex flex-col max-h-[90vh]">
               {/* Modal Header */}
               <div className="p-8 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                     <div className="size-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                        <span className="material-symbols-outlined">settings</span>
                     </div>
                     <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white font-headline">Thiết lập học liệu</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Cấu hình thông tin hiển thị công khai</p>
                     </div>
                  </div>
                  <button onClick={() => { setIsSettingsOpen(false); handleSave(); }} className="size-10 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 flex items-center justify-center transition-all group">
                     <span className="material-symbols-outlined text-slate-400 group-hover:rotate-90 transition-transform">close</span>
                  </button>
               </div>

               {/* Modal Content */}
               <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Môn học</label>
                        <select 
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-bold text-sm"
                        >
                           {['Toán học', 'Tiếng Anh', 'Ngữ Văn', 'Vật Lý', 'Hóa Học', 'Sinh Học', 'Lịch Sử', 'Địa Lý', 'GDCD', 'Tin Học'].map(s => (
                             <option key={s} value={s}>{s}</option>
                           ))}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Khối lớp</label>
                        <select 
                          value={gradeLevel}
                          onChange={(e) => setGradeLevel(e.target.value)}
                          className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-bold text-sm"
                        >
                           {['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12', 'Ôn thi Đại học'].map(g => (
                             <option key={g} value={g}>{g}</option>
                           ))}
                        </select>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <div className="flex justify-between items-center px-1">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Mô tả ngắn</label>
                        <span className={`text-[10px] font-bold ${shortDescription.length > 180 ? 'text-red-500' : 'text-slate-400'}`}>{shortDescription.length}/200</span>
                     </div>
                     <textarea 
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value.slice(0, 200))}
                        placeholder="Một mô tả ngắn gọn giúp học sinh hiểu nội dung bài học này (khoảng 2 câu)..."
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-medium text-sm min-h-[100px] resize-none"
                     />
                  </div>

                  <div className="space-y-4">
                     <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Gắn thẻ (Tags)</label>
                     <div className="flex flex-wrap gap-2">
                        {['Tiếng Anh', 'Toán học', 'Ngữ pháp', 'Từ vựng', 'TOEIC', 'IELTS', 'Lớp 10', 'Lớp 11', 'Lớp 12', 'Ôn thi'].map(tag => (
                          <button
                            key={tag}
                            onClick={() => {
                              if (tags.includes(tag)) setTags(tags.filter(t => t !== tag));
                              else setTags([...tags, tag]);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                              tags.includes(tag) 
                              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' 
                              : 'bg-white dark:bg-gray-800 text-slate-500 border-slate-200 dark:border-gray-700 hover:border-primary/50'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                     </div>

                     <div className="relative">
                        <input 
                           type="text"
                           placeholder="Nhập thẻ tự chọn và nhấn Enter..."
                           className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-bold text-sm pr-12"
                           onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                               const val = (e.target as HTMLInputElement).value.trim();
                               if (val && !tags.includes(val)) {
                                 setTags([...tags, val]);
                                 (e.target as HTMLInputElement).value = '';
                               }
                             }
                           }}
                        />
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">add</span>
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

               {/* Modal Footer */}
               <div className="p-8 bg-slate-50 dark:bg-gray-800/50 border-t border-slate-100 dark:border-gray-800 shrink-0">
                  <button 
                    onClick={() => { setIsSettingsOpen(false); handleSave(); }}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20"
                  >
                     Xác nhận & Lưu thiết lập
                  </button>
               </div>
            </div>
          </div>
        )}
      </main>
      {showInstructionsModal && (
        <InstructionsModal 
          initialValue={instructions}
          onClose={() => setShowInstructionsModal(false)}
          onSave={(val) => setInstructions(val)}
        />
      )}
    </div>
  );
}

function QuestionModalInternal({ type, isMultiple, onClose, onSave, initialData }: any) {
  const [formData, setFormData] = useState<any>(() => {
    if (initialData) {
      let content = initialData.content || {};
      if (typeof content === 'string') {
        try {
          content = JSON.parse(content);
        } catch (e) {
          content = {};
        }
      }
      
      const qType = initialData.type || type;
      
      // Aggressive property resolution with even more aliases
      const qText = initialData.questionText || initialData.question || initialData.statement || 
                    content.questionText || content.question || content.statement || 
                    content.data?.questionText || content.data?.question || '';
      
      // Robust options loading
      let rawOptions = initialData.options || content.options || content.data?.options;
      
      // Fallback for non-True/False questions
      if ((!rawOptions || rawOptions.length === 0) && qType !== 'TRUE_FALSE') {
        rawOptions = [
          { id: '1', text: '', isCorrect: false },
          { id: '2', text: '', isCorrect: false },
          { id: '3', text: '', isCorrect: false },
          { id: '4', text: '', isCorrect: false }
        ];
      } else if (!rawOptions) {
        rawOptions = [];
      }

      return {
        ...initialData,
        questionText: qText,
        options: rawOptions.map((o: any, i: number) => ({ ...o, id: o.id || `opt-${i}` })),
        correctAnswer: qType === 'TRUE_FALSE' 
          ? (content.isTrue === false ? 'false' : (initialData.correctAnswer || 'true')) 
          : (initialData.correctAnswer || ''),
        points: initialData.points || 1,
        explanation: initialData.explanation || content.explanation || ''
      };
    }
    return {
      questionText: '',
      type: type,
      isMultiple: isMultiple,
      options: type === 'TRUE_FALSE' ? [] : [
        { id: '1', text: '', isCorrect: false },
        { id: '2', text: '', isCorrect: false },
        { id: '3', text: '', isCorrect: false },
        { id: '4', text: '', isCorrect: false }
      ],
      correctAnswer: type === 'TRUE_FALSE' ? 'true' : '',
      points: 1,
      explanation: ''
    };
  });


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl border border-black/5 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10">
          <div>
            <h3 className="text-xl font-black font-headline text-slate-900 dark:text-white">
              {initialData ? 'Sửa câu hỏi' : 'Tạo câu hỏi mới'}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {type === 'TRUE_FALSE' ? 'Đúng / Sai' : !isMultiple ? 'Trắc nghiệm 1 đáp án' : 'Trắc nghiệm nhiều đáp án'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-label">Nội dung câu hỏi</label>
            <textarea 
              value={formData.questionText}
              onChange={e => setFormData({...formData, questionText: e.target.value})}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-primary outline-none font-medium min-h-[100px] resize-none"
              placeholder="Nhập nội dung câu hỏi..."
              required
            />
          </div>

          {type === 'TRUE_FALSE' ? (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 font-label">Đáp án đúng</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, correctAnswer: 'true'})}
                  className={`py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${
                    formData.correctAnswer === 'true' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                      : 'bg-white dark:bg-gray-800 text-slate-400 border-slate-100 dark:border-gray-700'
                  }`}
                >
                  <span className="material-symbols-outlined">check_circle</span> Đúng
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, correctAnswer: 'false'})}
                  className={`py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${
                    formData.correctAnswer === 'false' 
                      ? 'bg-red-50 text-red-600 border-red-200' 
                      : 'bg-white dark:bg-gray-800 text-slate-400 border-slate-100 dark:border-gray-700'
                  }`}
                >
                  <span className="material-symbols-outlined">cancel</span> Sai
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-label">Các lựa chọn đáp án</label>
              {formData.options?.map((opt: any, idx: number) => (
                <div key={opt.id || idx} className="flex items-center gap-4">

                  <button 
                    type="button"
                    onClick={() => {
                      const newOpts = [...formData.options];
                      if (isMultiple) {
                        newOpts[idx].isCorrect = !newOpts[idx].isCorrect;
                      } else {
                        newOpts.forEach((o, i) => o.isCorrect = i === idx);
                      }
                      setFormData({...formData, options: newOpts});
                    }}
                    className={`size-10 rounded-xl flex items-center justify-center transition-all ${
                      opt.isCorrect ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-400 dark:bg-gray-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{opt.isCorrect ? 'done' : 'radio_button_unchecked'}</span>
                  </button>
                  <input 
                    type="text"
                    value={opt.text}
                    onChange={e => {
                      const newOpts = [...formData.options];
                      newOpts[idx].text = e.target.value;
                      setFormData({...formData, options: newOpts});
                    }}
                    className="flex-1 px-5 py-3 rounded-xl bg-slate-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-primary outline-none font-medium"
                    placeholder={`Đáp án ${idx + 1}...`}
                  />
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-gray-800">
             <button type="button" onClick={onClose} className="px-8 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Hủy</button>
             <button type="submit" className="px-10 py-3 bg-primary text-white rounded-2xl font-bold editorial-shadow hover:scale-105 active:scale-95 transition-all">Lưu câu hỏi</button>
          </div>
        </form>
      </div>
    </div>
  );
}
