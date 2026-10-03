"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SessionContext } from 'next-auth/react'
import { useContentStore } from '@/store/useContentStore'
import { GraduationCap, ArrowRight, ChevronDown } from 'lucide-react'

const STUDENT_CARDS = [
  {
    id: 'classes',
    title: 'Classes',
    subtitle: 'Customized by Age & Purpose',
    tab: 'classes',
    image: '/images/home/art_roadmap.webp',
    alt: 'Classes - Customized by Age & Purpose',
    objPos: 'center 22%',
    zoom: 1.05,
    priority: true,
  },
  {
    id: 'grammar',
    title: 'Grammar',
    subtitle: 'Basic to Advanced',
    tab: 'exercises',
    image: '/images/home/art_grammar.webp',
    alt: 'Grammar - Basic to Advanced',
    objPos: 'center 38%',
    priority: true,
  },
  {
    id: 'reading',
    title: 'Reading',
    subtitle: 'Stories & Academic Texts',
    tab: 'lessons',
    image: '/images/home/art_reading.webp',
    alt: 'Reading - Stories & Academic Texts',
    objPos: 'center 46%',
    priority: false,
  },
  {
    id: 'shadowing',
    title: 'Shadowing',
    subtitle: 'Daily Chat & Fluency',
    tab: 'shadowing',
    image: '/images/home/art_shadowing.webp',
    alt: 'Shadowing - Daily Chat & Fluency',
    objPos: 'center 46%',
    priority: false,
  },
]

