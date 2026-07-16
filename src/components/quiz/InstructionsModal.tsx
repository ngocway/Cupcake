"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CustomRichTextEditor } from '@/components/ui/CustomRichTextEditor';

interface InstructionsModalProps {
initialValue: string;
initialTranslations?: Record<string, string> | null;
initialInstructionsImageUrl?: string | null;
topicTitle?: string;
onClose: () => void;
onSave: (value: string, translations: Record<string, string> | null, imageUrl: string | null) => void;
}

const LANGUAGES = [
{ code: 'en', flag: '🇬🇧', label: 'EN' },
{ code: 'vi', flag: '🇻🇳', label: 'VI' },
{ code: 'th', flag: '🇹🇭', label: 'TH' },
{ code: 'id', flag: '🇮🇩', label: 'ID' },
{ code: 'zh', flag: '🇨🇳', label: 'ZH' },
{ code: 'hi', flag: '🇮🇳', label: 'HI' },
{ code: 'ja', flag: '🇯🇵', label: 'JA' },
{ code: 'es', flag: '🇪🇸', label: 'ES' },
{ code: 'ar', flag: '🇸🇦', label: 'AR' },
{ code: 'fr', flag: '🇫🇷', label: 'FR' },
{ code: 'ko', flag: '🇰🇷', label: 'KO' },
{ code: 'pt', flag: '🇵🇹', label: 'PT' },
{ code: 'ru', flag: '🇷🇺', label: 'RU' },
{ code: 'de', flag: '🇩🇪', label: 'DE' }
];

export function InstructionsModal({
initialValue,
initialTranslations,
initialInstructionsImageUrl,
topicTitle,
onClose,
onSave
}: InstructionsModalProps) {
const [allTranslations, setAllTranslations] = useState<Record<string, string>>({
en: initialValue || '',
...(initialTranslations || {})
});
const [activeLang, setActiveLang] = useState<string>('en');
const [isUploading, setIsUploading] = useState(false);
const editorRef = useRef<HTMLDivElement>(null);

  // Instructions Image Upload States
  const [instructionsImageUrl, setInstructionsImageUrl] = useState<string | null>(initialInstructionsImageUrl || null);
  const [isUploadingInstructionsImage, setIsUploadingInstructionsImage] = useState(false);
  const instructionsFileInputRef = useRef<HTMLInputElement>(null);

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
setAllTranslations(prev => ({
...prev,
[activeLang]: editorRef.current?.innerHTML || ''
}));
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
<div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh] border border-white/20">

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
<div className="flex-1 bg-slate-50 dark:bg-gray-900 p-6 overflow-y-auto flex flex-col">

