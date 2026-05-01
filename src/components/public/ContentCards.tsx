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
    <div className="relative w-full group">
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden rounded-[8px] bg-surface-container shadow-xl">
        <img 
          src={item.thumbnail || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800"} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1" 
        />
        {/* Badge: 'Mới nhất' */}
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-primary text-on-primary text-tiny font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-2xl flex items-center gap-2 backdrop-blur-md bg-primary/90">
            <span className="material-symbols-outlined !text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            Mới nhất
          </span>
        </div>
        {/* Media Icons */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {item.videoUrl && (
            <div title="Có video" className="bg-black/60 backdrop-blur-xl text-white w-9 h-9 rounded-xl flex items-center justify-center shadow-2xl border border-white/20">
              <span className="material-symbols-outlined !text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
            </div>
          )}
          {item.audioUrl && (
            <div title="Có audio" className="bg-black/60 backdrop-blur-xl text-white w-9 h-9 rounded-xl flex items-center justify-center shadow-2xl border border-white/20">
              <span className="material-symbols-outlined !text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>headphones</span>
            </div>
          )}
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
      </div>

      {/* Overlapping Content Box */}
      <div className="relative -mt-12 mx-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[8px] p-5 shadow-2xl z-20 border border-white/20 dark:border-white/10 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-primary/20">
        {/* Teacher Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 rounded-lg overflow-hidden border-2 border-primary/20">
            <img 
              src={item.teacher?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.teacher?.id}`} 
              alt="Teacher" 
              className="w-full h-full object-cover" 
            />
          </div>
          <span className="text-tiny font-bold text-on-surface-variant opacity-70">
            {item.teacher?.name || "Giáo viên"}
          </span>
        </div>

        {/* Title */}
        <Link href={href}>
          <h3 className="text-on-surface text-base font-black leading-tight mb-5 tracking-tight line-clamp-2 min-h-[2.8rem] group-hover:text-primary transition-colors">
            {item.title}
          </h3>
        </Link>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4">
            {/* Views */}
            <div className="flex items-center gap-1.5 text-on-surface-variant/60">
              <span className="material-symbols-outlined !text-[18px]">visibility</span>
              <span className="text-tiny font-black">{views}</span>
            </div>
            {/* Likes */}
            <div className="flex items-center gap-1.5 text-on-surface-variant/60">
              <span className="material-symbols-outlined !text-[18px]">favorite</span>
              <span className="text-tiny font-black">{likes}</span>
            </div>
          </div>
          {/* Rating */}
          <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-lg">
            <span className="material-symbols-outlined !text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-primary text-tiny font-black">{rating}</span>
          </div>
        </div>
      </div>
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
    <div className="relative w-full group">
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden rounded-[8px] bg-surface-container shadow-xl">
        <img 
          src={thumb} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-1" 
        />
        {/* Badge: 'Bài học' */}
        <div className="absolute top-4 left-4 z-10">
          <span className={`${isReading ? 'bg-amber-500' : 'bg-secondary'} text-white text-tiny font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-2xl flex items-center gap-2 backdrop-blur-md bg-opacity-90`}>
            <span className="material-symbols-outlined !text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isReading ? 'menu_book' : 'play_circle'}
            </span>
            {isReading ? 'Reading' : 'Bài học'}
          </span>
        </div>
        {/* Media Icons */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {item.videoUrl && (
            <div title="Có video" className="bg-black/60 backdrop-blur-xl text-white w-9 h-9 rounded-xl flex items-center justify-center shadow-2xl border border-white/20">
              <span className="material-symbols-outlined !text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
            </div>
          )}
          {item.audioUrl && (
            <div title="Có audio" className="bg-black/60 backdrop-blur-xl text-white w-9 h-9 rounded-xl flex items-center justify-center shadow-2xl border border-white/20">
              <span className="material-symbols-outlined !text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>headphones</span>
            </div>
          )}
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
      </div>

      {/* Overlapping Content Box */}
      <div className="relative -mt-12 mx-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[8px] p-5 shadow-2xl z-20 border border-white/20 dark:border-white/10 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-secondary/20">
        {/* Teacher Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 rounded-lg overflow-hidden border-2 border-secondary/20">
            <img 
              src={item.teacher?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.teacher?.id}`} 
              alt="Teacher" 
              className="w-full h-full object-cover" 
            />
          </div>
          <span className="text-tiny font-bold text-on-surface-variant opacity-70">
            {item.teacher?.name || "Giáo viên"}
          </span>
        </div>

        {/* Title */}
        <Link href={href}>
          <h3 className="text-on-surface text-base font-black leading-tight mb-5 tracking-tight line-clamp-2 min-h-[2.8rem] group-hover:text-secondary transition-colors">
            {item.title}
          </h3>
        </Link>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4">
            {/* Views */}
            <div className="flex items-center gap-1.5 text-on-surface-variant/60">
              <span className="material-symbols-outlined !text-[18px]">visibility</span>
              <span className="text-tiny font-black">{views}</span>
            </div>
            {/* Reviews */}
            <div className="flex items-center gap-1.5 text-on-surface-variant/60">
              <span className="material-symbols-outlined !text-[18px]">chat_bubble</span>
              <span className="text-tiny font-black">{reviewCount}</span>
            </div>
          </div>
          {/* Rating */}
          <div className="flex items-center gap-1.5 bg-secondary/10 px-3 py-1 rounded-lg">
            <span className="material-symbols-outlined !text-[16px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-secondary text-tiny font-black">{rating}</span>
          </div>
        </div>
      </div>
    </div>

  )
}
