"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CreateClassModal } from "./_components/CreateClassModal";
import { ClassStudentPopup } from "./_components/ClassStudentPopup";

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  joinCode: string;
  classCode: string;
  createdAt: string;
  _count: { enrollments: number };
}

const GRADIENT_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-purple-500 to-violet-600",
  "from-sky-500 to-cyan-600",
  "from-slate-600 to-slate-800",
];

function getClassGradient(id: string) {
  // Deterministic color from class ID
  const sum = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return GRADIENT_COLORS[sum % GRADIENT_COLORS.length];
}

export default function ClassesIndexPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Popup state: which class is open
  const [openPopupClassId, setOpenPopupClassId] = useState<string | null>(null);
  const studentBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const anchorRef = useRef<HTMLElement | null>(null);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const handleStudentBadgeClick = (classId: string, btn: HTMLButtonElement | null) => {
    if (openPopupClassId === classId) {
      setOpenPopupClassId(null);
    } else {
      anchorRef.current = btn;
      setOpenPopupClassId(classId);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between border-b border-[#f0f2f4] dark:border-gray-800 pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight">Lớp học của tôi</h1>
          <p className="text-[#617589] dark:text-gray-400">Quản lý danh sách lớp và học sinh của bạn.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Tạo lớp học mới</span>
        </button>
      </div>

      {isLoading ? (
        /* Loading skeletons */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-[#f0f2f4] dark:border-gray-700 animate-pulse">
              <div className="h-32 bg-gray-200 dark:bg-gray-700" />
              <div className="p-5 flex flex-col gap-3">
                <div className="h-5 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : classes.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-[#617589]">
          <span className="material-symbols-outlined text-[56px] opacity-30">class</span>
          <p className="text-lg font-bold text-[#111418] dark:text-white">Bạn chưa có lớp học nào</p>
          <p className="text-sm">Tạo lớp học mới để bắt đầu quản lý học sinh.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-2 flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Tạo lớp học mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {classes.map(cls => (
            <div
              key={cls.id}
              className="relative bg-white dark:bg-gray-800 rounded-xl overflow-visible shadow-sm hover:shadow-md transition-all group border border-transparent hover:border-primary/20"
            >
              {/* Card banner */}
              <Link href={`/teacher/classes/${cls.id}`}>
                <div className={`h-32 bg-gradient-to-r ${getClassGradient(cls.id)} relative p-4`}>
                  <div className="flex justify-between items-start text-white">
                    <span className="bg-white/20 backdrop-blur-md px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                      {cls.description || 'Lớp học'}
                    </span>
                    <button
                      className="size-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                      onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                    >
                      <span className="material-symbols-outlined text-[20px]">settings</span>
                    </button>
                  </div>
                </div>
              </Link>

              {/* Card body */}
              <div className="p-5">
                <Link href={`/teacher/classes/${cls.id}`}>
                  <h3 className="font-bold text-xl mb-1 hover:text-primary transition-colors">{cls.name}</h3>
                </Link>
                <p className="text-sm text-[#617589] mb-4">Mã tham gia: <span className="font-mono font-bold">{cls.joinCode}</span></p>

                <div className="flex items-center justify-between pt-4 border-t border-[#f0f2f4] dark:border-gray-700">
                  {/* Avatar stack */}
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(3, cls._count.enrollments))].map((_, i) => (
                      <div key={i} className="size-8 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-br from-primary/30 to-primary/60" />
                    ))}
                    {cls._count.enrollments > 3 && (
                      <div className="size-8 rounded-full border-2 border-white dark:border-gray-800 bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        +{cls._count.enrollments - 3}
                      </div>
                    )}
                    {cls._count.enrollments === 0 && (
                      <div className="size-8 rounded-full border-2 border-dashed border-[#d0d5dd] dark:border-gray-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px] text-[#617589]">person_add</span>
                      </div>
                    )}
                  </div>

                  {/* Student count badge — click to open popup */}
                  <div className="relative">
                    <button
                      ref={el => { studentBtnRefs.current[cls.id] = el; }}
                      onClick={() => handleStudentBadgeClick(cls.id, studentBtnRefs.current[cls.id])}
                      className={`flex items-center gap-1.5 text-xs font-bold rounded-lg px-2.5 py-1.5 transition-all ${
                        openPopupClassId === cls.id
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'text-[#617589] hover:text-primary hover:bg-primary/5'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">group</span>
                      {cls._count.enrollments} Học sinh
                      <span className="material-symbols-outlined text-[14px]">
                        {openPopupClassId === cls.id ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                      </span>
                    </button>

                    {/* Popup */}
                    {openPopupClassId === cls.id && (
                      <ClassStudentPopup
                        classId={cls.id}
                        className={cls.name}
                        anchorRef={{ current: studentBtnRefs.current[cls.id] }}
                        onClose={() => setOpenPopupClassId(null)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchClasses}
      />
    </div>
  );
}
