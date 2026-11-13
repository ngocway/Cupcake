"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Info,
  Layers,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { AnnotatedFigure } from "./AnnotatedFigure";

interface TocItem {
  id: string;
  label: string;
  status?: "ready" | "next";
}

const TOC_ITEMS: TocItem[] = [
  { id: "overview", label: "Overview", status: "ready" },
  { id: "step-1", label: "1. Open Teacher Portal", status: "ready" },
  { id: "step-2", label: "2. Sign In as a Teacher", status: "ready" },
  { id: "step-3", label: "3. Open Global Success Books", status: "ready" },
  { id: "step-4", label: "4. Select Your Grade (1–12)", status: "ready" },
  { id: "coming-next", label: "Coming Next in Part 2", status: "next" },
];

export function GlobalSuccessGuideClient() {
  const [activeId, setActiveId] = useState<string>("overview");

  useEffect(() => {
    const sections = TOC_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => Boolean(el)
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-96px 0px -65% 0px", threshold: 0.05 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      {/* Top sticky navigation header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
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
              <span className="text-slate-800 font-bold truncate">
                Global Success Books
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <span>Open Global Success</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-10 items-start">
          {/* Article column */}
          <article className="min-w-0 max-w-3xl">
            {/* Hero */}
            <div className="pb-8 border-b border-slate-200">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black uppercase tracking-wider">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Teacher User Guide
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                  Part 1: Getting Started &amp; Grade Selection
                </span>
              </div>

              <h1 className="font-headline text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                How to Access Global Success Books (Grades 1–12)
              </h1>

              <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
                A step-by-step guide for English teachers — from landing on the
                Dolcake homepage and signing in with a Teacher account to viewing
                ready-to-use Global Success question sets by grade level.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Setup time: ~1 minute
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  Covers: Global Success Grades 1–12
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  100% free &amp; no question authoring needed
                </span>
              </div>
            </div>

            {/* Mobile quick TOC */}
            <div className="mt-6 lg:hidden rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5 text-emerald-600" />
                On this page
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-semibold">
                {TOC_ITEMS.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 0: Overview */}
            <section id="overview" className="scroll-mt-24 pt-8 pb-10 border-b border-slate-200">
              <h2 className="font-headline text-2xl font-black text-slate-900">
                Overview
              </h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                The <strong>Global Success Books</strong> library inside Dolcake
                Teacher Portal provides pre-built interactive question sets
                aligned unit-by-unit with the official{" "}
                <em>Global Success</em> English curriculum from{" "}
                <strong>Grade 1 to Grade 12</strong>. You do not need to write
                questions from scratch—once you reach your Grade level, you can
                share any set directly with students or customize it into a
                classroom game.
              </p>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-sky-200/80 bg-sky-50/70 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-sky-700">
                    Image – Word
                  </p>
                  <p className="mt-1 font-bold text-sm text-slate-900">
                    Vocabulary Sets
                  </p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Illustrated word cards ready for Matching, Train, Conveyor,
                    and Memory Flip games.
                  </p>
                </div>

                <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/70 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-indigo-700">
                    Word – Word
                  </p>
                  <p className="mt-1 font-bold text-sm text-slate-900">
                    EN–VI &amp; Conversations
                  </p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    English–Vietnamese pairs and Q&amp;A dialogue practice from
                    each unit.
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-amber-700">
                    Multiple Choice
                  </p>
                  <p className="mt-1 font-bold text-sm text-slate-900">
                    Practice Quizzes
                  </p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    4-option quizzes for Candy World, Treasure Hunt, and Space
                    Shooter games.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-sm text-emerald-950 leading-relaxed">
                  <strong>Scope of Part 1:</strong> Below are Steps 1–4 covering
                  how a teacher visits Dolcake, signs in as a Teacher, opens the
                  library, and views all Grade 1–12 levels.
                </div>
              </div>
            </section>

            {/* Step 1 */}
            <section id="step-1" className="scroll-mt-24 pt-10 pb-10 border-b border-slate-200">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-black">
                  1
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Step 1
                </span>
              </div>
              <h2 className="font-headline text-2xl font-black text-slate-900">
                Open Teacher Portal from the Homepage
              </h2>
              <p className="mt-2 text-slate-600 leading-relaxed">
                <strong>Goal:</strong> Navigate from the public Dolcake homepage
                to the dedicated Teacher workspace.
              </p>

              <ol className="mt-4 space-y-2.5 text-sm sm:text-[15px] text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-black shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Go to{" "}
                    <code className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-800">
                      dolcake.com
                    </code>
                    . On the right half of the welcome screen (
                    <strong>Teacher Realm</strong>), click{" "}
                    <strong>Teacher access →</strong>.
                  </span>
                </li>
              </ol>

              <AnnotatedFigure
                src="/guides/global-success/01-homepage-teacher-access.png"
                alt="Dolcake homepage showing Student Realm and Teacher Realm with Teacher access button highlighted"
                figureNumber="Figure 1"
                screenLabel="dolcake.com (First-time visitor)"
                caption="Click 'Teacher access →' on the Teacher Realm side of the homepage to enter the Teacher Portal."
                callouts={[
                  {
                    number: 1,
                    label: "Teacher access → button",
                    box: { left: "65.5%", top: "68.2%", width: "17.4%", height: "6.4%" },
                    badgePosition: "top-left",
                  },
                ]}
              />

              {/* Alternative path for already signed-in teachers */}
              <div className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4 sm:p-5">
                <p className="text-xs font-black uppercase tracking-wider text-cyan-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Already signed in on the Student homepage?
                </p>
                <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
                  If you are already logged into a Teacher account while viewing
                  the Student homepage, click the{" "}
                  <strong>Teacher Portal STUDIO</strong> pill at the top-left of
                  the navigation bar to switch portals instantly.
                </p>

                <AnnotatedFigure
                  src="/guides/global-success/05-homepage-logged-in-portal-switch.png"
                  alt="Logged-in homepage header highlighting the Teacher Portal STUDIO button"
                  figureNumber="Figure 1B"
                  screenLabel="dolcake.com (Already signed in as Teacher)"
                  caption="Signed-in teachers can jump to Teacher Portal anytime using the 'Teacher Portal STUDIO' button in the top bar."
                  callouts={[
                    {
                      number: 1,
                      label: "Teacher Portal STUDIO switcher",
                      box: { left: "18.8%", top: "3.8%", width: "18.0%", height: "6.4%" },
                      badgePosition: "bottom-left",
                    },
                  ]}
                />
              </div>
            </section>

            {/* Step 2 */}
            <section id="step-2" className="scroll-mt-24 pt-10 pb-10 border-b border-slate-200">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-black">
                  2
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Step 2
                </span>
              </div>
              <h2 className="font-headline text-2xl font-black text-slate-900">
                Sign In with Your Teacher Account
              </h2>
              <p className="mt-2 text-slate-600 leading-relaxed">
                <strong>Goal:</strong> Authenticate as a Teacher so you can open
                Global Success question sets, share links/QR codes, and save
                custom games.
              </p>

              <ol className="mt-4 space-y-2.5 text-sm sm:text-[15px] text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-black shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    In the top-right corner of Teacher Portal, click{" "}
                    <strong>GET STARTED</strong>.
                  </span>
                </li>
              </ol>

              <AnnotatedFigure
                src="/guides/global-success/02-teacher-portal-get-started.png"
                alt="Teacher Portal header highlighting the GET STARTED sign-in button"
                figureNumber="Figure 2A"
                screenLabel="dolcake.com/teacher (Not signed in)"
                caption="Click 'GET STARTED' in the top-right header to open the Teacher Sign In dialog."
                callouts={[
                  {
                    number: 1,
                    label: "GET STARTED button",
                    box: { left: "82.1%", top: "4.1%", width: "11.6%", height: "6.0%" },
                    badgePosition: "bottom-left",
                  },
                ]}
              />

              <ol start={2} className="mt-6 space-y-2.5 text-sm sm:text-[15px] text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-black shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    <strong>Fastest option:</strong> Click{" "}
                    <strong>Continue with Google</strong> to sign in and create
                    your Teacher profile automatically in one step.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-black shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    <strong>Or sign in with Email:</strong> Enter your Teacher{" "}
                    <strong>Email</strong> and <strong>Password</strong>, then
                    click <strong>SIGN IN AS TEACHER →</strong>.
                  </span>
                </li>
              </ol>

              <AnnotatedFigure
                src="/guides/global-success/04-teacher-sign-in-modal.png"
                alt="Teacher Sign In modal highlighting Continue with Google and Email/Password fields"
                figureNumber="Figure 2B"
                screenLabel="Teacher Sign In Dialog"
                caption="Sign in with Google for instant setup, or enter your Teacher email and password."
                callouts={[
                  {
                    number: 1,
                    label: "Continue with Google (recommended)",
                    box: { left: "34.2%", top: "42.3%", width: "31.4%", height: "7.2%" },
                    badgePosition: "top-left",
                  },
                  {
                    number: 2,
                    label: "Email & Password login form",
                    box: { left: "34.0%", top: "54.2%", width: "31.8%", height: "26.6%" },
                    badgePosition: "top-right",
                  },
                ]}
              />

              {/* Role modal note */}
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5">
                <p className="text-xs font-black uppercase tracking-wider text-amber-800">
                  Good to know: If you see the role-selection popup
                </p>
                <p className="mt-1.5 text-sm text-amber-950 leading-relaxed">
                  If you opened the login modal from another page and see the{" "}
                  <strong>Welcome!</strong> prompt first, make sure to choose{" "}
                  <strong>Teacher</strong> before signing in. Accounts created
                  as <strong>Student</strong> cannot access Teacher Portal.
                </p>

                <AnnotatedFigure
                  src="/guides/global-success/03-select-role-modal.png"
                  alt="Welcome role-selection dialog highlighting the Teacher role card"
                  figureNumber="Figure 2C"
                  screenLabel="Role Selection Dialog"
                  caption="If prompted to choose a role, select 'Teacher' to open Teacher Sign In."
                  callouts={[
                    {
                      number: 1,
                      label: "Select Teacher role",
                      box: { left: "33.7%", top: "41.0%", width: "32.4%", height: "14.8%" },
                      badgePosition: "top-left",
                    },
                  ]}
                />
              </div>
            </section>

            {/* Step 3 */}
            <section id="step-3" className="scroll-mt-24 pt-10 pb-10 border-b border-slate-200">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-black">
                  3
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Step 3
                </span>
              </div>
              <h2 className="font-headline text-2xl font-black text-slate-900">
                Open Global Success Books from the Sidebar
              </h2>
              <p className="mt-2 text-slate-600 leading-relaxed">
                <strong>Goal:</strong> Navigate from the Teacher Portal default
                dashboard to the Global Success curriculum library.
              </p>

              <ol className="mt-4 space-y-2.5 text-sm sm:text-[15px] text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-black shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    After signing in, look at the left navigation sidebar and
                    find the green <strong>Question Library</strong> section.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-black shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Click <strong>Global Success Books</strong> (<em>Grade 1–12
                    sets by Unit</em>).
                  </span>
                </li>
              </ol>

              <AnnotatedFigure
                src="/guides/global-success/06-teacher-sidebar-global-success.png"
                alt="Teacher Portal dashboard highlighting Question Library and Global Success Books in the left sidebar"
                figureNumber="Figure 3"
                screenLabel="dolcake.com/teacher (Signed in)"
                caption="In the left sidebar under Question Library, click 'Global Success Books' to view all textbook levels."
                callouts={[
                  {
                    number: 1,
                    label: "Question Library menu",
                    box: { left: "3.7%", top: "62.5%", width: "18.5%", height: "6.4%" },
                    badgePosition: "top-right",
                  },
                  {
                    number: 2,
                    label: "Global Success Books",
                    box: { left: "5.2%", top: "69.5%", width: "16.8%", height: "7.6%" },
                    badgePosition: "top-right",
                  },
                ]}
              />
            </section>

            {/* Step 4 */}
            <section id="step-4" className="scroll-mt-24 pt-10 pb-10 border-b border-slate-200">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-black">
                  4
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Step 4
                </span>
              </div>
              <h2 className="font-headline text-2xl font-black text-slate-900">
                Browse &amp; Select Your Grade Level (Grades 1–12)
              </h2>
              <p className="mt-2 text-slate-600 leading-relaxed">
                <strong>Goal:</strong> Pick the exact grade you teach so Dolcake
                loads its Units and ready-made question sets. You can select a
                grade in <strong>two ways</strong>:
              </p>

              {/* 4A Default Grid */}
              <div className="mt-6">
                <h3 className="font-headline text-lg font-extrabold text-slate-900">
                  Option A — Click a Grade card on the main overview
                </h3>
                <p className="mt-1.5 text-sm sm:text-[15px] text-slate-600 leading-relaxed">
                  By default, <strong>Global Success Books</strong> displays all
                  12 grades grouped into{" "}
                  <strong>Primary School (Grade 1–5)</strong>,{" "}
                  <strong>Lower Secondary (Grade 6–9)</strong>, and{" "}
                  <strong>Upper Secondary (Grade 10–12)</strong>. Each card
                  shows the number of ready-to-play sets available. Click any
                  Grade card to open its units.
                </p>

                <AnnotatedFigure
                  src="/guides/global-success/07-global-success-grades-grid.png"
                  alt="Global Success Books default view showing Primary, Lower Secondary, and Upper Secondary Grade cards from Grade 1 to Grade 12"
                  figureNumber="Figure 4A"
                  screenLabel="dolcake.com/teacher?tab=lib-global (Default state)"
                  caption="Default Global Success Books view: use either the top Grade selector (1) or click any Grade 1–12 card directly (2)."
                  callouts={[
                    {
                      number: 1,
                      label: "1 SELECT GRADE bar",
                      box: { left: "26.8%", top: "22.1%", width: "16.0%", height: "6.4%" },
                      badgePosition: "top-left",
                    },
                    {
                      number: 2,
                      label: "Grade 1–12 cards with set counts",
                      box: { left: "33.5%", top: "45.5%", width: "55.5%", height: "49.5%" },
                      badgePosition: "top-left",
                    },
                  ]}
                />
              </div>

              {/* 4B Expanded Dropdown */}
              <div className="mt-8">
                <h3 className="font-headline text-lg font-extrabold text-slate-900">
                  Option B — Open the &ldquo;1 SELECT GRADE&rdquo; dropdown anytime
                </h3>
                <p className="mt-1.5 text-sm sm:text-[15px] text-slate-600 leading-relaxed">
                  Click the <strong>1 SELECT GRADE</strong> pill in the top
                  filter bar to expand a compact picker listing{" "}
                  <strong>Grade 1 through Grade 12</strong>. This dropdown stays
                  accessible even after you enter a grade, making it fast to
                  switch between classes (for example, jumping from Grade 5 to
                  Grade 8).
                </p>

                <AnnotatedFigure
                  src="/guides/global-success/08-global-success-grades-dropdown.png"
                  alt="Global Success Books with the 1 SELECT GRADE dropdown expanded showing Grade 1 to Grade 12 options"
                  figureNumber="Figure 4B"
                  screenLabel="dolcake.com/teacher?tab=lib-global (Grade dropdown open)"
                  caption="Click '1 SELECT GRADE' (1) to open the quick-jump Grade 1–12 menu showing exact set counts per grade (2)."
                  callouts={[
                    {
                      number: 1,
                      label: "Click 1 SELECT GRADE",
                      box: { left: "26.8%", top: "22.1%", width: "16.0%", height: "6.4%" },
                      badgePosition: "top-left",
                    },
                    {
                      number: 2,
                      label: "Grade 1–12 quick-pick menu",
                      box: { left: "27.3%", top: "28.8%", width: "25.0%", height: "37.4%" },
                      badgePosition: "top-right",
                    },
                  ]}
                />
              </div>
            </section>

            {/* Coming next preview card */}
            <section id="coming-next" className="scroll-mt-24 pt-10">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Part 2 Roadmap (Next in This Guide)
                </p>
                <h2 className="mt-1.5 font-headline text-xl sm:text-2xl font-black text-slate-900">
                  Ready to continue after selecting a Grade?
                </h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Once you review this Part 1 preview, the rest of the guide
                  will walk through:
                </p>

                <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm font-medium text-slate-700">
                  <li className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Filtering by Unit &amp; Format</span>
                  </li>
                  <li className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Previewing items &amp; duplicating sets</span>
                  </li>
                  <li className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Sharing a game via Link or QR Code</span>
                  </li>
                  <li className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Creating customized classroom games</span>
                  </li>
                </ul>

                <div className="mt-6 pt-5 border-t border-slate-200/80 flex flex-wrap items-center gap-3">
                  <Link
                    href="/teacher?tab=lib-global"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-all"
                  >
                    <span>Try Global Success Books Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="https://www.facebook.com/groups/2201402037139591"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold transition-all"
                  >
                    <span>Ask Questions in Facebook Group</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors ml-auto"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Dolcake</span>
                  </Link>
                </div>
              </div>
            </section>
          </article>

          {/* Desktop sticky Table of Contents */}
          <aside className="hidden lg:block sticky top-24">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3">
                On this page
              </p>
              <nav aria-label="Table of contents" className="space-y-1">
                {TOC_ITEMS.map((item) => {
                  const isActive = activeId === item.id;
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      {item.status === "next" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold shrink-0">
                          Next
                        </span>
                      )}
                    </a>
                  );
                })}
              </nav>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <Link
                  href="/teacher?tab=lib-global"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <span>Open Library</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

