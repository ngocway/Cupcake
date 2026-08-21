import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateStudentProfile } from "@/actions/student-settings-actions"
import { Camera, User, Mail, ShieldCheck, Sparkles, Languages } from "lucide-react"
import { useContentStore } from "@/store/useContentStore"

const AGE_OPTIONS = [
  { id: "kindergarten", label: "Mầm non", sub: "< 6 tuổi", emoji: "🧸" },
  { id: "kid", label: "Trẻ em", sub: "6–12 tuổi", emoji: "🎒" },
  { id: "teen", label: "Thanh thiếu niên", sub: "13–16 tuổi", emoji: "🎧" },
  { id: "learner", label: "Người lớn / Học chung", sub: "Mọi lứa tuổi", emoji: "📖" },
]

const LANG_OPTIONS = [
  { id: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { id: "en", label: "English", flag: "🇺🇸" },
  { id: "th", label: "Thailand", flag: "🇹🇭" },
  { id: "id", label: "Indonesia", flag: "🇮🇩" },
  { id: "zh", label: "Mandarin Chinese", flag: "🇨🇳" },
  { id: "ja", label: "Japanese", flag: "🇯🇵" },
  { id: "ko", label: "Korean", flag: "🇰🇷" },
]

export function ProfileSettings({ user }: { user: any }) {
    const storeStudyAgeGroup = useContentStore((s) => (s as any).studyAgeGroup)
    const setStudyAgeGroup    = useContentStore((s) => (s as any).setStudyAgeGroup)
    const storeNativeLang     = useContentStore((s) => s.nativeLanguage)
    const setNativeLanguage   = useContentStore((s) => s.setNativeLanguage)

    const [name, setName] = useState(user.name || "")
    const [studyAgeGroup, setLocalAgeGroup] = useState(user.studyAgeGroup || storeStudyAgeGroup || "learner")
    const [nativeLanguage, setLocalNativeLang] = useState(storeNativeLang || "vi")
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        const trimmedName = name.trim()

        // Sync Zustand store & Cookies
        setStudyAgeGroup(studyAgeGroup)
        setNativeLanguage(nativeLanguage)
        document.cookie = `study_age_group=${studyAgeGroup}; path=/; max-age=31536000; samesite=lax`
        document.cookie = `native_language=${nativeLanguage}; path=/; max-age=31536000; samesite=lax`
        localStorage.setItem("cupcakes_native_language", nativeLanguage)

        const res = await updateStudentProfile({ name: trimmedName, studyAgeGroup })
        setLoading(false)
        if (res.success) {
            setName(trimmedName)
            alert("Profile information updated successfully!")
        } else {
            alert(res.error || "An error occurred")
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-28 md:pb-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-200 dark:border-slate-700 shadow-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
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
                        <span className="text-white text-xs font-bold uppercase tracking-wider">Change</span>
                    </div>
                </div>
                
                <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{user.name || "Student"}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
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

            <div className="grid gap-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
                <div className="grid gap-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-500">Full Name</Label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            id="name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                            className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-600 focus:ring-primary/20"
                        />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 italic">* This name will appear in the teacher's gradebook.</p>
                </div>

                <div className="grid gap-2 opacity-60">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500">Email (Cannot be edited)</Label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            id="email" 
                            value={user.email} 
                            disabled
                            className="bg-slate-100/50 dark:bg-slate-700/50 backdrop-blur-sm pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-600"
                        />
                    </div>
                </div>
            </div>

            {/* Learning Profile & Preferences Section */}
            <div className="grid gap-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">Lứa tuổi & Cấu hình học tập</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Điều chỉnh độ khó nội dung và ngôn ngữ hướng dẫn phù hợp với bạn</p>
                    </div>
                </div>

                {/* Age Group Selector */}
                <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Lứa tuổi học tập</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {AGE_OPTIONS.map((opt) => {
                            const isSelected = studyAgeGroup === opt.id || (opt.id === "kindergarten" && studyAgeGroup.toLowerCase().includes("kindergarten"))
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setLocalAgeGroup(opt.id)}
                                    className={`p-3.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between cursor-pointer ${
                                        isSelected 
                                            ? "border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-200 shadow-md shadow-amber-500/10" 
                                            : "border-slate-200 dark:border-slate-700 hover:border-amber-300 text-slate-700 dark:text-slate-300"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl">{opt.emoji}</span>
                                        {isSelected && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                                    </div>
                                    <div className="mt-2">
                                        <span className="block text-xs font-bold">{opt.label}</span>
                                        <span className="block text-[10px] text-slate-400">{opt.sub}</span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Native Language Selector */}
                <div className="space-y-3 pt-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-slate-400" /> Ngôn ngữ giải thích (Native Language)
                    </Label>
                    <div className="flex flex-wrap gap-2">
                        {LANG_OPTIONS.map((lang) => {
                            const isSelected = nativeLanguage === lang.id
                            return (
                                <button
                                    key={lang.id}
                                    type="button"
                                    onClick={() => setLocalNativeLang(lang.id)}
                                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                                        isSelected
                                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 shadow-sm"
                                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                                    }`}
                                >
                                    <span>{lang.flag}</span>
                                    <span>{lang.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Sticky Save Button: floats above bottom nav on mobile */}
            <div className="fixed bottom-[60px] left-0 right-0 md:static md:bottom-auto flex justify-end px-4 md:px-0 py-3 md:py-0 bg-white/90 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-t border-slate-100 md:border-none z-40">
                <Button 
                    onClick={handleSave} 
                    disabled={loading}
                    className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white px-8 h-12 rounded-full font-bold uppercase tracking-widest text-xs transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 cursor-pointer"
                >
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </div>
    )
}
