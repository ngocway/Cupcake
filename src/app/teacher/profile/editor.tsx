"use client"

import { useState, useEffect, useRef } from "react"
import { updateTeacherProfile } from "@/actions/teacher-profile"
import { uploadMedia } from "@/actions/upload-actions"
import { GraduationCap, User, FileText, Image as ImageIcon, Link as LinkIcon, Save, Loader2, Plus, X, Globe, Facebook, Linkedin, Github, Youtube, MapPin, DollarSign, BookOpen, Briefcase, Eye, EyeOff, Upload, Camera, Construction, Tag } from "lucide-react"
import { useRouter } from "next/navigation"

const PREDEFINED_TAGS = [
    "IELTS", "TOEIC", "TOEFL", "SAT", "Tiếng Anh giao tiếp", 
    "Tiếng Anh trẻ em", "Ngữ pháp chuyên sâu", "Business English",
    "Toán học", "Ngữ văn", "Vật lý", "Hóa học", "Sinh học"
];

export default function TeacherProfileEditor({ profile }: { profile: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [tagInput, setTagInput] = useState("");

    const [formData, setFormData] = useState({
        name: profile?.name || "",
        bio: profile?.bio || "",
        professionalTitle: profile?.professionalTitle || "",
        expertiseTags: profile?.expertiseTags || "",
        socialLinks: profile?.socialLinks || "{}",
        image: profile?.image || "",
        isPortfolioPublished: profile?.isPortfolioPublished || false,
        hourlyRate: profile?.hourlyRate || 0,
        location: profile?.location || "",
        education: profile?.education || "",
        teachingExperience: profile?.teachingExperience || ""
    });

    const [socials, setSocials] = useState({
        facebook: "",
        linkedin: "",
        github: "",
        youtube: "",
        website: ""
    });

    useEffect(() => {
        try {
            if (profile?.socialLinks) {
                setSocials(JSON.parse(profile.socialLinks));
            }
        } catch (e) {}
    }, [profile]);

    const handleSocialChange = (key: string, value: string) => {
        const newSocials = { ...socials, [key]: value };
        setSocials(newSocials);
        setFormData(prev => ({ ...prev, socialLinks: JSON.stringify(newSocials) }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            const res = await uploadMedia(uploadFormData);
            
            if (res.success) {
                setFormData(prev => ({
                    ...prev,
                    image: res.url
                }));
            } else {
                alert("Tải ảnh thất bại!");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Đã có lỗi xảy ra khi tải ảnh.");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const res = await updateTeacherProfile({
                ...formData,
                hourlyRate: Number(formData.hourlyRate)
            });
            if (res.success) {
                alert("Hồ sơ đã được cập nhật thành công!");
                router.refresh();
            } else {
                alert(res.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Tag management logic
    const currentTags = formData.expertiseTags ? formData.expertiseTags.split(',').filter(Boolean) : [];
    
    const addTag = (tag: string) => {
        const normalizedTag = tag.trim();
        if (normalizedTag && !currentTags.includes(normalizedTag)) {
            const newTags = [...currentTags, normalizedTag].join(',');
            setFormData({...formData, expertiseTags: newTags});
        }
        setTagInput("");
    };

    const removeTag = (tagToRemove: string) => {
        const newTags = currentTags.filter(t => t !== tagToRemove).join(',');
        setFormData({...formData, expertiseTags: newTags});
    };

    return (
        <div className="max-w-5xl mx-auto py-12 px-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 italic">Xây dựng hồ sơ</h1>
                    <p className="text-slate-500 font-medium mt-1">Làm cho hình ảnh cá nhân của bạn trở nên chuyên nghiệp và thu hút.</p>
                </div>
                <div className="flex items-center gap-4">
                  <a 
                    href={`/teacher/profile/${profile.id}`} 
                    target="_blank"
                    className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    Xem hồ sơ
                  </a>
                  <button 
                    onClick={() => handleSave()}
                    disabled={loading}
                    className="flex items-center gap-3 px-10 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu thay đổi
                  </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Visibility Toggle */}
                    <div className={`p-8 rounded-[40px] border transition-all duration-500 ${formData.isPortfolioPublished ? 'bg-green-50 border-green-100 shadow-green-900/5 shadow-xl' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`size-14 rounded-3xl flex items-center justify-center transition-colors ${formData.isPortfolioPublished ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                    {formData.isPortfolioPublished ? <Eye className="w-7 h-7" /> : <EyeOff className="w-7 h-7" />}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-lg ${formData.isPortfolioPublished ? 'text-green-900' : 'text-slate-900'}`}>
                                        {formData.isPortfolioPublished ? 'Hồ sơ đang công khai' : 'Hồ sơ đang ẩn'}
                                    </h3>
                                    <p className="text-sm text-slate-500 max-w-xs">
                                        {formData.isPortfolioPublished 
                                            ? 'Học sinh và khách vãng lai có thể tìm thấy bạn.' 
                                            : 'Chỉ bạn mới có thể xem trang hồ sơ của mình.'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setFormData({...formData, isPortfolioPublished: !formData.isPortfolioPublished})}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${formData.isPortfolioPublished ? 'bg-green-500' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${formData.isPortfolioPublished ? 'translate-x-7' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                        <h3 className="text-xl font-bold flex items-center gap-3"><User className="w-6 h-6 text-primary" /> Thông tin cá nhân</h3>
                        
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Họ và tên</label>
                                    <input 
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        placeholder="Nhập tên hiển thị..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Chức danh / Vị trí</label>
                                    <input 
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                                        value={formData.professionalTitle}
                                        onChange={e => setFormData({...formData, professionalTitle: e.target.value})}
                                        placeholder="Ví dụ: Giáo viên Tiếng Anh"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Giới thiệu bản thân (Bio)</label>
                                <textarea 
                                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px]"
                                    value={formData.bio}
                                    onChange={e => setFormData({...formData, bio: e.target.value})}
                                    placeholder="Viết giới thiệu ngắn về bạn..."
                                />
                            </div>

                            {/* Expertise Tags Section */}
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Tag className="w-3 h-3" /> Lĩnh vực giảng dạy
                                </label>
                                
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-wrap gap-2">
                                    {currentTags.length > 0 ? (
                                        currentTags.map(tag => (
                                            <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm">
                                                {tag}
                                                <button onClick={() => removeTag(tag)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">Chưa chọn lĩnh vực nào...</p>
                                    )}
                                </div>

                                <div className="relative group">
                                    <input 
                                        className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all pr-12"
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(tagInput))}
                                        placeholder="Gõ lĩnh vực mới và nhấn Enter..."
                                    />
                                    <button 
                                        onClick={() => addTag(tagInput)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/5 rounded-xl transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gợi ý phổ biến:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {PREDEFINED_TAGS.filter(t => !currentTags.includes(t)).map(tag => (
                                            <button 
                                                key={tag}
                                                onClick={() => addTag(tag)}
                                                className="px-3 py-1.5 bg-white border border-slate-100 text-slate-500 rounded-xl text-[11px] font-bold hover:border-primary hover:text-primary transition-all active:scale-95"
                                            >
                                                + {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Competency Details */}
                    <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                        <h3 className="text-xl font-bold flex items-center gap-3"><GraduationCap className="w-6 h-6 text-primary" /> Năng lực & Kinh nghiệm</h3>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><BookOpen className="w-3 h-3" /> Học văn</label>
                                <input 
                                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                                    value={formData.education}
                                    onChange={e => setFormData({...formData, education: e.target.value})}
                                    placeholder="Bằng Đại học, Cao học..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Briefcase className="w-3 h-3" /> Kinh nghiệm giảng dạy</label>
                                <textarea 
                                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all min-h-[150px]"
                                    value={formData.teachingExperience}
                                    onChange={e => setFormData({...formData, teachingExperience: e.target.value})}
                                    placeholder="Mô tả các năm công tác, các thành tựu nổi bật..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Media Section (Avatar only) */}
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2"><ImageIcon className="w-5 h-5 text-primary" /> Hình ảnh</h3>
                        
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center block">Ảnh đại diện</label>
                                <div className="flex justify-center">
                                    <div 
                                        onClick={() => avatarInputRef.current?.click()}
                                        className="relative group cursor-pointer"
                                    >
                                        <div className="size-48 rounded-[40px] overflow-hidden border-4 border-slate-50 shadow-xl bg-slate-100">
                                            {uploadingAvatar ? (
                                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
                                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                                </div>
                                            ) : null}
                                            <img 
                                                src={formData.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profile.name} 
                                                alt="Avatar" 
                                                className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" 
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/40 text-white z-10">
                                                <Camera className="w-10 h-10" />
                                            </div>
                                        </div>
                                        <input 
                                            type="file" 
                                            ref={avatarInputRef} 
                                            className="hidden" 
                                            accept="image/*" 
                                            onChange={handleFileUpload} 
                                        />
                                    </div>
                                </div>
                                <button 
                                  onClick={() => avatarInputRef.current?.click()}
                                  className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                                >
                                  <Upload className="w-4 h-4" /> Thay đổi ảnh đại diện
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Under Development Section */}
                    <div className="bg-slate-50 p-8 rounded-[40px] border border-dashed border-slate-200 shadow-sm space-y-6 relative overflow-hidden group">
                        <div className="absolute -top-4 -right-4 size-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-400"><Construction className="w-5 h-5" /> Dạy thêm</h3>
                        
                        <div className="space-y-4 opacity-40 grayscale pointer-events-none">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300">Mức giá tham khảo</label>
                                <div className="h-10 bg-slate-100 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300">Khu vực</label>
                                <div className="h-10 bg-slate-100 rounded-xl" />
                            </div>
                        </div>
                        
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/20 backdrop-blur-[1px]">
                             <span className="px-4 py-2 bg-white/80 border border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                                Chức năng đang phát triển
                             </span>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2"><LinkIcon className="w-5 h-5 text-primary" /> Mạng xã hội</h3>
                        
                        <div className="space-y-4">
                            {Object.entries(socials).map(([key, value]) => (
                                <div key={key} className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {key === "facebook" && <Facebook className="w-3 h-3" />}
                                        {key === "linkedin" && <Linkedin className="w-3 h-3" />}
                                        {key === "website" && <Globe className="w-3 h-3" />}
                                        {key}
                                    </div>
                                    <input 
                                        className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                                        value={value}
                                        onChange={e => handleSocialChange(key, e.target.value)}
                                        placeholder={`Link ${key}...`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
