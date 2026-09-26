"use client";

import React, { useState, useMemo } from 'react';
import { X, Mail, Check, AlertCircle, Users } from 'lucide-react';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onAddSuccess: () => void;
}

export function AddStudentModal({ isOpen, onClose, classId, onAddSuccess }: AddStudentModalProps) {
  const [emailText, setEmailText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Smart Real-time Email Parser & Deduplication
  const { validEmails, duplicateCount, invalidCount } = useMemo(() => {
    if (!emailText.trim()) {
      return { validEmails: [], duplicateCount: 0, invalidCount: 0 };
    }

    // Match all potential email patterns across the whole text (handles Excel, comma, semicolon, newline, <email>)
    const rawMatches = emailText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    
    const validSet = new Set<string>();
    let dupes = 0;

    for (const m of rawMatches) {
      const lower = m.toLowerCase();
      if (!validSet.has(lower)) {
        validSet.add(lower);
      } else {
        dupes++;
      }
    }

    const valids = Array.from(validSet);

    // Rough check for tokens with '@' that failed valid email regex
    const tokens = emailText.split(/[\n,;\s]+/).map(t => t.trim()).filter(Boolean);
    const invalids = tokens.filter(t => t.includes('@') && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(t)).length;

    return {
      validEmails: valids,
      duplicateCount: dupes,
      invalidCount: invalids,
    };
  }, [emailText]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (validEmails.length === 0) return;
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: validEmails }),
      });

      if (!res.ok) {
        let msg = `Lỗi ${res.status}`;
        try {
          const d = await res.json();
          msg = d.error || msg;
        } catch { /* empty */ }
        throw new Error(msg);
      }

      onAddSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi thêm học sinh');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-[#111418]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[620px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-8 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60 shadow-sm shrink-0">
              <Users className="w-5 h-5 stroke-[2.2px]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Thêm học sinh vào lớp</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Dán hoặc nhập danh sách email của học sinh</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="size-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5 stroke-[2px]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-emerald-600 stroke-[2.2px]" />
                <span>Danh sách Email</span>
                <span className="text-red-500">*</span>
              </label>
              {emailText.trim() && (
                <button
                  type="button"
                  onClick={() => setEmailText('')}
                  className="text-xs text-slate-400 hover:text-red-500 font-semibold transition-colors"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            <textarea 
              value={emailText}
              onChange={e => setEmailText(e.target.value)}
              rows={7}
              autoFocus
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none outline-none leading-relaxed" 
              placeholder={`nguyen.an@gmail.com\ntran.binh@gmail.com\nle.hoa@school.edu.vn\n...`}
            />

            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              💡 Hỗ trợ dán trực tiếp từ Excel hoặc phân tách bằng dấu phẩy (<code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 font-mono">,</code>), chấm phẩy (<code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 font-mono">;</code>) hoặc xuống dòng.
            </p>
          </div>

          {/* Realtime Badges & Stats */}
          {emailText.trim() && (
            <div className="flex flex-wrap items-center gap-2 pt-1 animate-in fade-in duration-150">
              {validEmails.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-full text-xs font-black shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[2.5px]" />
                  <span>{validEmails.length} email hợp lệ</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60 rounded-full text-xs font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Chưa tìm thấy địa chỉ email hợp lệ nào</span>
                </span>
              )}

              {duplicateCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-full text-xs font-semibold">
                  Đã tự động lọc {duplicateCount} email trùng
                </span>
              )}

              {invalidCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-full text-xs font-semibold">
                  {invalidCount} đoạn văn bản sai cú pháp email
                </span>
              )}
            </div>
          )}

          {/* Compact Chips Preview of Parsed Emails */}
          {validEmails.length > 0 && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 flex flex-col gap-2 max-h-36 overflow-y-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Học sinh sẽ được thêm vào lớp:</span>
              <div className="flex flex-wrap gap-1.5">
                {validEmails.slice(0, 10).map((email) => (
                  <span 
                    key={email}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium font-mono shadow-xs"
                  >
                    <span>{email}</span>
                  </span>
                ))}
                {validEmails.length > 10 && (
                  <span className="px-2.5 py-1 bg-emerald-100/70 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs font-black">
                    +{validEmails.length - 10} email khác
                  </span>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-7 pt-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || validEmails.length === 0}
            className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>Đang thêm...</span>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5px]" />
                <span>{validEmails.length > 0 ? `Thêm ${validEmails.length} học sinh` : 'Thêm vào lớp'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