{/* Language Selection Tabs */}
<div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-gray-800 pb-3 mb-4 overflow-x-auto custom-scrollbar shrink-0">
<span className="text-xs font-black text-slate-400 mr-2 flex items-center gap-1.5 uppercase tracking-wider font-headline">
<span className="material-symbols-outlined text-[18px]">translate</span>
Bản dịch
</span>
<div className="flex items-center gap-1.5">
{LANGUAGES.map((lang) => (
<button
key={lang.code}
type="button"
onClick={() => setActiveLang(lang.code)}
className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
activeLang === lang.code
? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/10'
: 'bg-white hover:bg-slate-50 dark:bg-gray-900 dark:hover:bg-gray-800 text-slate-650 dark:text-slate-350 border-slate-200 dark:border-gray-800'
}`}
title={`Xem bản dịch ${lang.label}`}
>
<span>{lang.flag}</span>
<span>{lang.label}</span>
</button>
))}
</div>
</div>

<CustomRichTextEditor
ref={editorRef}
value={allTranslations[activeLang] || ''}
onChange={(newVal) => {
setAllTranslations(prev => ({
...prev,
[activeLang]: newVal
}));
}}
placeholder="Nhập nội dung hướng dẫn tại đây..."
minHeight="350px"
onImageUploadClick={() => handleFileUpload('image')}
onVideoUploadClick={() => handleFileUpload('video')}
onAudioUploadClick={() => handleFileUpload('audio')}
editorClassName="font-headline"
className="flex flex-col w-full h-[385px] shrink-0 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm"
/>

{/* Instructions Image Upload (Global) */}
<div className="mt-6 border-t border-slate-100 dark:border-gray-800 pt-6 flex flex-col gap-2 shrink-0">
<label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-headline flex items-center gap-1.5">
<span className="material-symbols-outlined text-[18px] text-blue-500 font-bold">photo_library</span>
Ảnh minh họa hướng dẫn bài tập (Hiển thị ở cuối hướng dẫn của tất cả ngôn ngữ)
</label>
<div
onClick={() => !isUploadingInstructionsImage && instructionsFileInputRef.current?.click()}
className={`relative border border-dashed rounded-2xl p-4 transition-all cursor-pointer flex items-center justify-between bg-white dark:bg-gray-900 ${
instructionsImageUrl
? 'border-blue-500 bg-blue-50/5'
: 'border-slate-200 dark:border-gray-800 hover:border-slate-350 dark:hover:border-gray-700'
} ${isUploadingInstructionsImage ? 'pointer-events-none opacity-70' : ''}`}
>
{instructionsImageUrl ? (
<div className="flex items-center gap-4 w-full justify-between">
<div className="flex items-center gap-4">
<div className="relative h-14 aspect-video rounded-xl overflow-hidden border border-blue-100 dark:border-blue-900/50 shadow-sm shrink-0">
<img
src={instructionsImageUrl}
alt="Instructions image"
className="w-full h-full object-cover"
/>
</div>
<div>
<p className="text-sm font-bold text-blue-600 dark:text-blue-400">Đã tải ảnh hướng dẫn lên</p>
<p className="text-xs text-slate-400 mt-0.5 font-semibold">Bấm để thay đổi ảnh minh họa khác</p>
</div>
</div>
<button
type="button"
onClick={(e) => {
e.stopPropagation();
setInstructionsImageUrl(null);
if (instructionsFileInputRef.current) instructionsFileInputRef.current.value = '';
}}
className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
>
<span className="material-symbols-outlined text-[16px]">delete</span>
Xóa ảnh
</button>
</div>
) : (
<div className="flex items-center gap-3 text-slate-400 dark:text-slate-550">
{isUploadingInstructionsImage ? (
<>
<span className="material-symbols-outlined text-[24px] text-blue-500 animate-spin shrink-0">sync</span>
<div className="text-left">
<p className="text-xs font-bold text-blue-600 dark:text-blue-400">Đang tải ảnh hướng dẫn lên...</p>
<p className="text-[10px] text-slate-400 font-semibold">Vui lòng đợi giây lát</p>
</div>
</>
) : (
<>
<span className="material-symbols-outlined text-[24px] text-blue-500 shrink-0">cloud_upload</span>
<div className="text-left">
<p className="text-xs font-bold text-slate-600 dark:text-slate-350 font-headline">Tải ảnh hướng dẫn chung cho bài tập (PNG, JPG, WEBP...)</p>
<p className="text-[10px] text-slate-450 font-semibold">Ảnh này sẽ xuất hiện tại cuối tất cả bản dịch</p>
</div>
</>
)}
</div>
)}
<input
type="file"
ref={instructionsFileInputRef}
onChange={async (e) => {
const file = e.target.files?.[0];
if (file) {
if (!file.type.startsWith('image/')) {
alert('Vui lòng chọn một tệp hình ảnh hợp lệ.');
return;
}
setIsUploadingInstructionsImage(true);
try {
const { uploadMedia } = await import('@/actions/upload-actions');
const formData = new FormData();
formData.append('file', file);
const res = await uploadMedia(formData);
if (res.success && res.url) {
setInstructionsImageUrl(res.url);
} else {
alert('Tải ảnh thất bại: ' + res.error);
}
} catch (err: any) {
console.error(err);
alert('Có lỗi xảy ra khi tải ảnh.');
} finally {
setIsUploadingInstructionsImage(false);
}
}
}}
accept="image/*"
className="hidden"
disabled={isUploadingInstructionsImage}
/>
</div>
</div>
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
disabled={isUploading || isUploadingInstructionsImage}
onClick={() => {
const { en, ...restTrans } = allTranslations;
onSave(en || '', restTrans, instructionsImageUrl);
onClose();
}}
className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl px-12 h-14 shadow-xl shadow-blue-500/20 uppercase tracking-widest text-sm transition-all active:scale-95 translate-y-0 hover:-translate-y-1"
>
{isUploading || isUploadingInstructionsImage ? 'Đang tải file lên...' : 'Lưu & Áp dụng'}
</Button>
</div>
</div>
</div>
</div>
);
}
