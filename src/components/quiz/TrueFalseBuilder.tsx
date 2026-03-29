"use client";
import React, { useState } from 'react';
import { TrueFalseContent } from './types';

export interface TrueFalseBuilderProps {
  initialData?: TrueFalseContent;
  onChange?: (data: TrueFalseContent) => void;
}

const STYLE_LABELS = {
  TRUE_FALSE: { true: 'TRUE', false: 'FALSE', trueSub: '(Đúng)', falseSub: '(Sai)' },
  DUNG_SAI: { true: 'ĐÚNG', false: 'SAI', trueSub: '(True)', falseSub: '(False)' },
  YES_NO: { true: 'YES', false: 'NO', trueSub: '(Có)', falseSub: '(Không)' },
};

export function TrueFalseBuilder({ initialData, onChange }: TrueFalseBuilderProps) {
  const [data, setData] = useState<TrueFalseContent>(initialData || {
    statement: '',
    isTrue: true,
    displayStyle: 'TRUE_FALSE'
  });
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);

  React.useEffect(() => {
    if (!initialData && onChange) {
      onChange(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = data.displayStyle || 'TRUE_FALSE';
  const labels = STYLE_LABELS[style];

  const handleChange = (newData: Partial<TrueFalseContent>) => {
    const updated = { ...data, ...newData };
    setData(updated);
    if (onChange) onChange(updated);
  };

  return (
    <div className="flex flex-col gap-8 flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Question Content Area */}
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nội dung câu hỏi</h4>
        <div className="relative group">
          <textarea 
            placeholder="Nhập nhận định (phát biểu) tại đây..."
            className="w-full min-h-[140px] p-6 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-gray-700 rounded-2xl text-xl font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all resize-none placeholder:text-slate-300"
            value={data.statement}
            onChange={(e) => handleChange({ statement: e.target.value })}
          />
          <div className="absolute bottom-4 right-4 text-xs font-bold text-slate-300 opacity-0 group-focus-within:opacity-100 transition-opacity">
            {data.statement.length} ký tự
          </div>
        </div>
      </div>

      {/* Answer Area */}
      <div className="flex flex-col gap-4 relative">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chọn đáp án đúng:</h4>
          
          <div className="relative">
            <button 
              onClick={() => setShowStyleDropdown(!showStyleDropdown)}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-wider"
            >
              Kiểu hiển thị: {style.replace('_', '/')} 
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
            
            {showStyleDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowStyleDropdown(false)} 
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 shadow-xl border border-slate-200 dark:border-gray-700 rounded-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  {(Object.keys(STYLE_LABELS) as (keyof typeof STYLE_LABELS)[]).map((s) => (
                    <button 
                      key={s}
                      onClick={() => {
                        handleChange({ displayStyle: s });
                        setShowStyleDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                        style === s 
                          ? 'text-primary bg-primary/5' 
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {s.replace('_', '/')}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-6">
          {/* TRUE Card */}
          <button
            type="button"
            onClick={() => handleChange({ isTrue: true })}
            className={`flex-1 flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 transition-all relative ${
              data.isTrue 
                ? 'border-blue-200 bg-blue-600 dark:bg-blue-700 dark:border-blue-900 shadow-xl scale-[1.02]' 
                : 'border-blue-100 bg-blue-50/50 hover:bg-blue-100/50 dark:border-blue-900/30 dark:bg-blue-900/10 grayscale-[0.5] hover:grayscale-0'
            }`}
          >
            {data.isTrue && (
              <div className="absolute -top-3 -right-3 size-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center text-white shadow-lg animate-in zoom-in duration-300">
                <span className="material-symbols-outlined text-[18px] font-bold">check</span>
              </div>
            )}
            <div className={`size-16 rounded-full flex items-center justify-center mb-2 shadow-lg transition-all ${
              data.isTrue ? 'bg-white/20 text-white' : 'bg-blue-500 text-white shadow-blue-500/20'
            }`}>
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-black transition-colors ${
                data.isTrue ? 'text-white' : 'text-blue-700 dark:text-blue-400'
              }`}>
                {labels.true}
              </div>
              <div className={`text-sm font-bold transition-colors ${
                data.isTrue ? 'text-white/80' : 'text-blue-500/70'
              }`}>
                {labels.trueSub}
              </div>
            </div>
          </button>

          {/* FALSE Card */}
          <button
            type="button"
            onClick={() => handleChange({ isTrue: false })}
            className={`flex-1 flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 transition-all relative ${
              !data.isTrue 
                ? 'border-red-200 bg-red-600 dark:bg-red-700 dark:border-red-900 shadow-xl scale-[1.02]' 
                : 'border-red-100 bg-red-50/50 hover:bg-red-100/50 dark:border-red-900/30 dark:bg-red-900/10 grayscale-[0.5] hover:grayscale-0'
            }`}
          >
            {!data.isTrue && (
              <div className="absolute -top-3 -right-3 size-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center text-white shadow-lg animate-in zoom-in duration-300">
                <span className="material-symbols-outlined text-[18px] font-bold">check</span>
              </div>
            )}
            <div className={`size-16 rounded-full flex items-center justify-center mb-2 shadow-lg transition-all ${
              !data.isTrue ? 'bg-white/20 text-white' : 'bg-red-500 text-white shadow-red-500/20'
            }`}>
              <span className="material-symbols-outlined text-4xl">cancel</span>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-black transition-colors ${
                !data.isTrue ? 'text-white' : 'text-red-700 dark:text-red-400'
              }`}>
                {labels.false}
              </div>
              <div className={`text-sm font-bold transition-colors ${
                !data.isTrue ? 'text-white/80' : 'text-red-500/70'
              }`}>
                {labels.falseSub}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
