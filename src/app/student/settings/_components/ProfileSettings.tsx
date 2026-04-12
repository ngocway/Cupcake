"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateStudentProfile } from "@/actions/student-settings-actions"
import { Camera, User, Mail, ShieldCheck } from "lucide-react"

export function ProfileSettings({ user }: { user: any }) {
    const [name, setName] = useState(user.name || "")
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        const res = await updateStudentProfile({ name })
        setLoading(false)
        if (res.success) {
            alert("Thông tin hồ sơ đã được cập nhật thành công!")
        } else {
            alert(res.error || "Có lỗi xảy ra")
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center">
                        <img 
                            src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                        <Camera className="w-4 h-4" />
                    </button>
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-full transition-opacity flex items-center justify-center cursor-pointer">
                        <span className="text-white text-xs font-bold uppercase tracking-wider">Thay đổi</span>
                    </div>
                </div>
                
                <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold text-slate-900">{user.name || "Học sinh"}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                        <Mail className="w-4 h-4" /> {user.email}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">Student</span>
                        {user.isManagedAccount && (
                            <span className="bg-orange-100 text-orange-600 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Managed
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-200/50">
                <div className="grid gap-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-500">Họ và Tên</Label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            id="name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nhập họ tên của bạn"
                            className="bg-white pl-12 h-12 rounded-xl border-slate-200 focus:ring-primary/20"
                        />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 italic">* Tên này sẽ hiển thị trong bảng điểm của giáo viên.</p>
                </div>

                <div className="grid gap-2 opacity-60">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500">Email (Không thể chỉnh sửa)</Label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            id="email" 
                            value={user.email} 
                            disabled
                            className="bg-slate-100 pl-12 h-12 rounded-xl border-slate-200"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <Button 
                    onClick={handleSave} 
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-white px-8 h-12 rounded-full font-bold uppercase tracking-widest text-xs transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95"
                >
                    {loading ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
            </div>
        </div>
    )
}
