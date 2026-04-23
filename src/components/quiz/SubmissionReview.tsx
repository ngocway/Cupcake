import React from 'react';
import { BaseQuestionProps } from './types';

export interface SubmissionReviewProps {
  question: BaseQuestionProps & { content?: any };
  studentAnswer: string;
  isCorrect: boolean;
  correctAnswerText: string;
}

export function SubmissionReview({ 
  question, 
  studentAnswer, 
  isCorrect,
  correctAnswerText
}: SubmissionReviewProps) {
  return (
    <div className="border border-slate-200 bg-white shadow-sm rounded-2xl p-6 mb-4 font-sans max-w-2xl mx-auto">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md mb-2 inline-block">
            {question.points.toFixed(1)}đ
          </span>
          <h4 className="font-semibold text-slate-800 mt-2 text-lg">
            Câu hỏi {question.type === 'MULTIPLE_CHOICE' ? 'trắc nghiệm' : question.type}
          </h4>
        </div>
        
        {isCorrect ? (
           <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
             <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"></path></svg>
           </div>
        ) : (
           <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
             <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
           </div>
        )}
      </div>
      
      <div className={`p-4 rounded-xl mb-4 border ${isCorrect ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
        <p className="text-sm text-slate-600 mb-2">Đáp án của học sinh:</p>
        <div className="space-y-2">
          {question.type === 'MATCHING' ? (
            (() => {
              let userPairs: Record<string, string> = {};
              try {
                userPairs = typeof studentAnswer === 'string' ? JSON.parse(studentAnswer) : studentAnswer;
              } catch (e) {
                userPairs = {};
              }
              
              const questionContent = question.content;
              const pairs = questionContent?.pairs || [];

              return (
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(userPairs).map(([leftId, rightText], idx) => {
                    const leftItem = pairs.find((p: any) => p.id === leftId);
                    const isPairCorrect = leftItem?.rightText === rightText;
                    
                    return (
                      <div key={idx} className={`flex items-center gap-3 p-2 rounded-lg border ${isPairCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-2 flex-1">
                          {leftItem?.leftImageUrl ? (
                            <img src={leftItem.leftImageUrl} className="w-8 h-8 object-cover rounded" alt="" />
                          ) : (
                            <span className="text-xs font-bold text-slate-700">{leftItem?.leftText || leftId}</span>
                          )}
                          <span className="text-slate-400">→</span>
                          {rightText.startsWith('http') ? (
                            <img src={rightText} className="w-8 h-8 object-cover rounded" alt="" />
                          ) : (
                            <span className="text-xs font-bold text-slate-700">{rightText}</span>
                          )}
                        </div>
                        <span className="material-symbols-outlined text-sm">
                          {isPairCorrect ? 'check_circle' : 'cancel'}
                        </span>
                      </div>
                    );
                  })}
                  {Object.keys(userPairs).length === 0 && <span className="text-xs italic text-slate-400">Không có cặp nào được nối</span>}
                </div>
              );
            })()
          ) : (
            <div className="flex items-center space-x-2">
              {isCorrect ? (
                <span className="text-emerald-700 font-semibold">{studentAnswer}</span>
              ) : (
                <div className="flex flex-col space-y-2 w-full">
                  <span className="text-red-600 font-semibold line-through decoration-red-400 decoration-2">{studentAnswer}</span>
                  <div className="h-px bg-red-100 w-full" />
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-2">Đáp án đúng:</span>
                    <span className="text-emerald-600 font-bold">{correctAnswerText}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* HIỂN THỊ LỜI GIẢI THÍCH NẾU HỌC SINH LÀM SAI VÀ CÓ LỜI GIẢI */}
      {!isCorrect && question.explanation && (
        <div className="bg-amber-50/80 border border-amber-100 p-5 rounded-xl mt-2 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />
          <p className="text-sm font-bold text-amber-800 mb-1.5 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Giải thích đáp án:
          </p>
          <p className="text-sm text-amber-800/90 leading-relaxed font-medium">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
