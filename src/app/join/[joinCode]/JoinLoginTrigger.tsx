'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { LoginModal } from '@/components/LoginButton';

interface JoinLoginTriggerProps {
  classTitle?: string;
  classId?: string;
  isAutoApprove?: boolean;
  onJoin?: () => Promise<{ success: boolean; redirectUrl?: string; error?: string }>;
}

export function JoinLoginTrigger({ classTitle, classId, isAutoApprove, onJoin }: JoinLoginTriggerProps) {
  const router = useRouter();
  // Tự động mở popup đăng nhập khi user chưa đăng nhập vào link lớp học
  const [isOpen, setIsOpen] = useState(true);

  // Tải trước tài nguyên lớp học trong nền ngay khi modal mở
  useEffect(() => {
    if (classId && isAutoApprove) {
      router.prefetch(`/student/classes/${classId}`);
    }
  }, [classId, isAutoApprove, router]);

  const handleLoginSuccess = async () => {
    // 1. Tự động ghi danh và chuyển thẳng vào lớp học ngay khi đăng nhập thành công
    if (onJoin && isAutoApprove) {
      try {
        const res = await onJoin();
        if (res?.success && res.redirectUrl) {
          router.push(res.redirectUrl);
          return;
        }
      } catch (err) {
        console.error('Auto-join on login error:', err);
      }
    }
    setIsOpen(false);
    router.refresh();
  };

  const handleClose = () => {
    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full px-6 py-3.5 font-bold rounded-xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98] focus:ring-4 focus:ring-emerald-600/30"
      >
        <LogIn className="w-5 h-5 shrink-0" />
        <span>Đăng nhập để tham gia lớp</span>
      </button>

      <LoginModal
        isOpen={isOpen}
        onClose={handleClose}
        onLoginSuccess={handleLoginSuccess}
        defaultView="studentLogin"
        joinNotice={classTitle ? { className: classTitle } : undefined}
      />
    </>
  );
}
