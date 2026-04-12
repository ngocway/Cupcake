"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Languages, Globe, Check } from "lucide-react"

export function AppearanceSettings() {
    const [lang, setLang] = useState("vi")

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                        <Languages className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Ngôn ngữ giao diện</h3>
                        <p className="text-xs text-slate-500">Chọn ngôn ngữ để bạn cảm thấy thoải mái nhất</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                        onClick={() => setLang("vi")}
                        className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all text-left ${
                            lang === "vi" 
                            ? "border-primary bg-primary/5 shadow-md shadow-primary/10" 
                            : "border-slate-100 hover:border-slate-200"
                        }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-xl">🇻🇳</div>
                        <div className="flex-1">
                            <span className="block text-sm font-bold text-slate-900">Tiếng Việt</span>
                            <span className="block text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Vietnamese (Primary)</span>
                        </div>
                        {lang === "vi" && <div className="p-1 bg-primary text-white rounded-full"><Check className="w-3 h-3" /></div>}
                    </button>

                    <button 
                        onClick={() => setLang("en")}
                        className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all text-left ${
                            lang === "en" 
                            ? "border-primary bg-primary/5 shadow-md shadow-primary/10" 
                            : "border-slate-100 hover:border-slate-200"
                        }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-xl">🇺🇸</div>
                        <div className="flex-1">
                            <span className="block text-sm font-bold text-slate-900">English</span>
                            <span className="block text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">English (US)</span>
                        </div>
                        {lang === "en" && <div className="p-1 bg-primary text-white rounded-full"><Check className="w-3 h-3" /></div>}
                    </button>
                </div>
            </section>

            <section className="space-y-4 pt-6">
                <div className="flex items-center gap-3 text-slate-400">
                    <Globe className="w-4 h-4" />
                    <span className="text-xs font-medium">Lưu ý: Ngôn ngữ chính của bài tập sẽ luôn là ngôn ngữ do giáo viên thiết lập.</span>
                </div>
            </section>

            <div className="flex justify-end pt-4">
                <Button className="bg-primary text-white rounded-full px-10" onClick={() => alert(`Đã chuyển sang: ${lang === "vi" ? "Tiếng Việt" : "English"}`)}>
                    Lưu cấu hình
                </Button>
            </div>
        </div>
    )
}
