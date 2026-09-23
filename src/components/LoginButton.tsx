"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createPortal } from "react-dom"
import Link from "next/link"
import { StudentLoginForm } from "@/components/shared/StudentLoginForm"
import { TeacherLoginForm } from "@/components/shared/TeacherLoginForm"
import { ArrowLeft } from "lucide-react"

interface LoginButtonProps {
  children: React.ReactNode
  className?: string
  defaultView?: "role" | "studentLogin" | "teacherLogin"
  onClick?: () => void
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: "role" | "studentLogin" | "teacherLogin"
}

const MODAL_DICT = {
  vi: {
    welcome: "Chào mừng bạn! 👋",
    selectRole: "Vui lòng chọn vai trò để tiếp tục:",
    teacher: "Giáo viên",
    teacherDesc: "Soạn bài giảng, tạo mini-game, quản lý lớp học và theo dõi tiến độ.",
    student: "Học sinh",
    studentDesc: "Luyện từ vựng qua flashcard, làm bài tập và tham gia các trò chơi tương tác.",
    back: "Quay lại",
  },
  en: {
    welcome: "Welcome! 👋",
    selectRole: "Please select your role to continue:",
    teacher: "Teacher",
    teacherDesc: "Create lessons, interactive mini-games, and manage classroom assignments.",
    student: "Student",
    studentDesc: "Practice vocabulary with flashcards, complete assignments, and play games.",
    back: "Back",
  },
};

function ModalLanguageSwitcher({ locale, onChange }: { locale: "vi" | "en"; onChange: (l: "vi" | "en") => void }) {
  return (
    <div className="flex items-center bg-neutral-100 dark:bg-gray-800 p-0.5 rounded-full border border-neutral-200 dark:border-gray-700 text-[11px] font-bold">
      <button
        type="button"
        onClick={() => onChange("vi")}
        className={`px-2 py-0.5 rounded-full transition-all flex items-center gap-1 ${
          locale === "vi" 
            ? "bg-white dark:bg-gray-700 text-primary shadow-sm font-black" 
            : "text-neutral-500 hover:text-neutral-800"
        }`}
      >
        <span>🇻🇳</span>
        <span>VI</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`px-2 py-0.5 rounded-full transition-all flex items-center gap-1 ${
          locale === "en" 
            ? "bg-white dark:bg-gray-700 text-primary shadow-sm font-black" 
            : "text-neutral-500 hover:text-neutral-800"
        }`}
      >
        <span>🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
}