export function HomeHeroSplit({ initialSession }: { initialSession?: any }) {
  const sessionContext = React.useContext(SessionContext)
  const clientSession = sessionContext?.data
  const session = clientSession ?? initialSession
  const setActiveTab = useContentStore((s) => (s as any).setActiveTab)

  const isTeacher = session?.user && (session.user as any).role === 'TEACHER'
  const isStudent = session?.user && (session.user as any).role !== 'TEACHER'

  const handleStudentCardClick = (targetTab: string) => {
    if (setActiveTab) {
      setActiveTab(targetTab)
    }
    const section = document.getElementById('content-explore-section')
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleScrollDown = () => {
    const section = document.getElementById('content-explore-section')
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section className="relative w-full overflow-hidden mb-4 lg:mb-8 bg-transparent">
      {/* Dual Realm Hero Background with Smooth Bottom Fade Transition (Hướng 1) */}
      <div 
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to bottom, black 0%, black 78%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 78%, transparent 100%)',
        }}
      >
        {/* Mobile Base Sky Blue */}
        <div className="absolute inset-0 lg:hidden bg-[#e0f2fe]" />

        {/* Desktop S-Curve Layer with SVG Gradient Fade */}
        <div className="absolute inset-0 hidden lg:block overflow-hidden">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 600" fill="none">
            <defs>
              {/* Teacher Realm Dark Navy Vertical Fade Gradient */}
              <linearGradient id="teacherRealmGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#131938" stopOpacity="1" />
                <stop offset="60%" stopColor="#131938" stopOpacity="1" />
                <stop offset="85%" stopColor="#131938" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#131938" stopOpacity="0" />
              </linearGradient>

              {/* S-Curve Boundary Luminous Stroke Fade */}
              <linearGradient id="curveLineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.15)" />
                <stop offset="65%" stopColor="rgba(255, 255, 255, 0.15)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
              </linearGradient>
            </defs>

            {/* Left Student Realm */}
            <path 
              d="M 0 0 L 500 0 C 450 200, 550 400, 500 600 L 0 600 Z" 
              fill="#e0f2fe" 
            />

            {/* Right Dark Indigo Realm with Watercolor Bleed Bottom Fade */}
            <path 
              d="M 500 0 C 450 200, 550 400, 500 600 L 1000 600 L 1000 0 Z" 
              fill="url(#teacherRealmGradient)" 
            />

            {/* Subtle luminous border line along the curve fading at the bottom */}
            <path 
              d="M 500 0 C 450 200, 550 400, 500 600" 
              stroke="url(#curveLineGradient)" 
              strokeWidth="3" 
            />
          </svg>

          {/* Subtle decorative dark circles on the far right of Teacher side */}
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full bg-[#1b234d]/60 blur-2xl pointer-events-none" />
        </div>
      </div>

      {/* Ambient Gradient Wash blending into page background #e2f0e7 */}
      <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 pointer-events-none z-[5] bg-gradient-to-b from-transparent via-[#e2f0e7]/50 to-[#e2f0e7]" />

      {/* Brand Logo Dolcake - Pushed to the far top-left edge */}
      <div className="absolute top-4 sm:top-5 lg:top-6 left-4 sm:left-6 lg:left-8 z-30">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/95 backdrop-blur-md p-2 shadow-md border border-white/80 flex items-center justify-center group-hover:scale-105 group-hover:rotate-6 transition-all duration-300">
            <img 
              src="/images/logo.png" 
              alt="Dolcake" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-headline font-black text-2xl sm:text-[26px] tracking-tight text-slate-800 leading-none">Dolcake</span>
            <span className="text-[9px] font-black text-sky-700/60 tracking-[0.2em] uppercase mt-0.5">LEARN & TEACH</span>
          </div>
        </Link>
      </div>

      {/* Main Content Container: 2 Centered Halves (Adaptive Dynamic Spacing) - Elevated to z-20 above background wash */}
      <div className="relative z-20 w-full flex flex-col lg:flex-row items-stretch min-h-[620px] lg:min-h-[clamp(640px,80vh,880px)]">
        
        {/* ========================================================================= */}
        {/* 1. KHÔNG GIAN HỌC SINH (NỬA TRÁI - STUDENT REALM)                         */}
        {/* ========================================================================= */}
        <div className="relative w-full lg:w-1/2 px-6 sm:px-10 lg:px-12 py-6 sm:py-8 lg:py-[clamp(2rem,4vh,3.75rem)] flex flex-col justify-between items-center text-center z-10">
          
          {/* Top Title Group: Teacher Realm */}
          <div className="w-full max-w-[480px] mx-auto flex flex-col items-center pt-10 sm:pt-12 lg:pt-8 mb-6">
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-black text-[#1e293b] tracking-tight font-headline">
              Teacher Realm
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm font-semibold mt-1">
              Interactive game studio creation showcase
            </p>
          </div>

          {/* 4 Feature Cards (2x2 Grid) with Gradient Feathering & Clean HTML Typography */}
          <div className="w-full max-w-[480px] mx-auto grid grid-cols-2 gap-4 sm:gap-5 mb-8">
            {STUDENT_CARDS.map((card) => (
              <div 
                key={card.id}
                onClick={() => handleStudentCardClick(card.tab)}
                className="group relative flex flex-col bg-white rounded-[22px] sm:rounded-[26px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 hover:scale-[1.02] active:scale-95 transition-[transform,box-shadow] duration-300 ease-out cursor-pointer text-left border border-white/70 transform-gpu [backface-visibility:hidden] [transform:translateZ(0)]"
              >
                {/* Top Artwork Area with Gradient Feathering */}
                <div className="relative w-full aspect-[424/248] overflow-hidden bg-white">
                  <div className="relative w-full h-full transition-transform duration-300 ease-out group-hover:scale-105">
                    <Image 
                      src={card.image}
                      alt={card.alt}
                      fill
                      sizes="(max-width: 640px) 50vw, 240px"
                      className="object-cover"
                      style={{ 
                        objectPosition: card.objPos,
                        transform: card.zoom ? `scale(${card.zoom})` : undefined 
                      }}
                      priority={card.priority}
                    />
                  </div>
                  
                  {/* Smooth Gradient Feathering Overlay */}
                  <div 
                    className="absolute inset-x-0 -bottom-[1px] h-14 sm:h-18 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 25%, rgba(255,255,255,0.6) 55%, rgba(255,255,255,0.92) 85%, #ffffff 100%)'
                    }}
                  />
                </div>

                {/* Bottom Info Area: -mt-1.5 prevents subpixel seam during GPU scaling */}
                <div className="relative z-10 -mt-1.5 px-3.5 sm:px-5 pt-1.5 pb-3.5 sm:pb-4.5 bg-white flex flex-col justify-center [transform:translateZ(0)]">
                  <h3 className="font-headline font-black text-slate-800 text-[15px] sm:text-lg lg:text-[20px] tracking-tight leading-tight group-hover:text-sky-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-slate-500 font-medium text-[10.5px] sm:text-xs tracking-tight mt-0.5 sm:mt-1 leading-normal truncate">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Student CTA Button with Luminous Neon Glow - Elevated to z-30 */}
          <div className="w-full flex justify-center relative z-30">
            <Link
              href={isStudent ? "/student/dashboard" : isTeacher ? "/student/dashboard" : "/student/login"}
              className="group inline-flex items-center gap-2.5 px-9 py-3.5 rounded-full bg-gradient-to-r from-[#00d2ff] to-[#0099ff] text-white font-black text-sm sm:text-base tracking-wide shadow-[0_10px_35px_-5px_rgba(0,186,242,0.65)] hover:shadow-[0_15px_42px_rgba(0,186,242,0.85)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <span>
                {isStudent 
                  ? "Vào Không Gian Học Của Bạn" 
                  : isTeacher 
                    ? "Không Gian Học Sinh" 
                    : "Student Login"}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE WAVE DIVIDER (Visible on small screens only)                       */}
        {/* ========================================================================= */}
        <div className="lg:hidden w-full h-12 bg-[#131938] relative -mt-1 pointer-events-none overflow-hidden">
          <svg className="w-full h-12" preserveAspectRatio="none" viewBox="0 0 400 48" fill="none">
            <path d="M0 0 C 150 42, 250 8, 400 36 L 400 48 L 0 48 Z" fill="#131938" />
          </svg>
        </div>

        {/* ========================================================================= */}
        {/* 2. KHÔNG GIAN GIÁO VIÊN (NỬA PHẢI - TEACHER REALM)                         */}
        {/* ========================================================================= */}
        <div className="relative w-full lg:w-1/2 px-6 sm:px-10 lg:px-6 xl:px-12 py-6 sm:py-8 lg:py-[clamp(2rem,4vh,3.75rem)] flex flex-col justify-between items-center text-center z-10 text-white bg-gradient-to-b from-[#131938] via-[#131938] to-transparent lg:bg-transparent">
          
          {/* Top Title Group: Student Realm */}
          <div className="w-full max-w-[700px] mx-auto flex flex-col items-center pt-2 sm:pt-4 lg:pt-8 mb-3 sm:mb-4">
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-black text-white tracking-tight font-headline">
              Student Realm
            </h2>
            <p className="text-indigo-200/70 text-xs sm:text-sm font-semibold mt-1">
              Compact visual with sunshine accents
            </p>
          </div>

          {/* 3 Colorful Interactive Game Cards (Centerpiece elevated with Celebration Confetti - Scaled 1.3x & Shifted Up) */}
          <div className="w-full max-w-[700px] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 items-end -translate-y-3 sm:-translate-y-6 mb-8 sm:mb-10">
            
            {/* Card 1: Flashcard Match (Left) */}
            <div className="group relative overflow-visible hover:-translate-y-2 hover:scale-[1.03] transition-all duration-300 cursor-default select-none">
              <Image 
                src="/images/home/card_flashcard_match.png" 
                alt="Flashcard Match" 
                width={336} 
                height={334} 
                className="w-full h-auto drop-shadow-xl group-hover:drop-shadow-2xl transition-all duration-300"
              />
            </div>

            {/* Card 2: Quiz Arena (Centerpiece HERO Card - Taller & Elevated with Celebration Confetti) */}
            <div className="group relative overflow-visible hover:-translate-y-2 hover:scale-[1.04] transition-all duration-300 cursor-default select-none z-20 sm:translate-y-1">
              <Image 
                src="/images/home/card_quiz_arena.png" 
                alt="Quiz Arena" 
                width={352} 
                height={540} 
                className="w-full h-auto drop-shadow-2xl group-hover:drop-shadow-purple-500/50 transition-all duration-300"
                priority
              />
            </div>

            {/* Card 3: Sentence Builder (Right) */}
            <div className="group relative overflow-visible hover:-translate-y-2 hover:scale-[1.03] transition-all duration-300 cursor-default select-none">
              <Image 
                src="/images/home/card_sentence_builder.png" 
                alt="Sentence Builder" 
                width={336} 
                height={334} 
                className="w-full h-auto drop-shadow-xl group-hover:drop-shadow-2xl transition-all duration-300"
              />
            </div>

          </div>

          {/* Teacher CTA Button with Modern Sleek Black Gradient - Elevated to z-30 */}
          <div className="w-full flex justify-center relative z-30">
            <Link
              href={isTeacher ? "/teacher/dashboard" : isStudent ? "/teacher/dashboard" : "/teacher/login"}
              className="group inline-flex items-center gap-2.5 px-9 py-3.5 rounded-full bg-gradient-to-r from-[#0b0f19] via-[#161c2e] to-[#0b0f19] hover:from-[#111827] hover:via-[#1e293b] hover:to-[#111827] border border-white/20 hover:border-indigo-400/50 text-white font-black text-sm sm:text-base tracking-wide shadow-[0_12px_35px_-8px_rgba(0,0,0,0.7),0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_16px_40px_-5px_rgba(0,0,0,0.85),0_0_30px_rgba(99,102,241,0.4)] ring-1 ring-white/10 hover:ring-indigo-400/30 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <GraduationCap className="w-5 h-5 text-indigo-300 group-hover:text-indigo-200 group-hover:rotate-12 transition-transform" />
              <span>
                {isTeacher 
                  ? "Vào Phòng Giáo Viên" 
                  : isStudent 
                    ? "Phòng Giáo Viên" 
                    : "Teacher Login"}
              </span>
              <ArrowRight className="w-4 h-4 text-indigo-300/80 group-hover:text-white group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>
        </div>

      </div>

      {/* Floating Minimalist Mouse Scroll Indicator */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 hidden sm:flex flex-col items-center pointer-events-auto">
        <button
          onClick={handleScrollDown}
          className="group flex flex-col items-center gap-2 cursor-pointer animate-mouse-breathe hover:scale-110 active:scale-95 transition-transform duration-300"
          title="Cuộn xuống khám phá kho bài giảng"
          aria-label="Cuộn xuống khám phá kho bài giảng"
        >
          {/* Mouse Frame with High-Contrast Deep Slate & Glowing Amber Rim */}
          <div className="w-[45px] h-[72px] rounded-full border-[3px] border-amber-400 bg-slate-900/90 backdrop-blur-md shadow-[0_8px_28px_rgba(0,0,0,0.4),0_0_24px_rgba(251,191,36,0.5)] ring-[3px] ring-amber-400/25 group-hover:border-amber-300 group-hover:bg-slate-900 group-hover:shadow-[0_0_32px_rgba(251,191,36,0.8)] flex justify-center pt-3 transition-all duration-300">
            {/* Smooth Scrolling Wheel Indicator */}
            <div className="w-[9px] h-[18px] rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.95)] animate-mouse-wheel" />
          </div>

          {/* Golden Chevron Arrow Indicator */}
          <ChevronDown className="w-6 h-6 text-amber-400 group-hover:text-amber-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] transition-colors duration-300 -mt-0.5 animate-chevron-bob" />
        </button>
      </div>
    </section>
  )
}
