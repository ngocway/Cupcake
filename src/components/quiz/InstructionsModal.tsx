"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CustomRichTextEditor } from '@/components/ui/CustomRichTextEditor';

interface InstructionsModalProps {
  initialValue: string;
  onClose: () => void;
  onSave: (value: string) => void;
}

export function InstructionsModal({ initialValue, onClose, onSave }: InstructionsModalProps) {
  const [value, setValue] = useState(initialValue);
  const [isUploading, setIsUploading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (type: 'image' | 'video' | 'audio') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : 'audio/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setIsUploading(true);
        try {
          const { uploadMedia } = await import('@/actions/upload-actions');
          const formData = new FormData();
          formData.append('file', file);
          const res = await uploadMedia(formData);
          if (res.success && res.url) {
            let htmlToInsert = '';
            if (type === 'image') {
              htmlToInsert = `<img src="${res.url}" class="max-w-full rounded-xl my-4 shadow-md" />`;
            } else if (type === 'video') {
              htmlToInsert = `<video src="${res.url}" controls class="max-w-full rounded-xl my-4 shadow-md"></video>`;
            } else if (type === 'audio') {
              htmlToInsert = `<audio src="${res.url}" controls class="w-full my-4"></audio>`;
            }
            
            if (htmlToInsert) {
               document.execCommand('insertHTML', false, htmlToInsert);
               if (editorRef.current) {
                  setValue(editorRef.current.innerHTML);
               }
            }
          } else {
            alert('Tải file thất bại: ' + res.error);
          }
        } catch (err: any) {
          console.error(err);
          alert('Có lỗi xảy ra khi tải file lên.');
        } finally {
          setIsUploading(false);
        }
      }
    };
    input.click();
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
            disabled={isUploading}
            onClick={onClose}
            className="size-10 rounded-full hover:bg-slate-200 dark:hover:bg-gray-800 flex items-center justify-center text-slate-400 transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 bg-slate-50 dark:bg-gray-900 p-6 overflow-hidden flex flex-col">
          <CustomRichTextEditor 
            ref={editorRef}
            value={value}
            onChange={setValue}
            placeholder="Nhập nội dung hướng dẫn tại đây..."
            minHeight="350px"
            onImageUploadClick={() => handleFileUpload('image')}
            onVideoUploadClick={() => handleFileUpload('video')}
            onAudioUploadClick={() => handleFileUpload('audio')}
            editorClassName="font-headline"
            className="flex flex-col w-full h-full border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm"
          />
        </div>

        {/* Footer */}
        <div className="px-10 py-8 bg-white dark:bg-gray-900/80 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-400">
            <span className="material-symbols-outlined text-xl">info</span>
            <span className="text-xs font-bold uppercase tracking-wider">Tự động đồng bộ với bài tập</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={onClose} disabled={isUploading} className="rounded-2xl font-bold px-8 h-14 hover:bg-slate-200 dark:hover:bg-gray-800 transition-all">Hủy bỏ</Button>
            <Button 
              disabled={isUploading}
              onClick={() => {
                onSave(value);
                onClose();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl px-12 h-14 shadow-xl shadow-blue-500/20 uppercase tracking-widest text-sm transition-all active:scale-95 translate-y-0 hover:-translate-y-1"
            >
              {isUploading ? 'Đang tải file lên...' : 'Lưu & Áp dụng'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
