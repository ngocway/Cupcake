"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Sparkles,
  Layers,
  Share2,
  Gamepad2,
  Play,
  RotateCcw,
  Check,
  ChevronRight,
  Compass,
} from "lucide-react";
import { AnnotatedFigure } from "./AnnotatedFigure";

export function GlobalSuccessGuideClient() {
  const [activeStepTab, setActiveStepTab] = useState<number>(1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top sticky navigation header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-headline font-black text-slate-900 hover:text-emerald-700 transition-colors shrink-0"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-600 text-white shadow-sm">
                <BookOpen className="w-4 h-4" />
              </span>
              <span className="text-base tracking-tight">Dolcake</span>
            </Link>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <nav
              aria-label="Breadcrumb"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 truncate"
            >
              <span>Teacher Guides</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-bold truncate">
                Pick Grade &amp; Unit
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="https://www.facebook.com/groups/2201402037139591"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-bold shadow-sm transition-all"
            >
              <svg
                className="w-3.5 h-3.5 fill-current shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Join Facebook Group</span>
            </a>

            <Link
              href="/teacher?tab=lib-global"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm hover:shadow transition-all"
            >
              <span>Open Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-black uppercase tracking-wider mb-4 shadow-sm">
            <GraduationCap className="w-4 h-4 text-emerald-700" />
            <span>Teacher Quick Start Guide</span>
          </div>

          <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.15]">
            How to Pick Your Grade &amp; Unit in 30 Seconds
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Skip writing questions from scratch. Follow these <strong>3 simple steps</strong> to open official <strong>Global Success (Grades 1–12)</strong> question sets and start playing or sharing right away.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-bold text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              Takes ~30 seconds
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              Grades 1 to 12
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              100% Free &amp; Ready to Use
            </span>
          </div>
        </div>

        {/* 10-Second Looping Walkthrough Animation Card */}
        <section aria-label="Quick visual walkthrough" className="mt-8 sm:mt-10">
          <div className="rounded-3xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black shadow-sm">
                  ⚡
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-800">
                  10-Second Visual Walkthrough
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-400">
                  (Auto-looping preview)
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-black uppercase tracking-wider">
                3 Steps Loop
              </span>
            </div>

            {/* Responsive animated picture */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-inner aspect-[16/10] sm:aspect-[16/9]">
              <picture>
                <source srcSet="/guides/global-success/walkthrough-grade-unit.webp" type="image/webp" />
                <img
                  src="/guides/global-success/walkthrough-grade-unit.gif"
                  alt="10-second animated walkthrough showing how to click Global Success Books, pick Grade 5, and view Unit 1 question sets"
                  className="w-full h-full object-contain block select-none"
                />
              </picture>
            </div>

            <p className="mt-3 text-center text-xs text-slate-500 font-medium">
              💡 <em>Sidebar menu → Choose Grade (1–12) → Choose Unit → 4 ready question sets appear automatically.</em>
            </p>
          </div>
        </section>

        {/* Interactive Step Switcher for Mobile & Desktop */}
        <div className="mt-12 mb-6 flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="font-headline text-xl sm:text-2xl font-black text-slate-900">
            Step-by-Step Breakdown
          </h2>
          <span className="text-xs font-bold text-slate-500">
            3 Simple Actions
          </span>
        </div>

        {/* 3 Focused Action Cards */}
        <div className="space-y-8">
          {/* Card 1: Sidebar */}
          <section
            id="step-1"
            className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm transition-all hover:border-slate-300"
          >
            <div className="flex items-start gap-4">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-md shadow-emerald-600/20 shrink-0">
                1
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Step 1
                </span>
                <h3 className="font-headline text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  Click &ldquo;Global Success Books&rdquo; in the Sidebar
                </h3>
                <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Inside Teacher Portal, look at the left navigation menu under the green <strong>Question Library</strong> section and click <strong>Global Success Books</strong>.
                </p>

                {/* Focused Sidebar screenshot */}
                <div className="mt-5 max-w-sm">
                  <AnnotatedFigure
                    src="/guides/global-success/step1-sidebar-global-success.png"
                    alt="Focused screenshot of the left navigation sidebar highlighting Question Library and Global Success Books"
                    figureNumber="Figure 1"
                    screenLabel="Teacher Portal Navigation Sidebar"
                    caption="Click 'Global Success Books' (under Question Library) to open the textbook catalog."
                    callouts={[
                      {
                        number: 1,
                        label: "Global Success Books",
                        box: { left: "6.0%", top: "8.0%", width: "88.0%", height: "23.0%" },
                        badgePosition: "top-right",
                      },
                    ]}
                  />
                </div>

                <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
                  <Compass className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Direct shortcut link: you can also bookmark{" "}
                    <code className="text-slate-800 font-mono font-bold">dolcake.com/teacher?tab=lib-global</code>
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Card 2: Select Grade */}
          <section
            id="step-2"
            className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm transition-all hover:border-slate-300"
          >
            <div className="flex items-start gap-4">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-md shadow-emerald-600/20 shrink-0">
                2
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Step 2
                </span>
                <h3 className="font-headline text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  Select Your Grade Level (Grade 1 to 12)
                </h3>
                <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                  All 12 grades are organized into 3 school levels. Click whichever Grade card you are currently teaching (for example: <strong>Grade 5</strong>).
                </p>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-semibold">
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-center">
                    <p className="font-bold text-amber-800">Primary School</p>
                    <p className="text-slate-600 text-[11px] mt-0.5">Grades 1 – 5</p>
                  </div>
                  <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-2.5 text-center">
                    <p className="font-bold text-sky-800">Lower Secondary</p>
                    <p className="text-slate-600 text-[11px] mt-0.5">Grades 6 – 9</p>
                  </div>
                  <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-2.5 text-center">
                    <p className="font-bold text-purple-800">Upper Secondary</p>
                    <p className="text-slate-600 text-[11px] mt-0.5">Grades 10 – 12</p>
                  </div>
                </div>

                {/* Focused Grade Grid screenshot */}
                <div className="mt-5">
                  <AnnotatedFigure
                    src="/guides/global-success/step2-choose-grade-grid.png"
                    alt="Focused screenshot showing the 12 Grade cards grouped by Primary, Lower Secondary, and Upper Secondary"
                    figureNumber="Figure 2"
                    screenLabel="Grade Selection Grid"
                    caption="Click any Grade card (e.g. Grade 5) to load its complete list of Units."
                    callouts={[
                      {
                        number: 1,
                        label: "Grade 5 (80 sets)",
                        box: { left: "74.0%", top: "39.5%", width: "14.0%", height: "17.0%" },
                        badgePosition: "top-right",
                      },
                    ]}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Card 3: Select Unit & Ready Question Sets */}
          <section
            id="step-3"
            className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm transition-all hover:border-slate-300"
          >
            <div className="flex items-start gap-4">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-md shadow-emerald-600/20 shrink-0">
                3
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Step 3
                </span>
                <h3 className="font-headline text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  Find Your Unit &amp; Choose a Question Set
                </h3>
                <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Scroll down to your lesson (such as <strong>Unit 1: All about me!</strong>) or open the top <strong>SELECT UNIT</strong> dropdown to jump directly to any unit.
                </p>

                {/* 4 Question Sets Explanation Pill Cards */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">Vocabulary</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase">
                        Image - Word
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600 leading-relaxed">
                      Word cards with real illustrated pictures. Ready for Matching, Vocabulary Train, Conveyor Belt, and Memory Flip.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">Practice Quiz</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-black uppercase">
                        Multiple Choice
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600 leading-relaxed">
                      10 multiple-choice questions per unit. Plays directly in Candy World, Pirate Treasure Hunt, and Space Shooter games.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-sky-200/80 bg-sky-50/60 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">Conversations</span>
                      <span className="px-2 py-0.5 rounded-full bg-sky-600 text-white text-[10px] font-black uppercase">
                        Word - Word
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600 leading-relaxed">
                      Q&amp;A dialogue pairs directly from the unit's spoken lesson to practice conversational question-and-response patterns.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/60 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">English – Vietnamese</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase">
                        Word - Word
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600 leading-relaxed">
                      Bilingual word pairs linking English vocabulary to Vietnamese meanings for quick vocabulary consolidation.
                    </p>
                  </div>
                </div>

                {/* Focused Unit 1 screenshot */}
                <div className="mt-5">
                  <AnnotatedFigure
                    src="/guides/global-success/step3-grade5-unit1-sets.png"
                    alt="Focused screenshot showing Grade 5 Unit 1 with all 4 question sets: Conversations, Vocabulary, Practice Quiz, and English - Vietnamese"
                    figureNumber="Figure 3"
                    screenLabel="Unit 1 Question Sets View"
                    caption="Each Unit displays 4 ready sets. Click 'Share Game' to instantly send a game link or QR code to students, or 'Create Game' to customize it."
                    callouts={[
                      {
                        number: 1,
                        label: "Grade & Unit filter bar",
                        box: { left: "1.0%", top: "1.0%", width: "52.0%", height: "9.5%" },
                        badgePosition: "bottom-left",
                      },
                      {
                        number: 2,
                        label: "4 ready question sets (Share Game / Create Game)",
                        box: { left: "1.7%", top: "12.6%", width: "96.5%", height: "65.9%" },
                        badgePosition: "top-right",
                      },
                    ]}
                  />
                </div>

                {/* Unit dropdown screenshot tip */}
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Need to jump to another Unit fast?
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Click the <strong>2 SELECT UNIT</strong> pill in the top bar to expand the full list of units for that grade.
                  </p>
                  <div className="mt-3">
                    <AnnotatedFigure
                      src="/guides/global-success/step3b-unit-dropdown.png"
                      alt="Close-up of the expanded Unit dropdown showing Units 1 to 7"
                      figureNumber="Figure 3B"
                      screenLabel="Quick Unit Selector Menu"
                      caption="Click '2 SELECT UNIT' to pick any unit in one click."
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Pro Tip Card */}
        <section className="mt-8 rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-6 sm:p-8">
          <div className="flex items-start gap-3.5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm shrink-0 shadow-sm">
              💡
            </span>
            <div>
              <h3 className="font-headline text-lg sm:text-xl font-black text-emerald-950">
                Pro-Tip: Switching Classes During Teaching
              </h3>
              <p className="mt-1 text-sm text-emerald-900/90 leading-relaxed">
                If you teach multiple grade levels in a day (e.g. Grade 3 in the morning and Grade 5 in the afternoon), you do not need to go back to the homepage. Simply click the orange <strong>1 SELECT GRADE</strong> pill at the top of the screen anytime to switch grades in 1 second!
              </p>
            </div>
          </div>
        </section>

        {/* Bottom Call to Action */}
        <section className="mt-10 rounded-3xl border border-slate-900 bg-slate-900 text-white p-8 sm:p-10 text-center shadow-xl">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold mb-3">
            <Check className="w-3.5 h-3.5" />
            Everything is set up and free
          </span>

          <h2 className="font-headline text-2xl sm:text-3xl font-black tracking-tight">
            Ready to Try It with Your Students?
          </h2>

          <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Open Global Success Books now, choose your grade, and share a 2-minute vocabulary or quiz game with your class today.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/teacher?tab=lib-global"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg hover:shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all"
            >
              <span>Open Global Success Books</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="https://www.facebook.com/groups/2201402037139591"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Join Teacher Community</span>
              <ExternalLink className="w-3.5 h-3.5 text-white/60" />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
