"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Map "admin" to "admin@cupcakes.com" for convenience if user typed just admin
    const finalEmail = email.includes("@") ? email : (email === "admin" ? "admin@cupcakes.com" : email);

    try {
      const res = await signIn("credentials", {
        email: finalEmail,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage("Tài khoản hoặc mật khẩu Admin không chính xác.");
        setIsPending(false);
      } else if (res?.ok) {
        const searchParams = new URLSearchParams(window.location.search);
        const callbackUrl = searchParams.get("callbackUrl");
        router.push(callbackUrl || "/admin/dashboard");
        router.refresh();
      }
    } catch (err) {
      setErrorMessage("Đã xảy ra sự cố hệ thống.");
      setIsPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-neutral-950 to-neutral-950">
      <div className="w-full max-w-md bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-600/20 blur-[100px] pointer-events-none"></div>

        <div className="text-center mb-10 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/10 rounded-2xl border border-blue-500/20 mb-6 group transition-all duration-300 hover:border-blue-500/40">
            <span className="material-symbols-outlined text-blue-500 text-3xl group-hover:scale-110 transition-transform">
              admin_panel_settings
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 font-display tracking-tight">CUPCAKES ADMIN</h1>
          <p className="text-neutral-400 font-medium">Hệ thống quản trị trung tâm</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-2 ml-1" htmlFor="email">Tài khoản Admin</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-xl group-focus-within:text-blue-500 transition-colors">person</span>
              <input 
                id="email" 
                name="email"
                type="text" 
                required
                defaultValue="admin"
                placeholder="Nhập tài khoản" 
                className="w-full pl-12 pr-4 py-4 bg-neutral-800/50 border border-neutral-700/50 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-white placeholder:text-neutral-600 font-medium" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-2 ml-1" htmlFor="password">Mật khẩu</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-xl group-focus-within:text-blue-500 transition-colors">lock</span>
              <input 
                id="password" 
                name="password"
                type="password" 
                required
                defaultValue="123456Abc"
                placeholder="••••••••" 
                className="w-full pl-12 pr-12 py-4 bg-neutral-800/50 border border-neutral-700/50 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-white placeholder:text-neutral-600 font-medium" 
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-xl">error</span>
              {errorMessage}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transform transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                Đăng nhập hệ thống
                <span className="material-symbols-outlined">login</span>
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-500">
           Bản quyền © 2026 Admin Dashboard. <br/> Bảo mật thông tin nội bộ.
        </p>
      </div>
    </main>
  )
}
