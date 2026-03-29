import React from 'react'
import { X } from 'lucide-react'
import { useQuizRunnerStore } from '@/store/useQuizRunnerStore'

export function QuestionMap({ questions, currentIdx, onSelect, onClose }: any) {
  const answers = useQuizRunnerStore(s => s.answers)

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex flex-col justify-end backdrop-blur-sm shadow-2xl transition-all">
      <div className="bg-white rounded-t-3xl w-full max-w-3xl mx-auto p-6 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Bản đồ câu hỏi</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
          {questions.map((q: any, idx: number) => {
            const val = answers[q.id]
            const hasAnswer = val !== undefined && val !== null && val !== '' && (!Array.isArray(val) || val.length > 0)
            const isCurrent = idx === currentIdx

            return (
              <button
                key={q.id}
                onClick={() => onSelect(idx)}
                className={`
                  aspect-square rounded-xl font-bold text-lg flex items-center justify-center transition-all
                  ${isCurrent ? 'ring-4 ring-[var(--theme-color)]/30 scale-110 z-10' : ''}
                  ${hasAnswer 
                    ? 'bg-[var(--theme-color)] text-white border-transparent' 
                    : 'bg-white text-slate-400 border-2 border-slate-200 hover:border-[var(--theme-color)]'
                  }
                `}
              >
                {idx + 1}
              </button>
            )
          })}
        </div>
        
        <div className="mt-8 flex gap-6 text-sm font-medium text-slate-500 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[var(--theme-color)]"></div> Đã làm
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-slate-200 bg-white"></div> Chưa làm
          </div>
        </div>
      </div>
    </div>
  )
}
