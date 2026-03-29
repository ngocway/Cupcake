"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizRunnerStore } from '@/store/useQuizRunnerStore'
import { useAntiCheat } from '@/hooks/useAntiCheat'
import { Button } from '@/components/ui/button'
import { Clock, LayoutGrid, X, AlertTriangle } from 'lucide-react'
import { QuestionMap } from './QuestionMap'
import { QuestionMediaRenderer } from '@/components/quiz-runner/QuestionMediaRenderer'

export default function QuizClientRunner({ submission, assignment, questions, initialAnswers }: any) {
  const router = useRouter()
  const initDraft = useQuizRunnerStore(s => s.initDraft)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [showMap, setShowMap] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  
  const handleForceSubmit = async () => {
    await submitQuiz(true)
  }
  const { warningVisible, dismissWarning, cheatCount } = useAntiCheat(submission.id, assignment.focusMode, handleForceSubmit)

  useEffect(() => {
    initDraft(initialAnswers, submission.cheatCount)
  }, [])

  useEffect(() => {
    if (!assignment.timeLimit) return
    const endsAt = new Date(submission.startedAt).getTime() + assignment.timeLimit * 60000
    
    const tick = () => {
      const remaining = Math.max(0, Math.floor((endsAt - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0) {
        submitQuiz(false)
      }
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [assignment.timeLimit, submission.startedAt])

  const submitQuiz = async (forceSubmitted = false) => {
    const answers = useQuizRunnerStore.getState().answers
    const finalCheatCount = useQuizRunnerStore.getState().cheatCount
    
    try {
      await fetch(`/api/submissions/${submission.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, forceSubmitted, cheatCount: finalCheatCount })
      })
      router.push(`/student/assignments/${assignment.id}/run`)
      router.refresh()
    } catch(e) {
      console.error(e)
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleNext = () => {
    if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1)
  }

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1)
  }

  if (warningVisible) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">CẢNH BÁO GIAN LẬN! ({cheatCount}/3)</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Hệ thống phát hiện bạn đã thoát khỏi chế độ toàn màn hình hoặc chuyển tab. 
            Nếu vi phạm quá 3 lần, bài kiểm tra sẽ tự động nộp ngay lập tức.
          </p>
          <Button onClick={dismissWarning} className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-6 text-lg font-bold">
            TÔI ĐÃ HIỂU VÀ QUAY LẠI LÀM BÀI
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIdx]

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ '--theme-color': assignment?.themeColor || '#00adef' } as React.CSSProperties}>
      <header className="h-16 border-b flex items-center justify-between px-6 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/student/assignments/${assignment.id}/run`)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-xs mx-auto text-sm font-semibold text-slate-400">
             Câu {currentIdx + 1} / {questions.length}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setShowMap(true)} className="p-2 text-slate-400 hover:text-[var(--theme-color)] hover:bg-slate-50 rounded-full transition-colors" title="Bản đồ câu hỏi">
            <LayoutGrid className="w-6 h-6" />
          </button>
          {timeLeft !== null && (
            <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-[var(--theme-color)]'}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 flex flex-col pt-12">
        <div className="flex-1">
          
          <QuestionMediaRenderer question={currentQuestion} />
          
          <div className="text-xl font-medium text-slate-800 mb-8 border-t border-slate-100 pt-6 mt-6">
            <p className="text-sm font-bold text-[var(--theme-color)] mb-4 tracking-widest uppercase">{currentQuestion?.type}</p>
            <p>Nội dung câu hỏi sẽ được render tại đây với các Client Components chuyên dụng cho từng loại ({currentQuestion?.type}).</p>
          </div>
        </div>

        <footer className="mt-auto pt-6 pb-8 border-t border-slate-100 flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrev} 
            disabled={currentIdx === 0}
            className="px-8 py-6 rounded-2xl text-slate-600 font-semibold border-2 hover:bg-slate-50"
          >
            Câu trước
          </Button>

          {currentIdx === questions.length - 1 ? (
            <Button 
              onClick={() => submitQuiz(false)} 
              className="px-10 py-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
            >
              NỘP BÀI
            </Button>
          ) : (
            <Button 
              onClick={handleNext} 
              className="px-8 py-6 rounded-2xl bg-[var(--theme-color)] hover:opacity-90 text-white font-bold"
            >
              Câu tiếp theo
            </Button>
          )}
        </footer>
      </main>

      {showMap && <QuestionMap questions={questions} currentIdx={currentIdx} onSelect={(idx: number) => { setCurrentIdx(idx); setShowMap(false) }} onClose={() => setShowMap(false)} />}
    </div>
  )
}
