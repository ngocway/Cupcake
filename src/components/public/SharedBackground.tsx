"use client"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function SharedBackground() {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isHomepage = pathname === "/"

  return (
    <div className={`fixed inset-0 -z-50 overflow-hidden transition-all duration-1000 pointer-events-none ${
      isHomepage
        ? "bg-gradient-to-b from-[#87CEEB] to-[#FFF8E7]"
        : "bg-gradient-to-tr from-[#e6fcf0] via-[#f2faf5] to-[#cbf9e2]"
    }`}>
      {isHomepage ? (
        <>
          {/* Solar Flare / Ambient Glow */}
          <div className="absolute top-[-10%] right-[-10%] w-[50%] aspect-square bg-secondary/20 blur-[120px] rounded-full animate-float" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] aspect-square bg-primary/10 blur-[100px] rounded-full" />
          {/* Organic botanical texture overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/leaf.png')]" />
        </>
      ) : (
        <>
          {/* Green gradient blobs — same as reference HTML, shown on all non-homepage pages */}
          <div className="absolute top-[-5%] left-[-5%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-[#6ee7b7]/60 to-transparent blur-[110px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tl from-[#a7f3d0]/60 to-transparent blur-[130px]" />
          <div className="absolute top-[15%] right-[5%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-bl from-[#5eead4]/50 to-transparent blur-[110px]" />
          {/* Subtle dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(#15803d 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px',
            }}
          />
        </>
      )}
    </div>
  )
}
