"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { registerStudent, resetPassword } from "@/actions/auth-actions"
import { useTranslations } from "next-intl"
import { CheckCircle2, ArrowLeft, Mail, Lock, Eye, EyeOff, ArrowRight, User, HelpCircle } from "lucide-react"

export function StudentLoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
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
        setErrorMessage(t("invalidCredentials"));
        setIsPending(false);
      } else if (res?.ok) {
        if (onSuccess) {
          onSuccess();
        } else {
          const searchParams = new URLSearchParams(window.location.search);
          const callbackUrl = searchParams.get("callbackUrl");
          router.push(callbackUrl || "/student/assignments");
        }
        router.refresh();
      }
    } catch (err) {
      setErrorMessage(t("systemError"));
      setIsPending(false);
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setErrorMessage(t("passwordMismatch"));
      setIsPending(false);
      return;
    }

    const res = await registerStudent(formData);
    
    if (res.error) {
        setErrorMessage(res.error);
        setIsPending(false);
    } else if (res.success) {
        setSuccessMessage(res.success);
        const email = formData.get("email") as string;
        try {
          const signInRes = await signIn("credentials", { email, password, redirect: false });
          if (signInRes?.ok) {
            if (onSuccess) onSuccess();
            else router.push("/student/assignments");
            router.refresh();
          } else {
             setMode("login");
             setIsPending(false);
          }
        } catch (err) {
          setMode("login");
          setIsPending(false);
        }
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
    const searchParams = new URLSearchParams(window.location.search);
    const existingCallbackUrl = searchParams.get("callbackUrl");
    
    let callbackUrl = existingCallbackUrl || window.location.pathname + window.location.search;
    if (callbackUrl.includes('/login')) {
      callbackUrl = '/student/assignments';
    }
    
    signIn("google", { callbackUrl });
  }

  return (
    <div className="max-w-md w-full mx-auto relative z-10 p-2">
      <div className="md:hidden mb-12 flex flex-col items-center">
        <div className="w-16 h-16 bg-primary text-white rounded-3xl flex items-center justify-center shadow-lg shadow-primary/20 mb-4 animate-float">
          <span className="material-symbols-outlined text-[32px] animate-leaf-sway">eco</span>
        </div>
        <h2 className="font-headline font-black text-3xl text-primary tracking-tight">Cupcakes</h2>
        <p className="text-xs text-on-surface-variant font-bold uppercase tracking-[0.2em] mt-1">Student Portal</p>
      </div>

      {(mode === "login" || mode === "register") && (
        <div className="flex gap-8 mb-10 border-b border-outline-variant/20 relative">
          <button 
            onClick={() => { setMode("login"); setErrorMessage(""); setSuccessMessage(""); }}
            className={`pb-4 font-headline font-black text-xl transition-all relative ${mode === "login" ? "text-primary" : "text-on-surface-variant/50 hover:text-on-surface"}`}
          >
            {t("login")}
            {mode === "login" && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => { setMode("register"); setErrorMessage(""); setSuccessMessage(""); }}
            className={`pb-4 font-headline font-black text-xl transition-all relative ${mode === "register" ? "text-primary" : "text-on-surface-variant/50 hover:text-on-surface"}`}
          >
            {t("signup")}
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
            {t("backToLogin")}
          </button>
          <h2 className="font-headline font-black text-3xl text-on-surface mb-2">{t("resetPassword")}</h2>
          <p className="text-on-surface-variant font-medium">{t("forgotSubtitle")}</p>
        </div>
      )}

      {mode === "login" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="mb-8">
            <h2 className="font-headline font-black text-3xl text-on-surface mb-2">{t("welcomeBack")}</h2>
            <p className="text-on-surface-variant font-medium">{t("loginSubtitle")}</p>
          </div>

          <button type="button" onClick={handleGoogleLogin} className="w-full py-4 px-6 mb-8 flex items-center justify-center gap-3 bg-white border border-outline-variant/30 rounded-2xl font-bold text-on-surface hover:bg-surface-container-low hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            {t("continueGoogle")}
          </button>

          <div className="relative mb-8 flex items-center">
            <div className="flex-grow border-t border-outline-variant/20"></div>
            <span className="px-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">{t("orWithEmail")}</span>
            <div className="flex-grow border-t border-outline-variant/20"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2" htmlFor="email">{t("emailLabel")}</label>
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
                <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant" htmlFor="password">{t("passwordLabel")}</label>
                <button type="button" onClick={() => { setMode("forgot"); setErrorMessage(""); setSuccessMessage(""); }} className="text-xs font-bold text-secondary-dim hover:text-secondary-dim/80 hover:underline cursor-pointer">{t("forgotPassword")}</button>
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
              <label className="text-sm font-medium text-on-surface-variant cursor-pointer select-none" htmlFor="remember">{t("keepLoggedIn")}</label>
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
              {isPending ? t("authenticating") : t("enterWorkspace")}
              {!isPending && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>
      )}

      {mode === "register" && (
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="mb-8">
            <h2 className="font-headline font-black text-3xl text-on-surface mb-2">{t("createAccount")}</h2>
            <p className="text-on-surface-variant font-medium">{t("signupSubtitle")}</p>
          </div>

          <button type="button" onClick={handleGoogleLogin} className="w-full py-4 px-6 mb-8 flex items-center justify-center gap-3 bg-white border border-outline-variant/30 rounded-2xl font-bold text-on-surface hover:bg-surface-container-low hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            {t("signupGoogle")}
          </button>

          <div className="relative mb-8 flex items-center">
            <div className="flex-grow border-t border-outline-variant/20"></div>
            <span className="px-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">{t("orWithEmail")}</span>
            <div className="flex-grow border-t border-outline-variant/20"></div>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2" htmlFor="name">{t("fullName")}</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors w-5 h-5" />
                <input 
                  id="name" 
                  name="name"
                  type="text" 
                  required
                  placeholder="John Doe" 
                  className="w-full pl-14 pr-5 py-4 bg-white border border-outline-variant/30 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all duration-300 font-bold placeholder:text-on-surface-variant/30 shadow-sm" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2" htmlFor="email-reg">{t("emailLabel")}</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors w-5 h-5" />
                <input 
                  id="email-reg" 
                  name="email"
                  type="email" 
                  required
                  placeholder="name@example.com" 
                  className="w-full pl-14 pr-5 py-4 bg-white border border-outline-variant/30 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all duration-300 font-bold placeholder:text-on-surface-variant/30 shadow-sm" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2" htmlFor="password-reg">{t("passwordLabel")}</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors w-5 h-5" />
                <input 
                  id="password-reg" 
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

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2" htmlFor="confirmPassword">{t("confirmPassword")}</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors w-5 h-5" />
                <input 
                  id="confirmPassword" 
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••" 
                  className="w-full pl-14 pr-12 py-4 bg-white border border-outline-variant/30 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all duration-300 font-bold placeholder:text-on-surface-variant/30 shadow-sm" 
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
              className="w-full mt-4 py-4 bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest rounded-full shadow-lg shadow-primary/20 transform transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 group"
            >
              {isPending ? t("settingUp") : t("signup")}
              {!isPending && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>
      )}

      {mode === "forgot" && (
        <form onSubmit={handleForgot} className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2" htmlFor="email-forgot">{t("emailLabel")}</label>
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
            {isPending ? t("sending") : t("sendReset")}
          </button>
        </form>
      )}

      <footer className="mt-12 pt-8 border-t border-outline-variant/20 text-center">
        <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
          {t("termsPrefix")} 
          <a className="text-primary font-bold hover:underline ml-1" href="#">{t("terms")}</a> {t("and")} 
          <a className="text-primary font-bold hover:underline ml-1" href="#">{t("privacy")}</a>.
        </p>
      </footer>
    </div>
  )
}
