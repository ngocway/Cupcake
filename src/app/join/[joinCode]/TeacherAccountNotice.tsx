'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { ArrowRightLeft, Loader2, ArrowRight } from 'lucide-react';

interface TeacherAccountNoticeProps {
  email?: string | null;
  joinCode: string;
}

export function TeacherAccountNotice({ email, joinCode }: TeacherAccountNoticeProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSwitchAccount = async () => {
    try {
      setIsSigningOut(true);
      await signOut({ callbackUrl: `/join/${joinCode}` });
    } catch (err) {
      console.error('Sign out error:', err);
      setIsSigningOut(false);
    }
  };

  return (
    <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-6 text-center my-2">
      <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-3.5 text-2xl shadow-sm">
        👨‍🏫
      </div>
      
      <h3 className="text-lg font-black text-amber-900 mb-2">
        Vui lòng dùng tài khoản Học sinh để tham gia lớp
      </h3>
      
      <p className="text-slate-600 text-xs sm:text-sm mb-5 leading-relaxed max-w-sm mx-auto">
        Bạn hiện đang đăng nhập với tài khoản Giáo viên{email ? <> (<strong>{email}</strong>)</> : null}. 
        Để tham gia lớp học này, vui lòng chuyển sang tài khoản Học sinh.
      </p>

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={handleSwitchAccount}
          disabled={isSigningOut}
          className="w-full px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-70"
        >
          {isSigningOut ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang đăng xuất...</span>
            </>
          ) : (
            <>
              <ArrowRightLeft className="w-4 h-4" />
              <span>Đổi sang tài khoản Học sinh</span>
            </>
          )}
        </button>

        <Link
          href="/teacher/classes"
          className="w-full px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5"
        >
          <span>Về trang quản lý lớp học</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
