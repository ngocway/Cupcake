"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import Link from "next/link"

interface LoginButtonProps {
  children: React.ReactNode
  className?: string
}

export function LoginButton({ children, className }: LoginButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <button onClick={() => setIsOpen(true)} className={className}>
        {children}
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#111418]/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-left">
            <div className="px-8 pt-8 pb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#111418] dark:text-white">Chào mừng bạn 👋</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="size-10 flex items-center justify-center rounded-full hover:bg-[#f0f2f4] dark:hover:bg-gray-800 text-[#617589] transition-colors"
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="px-8 py-4">
              <p className="text-sm text-neutral-500 dark:text-gray-400 mb-6 font-medium">
                Vui lòng chọn vai trò để tiếp tục đăng nhập vào hệ thống
              </p>
              
              <div className="flex flex-col gap-4">
                <Link 
                  href="/teacher/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-6 p-6 border-2 border-neutral-200 dark:border-gray-800 rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-gray-800 dark:hover:border-blue-500 hover:shadow-md transition-all group text-left"
                >
                  <div className="size-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-4xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                    👨‍🏫
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-neutral-800 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Giáo viên</h3>
                    <p className="text-sm text-neutral-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">Truy cập bảng điều khiển, tạo bài tập, theo dõi lớp học và đánh giá quá trình.</p>
                  </div>
                </Link>

                <Link 
                  href="/student/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-6 p-6 border-2 border-neutral-200 dark:border-gray-800 rounded-2xl hover:border-green-500 hover:bg-green-50/50 dark:hover:bg-gray-800 dark:hover:border-green-500 hover:shadow-md transition-all group text-left"
                >
                  <div className="size-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-4xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                    👨‍🎓
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-neutral-800 dark:text-gray-100 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">Học sinh</h3>
                    <p className="text-sm text-neutral-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">Sử dụng mã lớp học hoặc quét mã QR để tham gia và bắt đầu làm bài tập ngay.</p>
                  </div>
                </Link>
              </div>
            </div>
            
            <div className="px-8 pb-8 pt-4 empty:hidden"></div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
