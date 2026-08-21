"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { resetPassword } from "@/actions/auth-actions"
import { ArrowLeft, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"

export function TeacherLoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "RoleStudentExists") {
      setErrorMessage("Tài khoản này đã đăng ký với vai trò Học sinh (Student). Vui lòng chọn tài khoản Google khác để đăng nhập Giáo viên.");
    } else if (errorParam === "RoleTeacherExists") {
      setErrorMessage("Tài khoản này đã đăng ký với vai trò Giáo viên (Teacher).");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMessage("");
    setSuccessMessage("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage("Tài khoản hoặc mật khẩu không chính xác.");
        setIsPending(false);
      } else if (res?.ok) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/teacher");
        }
        router.refresh();
      }
    } catch (err) {
      setErrorMessage("Đã xảy ra sự cố hệ thống.");
      setIsPending(false);
    }
  }

  const handleForgot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    const formData = new FormData(e.currentTarget);
    const res = await resetPassword(formData);
    
    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.success) {
      setSuccessMessage(res.success);
    }
    setIsPending(false);
  }

  const handleGoogleLogin = () => {
    // Set role intent in cookie for NextAuth server callback verification
    document.cookie = "login_role_intent=TEACHER; path=/; max-age=300";
    
    let callbackUrl = "/teacher";
    const existingCallbackUrl = searchParams.get("callbackUrl");
    if (existingCallbackUrl && !existingCallbackUrl.includes("/login")) {
      callbackUrl = existingCallbackUrl;
    }

    signIn("google", { callbackUrl });
  }

  return (
    <div className="max-w-md w-full mx-auto relative z-10 p-2">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 mb-3">
          <span className="material-symbols-outlined text-[32px]">co_present</span>
        </div>
        <h2 className="font-headline font-black text-2xl text-on-surface">Đăng nhập Giáo viên</h2>
        <p className="text-xs text-on-surface-variant font-semibold mt-1">Cổng thông tin Dành cho Giáo viên (Teacher Portal)</p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 text-sm text-rose-700 bg-rose-50 rounded-2xl border border-rose-200 font-bold flex items-start gap-3 animate-in fade-in">
          <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {mode === "forgot" && (
        <div className="mb-6">
          <button 
            onClick={() => { setMode("login"); setErrorMessage(""); setSuccessMessage(""); }}
            className="flex items-center text-purple-700 font-bold text-sm hover:underline mb-4 cursor-pointer bg-purple-50 px-4 py-2 rounded-full w-fit transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Quay lại đăng nhập
          </button>
          <h2 className="font-headline font-black text-2xl text-on-surface mb-1">Khôi phục mật khẩu</h2>
          <p className="text-xs text-on-surface-variant font-medium">Nhập email của bạn để nhận liên kết đặt lại mật khẩu.</p>
        </div>
      )}

      {mode === "login" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Google Sign In Button */}
          <button 
            type="button" 
            onClick={handleGoogleLogin} 
            className="w-full py-3.5 px-6 mb-6 flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 border-purple-100 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            Đăng nhập bằng Google
          </button>

          <div className="relative mb-6 flex items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">hoặc với email</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-600 ml-1" htmlFor="teacher-email">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors w-5 h-5" />
                <input 
                  id="teacher-email" 
                  name="email"
                  type="email" 
                  required
                  placeholder="teacher@example.com" 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold text-sm placeholder:text-slate-300" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-600" htmlFor="teacher-password">Mật khẩu</label>
                <button type="button" onClick={() => { setMode("forgot"); setErrorMessage(""); setSuccessMessage(""); }} className="text-xs font-bold text-purple-600 hover:underline cursor-pointer">Quên mật khẩu?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors w-5 h-5" />
                <input 
                  id="teacher-password" 
                  name="password"
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold text-sm placeholder:text-slate-300" 
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600 transition-colors" 
                  type="button"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isPending}
              className="w-full mt-4 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm uppercase tracking-widest rounded-full shadow-lg shadow-purple-200 transform transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-70 group"
            >
              {isPending ? "Đang xác thực..." : "Đăng nhập Giáo viên"}
              {!isPending && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>
      )}

      {mode === "forgot" && (
        <form onSubmit={handleForgot} className="space-y-4 animate-in fade-in duration-300">
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-600 ml-1" htmlFor="teacher-email-forgot">Địa chỉ Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors w-5 h-5" />
              <input 
                id="teacher-email-forgot" 
                name="email"
                type="email" 
                required
                placeholder="teacher@example.com" 
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold text-sm placeholder:text-slate-300" 
              />
            </div>
          </div>

          {successMessage && (
            <div className="p-4 text-sm text-emerald-700 bg-emerald-50 rounded-2xl border border-emerald-200 font-bold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              {successMessage}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full mt-2 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm uppercase tracking-widest rounded-full shadow-lg shadow-purple-200 transition-all"
          >
            {isPending ? "Đang gửi..." : "Gửi liên kết khôi phục"}
          </button>
        </form>
      )}
    </div>
  )
}
