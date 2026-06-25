"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { resetPassword } from "@/actions/auth-actions"
import { useTranslations } from "next-intl"
import { CheckCircle2, ArrowLeft, Mail, Lock, Eye, EyeOff, ArrowRight, HelpCircle, GraduationCap } from "lucide-react"
import Link from "next/link"

export default function TeacherLoginPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  
  // You might want to create a translation namespace for this, 
  // but we'll use student.auth as a fallback or hardcode some strings for now.
  const t = useTranslations("student.auth");

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
        const searchParams = new URLSearchParams(window.location.search);
        const callbackUrl = searchParams.get("callbackUrl");
        router.push(callbackUrl || "/teacher/dashboard");
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
    signIn("google", { callbackUrl: "/teacher/dashboard" });
  }

  return (
    <main className="flex-grow flex flex-col md:flex-row items-stretch min-h-screen bg-background font-body text-on-surface antialiased">
      {/* Left Column: Branding & Benefits */}
      <div className="hidden md:flex md:w-1/2 bg-purple-100 dark:bg-purple-950/20 relative overflow-hidden flex-col justify-center items-center p-16">
        {/* Organic background shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-[3rem_4rem_2.5rem_4.5rem_/_4.5rem_2.5rem_4.5rem_3rem] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/20 rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem] -ml-48 -mb-48"></div>

        {/* Back to Home button */}
        <div className="absolute top-10 left-10 z-20">
          <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full text-sm font-bold text-on-surface hover:bg-white hover:shadow-md transition-all">
            <ArrowLeft className="w-4 h-4" />
            Về trang chủ
          </Link>
        </div>

        <div className="relative z-10 max-w-md text-center">
          <div className="mb-10 inline-flex items-center justify-center w-24 h-24 bg-primary text-white rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem] shadow-xl shadow-primary/20 animate-float">
            <span className="material-symbols-outlined text-[48px] animate-leaf-sway">co_present</span>
          </div>

          <h1 className="font-headline font-black text-5xl text-on-surface mb-6 tracking-tight leading-tight">
            Teach with <span className="text-primary italic relative inline-block">
              Dolcake
              <div className="absolute -bottom-2 left-0 w-full h-3 bg-secondary/30 rounded-full -z-10 -rotate-2"></div>
            </span>
          </h1>

          <p className="text-on-surface-variant text-lg leading-relaxed mb-10 font-medium">
            Empower your teaching with an AI-driven workspace designed to save time and boost student engagement.
          </p>

          <div className="space-y-4 text-left">
            <div className="flex items-start gap-4 p-5 rounded-[1.5rem] bg-white/40 backdrop-blur-sm hover:bg-white/70 hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-white/50 group">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="text-emerald-600 w-5 h-5 stroke-[3px]" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-on-surface">AI-Powered Creation</h3>
                <p className="text-sm text-on-surface-variant mt-1 font-medium">Generate engaging lessons, reading materials, and interactive quizzes in seconds.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-5 rounded-[1.5rem] bg-white/40 backdrop-blur-sm hover:bg-white/70 hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-white/50 group">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="text-secondary-dim w-5 h-5 stroke-[3px]" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-on-surface">Smart Analytics</h3>
                <p className="text-sm text-on-surface-variant mt-1 font-medium">Track student progress, monitor assignment completions, and identify learning gaps effortlessly.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-[1.5rem] bg-white/40 backdrop-blur-sm hover:bg-white/70 hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-white/50 group">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="text-indigo-600 w-5 h-5 stroke-[3px]" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-on-surface">Organized Workspace</h3>
                <p className="text-sm text-on-surface-variant mt-1 font-medium">Manage vocabulary decks, assignments, and class enrollments all in one centralized hub.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="w-full md:w-1/2 bg-background flex flex-col justify-center px-6 py-12 md:px-24 relative overflow-y-auto">
        
        {/* Mobile Header */}
        <div className="md:hidden absolute top-6 left-6 z-20">
          <Link href="/" className="flex items-center gap-2 p-2 bg-white/50 backdrop-blur-sm rounded-full text-sm font-bold text-on-surface">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto relative z-10">
          <div className="md:hidden mb-12 flex flex-col items-center">
            <div className="w-16 h-16 bg-primary text-white rounded-3xl flex items-center justify-center shadow-lg shadow-primary/20 mb-4 animate-float">
              <span className="material-symbols-outlined text-[32px] animate-leaf-sway">co_present</span>
            </div>
            <h2 className="font-headline font-black text-3xl text-primary tracking-tight">Dolcake</h2>
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-[0.2em] mt-1">Teacher Portal</p>
          </div>

          {(mode === "login" || mode === "register") && (
            <div className="flex gap-8 mb-10 border-b border-outline-variant/20 relative">
              <button 
                onClick={() => { setMode("login"); setErrorMessage(""); setSuccessMessage(""); }}
                className={`pb-4 font-headline font-black text-xl transition-all relative ${mode === "login" ? "text-primary" : "text-on-surface-variant/50 hover:text-on-surface"}`}
              >
                Log In
                {mode === "login" && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></div>}
              </button>
              <button 
                onClick={() => { setMode("register"); setErrorMessage(""); setSuccessMessage(""); }}
                className={`pb-4 font-headline font-black text-xl transition-all relative ${mode === "register" ? "text-primary" : "text-on-surface-variant/50 hover:text-on-surface"}`}
              >
                Sign Up
                {mode === "register" && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></div>}
              </button>
            </div>
          )}

          {mode === "forgot" && (
            <div className="mb-10">
              <button 
                onClick={() => { setMode("login"); setErrorMessage(""); setSuccessMessage(""); }}
                className="flex items-center text-primary font-bold text-sm hover:underline mb-6 cursor-pointer bg-primary/5 px-4 py-2 rounded-full w-fit transition-colors hover:bg-primary/10"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Quay lại đăng nhập
              </button>
              <h2 className="font-headline font-black text-3xl text-on-surface mb-2">Khôi phục mật khẩu</h2>
              <p className="text-on-surface-variant font-medium">Nhập email của bạn để nhận liên kết đặt lại mật khẩu.</p>
            </div>
          )}

          {mode === "login" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-8">
                <h2 className="font-headline font-black text-3xl text-on-surface mb-2">Welcome Back</h2>
                <p className="text-on-surface-variant font-medium">Please enter your credentials to access your workspace.</p>
              </div>

              <button type="button" onClick={handleGoogleLogin} className="w-full py-4 px-6 mb-8 flex items-center justify-center gap-3 bg-white border border-outline-variant/30 rounded-2xl font-bold text-on-surface hover:bg-surface-container-low hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                Continue with Google
              </button>

              <div className="relative mb-8 flex items-center">
                <div className="flex-grow border-t border-outline-variant/20"></div>
                <span className="px-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Or with Email</span>
                <div className="flex-grow border-t border-outline-variant/20"></div>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2" htmlFor="email">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors w-5 h-5" />
                    <input 
                      id="email" 
                      name="email"
                      type="email" 
                      required
                      placeholder="name@example.com" 
                      className="w-full pl-14 pr-5 py-4 bg-white border border-outline-variant/30 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all duration-300 font-bold placeholder:text-on-surface-variant/30 shadow-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant" htmlFor="password">Password</label>
                    <button type="button" onClick={() => { setMode("forgot"); setErrorMessage(""); setSuccessMessage(""); }} className="text-xs font-bold text-secondary-dim hover:text-secondary-dim/80 hover:underline cursor-pointer">Forgot Password?</button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors w-5 h-5" />
                    <input 
                      id="password" 
                      name="password"
                      type={showPassword ? "text" : "password"} 
                      required
                      placeholder="••••••••" 
                      className="w-full pl-14 pr-12 py-4 bg-white border border-outline-variant/30 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all duration-300 font-bold placeholder:text-on-surface-variant/30 shadow-sm" 
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary flex items-center justify-center transition-colors" 
                      type="button"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2 ml-2">
                  <input className="w-5 h-5 rounded-md border-outline-variant/40 text-primary focus:ring-primary/50 cursor-pointer" id="remember" type="checkbox"/>
                  <label className="text-sm font-medium text-on-surface-variant cursor-pointer select-none" htmlFor="remember">Keep me logged in</label>
                </div>

                {errorMessage && (
                  <div className="p-4 text-sm text-rose-700 bg-rose-50 rounded-2xl border border-rose-200 font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></div>
                    {errorMessage}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full mt-4 py-4 bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest rounded-full shadow-lg shadow-primary/20 transform transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 group"
                >
                  {isPending ? "Authenticating..." : "Enter Workspace"}
                  {!isPending && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>
            </div>
          )}

          {mode === "register" && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300 text-center py-10">
              <div className="w-20 h-20 bg-secondary/10 text-secondary-dim rounded-full flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10" />
              </div>
              <h2 className="font-headline font-black text-2xl text-on-surface mb-3">Teacher Registration</h2>
              <p className="text-on-surface-variant font-medium mb-8">
                To maintain the quality of our platform, teacher accounts are currently created by invitation only.
              </p>
              
              <div className="p-6 bg-white border border-outline-variant/30 rounded-3xl text-left space-y-4">
                <h3 className="font-bold text-on-surface">Interested in teaching?</h3>
                <p className="text-sm text-on-surface-variant">
                  Please contact our administration team to request a teacher account setup.
                </p>
                <a href="mailto:admin@cupcakes.com" className="inline-flex items-center gap-2 mt-2 px-6 py-3 bg-surface-container-low text-primary font-bold rounded-xl hover:bg-primary/10 transition-colors">
                  <Mail className="w-4 h-4" />
                  Contact Admin
                </a>
              </div>
            </div>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgot} className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2" htmlFor="email-forgot">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors w-5 h-5" />
                  <input 
                    id="email-forgot" 
                    name="email"
                    type="email" 
                    required
                    placeholder="name@example.com" 
                    className="w-full pl-14 pr-5 py-4 bg-white border border-outline-variant/30 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all duration-300 font-bold placeholder:text-on-surface-variant/30 shadow-sm" 
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-4 text-sm text-rose-700 bg-rose-50 rounded-2xl border border-rose-200 font-bold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></div>
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="p-4 text-sm text-emerald-700 bg-emerald-50 rounded-2xl border border-emerald-200 font-bold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                  {successMessage}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isPending}
                className="w-full mt-4 py-4 bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest rounded-full shadow-lg shadow-primary/20 transform transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isPending ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          <footer className="mt-12 pt-8 border-t border-outline-variant/20 text-center">
            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
              By entering, you agree to our 
              <a className="text-primary font-bold hover:underline ml-1" href="#">Terms of Service</a> and 
              <a className="text-primary font-bold hover:underline ml-1" href="#">Privacy Policy</a>.
            </p>
          </footer>
        </div>
        
        <button className="hidden md:flex absolute bottom-8 right-8 bg-white p-4 rounded-full shadow-lg border border-outline-variant/30 text-primary hover:bg-primary/5 transition-all group items-center">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 stroke-[2px]" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 px-1">Help Center</span>
          </div>
        </button>

      </div>
    </main>
  )
}
