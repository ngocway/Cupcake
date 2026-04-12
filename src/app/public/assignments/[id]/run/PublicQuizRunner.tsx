"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  HelpCircle,
  Play,
  Rocket
} from "lucide-react"
import { LoginButton } from "@/components/LoginButton"
import { incrementPublicView, incrementPublicSubmission } from "@/actions/public-materials"

interface Props {
  assignment: any
  questions: any[]
}

export default function PublicQuizRunner({ assignment, questions }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<any>({})
  const [finished, setFinished] = useState(false)
  const [hasIncrementedSubmission, setHasIncrementedSubmission] = useState(false)
  const router = useRouter()

  React.useEffect(() => {
    if (assignment?.id) {
      incrementPublicView(assignment.id)
    }
  }, [assignment?.id])

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

  const handleAnswerChange = (qId: string, val: any) => {
    setAnswers({ ...answers, [qId]: val })
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setFinished(true)
      if (!hasIncrementedSubmission && assignment?.id) {
        incrementPublicSubmission(assignment.id)
        setHasIncrementedSubmission(true)
      }
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  // Conversion Modal / Success View
  if (finished) {
    const score = Object.keys(answers).length // Mocking score
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xl p-4 animate-in fade-in duration-500">
        <div className="bg-white max-w-lg w-full rounded-[48px] p-12 text-center space-y-8 shadow-2xl animate-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto scale-110">
              <CheckCircle className="w-12 h-12" />
           </div>
           
           <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-950 font-headline italic">Tuyệt vời! Bạn đã hoàn thành!</h2>
              <p className="text-slate-500 font-medium">Bạn đã khám phá xong bài tập công khai này.</p>
           </div>
           
           <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Kết quả tạm thời</p>
              <div className="text-4xl font-black text-slate-950">{score} / {questions.length}</div>
              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest italic animate-pulse">
                * Kết quả này sẽ biến mất sau khi bạn đóng tab *
              </p>
           </div>

           <div className="space-y-4 pt-4">
              <div className="flex flex-col gap-3">
                 <LoginButton className="w-full py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-full shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <Rocket className="w-4 h-4" /> Đăng ký để lưu kết quả vĩnh viễn
                 </LoginButton>
                 <button 
                  onClick={() => router.push("/")}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-full hover:bg-slate-50 transition-all"
                 >
                    Quay về trang chủ
                 </button>
              </div>
              <p className="text-xs text-slate-400 font-medium">Scholar Script giúp hơn 50,000 học sinh theo dõi tiến bộ mỗi ngày.</p>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-slate-50 font-body">
      {/* Header */}
      <header className="h-20 border-b border-slate-100 bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-20">
         <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()}
              className="p-3 hover:bg-slate-50 rounded-2xl transition-colors"
            >
               <ChevronLeft className="w-6 h-6 text-slate-400" />
            </button>
            <div>
               <h1 className="text-xl font-black text-slate-900 tracking-tight">{assignment.title}</h1>
               <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  Đang làm bài (Công khai)
               </div>
            </div>
         </div>

         <div className="flex items-center gap-8">
            <div className="hidden md:flex flex-col items-end gap-1.5">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiến độ bài làm</span>
               <div className="w-48 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <div 
                    className="h-full bg-primary transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)" 
                    style={{ width: `${progress}%` }}
                  />
               </div>
            </div>

            {!finished && (
               <button 
                onClick={handleNext}
                className="flex items-center gap-3 px-8 py-3 bg-slate-950 text-white rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20"
              >
                 {currentIndex === questions.length - 1 ? "HOÀN THÀNH" : "CÂU TIẾP THEO"}
                 <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            )}
         </div>
      </header>

      {/* Runner Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {assignment.readingText && (
          <div className="flex-1 border-r border-slate-100 flex flex-col bg-white overflow-hidden">
             <div className="h-14 border-b border-slate-50 flex items-center justify-between px-8 bg-slate-50/30">
                <div className="flex items-center gap-3 text-[11px] font-black text-primary uppercase tracking-[0.3em]">
                   <BookOpen className="w-4 h-4" /> Nội dung bài học
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-12 lg:p-16 prose prose-slate max-w-none prose-p:text-lg prose-p:leading-loose prose-p:text-slate-600 prose-headings:font-black">
                <div dangerouslySetInnerHTML={{ __html: assignment.readingText }} />
             </div>
          </div>
        )}

        <div className={`${assignment.readingText ? 'w-[550px] lg:w-[650px]' : 'max-w-4xl mx-auto flex-1'} flex flex-col bg-slate-50/30`}>
          <div className="h-14 border-b border-slate-100 flex items-center justify-between px-8 bg-white/50">
             <div className="flex items-center gap-3 text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em]">
                <HelpCircle className="w-4 h-4" /> Phần câu hỏi
             </div>
             <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Câu {currentIndex + 1} / {questions.length}
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-12 lg:p-20 space-y-12">
            {currentQuestion && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="space-y-4">
                   <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-2xl text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                      CHỦ ĐỀ: MULTIPLE CHOICE
                   </div>
                   <h3 className="text-3xl font-black text-slate-950 leading-tight tracking-tight">
                     {currentQuestion.content}
                   </h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                   {[1, 2, 3, 4].map(opt => (
                     <button 
                       key={opt}
                       onClick={() => handleAnswerChange(currentQuestion.id, opt)}
                       className={`group relative p-6 rounded-3xl border-2 text-left font-bold transition-all duration-300 flex items-center gap-6 ${
                         answers[currentQuestion.id] === opt 
                         ? 'bg-primary/5 border-primary text-primary shadow-xl shadow-primary/10' 
                         : 'bg-white border-slate-100 text-slate-500 hover:border-primary/40 hover:bg-slate-50/50'
                       }`}
                     >
                       <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm transition-all ${
                          answers[currentQuestion.id] === opt ? 'bg-primary border-primary text-white scale-110 shadow-lg' : 'border-slate-100 group-hover:border-primary/40'
                       }`}>
                          {String.fromCharCode(64 + opt)}
                       </div>
                       <div className="flex-1">
                          Ví dụ về nội dung lựa chọn trong bài thi trắc nghiệm.
                       </div>
                       {answers[currentQuestion.id] === opt && <div className="p-2 bg-primary text-white rounded-full animate-in zoom-in duration-300"><CheckCircle className="w-4 h-4" /></div>}
                     </button>
                   ))}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="h-24 border-t border-slate-100 bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
             <button 
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-950 transition-all disabled:opacity-0"
             >
                <ChevronLeft className="w-5 h-5 mx-1" />
                Quay lại
             </button>

             <div className="flex items-center gap-2">
                {questions.map((_, i) => (
                   <div 
                     key={i}
                     onClick={() => setCurrentIndex(i)}
                     className={`cursor-pointer transition-all duration-500 ${
                       i === currentIndex ? 'w-10 h-2 bg-primary rounded-full' : 'w-2 h-2 bg-slate-200 rounded-full hover:bg-slate-300'
                     }`}
                   />
                ))}
             </div>

             <button 
                onClick={handleNext}
                className="flex items-center gap-3 px-10 py-3.5 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
             >
                {currentIndex === questions.length - 1 ? "KẾT THÚC" : "TIẾP THEO"}
                <ChevronRight className="w-5 h-5 ml-1" />
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}
