'use client';

import React from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';

interface JoinSubmitButtonProps {
  isAutoApprove: boolean;
}

export function JoinSubmitButton({ isAutoApprove }: JoinSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full px-6 py-3.5 font-bold rounded-xl text-white transition-all flex items-center justify-center gap-2.5 focus:ring-4 select-none ${
        isAutoApprove
          ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 focus:ring-emerald-600/30'
          : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 focus:ring-blue-600/30'
      } ${pending ? 'opacity-80 cursor-wait' : 'cursor-pointer active:scale-[0.98]'}`}
    >
      {pending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          <span>{isAutoApprove ? 'Đang vào lớp...' : 'Đang gửi yêu cầu...'}</span>
        </>
      ) : (
        <span>{isAutoApprove ? 'Tham gia ngay' : 'Gửi yêu cầu tham gia'}</span>
      )}
    </button>
  );
}
