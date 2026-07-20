
"use client"
import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"

const getLevelsWithColors = (level: string | null | undefined): { label: string; color: string }[] => {
  if (!level) return [];
  const levels = level.split(',').map(l => l.trim().toLowerCase()).filter(Boolean);
  const uniqueLevels = Array.from(new Set(levels));
  
  return uniqueLevels.map(l => {
    switch (l) {
      case 'pre-a1-a1':
      case 'beginner':
        return { label: 'Pre-A1/A1', color: 'bg-emerald-500 text-white' };
      case 'a2':
      case 'elementary':
        return { label: 'A2', color: 'bg-sky-500 text-white' };
      case 'b1':
      case 'intermediate':
        return { label: 'B1', color: 'bg-violet-500 text-white' };
      case 'b2':
      case 'upper-intermediate':
      case 'upper_intermediate':
        return { label: 'B2', color: 'bg-amber-500 text-white' };
      case 'advanced':
        return { label: 'C1', color: 'bg-rose-500 text-white' };
      default:
        return { label: l.toUpperCase(), color: 'bg-primary text-white' };
    }
  });
}

export function ExerciseCard({ item, isLoggedIn }: { item: any; isLoggedIn: boolean }) {
  const t = useTranslations("home")
  const views = (item.viewCount || 0) + 1500
  const likes = ((item.id?.charCodeAt(0) || 0) * 7) % 1000
  const rating = (4.5 + (item.id?.length % 5) * 0.1).toFixed(1)

  const identifier = item.slug || item.id
  const href = isLoggedIn 
    ? `/student/assignments/${identifier}/run?direct=true` 
    : `/public/assignments/${identifier}?direct=true`

  const thumbnailSrc = item.thumbnail || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800"

  const tagsArray = Array.isArray(item.tags)
    ? item.tags
    : typeof item.tags === "string"
      ? item.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : []

  return (
    <div className="relative w-full group">
      {/* Thumbnail Container */}
      <Link href={href} className="block relative aspect-video w-full overflow-hidden rounded-lg bg-surface-container shadow-xl border-2 border-primary/5 cursor-pointer">
        <Image 
          src={thumbnailSrc} 
          alt={item.title} 
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-1000 group-hover:scale-105"
          priority={false}
        />
        {/* Media Icons */}
        {(item.videoUrl || item.audioUrl) && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            {item.videoUrl && (
              <div className="bg-black/60 text-white p-2 rounded-full shadow-lg flex items-center justify-center backdrop-blur-md border border-white/20">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
              </div>
            )}
            {item.audioUrl && (
              <div className="bg-black/60 text-white p-2 rounded-full shadow-lg flex items-center justify-center backdrop-blur-md border border-white/20">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>headphones</span>
              </div>
            )}
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent opacity-60"></div>
      </Link>

      {/* Overlapping Content Box */}
      <div className="relative -mt-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg rounded-lg p-6 shadow-2xl z-20 border border-primary/10 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-primary/10 group-hover:bg-white/90">
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
          <h3 className="text-foreground text-lg font-black leading-tight mb-2 tracking-tight line-clamp-2 min-h-[2.8rem] group-hover:text-primary transition-colors">
            {item.title}
          </h3>
        </Link>

        {/* Level Badges */}
        {item.level && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {getLevelsWithColors(item.level).map((lvl, index) => (
              <span 
                key={index}
                className={`${lvl.color} px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider shadow-sm`}
              >
                {lvl.label}
              </span>
            ))}
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-3 border-t border-primary/5">
          <div className="flex items-center flex-wrap gap-2">
            {tagsArray.length > 0 && (
              <div className="flex items-center gap-1">
                {tagsArray.slice(0, 3).map((tag: string) => (
                  <Link 
                    key={tag} 
                    href={`/tags/${encodeURIComponent(tag)}`}
                    className="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm border border-yellow-100 dark:border-yellow-800/30 hover:scale-105 hover:bg-yellow-100 transition-all duration-300 relative z-30"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
            {item._count?.questions !== undefined && (
              <div className="flex items-center gap-1.5 text-primary/40 ml-1">
                <span className="material-symbols-outlined !text-[18px]">help</span>
                <span className="text-tiny font-black">{item._count.questions} Qs</span>
              </div>
            )}
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

export function ExerciseCardHorizontal({ item, isLoggedIn }: { item: any; isLoggedIn: boolean }) {
  const t = useTranslations("home")
  const views = (item.viewCount || 0) + 1500
  const rating = (4.5 + (item.id?.length % 5) * 0.1).toFixed(1)

  const identifier = item.slug || item.id
  const href = isLoggedIn 
    ? `/student/assignments/${identifier}/run?direct=true` 
    : `/public/assignments/${identifier}?direct=true`

  const thumbnailSrc = item.thumbnail || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800"

  const tagsArray = Array.isArray(item.tags)
    ? item.tags
    : typeof item.tags === "string"
      ? item.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : []

  return (
    <Link
      href={href}
      className="group flex flex-row relative rounded-[10px] overflow-hidden bg-white dark:bg-slate-900 border border-primary/5 hover:border-primary/20 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer min-h-[120px]"
    >
      {/* Level Badges in top-right of the card */}
      {item.level && (
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-wrap gap-1">
          {getLevelsWithColors(item.level).map((lvl, index) => (
            <span
              key={index}
              className={`${lvl.color} px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shadow-sm`}
            >
              {lvl.label}
            </span>
          ))}
        </div>
      )}

      {/* Thumbnail — left */}
      <div className="relative w-[36%] shrink-0 aspect-video overflow-hidden self-center bg-slate-100 dark:bg-slate-800 rounded-[6px] ml-2.5">
        <Image
          src={thumbnailSrc}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 36vw, 15vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority={false}
        />
        {/* Media icons */}
        {(item.videoUrl || item.audioUrl) && (
          <div className="absolute top-2 right-2 z-10 flex gap-1">
            {item.videoUrl && (
              <div className="bg-black/60 backdrop-blur-sm text-white p-1 rounded-full flex items-center justify-center border border-white/10">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
              </div>
            )}
            {item.audioUrl && (
              <div className="bg-black/60 backdrop-blur-sm text-white p-1 rounded-full flex items-center justify-center border border-white/10">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>headphones</span>
              </div>
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/5 pointer-events-none" />
      </div>

      {/* Content — right */}
      <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
        <div className="pr-16">
          {/* Teacher Info */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-4 h-4 rounded-full overflow-hidden border border-primary/10 relative shrink-0">
              <Image
                src={item.teacher?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.teacher?.id}`}
                alt="Teacher"
                fill
                sizes="16px"
                className="object-cover"
              />
            </div>
            <span className="text-[9px] font-medium tracking-wide text-primary/60 truncate">
              {item.teacher?.name || t("instructor")}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-foreground text-sm font-black leading-snug tracking-tight line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-2 border-t border-primary/5 mt-3">
          <div className="flex items-center gap-3">
            {item._count?.questions !== undefined && (
              <div className="flex items-center gap-1 text-primary/40">
                <span className="material-symbols-outlined !text-[13px]">help</span>
                <span className="text-[9px] font-bold">{item._count.questions} Qs</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-primary/40">
              <span className="material-symbols-outlined !text-[13px]">visibility</span>
              <span className="text-[9px] font-bold">{views}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/5">
            <span className="material-symbols-outlined !text-[11px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-secondary text-[9px] font-black">{rating}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}


export function LessonCard({ item, isLoggedIn }: { item: any; isLoggedIn?: boolean }) {
  const t = useTranslations("home")
  const isReading = item.type === 'READING_LESSON' || item.materialType === 'READING'
  
  const thumb = item.thumbnail 
    ? item.thumbnail 
    : (!isReading && item.videoUrl && item.videoUrl.includes("v=")
        ? `https://img.youtube.com/vi/${item.videoUrl.split("v=")[1]?.split("&")[0]}/hqdefault.jpg`
        : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800")

  const views = ((item.viewCount !== undefined ? item.viewCount : item.viewsCount) || 0) + 1500
  const rating = (4.5 + (item.id?.length % 5) * 0.1).toFixed(1)
  const reviewCount = item._count?.reviews || 0

  const identifier = item.slug || item.id
  const href = isLoggedIn 
    ? `/student/lessons/${identifier}` 
    : `/public/lessons/${identifier}`

  const tagsArray = Array.isArray(item.tags)
    ? item.tags
    : typeof item.tags === "string"
      ? item.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : []

  return (
    <div className="relative w-full group">
      {/* Thumbnail Container */}
      <Link href={href} className="block relative aspect-video w-full overflow-hidden rounded-lg bg-surface-container shadow-xl border-2 border-secondary/5 cursor-pointer">
        <Image 
          src={thumb} 
          alt={item.title} 
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-1000 group-hover:scale-105"
          priority={false}
        />
        {/* Media Icons */}
        {(item.videoUrl || item.audioUrl) && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            {item.videoUrl && (
              <div className="bg-black/60 text-white p-2 rounded-full shadow-lg flex items-center justify-center backdrop-blur-md border border-white/20">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
              </div>
            )}
            {item.audioUrl && (
              <div className="bg-black/60 text-white p-2 rounded-full shadow-lg flex items-center justify-center backdrop-blur-md border border-white/20">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>headphones</span>
              </div>
            )}
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/40 via-transparent to-transparent opacity-60"></div>
      </Link>

      {/* Overlapping Content Box */}
      <div className="relative -mt-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg rounded-lg p-6 shadow-2xl z-20 border border-secondary/10 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-secondary/10 group-hover:bg-white/90">
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
          <h3 className="text-foreground text-lg font-black leading-tight mb-2 tracking-tight line-clamp-2 min-h-[2.8rem] group-hover:text-secondary transition-colors">
            {item.title}
          </h3>
        </Link>

        {/* Level Badges */}
        {item.level && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {getLevelsWithColors(item.level).map((lvl, index) => (
              <span 
                key={index}
                className={`${lvl.color} px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider shadow-sm`}
              >
                {lvl.label}
              </span>
            ))}
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-3 border-t border-secondary/5">
          <div className="flex items-center flex-wrap gap-2">
            {tagsArray.length > 0 && (
              <div className="flex items-center gap-1">
                {tagsArray.slice(0, 3).map((tag: string) => (
                  <Link 
                    key={tag} 
                    href={`/tags/${encodeURIComponent(tag)}`}
                    className="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm border border-yellow-100 dark:border-yellow-800/30 hover:scale-105 hover:bg-yellow-100 transition-all duration-300 relative z-30"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
            <div className="flex items-center text-emerald-600 px-1">
              <span className="text-[11px] font-semibold">{((item.title?.length || 10) * 12 + 100) % 800 + 150} words</span>
            </div>
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
