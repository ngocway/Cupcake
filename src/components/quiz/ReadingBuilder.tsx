import React, { useState } from 'react';
import { BaseQuestionProps, QuestionType } from './types';
import { MultipleChoiceBuilder } from './MultipleChoiceBuilder';
import { ClozeTestBuilder } from './ClozeTestBuilder';
import { MatchingBuilder } from './MatchingBuilder';
import { TrueFalseBuilder } from './TrueFalseBuilder';
import { ReorderBuilder } from './ReorderBuilder';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from 'lucide-react';

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm' },
  { value: 'CLOZE_TEST', label: 'Điền lời' },
  { value: 'MATCHING', label: 'Nối cặp' },
  { value: 'TRUE_FALSE', label: 'Đúng / Sai' },
  { value: 'REORDER', label: 'Sắp xếp' },
];

export function ReadingBuilder() {
  const [questions, setQuestions] = useState<BaseQuestionProps[]>([
    { id: '1', type: 'MULTIPLE_CHOICE', points: 1.0 }
  ]);
  const [activeId, setActiveId] = useState<string>('1');
  const [readingText, setReadingText] = useState('Global warming is the long-term heating of Earth\'s surface observed since the pre-industrial period (between 1850 and 1900) due to human activities, primarily fossil fuel burning, which increases heat-trapping greenhouse gas levels in Earth\'s atmosphere.');

  const activeQuestion = questions.find(q => q.id === activeId);

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

  const updateActiveQuestion = (data: Partial<BaseQuestionProps>) => {
    setQuestions(questions.map(q => q.id === activeId ? { ...q, ...data } : q));
  };

  const renderActiveBuilder = () => {
    if (!activeQuestion) return null;
    switch (activeQuestion.type) {
      case 'MULTIPLE_CHOICE': return <MultipleChoiceBuilder />;
      case 'CLOZE_TEST': return <ClozeTestBuilder />;
      case 'MATCHING': return <MatchingBuilder />;
      case 'TRUE_FALSE': return <TrueFalseBuilder />;
      case 'REORDER': return <ReorderBuilder />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* LEFT PANEL - READING PASSAGE EDITOR */}
      <div className="flex-1 flex flex-col border-r border-slate-200 bg-white">
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/50 shrink-0">
          <Input 
            className="text-lg font-bold border-none shadow-none bg-transparent focus-visible:ring-0 px-0 h-10 w-full placeholder:text-slate-300" 
            placeholder="Nhập tiêu đề bài đọc..."
            defaultValue="Unit 1: Global Warming"
          />
        </div>
        
        {/* Simple Rich Text Toolbar */}
        <div className="flex items-center space-x-1 border-b border-slate-100 p-2 bg-white">
          <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500 rounded"><Bold className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500 rounded"><Italic className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500 rounded"><Underline className="w-4 h-4" /></Button>
          <div className="w-[1px] h-4 bg-slate-200 mx-2" />
          <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500 rounded"><AlignLeft className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500 rounded"><AlignCenter className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500 rounded"><AlignRight className="w-4 h-4" /></Button>
          <div className="w-[1px] h-4 bg-slate-200 mx-2" />
          <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500 rounded"><List className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500 rounded"><ListOrdered className="w-4 h-4" /></Button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <textarea 
            className="w-full h-full resize-none border-none outline-none text-base leading-relaxed text-slate-700 bg-transparent placeholder:text-slate-300"
            placeholder="Nhập nội dung đoạn văn bài đọc tại đây..."
            value={readingText}
            onChange={(e) => setReadingText(e.target.value)}
          />
        </div>
      </div>

      {/* RIGHT PANEL - QUESTION BUILDER */}
      <div className="flex-1 max-w-[55%] flex flex-col bg-slate-50/50">
        
        {/* Question Tabs / List Header */}
        <div className="bg-white border-b border-slate-200 p-4 shrink-0 flex items-center space-x-2 overflow-x-auto custom-scrollbar">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setActiveId(q.id)}
              className={`shrink-0 flex items-center px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
                activeId === q.id 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              Câu {idx + 1}
              {questions.length > 1 && (
                <span 
                  className="ml-2 w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-100 hover:text-red-600 text-slate-300"
                  onClick={(e) => { e.stopPropagation(); handleRemoveQuestion(q.id); }}
                >
                  <Trash2 className="w-3 h-3" />
                </span>
              )}
            </button>
          ))}
          <Button variant="outline" size="sm" onClick={handleAddQuestion} className="rounded-full h-9 border-dashed text-blue-600 hover:bg-blue-50 shrink-0">
            <Plus className="w-4 h-4 mr-1" /> Thêm câu
          </Button>
        </div>

        {/* Active Question Editor */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <Select 
                value={activeQuestion?.type} 
                onValueChange={(val: string) => updateActiveQuestion({ type: val as QuestionType })}
              >
                <SelectTrigger className="w-[180px] h-9 bg-slate-50 border-slate-200 text-slate-700 font-semibold rounded-lg">
                  <SelectValue placeholder="Loại câu hỏi" />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center space-x-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ĐIỂM:</span>
                <Input 
                  type="number" 
                  className="w-12 h-6 px-1 font-bold text-blue-600 border-none shadow-none bg-transparent focus-visible:ring-0"
                  value={activeQuestion?.points}
                  onChange={(e) => updateActiveQuestion({ points: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <div className="min-h-[300px]">
              {renderActiveBuilder()}
            </div>
          </div>
        </div>

        {/* Global Footer Actions */}
        <div className="h-20 bg-white border-t border-slate-200 flex items-center justify-end px-8 shrink-0">
          <Button variant="ghost" className="mr-3 font-semibold text-slate-500 hover:bg-slate-100">Hủy</Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-8 h-11 shadow-sm font-semibold">
            Lưu Bài Đọc
          </Button>
        </div>

      </div>
    </div>
  );
}
