"use client";

import React, { useState, useRef, useEffect, use } from 'react';
import { autoSaveMaterial } from '@/actions/material-actions';
import { generateVocabularyDetails } from '@/actions/ai-actions';
import { DUMMY_DICTIONARY } from '@/lib/dictionary-data';

export default function ReadingExerciseBuilderPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = use(searchParams);
  const assignmentId = params?.id || 'clp_reading_001';
  const [title, setTitle] = useState('Reading Exercise: Modern Ethics');
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
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

  const handleSave = async () => {
    if (!assignmentId) return;
    setSavingStatus('saving');
    try {
      const editor = document.getElementById('rich-text-editor');
      const contentHtml = editor?.innerHTML || '';
      
      await autoSaveMaterial({
        id: assignmentId,
        title: title,
        type: 'READING',
        questions: [], 
        readingText: contentHtml
      });
      
      setSavingStatus('saved');
      setLastSaved(new Date());
      setTimeout(() => setSavingStatus('idle'), 2000);
    } catch (error) {
      console.error('Save failed:', error);
      setSavingStatus('error');
    }
  };

  // Auto-save on title or content change (can add more triggers)
  useEffect(() => {
    const timer = setTimeout(() => handleSave(), 5000);
    return () => clearTimeout(timer);
  }, [title]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFormat = (command: string) => {
    document.execCommand(command, false, undefined);
  };

  const handleImageInsert = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // Create an image element with some basic styles. Default 50% width
        const imgHtml = `<img src="${event.target?.result}" alt="Inserted" draggable="true" style="max-width: 100%; width: 50%; display: inline-block; border-radius: 0.75rem; margin: 0.5rem; cursor: move; transition: all 0.2s;" class="custom-editable-image" />&nbsp;`;
        
        // Ensure the editor is focused before inserting
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
        // Ensure the selection is inside the editor
        if (editor && editor.contains(range.commonAncestorContainer) && wrapper) {
          const rect = range.getBoundingClientRect();
          const wrapperRect = wrapper.getBoundingClientRect();
          setTextToolbarPos({
            show: true,
            top: rect.top - wrapperRect.top - 65, // Move higher to avoid covering text
            left: rect.left - wrapperRect.left + (rect.width / 2)
          });
          return;
        }
      }
      
      // Hide if no valid selection. Timeout to allow clicks on toolbar to process gracefully
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
    const exampleHtml = vocabForm.examples.split('\n').filter(Boolean).map(ex => `
      <div class="bg-surface-container-low dark:bg-gray-900 p-3 rounded-lg border border-slate-100 dark:border-gray-700 mb-2">
        <p class="text-[11px] font-label font-bold text-slate-400 uppercase tracking-wider mb-1">Ví dụ</p>
        <p class="text-sm italic text-slate-700 dark:text-slate-400">"${ex}"</p>
      </div>
    `).join('');

    const html = `<span 
        class="relative inline-block group custom-vocab-marker" 
        data-vocab-id="${vocabId}" 
        data-word="${vocabForm.word}" 
        data-pronunciation="${vocabForm.pronunciation || ''}" 
        data-meaning-vi="${vocabForm.meaningVi || ''}" 
        data-explanation-en="${vocabForm.explanationEn || ''}" 
        data-examples="${vocabForm.examples || ''}" 
        data-image="${vocabForm.image || ''}"
        contenteditable="false"
      >
        <span class="bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-bold px-1.5 py-0.5 rounded-md cursor-help border-b-2 border-emerald-500 hover:bg-emerald-200/90 dark:hover:bg-emerald-900/60 transition-all duration-200">${vocabForm.word}</span>
        
        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-80 glass-panel bg-white/95 dark:bg-gray-800/95 rounded-2xl p-0 overflow-hidden z-50 shadow-2xl opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 pointer-events-none text-left font-body ring-1 ring-black/5 dark:ring-white/10">
          
          ${vocabForm.image ? `<div class="w-full h-36 overflow-hidden relative">
            <img src="${vocabForm.image}" class="w-full h-full object-cover" alt="${vocabForm.word}" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div class="absolute bottom-3 left-4 right-4">
               <p class="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-0.5">Vocabulary Word</p>
               <h3 class="text-xl font-black text-white leading-tight font-headline">${vocabForm.word}</h3>
            </div>
          </div>` : `
          <div class="px-5 pt-5 pb-3 bg-gradient-to-br from-indigo-50/50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-indigo-100/50 dark:border-gray-700">
             <p class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">Vocabulary Word</p>
             <h3 class="text-2xl font-black text-indigo-900 dark:text-indigo-200 font-headline leading-tight">${vocabForm.word}</h3>
          </div>`}
          
          <div class="p-5 space-y-5">
            ${vocabForm.pronunciation ? `
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-indigo-500 text-lg">volume_up</span>
              <span class="text-indigo-600 dark:text-indigo-400 font-mono text-base font-medium tracking-wide">/${vocabForm.pronunciation}/</span>
            </div>` : ''}

            <div class="space-y-4">
              <div>
                <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Nghĩa Tiếng Việt</p>
                <p class="text-[15px] font-bold text-slate-800 dark:text-slate-100">${vocabForm.meaningVi || 'Đang cập nhật...'}</p>
              </div>

              <div>
                <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">English Explanation</p>
                <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-label">${vocabForm.explanationEn || 'No explanation available.'}</p>
              </div>
            </div>

            ${exampleHtml ? `
            <div class="pt-4 border-t border-slate-100 dark:border-gray-700/50">
              <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Ví dụ minh họa</p>
              <div class="max-h-[140px] overflow-y-auto custom-scrollbar space-y-3">
                ${exampleHtml}
              </div>
            </div>` : ''}
          </div>
          
          <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-800 border-b border-r border-slate-200/50 dark:border-gray-700 shadow-sm rotate-45 z-[-1]"></div>
        </div>
      </span>&nbsp;`;

    if (vocabForm.isEdit) {
      const existingElement = document.querySelector(`[data-vocab-id="${vocabId}"]`);
      if (existingElement) {
        // Use a temporary div to parse the new HTML safely
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const newElement = tempDiv.firstElementChild;
        if (newElement) {
          existingElement.replaceWith(newElement);
          // Add back the nbsp if needed or handle spacing
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
    // After UI is updated, trigger a save to DB
    setTimeout(handleSave, 100);
  };

  const handleAiFill = async () => {
    if (!vocabForm) return;
    setIsAiLoading(true);
    
    // Clean up word for lookup
    const word = vocabForm.word.trim().replace(/[.,!?;:]/g, '');
    const cleanLookup = word.toLowerCase();
    
    // 1. Check local dictionary first (curated results)
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
      // 2. Fetch from Gemini Server Action
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
            // Using a search-based Unsplash URL for more relevant images. 
            // Fallback to LoremFlickr if Unsplash Source doesn't redirect.
            image: `https://source.unsplash.com/featured/400x300/?${encodeURIComponent(result.imageSearchKeywords || word)}` 
          };
        });
        setIsAiLoading(false);
        return; // Success! Exit early.
      } else {
        console.warn('Gemini AI check failed, falling back to free APIs:', result?.error);
      }
    } catch (error) {
      console.error('AI autofill error, falling back to free APIs:', error);
    }

    // 3. Fallback to Free APIs if Gemini fails (or key missing/error)
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
        return {
          ...prev,
          pronunciation: p || '...',
          meaningVi: mVi || `(Nghĩa của từ "${prev.word}")`,
          explanationEn: exEn || `Definition for '${prev.word}' not found.`,
          examples: exs || `Example of using ${prev.word} in context.`,
          image: `https://loremflickr.com/400/300/${encodeURIComponent(word)},professional`
        };
      });
    } catch (innerError) {
      // Last resort fallback
      setVocabForm(prev => {
        if (!prev) return null;
        return {
          ...prev,
          pronunciation: `/.../`,
          meaningVi: `(Lỗi kết nối AI)`,
          explanationEn: `Could not fetch data for "${prev.word}". Please fill in manually.`,
          examples: '',
          image: `https://loremflickr.com/400/300/abstract,academic`
        };
      });
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
        top: Math.max(0, imgRect.top - wrapperRect.top - 60), // 60px above image, minimum 0
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
    
    // Check if clicking a vocab marker
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
      // Remove border/shadow from all images
      document.querySelectorAll('#rich-text-editor img').forEach(i => {
        (i as HTMLElement).style.boxShadow = 'none';
      });
      // Add selection ring to the clicked image
      img.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.4)';
      
      updateImageToolbarPosition(img);
    } else {
      setSelectedImage(null);
      // Clean up all rings
      document.querySelectorAll('#rich-text-editor img').forEach(img => {
        (img as HTMLElement).style.boxShadow = 'none';
      });
    }
  };
  return (
    <div className="flex bg-surface font-body text-on-surface h-[calc(100vh-120px)] overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative">
      <style>{`
        .editorial-shadow { box-shadow: 0 8px 24px rgba(25, 27, 35, 0.06); }
        .glass-panel { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(67, 70, 85, 0.1); }
      `}</style>
      
      {/* Sidebar Navigation */}
      <aside className="bg-surface-container flex flex-col h-full w-64 border-r border-[#c3c6d7] dark:border-gray-800 z-20 shrink-0">
        <div className="px-6 py-8">
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
          {/* Active Tab */}
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-blue-700 border-l-4 border-blue-700 bg-blue-50/50 dark:bg-blue-900/20 font-label text-xs font-semibold transition-all duration-300 ease-out rounded-r-lg">
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
            Passage Editor
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-blue-600 font-label text-[13px] font-semibold transition-all duration-300 ease-out rounded-xl hover:bg-[#f0f2f4] dark:hover:bg-gray-800">
            <span className="material-symbols-outlined text-[18px]">quiz</span>
            Question Bank
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-blue-600 font-label text-[13px] font-semibold transition-all duration-300 ease-out rounded-xl hover:bg-[#f0f2f4] dark:hover:bg-gray-800">
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            Vocabulary
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-blue-600 font-label text-[13px] font-semibold transition-all duration-300 ease-out rounded-xl hover:bg-[#f0f2f4] dark:hover:bg-gray-800">
            <span className="material-symbols-outlined text-[18px]">volume_up</span>
            Audio
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-blue-600 font-label text-[13px] font-semibold transition-all duration-300 ease-out rounded-xl hover:bg-[#f0f2f4] dark:hover:bg-gray-800">
            <span className="material-symbols-outlined text-[18px]">movie</span>
            Video
          </a>
        </nav>
        
        <div className="p-6 mt-auto">
          <button className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-3 rounded-xl font-label text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 editorial-shadow transition-transform hover:scale-105 active:scale-95">
            <span className="material-symbols-outlined text-sm">add</span>
            New Question
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-surface relative overflow-hidden min-w-0">
        {/* Top App Bar */}
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
              {savingStatus === 'saving' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  <span className="text-[10px] font-label font-bold text-slate-400 uppercase tracking-widest">Đang lưu dữ liệu...</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span className="text-[10px] font-label font-bold text-slate-400 uppercase tracking-widest text-secondary-dark">
                    {lastSaved ? `Đã lưu lúc ${lastSaved.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Tự động lưu...'}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div 
              className="px-5 py-2 rounded-lg flex items-center border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
              onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
            >
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageInsert} />
              <span className="flex items-center gap-2 text-[13px] font-bold text-primary dark:text-primary-fixed uppercase tracking-wide">
                <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span> Chèn Ảnh
              </span>
            </div>
            <button 
              onClick={() => handleSave()}
              disabled={savingStatus === 'saving'}
              className={`px-8 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white rounded-lg font-label text-xs font-bold uppercase tracking-wider editorial-shadow transition-all ${savingStatus === 'saving' ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
            >
              {savingStatus === 'saving' ? 'Saving...' : 'Publish'}
            </button>
          </div>
        </header>

        {/* Canvas Area */}
        <div className="flex-1 overflow-y-auto w-full custom-scrollbar relative flex flex-col">
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 pb-12 px-6 lg:px-0 mt-8">
            <div id="editor-wrapper" className="bg-surface-container-lowest dark:bg-gray-900 rounded-2xl p-8 lg:p-14 min-h-[800px] editorial-shadow relative border border-gray-200/50 dark:border-gray-800">
              
              {/* Hint for Teachers */}
              <div className="absolute top-6 right-8 flex items-center gap-2 px-4 py-2 bg-secondary-container/20 border border-secondary/10 rounded-full pointer-events-none">
                <span className="material-symbols-outlined text-secondary text-[16px]">info</span>
                <span className="text-[10px] font-bold text-secondary-dark dark:text-secondary-fixed uppercase tracking-widest">Bôi đen để tạo từ vựng mới cho bài học</span>
              </div>
              
              {/* Text Selection Toolbar (Formatting & Vocab) */}
              {textToolbarPos.show && (
                <div 
                  className="absolute -translate-x-1/2 glass-panel bg-white/95 dark:bg-gray-800/95 px-2 py-1.5 rounded-xl transition-all duration-200 z-40 border border-primary/20 shadow-lg animate-in fade-in"
                  style={{ top: textToolbarPos.top + 'px', left: textToolbarPos.left + 'px' }}
                >
                  <div className="flex items-center">
                    <span onMouseDown={handleOpenVocabForm} className="flex items-center gap-1.5 text-[12px] font-bold text-primary uppercase tracking-widest cursor-pointer hover:bg-primary/20 px-3 py-1.5 bg-primary/10 rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[16px]">translate</span>
                      Tạo Từ Vựng
                    </span>
                  </div>
                </div>
              )}

              {/* Image Control Toolbar (Contextual) */}
              {selectedImage && (
                <div 
                  className="absolute -translate-x-1/2 glass-panel bg-white/95 dark:bg-gray-800/95 px-5 py-2 rounded-full flex items-center gap-5 shadow-lg z-30 border border-primary/20 animate-in fade-in transition-all duration-200"
                  style={{ top: imageControlPos.top + 'px', left: imageControlPos.left + 'px' }}
                >
                  <div className="flex items-center gap-2 border-r border-slate-200 dark:border-gray-700 pr-5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">Căn lề</span>
                    <span onMouseDown={(e) => { e.preventDefault(); handleImageModify(() => { selectedImage.style.display = 'inline-block'; selectedImage.style.float = 'left'; selectedImage.style.margin = '0 1.5rem 1.5rem 0'; selectedImage.scrollIntoView({ behavior: 'smooth', block: 'center' }); }); }} className="material-symbols-outlined text-[18px] text-slate-600 dark:text-slate-300 cursor-pointer hover:text-primary transition-colors">align_horizontal_left</span>
                    <span onMouseDown={(e) => { e.preventDefault(); handleImageModify(() => { selectedImage.style.display = 'block'; selectedImage.style.float = 'none'; selectedImage.style.margin = '1.5rem auto'; selectedImage.scrollIntoView({ behavior: 'smooth', block: 'center' }); }); }} className="material-symbols-outlined text-[18px] text-slate-600 dark:text-slate-300 cursor-pointer hover:text-primary transition-colors">align_horizontal_center</span>
                    <span onMouseDown={(e) => { e.preventDefault(); handleImageModify(() => { selectedImage.style.display = 'inline-block'; selectedImage.style.float = 'right'; selectedImage.style.margin = '0 0 1.5rem 1.5rem'; selectedImage.scrollIntoView({ behavior: 'smooth', block: 'center' }); }); }} className="material-symbols-outlined text-[18px] text-slate-600 dark:text-slate-300 cursor-pointer hover:text-primary transition-colors">align_horizontal_right</span>
                  </div>
                  <div className="flex items-center gap-2 border-r border-slate-200 dark:border-gray-700 pr-5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">Kích cỡ</span>
                    <span onMouseDown={(e) => { e.preventDefault(); handleImageModify(() => { selectedImage.style.width = '30%'; }); }} className="material-symbols-outlined text-[18px] text-slate-600 dark:text-slate-300 cursor-pointer hover:text-primary transition-colors" title="Nhỏ (30%)">photo_size_select_small</span>
                    <span onMouseDown={(e) => { e.preventDefault(); handleImageModify(() => { selectedImage.style.width = '50%'; }); }} className="material-symbols-outlined text-[18px] text-slate-600 dark:text-slate-300 cursor-pointer hover:text-primary transition-colors" title="Vừa (50%)">photo_size_select_large</span>
                    <span onMouseDown={(e) => { e.preventDefault(); handleImageModify(() => { selectedImage.style.width = '100%'; }); }} className="material-symbols-outlined text-[18px] text-slate-600 dark:text-slate-300 cursor-pointer hover:text-primary transition-colors" title="Lớn (100%)">photo_size_select_actual</span>
                  </div>
                  <span onMouseDown={(e) => { e.preventDefault(); selectedImage.remove(); setSelectedImage(null); }} className="material-symbols-outlined text-[18px] text-red-500 cursor-pointer hover:text-red-700 transition-colors" title="Xóa ảnh">delete</span>
                </div>
              )}

              {/* Content */}
              <article 
                id="rich-text-editor"
                onClick={handleEditorClick}
                onDragStart={(e) => {
                  if ((e.target as HTMLElement).tagName !== 'IMG') {
                    e.preventDefault();
                  }
                }}
                className="prose prose-slate dark:prose-invert max-w-none outline-none focus:outline-none min-h-[500px]"
                contentEditable
                suppressContentEditableWarning
              >
                <h3 className="font-headline font-bold text-3xl mb-8 leading-tight text-slate-900 dark:text-white">Navigating the Grey: Ethics in the Digital Age</h3>
                
                <div className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 font-body mb-6">
                  In the contemporary landscape of technological advancement, society faces a significant{' '}
                  <span className="relative inline-block group">
                    <span className="bg-secondary-fixed/40 dark:bg-secondary-fixed/20 text-on-secondary-container dark:text-secondary-fixed font-semibold px-2 py-0.5 rounded cursor-pointer border-b-2 border-secondary">
                      dilemma
                    </span>
                    {/* Floating Vocabulary Modal Mockup (shows on hover for demo) */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 glass-panel dark:bg-gray-800/95 rounded-xl p-5 z-30 editorial-shadow opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-800 border-t border-l border-slate-200 dark:border-slate-700 rotate-45 pointer-events-none"></div>
                      <div className="relative">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-headline font-bold text-primary text-sm flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">menu_book</span> Vocabulary</h4>
                        </div>
                        <div className="space-y-3.5">
                          <div>
                            <p className="text-lg font-bold text-slate-900 dark:text-white leading-none">dilemma</p>
                            <p className="text-sm text-primary font-mono mt-1">/dɪˈlɛmə/</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-body">A situation in which a difficult choice has to be made between two or more alternatives, especially undesirable ones.</p>
                          </div>
                          <div className="bg-surface-container-low dark:bg-gray-900 p-3 rounded-lg border border-slate-100 dark:border-gray-700">
                            <p className="text-[11px] font-label font-bold text-slate-400 uppercase tracking-wider mb-1">Example</p>
                            <p className="text-sm italic text-slate-700 dark:text-slate-400">"He was in a dilemma over whether to go or stay."</p>
                          </div>
                          <button className="w-full bg-primary/10 hover:bg-primary/20 text-primary py-2.5 rounded-lg font-label text-[13px] font-bold mt-2 flex items-center justify-center gap-2 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
                            Add to Lesson List
                          </button>
                        </div>
                      </div>
                    </div>
                  </span>
                  {' '}regarding data privacy and individual autonomy. As algorithms begin to influence our daily decisions, from the news we consume to the products we purchase, the line between helpful assistance and subtle manipulation becomes increasingly blurred.
                </div>

                {/* Media Block Mockup */}
                <img 
                  alt="Modern abstract digital visualization of data streams" 
                  draggable="true"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrPt-s2uCS0m0MNVFduqbvcC2sWGhN1z-PLfok7JMRixstjKnCHie3vPqgLITqNew3rKoBSXKAJoG7K6A5JeAoBn-1cDYw3xhn7r9byQOiExzgOWxFi1oRSYRLJcPSFXsdyU5R3sGH0W2D6fDfpdn6DXR3ubu_NYec1wsWpxWkkQ3qix851COumzl3BqMN1aRVSv_WP3zRibBUzjwPf8BIJCCFtTRYNt9muhNyGEVowTFfxrJwr8XSLKkRek4oxfHVA2xnhzRuFisv"
                  style={{ width: '100%', maxWidth: '100%', display: 'block', borderRadius: '0.75rem', margin: '1.5rem auto', cursor: 'move', transition: 'all 0.2s' }}
                  className="custom-editable-image shadow-sm"
                />

                <div className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 font-body">
                  Consider the ethical implications of artificial intelligence in healthcare. While diagnostic tools can now outperform seasoned physicians in specific tasks, the lack of "human touch" and transparency in decision-making processes raises fundamental questions about accountability. If an AI misdiagnoses a patient, who bears the responsibility?
                </div>
              </article>
            </div>

            {/* Simple Info Footer */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-8">
              <div className="bg-tertiary-fixed/40 dark:bg-tertiary-container/30 border border-tertiary/10 p-5 rounded-2xl flex flex-col justify-center gap-1">
                <span className="material-symbols-outlined text-tertiary mb-1">timer</span>
                <p className="text-[10px] font-bold text-on-tertiary-fixed-variant dark:text-tertiary-fixed-dim uppercase tracking-widest">Reading Time</p>
                <p className="text-2xl font-headline font-extrabold text-on-tertiary-fixed dark:text-tertiary-fixed">4-6 mins</p>
              </div>
              <div className="bg-primary-fixed/50 dark:bg-primary-container/20 border border-primary/10 p-5 rounded-2xl flex flex-col justify-center gap-1">
                <span className="material-symbols-outlined text-primary mb-1">bar_chart</span>
                <p className="text-[10px] font-bold text-on-primary-fixed-variant dark:text-primary-fixed-dim uppercase tracking-widest">Lexile Level</p>
                <p className="text-2xl font-headline font-extrabold text-primary-dark dark:text-primary-fixed">1100L</p>
              </div>
              <div className="bg-secondary-container/30 dark:bg-secondary-container/10 border border-secondary/10 p-5 rounded-2xl flex flex-col justify-center gap-1">
                <span className="material-symbols-outlined text-secondary mb-1">translate</span>
                <p className="text-[10px] font-bold text-on-secondary-fixed-variant dark:text-secondary-fixed-dim uppercase tracking-widest">Vocabulary</p>
                <p className="text-2xl font-headline font-extrabold text-on-secondary-fixed dark:text-secondary-fixed">12 Terms</p>
              </div>
              <div className="bg-surface-container-high dark:bg-gray-800 border border-slate-200 dark:border-gray-700 p-5 rounded-2xl flex flex-col justify-center gap-1">
                <span className="material-symbols-outlined text-slate-500 mb-1">quiz</span>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Questions</p>
                <p className="text-2xl font-headline font-extrabold text-slate-900 dark:text-white">1 Total</p>
              </div>
            </div>
            
          </div>
        </div>

        {/* Vocab Form Modal */}
        {vocabForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-[550px] max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold font-headline flex items-center gap-2 text-slate-900 dark:text-white">
                  <span className="material-symbols-outlined text-primary">{vocabForm.isEdit ? 'edit_note' : 'translate'}</span>
                  {vocabForm.isEdit ? 'Chỉnh Sửa Từ Vựng' : 'Thiết Lập Từ Vựng'}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAiFill}
                    disabled={isAiLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 editorial-shadow"
                  >
                    {isAiLoading ? (
                      <span className="animate-spin material-symbols-outlined text-[18px]">autorenew</span>
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    )}
                    {isAiLoading ? "AI Đang Nghĩ..." : "AI Tự Điền"}
                  </button>
                  {vocabForm.isEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        const existingElement = document.querySelector(`[data-vocab-id="${vocabForm.vocabId}"]`);
                        if (existingElement) {
                          const text = existingElement.querySelector('span')?.textContent || vocabForm.word;
                          existingElement.replaceWith(document.createTextNode(text));
                        }
                        setVocabForm(null);
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="Xóa từ vựng này"
                    >
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
                      <input 
                        type="text" 
                        value={vocabForm.word} 
                        onChange={e => setVocabForm({...vocabForm, word: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phiên âm</label>
                      <input 
                        type="text" 
                        value={vocabForm.pronunciation} 
                        onChange={e => setVocabForm({...vocabForm, pronunciation: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none font-mono"
                      />
                    </div>
                  </div>
                  <div className="w-32 h-32 shrink-0">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ảnh minh họa</label>
                    <div 
                      className="w-full h-full rounded-xl border-2 border-dashed border-slate-200 dark:border-gray-700 overflow-hidden relative group cursor-pointer"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setVocabForm({...vocabForm, image: ev.target?.result as string});
                            reader.readAsDataURL(file);
                          }
                        };
                        input.click();
                      }}
                    >
                      {vocabForm.image ? (
                        <>
                          <img src={vocabForm.image} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="material-symbols-outlined text-white">edit</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <span className="material-symbols-outlined text-[24px]">image</span>
                          <span className="text-[9px] font-bold mt-1 uppercase">Upload</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nghĩa Tiếng Việt</label>
                  <input 
                    type="text" 
                    value={vocabForm.meaningVi} 
                    onChange={e => setVocabForm({...vocabForm, meaningVi: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Giải nghĩa Tiếng Anh</label>
                  <textarea 
                    value={vocabForm.explanationEn} 
                    onChange={e => setVocabForm({...vocabForm, explanationEn: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none min-h-[80px]"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ví dụ (mỗi dòng một ví dụ)</label>
                  <textarea 
                    value={vocabForm.examples} 
                    onChange={e => setVocabForm({...vocabForm, examples: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none min-h-[80px]"
                  ></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-gray-800">
                  <button 
                    type="button" 
                    onClick={() => setVocabForm(null)}
                    className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-800 transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-blue-700 transition-colors editorial-shadow"
                  >
                    Lưu Từ Vựng
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
