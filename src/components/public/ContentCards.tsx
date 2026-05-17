
"use client"
import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"

export function ExerciseCard({ item, isLoggedIn }: { item: any; isLoggedIn: boolean }) {
  const t = useTranslations("home")
  const views = item.viewCount || 0
  const likes = ((item.id?.charCodeAt(0) || 0) * 7) % 1000
  const rating = (4.5 + (item.id?.length % 5) * 0.1).toFixed(1)

  const identifier = item.slug || item.id
  const href = isLoggedIn 
    ? `/student/assignments/${identifier}/run?direct=true` 
    : `/public/assignments/${identifier}?direct=true`

  const thumbnailSrc = item.thumbnail || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800"

  return (
    <div className="relative w-full group">
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-container shadow-xl border-2 border-primary/5">
        <Image 
          src={thumbnailSrc} 
          alt={item.title} 
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-1000 group-hover:scale-105"
          priority={false}
        />
        {/* Badge: Type */}
        <div className="absolute top-4 left-4 z-10">
          <span className={`${
            item.materialType === 'READING' ? 'bg-tertiary' : 
            item.materialType === 'FLASHCARD' ? 'bg-rose-500' : 
            'bg-primary'
          } text-white text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-2 backdrop-blur-md bg-opacity-90`}>
            {item.materialType === 'READING' ? t('reading') : 
             item.materialType === 'FLASHCARD' ? t('flashcard') : 
             useTranslations("nav")("assignments")}
          </span>
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent opacity-60"></div>
      </div>

      {/* Overlapping Content Box */}
      <div className="relative -mt-10 mx-3 bg-white dark:bg-slate-900 rounded-lg p-6 shadow-2xl z-20 border border-primary/10 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-primary/10">
        {/* Teacher Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/20 relative">
            <Image 
              src={item.teacher?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.teacher?.id}`} 
              alt="Teacher" 
              fill
              sizes="32px"
              className="object-cover" 
            />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">
            {item.teacher?.name || t("instructor")}
          </span>
        </div>

        {/* Title */}
        <Link href={href}>
          <h3 className="text-foreground text-lg font-black leading-tight mb-6 tracking-tight line-clamp-2 min-h-[2.8rem] group-hover:text-primary transition-colors">
            {item.title}
          </h3>
        </Link>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-5 border-t border-primary/5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-primary/40">
              <span className="material-symbols-outlined !text-[18px]">visibility</span>
              <span className="text-tiny font-black">{views}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary/10 px-4 py-1.5 rounded-full">
            <span className="material-symbols-outlined !text-[16px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-secondary text-tiny font-black">{rating}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LessonCard({ item, isLoggedIn }: { item: any; isLoggedIn?: boolean }) {
  const t = useTranslations("home")
  const isReading = item.type === 'READING_LESSON' || item.materialType === 'READING'
  
  const thumb = isReading 
    ? (item.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800")
    : (item.videoUrl && item.videoUrl.includes("v=")
        ? `https://img.youtube.com/vi/${item.videoUrl.split("v=")[1]?.split("&")[0]}/hqdefault.jpg`
        : (item.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800"))

  const views = (item.viewCount !== undefined ? item.viewCount : item.viewsCount) || 0
  const rating = (4.5 + (item.id?.length % 5) * 0.1).toFixed(1)
  const reviewCount = item._count?.reviews || 0

  const identifier = item.slug || item.id
  const href = isLoggedIn 
    ? `/student/lessons/${identifier}` 
    : `/public/lessons/${identifier}`

  return (
    <div className="relative w-full group">
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-container shadow-xl border-2 border-secondary/5">
        <Image 
          src={thumb} 
          alt={item.title} 
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-1000 group-hover:scale-105"
          priority={false}
        />
        {/* Badge: Type */}
        <div className="absolute top-4 left-4 z-10">
          <span className={`${
            item.materialType === 'READING' ? 'bg-tertiary' : 
            item.materialType === 'FLASHCARD' ? 'bg-rose-500' : 
            'bg-secondary'
          } text-white text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-2 backdrop-blur-md bg-opacity-90`}>
            {item.materialType === 'READING' ? t('reading') : 
             item.materialType === 'FLASHCARD' ? t('flashcard') : 
             useTranslations("nav")("lessons")}
          </span>
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/40 via-transparent to-transparent opacity-60"></div>
      </div>

      {/* Overlapping Content Box */}
      <div className="relative -mt-10 mx-3 bg-white dark:bg-slate-900 rounded-lg p-6 shadow-2xl z-20 border border-secondary/10 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-secondary/10">
        {/* Teacher Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-secondary/20 relative">
            <Image 
              src={item.teacher?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.teacher?.id}`} 
              alt="Teacher" 
              fill
              sizes="32px"
              className="object-cover" 
            />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">
            {item.teacher?.name || t("instructor")}
          </span>
        </div>

        {/* Title */}
        <Link href={href}>
          <h3 className="text-foreground text-lg font-black leading-tight mb-6 tracking-tight line-clamp-2 min-h-[2.8rem] group-hover:text-secondary transition-colors">
            {item.title}
          </h3>
        </Link>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-5 border-t border-secondary/5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-secondary/40">
              <span className="material-symbols-outlined !text-[18px]">visibility</span>
              <span className="text-tiny font-black">{views}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 px-4 py-1.5 rounded-full">
            <span className="material-symbols-outlined !text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-primary text-tiny font-black">{rating}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
