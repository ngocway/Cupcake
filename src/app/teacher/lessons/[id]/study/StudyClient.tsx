"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  BookOpen, 
  Laptop, 
  MessageCircleQuestion, 
  Play, 
  BookMarked,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function StudyClient({ assignment }: { assignment: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'reading' | 'vocabulary' | 'challenge'>('reading');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  // Track selected option indices per question (key: question index)
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number[]>>({});
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
  // Result message after checking answer
  const [answerResult, setAnswerResult] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const enterFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if ((el as any).webkitRequestFullscreen) await (el as any).webkitRequestFullscreen();
      setIsFullscreen(true);
    } catch {}
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if ((document as any).webkitFullscreenElement) await (document as any).webkitExitFullscreen();
    } catch {}
    setIsFullscreen(false);
  }, []);

  // Sync state when user presses Escape
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement || !!(document as any).webkitFullscreenElement);
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, []);

  // Enter fullscreen automatically on mount
  useEffect(() => { enterFullscreen(); }, [enterFullscreen]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const marker = target.closest('.custom-vocab-marker') as HTMLElement;
    
    if (marker) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      const rect = marker.getBoundingClientRect();
      const popupHeight = 450;
      let side: 'top' | 'bottom' | 'left' | 'right' = 'top';
      
      if (rect.top < popupHeight) {
        side = 'bottom';
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

  const questions = assignment.questions || [];
  const cards = assignment.flashcardDeck?.cards || [];

  const handleBack = async () => {
    await exitFullscreen();
    router.push('/teacher/lessons');
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#f8fbfe] dark:bg-gray-950 flex flex-col relative">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Button>
          <div>
            <h1 className="font-bold text-slate-800 dark:text-white truncate max-w-[200px] lg:max-w-md">
              {assignment.title}
            </h1>
            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
              <Laptop className="w-3 h-3" /> Chế độ lớp học
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center bg-slate-100 dark:bg-gray-800 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('reading')}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === 'reading' 
                ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <BookOpen className="w-4 h-4" /> Bài đọc
          </button>
          {cards.length > 0 && (
            <button 
              onClick={() => setActiveTab('vocabulary')}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'vocabulary' 
                  ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Layers className="w-4 h-4" /> Từ vựng
            </button>
          )}
          {questions.length > 0 && (
            <button 
              onClick={() => setActiveTab('challenge')}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'challenge' 
                  ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <MessageCircleQuestion className="w-4 h-4" /> Câu hỏi
            </button>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Đang xem</p>
            <p className="text-sm font-bold text-slate-700 dark:text-gray-200">
              {activeTab === 'reading' ? 'Nội dung bài học' : activeTab === 'vocabulary' ? `Thẻ ${currentCardIdx + 1}/${cards.length}` : `Câu hỏi ${currentQuestionIdx + 1}/${questions.length}`}
            </p>
          </div>
          {/* Fullscreen toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={isFullscreen ? exitFullscreen : enterFullscreen}
            className="rounded-full border-slate-200 hover:bg-slate-100 hidden sm:flex"
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-slate-500" /> : <Maximize2 className="w-4 h-4 text-slate-500" />}
          </Button>
          <div className="size-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
            T
          </div>
        </div>
      </header>

      {/* Floating exit button when fullscreen */}
      {isFullscreen && (
        <div className="fixed top-4 right-4 z-[200] flex gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-slate-700 rounded-2xl shadow-lg border border-slate-200 font-bold text-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
          >
            <X className="w-4 h-4" /> Thoát lớp học
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col">
          
          {/* 1. READING MODE */}
          {activeTab === 'reading' && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white dark:bg-gray-900 rounded-[32px] p-8 md:p-12 shadow-xl shadow-indigo-100/20 border border-slate-100 dark:border-gray-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-bl-full -z-0"></div>
                
                {assignment.videoUrl && (
                  <div className="aspect-video w-full mb-10 rounded-2xl overflow-hidden bg-black shadow-2xl relative z-10 border-4 border-white dark:border-gray-800">
                     <iframe 
                        className="w-full h-full"
                        src={assignment.videoUrl.replace('watch?v=', 'embed/')} 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      ></iframe>
                  </div>
                )}

                <div className="relative z-10" onMouseMove={handleMouseMove}>
                   <div 
                    className="prose prose-lg dark:prose-invert max-w-none text-slate-700 dark:text-gray-300 leading-[1.8] text-xl"
                    dangerouslySetInnerHTML={{ __html: assignment.readingText || '<p class="text-slate-400 italic">Không có nội dung bài đọc.</p>' }}
                  />
                </div>
              </div>

              {cards.length > 0 && (
                <div className="flex justify-center">
                  <Button 
                    onClick={() => setActiveTab('vocabulary')}
                    className="rounded-full px-8 py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-600/20 flex items-center gap-3 transition-all hover:scale-105"
                  >
                    <Play className="w-5 h-5 fill-current" /> Học từ mới ngay
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 2. VOCABULARY MODE */}
          {activeTab === 'vocabulary' && cards.length > 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-12 animate-in zoom-in-95 duration-500">
              <div className="w-full max-w-2xl group perspective-1000">
                <div 
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={cn(
                    "relative w-full aspect-[4/3] transition-all duration-700 transform-style-3d cursor-pointer rounded-[40px] shadow-2xl border-4 border-white dark:border-gray-800 text-center",
                    isFlipped ? "rotate-y-180" : ""
                  )}
                >
                  {/* Front */}
                  <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 rounded-[40px]">
                    <p className="text-12px font-bold text-indigo-500 mb-6 tracking-widest uppercase opacity-60">Thuật ngữ / Từ vựng</p>
                    <h2 className="text-6xl md:text-7xl font-extrabold text-slate-800 dark:text-white mb-4">
                      {cards[currentCardIdx].frontText}
                    </h2>
                    <div className="mt-8 flex items-center gap-2 text-slate-400">
                      <Eye className="w-4 h-4" /> Chạm để xem nghĩa
                    </div>
                  </div>
                  
                  {/* Back */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-12 bg-indigo-600 text-white rounded-[40px]">
                    <p className="text-12px font-bold text-indigo-200 mb-6 tracking-widest uppercase opacity-80">Định nghĩa / Ý nghĩa</p>
                    <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                      {cards[currentCardIdx].backText}
                    </h2>
                    <div className="mt-8 flex items-center gap-2 text-indigo-200">
                      <BookMarked className="w-4 h-4" /> Tuyệt vời!
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="size-16 rounded-full border-2 border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-20"
                  disabled={currentCardIdx === 0}
                  onClick={() => {
                    setCurrentCardIdx(currentCardIdx - 1);
                    setIsFlipped(false);
                  }}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                
                <div className="px-8 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 font-bold text-slate-500">
                  <span className="text-indigo-600">{currentCardIdx + 1}</span> / {cards.length}
                </div>

                <Button 
                  variant="outline" 
                  size="icon"
                  className="size-16 rounded-full border-2 border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-20"
                  disabled={currentCardIdx === cards.length - 1}
                  onClick={() => {
                    setCurrentCardIdx(currentCardIdx + 1);
                    setIsFlipped(false);
                  }}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </div>
            </div>
          )}

          {/* 3. CHALLENGE MODE (QUESTIONS) */}
          {activeTab === 'challenge' && questions.length > 0 && (
            <div className="flex-1 flex flex-col gap-8 animate-in slide-in-from-right-8 duration-500">
               <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
                  
                  {/* Question Sidebar */}
                  <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-3xl p-6 border border-slate-100 dark:border-gray-800 shadow-sm flex flex-col gap-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                       <MessageCircleQuestion className="w-5 h-5 text-indigo-600" /> Danh sách câu hỏi
                    </h3>
                    <div className="grid grid-cols-4 lg:grid-cols-2 gap-3">
                      {questions.map((_: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentQuestionIdx(idx);
                            setShowAnswer(false);
                          }}
                          className={cn(
                            "h-12 rounded-xl font-bold transition-all border-2",
                            currentQuestionIdx === idx 
                              ? "bg-indigo-600 text-white border-indigo-600" 
                              : "bg-white dark:bg-gray-800 text-slate-400 border-slate-100 dark:border-gray-700 hover:border-indigo-200"
                          )}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main Question Display */}
                  <div className="lg:col-span-3 flex flex-col gap-4">
                     <div className="bg-white dark:bg-gray-900 rounded-[32px] p-10 md:p-14 shadow-xl border border-slate-100 dark:border-gray-800 flex-1 flex flex-col relative overflow-hidden min-h-[500px]">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-br-full"></div>
                        
                        <div className="relative z-10 flex flex-col flex-1">
                          <header className="flex items-center justify-between mb-8">
                             <div className="flex items-center gap-3">
                                <span className={cn(
                                  "px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider",
                                  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                                )}>
                                  {questions[currentQuestionIdx].type}
                                </span>
                                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                                   Câu hỏi {currentQuestionIdx + 1}
                                </span>
                             </div>
                             <div className="flex items-center gap-1 text-emerald-500 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full">
                                <CheckCircle2 className="w-4 h-4" /> {questions[currentQuestionIdx].points} Điểm
                             </div>
                          </header>

                          <div className="flex-1">
                            <h3 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white leading-tight mb-8">
                                {JSON.parse(questions[currentQuestionIdx].content).questionText || 
                                 JSON.parse(questions[currentQuestionIdx].content).statement ||
                                 'Câu hỏi không có mô tả trực tiếp.'}
                            </h3>

                            {/* Render Answer Option Preview for the class */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
                               {(JSON.parse(questions[currentQuestionIdx].content).options?.length > 0 
                                 ? JSON.parse(questions[currentQuestionIdx].content).options 
                                 : [{text: 'Đúng', isCorrect: questions[currentQuestionIdx].type === 'true_false' && JSON.parse(questions[currentQuestionIdx].content).correctAnswer === true}, 
                                    {text: 'Sai', isCorrect: questions[currentQuestionIdx].type === 'true_false' && JSON.parse(questions[currentQuestionIdx].content).correctAnswer === false}]
                               ).map((opt: any, i: number) => (
                                 <div 
                                  key={i}
                                  onClick={() => {
                                    if (showAnswer) return; // disable after checking
                                    const allowMultiple = JSON.parse(questions[currentQuestionIdx].content).allowMultipleAnswers;
                                    setSelectedOptions(prev => {
                                      const cur = prev[currentQuestionIdx] || [];
                                      if (!allowMultiple) return { ...prev, [currentQuestionIdx]: [i] };
                                      const exists = cur.includes(i);
                                      const newArr = exists ? cur.filter(idx => idx !== i) : [...cur, i];
                                      return { ...prev, [currentQuestionIdx]: newArr };
                                    });
                                  }}
                                  className={cn(
                                    "p-6 rounded-2xl border-2 transition-all flex items-center justify-between group cursor-pointer",
                                    // Highlight correct after checking
                                    showAnswer && opt.isCorrect 
                                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20" 
                                      // Highlight selected when not checked
                                      : (!showAnswer && (selectedOptions[currentQuestionIdx] || []).includes(i))
                                        ? "bg-indigo-100 border-indigo-500 text-indigo-800"
                                        : "bg-slate-50 dark:bg-gray-800 border-transparent text-slate-600 dark:text-gray-300"
                                  )}
                                 >
                                    <div className="flex items-center gap-4">
                                      <div className={cn(
                                        "size-8 rounded-lg flex items-center justify-center font-bold text-sm",
                                        // Correct answer styling after checking
                                        showAnswer && opt.isCorrect 
                                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                                          // Selected option styling before checking
                                          : (!showAnswer && (selectedOptions[currentQuestionIdx] || []).includes(i))
                                            ? "bg-indigo-500 text-white"
                                            : "bg-white dark:bg-gray-700 text-slate-400 shadow-sm"
                                      )}>
                                        {String.fromCharCode(65 + i)}
                                      </div>
                                      <span className="text-lg font-bold">
                                        {opt.text}
                                      </span>
                                    </div>
                                    {showAnswer && opt.isCorrect && (
                                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                    )}
                                 </div>
                               ))}
                            </div>
                            
                            {showAnswer && questions[currentQuestionIdx].explanation && (
                              <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-2xl animate-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold mb-2">
                                  <AlertCircle className="w-5 h-5" /> Giải thích đáp án
                                </div>
                                <p className="text-slate-600 dark:text-gray-300">
                                  {questions[currentQuestionIdx].explanation}
                                </p>
                              </div>
                            )}
                          </div>

                          <footer className="mt-12 flex items-center justify-between border-t border-slate-100 dark:border-gray-800 pt-8">
                             <Button 
                              variant="outline"
                              disabled={currentQuestionIdx === 0}
                              onClick={() => {
                                setCurrentQuestionIdx(currentQuestionIdx - 1);
                                setShowAnswer(false);
                                setAnswerResult(null);
                              }}
                              className="rounded-2xl px-6 py-6 font-bold border-2"
                             >
                               <ChevronLeft className="w-5 h-5 mr-2" /> Câu trước
                             </Button>

                             <Button 
                                onClick={() => {
                                  setShowAnswer(true);
                                  // Compute correctness
                                  const opts = JSON.parse(questions[currentQuestionIdx].content).options || [];
                                  const correctIndices = opts.map((o: any, idx: number) => o.isCorrect ? idx : -1).filter((i: number) => i !== -1);
                                  const selected = selectedOptions[currentQuestionIdx] || [];
                                  const isAllCorrect =
                                    correctIndices.length === selected.length &&
                                    correctIndices.every((idx: number) => selected.includes(idx));
                                  setAnswerResult(isAllCorrect ? 'Đúng' : 'Sai');
                                }}
                                disabled={showAnswer}
                                className={cn(
                                  "rounded-2xl px-10 py-6 font-bold text-lg shadow-lg transition-all",
                                  showAnswer ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20"
                                )}
                              >
                                {showAnswer ? 'Kết quả' : 'Kiểm tra đáp án'}
                              </Button>

                             <Button 
                              variant="outline"
                              disabled={currentQuestionIdx === questions.length - 1}
                              onClick={() => {
                                setCurrentQuestionIdx(currentQuestionIdx + 1);
                                setShowAnswer(false);
                                setAnswerResult(null);
                              }}
                              className="rounded-2xl px-6 py-6 font-bold border-2"
                             >
                               Câu tiếp theo <ChevronRight className="w-5 h-5 ml-2" />
                             </Button>
                          </footer>
                          {answerResult && (
                             <div className="mt-4 text-center text-xl font-bold">
                               {answerResult === 'Đúng' ? (
                                 <span className="text-emerald-600">✅ Đúng (+{questions[currentQuestionIdx].points} điểm)</span>
                               ) : (
                                 <span className="text-rose-600">❌ Sai</span>
                               )}
                             </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Vocabulary Hover Popup */}
      {hoveredVocab && hoveredVocab.rect && (
        <div 
          className="fixed z-[100] w-80 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 pointer-events-none"
          style={{
            top: hoveredVocab.side === 'top' 
              ? hoveredVocab.rect.top - 10 
              : hoveredVocab.rect.bottom + 10,
            left: hoveredVocab.rect.left + (hoveredVocab.rect.width / 2),
            transform: hoveredVocab.side === 'top' 
              ? 'translate(-50%, -100%)' 
              : 'translate(-50%, 0)'
          }}
        >
          {hoveredVocab.image && (
            <div className="h-40 w-full overflow-hidden">
              <img src={hoveredVocab.image} alt={hoveredVocab.word} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{hoveredVocab.word}</h4>
              <span className="text-sm font-mono text-slate-400">{hoveredVocab.pronunciation}</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nghĩa tiếng Việt</p>
                <p className="text-lg font-bold text-slate-700 dark:text-gray-200">{hoveredVocab.meaningVi}</p>
              </div>

              {hoveredVocab.explanationEn && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">English Definition</p>
                  <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed italic">{hoveredVocab.explanationEn}</p>
                </div>
              )}

              {hoveredVocab.examples && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ví dụ</p>
                  <div className="text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                    {hoveredVocab.examples}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs Mobile */}
      <div className="md:hidden sticky bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800 flex items-center justify-around z-20">
          <button 
            onClick={() => setActiveTab('reading')}
            className={cn("flex flex-col items-center gap-1", activeTab === 'reading' ? "text-indigo-600" : "text-slate-400")}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-bold">BÀI ĐỌC</span>
          </button>
          {cards.length > 0 && (
            <button 
              onClick={() => setActiveTab('vocabulary')}
              className={cn("flex flex-col items-center gap-1", activeTab === 'vocabulary' ? "text-indigo-600" : "text-slate-400")}
            >
              <Layers className="w-5 h-5" />
              <span className="text-[10px] font-bold">TỪ VỰNG</span>
            </button>
          )}
          {questions.length > 0 && (
            <button 
              onClick={() => setActiveTab('challenge')}
              className={cn("flex flex-col items-center gap-1", activeTab === 'challenge' ? "text-indigo-600" : "text-slate-400")}
            >
              <MessageCircleQuestion className="w-5 h-5" />
              <span className="text-[10px] font-bold">CÂU HỎI</span>
            </button>
          )}
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .custom-vocab-marker { 
          z-index: 1; 
          position: relative; 
        }
        .custom-vocab-marker:hover { 
          z-index: 50 !important; 
        }
      `}</style>
    </div>
  );
}
