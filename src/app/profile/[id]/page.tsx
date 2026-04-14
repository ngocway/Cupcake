import { getTeacherProfile, getTeacherReviews } from "@/actions/teacher-profile"
import { auth } from "@/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Search, BookOpen, GraduationCap, ChevronRight, Play, Star, MapPin, Globe, Share2, Facebook, Linkedin, Youtube, Users, Layers, Award, Mail, ExternalLink, ShieldCheck, Heart, Zap, MessageCircle } from "lucide-react"
import { FollowButton } from "@/components/profile/FollowButton"
import { ReviewList } from "@/components/reviews/ReviewList"

export default async function TeacherProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const profile = await getTeacherProfile(id);
    const reviews = await getTeacherReviews(id);

    if (!profile) return notFound();

    let socialLinks = { facebook: "", linkedin: "", youtube: "", website: "" };
    try {
        if (profile.socialLinks) {
            socialLinks = JSON.parse(profile.socialLinks);
        }
    } catch (e) {}

    const tags = profile.expertiseTags ? profile.expertiseTags.split(',').filter(Boolean) : [];

    return (
        <div className="min-h-screen bg-[#fafbff] font-body text-slate-900 pb-20">
            {/* Hero Header */}
            <div className="relative h-[300px] md:h-[450px]">
                <div className="absolute inset-0 bg-slate-200">
                    <img 
                        src={profile.coverImage || "https://images.unsplash.com/photo-1513297845733-10f12a7d5c8a?auto=format&fit=crop&q=80&w=2000"} 
                        alt="Cover" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end gap-10">
                        <div className="relative -mb-12 md:-mb-20">
                            <div className="w-32 h-32 md:w-52 md:h-52 rounded-[48px] border-[10px] border-white bg-white overflow-hidden shadow-2xl ring-1 ring-slate-200 group">
                                <img 
                                    src={profile.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`} 
                                    alt={profile.name || ""} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute bottom-4 right-4 w-6 h-6 bg-green-500 border-4 border-white rounded-full shadow-lg" title="Online"></div>
                            </div>
                        </div>

                        <div className="flex-1 text-white pb-6 space-y-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight">{profile.name}</h1>
                                    <ShieldCheck className="w-8 h-8 text-primary fill-primary/20" />
                                </div>
                                <div className="flex flex-wrap items-center gap-6 text-white/70">
                                    <span className="text-sm md:text-lg font-bold flex items-center gap-2">
                                        <GraduationCap className="w-5 h-5 text-primary" /> {profile.professionalTitle || "Giáo viên Scholar Script"}
                                    </span>
                                    <span className="text-sm md:text-lg font-bold flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-primary" /> Việt Nam
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pb-10">
                            <FollowButton 
                                teacherId={profile.id} 
                                initialIsFollowing={profile.isFollowing} 
                                isLoggedIn={!!session} 
                            />
                            <button className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20 hover:bg-white/20 transition-all outline-none">
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-28 grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Column Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Impact Stats */}
                    <div className="bg-slate-950 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
                        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary mb-10 flex items-center gap-2">
                            <Zap className="w-4 h-4 fill-primary" /> Đóng góp hệ thống
                        </h3>
                        <div className="space-y-10">
                            {[
                                { label: "Tổng lượt xem tài liệu", value: profile.stats.totalViews.toLocaleString(), icon: Globe, color: "text-blue-400" },
                                { label: "Lượt học sinh nộp bài", value: profile.stats.totalSubmissions.toLocaleString(), icon: Users, color: "text-green-400" },
                                { label: "Mức độ hài lòng", value: `${(profile.stats.satisfaction || 0).toFixed(1)}/5`, icon: Star, color: "text-yellow-400" },
                                { label: "Người theo dõi", value: profile.stats.followers.toLocaleString(), icon: Heart, color: "text-pink-400" }
                            ].map((s, idx) => (
                                <div key={idx} className="flex items-center gap-6">
                                    <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 ${s.color}`}>
                                        <s.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black font-headline italic">{s.value}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{s.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-xl font-black font-headline italic">Giới thiệu chuyên môn</h3>
                            <p className="text-sm leading-relaxed text-slate-600 font-medium whitespace-pre-line">
                                {profile.bio || "Hướng tới việc xây dựng thế hệ tương lai thông qua kiến thức sáng tạo."}
                            </p>
                        </div>

                        <div className="space-y-6 pt-6 border-t border-slate-50">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Thông tin liên hệ</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 group cursor-pointer">
                                    <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Email công việc</p>
                                        <p className="text-sm font-bold text-slate-700">{profile.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            {["facebook", "linkedin", "youtube"].map((platform) => {
                                const url = (socialLinks as any)[platform];
                                if (!url) return null;
                                return (
                                    <Link key={platform} href={url} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-primary transition-all">
                                        {platform === 'facebook' && <Facebook className="w-5 h-5 fill-current" />}
                                        {platform === 'linkedin' && <Linkedin className="w-5 h-5 fill-current" />}
                                        {platform === 'youtube' && <Youtube className="w-5 h-5 fill-current" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-8 space-y-20">
                     {/* Classes */}
                     {profile.classes.length > 0 && (
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <Users className="w-7 h-7 text-primary" />
                                <h2 className="text-3xl font-black font-headline italic">Lớp học tiêu biểu</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                                {profile.classes.map((cls: any) => (
                                    <div key={cls.id} className="relative group overflow-hidden bg-white border border-slate-100 p-8 rounded-[40px] hover:border-primary transition-all shadow-sm hover:shadow-2xl hover:shadow-primary/5">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                                        <div className="relative z-10 space-y-6">
                                            <div className="inline-flex px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">{cls.gradeLevel || "Cơ bản"}</div>
                                            <h4 className="text-2xl font-black text-slate-950 leading-tight">{cls.name}</h4>
                                            <p className="text-sm text-slate-500 line-clamp-2">{cls.description || "Tham gia lớp học để nhận các bài giảng độc quyền từ giảng viên."}</p>
                                            <button className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-all">Đăng ký tham gia</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Resources */}
                    <div className="space-y-10">
                        <div className="flex items-center justify-between border-b border-slate-100">
                             <div className="flex gap-16">
                                <button className="text-sm font-black uppercase tracking-widest text-slate-950 border-b-4 border-primary pb-6">Bài tập cá nhân ({profile.stats.assignments})</button>
                                <button className="text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors pb-6">Bài học video ({profile.stats.lessons})</button>
                             </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {profile.assignments.map((assignment: any) => (
                                <Link key={assignment.id} href={`/join/${assignment.id}`} className="flex flex-col gap-6 group">
                                    <div className="relative aspect-video rounded-[40px] overflow-hidden bg-slate-100">
                                        <img src={assignment.thumbnail || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800"} alt="T" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all shadow-2xl">
                                                <Play className="w-6 h-6 text-primary fill-primary" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3 px-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{assignment.subject || "Khám phá"}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Layers className="w-3 h-3" /> {assignment._count.questions} câu hỏi</span>
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors line-clamp-2">{assignment.title}</h4>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Public Reviews Section (UC 12.2) */}
                    <div className="space-y-10 pt-10 border-t border-slate-100">
                         <div className="flex items-center gap-4">
                            <MessageCircle className="w-7 h-7 text-primary" />
                            <h2 className="text-3xl font-black font-headline italic">Phản hồi từ học sinh</h2>
                         </div>
                         <ReviewList reviews={reviews as any} />
                    </div>
                </div>
            </div>
        </div>
    );
}
