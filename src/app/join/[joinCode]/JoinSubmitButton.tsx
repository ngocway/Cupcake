'use client';

import React, { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight } from 'lucide-react';

interface JoinSubmitButtonProps {
  classId: string;
  isAutoApprove: boolean;
  onJoin: () => Promise<{ success: boolean; redirectUrl?: string; error?: string }>;
}

export function JoinSubmitButton({ classId, isAutoApprove, onJoin }: JoinSubmitButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 1. Tải trước tài nguyên trang lớp học trong nền (Prefetching) ngay khi component xuất hiện
  useEffect(() => {
    if (isAutoApprove && classId) {
      router.prefetch(`/student/classes/${classId}`);
    }
  }, [classId, isAutoApprove, router]);

  const handleJoin = () => {
    startTransition(async () => {
      try {
        const result = await onJoin();
        if (result?.success && result.redirectUrl) {
          // 2. Chuyển hướng Client-side ngay lập tức -> Hiển thị tức thì Skeleton Loading của lớp học
          router.push(result.redirectUrl);
        } else if (result?.error) {
          alert(result.error);
        } else {
          router.refresh();
        }
      } catch (err: any) {
        console.error('Join class error:', err);
        alert(err.message || 'Có lỗi xảy ra khi tham gia lớp');
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleJoin}
      disabled={isPending}
      className={`w-full px-6 py-3.5 font-bold rounded-xl text-white transition-all flex items-center justify-center gap-2.5 focus:ring-4 select-none ${
        isAutoApprove
          ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 focus:ring-emerald-600/30'
          : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 focus:ring-blue-600/30'
      } ${isPending ? 'opacity-80 cursor-wait' : 'cursor-pointer active:scale-[0.98]'}`}
    >
      {isPending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          <span>{isAutoApprove ? 'Đang vào lớp...' : 'Đang gửi yêu cầu...'}</span>
        </>
      ) : (
        <>
          <span>{isAutoApprove ? 'Tham gia ngay' : 'Gửi yêu cầu tham gia'}</span>
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  );
}