export function LoginModal({ isOpen, onClose, defaultView = "role" }: LoginModalProps) {
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<"role" | "studentLogin" | "teacherLogin">(defaultView)
  const [locale, setLocale] = useState<"vi" | "en">("vi")
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const handleLocaleChange = (e: any) => {
      if (e.detail === "vi" || e.detail === "en") {
        setLocale(e.detail);
      }
    };
    window.addEventListener("locale-change", handleLocaleChange);
    return () => window.removeEventListener("locale-change", handleLocaleChange);
  }, [])

  useEffect(() => {
    if (isOpen) {
      setView(defaultView)
      // Detect locale from cookie or localStorage or /api/locale
      if (typeof window !== "undefined") {
        const getCookie = (name: string) => {
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          return match ? match[2] : null;
        };
        const savedLocale = getCookie("NEXT_LOCALE") || localStorage.getItem("preferred-locale");
        if (savedLocale === "vi" || savedLocale === "en") {
          setLocale(savedLocale as "vi" | "en");
        } else {
          fetch("/api/locale")
            .then((res) => res.json())
            .then((data) => {
              if (data?.locale === "vi" || data?.locale === "en") {
                setLocale(data.locale);
                window.dispatchEvent(new CustomEvent("locale-change", { detail: data.locale }));
              }
            })
            .catch(() => {});
        }
      }
    }
  }, [isOpen, defaultView])

  const changeLocale = async (newLocale: "vi" | "en") => {
    if (newLocale === locale) return;
    setLocale(newLocale);
    try {
      document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
      localStorage.setItem("preferred-locale", newLocale);
      window.dispatchEvent(new CustomEvent("locale-change", { detail: newLocale }));
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: newLocale }),
      });
    } catch (err) {
      console.error("Failed to update locale:", err);
    }
  };

  const handleClose = () => {
    onClose()
    setTimeout(() => setView(defaultView), 200)
  }

  if (!isOpen || !mounted) return null;

  const t = MODAL_DICT[locale] || MODAL_DICT.vi;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#111418]/60 backdrop-blur-sm overflow-y-auto">
      <div className={`bg-white dark:bg-gray-900 w-full ${view === 'role' ? 'max-w-lg' : 'max-w-2xl'} rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-left my-8 relative max-h-[90vh] flex flex-col`}>
        
        {view === 'role' && (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="px-8 pt-8 pb-4 flex items-center justify-between shrink-0">
              <h2 className="text-2xl font-black text-[#111418] dark:text-white">{t.welcome}</h2>
              <div className="flex items-center gap-3">
                <ModalLanguageSwitcher locale={locale} onChange={changeLocale} />
                <button 
                  onClick={handleClose}
                  className="size-10 flex items-center justify-center rounded-full hover:bg-[#f0f2f4] dark:hover:bg-gray-800 text-[#617589] transition-colors"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            
            <div className="px-8 py-4 overflow-y-auto no-scrollbar flex-1 pb-8">
              <p className="text-sm text-neutral-500 dark:text-gray-400 mb-6 font-medium">
                {t.selectRole}
              </p>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => setView("teacherLogin")}
                  className="flex items-center gap-6 p-6 border-2 border-neutral-200 dark:border-gray-800 rounded-2xl hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-gray-800 dark:hover:border-purple-500 hover:shadow-md transition-all group text-left"
                >
                  <div className="size-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-4xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                    👨‍🏫
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-neutral-800 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                      {t.teacher}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {t.teacherDesc}
                    </p>
                  </div>
                </button>

                <button 
                  onClick={() => setView("studentLogin")}
                  className="flex items-center gap-6 p-6 border-2 border-neutral-200 dark:border-gray-800 rounded-2xl hover:border-green-500 hover:bg-green-50/50 dark:hover:bg-gray-800 dark:hover:border-green-500 hover:shadow-md transition-all group text-left"
                >
                  <div className="size-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-4xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                    👨‍🎓
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-neutral-800 dark:text-gray-100 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
                      {t.student}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {t.studentDesc}
                    </p>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="px-8 pb-8 pt-4 empty:hidden"></div>
          </div>
        )}

        {view === 'studentLogin' && (
          <div className="flex flex-col max-h-[85vh]">
            <div className="relative h-16 shrink-0 px-8 border-b border-neutral-100 dark:border-gray-800 flex items-center justify-between">
              {defaultView === "role" ? (
                <button 
                  onClick={() => setView("role")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-gray-800 text-neutral-500 text-sm font-semibold transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t.back}
                </button>
              ) : <div />}
              <div className="flex items-center gap-3">
                <ModalLanguageSwitcher locale={locale} onChange={changeLocale} />
                <button 
                  onClick={handleClose}
                  className="size-10 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-gray-800 text-neutral-500 transition-colors"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
              <StudentLoginForm onSuccess={handleClose} />
            </div>
          </div>
        )}

        {view === 'teacherLogin' && (
          <div className="flex flex-col max-h-[85vh]">
            <div className="relative h-16 shrink-0 px-8 border-b border-neutral-100 dark:border-gray-800 flex items-center justify-between">
              <button 
                onClick={() => setView("role")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-gray-800 text-neutral-500 text-sm font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.back}
              </button>
              <div className="flex items-center gap-3">
                <ModalLanguageSwitcher locale={locale} onChange={changeLocale} />
                <button 
                  onClick={handleClose}
                  className="size-10 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-gray-800 text-neutral-500 transition-colors"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
              <TeacherLoginForm onSuccess={handleClose} />
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function LoginButton({ children, className, defaultView, onClick }: LoginButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeView, setActiveView] = useState<"role" | "studentLogin" | "teacherLogin" | undefined>(defaultView)
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorParam = searchParams?.get("error")
    if (errorParam === "RoleStudentExists" && defaultView === "teacherLogin") {
      setActiveView("teacherLogin")
      setIsOpen(true)
    } else if (errorParam === "RoleTeacherExists" && defaultView !== "teacherLogin") {
      setActiveView("studentLogin")
      setIsOpen(true)
    }
  }, [searchParams, defaultView])

  const handleClick = () => {
    if (onClick) onClick();
    setActiveView(defaultView);
    setIsOpen(true);
  };

  return (
    <>
      <button onClick={handleClick} className={className}>
        {children}
      </button>

      <LoginModal isOpen={isOpen} onClose={() => setIsOpen(false)} defaultView={activeView || defaultView} />
    </>
  )
}
