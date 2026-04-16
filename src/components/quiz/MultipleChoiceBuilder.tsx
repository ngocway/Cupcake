"use client";

import React, { useState, useEffect } from 'react';
import { MultipleChoiceContent } from './types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export interface MultipleChoiceBuilderProps {
  initialData?: MultipleChoiceContent;
  onChange?: (data: MultipleChoiceContent) => void;
}

export function MultipleChoiceBuilder({ initialData, onChange }: MultipleChoiceBuilderProps) {
  const [data, setData] = useState<MultipleChoiceContent>(initialData || {
    questionText: '',
    allowMultipleAnswers: false,
    options: [
      { id: '1', text: '', isCorrect: true },
      { id: '2', text: '', isCorrect: false },
    ]
  });

  useEffect(() => {
    // Normalize data: ensure all options have IDs
    if (initialData?.options) {
      const needsNormalization = initialData.options.some(o => !o.id);
      if (needsNormalization) {
        const normalizedOptions = initialData.options.map((o, idx) => ({
          ...o,
          id: o.id || `opt-${Date.now()}-${idx}`
        }));
        const updated = { ...data, options: normalizedOptions };
        setData(updated);
        if (onChange) onChange(updated);
      }
    }

    if (!initialData && onChange) {
      onChange(data);
    }
  }, [initialData]);

  const handleChange = (newData: Partial<MultipleChoiceContent>) => {
    const updated = { ...data, ...newData };
    setData(updated);
    if (onChange) onChange(updated);
  };

  const addOption = () => {
    const newOptions = [...data.options, { id: Date.now().toString(), text: '', isCorrect: false }];
    handleChange({ options: newOptions });
  };

  const removeOption = (id: string) => {
    if (data.options.length <= 2) return;
    const newOptions = data.options.filter(o => o.id !== id);
    handleChange({ options: newOptions });
  };

  const updateOption = (id: string, text: string) => {
    const newOptions = data.options.map(o => o.id === id ? { ...o, text } : o);
    handleChange({ options: newOptions });
  };

  const toggleCorrect = (id: string) => {
    const newOptions = data.options.map(o => {
      if (o.id === id) {
        return { ...o, isCorrect: !o.isCorrect };
      }
      if (!data.allowMultipleAnswers) {
        return { ...o, isCorrect: false };
      }
      return o;
    });
    handleChange({ options: newOptions });
  };

  return (
    <div className="flex flex-col gap-8 flex-1">
      {/* Question Text Area */}
      <div className="relative">
        <textarea 
          className="w-full min-h-[120px] p-0 text-2xl font-semibold border-none focus:ring-0 placeholder-slate-300 resize-none dark:bg-transparent"
          placeholder="Nhập câu hỏi tại đây..."
          value={data.questionText}
          onChange={(e) => handleChange({ questionText: e.target.value })}
        />
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary/30 via-primary/10 to-transparent"></div>
      </div>

      {/* Answers Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phương án trả lời</h4>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600">Nhiều đáp án đúng</span>
            <Switch 
              checked={!!data.allowMultipleAnswers}
              onCheckedChange={(checked) => handleChange({ allowMultipleAnswers: checked })}
            />
          </div>
        </div>

        <div className="space-y-1">
          {data.options.map((option) => (
            <div key={option.id} className="group flex items-center gap-4 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
              {/* Custom Checkbox */}
              <label className="relative flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="peer hidden" 
                  checked={!!option.isCorrect}
                  onChange={() => toggleCorrect(option.id)}
                />
                <div className="size-9 rounded-lg border-2 border-primary/30 peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center text-white transition-all">
                  <span className="material-symbols-outlined text-[22px] scale-0 peer-checked:scale-100 transition-transform">check</span>
                </div>
              </label>
              
              {/* Option Text Input */}
              <div className="flex-1">
                <input 
                  className="w-full bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 font-medium py-2 text-lg placeholder:text-slate-300"
                  placeholder="Nhập nội dung phương án..."
                  type="text"
                  value={option.text}
                  onChange={(e) => updateOption(option.id, e.target.value)}
                />
              </div>

              {/* Delete Button */}
              {data.options.length > 2 && (
                <button 
                  onClick={() => removeOption(option.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              )}
            </div>
          ))}
        </div>

        <button 
          onClick={addOption}
          className="flex items-center gap-2 w-fit mt-4 px-4 py-2 text-primary font-bold hover:bg-primary/5 rounded-lg transition-colors group"
        >
          <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span>
          <span>Thêm phương án</span>
        </button>
      </div>
    </div>
  );
}
