"use client"
import Link from "next/link"

export function ExerciseCard({ item, isLoggedIn }: { item: any; isLoggedIn: boolean }) {
  const views = item.viewCount || 0
  const likes = ((item.id?.charCodeAt(0) || 0) * 7) % 1000
  const rating = (4.5 + (item.id?.length % 5) * 0.1).toFixed(1)

  // Skip the intermediate lobby by adding ?direct=true
  const href = isLoggedIn 
    ? `/student/assignments/${item.id}/run?direct=true` 
    : `/public/assignments/${item.id}?direct=true`

  return (
    <div className="relative w-full group transition-all duration-300 hover:-translate-y-2">
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden rounded-[5px] shadow-[0px_20px_40px_rgba(0,51,68,0.06)] bg-surface-container">
        <img 
          src={item.thumbnail || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800"} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        {/* Badge: 'Mới nhất' */}
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-primary text-on-primary text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1.5">
            <span className="material-symbols-outlined !text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            Mới nhất
          </span>
        </div>
        {/* Media Icons */}
        <div className="absolute top-4 right-4 z-10 flex gap-1.5">
          {item.videoUrl && (
            <div title="Có video" className="bg-black/60 backdrop-blur-md text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg border border-white/20">
              <span className="material-symbols-outlined !text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
            </div>
          )}
          {item.audioUrl && (
            <div title="Có audio" className="bg-black/60 backdrop-blur-md text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg border border-white/20">
              <span className="material-symbols-outlined !text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>headphones</span>
            </div>
          )}
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
      </div>

      {/* Overlapping Content Box */}
      <div className="relative -mt-[40px] mx-[6px] bg-white/80 backdrop-blur-xl rounded-[10px] p-3 shadow-[0px_10px_30px_rgba(0,51,68,0.1)] z-20 border border-white/20">
        {/* Teacher Info */}
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-primary-container/30">
            <img 
              src={item.teacher?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.teacher?.id}`} 
              alt="Teacher" 
              className="w-full h-full object-cover" 
            />
          </div>
          <span className="text-on-surface-variant/80 text-[11px] font-medium tracking-tight">
            {item.teacher?.name || "Giáo viên"}
          </span>
        </div>

        {/* Title */}
        <Link href={href}>
          <h3 className="text-on-surface text-sm font-extrabold leading-snug mb-4 tracking-tight line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
            {item.title}
          </h3>
        </Link>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-container">
          <div className="flex items-center gap-3">
            {/* Views */}
            <div className="flex items-center gap-1 text-on-surface-variant/60">
              <span className="material-symbols-outlined !text-[16px]">visibility</span>
              <span className="text-[10px] font-bold">{views}</span>
            </div>
            {/* Likes */}
            <div className="flex items-center gap-1 text-on-surface-variant/60">
              <span className="material-symbols-outlined !text-[16px]">favorite</span>
              <span className="text-[10px] font-bold">{likes}</span>
            </div>
          </div>
          {/* Rating */}
          <div className="flex items-center gap-1 bg-primary-container/10 px-2 py-0.5 rounded-full">
            <span className="material-symbols-outlined !text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-primary text-[10px] font-bold">{rating}</span>
          </div>
        </div>
      </div>
      {/* Decorative Glow */}
      <div className="absolute -z-10 -bottom-4 -right-4 w-24 h-24 bg-primary/5 blur-3xl rounded-full group-hover:bg-primary/10 transition-colors duration-500"></div>
    </div>
  )
}

export function LessonCard({ item, isLoggedIn }: { item: any; isLoggedIn?: boolean }) {
  const isReading = item.type === 'READING_LESSON' || item.materialType === 'READING'
  
  const thumb = isReading 
    ? (item.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800")
    : (item.videoUrl
        ? `https://img.youtube.com/vi/${item.videoUrl.split("v=")[1]?.split("&")[0]}/hqdefault.jpg`
        : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800")

  const views = (item.viewCount !== undefined ? item.viewCount : item.viewsCount) || 0
  const rating = (4.5 + (item.id?.length % 5) * 0.1).toFixed(1)
  const reviewCount = item._count?.reviews || 0

  // For lessons, we use the student route if logged in to maintain consistent state
  const href = isReading
    ? (isLoggedIn 
        ? `/student/assignments/${item.id}/run?direct=true` 
        : `/public/assignments/${item.id}?direct=true`)
    : (isLoggedIn 
        ? `/student/lessons/${item.id}` 
        : `/public/lessons/${item.id}`)

  return (
    <div className="relative w-full group transition-all duration-300 hover:-translate-y-2">
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden rounded-[5px] shadow-[0px_20px_40px_rgba(0,51,68,0.06)] bg-surface-container">
        <img 
          src={thumb} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        {/* Badge: 'Bài học' */}
        <div className="absolute top-4 left-4 z-10">
          <span className={`${isReading ? 'bg-amber-500' : 'bg-secondary'} text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1.5`}>
            <span className="material-symbols-outlined !text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isReading ? 'menu_book' : 'play_circle'}
            </span>
            {isReading ? 'Reading' : 'Bài học'}
          </span>
        </div>
        {/* Media Icons */}
        <div className="absolute top-4 right-4 z-10 flex gap-1.5">
          {item.videoUrl && (
            <div title="Có video" className="bg-black/60 backdrop-blur-md text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg border border-white/20">
              <span className="material-symbols-outlined !text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
            </div>
          )}
          {item.audioUrl && (
            <div title="Có audio" className="bg-black/60 backdrop-blur-md text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg border border-white/20">
              <span className="material-symbols-outlined !text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>headphones</span>
            </div>
          )}
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
      </div>

      {/* Overlapping Content Box */}
      <div className="relative -mt-[40px] mx-[6px] bg-white/80 backdrop-blur-xl rounded-[10px] p-3 shadow-[0px_10px_30px_rgba(0,51,68,0.1)] z-20 border border-white/20">
        {/* Teacher Info */}
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-secondary-container/30">
            <img 
              src={item.teacher?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.teacher?.id}`} 
              alt="Teacher" 
              className="w-full h-full object-cover" 
            />
          </div>
          <span className="text-on-surface-variant/80 text-[11px] font-medium tracking-tight">
            {item.teacher?.name || "Giáo viên"}
          </span>
        </div>

        {/* Title */}
        <Link href={href}>
          <h3 className="text-on-surface text-sm font-extrabold leading-snug mb-4 tracking-tight line-clamp-2 min-h-[2.5rem] group-hover:text-secondary transition-colors">
            {item.title}
          </h3>
        </Link>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-container">
          <div className="flex items-center gap-3">
            {/* Views */}
            <div className="flex items-center gap-1 text-on-surface-variant/60">
              <span className="material-symbols-outlined !text-[16px]">visibility</span>
              <span className="text-[10px] font-bold">{views}</span>
            </div>
            {/* Reviews */}
            <div className="flex items-center gap-1 text-on-surface-variant/60">
              <span className="material-symbols-outlined !text-[16px]">chat_bubble</span>
              <span className="text-[10px] font-bold">{reviewCount}</span>
            </div>
          </div>
          {/* Rating */}
          <div className="flex items-center gap-1 bg-secondary-container/20 px-2 py-0.5 rounded-full">
            <span className="material-symbols-outlined !text-[14px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-secondary text-[10px] font-bold">{rating}</span>
          </div>
        </div>
      </div>
      {/* Decorative Glow */}
      <div className="absolute -z-10 -bottom-4 -right-4 w-24 h-24 bg-secondary/5 blur-3xl rounded-full group-hover:bg-secondary/10 transition-colors duration-500"></div>
    </div>
  )
}
