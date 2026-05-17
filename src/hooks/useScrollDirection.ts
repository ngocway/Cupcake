"use client"
import { useState, useEffect, useCallback, useRef } from "react"

interface UseScrollDirectionOptions {
  threshold?: number
  off?: boolean
}

export function useScrollDirection({ threshold = 10, off = false }: UseScrollDirectionOptions = {}) {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up")
  const [isAtTop, setIsAtTop] = useState(true)
  const [isHidden, setIsHidden] = useState(false)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  const updateScrollDirection = useCallback((e?: Event) => {
    let scrollY = window.scrollY
    
    if (e?.target && e.target !== document) {
      const target = e.target as HTMLElement
      if (target.scrollTop !== undefined) {
        scrollY = target.scrollTop
      }
    }

    setIsAtTop(scrollY < 50)
    
    if (Math.abs(scrollY - lastScrollY.current) < threshold) {
      ticking.current = false
      return
    }

    const direction = scrollY > lastScrollY.current ? "down" : "up"
    
    // Only hide when scrolling down and past the header
    if (direction === "down" && scrollY > 100) {
      setIsHidden(true)
    } else if (direction === "up") {
      setIsHidden(false)
    }
    
    setScrollDirection(direction)
    lastScrollY.current = scrollY > 0 ? scrollY : 0
    ticking.current = false
  }, [threshold])

  useEffect(() => {
    if (off) {
      setIsHidden(false)
      setScrollDirection("up")
      return
    }

    const onScroll = (e: Event) => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => updateScrollDirection(e))
        ticking.current = true
      }
    }

    document.addEventListener("scroll", onScroll, { passive: true, capture: true })
    
    // Initialize
    lastScrollY.current = window.scrollY
    
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true })
    }
  }, [updateScrollDirection, off])

  return { scrollDirection, isAtTop, isHidden }
}
