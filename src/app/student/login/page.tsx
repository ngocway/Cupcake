"use client"

import { StudentLoginForm } from "@/components/shared/StudentLoginForm"
import { CheckCircle2, ArrowLeft, HelpCircle } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  return (
    <main className="flex-grow flex flex-col md:flex-row items-stretch min-h-screen bg-background font-body text-on-surface antialiased">
      {/* Left Column: Branding & Illustration */}
      <div className="hidden md:flex md:w-1/2 bg-surface-dim relative overflow-hidden flex-col justify-center items-center p-16">
        {/* Organic background shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-[3rem_4rem_2.5rem_4.5rem_/_4.5rem_2.5rem_4.5rem_3rem] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/20 rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem] -ml-48 -mb-48"></div>

        {/* Back to Home button */}
        <div className="absolute top-10 left-10 z-20">
          <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full text-sm font-bold text-on-surface hover:bg-white hover:shadow-md transition-all">
            <ArrowLeft className="w-4 h-4" />
            Về trang chủ
          </Link>
        </div>

        <div className="relative z-10 max-w-md text-center">
          <div className="mb-10 inline-flex items-center justify-center w-24 h-24 bg-primary text-white rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem] shadow-xl shadow-primary/20 animate-float">
            <span className="material-symbols-outlined text-[48px] animate-leaf-sway">eco</span>
          </div>

          <h1 className="font-headline font-black text-5xl text-on-surface mb-6 tracking-tight leading-tight">
            Learn with <span className="text-primary italic relative inline-block">
              Cupcakes
              <div className="absolute -bottom-2 left-0 w-full h-3 bg-secondary/30 rounded-full -z-10 -rotate-2"></div>
            </span>
          </h1>

          <p className="text-on-surface-variant text-lg leading-relaxed mb-10 font-medium">
            Step into a fun, interactive workspace designed to help you communicate with clarity and confidence.
          </p>

          <div className="space-y-4 text-left">
            <div className="flex items-start gap-4 p-5 rounded-[1.5rem] bg-white/40 backdrop-blur-sm hover:bg-white/70 hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-white/50">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="text-emerald-600 w-5 h-5 stroke-[3px]" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-on-surface">Interactive Learning</h3>
                <p className="text-sm text-on-surface-variant mt-1 font-medium">Master concepts through engaging digital modules.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-5 rounded-[1.5rem] bg-white/40 backdrop-blur-sm hover:bg-white/70 hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-white/50">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="text-secondary-dim w-5 h-5 stroke-[3px]" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-on-surface">Smart Vocabulary</h3>
                <p className="text-sm text-on-surface-variant mt-1 font-medium">Learn new words in context with instant feedback.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="w-full md:w-1/2 bg-background flex flex-col justify-center px-6 py-12 md:px-24 relative overflow-y-auto">
        
        {/* Mobile Header */}
        <div className="md:hidden absolute top-6 left-4 z-20">
          <Link href="/" className="flex items-center gap-1.5 px-3 py-2 bg-white/50 backdrop-blur-sm rounded-full text-xs font-bold text-on-surface">
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>

        <StudentLoginForm />
        
        <button className="hidden md:flex absolute bottom-8 right-8 bg-white p-4 rounded-full shadow-lg border border-outline-variant/30 text-primary hover:bg-primary/5 transition-all group items-center">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 stroke-[2px]" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 px-1">Help Center</span>
          </div>
        </button>

      </div>
    </main>
  )
}
