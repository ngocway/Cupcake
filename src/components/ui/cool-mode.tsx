"use client"

import React, { useEffect, useRef, type ReactNode } from "react"

export interface BaseParticle {
  element: HTMLElement | SVGSVGElement
  left: number
  size: number
  top: number
}

export interface BaseParticleOptions {
  particle?: string
  particles?: string[]
  size?: number
}

export interface CoolParticle extends BaseParticle {
  direction: number
  speedHorz: number
  speedUp: number
  spinSpeed: number
  spinVal: number
  opacity: number
}

export interface CoolParticleOptions extends BaseParticleOptions {
  particleCount?: number
  speedHorz?: number
  speedUp?: number
}

const SVG_NS = "http://www.w3.org/2000/svg"

const getContainer = () => {
  const id = "_coolMode_effect"
  const existingContainer = document.getElementById(id)

  if (existingContainer) {
    return existingContainer
  }

  const container = document.createElement("div")
  container.setAttribute("id", id)
  container.setAttribute(
    "style",
    "overflow:hidden; position:fixed; height:100%; top:0; left:0; right:0; bottom:0; pointer-events:none; z-index:2147483647"
  )

  document.body.appendChild(container)

  return container
}

let instanceCounter = 0

const applyParticleEffect = (
  element: HTMLElement,
  options?: CoolParticleOptions
): (() => void) => {
  instanceCounter++

  const defaultParticle = "circle"
  const sizes = [14, 18, 22, 26]
  const limit = 40

  let particles: CoolParticle[] = []
  let autoAddParticle = false
  let mouseX = 0
  let mouseY = 0

  const container = getContainer()

  const appendCircleParticle = (particle: HTMLDivElement, size: number) => {
    const circleSVG = document.createElementNS(SVG_NS, "svg")
    const circle = document.createElementNS(SVG_NS, "circle")

    circle.setAttributeNS(null, "cx", (size / 2).toString())
    circle.setAttributeNS(null, "cy", (size / 2).toString())
    circle.setAttributeNS(null, "r", (size / 2).toString())
    circle.setAttributeNS(
      null,
      "fill",
      `hsl(${Math.floor(Math.random() * 360)}, 85%, 62%)`
    )

    circleSVG.appendChild(circle)
    circleSVG.setAttribute("width", size.toString())
    circleSVG.setAttribute("height", size.toString())

    particle.appendChild(circleSVG)
  }

  const appendImageParticle = (
    particle: HTMLDivElement,
    imageSrc: string,
    size: number
  ) => {
    const image = document.createElement("img")
    image.src = imageSrc
    image.width = size
    image.height = size
    image.alt = ""
    image.style.borderRadius = "50%"

    particle.appendChild(image)
  }

  const appendTextParticle = (
    particle: HTMLDivElement,
    particleContent: string,
    size: number
  ) => {
    const content = document.createElement("div")
    content.textContent = particleContent
    content.style.fontSize = `${size}px`
    content.style.lineHeight = "1"
    content.style.textAlign = "center"
    content.style.userSelect = "none"

    particle.appendChild(content)
  }

  function pickParticleType(): string {
    if (options?.particles && options.particles.length > 0) {
      return options.particles[
        Math.floor(Math.random() * options.particles.length)
      ]
    }
    return options?.particle || defaultParticle
  }

  function generateParticle(spreadPx = 0) {
    if (particles.length >= limit) return
    const particleType = pickParticleType()
    const size =
      options?.size || sizes[Math.floor(Math.random() * sizes.length)]
    const speedHorz = options?.speedHorz || Math.random() * 6 + 1.5
    const speedUp = options?.speedUp || Math.random() * 14 + 8
    const spinVal = Math.random() * 360
    const spinSpeed = Math.random() * 18 * (Math.random() <= 0.5 ? -1 : 1)
    const jitterX = spreadPx ? (Math.random() - 0.5) * spreadPx : 0
    const jitterY = spreadPx ? (Math.random() - 0.5) * spreadPx : 0
    const top = mouseY + jitterY - size / 2
    const left = mouseX + jitterX - size / 2
    const direction = Math.random() <= 0.5 ? -1 : 1

    const particle = document.createElement("div")

    if (particleType === "circle") {
      appendCircleParticle(particle, size)
    } else if (
      particleType.startsWith("http") ||
      particleType.startsWith("/")
    ) {
      appendImageParticle(particle, particleType, size)
    } else {
      appendTextParticle(particle, particleType, size)
    }

    particle.style.position = "absolute"
    particle.style.top = "0px"
    particle.style.left = "0px"
    particle.style.willChange = "transform,opacity"
    particle.style.transform = `translate3d(${left}px, ${top}px, 0px) rotate(${spinVal}deg)`

    container.appendChild(particle)

    particles.push({
      direction,
      element: particle,
      left,
      size,
      speedHorz,
      speedUp,
      spinSpeed,
      spinVal,
      top,
      opacity: 1,
    })
  }

  function refreshParticles() {
    if (particles.length === 0) return
    const maxBottom = Math.max(window.innerHeight, document.body.clientHeight)
    const remaining: CoolParticle[] = []

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      p.left = p.left - p.speedHorz * p.direction
      p.top = p.top - p.speedUp
      p.speedUp = Math.max(-12, p.speedUp - 0.75)
      p.spinVal = p.spinVal + p.spinSpeed
      if (p.speedUp < -2) {
        p.opacity = Math.max(0, p.opacity - 0.035)
      }

      if (p.opacity <= 0 || p.top >= maxBottom + p.size) {
        p.element.remove()
        continue
      }

      p.element.style.opacity = p.opacity.toFixed(2)
      p.element.style.transform = `translate3d(${p.left}px, ${p.top}px, 0px) rotate(${p.spinVal}deg)`
      remaining.push(p)
    }

    particles = remaining
  }

  let animationFrame: number | undefined
  let lastParticleTimestamp = 0
  let isDisposed = false
  const particleGenerationDelay = 40

  function loop() {
    if (isDisposed) {
      animationFrame = undefined
      return
    }
    const currentTime = performance.now()
    if (
      autoAddParticle &&
      particles.length < limit &&
      currentTime - lastParticleTimestamp > particleGenerationDelay
    ) {
      generateParticle(8)
      lastParticleTimestamp = currentTime
    }

    refreshParticles()

    // On-demand rAF: stop immediately when no active particles remain
    if (particles.length > 0 || autoAddParticle) {
      animationFrame = requestAnimationFrame(loop)
    } else {
      animationFrame = undefined
    }
  }

  function ensureLoopRunning() {
    if (!isDisposed && animationFrame === undefined) {
      animationFrame = requestAnimationFrame(loop)
    }
  }

  const isTouchInteraction = "ontouchstart" in window
  const tap = isTouchInteraction ? "touchstart" : "mousedown"
  const tapEnd = isTouchInteraction ? "touchend" : "mouseup"
  const move = isTouchInteraction ? "touchmove" : "mousemove"

  const updateMousePosition = (e: MouseEvent | TouchEvent) => {
    if ("touches" in e && e.touches.length > 0) {
      mouseX = e.touches[0].clientX
      mouseY = e.touches[0].clientY
    } else if ("clientX" in e) {
      mouseX = e.clientX
      mouseY = e.clientY
    }
  }

  const tapHandler = (e: MouseEvent | TouchEvent) => {
    updateMousePosition(e)
    const burstCount = options?.particleCount ?? 7
    for (let i = 0; i < burstCount; i++) {
      generateParticle(18)
    }
    lastParticleTimestamp = performance.now()
    autoAddParticle = true
    ensureLoopRunning()
  }

  const disableAutoAddParticle = () => {
    autoAddParticle = false
  }

  element.addEventListener(move, updateMousePosition, { passive: true })
  element.addEventListener(tap, tapHandler, { passive: true })
  element.addEventListener(tapEnd, disableAutoAddParticle, { passive: true })
  element.addEventListener("mouseleave", disableAutoAddParticle, {
    passive: true,
  })

  return () => {
    isDisposed = true
    disableAutoAddParticle()
    element.removeEventListener(move, updateMousePosition)
    element.removeEventListener(tap, tapHandler)
    element.removeEventListener(tapEnd, disableAutoAddParticle)
    element.removeEventListener("mouseleave", disableAutoAddParticle)

    if (animationFrame !== undefined) {
      cancelAnimationFrame(animationFrame)
      animationFrame = undefined
    }

    // Remove any remaining particle nodes created by this instance immediately
    for (let i = 0; i < particles.length; i++) {
      particles[i].element.remove()
    }
    particles = []

    if (--instanceCounter === 0) {
      container.remove()
    }
  }
}

export interface CoolModeProps {
  children: ReactNode
  options?: CoolParticleOptions
  className?: string
}

export const CoolMode: React.FC<CoolModeProps> = ({
  children,
  options,
  className,
}) => {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const element = ref.current
    let cleanup: (() => void) | null = null

    if (element) {
      cleanup = applyParticleEffect(element, options)
    }

    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [options])

  return (
    <span ref={ref} className={className ?? "inline-flex w-full"}>
      {children}
    </span>
  )
}
