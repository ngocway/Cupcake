"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { registerStudent, resetPassword } from "@/actions/auth-actions"

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

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
        router.push(callbackUrl || "/student/assignments");
        router.refresh();
      }
    } catch (err) {
      setErrorMessage("Đã xảy ra sự cố hệ thống.");
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
      setErrorMessage("Mật khẩu xác nhận không khớp.");
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
            router.push("/student/assignments");
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
    signIn("google", { callbackUrl: "/student/assignments" });
  }

  return (
    <main className="flex-grow flex flex-col md:flex-row items-stretch min-h-screen bg-surface font-body text-on-surface antialiased">
      {/* Left Column: Branding & Illustration */}
      <div className="hidden md:flex md:w-1/2 bg-surface-container relative overflow-hidden flex-col justify-center items-center p-16">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-fixed-dim opacity-20 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-fixed opacity-10 rounded-full -ml-48 -mb-48"></div>

        <div className="relative z-10 max-w-md text-center">
          <div className="mb-12 inline-flex items-center justify-center p-4 bg-surface-container-lowest rounded-xl shadow-[0_8px_24px_rgba(25,27,35,0.06)]">
            <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
          </div>

          <h1 className="font-headline font-extrabold text-4xl text-on-surface mb-6 tracking-tight leading-tight">
            Master English with <span className="text-primary">Clarified Academy</span>
          </h1>

          <p className="text-on-surface-variant text-lg leading-relaxed mb-10">
            Step into an editorial-grade learning workspace designed to help you communicate with clarity and confidence.
          </p>

          <div className="space-y-4 text-left">
            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-surface-container-low transition-colors duration-300">
              <span className="material-symbols-outlined text-secondary pt-1">check_circle</span>
              <div>
                <h3 className="font-headline font-bold text-on-surface">Precision Writing</h3>
                <p className="text-sm text-on-surface-variant">Our editorial architect tools refine every sentence you craft.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-surface-container-low transition-colors duration-300">
              <span className="material-symbols-outlined text-secondary pt-1">check_circle</span>
              <div>
                <h3 className="font-headline font-bold text-on-surface">Interactive Vocabulary</h3>
                <p className="text-sm text-on-surface-variant">Master nuances through high-fidelity digital modules.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 w-full max-w-lg aspect-video rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(25,27,35,0.06)] bg-surface-container-high relative">
          <img 
            alt="Students collaborating" 
            className="w-full h-full object-cover grayscale mix-blend-multiply opacity-40" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9lHcWALo2gWgpJo5V7poDF1iz1_hswdnpzrwerhfhQpUGt9eHJv0oMbsRPfuhQ-sUk1DWHYasWMNvWSuKUuzeVpqXmInMXWEz4PRJREIB_9BToSGnnVhCsbk0BnOMVX_vlbiqz5roR8TsmUp-ACTgmMD8hcwgkio551oVniMZA59bnBtmhMEqw0QGRIF6ziQc9zeYdvopffxzyd3BCmCPloIP4Ax7QGumT7P0bDrFGzaiiGGwird0CVP4tu1NfQDmyq4irX2g9JxX" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent"></div>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="w-full md:w-1/2 bg-surface-container-lowest flex flex-col justify-center px-6 py-12 md:px-24 relative overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          <div className="md:hidden mb-12 flex flex-col items-center">
            <h2 className="font-headline font-extrabold text-2xl text-primary tracking-tight">Clarified Academy</h2>
            <p className="text-sm text-on-surface-variant font-label">EngMaster Student Portal</p>
          </div>

          {(mode === "login" || mode === "register") && (
            <div className="flex gap-8 mb-10 border-b border-outline-variant/15">
              <button 
                onClick={() => { setMode("login"); setErrorMessage(""); setSuccessMessage(""); }}
                className={`pb-4 border-b-2 font-headline font-bold text-lg transition-colors ${mode === "login" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}
              >
                Log In
              </button>
              <button 
                onClick={() => { setMode("register"); setErrorMessage(""); setSuccessMessage(""); }}
                className={`pb-4 border-b-2 font-headline font-bold text-lg transition-colors ${mode === "register" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}
              >
                Sign Up
              </button>
            </div>
          )}

          {mode === "forgot" && (
            <div className="mb-10">
              <button 
                onClick={() => { setMode("login"); setErrorMessage(""); setSuccessMessage(""); }}
                className="flex items-center text-primary font-label font-bold text-sm hover:underline mb-4 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm mr-1">arrow_back</span>
                Back to Login
              </button>
              <h2 className="font-headline font-bold text-2xl text-on-surface mb-2">Reset Password</h2>
              <p className="text-on-surface-variant font-body">Enter your email and we'll send you instructions to reset your password.</p>
            </div>
          )}

          {mode === "login" && (
            <>
              <div className="mb-8">
                <h2 className="font-headline font-bold text-2xl text-on-surface mb-2">Welcome Back</h2>
                <p className="text-on-surface-variant font-body">Please enter your credentials to continue your journey.</p>
              </div>

              <button type="button" onClick={handleGoogleLogin} className="w-full py-4 px-6 mb-8 flex items-center justify-center gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-label font-bold text-on-surface hover:bg-surface-container-low transition-all duration-200">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                Continue with Google
              </button>

              <div className="relative mb-8 flex items-center">
                <div className="flex-grow border-t border-outline-variant/15"></div>
                <span className="px-4 text-xs font-label uppercase tracking-widest text-outline">Or with Email</span>
                <div className="flex-grow border-t border-outline-variant/15"></div>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="block font-label text-sm font-bold text-on-surface-variant" htmlFor="email">Email Address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">mail</span>
                    <input 
                      id="email" 
                      name="email"
                      type="email" 
                      required
                      placeholder="name@example.com" 
                      className="w-full pl-12 pr-4 py-4 bg-surface-variant/30 border border-transparent rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 font-body placeholder:text-outline" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block font-label text-sm font-bold text-on-surface-variant" htmlFor="password">Password</label>
                    <button type="button" onClick={() => { setMode("forgot"); setErrorMessage(""); setSuccessMessage(""); }} className="text-xs font-label text-primary font-bold hover:underline cursor-pointer">Forgot Password?</button>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">lock</span>
                    <input 
                      id="password" 
                      name="password"
                      type={showPassword ? "text" : "password"} 
                      required
                      placeholder="••••••••" 
                      className="w-full pl-12 pr-12 py-4 bg-surface-variant/30 border border-transparent rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 font-body placeholder:text-outline" 
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface flex items-center justify-center p-1 cursor-pointer" 
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">{showPassword ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2">
                  <input className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" id="remember" type="checkbox"/>
                  <label className="font-body text-sm text-on-surface-variant" htmlFor="remember">Keep me logged in</label>
                </div>

                {errorMessage && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                    {errorMessage}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full py-4 bg-gradient-to-br from-[#004ac6] to-[#2563eb] hover:from-[#003ea8] hover:to-[#1d4ed8] text-white font-label font-bold uppercase tracking-wider rounded-full shadow-[0_8px_24px_rgba(25,27,35,0.06)] transform transition-transform duration-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isPending ? "Authenticating..." : "Enter Workspace"}
                  {!isPending && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                </button>
              </form>
            </>
          )}

          {mode === "register" && (
            <>
              <div className="mb-8">
                <h2 className="font-headline font-bold text-2xl text-on-surface mb-2">Create an Account</h2>
                <p className="text-on-surface-variant font-body">Join EngMaster to access personalized learning materials.</p>
              </div>

              <button type="button" onClick={handleGoogleLogin} className="w-full py-4 px-6 mb-8 flex items-center justify-center gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-label font-bold text-on-surface hover:bg-surface-container-low transition-all duration-200">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                Sign up with Google
              </button>

              <div className="relative mb-8 flex items-center">
                <div className="flex-grow border-t border-outline-variant/15"></div>
                <span className="px-4 text-xs font-label uppercase tracking-widest text-outline">Or with Email</span>
                <div className="flex-grow border-t border-outline-variant/15"></div>
              </div>

              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-2">
                  <label className="block font-label text-sm font-bold text-on-surface-variant" htmlFor="name">Full Name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">person</span>
                    <input 
                      id="name" 
                      name="name"
                      type="text" 
                      required
                      placeholder="John Doe" 
                      className="w-full pl-12 pr-4 py-4 bg-surface-variant/30 border border-transparent rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 font-body placeholder:text-outline" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-label text-sm font-bold text-on-surface-variant" htmlFor="email-reg">Email Address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">mail</span>
                    <input 
                      id="email-reg" 
                      name="email"
                      type="email" 
                      required
                      placeholder="name@example.com" 
                      className="w-full pl-12 pr-4 py-4 bg-surface-variant/30 border border-transparent rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 font-body placeholder:text-outline" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-label text-sm font-bold text-on-surface-variant" htmlFor="password-reg">Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">lock</span>
                    <input 
                      id="password-reg" 
                      name="password"
                      type={showPassword ? "text" : "password"} 
                      required
                      placeholder="••••••••" 
                      className="w-full pl-12 pr-12 py-4 bg-surface-variant/30 border border-transparent rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 font-body placeholder:text-outline" 
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface flex items-center justify-center p-1 cursor-pointer" 
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">{showPassword ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-label text-sm font-bold text-on-surface-variant" htmlFor="confirmPassword">Confirm Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">lock</span>
                    <input 
                      id="confirmPassword" 
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"} 
                      required
                      placeholder="••••••••" 
                      className="w-full pl-12 pr-12 py-4 bg-surface-variant/30 border border-transparent rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 font-body placeholder:text-outline" 
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                    {errorMessage}
                  </div>
                )}
                {successMessage && (
                  <div className="p-3 text-sm text-green-700 bg-green-50 rounded-lg border border-green-200">
                    {successMessage}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full py-4 bg-gradient-to-br from-[#004ac6] to-[#2563eb] hover:from-[#003ea8] hover:to-[#1d4ed8] text-white font-label font-bold uppercase tracking-wider rounded-full shadow-[0_8px_24px_rgba(25,27,35,0.06)] transform transition-transform duration-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isPending ? "Setting up..." : "Create Account"}
                  {!isPending && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                </button>
              </form>
            </>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgot} className="space-y-6">
              <div className="space-y-2">
                <label className="block font-label text-sm font-bold text-on-surface-variant" htmlFor="email-forgot">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">mail</span>
                  <input 
                    id="email-forgot" 
                    name="email"
                    type="email" 
                    required
                    placeholder="name@example.com" 
                    className="w-full pl-12 pr-4 py-4 bg-surface-variant/30 border border-transparent rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 font-body placeholder:text-outline" 
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="p-3 text-sm text-green-700 bg-green-50 rounded-lg border border-green-200">
                  {successMessage}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isPending}
                className="w-full py-4 bg-gradient-to-br from-[#004ac6] to-[#2563eb] hover:from-[#003ea8] hover:to-[#1d4ed8] text-white font-label font-bold uppercase tracking-wider rounded-full shadow-[0_8px_24px_rgba(25,27,35,0.06)] transform transition-transform duration-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPending ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          <footer className="mt-12 pt-8 border-t border-outline-variant/15 text-center">
            <p className="text-xs text-on-surface-variant font-label leading-relaxed">
              By entering, you agree to our 
              <a className="text-primary font-bold hover:underline ml-1" href="#">Terms of Service</a> and 
              <a className="text-primary font-bold hover:underline ml-1" href="#">Privacy Policy</a>.
            </p>
          </footer>
        </div>
        
        <button className="hidden md:flex absolute bottom-8 right-8 bg-surface-container-lowest p-4 rounded-full shadow-[0_8px_24px_rgba(25,27,35,0.06)] text-primary hover:text-primary-container transition-all group items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-label font-bold text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 px-1">Help Center</span>
          </div>
        </button>

      </div>
    </main>
  )
}
