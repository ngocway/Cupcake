"use client"

import React, { createContext, useContext, useRef, type PropsWithChildren } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react"
import type { MotionProps } from "motion/react"

import { cn } from "@/lib/utils"

interface DockContextValue {
  mouseX: MotionValue<number>
  iconSize: number
  iconMagnification: number
  disableMagnification: boolean
  iconDistance: number
}

const DockContext = createContext<DockContextValue | null>(null)

export interface DockProps extends VariantProps<typeof dockVariants> {
  className?: string
  iconSize?: number
  iconMagnification?: number
  disableMagnification?: boolean
  iconDistance?: number
  direction?: "top" | "middle" | "bottom"
  children: React.ReactNode
}

const DEFAULT_SIZE = 40
const DEFAULT_MAGNIFICATION = 60
const DEFAULT_DISTANCE = 140
const DEFAULT_DISABLEMAGNIFICATION = false

const dockVariants = cva(
  "supports-backdrop-blur:bg-white/10 supports-backdrop-blur:dark:bg-black/10 mx-auto flex w-max items-center justify-center gap-2 rounded-2xl border p-2 backdrop-blur-md"
)

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  (
    {
      className,
      children,
      iconSize = DEFAULT_SIZE,
      iconMagnification = DEFAULT_MAGNIFICATION,
      disableMagnification = DEFAULT_DISABLEMAGNIFICATION,
      iconDistance = DEFAULT_DISTANCE,
      direction = "middle",
      ...props
    },
    ref
  ) => {
    const mouseX = useMotionValue(Infinity)

    return (
      <DockContext.Provider
        value={{
          mouseX,
          iconSize,
          iconMagnification,
          disableMagnification,
          iconDistance,
        }}
      >
        <motion.div
          ref={ref}
          onMouseMove={(e) => mouseX.set(e.clientX)}
          onMouseLeave={() => mouseX.set(Infinity)}
          {...props}
          className={cn(dockVariants({ className }), {
            "items-start": direction === "top",
            "items-center": direction === "middle",
            "items-end": direction === "bottom",
          })}
        >
          {children}
        </motion.div>
      </DockContext.Provider>
    )
  }
)

Dock.displayName = "Dock"

export interface DockIconProps
  extends Omit<MotionProps & React.HTMLAttributes<HTMLDivElement>, "children"> {
  size?: number
  magnification?: number
  disableMagnification?: boolean
  distance?: number
  mouseX?: MotionValue<number>
  className?: string
  children?: React.ReactNode
  props?: PropsWithChildren
}

const DockIcon = ({
  size,
  magnification,
  disableMagnification,
  distance,
  mouseX: propMouseX,
  className,
  children,
  ...props
}: DockIconProps) => {
  const ctx = useContext(DockContext)
  const ref = useRef<HTMLDivElement>(null)
  const fallbackMouseX = useMotionValue(Infinity)

  const resolvedSize = size ?? ctx?.iconSize ?? DEFAULT_SIZE
  const resolvedMag = magnification ?? ctx?.iconMagnification ?? DEFAULT_MAGNIFICATION
  const resolvedDisable = disableMagnification ?? ctx?.disableMagnification ?? DEFAULT_DISABLEMAGNIFICATION
  const resolvedDist = distance ?? ctx?.iconDistance ?? DEFAULT_DISTANCE
  const activeMouseX = propMouseX ?? ctx?.mouseX ?? fallbackMouseX

  const padding = Math.max(6, resolvedSize * 0.2)

  const distanceCalc = useTransform(activeMouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const targetSize = resolvedDisable ? resolvedSize : resolvedMag

  const sizeTransform = useTransform(
    distanceCalc,
    [-resolvedDist, 0, resolvedDist],
    [resolvedSize, targetSize, resolvedSize]
  )

  const scaleSize = useSpring(sizeTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  })

  return (
    <motion.div
      ref={ref}
      style={{ width: scaleSize, height: scaleSize, padding }}
      className={cn(
        "flex aspect-square cursor-pointer items-center justify-center rounded-full",
        resolvedDisable && "hover:bg-muted-foreground transition-colors",
        className
      )}
      {...props}
    >
      <div>{children}</div>
    </motion.div>
  )
}

DockIcon.displayName = "DockIcon"

export interface DockWaveItemProps
  extends Omit<MotionProps & React.HTMLAttributes<HTMLDivElement>, "children"> {
  maxScale?: number
  maxLift?: number
  distance?: number
  disableMagnification?: boolean
  className?: string
  children?: React.ReactNode
}

/**
 * GPU-accelerated macOS Dock wave item for rectangular cards/keycaps.
 * Scales & lifts smoothly from bottom-center without shifting container height.
 */
const DockWaveItem = ({
  maxScale = 1.18,
  maxLift = 10,
  distance,
  disableMagnification,
  className,
  children,
  ...props
}: DockWaveItemProps) => {
  const ctx = useContext(DockContext)
  const ref = useRef<HTMLDivElement>(null)
  const fallbackMouseX = useMotionValue(Infinity)

  const resolvedDist = distance ?? ctx?.iconDistance ?? 150
  const resolvedDisable =
    disableMagnification ?? ctx?.disableMagnification ?? false
  const activeMouseX = ctx?.mouseX ?? fallbackMouseX

  const distanceCalc = useTransform(activeMouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const targetScale = resolvedDisable ? 1 : maxScale
  const targetLift = resolvedDisable ? 0 : -maxLift

  const scaleRaw = useTransform(
    distanceCalc,
    [-resolvedDist, 0, resolvedDist],
    [1, targetScale, 1]
  )
  const yRaw = useTransform(
    distanceCalc,
    [-resolvedDist, 0, resolvedDist],
    [0, targetLift, 0]
  )

  const scale = useSpring(scaleRaw, {
    mass: 0.1,
    stiffness: 180,
    damping: 13,
  })
  const y = useSpring(yRaw, {
    mass: 0.1,
    stiffness: 180,
    damping: 13,
  })

  return (
    <motion.div
      ref={ref}
      style={{ scale, y, transformOrigin: "bottom center" }}
      className={cn("relative will-change-transform", className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

DockWaveItem.displayName = "DockWaveItem"

export { Dock, DockIcon, DockWaveItem, dockVariants }
