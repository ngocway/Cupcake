"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
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
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setErrorMessage("Đã xảy ra hệ thống sự cố.");
      setIsPending(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg border border-neutral-200">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900">EngMaster</h1>
          <p className="mt-2 text-sm text-neutral-500">Đăng nhập tài khoản của bạn</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-neutral-700" htmlFor="email">Email</label>
              <input 
                id="email"
                type="email" 
                name="email" 
                placeholder="your@email.com" 
                required 
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-neutral-700" htmlFor="password">Mật khẩu</label>
              <input 
                id="password"
                type="password" 
                name="password" 
                placeholder="••••••••" 
                required 
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg border border-red-200">
              {errorMessage}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full px-4 py-3 text-white font-medium bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:bg-blue-400 transition"
          >
            {isPending ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  )
}
