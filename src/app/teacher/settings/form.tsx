"use client"

import { useState } from "react"
import { updateTeacherSettings, updateAccountSecurity } from "@/actions/settings"
import { User, Shield, Palette, Bell, EyeOff, Save, Loader2, Mail, Lock, CheckCircle2, AlertCircle, Sparkles, Briefcase } from "lucide-react"

export default function SettingsForm({ user }: { user: any }) {
    const [tab, setTab] = useState<'account' | 'branding' | 'notify' | 'privacy'>('account');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [settings, setSettings] = useState({
        themeColor: user.themeColor || "#00adef",
        logoUrl: user.logoUrl || "",
        isIncognito: user.isIncognito || false,
        notifySubmission: user.notifySubmission || true,
        notifyReview: user.notifyReview || true,
        notifyWeekly: user.notifyWeekly || false,
        studentViewTheme: user.studentViewTheme || "DYNAMIC"
    });

    const [account, setAccount] = useState({
        email: user.email || "",
        oldPassword: "",
        newPassword: ""
    });

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            const res = await updateTeacherSettings(settings);
            if (res.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSecurity = async () => {
        setLoading(true);
        try {
            const res = await updateAccountSecurity({ 
                email: account.email, 
                password: account.newPassword, 
                oldPassword: account.oldPassword 
            });
            if (res.success) {
                setSuccess(true);
                setAccount({...account, oldPassword: "", newPassword: ""});
                setTimeout(() => setSuccess(false), 3000);
            } else {
                alert(res.error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-12 px-6">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 font-headline italic">Cấu hình hệ thống</h1>
                    <p className="text-slate-500 font-medium">Tùy chỉnh trải nghiệm giảng dạy và bảo mật tài khoản của bạn.</p>
                </div>
                {success && (
                    <div className="flex items-center gap-2 bg-green-50 text-green-600 px-6 py-3 rounded-2xl animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-widest">Đã lưu thành công</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Sidebar Navigation */}
                <div className="flex flex-col gap-2">
                    {[
                        { id: 'account', label: 'Tài khoản', icon: Shield },
                        { id: 'branding', label: 'Thương hiệu', icon: Palette },
                        { id: 'notify', label: 'Thông báo', icon: Bell },
                        { id: 'privacy', label: 'Riêng tư', icon: EyeOff }
                    ].map(t => (
                        <button 
                            key={t.id}
                            onClick={() => setTab(t.id as any)}
                            className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                                tab === t.id 
                                ? "bg-slate-950 text-white shadow-xl shadow-slate-950/20" 
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                        >
                            <t.icon className="w-5 h-5" />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Main Settings Panel */}
                <div className="lg:col-span-3 bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                    
                    {tab === 'account' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-500">
                            <h3 className="text-2xl font-black font-headline italic">Bảo mật tài khoản</h3>
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Mail className="w-3 h-3" /> Email đăng nhập
                                    </label>
                                    <input 
                                        className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-primary/20"
                                        value={account.email}
                                        onChange={e => setAccount({...account, email: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Lock className="w-3 h-3" /> Mật khẩu cũ
                                        </label>
                                        <input 
                                            type="password"
                                            className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-primary/20"
                                            value={account.oldPassword}
                                            onChange={e => setAccount({...account, oldPassword: e.target.value})}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Lock className="w-3 h-3" /> Mật khẩu mới
                                        </label>
                                        <input 
                                            type="password"
                                            className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-primary/20"
                                            value={account.newPassword}
                                            onChange={e => setAccount({...account, newPassword: e.target.value})}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSaveSecurity}
                                    className="flex items-center gap-3 px-10 py-5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Cập nhật bảo mật
                                </button>
                            </div>
                        </div>
                    )}

                    {tab === 'branding' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-500">
                            <h3 className="text-2xl font-black font-headline italic">Nhận diện giáo viên</h3>
                            <div className="space-y-8">
                                {/* Theme Selection Section Only */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Giao diện hiển thị với học sinh</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => setSettings({...settings, studentViewTheme: 'DYNAMIC'})}
                                            className={`p-6 rounded-3xl border-2 transition-all text-left group ${
                                                settings.studentViewTheme === 'DYNAMIC' 
                                                ? "border-primary bg-primary/5" 
                                                : "border-slate-100 hover:border-slate-200"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`p-3 rounded-2xl ${settings.studentViewTheme === 'DYNAMIC' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Sparkles className="w-6 h-6" />
                                                </div>
                                                {settings.studentViewTheme === 'DYNAMIC' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                            </div>
                                            <h4 className="font-black text-slate-900 leading-tight">Giao diện Sinh động</h4>
                                            <p className="text-xs text-slate-500 mt-1">Màu sắc rực rỡ, hiệu ứng chuyển động mượt mà, phù hợp với học sinh trẻ tuổi.</p>
                                        </button>

                                        <button 
                                            onClick={() => setSettings({...settings, studentViewTheme: 'PROFESSIONAL'})}
                                            className={`p-6 rounded-3xl border-2 transition-all text-left ${
                                                settings.studentViewTheme === 'PROFESSIONAL' 
                                                ? "border-slate-900 bg-slate-50" 
                                                : "border-slate-100 hover:border-slate-200"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`p-3 rounded-2xl ${settings.studentViewTheme === 'PROFESSIONAL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Briefcase className="w-6 h-6" />
                                                </div>
                                                {settings.studentViewTheme === 'PROFESSIONAL' && <CheckCircle2 className="w-5 h-5 text-slate-900" />}
                                            </div>
                                            <h4 className="font-black text-slate-900 leading-tight">Giao diện Chuyên nghiệp</h4>
                                            <p className="text-xs text-slate-500 mt-1">Tối giản, trang trọng, tập trung tối đa vào nội dung bài giảng và học thuật.</p>
                                        </button>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSaveSettings}
                                    className="flex items-center gap-3 px-10 py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 shadow-xl shadow-primary/20 transition-all"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Lưu nhận diện
                                </button>
                            </div>
                        </div>
                    )}

                    {tab === 'notify' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-500">
                            <h3 className="text-2xl font-black font-headline italic">Thông báo & Báo cáo</h3>
                            <div className="space-y-6">
                                {[
                                    { id: 'notifySubmission', label: 'Học sinh nộp bài tập', desc: 'Nhận thông báo khi có học sinh hoàn thành bài làm.' },
                                    { id: 'notifyReview', label: 'Đánh giá tinh thần', desc: 'Nhận thông báo khi có học sinh gửi feedback hoặc theo dõi bạn.' },
                                    { id: 'notifyWeekly', label: 'Báo cáo hàng tuần', desc: 'Nhận email tổng hợp kết quả giảng dạy vào tối Chủ Nhật.' }
                                ].map(n => (
                                    <div key={n.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl group hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                                        <div>
                                            <p className="font-bold text-slate-900">{n.label}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{n.desc}</p>
                                        </div>
                                        <button 
                                            onClick={() => setSettings({...settings, [n.id]: !(settings as any)[n.id]})}
                                            className={`w-14 h-8 rounded-full transition-all relative ${
                                                (settings as any)[n.id] ? "bg-primary" : "bg-slate-300"
                                            }`}
                                        >
                                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${
                                                (settings as any)[n.id] ? "right-1" : "left-1"
                                            }`}></div>
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={handleSaveSettings}
                                    className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all mt-6"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Lưu cài đặt
                                </button>
                            </div>
                        </div>
                    )}

                    {tab === 'privacy' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-500">
                            <h3 className="text-2xl font-black font-headline italic">Quyền riêng tư</h3>
                            <div className="space-y-8">
                                <div className="p-8 bg-indigo-50 rounded-[40px] border border-indigo-100 flex items-start gap-6">
                                    <div className="p-4 bg-white rounded-2xl text-indigo-500 shadow-sm">
                                        <EyeOff className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <h4 className="font-black text-slate-900 leading-tight">Chế độ Ẩn danh Profile</h4>
                                            <p className="text-xs text-slate-500 mt-1">Khi bật, Profile công khai của bạn sẽ bị ẩn khỏi kết quả tìm kiếm cộng đồng.</p>
                                        </div>
                                        <button 
                                            onClick={() => setSettings({...settings, isIncognito: !settings.isIncognito})}
                                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                settings.isIncognito ? "bg-indigo-500 text-white" : "bg-white text-indigo-500 border border-indigo-100"
                                            }`}
                                        >
                                            {settings.isIncognito ? "Đang bật chế độ ẩn" : "Đang hiển thị công khai"}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Danh sách chặn</h4>
                                    <div className="bg-slate-50 p-8 rounded-[40px] text-center space-y-4 border border-slate-100">
                                        <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Không có người dùng nào bị chặn</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSaveSettings}
                                    className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Cập nhật riêng tư
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
