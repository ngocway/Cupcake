'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  getGrammarLessonHtmlInfo,
  uploadGrammarLessonHtmlFile,
  saveBothGrammarLessonHtml,
  deleteGrammarLessonHtml,
} from '@/actions/grammar-html-actions';
import {
  X,
  Upload,
  Download,
  Eye,
  Code,
  Trash2,
  RefreshCw,
  CheckCircle,
  ExternalLink,
  Sparkles,
  Cloud,
  FileCode,
  AlertCircle,
  Save,
} from 'lucide-react';

interface GrammarHtmlEditorModalProps {
  classId: string;
  assignmentId: string;
  assignmentTitle: string;
  onClose: () => void;
  onSaved?: () => void;
}

export function GrammarHtmlEditorModal({
  classId,
  assignmentId,
  assignmentTitle,
  onClose,
  onSaved,
}: GrammarHtmlEditorModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeLang, setActiveLang] = useState<'vi' | 'en'>('vi');
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('preview');

  // Lesson data from server
  const [data, setData] = useState<{
    assignmentTitle: string;
    className: string;
    groupTitle: string;
    lessonId: string | null;
    cdnUrlEn: string | null;
    cdnUrlVi: string | null;
    isCustomizedForClass: boolean;
  } | null>(null);

  // Content state
  const [htmlVi, setHtmlVi] = useState('');
  const [htmlEn, setHtmlEn] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch initial info
  useEffect(() => {
    let isMounted = true;
    async function loadInfo() {
      setLoading(true);
      try {
        const res = await getGrammarLessonHtmlInfo(classId, assignmentId);
        if (isMounted && res.success) {
          setData({
            assignmentTitle: res.assignmentTitle,
            className: res.className,
            groupTitle: res.groupTitle,
            lessonId: res.lessonId,
            cdnUrlEn: res.cdnUrlEn,
            cdnUrlVi: res.cdnUrlVi,
            isCustomizedForClass: res.isCustomizedForClass,
          });
          setHtmlVi(res.htmlVi || '');
          setHtmlEn(res.htmlEn || '');
          setIsDirty(false);
        }
      } catch (err: any) {
        console.error('Error fetching grammar lesson HTML info:', err);
        showToast(err.message || 'Không thể tải thông tin bài học', 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadInfo();
    return () => {
      isMounted = false;
    };
  }, [classId, assignmentId]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processHtmlFile(file);
    if (e.target) e.target.value = '';
  };

  const processHtmlFile = (file: File) => {
    if (!file.name.endsWith('.html') && !file.type.includes('html')) {
      showToast('Vui lòng chọn file định dạng .html', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (typeof content === 'string') {
        if (activeLang === 'vi') {
          setHtmlVi(content);
        } else {
          setHtmlEn(content);
        }
        setIsDirty(true);
        showToast(`Đã nạp file "${file.name}" (${(file.size / 1024).toFixed(1)} KB) thành công! Bấm "Lưu lên Cloudflare R2" để áp dụng.`);
      }
    };
    reader.readAsText(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processHtmlFile(file);
  };

  // Save current active language or both to Cloudflare R2
  const handleSaveToR2 = async () => {
    const currentContent = activeLang === 'vi' ? htmlVi : htmlEn;
    if (!currentContent.trim()) {
      showToast('Nội dung HTML không được để trống.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await uploadGrammarLessonHtmlFile({
        classId,
        assignmentId,
        lang: activeLang,
        htmlContent: currentContent,
      });

      if (res.success) {
        setIsDirty(false);
        setData((prev) =>
          prev
            ? {
                ...prev,
                [activeLang === 'vi' ? 'cdnUrlVi' : 'cdnUrlEn']: res.url,
                isCustomizedForClass: true,
              }
            : null
        );
        showToast(`Đã lưu bản ${activeLang.toUpperCase()} lên Cloudflare R2 thành công!`);
        onSaved?.();
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu lên Cloudflare R2', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Save both languages at once
  const handleSaveBothToR2 = async () => {
    setSaving(true);
    try {
      const res = await saveBothGrammarLessonHtml({
        classId,
        assignmentId,
        htmlEn: htmlEn.trim() || undefined,
        htmlVi: htmlVi.trim() || undefined,
      });

      if (res.success) {
        setIsDirty(false);
        setData((prev) =>
          prev
            ? {
                ...prev,
                ...(res.cdnUrlEn && { cdnUrlEn: res.cdnUrlEn }),
                ...(res.cdnUrlVi && { cdnUrlVi: res.cdnUrlVi }),
                isCustomizedForClass: true,
              }
            : null
        );
        showToast('Đã lưu toàn bộ bài giảng (EN & VI) lên Cloudflare R2 thành công!');
        onSaved?.();
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu lên Cloudflare R2', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Download currently edited HTML
  const handleDownloadHtml = () => {
    const content = activeLang === 'vi' ? htmlVi : htmlEn;
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assignmentTitle.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9-]/g, '_')}_${activeLang}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Delete from R2
  const handleDeleteFromR2 = async () => {
    const ok = window.confirm(
      `Bạn có chắc muốn xóa file ${activeLang.toUpperCase()} trên Cloudflare R2 của lớp này? Nội dung sẽ trở về mặc định.`
    );
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await deleteGrammarLessonHtml({
        classId,
        assignmentId,
        lang: activeLang,
      });

      if (res.success) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                [activeLang === 'vi' ? 'cdnUrlVi' : 'cdnUrlEn']: null,
              }
            : null
        );
        showToast(`Đã xóa file ${activeLang.toUpperCase()} trên Cloudflare R2!`);
        onSaved?.();
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa file trên R2', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const currentContent = activeLang === 'vi' ? htmlVi : htmlEn;
  const currentCdnUrl = activeLang === 'vi' ? data?.cdnUrlVi : data?.cdnUrlEn;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[92vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`absolute top-4 right-4 z-50 px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-rose-500 text-white border-rose-400'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* 1. Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs border border-indigo-100 dark:border-indigo-900/50">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-slate-800 dark:text-slate-100 truncate">
                  Quản lý file HTML bài giảng
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  Cloudflare R2
                </span>
                {data?.isCustomizedForClass && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Đã tùy biến cho lớp
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {data?.assignmentTitle || assignmentTitle} {data?.groupTitle ? `• ${data.groupTitle}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Sub-Bar: Language Tabs & Controls */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Language Selection */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveLang('vi')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeLang === 'vi'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🇻🇳 Tiếng Việt (VI)</span>
              {data?.cdnUrlVi && (
                <span className="size-2 rounded-full bg-emerald-500 shrink-0" title="Đã có file trên R2" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveLang('en')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeLang === 'en'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🇬🇧 Tiếng Anh (EN)</span>
              {data?.cdnUrlEn && (
                <span className="size-2 rounded-full bg-emerald-500 shrink-0" title="Đã có file trên R2" />
              )}
            </button>
          </div>

          {/* Mode Switcher: Code vs Preview */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-indigo-500" />
              <span>Xem trước</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('code')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'code'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5 text-indigo-500" />
              <span>Mã nguồn HTML</span>
            </button>
          </div>

          {/* File Upload & Download Tools */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".html,text/html"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Chọn file .html từ máy tính của bạn để tải lên"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              <span>Chọn file .html</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadHtml}
              disabled={!currentContent}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Tải nội dung hiện tại về máy tính dạng file .html"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải về</span>
            </button>
          </div>
        </div>

        {/* 3. Drag and Drop Zone Banner (when file dragged over or empty) */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`px-6 py-2.5 transition-colors text-xs font-semibold flex items-center justify-between border-b ${
            isDragging
              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 text-indigo-600'
              : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/60 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>
              {isDragging
                ? 'Thả file .html vào đây để nạp vào bài giảng...'
                : `Đang sửa bản: ${activeLang.toUpperCase()} • Kéo thả file .html vào đây hoặc bấm nút "Chọn file .html"`}
            </span>
          </div>
          {currentCdnUrl ? (
            <a
              href={currentCdnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>Xem trực tiếp trên CDN Cloudflare</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
              Chưa lưu lên Cloudflare R2
            </span>
          )}
        </div>

        {/* 4. Main Body: Code or Live Preview */}
        <div className="flex-1 min-h-0 bg-white dark:bg-slate-950 relative overflow-hidden">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-xs font-bold">Đang tải dữ liệu bài giảng từ Cloudflare...</p>
            </div>
          ) : viewMode === 'code' ? (
            <div className="h-full flex flex-col p-4 bg-slate-950 text-slate-100 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 text-[11px] text-slate-400 border-b border-slate-800 mb-2">
                <span>Trình soạn thảo HTML ({activeLang.toUpperCase()})</span>
                <span>{currentContent.length.toLocaleString()} ký tự</span>
              </div>
              <textarea
                value={currentContent}
                onChange={(e) => {
                  const val = e.target.value;
                  if (activeLang === 'vi') setHtmlVi(val);
                  else setHtmlEn(val);
                  setIsDirty(true);
                }}
                className="flex-1 w-full bg-transparent text-slate-200 outline-none resize-none font-mono text-xs leading-relaxed custom-scrollbar selection:bg-indigo-600 selection:text-white"
                placeholder="Nhập hoặc dán mã HTML bài học tại đây..."
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="h-full w-full bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col">
              {currentContent ? (
                <iframe
                  title="Grammar Lesson HTML Live Preview"
                  srcDoc={currentContent}
                  className="w-full h-full border-0 bg-white"
                  sandbox="allow-same-origin allow-scripts"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <FileCode className="w-12 h-12 stroke-[1.5] text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Chưa có nội dung HTML cho bản {activeLang.toUpperCase()}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Kéo thả file .html từ máy tính của bạn vào đây hoặc chuyển sang tab &quot;Mã nguồn HTML&quot; để dán code.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    Chọn file .html từ máy
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Footer: Save & Status */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {currentCdnUrl && (
              <button
                type="button"
                onClick={handleDeleteFromR2}
                disabled={deleting}
                className="px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Đang xóa...' : `Xóa bản ${activeLang.toUpperCase()} trên R2`}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Đóng
            </button>

            {/* Save Current Lang Button */}
            <button
              type="button"
              onClick={handleSaveToR2}
              disabled={saving || !currentContent}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tải lên Cloudflare R2...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu bản {activeLang.toUpperCase()} lên R2</span>
                </>
              )}
            </button>

            {/* Save Both Button */}
            {(htmlVi && htmlEn) && (
              <button
                type="button"
                onClick={handleSaveBothToR2}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lưu cả 2 bản (EN & VI)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
