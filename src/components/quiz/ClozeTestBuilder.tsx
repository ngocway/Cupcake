"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ClozeTestContent } from './types';
import { Checkbox } from '@/components/ui/checkbox';

export interface ClozeTestBuilderProps {
  initialData?: ClozeTestContent;
  onChange?: (data: ClozeTestContent) => void;
}

export function ClozeTestBuilder({ initialData, onChange }: ClozeTestBuilderProps) {
  const [data, setData] = useState<ClozeTestContent>(initialData || {
    textWithBlanks: '',
    caseSensitive: false
  });

  useEffect(() => {
    if (!initialData && onChange) {
      onChange(data);
    }
  }, []);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  const handleChange = (newData: Partial<ClozeTestContent>) => {
    const updated = { ...data, ...newData };
    setData(updated);
    if (onChange) onChange(updated);
  };

  const handleSelection = () => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd, value } = textareaRef.current;
    
    if (selectionStart !== selectionEnd) {
      setSelection({ start: selectionStart, end: selectionEnd });
      
      // Calculate tooltip position (rough estimation for textarea)
      // In a real production app, we might use a hidden div to mirror coordinates
      setTooltipPos({ top: -40, left: 100 }); 
    } else {
      setSelection(null);
      setTooltipPos(null);
    }
  };

  const handleCreateBlank = () => {
    if (!selection || !textareaRef.current) return;
    const { start, end } = selection;
    const value = data.textWithBlanks;
    const selectedText = value.substring(start, end);
    
    if (selectedText.startsWith('{{') && selectedText.endsWith('}}')) return;

    const newText = value.substring(0, start) + `{{${selectedText}}}` + value.substring(end);
    handleChange({ textWithBlanks: newText });
    setSelection(null);
    setTooltipPos(null);
  };

  const removeBlank = (fullMatch: string, word: string) => {
    const newText = data.textWithBlanks.replace(fullMatch, word);
    handleChange({ textWithBlanks: newText });
  };

  const renderVisualEditor = () => {
    const parts = data.textWithBlanks.split(/(\{\{.*?\}\})/g);
    return (
      <div className="w-full min-h-[300px] p-6 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-gray-700 rounded-2xl text-xl font-medium text-slate-700 dark:text-slate-200 leading-[2.5rem] relative">
        <textarea
          ref={textareaRef}
          className="absolute inset-0 w-full h-full p-6 bg-transparent border-none focus:ring-0 text-transparent caret-slate-800 dark:caret-white resize-none z-10"
          value={data.textWithBlanks}
          onChange={(e) => handleChange({ textWithBlanks: e.target.value })}
          onSelect={handleSelection}
        />
        <div className="relative z-0 pointer-events-none">
          {parts.map((part, i) => {
            if (part.startsWith('{{') && part.endsWith('}}')) {
              const word = part.slice(2, -2);
              return (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold rounded-full border border-green-200 dark:border-green-800/50 mx-1 pointer-events-auto">
                  {word}
                  <button 
                    onClick={() => removeBlank(part, word)}
                    className="size-4 flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-800 rounded-full transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-0 flex flex-col gap-6 flex-1">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nội dung câu hỏi</h4>
      
      <div className="relative flex-1 group">
        {tooltipPos && (
          <div 
            className="absolute z-20 transition-all duration-200"
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
          >
            <button 
              onClick={handleCreateBlank}
              className="bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 hover:bg-slate-700 transition-colors"
            >
              <span>Tạo ô trống</span>
              <div className="size-2 bg-slate-800 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
            </button>
          </div>
        )}
        
        {renderVisualEditor()}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
          <span className="text-blue-500">💡</span>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Mẹo: Bôi đen từ bất kỳ để tạo ô trống cho học sinh điền.</span>
        </div>
        
        <label className="flex items-center gap-3 cursor-pointer w-fit group">
          <Checkbox 
            checked={data.caseSensitive}
            onCheckedChange={(checked) => handleChange({ caseSensitive: checked === true })}
            className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary/20 transition-all"
          />
          <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-800 transition-colors">Chấp nhận chữ hoa/thường</span>
        </label>
      </div>
    </div>
  );
}
