'use client';

import React, { useState, useEffect } from 'react';

interface Student {
  id: string;
  name: string;
  email: string;
  isManagedAccount: boolean;
  pin?: string;
}

interface StudentUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onUpdateSuccess?: (updated: { id: string; name: string; email: string }) => void;
}

export function StudentUpdateModal({ isOpen, onClose, student, onUpdateSuccess }: StudentUpdateModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (student) {
      setName(student.name || '');
      setEmail(student.email || '');
      setPin(student.pin || '');
      setError('');
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const generateRandomPIN = () => {
    setPin(Math.floor(1000 + Math.random() * 9000).toString());
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      setError('Vui lòng nhập họ và tên học sinh.');
      return;
    }
    if (pin && !/^\d{4,6}$/.test(pin)) {
      setError('Mã PIN phải là 4-6 chữ số.');
      return;
    }

    setIsUpdating(true);
    setError('');

    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: student.isManagedAccount ? email.trim() : undefined,
          pin: student.isManagedAccount && pin ? pin : undefined,
        }),
      });

      if (!res.ok) {
        let msg = `Lỗi ${res.status}`;
        try {
          const data = await res.json();
          msg = data.error || msg;
        } catch { /* empty body – keep default */ }
        throw new Error(msg);
      }

      const updated = await res.json();
      onUpdateSuccess?.(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi cập nhật.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[520px] bg-white dark:bg-[#101922] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#f0f2f4] dark:border-gray-800 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-[#111418] dark:text-white">Cập nhật thông tin học sinh</h2>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg hover:bg-[#f0f2f4] dark:hover:bg-gray-800 text-[#617589] transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          {/* Tên */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#111418] dark:text-white" htmlFor="update-full-name">
              Họ và tên học sinh
            </label>
            <input
              id="update-full-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập họ và tên"
              className="w-full bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm text-[#111418] dark:text-white placeholder-[#617589] focus:ring-2 focus:ring-primary/50 outline-none transition-all"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#111418] dark:text-white" htmlFor="update-email">
              Địa chỉ Email
            </label>
            <input
              id="update-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!student.isManagedAccount}
              placeholder="email@vi-du.com"
              className="w-full bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm text-[#111418] dark:text-white placeholder-[#617589] focus:ring-2 focus:ring-primary/50 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {!student.isManagedAccount && (
              <p className="text-[11px] text-orange-500 dark:text-orange-400 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                Học sinh tự đăng ký — không thể sửa Email gốc.
              </p>
            )}
          </div>

          {/* PIN — chỉ hiện cho managed account */}
          {student.isManagedAccount && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#111418] dark:text-white" htmlFor="update-pin">
                Mã PIN đăng nhập
              </label>
              <div className="flex gap-2">
                <input
                  id="update-pin"
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="1234"
                  maxLength={6}
                  className="flex-1 bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm text-[#111418] dark:text-white placeholder-[#617589] focus:ring-2 focus:ring-primary/50 outline-none transition-all font-mono tracking-widest"
                />
                <button
                  type="button"
                  onClick={generateRandomPIN}
                  title="Tạo mã ngẫu nhiên"
                  className="size-11 bg-[#f0f2f4] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl flex items-center justify-center text-[#617589] hover:text-primary transition-all"
                >
                  <span className="material-symbols-outlined">casino</span>
                </button>
              </div>
              <p className="text-[11px] text-[#617589] dark:text-gray-400">
                Mã PIN dùng để học sinh đăng nhập vào hệ thống.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#f8f9fa] dark:bg-gray-900/50 border-t border-[#f0f2f4] dark:border-gray-800 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#617589] hover:bg-[#f0f2f4] dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleUpdate}
            disabled={isUpdating || !name.trim()}
            className="px-8 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-md shadow-primary/20 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center gap-2"
          >
            {isUpdating && (
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            )}
            {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
          </button>
        </div>
      </div>
    </div>
  );
}
