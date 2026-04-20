"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface InstructionsModalProps {
  initialValue: string;
  onClose: () => void;
  onSave: (value: string) => void;
}

export function InstructionsModal({ initialValue, onClose, onSave }: InstructionsModalProps) {
  const [value, setValue] = useState(initialValue);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && initialValue) {
      editorRef.current.innerHTML = initialValue;
    }
  }, []);

  const handleFormat = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setValue(editorRef.current.innerHTML);
    }
  };

  const handleFileUpload = (type: 'image' | 'video' | 'audio') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : 'audio/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          if (type === 'image') {
            handleFormat('insertHTML', `<img src="${base64}" class="max-w-full rounded-xl my-4 shadow-md" />`);
          } else if (type === 'video') {
            handleFormat('insertHTML', `<video src="${base64}" controls class="max-w-full rounded-xl my-4 shadow-md"></video>`);
          } else if (type === 'audio') {
            handleFormat('insertHTML', `<audio src="${base64}" controls class="w-full my-4"></audio>`);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleAddLink = () => {
    const url = prompt('Nhập địa chỉ liên kết (URL):');
    if (url) {
      handleFormat('createLink', url);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh] border border-white/20">
        
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between bg-slate-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-4">
            <div className="size-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="material-symbols-outlined text-3xl">menu_book</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Hướng dẫn làm bài</h2>
              <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Soạn thảo hướng dẫn đa phương tiện cho học sinh
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="size-10 rounded-full hover:bg-slate-200 dark:hover:bg-gray-800 flex items-center justify-center text-slate-400 transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-10 py-4 bg-white dark:bg-gray-900 border-b border-slate-100 dark:border-gray-800 flex flex-wrap gap-2 sticky top-0 z-10">
          <div className="flex items-center bg-slate-100 dark:bg-gray-800 p-1 rounded-xl mr-2">
            <ToolbarButton icon="format_bold" onClick={() => handleFormat('bold')} tooltip="In đậm" />
            <ToolbarButton icon="format_italic" onClick={() => handleFormat('italic')} tooltip="In nghiêng" />
            <ToolbarButton icon="format_underlined" onClick={() => handleFormat('underline')} tooltip="Gạch chân" />
          </div>
          
          <div className="flex items-center bg-slate-100 dark:bg-gray-800 p-1 rounded-xl mr-2">
            <ToolbarButton icon="link" onClick={handleAddLink} tooltip="Thêm liên kết" />
            <ToolbarButton icon="format_list_bulleted" onClick={() => handleFormat('insertUnorderedList')} tooltip="Danh sách không thứ tự" />
            <ToolbarButton icon="format_list_numbered" onClick={() => handleFormat('insertOrderedList')} tooltip="Danh sách có thứ tự" />
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-gray-800 p-1 rounded-xl">
            <ToolbarButton icon="image" onClick={() => handleFileUpload('image')} color="text-blue-500" tooltip="Thêm ảnh" />
            <ToolbarButton icon="videocam" onClick={() => handleFileUpload('video')} color="text-purple-500" tooltip="Thêm video" />
            <ToolbarButton icon="audio_file" onClick={() => handleFileUpload('audio')} color="text-emerald-500" tooltip="Thêm âm thanh" />
          </div>
          
          <div className="flex items-center bg-slate-100 dark:bg-gray-800 p-1 rounded-xl ml-auto">
             <ToolbarButton icon="format_clear" onClick={() => handleFormat('removeFormat')} tooltip="Xóa định dạng" />
          </div>
        </div>

        {/* Editor Area */}
        <div className="p-10 overflow-y-auto flex-1 bg-white dark:bg-gray-900 custom-scrollbar">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setValue(e.currentTarget.innerHTML)}
            className="min-h-[350px] outline-none text-slate-800 dark:text-slate-200 text-lg leading-relaxed prose prose-slate dark:prose-invert max-w-none placeholder:text-slate-300"
            style={{ fontFamily: 'var(--font-headline)' }}
          />
          {value === '' && (
            <div className="absolute top-10 left-10 pointer-events-none text-slate-300 text-lg">
              Nhập nội dung hướng dẫn tại đây...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-8 bg-slate-50 dark:bg-gray-900/80 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-400">
            <span className="material-symbols-outlined text-xl">info</span>
            <span className="text-xs font-bold uppercase tracking-wider">Tự động đồng bộ với bài tập</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={onClose} className="rounded-2xl font-bold px-8 h-14 hover:bg-slate-200 dark:hover:bg-gray-800 transition-all">Hủy bỏ</Button>
            <Button 
              onClick={() => {
                onSave(value);
                onClose();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl px-12 h-14 shadow-xl shadow-blue-500/20 uppercase tracking-widest text-sm transition-all active:scale-95 translate-y-0 hover:-translate-y-1"
            >
              Lưu & Áp dụng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ icon, onClick, color = "text-slate-600 dark:text-slate-300", tooltip }: { icon: string; onClick: () => void; color?: string; tooltip?: string }) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`size-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all group relative`}
      title={tooltip}
    >
      <span className={`material-symbols-outlined text-[22px] ${color}`}>{icon}</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
        {tooltip}
      </div>
    </button>
  );
}
