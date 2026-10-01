'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cancelJoinRequest } from '@/app/student/classes/actions';
import {
  Hourglass,
  GraduationCap,
  Flame,
  BookOpen,
  ArrowRight,
  Plus,
  Sparkles,
  X,
  LogIn,
  School,
  RefreshCw
} from 'lucide-react';

import { useContentStore } from '@/store/useContentStore';

type FormattedClassInfo = {
  id: string;
  status: string;
  joinedAt: string | Date;
  class: {
    id: string;
    name: string;
    teacherName: string;
    totalAssignments: number;
  };
  pendingCount: number;
};

interface StudentClassesTabProps {
  isLoggedIn: boolean;
  locale?: string;
}

export function StudentClassesTab({ isLoggedIn, locale = 'vi' }: StudentClassesTabProps) {
  const router = useRouter();
  const isVi = locale === 'vi';

  const cachedData = useContentStore((s) => (s as any).studentClasses);
  const setCachedData = useContentStore((s) => (s as any).setStudentClasses);

  const activeClasses: FormattedClassInfo[] = cachedData?.activeClasses || [];
  const pendingRequests: FormattedClassInfo[] = cachedData?.pendingRequests || [];

  const [isLoading, setIsLoading] = useState(!cachedData && isLoggedIn);
  const [error, setError] = useState<string | null>(null);

  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [enteringClassId, setEnteringClassId] = useState<string | null>(null);

  // Modal join class
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  const fetchClasses = async (isBackground = false) => {
    if (!isLoggedIn) return;
    if (!isBackground) setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/student/classes');
      if (!res.ok) {
        throw new Error('Failed to load classes');
      }
      const data = await res.json();
      setCachedData(data);
    } catch (err: any) {
      console.error('Error fetching student classes:', err);
      if (!isBackground) {
        setError(err?.message || 'Có lỗi xảy ra khi tải danh sách lớp học');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      if (!cachedData) {
        fetchClasses(false);
      } else {
        // Silent background update (SWR)
        fetchClasses(true);
      }
    }
  }, [isLoggedIn]);

  const handleCancelRequest = async (classId: string) => {
    setCancelingId(classId);
    try {
      await cancelJoinRequest(classId);
      // Remove from pending list locally in store
      if (cachedData) {
        setCachedData({
          ...cachedData,
          pendingRequests: cachedData.pendingRequests.filter((item: any) => item.id !== classId)
        });
      }
    } catch (err) {
      alert(isVi ? 'Không thể hủy yêu cầu này.' : 'Failed to cancel request.');
    } finally {
      setCancelingId(null);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;
    router.push(`/join/${code}`);
  };

  const gradients = [
    'from-blue-600 via-indigo-500 to-violet-600',
    'from-amber-400 via-orange-500 to-rose-500',
    'from-emerald-400 via-teal-500 to-sky-500',
    'from-fuchsia-500 via-purple-500 to-blue-500',
    'from-cyan-400 via-sky-500 to-indigo-600'
  ];

  // 1. Trạng thái khách (Chưa đăng nhập) - Cách A thân thiện
  if (!isLoggedIn) {
    return (
      <div className="w-full py-10 px-4 flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="max-w-lg w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-2 border-amber-200/80 dark:border-amber-700/50 rounded-[36px] p-8 sm:p-10 shadow-xl shadow-amber-500/5 flex flex-col items-center text-center relative overflow-hidden">
          {/* Faint decorative background circle */}
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-200/40 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-emerald-200/40 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Cute mascot / icon container */}
          <div className="size-24 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/30 border-2 border-amber-300/60 dark:border-amber-600/40 flex items-center justify-center mb-6 shadow-inner relative group">
            <span className="material-symbols-rounded !text-5xl text-amber-600 transition-transform group-hover:scale-110">
              school
            </span>
            <div className="absolute -top-1.5 -right-1.5 size-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-md">
              ✨
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white font-headline tracking-tight mb-3">
            {isVi ? 'Lớp học của tôi' : 'My Classroom'}
          </h2>

          <p className="text-sm sm:text-base font-semibold text-slate-600 dark:text-slate-300 max-w-sm mb-6 leading-relaxed">
            {isVi
              ? 'Đăng nhập để xem danh sách lớp học và làm bài tập từ thầy cô.'
              : 'Sign in to view your enrolled classes and do assignments assigned by your teacher.'}
          </p>

          {/* Gamified perk pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8 max-w-sm">
            <span className="px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
              🎒 {isVi ? 'Tham gia lớp thầy cô' : 'Join classes'}
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              📝 {isVi ? 'Nhận bài tập mới' : 'New assignments'}
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold">
              🏆 {isVi ? 'Theo dõi điểm số' : 'Track progress'}
            </span>
          </div>

          <Link
            href="/login?callbackUrl=/?tab=classes"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm tracking-wide shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5"
          >
            <LogIn className="w-4 h-4" />
            <span>{isVi ? 'Đăng nhập ngay' : 'Sign In Now'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // 2. Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-9 w-36 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white/70 dark:bg-slate-800/70 border-2 border-slate-200 dark:border-slate-700 rounded-[28px] overflow-hidden flex flex-col justify-between h-[340px]"
            >
              <div className="h-28 bg-slate-200 dark:bg-slate-700 w-full" />
              <div className="p-5 space-y-4 flex-1">
                <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="h-12 bg-slate-100 dark:bg-slate-700/60 rounded-xl" />
                  <div className="h-12 bg-slate-100 dark:bg-slate-700/60 rounded-xl" />
                </div>
              </div>
              <div className="p-5 pt-0">
                <div className="h-11 bg-slate-200 dark:bg-slate-700 rounded-xl w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. Error state
  if (error) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-red-100 dark:border-red-900/30">
        <p className="text-red-600 font-bold mb-4">{error}</p>
        <button
          onClick={() => {
            fetchClasses();
          }}
          className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-white rounded-xl font-bold text-xs inline-flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Thử lại
        </button>
      </div>
    );
  }

  const hasAnyClasses = activeClasses.length > 0 || pendingRequests.length > 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header bar with Quick Join Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-headline tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-rounded !text-3xl text-amber-500">school</span>
            {isVi ? 'Lớp học của tôi' : 'My Classes'}
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            {isVi
              ? 'Theo dõi bài tập và tham gia các lớp học của bạn'
              : 'Track your assignments and join teacher classes'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsJoinModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm tracking-wide shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{isVi ? 'Tham gia lớp mới' : 'Join New Class'}</span>
        </button>
      </div>

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <Hourglass className="w-4 h-4 animate-spin text-amber-500" style={{ animationDuration: '4s' }} />
              {isVi ? 'Đang chờ duyệt' : 'Pending Approval'}
            </span>
            <span className="h-5 px-2 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center justify-center font-bold">
              {pendingRequests.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {pendingRequests.map((item) => (
              <div
                key={item.id}
                className="relative p-5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-2 border-amber-200/80 dark:border-amber-700/50 rounded-[28px] shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 rounded-full">
                      {isVi ? 'Chờ duyệt' : 'Pending'}
                    </span>
                    <span className="text-[11px] font-bold text-amber-600">
                      {isVi ? 'Chờ giáo viên' : 'Waiting teacher'}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white line-clamp-1 mb-1">
                    {item.class.name}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {isVi ? 'Giáo viên' : 'Teacher'}: {item.class.teacherName}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-100 dark:border-amber-900/40">
                  <button
                    onClick={() => handleCancelRequest(item.id)}
                    disabled={cancelingId === item.id}
                    className="w-full py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {cancelingId === item.id
                      ? isVi
                        ? 'Đang hủy...'
                        : 'Canceling...'
                      : isVi
                      ? 'Hủy yêu cầu'
                      : 'Cancel request'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Classes Grid */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {activeClasses.map((item, i) => {
            const bgGradient = gradients[i % gradients.length];
            const hasPending = item.pendingCount > 0;

            return (
              <Link
                key={item.id}
                href={`/student/classes/${item.id}`}
                prefetch={true}
                data-no-global-loader="true"
                onMouseEnter={() => router.prefetch(`/student/classes/${item.id}`)}
                onClick={() => setEnteringClassId(item.id)}
                className={`group relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-2 border-white/80 dark:border-slate-700/80 rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between cursor-pointer block no-underline text-inherit ${
                  enteringClassId === item.id ? 'ring-2 ring-blue-500/80 pointer-events-none' : ''
                }`}
              >
                {/* Playful Banner Header */}
                <div
                  className={`h-28 sm:h-32 w-full bg-gradient-to-br ${bgGradient} p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between`}
                >
                  {/* Decorative faint background watermark */}
                  <div className="absolute right-0 bottom-0 opacity-20 translate-x-3 translate-y-3 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                    <GraduationCap className="w-32 h-32 text-white stroke-[1.5px] -rotate-12" />
                  </div>
                  <div className="absolute -left-6 -top-6 w-24 h-24 bg-white/15 rounded-full blur-xl pointer-events-none" />

                  {/* Top Pill Badges */}
                  <div className="flex items-center justify-between z-10 w-full">
                    <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-black/20 backdrop-blur-md text-white border border-white/20 shadow-xs flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {isVi ? 'Lớp học' : 'Class'}
                    </span>

                    {hasPending ? (
                      <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-black bg-white/95 text-rose-600 shadow-md flex items-center gap-1 border border-rose-100 animate-pulse">
                        <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                        {item.pendingCount} {isVi ? 'bài mới' : 'new'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-black bg-white/95 text-emerald-600 shadow-md flex items-center gap-1 border border-emerald-100">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        {isVi ? 'Đã xong' : 'All done'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Class Info & Metrics */}
                <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between gap-5">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {item.class.name}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1.5">
                      <span className="size-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center text-[11px] shrink-0">
                        👩‍🏫
                      </span>
                      <span className="truncate">
                        {isVi ? 'GV' : 'Teacher'}:{' '}
                        <strong className="text-slate-700 dark:text-slate-200">
                          {item.class.teacherName}
                        </strong>
                      </span>
                    </p>
                  </div>

                  {/* Gamified Stat Chips */}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="bg-rose-50/80 dark:bg-rose-950/20 border border-rose-100/80 dark:border-rose-900/30 p-2.5 sm:p-3 rounded-2xl flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <div className="size-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                        <Flame className="w-4 h-4 fill-rose-500 text-rose-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider leading-none mb-1 truncate">
                          {isVi ? 'Chờ làm' : 'To Do'}
                        </p>
                        <p className="font-black text-slate-900 dark:text-white text-sm sm:text-base leading-none truncate">
                          {item.pendingCount} {isVi ? 'bài' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50/80 dark:bg-blue-950/20 border border-blue-100/80 dark:border-blue-900/30 p-2.5 sm:p-3 rounded-2xl flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider leading-none mb-1 truncate">
                          {isVi ? 'Tổng số' : 'Total'}
                        </p>
                        <p className="font-black text-slate-900 dark:text-white text-sm sm:text-base leading-none truncate">
                          {item.class.totalAssignments} {isVi ? 'bài' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Playful CTA Button */}
                  <div
                    className={`w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-md shadow-blue-500/20 group-hover:shadow-xl group-hover:shadow-blue-500/30 group-hover:from-blue-700 group-hover:to-indigo-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                      enteringClassId === item.id ? 'from-blue-700 to-indigo-800 opacity-95' : ''
                    }`}
                  >
                    {enteringClassId === item.id ? (
                      <>
                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>{isVi ? 'Đang vào lớp...' : 'Entering...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{isVi ? 'Vào lớp học ngay' : 'Enter Class'}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Dashed Join New Class Card */}
          <div
            onClick={() => setIsJoinModalOpen(true)}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500/80 bg-white/40 dark:bg-slate-800/40 hover:bg-white/90 dark:hover:bg-slate-800/90 rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 flex flex-col items-center justify-center text-center group cursor-pointer transition-all duration-300 hover:-translate-y-1.5 shadow-xs min-h-[300px]"
          >
            <div className="size-14 sm:size-16 rounded-2xl sm:rounded-3xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <Plus className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5px]" />
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors mb-1.5">
              {isVi ? 'Tham gia lớp mới' : 'Join a Class'}
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-xs mb-5">
              {isVi
                ? 'Nhập mã tham gia (Join Code) 6 ký tự do thầy cô cung cấp để vào lớp.'
                : 'Enter the 6-character Join Code provided by your teacher to join.'}
            </p>
            <span className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 font-extrabold text-xs transition-colors border border-slate-200/60 dark:border-slate-600">
              + {isVi ? 'Nhập mã tham gia' : 'Enter Join Code'}
            </span>
          </div>
        </div>
      </section>

      {/* Join Class Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {isVi ? 'Tham gia lớp học' : 'Join Classroom'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsJoinModalOpen(false);
                  setJoinCodeInput('');
                }}
                className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  {isVi ? 'Mã lớp học (6 ký tự)' : 'Class Code (6 characters)'}
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 2KDC6D"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  maxLength={10}
                  autoFocus
                  className="w-full text-center text-2xl font-mono font-black tracking-widest py-3 px-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none uppercase bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsJoinModalOpen(false);
                    setJoinCodeInput('');
                  }}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  {isVi ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!joinCodeInput.trim()}
                  className="flex-1 py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isVi ? 'Vào lớp 🚀' : 'Join Class 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
