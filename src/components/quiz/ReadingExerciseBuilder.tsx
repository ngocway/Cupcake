"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { autoSaveMaterial, syncAssignmentClasses, saveMaterialThumbnail } from '@/actions/material-actions';
import { getPopularTags } from '@/actions/tag-actions';
import { InstructionsModal } from './InstructionsModal';
import { generateVocabularyDetails } from '@/actions/ai-actions';
import { searchImagesAction } from '@/actions/image-search-actions';
import { toast } from 'sonner';
import { uploadMedia, uploadUrlMedia } from '@/actions/upload-actions';
import { sliceAudioFile } from '@/utils/audioSlicer';

type MediaAttachment = {
  id: string;
  url: string;
  name: string;
  status: 'uploading' | 'processing_ai' | 'success' | 'error';
  progress: number;
};

import CategorySelect from '@/components/shared/CategorySelect';
import { ThumbnailUploader } from '@/components/shared/ThumbnailUploader';
import { TagAutocompleteInput } from './TagAutocompleteInput';
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
  rectSortingStrategy,
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

function SortableTagItem({ 
  tag, 
  onRemove 
}: { 
  tag: string, 
  onRemove: () => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: tag });

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
      className={`px-4 py-1.5 bg-yellow-400/10 text-yellow-600 rounded-lg text-xs font-bold border border-yellow-400/20 flex items-center gap-2 cursor-grab active:cursor-grabbing select-none transition-all ${
        isDragging ? 'border-yellow-400 shadow-md ring-2 ring-yellow-400/20 scale-105' : ''
      }`}
    >
      #{tag}
      <button 
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }} 
        className="p-0.5 hover:bg-yellow-400/20 rounded-full flex items-center justify-center cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined text-[14px]">close</span>
      </button>
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
      
      const currentQuestionsHash = JSON.stringify(questions);
      
      const payload: any = {
        id: assignmentId || initialId || 'clp_reading_001',
        title,
        videoUrl: videoUrl,
        audioUrl: audioUrl,
        ttsVoice: ttsVoice,
        ttsSpeed: ttsSpeed,
        subject,
        gradeLevel,
        shortDescription,
        instructions,
        tags: tags.join(','),
        categoryIds,
        targetAudiences: targetAudiences,
        thumbnail
      };

      if (contentHtml !== lastSavedContentHtml) {
        payload.readingText = contentHtml;
      }
      
      if (currentQuestionsHash !== lastSavedQuestionsHash) {
        payload.questions = questions.map(q => ({
          ...q,
          content: {
            ...(typeof q.content === 'object' ? q.content : {}),
            questionText: q.questionText,
            options: q.options,
            isTrue: q.type === 'TRUE_FALSE' ? q.correctAnswer === 'true' : undefined
          }
        }));
      }

      await autoSaveMaterial(payload);
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
  const [title, setTitle] = useState('Đang tải...');
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [assignmentStatus, setAssignmentStatus] = useState<'DRAFT' | 'PRIVATE' | 'PUBLIC'>('DRAFT');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [validationModal, setValidationModal] = useState<{show: boolean, missingTitle: boolean, missingContent: boolean}>({show: false, missingTitle: false, missingContent: false});
  const [videoUrl, setVideoUrl] = useState('');
  const [videoThumbnail, setVideoThumbnail] = useState('');
  const [videoTab, setVideoTab] = useState<'upload' | 'youtube'>('upload');
  const [youtubeLinkInput, setYoutubeLinkInput] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);
  const [audioUploadProgress, setAudioUploadProgress] = useState<number | null>(null);
  const [mediaAttachments, setMediaAttachments] = useState<MediaAttachment[]>([]);

  useEffect(() => {
    if (assignmentId && isInitialLoadDone) {
      fetch(`/api/media-attachments?assignmentId=${assignmentId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMediaAttachments(data.map(d => ({ ...d, status: 'success', progress: 100 })));
          }
        })
        .catch(console.error);
    }
  }, [assignmentId, isInitialLoadDone]);


  const [instructions, setInstructions] = useState('');
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastSavedContentHtml, setLastSavedContentHtml] = useState<string | null>(null);
  const [lastSavedQuestionsHash, setLastSavedQuestionsHash] = useState<string | null>(null);
  
  // Metadata States
  const [subject, setSubject] = useState('Khác');
  const [gradeLevel, setGradeLevel] = useState('Khác');
  const [shortDescription, setShortDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [popularTagsList, setPopularTagsList] = useState<string[]>(['Tiếng Anh', 'Toán học', 'Ngữ pháp', 'Từ vựng', 'TOEIC', 'IELTS', 'Lớp 10', 'Lớp 11', 'Lớp 12', 'Ôn thi']);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [targetAudiences, setTargetAudiences] = useState<string[]>([]);
  const [belongsToLesson, setBelongsToLesson] = useState(false);
  const [materialType, setMaterialType] = useState<string>('READING');
  const [ttsVoice, setTtsVoice] = useState<string>('Aoede');
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleThumbnailChange = async (newValue: string | null) => {
    setIsUploadingThumbnail(true);
    const previousThumbnail = thumbnail;
    setThumbnail(newValue);
    try {
      const result = await saveMaterialThumbnail(assignmentId || initialId || 'clp_reading_001', newValue);
      if (result.success) {
        toast.success(newValue ? 'Tải ảnh đại diện thành công!' : 'Đã gỡ bỏ ảnh đại diện!');
      } else {
        throw new Error('Cơ sở dữ liệu phản hồi không thành công.');
      }
    } catch (err: any) {
      console.error('Lỗi tải ảnh đại diện:', err);
      setThumbnail(previousThumbnail);
      toast.error(`Không thể lưu ảnh đại diện: ${err.message || 'Lỗi hệ thống'}`);
      alert(`Lỗi lưu ảnh đại diện: ${err.message || 'Hệ thống không thể ghi nhận ảnh này. Vui lòng kiểm tra lại kích thước hoặc kết nối mạng.'}`);
    } finally {
      setIsUploadingThumbnail(false);
    }
  };
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imageControlPos, setImageControlPos] = useState({ top: 0, left: 0 });
  const [textToolbarPos, setTextToolbarPos] = useState({ top: 0, left: 0, show: false });
  const [vocabForm, setVocabForm] = useState<{
    word: string;
    pronunciation: string;
    meaningVi: string;
    meaningTh: string;
    meaningId: string;
    explanationEn: string;
    examples: string;
    image: string;
    range: Range | null;
    isEdit?: boolean;
    vocabId?: string;
  } | null>(null);

  const [showImageSearchDrawer, setShowImageSearchDrawer] = useState(false);
  const [imageSearchResults, setImageSearchResults] = useState<any[]>([]);
  const [visibleImagesCount, setVisibleImagesCount] = useState(12);
  const [imageSearchStyle, setImageSearchStyle] = useState<"REALISTIC" | "CARTOON">("REALISTIC");
  const [isSearchingImage, setIsSearchingImage] = useState(false);

  const handleGoogleImageSearch = async (searchTerm: string, forceStyle?: "REALISTIC" | "CARTOON") => {
    if (!searchTerm || !searchTerm.trim()) {
      toast.error("Vui lòng nhập từ khóa tìm kiếm ảnh.");
      return;
    }
    setIsSearchingImage(true);
    setShowImageSearchDrawer(true);
    const styleToUse = forceStyle || imageSearchStyle;
    const finalSearchTerm = styleToUse === "CARTOON" ? `${searchTerm} cartoon illustration` : searchTerm;
    try {
      const results = await searchImagesAction(finalSearchTerm);
      setImageSearchResults(results || []);
      setVisibleImagesCount(12);
    } catch (err: any) {
      console.error(err);
      toast.error("Lỗi tìm ảnh: " + (err.message || "Không thể tải ảnh từ Google Images."));
    } finally {
      setIsSearchingImage(false);
    }
  };
  const [showAIPromptModal, setShowAIPromptModal] = useState(false);
  const [isUploadingVocabImage, setIsUploadingVocabImage] = useState(false);

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isGeneratingInlineAudio, setIsGeneratingInlineAudio] = useState(false);
  const [isGeneratingGlobalAudio, setIsGeneratingGlobalAudio] = useState(false);

  const handleCreateInlineAudio = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const selectedText = selection.toString().trim();
    if (!selectedText) return;
    
    const range = selection.getRangeAt(0);
    
    setIsGeneratingInlineAudio(true);
    const toastId = toast.loading('Đang tạo âm thanh AI...');
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          voice: ttsVoice,
          speed: ttsSpeed,
          mode: 'inline'
        })
      });
      
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Lỗi tạo Audio');
      }
      
      const audioUrl = data.audioUrl || data.url;
      
      const escapeAttr = (str: string) => str ? str.replace(/"/g, '&quot;').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
      const html = `<span class="inline-audio-marker text-primary bg-primary/10 rounded-full w-7 h-7 mx-1 cursor-pointer inline-flex items-center justify-center hover:bg-primary/20 transition-colors shadow-sm ring-1 ring-primary/20 align-middle" data-audio-url="${escapeAttr(audioUrl)}" contenteditable="false" draggable="true" title="Nghe Audio"><span class="material-symbols-outlined text-[16px]">volume_up</span></span>&nbsp;`;
      
      range.collapse(false); // Collapse range to end of selection to insert immediately after the text
      insertNodeAtCursor(html, range);
      
      selection.removeAllRanges();
      setTextToolbarPos({ top: 0, left: 0, show: false });
      toast.success('Đã tạo âm thanh AI!', { id: toastId });
      
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi: ' + err.message, { id: toastId });
    } finally {
      setIsGeneratingInlineAudio(false);
    }
  };
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
    }
  };

  const handleTagDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTags((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDeleteVocab = (vocabId: string) => {
    const marker = document.querySelector(`[data-vocab-id="${vocabId}"]`);
    if (marker) {
      const innerSpan = marker.querySelector('span');
      const text = innerSpan?.textContent || marker.textContent || '';
      marker.replaceWith(document.createTextNode(text));
      setVocabList([]);
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
      meaningTh: m.getAttribute('data-meaning-th') || '',
      meaningId: m.getAttribute('data-meaning-id') || '',
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

  // --- Video helpers (must be before the init useEffect) ---
  const extractYouTubeId = (url: string): string | null => {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
    return m ? m[1] : null;
  };

  useEffect(() => {
    if (activeTab === 'vocabulary') refreshVocabList();
  }, [activeTab]);

  useEffect(() => {
    // Hide layout elements when editor is active
    const header = document.getElementById('teacher-header');
    const aside = document.getElementById('teacher-sidebar');
    const wrapper = document.getElementById('teacher-layout-wrapper');
    
    if (header) header.style.display = 'none';
    if (aside) aside.style.display = 'none';
    if (wrapper) {
      wrapper.classList.remove('max-w-[1440px]', 'mx-auto', 'px-6', 'py-8', 'gap-8');
      wrapper.classList.add('w-full');
    }

    return () => {
      // Restore layout elements when editor is unmounted
      if (header) header.style.display = '';
      if (aside) aside.style.display = '';
      if (wrapper) {
        wrapper.classList.add('max-w-[1440px]', 'mx-auto', 'px-6', 'py-8', 'gap-8');
        wrapper.classList.remove('w-full');
      }
    };
  }, []);

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
          // Restore thumbnail for YouTube videos that were previously saved
          if (data.assignment.videoUrl) {
            const ytId = extractYouTubeId(data.assignment.videoUrl);
            if (ytId) {
              setVideoThumbnail(`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`);
              setVideoTab('youtube');
              setYoutubeLinkInput(data.assignment.videoUrl || '');
            }
          }
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
              setLastSavedContentHtml(data.assignment.readingText);
              // Auto-enable vocab if markers exist
              const hasMarkers = editor.querySelectorAll('.custom-vocab-marker').length > 0;
              if (hasMarkers) setVocabEnabled(true);
            }
          } else {
            // Ensure editor is empty for new materials
            const editor = document.getElementById('rich-text-editor');
            if (editor) editor.innerHTML = '';
            setLastSavedContentHtml('');
          }
          if (data.assignment.subject) setSubject(data.assignment.subject);
          if (data.assignment.gradeLevel) setGradeLevel(data.assignment.gradeLevel);
          if (data.assignment.shortDescription) setShortDescription(data.assignment.shortDescription);
          if (data.assignment.instructions) setInstructions(data.assignment.instructions);
          if (data.assignment.tags) {
             setTags(data.assignment.tags.split(',').filter(Boolean));
          }
          if (data.assignment.categories) {
            setCategoryIds(data.assignment.categories?.map((c: any) => c.id) || []);
          }
          if (data.assignment.targetAudiences) {
            setTargetAudiences(data.assignment.targetAudiences || []);
          }
          if (data.assignment.lesson || data.assignment.lessonId) {
            setBelongsToLesson(true);
          }
          setThumbnail(data.assignment.thumbnail || null);
          setMaterialType(data.assignment.materialType || 'READING');
          setTtsVoice(data.assignment.ttsVoice || 'Aoede');
          setTtsSpeed(data.assignment.ttsSpeed || 1.0);
          
          if (data.assignment.questions) {
            setLastSavedQuestionsHash(JSON.stringify(data.assignment.questions));
          } else {
            setLastSavedQuestionsHash(JSON.stringify([]));
          }
        }
        
        // Fetch popular tags dynamically
        getPopularTags().then(tagsList => {
          if (tagsList && tagsList.length > 0) {
            setPopularTagsList(tagsList);
          }
        }).catch(err => {
          console.error("Failed to fetch popular tags:", err);
        });
      } catch (err) {
        console.error('Initial fetch failed:', err);
      } finally {
        setIsInitialLoadDone(true);
      }
    }
    init();
  }, [initialId]);


  const generateVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);
      video.src = url;
      video.addEventListener('loadeddata', () => {
        video.currentTime = Math.min(1, video.duration * 0.1);
      });
      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(url); reject('no ctx'); return; }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumb = canvas.toDataURL('image/jpeg', 0.85);
        URL.revokeObjectURL(url);
        resolve(thumb);
      });
      video.addEventListener('error', () => { URL.revokeObjectURL(url); reject('video error'); });
    });
  };

  const handleYouTubeLink = (url: string) => {
    setYoutubeLinkInput(url);
    const id = extractYouTubeId(url);
    if (id) {
      setVideoUrl(url);
      setVideoThumbnail(`https://img.youtube.com/vi/${id}/hqdefault.jpg`);
    } else {
      setVideoThumbnail('');
      if (!url) setVideoUrl('');
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) return alert('Video dung lượng quá lớn (tối đa 100MB)');
      setVideoUploadProgress(0);
      // Generate thumbnail from first frame via canvas
      generateVideoThumbnail(file)
        .then(thumb => setVideoThumbnail(thumb))
        .catch(() => setVideoThumbnail(''));
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          setVideoUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setVideoUrl(result);
        setVideoUploadProgress(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Clear the input so the same files can be selected again
    e.target.value = '';
    
    const newAttachments: MediaAttachment[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      url: '',
      name: file.name,
      status: 'uploading',
      progress: 0
    }));

    setMediaAttachments(prev => [...newAttachments, ...prev]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const attachmentId = newAttachments[i].id;
      
      if (file.size > 20 * 1024 * 1024) {
        setMediaAttachments(prev => prev.map(a => a.id === attachmentId ? { ...a, status: 'error', name: 'File quá lớn (>20MB)' } : a));
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        
        // Mock progress for now
        setMediaAttachments(prev => prev.map(a => a.id === attachmentId ? { ...a, progress: 50 } : a));
        
        const result = await uploadMedia(formData);
        
        if (result.success && result.url) {
          setMediaAttachments(prev => prev.map(a => a.id === attachmentId ? { ...a, status: 'processing_ai', url: result.url, progress: 100 } : a));
          
          let finalName = file.name;
          
          try {
            const slicedBlob = await sliceAudioFile(file, 3.5);
            const aiFormData = new FormData();
            aiFormData.append('file', slicedBlob);
            
            const aiRes = await fetch('/api/ai/transcribe', {
              method: 'POST',
              body: aiFormData
            });
            const aiData = await aiRes.json();
            if (aiData.transcript && aiData.transcript.trim() !== '') {
              finalName = aiData.transcript.substring(0, 50) + (aiData.transcript.length > 50 ? '...' : '');
            }
          } catch (aiErr) {
            console.error("AI Transcription failed", aiErr);
          }
          
          const saveRes = await fetch('/api/media-attachments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              assignmentId: assignmentId || initialId || 'clp_reading_001',
              url: result.url,
              name: finalName,
              type: 'AUDIO'
            })
          });
          
          const savedData = await saveRes.json();
          
          setMediaAttachments(prev => prev.map(a => a.id === attachmentId ? { ...a, status: 'success', name: finalName, id: savedData.id || a.id } : a));
          toast.success(`Đã tải lên: ${finalName}`);
        } else {
          setMediaAttachments(prev => prev.map(a => a.id === attachmentId ? { ...a, status: 'error' } : a));
          toast.error(`Lỗi tải file: ${file.name}`);
        }
      } catch (err) {
        setMediaAttachments(prev => prev.map(a => a.id === attachmentId ? { ...a, status: 'error' } : a));
        toast.error(`Lỗi hệ thống: ${file.name}`);
      }
    }
  };

  const extractCleanTextFromHtml = (html: string): string => {
    if (typeof document === 'undefined') return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove all inline audio markers (volume_up icons)
    const audioMarkers = temp.querySelectorAll('.inline-audio-marker');
    audioMarkers.forEach(m => m.remove());
    
    // Get clean text content and replace special characters (like speaker symbol 🔊)
    const text = temp.textContent || '';
    return text.replace(/🔊/g, '').replace(/\s+/g, ' ').trim();
  };

  const handleGenerateGlobalAudio = async () => {
    const editor = document.getElementById('rich-text-editor');
    const contentHtml = editor?.innerHTML || '';
    const cleanText = extractCleanTextFromHtml(contentHtml);
    
    if (!cleanText) {
      toast.error('Vui lòng nhập nội dung bài đọc trước khi tạo audio toàn bài!');
      return;
    }
    
    setIsGeneratingGlobalAudio(true);
    const toastId = toast.loading('Đang sử dụng AI tạo audio toàn bài đọc...');
    
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          voice: ttsVoice,
          speed: ttsSpeed,
          mode: 'global'
        })
      });
      
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Lỗi tạo Audio toàn bài');
      }
      
      const generatedAudioUrl = data.audioUrl || data.url;
      setAudioUrl(generatedAudioUrl);
      toast.success('Tạo audio toàn bài bằng AI thành công!', { id: toastId });
      
      // Kích hoạt lưu lại thay đổi
      setTimeout(() => {
        handleSave(title, videoUrl, generatedAudioUrl);
      }, 500);
      
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi tạo audio toàn bài: ' + err.message, { id: toastId });
    } finally {
      setIsGeneratingGlobalAudio(false);
    }
  };


  const handleSave = async (customTitle?: string, customVideoUrl?: string, customAudioUrl?: string) => {
    const idToSave = assignmentId || initialId || 'clp_reading_001';
    if (!idToSave) return;
    
    setSavingStatus('saving');
    try {
      const editor = document.getElementById('rich-text-editor');
      const contentHtml = editor?.innerHTML || '';
      
      const currentQuestionsHash = JSON.stringify(questions);
      
      const payload: any = {
        id: idToSave,
        title: customTitle || title,
        videoUrl: customVideoUrl !== undefined ? customVideoUrl : videoUrl,
        audioUrl: customAudioUrl !== undefined ? customAudioUrl : audioUrl,
        subject,
        gradeLevel,
        shortDescription,
        instructions,
        tags: tags.join(','),
        categoryIds,
        targetAudiences: targetAudiences
      };

      if (contentHtml !== lastSavedContentHtml) {
        payload.readingText = contentHtml;
      }

      if (currentQuestionsHash !== lastSavedQuestionsHash) {
        payload.questions = questions.map(q => ({
          ...q,
          content: {
            ...(typeof q.content === 'object' ? q.content : {}),
            questionText: q.questionText,
            options: q.options,
            isTrue: q.type === 'TRUE_FALSE' ? q.correctAnswer === 'true' : undefined
          }
        }));
      }

      await autoSaveMaterial(payload);
      
      setSavingStatus('saved');
      setLastSaved(new Date());
      setLastSavedContentHtml(contentHtml);
      setLastSavedQuestionsHash(currentQuestionsHash);
      setTimeout(() => setSavingStatus('idle'), 2000);
    } catch (error) {
      console.error('Save failed:', error);
      setSavingStatus('error');
    }
  };



  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageInsert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSavingStatus('saving'); // Tạm dùng status này để báo UI đang tải
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const { uploadMedia } = await import('@/actions/upload-actions');
        const res = await uploadMedia(formData);
        
        if (res.success && res.url) {
          const imgHtml = `<img src="${res.url}" alt="Inserted" draggable="true" style="max-width: 100%; width: 50%; display: inline-block; border-radius: 0.75rem; margin: 0.5rem; cursor: move; transition: all 0.2s;" class="custom-editable-image" />&nbsp;`;
          const editor = document.getElementById('rich-text-editor');
          if (editor && document.activeElement !== editor) {
              editor.focus();
          }
          document.execCommand('insertHTML', false, imgHtml);
        } else {
          console.error('Upload failed:', res.error);
          alert('Tải ảnh thất bại: ' + res.error);
        }
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Có lỗi xảy ra khi tải ảnh lên.');
      } finally {
        setSavingStatus('idle');
      }
    }
  };

  const audioInputRef = useRef<HTMLInputElement>(null);
  const [savedAudioRange, setSavedAudioRange] = useState<Range | null>(null);
  const [dragOverPos, setDragOverPos] = useState({ show: false, x: 0, y: 0 });
  const playingAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const markers = document.querySelectorAll('#rich-text-editor .inline-audio-marker, #rich-text-editor .inline-audio-wrapper');
    markers.forEach(marker => {
      const isWrapper = marker.classList.contains('inline-audio-wrapper');
      const isPlaying = marker.getAttribute('data-audio-url') === playingAudioUrl;
      const icon = marker.querySelector('.material-symbols-outlined');

      if (isPlaying) {
        if (isWrapper) {
          marker.classList.add('bg-blue-100', 'dark:bg-blue-900/40', 'scale-[1.02]');
          marker.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
        } else {
          marker.classList.add('bg-primary', 'text-white', 'shadow-md', 'scale-105');
          marker.classList.remove('bg-primary/10', 'text-primary');
        }
        if (icon) {
          icon.textContent = 'graphic_eq';
          icon.classList.add('animate-pulse');
        }
      } else {
        if (isWrapper) {
          marker.classList.remove('bg-blue-100', 'dark:bg-blue-900/40', 'scale-[1.02]');
          marker.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
        } else {
          marker.classList.remove('bg-primary', 'text-white', 'shadow-md', 'scale-105');
          marker.classList.add('bg-primary/10', 'text-primary');
        }
        if (icon) {
          icon.textContent = 'volume_up';
          icon.classList.remove('animate-pulse');
        }
      }
    });
  }, [playingAudioUrl]);

  useEffect(() => {
    // Retroactively add draggable="true" to any existing audio markers
    const editor = document.getElementById('rich-text-editor');
    if (editor) {
      const markers = editor.querySelectorAll('.inline-audio-marker');
      markers.forEach(marker => {
        marker.setAttribute('draggable', 'true');
        marker.classList.remove('select-none');
      });
    }
  }, [isInitialLoadDone]);

  useEffect(() => {
    return () => {
      if (playingAudioRef.current) {
        playingAudioRef.current.pause();
      }
    };
  }, []);
  
  /**
   * Insert an HTML string at an exact Range position using the DOM Range API.
   * This avoids the block-splitting bug of `execCommand('insertHTML')` when the
   * cursor sits at the very end of a block-level element (p / div).
   */
  const insertNodeAtCursor = (html: string, range: Range) => {
    // Parse the HTML string into real DOM nodes via a temporary container
    const temp = document.createElement('span');
    temp.innerHTML = html;
    const frag = document.createDocumentFragment();
    let lastNode: Node | null = null;
    while (temp.firstChild) {
      lastNode = frag.appendChild(temp.firstChild);
    }
    // Collapse to the insert point (don't delete any selection)
    range.collapse(true);
    // Insert via Range — no block splitting, no unwanted line breaks
    range.insertNode(frag);
    // Move caret to right after the inserted content
    if (lastNode) {
      const newRange = document.createRange();
      newRange.setStartAfter(lastNode);
      newRange.collapse(true);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
    }
  };

  const handleInsertAudioClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const selection = window.getSelection();
    const editor = document.getElementById('rich-text-editor');
    
    if (!selection || selection.rangeCount === 0 || !selection.anchorNode || !editor?.contains(selection.anchorNode)) {
      toast.error('Vui lòng click đặt con trỏ vào vị trí muốn chèn audio trong bài đọc');
      return;
    }
    
    setSavedAudioRange(selection.getRangeAt(0));
    audioInputRef.current?.click();
  };

  const handleInsertAudioFromLibrary = (url: string) => {
    const editor = document.getElementById('rich-text-editor');
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0 || !selection.anchorNode || !editor.contains(selection.anchorNode)) {
      toast.error('Vui lòng click đặt con trỏ vào vị trí muốn chèn audio trong bài đọc');
      return;
    }

    const range = selection.getRangeAt(0);
    const escapeAttr = (str: string) => str ? str.replace(/"/g, '&quot;').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
    const html = `<span class="inline-audio-marker text-primary bg-primary/10 rounded-full w-7 h-7 mx-1 cursor-pointer inline-flex items-center justify-center hover:bg-primary/20 transition-colors shadow-sm ring-1 ring-primary/20 align-middle" data-audio-url="${escapeAttr(url)}" contenteditable="false" draggable="true" title="Nghe Audio"><span class="material-symbols-outlined text-[16px]">volume_up</span></span>&nbsp;`;

    insertNodeAtCursor(html, range);
    toast.success('Đã chèn audio vào bài');
  };


  const processAudioFile = async (file: File, targetRange: Range | null = null) => {
    const toastId = toast.loading('Đang tải lên âm thanh...');
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const result = await uploadMedia(formData);
      if (result.success && result.url) {
        const escapeAttr = (str: string) => str ? str.replace(/"/g, '&quot;').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
        const html = `<span class="inline-audio-marker text-primary bg-primary/10 rounded-full w-7 h-7 mx-1 cursor-pointer inline-flex items-center justify-center hover:bg-primary/20 transition-colors shadow-sm ring-1 ring-primary/20 align-middle" data-audio-url="${escapeAttr(result.url)}" contenteditable="false" draggable="true" title="Nghe Audio"><span class="material-symbols-outlined text-[16px]">volume_up</span></span>&nbsp;`;
        
        const activeRange = targetRange || savedAudioRange;
        if (activeRange) {
          insertNodeAtCursor(html, activeRange);
        }
        toast.success('Chèn Audio thành công', { id: toastId });
      } else {
        toast.error('Lỗi tải lên audio: ' + (result.error || 'Unknown error'), { id: toastId });
      }
    } catch (err: any) {
      toast.error('Lỗi hệ thống tải audio: ' + (err.message || String(err)), { id: toastId });
    }
  };

  const handleInlineAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Audio dung lượng quá lớn (tối đa 20MB)');
        return;
      }
      await processAudioFile(file);
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  };

  const handleEditorDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    setDragOverPos({ show: true, x: e.clientX, y: e.clientY });
  };

  const handleEditorDragLeave = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    setDragOverPos({ show: false, x: 0, y: 0 });
  };

  const handleEditorDrop = async (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    setDragOverPos({ show: false, x: 0, y: 0 });
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('audio/')) {
      toast.error('Chỉ hỗ trợ file âm thanh (audio)');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Dung lượng file tối đa 2MB');
      return;
    }

    let range: Range | null = null;
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(e.clientX, e.clientY);
    } else if ((document as any).caretPositionFromPoint) {
      const pos = (document as any).caretPositionFromPoint(e.clientX, e.clientY);
      if (pos) {
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
      }
    }

    await processAudioFile(file, range);
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
        meaningTh: '',
        meaningId: '',
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
    const escapeAttr = (str: string) => str ? str.replace(/"/g, '&quot;').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
    
    const html = `<span 
        class="relative inline-block custom-vocab-marker group/marker" 
        data-vocab-id="${vocabId}" 
        data-word="${escapeAttr(vocabForm.word)}" 
        data-pronunciation="${escapeAttr(vocabForm.pronunciation || '')}" 
        data-meaning-vi="${escapeAttr(vocabForm.meaningVi || '')}" 
        data-meaning-th="${escapeAttr(vocabForm.meaningTh || '')}" 
        data-meaning-id="${escapeAttr(vocabForm.meaningId || '')}" 
        data-explanation-en="${escapeAttr(vocabForm.explanationEn || '')}" 
        data-examples="${escapeAttr(vocabForm.examples || '')}" 
        data-image="${escapeAttr(vocabForm.image || '')}"
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
    refreshVocabList();
  };

  const handleAiFill = async () => {
    if (!vocabForm) return;
    setIsAiLoading(true);
    const word = vocabForm.word.trim().replace(/[.,!?;:]/g, '');
    const cleanLookup = word.toLowerCase();

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
            meaningTh: result.meaningTh || '',
            meaningId: result.meaningId || '',
            explanationEn: result.explanationEn || '',
            examples: Array.isArray(result.examples) ? result.examples.join('\n') : (result.examples || '')
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
        return { ...prev, pronunciation: p || '...', meaningVi: mVi || `(Nghĩa của từ "${prev.word}")`, meaningTh: '', meaningId: '', explanationEn: exEn || `Definition for '${prev.word}' not found.`, examples: exs || `Example of using ${prev.word} in context.`, image: `https://loremflickr.com/400/300/${encodeURIComponent(word)},professional` };
      });
    } catch (innerError) {
      setVocabForm(prev => { if (!prev) return null; return { ...prev, pronunciation: `/.../`, meaningVi: `(Lỗi kết nối AI)`, meaningTh: '', meaningId: '', explanationEn: `Could not fetch data for "${prev.word}". Please fill in manually.`, examples: '', image: `https://loremflickr.com/400/300/abstract,academic` }; });
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
    });
  };



  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    const audioMarker = target.closest('.inline-audio-marker, .inline-audio-wrapper');
    if (audioMarker) {
      e.preventDefault();
      e.stopPropagation();
      const url = audioMarker.getAttribute('data-audio-url');
      if (url) {
        if (playingAudioRef.current) {
          playingAudioRef.current.pause();
          playingAudioRef.current.currentTime = 0;
        }
        
        if (playingAudioUrl === url) {
          setPlayingAudioUrl(null);
          return;
        }
        
        const audio = new Audio(url);
        playingAudioRef.current = audio;
        setPlayingAudioUrl(url);
        audio.play().catch(e => console.error("Audio playback failed", e));
        
        audio.onended = () => {
          setPlayingAudioUrl(null);
        };
      }
      return;
    }

    const vocabMarker = target.closest('.custom-vocab-marker') as HTMLElement;
    if (vocabMarker) {
      e.preventDefault();
      e.stopPropagation();
      setVocabForm({
        word: vocabMarker.getAttribute('data-word') || '',
        pronunciation: vocabMarker.getAttribute('data-pronunciation') || '',
        meaningVi: vocabMarker.getAttribute('data-meaning-vi') || '',
        meaningTh: vocabMarker.getAttribute('data-meaning-th') || '',
        meaningId: vocabMarker.getAttribute('data-meaning-id') || '',
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
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar pb-6">
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
          
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`w-full flex items-center gap-3 px-4 py-3 font-label text-xs font-semibold rounded-xl transition-all ${
              isSettingsOpen 
                ? 'text-blue-700 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm border-l-4 border-blue-700' 
                : 'text-slate-500 hover:text-blue-600 hover:bg-[#f0f2f4] dark:hover:bg-gray-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">settings</span> Thiết lập học liệu
          </button>
          {/* Multimedia Attachments */}
          <div className="mt-8 space-y-6">
            <div className="flex flex-col gap-3">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Multimedia Attachments</h3>
               {/* Video Upload */}
               <div className="px-2">
                  <div className="flex flex-col gap-2">
                    {/* Tab switcher */}
                    <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700 text-[10px] font-black uppercase tracking-widest">
                      <button
                        onClick={() => setVideoTab('upload')}
                        className={`flex-1 py-1.5 transition-colors ${
                          videoTab === 'upload' ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 text-slate-400 hover:text-primary'
                        }`}
                      >
                        📂 Từ máy tính
                      </button>
                      <button
                        onClick={() => setVideoTab('youtube')}
                        className={`flex-1 py-1.5 transition-colors ${
                          videoTab === 'youtube' ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 text-slate-400 hover:text-primary'
                        }`}
                      >
                        🎥 YouTube
                      </button>
                    </div>

                    {/* Thumbnail preview */}
                    {videoThumbnail && (
                      <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
                        <img src={videoThumbnail} alt="Video thumbnail" className="w-full h-full object-cover" />
                        <button
                          onClick={() => { setVideoUrl(''); setVideoThumbnail(''); setYoutubeLinkInput(''); }}
                          className="absolute top-1.5 right-1.5 size-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    )}

                    {/* Tab content - always in DOM, hidden via CSS to avoid controlled/uncontrolled warning */}
                    <div className={videoTab !== 'upload' ? 'hidden' : ''}>
                      <div className="group relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-primary/50 transition-all cursor-pointer overflow-hidden min-h-[80px]">
                        {videoUploadProgress !== null ? (
                          <div className="w-full flex flex-col items-center px-2">
                            <div className="w-full bg-slate-100 dark:bg-gray-700 rounded-full h-2.5 mb-3 overflow-hidden shadow-inner">
                              <div className="bg-primary h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${videoUploadProgress}%` }} />
                            </div>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest text-center animate-pulse">Đang tải... {videoUploadProgress}%</span>
                          </div>
                        ) : videoUrl && !extractYouTubeId(videoUrl) ? (
                          <>
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 truncate w-full text-center tracking-wide">Video đã tải lên ✓</span>
                            <label className="mt-2 text-[9px] text-slate-400 cursor-pointer hover:text-primary underline">
                              Thay thế video khác
                              <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                            </label>
                          </>
                        ) : (
                          <>
                            <input type="file" accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleVideoUpload} />
                            <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-[28px]">video_call</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 group-hover:text-primary transition-colors">Tải lên Video</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className={videoTab !== 'youtube' ? 'hidden' : 'flex flex-col gap-2'}>
                      <input
                        type="url"
                        value={youtubeLinkInput ?? ''}
                        onChange={(e) => handleYouTubeLink(e.target.value)}
                        placeholder="Dán link YouTube..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-slate-300"
                      />
                      {youtubeLinkInput && !extractYouTubeId(youtubeLinkInput) && (
                        <p className="text-[10px] text-red-400 font-bold px-1">⚠️ Link không hợp lệ</p>
                      )}
                      {youtubeLinkInput && extractYouTubeId(youtubeLinkInput) && (
                        <p className="text-[10px] text-emerald-500 font-bold px-1">✔️ Đã xác nhận video YouTube</p>
                      )}
                    </div>

                  </div>
               </div>

               {/* Audio Upload Section */}
               <div className="px-2 mb-6 grid grid-cols-2 gap-3">
                 
                 {/* Audio Toàn Bài Học */}
                 <div className="w-full flex flex-col gap-2 relative">
                   <div 
                     onClick={handleGenerateGlobalAudio}
                     className="group relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-900/10 hover:border-emerald-400 transition-all cursor-pointer h-24 w-full"
                   >
                     {isGeneratingGlobalAudio ? (
                       <span className="material-symbols-outlined text-emerald-500 animate-spin text-[24px]">progress_activity</span>
                     ) : (
                       <span className="material-symbols-outlined text-emerald-400 group-hover:text-emerald-500 transition-colors text-[24px]">smart_toy</span>
                     )}
                     <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1.5 text-center group-hover:text-emerald-700 transition-colors">
                       Tạo Audio AI Toàn Bài
                     </span>
                     {audioUrl && (
                       <div className="absolute top-1 right-1 text-emerald-600 flex items-center gap-0.5 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                         <span className="material-symbols-outlined text-[12px]">check_circle</span>
                       </div>
                     )}
                   </div>
                   {audioUrl && (
                     <div className="flex justify-between items-center px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                       <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium truncate flex-1">{audioUrl.split('/').pop()}</span>
                       <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAudioUrl(''); }} className="text-red-500 hover:text-red-700 p-1 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-900/20 ml-1">
                         <span className="material-symbols-outlined text-[14px]">delete</span>
                       </button>
                     </div>
                   )}
                 </div>

                 {/* Audio Upload / AI Generator (Paragraphs) */}
                 <div className="w-full flex flex-col gap-2 relative">
                  <div className="group relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-primary/50 dark:hover:border-primary/30 transition-all cursor-pointer h-24 w-full">
                    <input type="file" multiple accept="audio/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleAudioUpload} />
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-[24px]">mic_none</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 text-center group-hover:text-primary transition-colors">Tải lên File Âm thanh</span>
                  </div>
                 </div>
               </div>

               {/* Audio Attachments List (Full width) */}
               <div className="px-2 mb-6">
                 {mediaAttachments.length > 0 && (
                   <div className="flex flex-col gap-1 mt-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                      {mediaAttachments.map(attachment => (
                        <div key={attachment.id} className="flex items-center gap-1.5 px-1 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 group transition-colors relative">
                          <span className={`material-symbols-outlined text-[16px] shrink-0 ${attachment.status === 'success' ? 'text-emerald-500' : attachment.status === 'error' ? 'text-red-400' : 'text-blue-400 animate-pulse'}`}>
                            {attachment.status === 'success' ? 'music_note' : attachment.status === 'error' ? 'error' : attachment.status === 'processing_ai' ? 'smart_toy' : 'cloud_upload'}
                          </span>
                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate flex-1" title={attachment.name}>{attachment.name}</span>
                          {attachment.status === 'success' && (
                            <>
                              <button
                                title="Chèn vào bài học"
                                onClick={() => handleInsertAudioFromLibrary(attachment.url!)}
                                className="size-5 flex items-center justify-center rounded-md text-primary hover:bg-primary/10 transition-all shrink-0"
                              >
                                <span className="material-symbols-outlined text-[15px]">arrow_insert</span>
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await fetch(`/api/media-attachments?id=${attachment.id}`, { method: 'DELETE' });
                                    setMediaAttachments(prev => prev.filter(a => a.id !== attachment.id));
                                    toast.success('Đã xóa âm thanh');
                                  } catch (err) {
                                    toast.error('Lỗi khi xóa');
                                  }
                                }}
                                className="size-4 flex items-center justify-center text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                              >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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
              <div className={`ml-0 px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border ${
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
                {!isInitialLoadDone && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-50 flex flex-col items-center justify-center rounded-2xl backdrop-blur-[2px]">
                     <span className="material-symbols-outlined text-[48px] text-primary/30 animate-spin mb-4">progress_activity</span>
                     <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">Đang tải bài học...</div>
                  </div>
                )}
                
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
                    <div className="flex items-center gap-2">
                      <span onMouseDown={handleOpenVocabForm} className="flex items-center gap-1.5 text-[12px] font-bold text-primary uppercase tracking-widest cursor-pointer hover:bg-primary/20 px-3 py-1.5 bg-primary/10 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-[16px]">translate</span> Tạo Từ Vựng
                      </span>
                      <span onMouseDown={handleCreateInlineAudio} className="flex items-center gap-1.5 text-[12px] font-bold text-blue-600 uppercase tracking-widest cursor-pointer hover:bg-blue-100 px-3 py-1.5 bg-blue-50 rounded-lg transition-colors">
                        {isGeneratingInlineAudio ? (
                          <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">volume_up</span>
                        )}
                        Tạo Audio
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
                    <span onMouseDown={(e) => { e.preventDefault(); selectedImage.remove(); setSelectedImage(null); }} className="material-symbols-outlined text-[18px] text-red-500 cursor-pointer hover:text-red-700 transition-colors" title="Xóa ảnh">delete</span>
                  </div>
                )}

                {dragOverPos.show && (
                  <div 
                    className="fixed pointer-events-none z-[9999] flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 opacity-80 mix-blend-multiply dark:mix-blend-screen"
                    style={{ left: dragOverPos.x, top: dragOverPos.y }}
                  >
                    <span className="material-symbols-outlined text-primary text-[24px]">volume_up</span>
                    <div className="h-6 w-0.5 bg-primary animate-pulse mt-1"></div>
                  </div>
                )}
                <article id="rich-text-editor" onClick={handleEditorClick} onDragOver={handleEditorDragOver} onDragLeave={handleEditorDragLeave} onDrop={handleEditorDrop} className="prose prose-slate dark:prose-invert max-w-none outline-none focus:outline-none min-h-[500px] mt-12" contentEditable suppressContentEditableWarning>
                </article>
                <input type="file" accept="audio/*" ref={audioInputRef} onChange={handleInlineAudioUpload} className="hidden" />
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
                  <div className="w-32 shrink-0 flex flex-col gap-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ảnh minh họa</label>
                    <div className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 dark:border-gray-700 overflow-hidden relative group cursor-pointer shrink-0" onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = async (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) { setIsUploadingVocabImage(true); const formData = new FormData(); formData.append('file', file); try { const result = await uploadMedia(formData); if (result.success && result.url) { setVocabForm(prev => prev ? {...prev, image: result.url} : null); toast.success('Lưu ảnh thành công'); } else { toast.error('Lỗi lưu ảnh', { description: result.error }); } } catch (err: any) { toast.error('Lỗi hệ thống khi lưu ảnh', { description: err.message || String(err) }); } finally { setIsUploadingVocabImage(false); } } }; input.click(); }}>
                      {isUploadingVocabImage ? <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 bg-slate-50 dark:bg-gray-800"><span className="animate-spin material-symbols-outlined text-[24px]">progress_activity</span><span className="text-[9px] font-bold uppercase tracking-widest text-center">Đang lưu<br/>vào DB...</span></div> : vocabForm.image ? <img src={vocabForm.image} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center justify-center h-full text-slate-400"><span className="material-symbols-outlined text-[24px]">image</span><span className="text-[9px] font-bold mt-1 uppercase">Upload</span></div>}
                    </div>
                    <div className="flex gap-2 w-full mt-1">
                      <button type="button" onClick={() => handleGoogleImageSearch(vocabForm.word)} className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-slate-300 py-2 rounded-lg flex items-center justify-center transition-colors" title="Tìm ảnh Internet">
                        <span className="material-symbols-outlined text-[18px]">travel_explore</span>
                      </button>
                      <button type="button" onClick={() => setShowAIPromptModal(true)} className="flex-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 py-2 rounded-lg flex items-center justify-center transition-colors" title="Tạo prompt AI">
                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nghĩa Tiếng Việt</label>
                  <input type="text" value={vocabForm.meaningVi} onChange={e => setVocabForm({...vocabForm, meaningVi: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none" required />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nghĩa Tiếng Thái</label>
                  <input type="text" value={vocabForm.meaningTh || ''} onChange={e => setVocabForm({...vocabForm, meaningTh: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nghĩa Tiếng Indo</label>
                  <input type="text" value={vocabForm.meaningId || ''} onChange={e => setVocabForm({...vocabForm, meaningId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none" />
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

        {/* Image Search Drawer */}
        {showImageSearchDrawer && (
          <div className="fixed top-0 right-0 h-full w-[350px] bg-white dark:bg-gray-900 border-l border-slate-200 dark:border-gray-800 p-6 shadow-2xl flex flex-col z-[150] animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">travel_explore</span>
                  Tìm ảnh Internet
                </h4>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-3">
                  Từ khoá: <span className="text-primary">{vocabForm?.word}</span>
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-100 dark:bg-gray-800 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setImageSearchStyle("REALISTIC")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${imageSearchStyle === "REALISTIC" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"}`}
                      >
                        📷 Ảnh thực tế
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageSearchStyle("CARTOON")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${imageSearchStyle === "CARTOON" ? "bg-purple-600 text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"}`}
                      >
                        🎨 Ảnh hoạt hình
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={isSearchingImage}
                      onClick={() => handleGoogleImageSearch(vocabForm?.word || '', imageSearchStyle)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 active:scale-95 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 border border-slate-200 dark:border-gray-700 h-full"
                    >
                      <span className="material-symbols-outlined text-[14px]">search</span>
                      Tìm
                    </button>
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setShowImageSearchDrawer(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors ml-2 shrink-0">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
              {isSearchingImage ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                  <span className="animate-spin material-symbols-outlined text-[40px] text-primary">progress_activity</span>
                  <span className="text-xs font-bold uppercase tracking-widest">Đang tìm kiếm...</span>
                </div>
              ) : imageSearchResults.length > 0 ? (
                <div className="pb-8 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    {imageSearchResults.slice(0, visibleImagesCount).map((img) => (
                      <div key={img.id} className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer border border-slate-200 dark:border-gray-700 hover:border-primary hover:shadow-lg transition-all" onClick={async () => {
                        if (vocabForm) {
                          setIsUploadingVocabImage(true);
                          setShowImageSearchDrawer(false);
                          try {
                            const result = await uploadUrlMedia(img.url);
                            if (result.success && result.url) {
                              setVocabForm(prev => prev ? {...prev, image: result.url} : null);
                              toast.success('Lưu ảnh thành công');
                            } else {
                              toast.error('Lỗi lưu ảnh', { description: result.error });
                            }
                          } catch (err: any) {
                             toast.error('Lỗi hệ thống khi lưu ảnh', { description: err.message || String(err) });
                          } finally {
                             setIsUploadingVocabImage(false);
                          }
                        }
                      }}>
                        <img src={img.thumb} alt="Search result" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                          <span className="text-[9px] text-white/80 font-medium truncate">by {img.author}</span>
                        </div>
                        <div className="absolute top-2 right-2 size-6 bg-primary text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {visibleImagesCount < imageSearchResults.length && (
                    <button
                      type="button"
                      onClick={() => setVisibleImagesCount(prev => prev + 12)}
                      className="w-full py-3 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 active:scale-95 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm border border-slate-200 dark:border-gray-700"
                    >
                      🔄 Tải thêm ảnh
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center text-slate-400 text-xs mt-10">Không tìm thấy ảnh nào phù hợp.</div>
              )}
            </div>
          </div>
        )}

        {/* AI Prompt Modal */}
        {showAIPromptModal && vocabForm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 font-headline">
                  <span className="material-symbols-outlined text-purple-500">auto_awesome</span>
                  Tạo ảnh bằng AI
                </h4>
                <button type="button" onClick={() => setShowAIPromptModal(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-600 transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed font-medium">
                Hãy copy đoạn lệnh (prompt) dưới đây và dán vào các công cụ AI tạo ảnh (như Gemini, ChatGPT, Midjourney) để lấy ảnh minh hoạ ưng ý nhất.
              </p>
              
              <div className="bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl p-5 border border-purple-100 dark:border-purple-900/30 relative group">
                <p className="text-[15px] font-mono text-slate-700 dark:text-slate-300 break-words leading-relaxed select-all">
                  Create a high-quality, flat vector educational illustration of the word "{vocabForm.word}" which means "{vocabForm.meaningVi}". The style should be clear, vibrant, cartoonish, with a clean white background. IMPORTANT: no text in image.
                </p>
                <button 
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`Create a high-quality, flat vector educational illustration of the word "${vocabForm.word}" which means "${vocabForm.meaningVi}". The style should be clear, vibrant, cartoonish, with a clean white background. IMPORTANT: no text in image.`);
                    toast.success("Đã copy Prompt!");
                  }}
                  className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100"
                  title="Copy Prompt"
                >
                  <span className="material-symbols-outlined text-[18px]">content_copy</span>
                </button>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button type="button" onClick={() => setShowAIPromptModal(false)} className="px-8 py-3 bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-lg shadow-slate-900/20">
                  Đóng
                </button>
              </div>
            </div>
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

        {/* Settings Drawer */}
        {isSettingsOpen && (
          <>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in" onClick={() => setIsSettingsOpen(false)}></div>
            <div className="absolute top-0 left-0 bottom-0 w-[750px] max-w-[calc(100vw-256px)] bg-white dark:bg-gray-900 z-50 border-r border-slate-200 dark:border-gray-800 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
               {/* Drawer Header */}
               <div className="p-6 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">settings</span>
                     </div>
                     <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white font-headline">Thiết lập học liệu</h2>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Hiển thị công khai</p>
                     </div>
                  </div>
                  <button onClick={() => { setIsSettingsOpen(false); }} className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 flex items-center justify-center transition-all group">
                     <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:rotate-90 transition-transform">close</span>
                  </button>
               </div>

               {/* Drawer Content */}
               <div className="p-6 overflow-y-auto custom-scrollbar flex-1 pb-24">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <ThumbnailUploader 
                        value={thumbnail}
                        onChange={handleThumbnailChange}
                        isUploading={isUploadingThumbnail}
                        label="Ảnh đại diện (16:9)"
                      />

                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
                          Giọng đọc AI (TTS Voice)
                        </label>
                        <select
                          value={ttsVoice}
                          onChange={(e) => setTtsVoice(e.target.value)}
                          className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-bold text-sm text-slate-700 dark:text-slate-200 appearance-none"
                        >
                          <option value="Aoede">Aoede (Nữ tự nhiên - Mặc định)</option>
                          <option value="Puck">Puck (Nam trầm)</option>
                          <option value="Kore">Kore (Nữ trẻ trung)</option>
                          <option value="Charon">Charon (Nam truyền cảm)</option>
                          <option value="Fenrir">Fenrir (Nam ấm áp)</option>
                        </select>
                        <p className="text-[10px] text-slate-400 px-1 italic">
                          * Cấu hình này áp dụng khi bạn bôi đen tạo Audio tự động.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">speed</span>
                          Tốc độ đọc AI (TTS Speed)
                        </label>
                        <select
                          value={ttsSpeed}
                          onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
                          className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-bold text-sm text-slate-700 dark:text-slate-200 appearance-none"
                        >
                          <option value="0.8">0.8x (Chậm)</option>
                          <option value="0.9">0.9x (Hơi chậm)</option>
                          <option value="1.0">1.0x (Bình thường - Mặc định)</option>
                          <option value="1.1">1.1x (Hơi nhanh)</option>
                          <option value="1.2">1.2x (Nhanh)</option>
                        </select>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Danh mục (Categories)</label>
                         <CategorySelect selectedIds={categoryIds} onChange={setCategoryIds} />
                      </div>

                      <div className="space-y-3">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Đối tượng (Target Audiences)</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: 'kids', label: '🧸 Trẻ em' },
                            { id: 'teens', label: '🎒 Thiếu niên' },
                            { id: 'adults', label: '🎓 Người lớn' },
                            { id: 'business', label: '💼 Doanh nhân' }
                          ].map(type => (
                            <button
                              key={type.id}
                              onClick={() => {
                                if (targetAudiences.includes(type.id)) {
                                  setTargetAudiences(targetAudiences.filter(t => t !== type.id));
                                } else {
                                  setTargetAudiences([...targetAudiences, type.id]);
                                }
                              }}
                              className={`px-3 py-2 rounded-lg text-[11px] font-bold transition-all border ${
                                targetAudiences.includes(type.id) 
                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105' 
                                : 'bg-white dark:bg-gray-800 text-slate-500 border-slate-200 dark:border-gray-700 hover:border-primary/50'
                              }`}
                            >
                              {type.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 px-1 italic">
                          * Bỏ trống (không chọn) đồng nghĩa với việc hiển thị cho tất cả mọi người.
                        </p>
                      </div>

                      <div className="space-y-2">
                         <div className="flex justify-between items-center px-1">
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Mô tả ngắn</label>
                            <span className={`text-[10px] font-bold ${shortDescription.length > 180 ? 'text-red-500' : 'text-slate-400'}`}>{shortDescription.length}/200</span>
                         </div>
                         <textarea 
                            value={shortDescription}
                            onChange={(e) => setShortDescription(e.target.value.slice(0, 200))}
                            placeholder="Mô tả ngắn gọn giúp học sinh hiểu nội dung bài học..."
                            className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-medium text-sm min-h-[100px] resize-none"
                         />
                      </div>
                    </div>
                  </div>

                  {/* Tags (Full Width below grid) */}
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-gray-800 space-y-4">
                     <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Gắn thẻ (Tags)</label>
                     <div className="flex flex-wrap gap-2">
                        {popularTagsList.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (tags.includes(tag)) {
                                setTags(tags.filter(t => t !== tag));
                              } else {
                                setTags([...tags, tag]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                              tags.includes(tag) 
                              ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105' 
                              : 'bg-white dark:bg-gray-800 text-slate-500 border-slate-200 dark:border-gray-700 hover:border-primary/50'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                     </div>

                     <TagAutocompleteInput 
                        onAddTag={(tagName) => {
                           if (!tags.includes(tagName)) {
                              setTags([...tags, tagName]);
                           }
                        }}
                        placeholder="Nhập thẻ tự chọn và nhấn Enter..."
                     />
                     
                     <div className="mt-2">
                        {tags.length > 0 ? (
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Danh sách thẻ đã chọn (Kéo thả để sắp xếp)</label>
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleTagDragEnd}
                            >
                              <SortableContext
                                items={tags}
                                strategy={rectSortingStrategy}
                              >
                                <div className="flex flex-wrap gap-2 p-1">
                                  {tags.map(t => (
                                    <SortableTagItem
                                      key={t}
                                      tag={t}
                                      onRemove={() => setTags(tags.filter(tag => tag !== t))}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic px-1">Chưa có thẻ nào được gắn.</p>
                        )}
                     </div>
                  </div>
               </div>

               {/* Drawer Footer */}
               <div className="p-6 bg-slate-50 dark:bg-gray-800/50 border-t border-slate-100 dark:border-gray-800 shrink-0 mt-auto">
                  <button 
                    onClick={() => { setIsSettingsOpen(false); handleSave(); }}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20"
                  >
                     Xác nhận & Lưu thiết lập
                  </button>
               </div>
            </div>
          </>
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
          
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-label">Giải thích đáp án (Tuỳ chọn)</label>
            <textarea 
              value={formData.explanation || ''}
              onChange={e => setFormData({...formData, explanation: e.target.value})}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-primary outline-none font-medium min-h-[120px] resize-none"
              placeholder="Nhập giải thích chi tiết tại sao chọn đáp án đúng và tại sao các đáp án khác sai..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-gray-800">
             <button type="button" onClick={onClose} className="px-8 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Hủy</button>
             <button type="submit" className="px-10 py-3 bg-primary text-white rounded-2xl font-bold editorial-shadow hover:scale-105 active:scale-95 transition-all">Lưu câu hỏi</button>
          </div>
        </form>
      </div>
    </div>
  );
}
