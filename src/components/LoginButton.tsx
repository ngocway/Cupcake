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

export function LoginModal({ isOpen, onClose, defaultView = "role" }: LoginModalProps) {
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<"role" | "studentLogin" | "teacherLogin">(defaultView)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setView(defaultView)
    }
  }, [isOpen, defaultView])

  const handleClose = () => {
    onClose()
    setTimeout(() => setView(defaultView), 200)
  }

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#111418]/60 backdrop-blur-sm overflow-y-auto">
      <div className={`bg-white dark:bg-gray-900 w-full ${view === 'role' ? 'max-w-lg' : 'max-w-2xl'} rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-left my-8 relative max-h-[90vh] flex flex-col`}>
        
        {view === 'role' && (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="px-8 pt-8 pb-4 flex items-center justify-between shrink-0">
              <h2 className="text-2xl font-black text-[#111418] dark:text-white">Welcome 👋</h2>
              <button 
                onClick={handleClose}
                className="size-10 flex items-center justify-center rounded-full hover:bg-[#f0f2f4] dark:hover:bg-gray-800 text-[#617589] transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="px-8 py-4 overflow-y-auto no-scrollbar flex-1 pb-8">
              <p className="text-sm text-neutral-500 dark:text-gray-400 mb-6 font-medium">
                Please select your role to continue logging in
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
                    <h3 className="font-bold text-lg text-neutral-800 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">Teacher</h3>
                    <p className="text-sm text-neutral-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">Access dashboard, create assignments, track classes, and evaluate progress.</p>
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
                    <h3 className="font-bold text-lg text-neutral-800 dark:text-gray-100 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">Student</h3>
                    <p className="text-sm text-neutral-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">Use class code or scan QR code to join and start practicing immediately.</p>
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
              <button 
                onClick={() => setView("role")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-gray-800 text-neutral-500 text-sm font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button 
                onClick={handleClose}
                className="size-10 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-gray-800 text-neutral-500 transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
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
                Back
              </button>
              <button 
                onClick={handleClose}
                className="size-10 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-gray-800 text-neutral-500 transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
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
