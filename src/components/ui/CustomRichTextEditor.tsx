"use client";

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface CustomRichTextEditorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  editorId?: string;
  editorClassName?: string;
  onImageUploadClick?: () => void;
  onVideoUploadClick?: () => void;
  onAudioUploadClick?: () => void;
  customToolbarElements?: React.ReactNode;
  // Events needed by ReadingExerciseBuilder
  onEditorClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onEditorDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onEditorDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onEditorDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
}

const FONTS = [
  { name: 'Mặc định', value: 'inherit' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: '"Times New Roman", serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Nunito', value: 'Nunito, sans-serif' },
  { name: 'Fredoka One', value: '"Fredoka One", cursive' },
  { name: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
];

const SIZES = [
  { name: '12px', value: '12px' },
  { name: '14px', value: '14px' },
  { name: '16px (Chuẩn)', value: '16px' },
  { name: '18px', value: '18px' },
  { name: '20px', value: '20px' },
  { name: '24px', value: '24px' },
  { name: '32px', value: '32px' },
];

export const CustomRichTextEditor = forwardRef<HTMLDivElement, CustomRichTextEditorProps>(
  (
    {
      value = '',
      onChange,
      placeholder = 'Nhập nội dung tại đây...',
      minHeight = '350px',
      editorId = 'custom-rich-text-editor',
      editorClassName = '',
      onImageUploadClick,
      onVideoUploadClick,
      onAudioUploadClick,
      customToolbarElements,
      onEditorClick,
      onEditorDrop,
      onEditorDragOver,
      onEditorDragLeave,
      ...rest
    },
    ref
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => internalRef.current as HTMLDivElement);

    const [isHtmlMode, setIsHtmlMode] = useState(false);
    const [htmlValue, setHtmlValue] = useState(value);

    // Initialize content
    useEffect(() => {
      if (internalRef.current && internalRef.current.innerHTML !== value && !isHtmlMode) {
        internalRef.current.innerHTML = value;
      }
      setHtmlValue(value);
    }, [value, isHtmlMode]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      const newHtml = e.currentTarget.innerHTML;
      setHtmlValue(newHtml);
      if (onChange) onChange(newHtml);
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newHtml = e.target.value;
      setHtmlValue(newHtml);
      if (onChange) onChange(newHtml);
      if (internalRef.current) {
        internalRef.current.innerHTML = newHtml;
      }
    };

    const handleFormat = (command: string, cmdValue: string = '') => {
      document.execCommand(command, false, cmdValue);
      if (internalRef.current) {
        const newHtml = internalRef.current.innerHTML;
        setHtmlValue(newHtml);
        if (onChange) onChange(newHtml);
      }
    };

    const handleAddLink = () => {
      const url = prompt('Nhập địa chỉ liên kết (URL):');
      if (url) {
        handleFormat('createLink', url);
      }
    };

    const applyFontSize = (size: string) => {
      handleFormat('fontSize', '7'); // Dùng size 7 làm mốc tạm thời
      if (internalRef.current) {
        const fonts = internalRef.current.getElementsByTagName('font');
        for (let i = fonts.length - 1; i >= 0; i--) {
          const font = fonts[i];
          if (font.getAttribute('size') === '7') {
            font.removeAttribute('size');
            font.style.fontSize = size;
          }
        }
        const newHtml = internalRef.current.innerHTML;
        setHtmlValue(newHtml);
        if (onChange) onChange(newHtml);
      }
    };

    return (
      <div className="flex flex-col w-full h-full border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900" {...rest}>
        {/* Toolbar */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-gray-800/80 border-b border-slate-200 dark:border-gray-800 flex flex-wrap gap-2 sticky top-0 z-10 items-center">
          
          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 p-1 rounded-lg">
            <ToolbarButton icon="format_bold" onClick={() => handleFormat('bold')} tooltip="In đậm" disabled={isHtmlMode} />
            <ToolbarButton icon="format_italic" onClick={() => handleFormat('italic')} tooltip="In nghiêng" disabled={isHtmlMode} />
            <ToolbarButton icon="format_underlined" onClick={() => handleFormat('underline')} tooltip="Gạch chân" disabled={isHtmlMode} />
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 p-1 rounded-lg">
            <select 
              className="text-xs bg-transparent border-none outline-none cursor-pointer w-28 text-slate-700 dark:text-slate-300 disabled:opacity-50"
              onChange={(e) => handleFormat('fontName', e.target.value)}
              disabled={isHtmlMode}
              defaultValue="inherit"
            >
              {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
            </select>
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-gray-700 mx-1"></div>
            <select 
              className="text-xs bg-transparent border-none outline-none cursor-pointer w-20 text-slate-700 dark:text-slate-300 disabled:opacity-50"
              onChange={(e) => applyFontSize(e.target.value)}
              disabled={isHtmlMode}
              defaultValue="16px"
            >
              {SIZES.map(s => <option key={s.value} value={s.value}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 p-1 rounded-lg">
            <ToolbarButton icon="format_list_bulleted" onClick={() => handleFormat('insertUnorderedList')} tooltip="Danh sách chấm" disabled={isHtmlMode} />
            <ToolbarButton icon="format_list_numbered" onClick={() => handleFormat('insertOrderedList')} tooltip="Danh sách số" disabled={isHtmlMode} />
            <ToolbarButton icon="link" onClick={handleAddLink} tooltip="Thêm liên kết" disabled={isHtmlMode} />
          </div>

          {(onImageUploadClick || onVideoUploadClick || onAudioUploadClick) && (
            <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 p-1 rounded-lg">
              {onImageUploadClick && <ToolbarButton icon="image" onClick={onImageUploadClick} color="text-blue-500" tooltip="Thêm ảnh" disabled={isHtmlMode} />}
              {onVideoUploadClick && <ToolbarButton icon="videocam" onClick={onVideoUploadClick} color="text-purple-500" tooltip="Thêm video" disabled={isHtmlMode} />}
              {onAudioUploadClick && <ToolbarButton icon="audio_file" onClick={onAudioUploadClick} color="text-emerald-500" tooltip="Thêm âm thanh" disabled={isHtmlMode} />}
            </div>
          )}

          {customToolbarElements && (
            <div className="flex items-center gap-1.5 p-0.5">
              {customToolbarElements}
            </div>
          )}

          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 p-1 rounded-lg ml-auto">
             <ToolbarButton icon="format_clear" onClick={() => handleFormat('removeFormat')} tooltip="Xóa định dạng" disabled={isHtmlMode} />
             <div className="w-[1px] h-4 bg-slate-200 dark:bg-gray-700 mx-1"></div>
             <button
               onClick={() => {
                 if (!isHtmlMode && internalRef.current) {
                   setHtmlValue(internalRef.current.innerHTML);
                 }
                 setIsHtmlMode(!isHtmlMode);
               }}
               className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors ${
                 isHtmlMode 
                  ? 'bg-primary text-white' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800'
               }`}
               title="Xem mã HTML"
             >
               <span className="material-symbols-outlined text-[16px]">code</span>
               HTML
             </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-hidden relative group" style={{ minHeight }}>
          {isHtmlMode ? (
            <textarea
              value={htmlValue}
              onChange={handleTextareaChange}
              className="absolute inset-0 w-full h-full p-6 bg-slate-900 text-emerald-400 font-mono text-sm outline-none resize-none custom-scrollbar"
              placeholder="Nhập mã HTML..."
            />
          ) : (
            <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-6">
              <div
                id={editorId}
                ref={internalRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onClick={onEditorClick}
                onDrop={onEditorDrop}
                onDragOver={onEditorDragOver}
                onDragLeave={onEditorDragLeave}
                className={`outline-none text-slate-800 dark:text-slate-200 text-lg leading-relaxed prose prose-slate dark:prose-invert max-w-none ${editorClassName}`}
              />
              {(!htmlValue || htmlValue === '<br>') && (
                <div className="absolute top-6 left-6 pointer-events-none text-slate-400 opacity-60">
                  {placeholder}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

CustomRichTextEditor.displayName = 'CustomRichTextEditor';

function ToolbarButton({ 
  icon, 
  onClick, 
  color = "text-slate-600 dark:text-slate-300", 
  tooltip,
  disabled = false
}: { 
  icon: string; 
  onClick: () => void; 
  color?: string; 
  tooltip?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      className={`size-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-gray-800 transition-all group/btn relative ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
      title={tooltip}
    >
      <span className={`material-symbols-outlined text-[20px] ${color}`}>{icon}</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded whitespace-nowrap opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-opacity z-50">
        {tooltip}
      </div>
    </button>
  );
}
