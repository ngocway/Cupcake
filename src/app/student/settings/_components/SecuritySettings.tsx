"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { changeStudentPassword } from "@/actions/student-settings-actions"
import { Lock, KeyRound, CheckCircle2, AlertCircle } from "lucide-react"

export function SecuritySettings({ user }: { user: any }) {
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        if (newPassword !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp")
            return
        }

        if (newPassword.length < 6) {
            setError("Mật khẩu mới phải có ít nhất 6 ký tự")
            return
        }

        setLoading(true)
        const res = await changeStudentPassword(oldPassword, newPassword)
        setLoading(false)

        if (res.success) {
            setSuccess(true)
            setOldPassword("")
            setNewPassword("")
            setConfirmPassword("")
        } else {
            setError(res.error || "Có lỗi xảy ra")
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                        <Lock className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Thay đổi mật khẩu</h3>
                        <p className="text-xs text-slate-500">Đảm bảo mật khẩu của bạn mạnh để bảo vệ tài khoản</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange} className="grid gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-200/50">
                    <div className="grid gap-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Mật khẩu hiện tại</Label>
                        <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                                type="password"
                                value={oldPassword} 
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="bg-white pl-12 h-12 rounded-xl border-slate-200"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Mật khẩu mới</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input 
                                    type="password"
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="bg-white pl-12 h-12 rounded-xl border-slate-200"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Xác nhận mật khẩu</Label>
                            <div className="relative">
                                <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input 
                                    type="password"
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="bg-white pl-12 h-12 rounded-xl border-slate-200"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 italic">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-600 rounded-xl text-xs font-medium border border-green-100 italic">
                            <CheckCircle2 className="w-4 h-4" /> Cập nhật mật khẩu thành công!
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <Button 
                            type="submit"
                            disabled={loading}
                            className="bg-red-500 hover:bg-red-600 text-white px-8 h-12 rounded-full font-bold uppercase tracking-widest text-xs transition-all active:scale-95"
                        >
                            {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                        </Button>
                    </div>
                </form>
            </section>

            <section className="space-y-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12 s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900">Liên kết tài khoản</h3>
                        <p className="text-xs text-slate-500">Quản lý cách bạn đăng nhập vào hệ thống</p>
                    </div>
                    <Button variant="outline" className="rounded-full px-6 border-slate-200">
                        {user.accounts?.length > 0 ? "Đã liên kết" : "Liên kết ngay"}
                    </Button>
                </div>
            </section>
        </div>
    )
}
