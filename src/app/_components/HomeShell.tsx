
"use client"
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { useContentStore } from '@/store/useContentStore';

function HomeShellContent({ children }: { children?: React.ReactNode }) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isPending, startTransition] = useTransition();
  const headerVisible = true;

  const studyAgeGroup = useContentStore(s => (s as any).studyAgeGroup);
  const isKindergarten = 
    studyAgeGroup?.toLowerCase().includes("kindergarten") || 
    studyAgeGroup?.toLowerCase().includes("kindergarden") || 
    studyAgeGroup === "KINDERGARTEN (< 6 YEARS)" ||
    studyAgeGroup === "kids-2-5";

  const setSearch = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set("search", val);
    else params.delete("search");
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
    
    // Smoothly scroll to the content tabs
    setTimeout(() => {
      const target = document.getElementById('content-tabs');
      if (target) {
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - 100; // offset for header
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="text-foreground min-h-screen font-body selection:bg-primary/20 relative z-0 bg-[#e2f0e7]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 animate-in fade-in duration-1000 bg-gradient-to-tr from-[#e6fcf0] via-[#f2faf5] to-[#cbf9e2]">
        {/* Vibrant Mesh Gradients - Predominantly Green & Teal & Soft Yellow (Lighter/Brighter) */}
        <div className="absolute top-[-5%] left-[-5%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-[#6ee7b7]/65 to-transparent blur-[90px] md:blur-[130px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tl from-[#a7f3d0]/65 to-transparent blur-[110px] md:blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[15%] right-[5%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-bl from-[#5eead4]/55 to-transparent blur-[80px] md:blur-[120px] animate-pulse" style={{ animationDuration: '15s' }} />
        <div className="absolute bottom-[20%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-[#fef9c3]/55 to-transparent blur-[100px] md:blur-[140px] animate-pulse" style={{ animationDuration: '18s' }} />
        
        {/* Semi-transparent Organic Blobs for layered depth - Greens & Yellow-Green */}
        <div className="absolute top-[25%] left-[8%] w-[120px] h-[120px] rounded-full bg-[#34d399]/20 blur-[15px] animate-bounce" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[35%] right-[12%] w-[150px] h-[150px] rounded-full bg-[#a3e635]/15 blur-[20px] animate-bounce" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[50%] right-[25%] w-[100px] h-[100px] rounded-full bg-[#14b8a6]/18 blur-[15px] animate-pulse" style={{ animationDuration: '6s' }} />

        {/* Large Rotating Circular Orbits / Outlines (Nét đứt hình tròn) */}
        <div className="absolute top-[22%] right-[-8vw] w-[28vw] h-[28vw] rounded-full border border-dashed border-indigo-400/20 animate-[spin_80s_linear_infinite]" />
        <div className="absolute bottom-[-8vh] left-[-4vw] w-[22vw] h-[22vw] rounded-full border border-dashed border-emerald-400/20 animate-[spin_65s_linear_infinite_reverse]" />
        <div className="absolute top-[55%] left-[15vw] w-[14vw] h-[14vw] rounded-full border border-dashed border-pink-400/15 animate-[spin_50s_linear_infinite]" />

        {/* Floating Plus Doodles ('+' mờ) */}
        <svg className="absolute top-[8%] right-[6%] w-8 h-8 text-amber-500/25 opacity-80 animate-[float_9s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
        <svg className="absolute bottom-[20%] right-[28%] w-6 h-6 text-pink-500/25 opacity-75 animate-[float_11s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
        <svg className="absolute top-[45%] left-[4%] w-7 h-7 text-emerald-500/20 opacity-70 animate-[float_7s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>

        {/* Soft Wavy Curves / Arcs (Đường lượn sóng) */}
        <svg className="absolute top-[38%] right-[2%] w-[10vw] h-[15vh] text-sky-400/20 opacity-70 animate-[float_13s_ease-in-out_infinite]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M0,50 Q25,20 50,50 T100,50" />
        </svg>
        <svg className="absolute bottom-[10%] left-[18%] w-[8vw] h-[12vh] text-indigo-400/15 opacity-65 animate-[float_10s_ease-in-out_infinite_reverse]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M0,50 Q25,80 50,50 T100,50" />
        </svg>

        {/* Dot grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(#15803d_1.5px,transparent_1.5px)] [background-size:24px_24px]" />

        {/* Whimsical sparkle shapes */}
        <svg className="absolute top-[12%] left-[18%] w-6 h-6 text-emerald-500/35 opacity-90 animate-bounce" fill="currentColor" viewBox="0 0 24 24" style={{ animationDuration: '4s' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        <svg className="absolute bottom-[28%] right-[22%] w-7 h-7 text-indigo-500/30 opacity-85 animate-bounce" fill="currentColor" viewBox="0 0 24 24" style={{ animationDuration: '6s' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        <svg className="absolute top-[60%] left-[8%] w-5 h-5 text-amber-500/35 opacity-80 animate-pulse" fill="currentColor" viewBox="0 0 24 24" style={{ animationDuration: '5s' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      </div>
      <PublicHeader 
        session={session ? {
          id: session.user.id!,
          name: session.user.name ?? null,
          image: session.user.image ?? null,
          role: (session.user as any).role ?? null
        } : null}
        search={searchParams.get("search") || ""}
        setSearch={setSearch}
        isPendingSearch={isPending}
      />
      <div className={`relative transition-all duration-500 ease-in-out ${isPending ? "opacity-60 pointer-events-none" : ""} pt-4`}>
        {isPending && (
          <div className="fixed top-32 left-1/2 -translate-x-1/2 z-[101] flex items-center gap-3 px-6 py-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full shadow-2xl border border-primary/20 animate-in fade-in slide-in-from-top-4 duration-300">
             <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
             <span className="font-bold text-primary text-sm uppercase tracking-wider">Searching...</span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function HomeShell({ children }: { children?: React.ReactNode }) {
  return (
    <React.Suspense fallback={<HomeLoadingSkeleton />}>
      <HomeShellContent>
        {children}
      </HomeShellContent>
    </React.Suspense>
  );
}

export function HomeLoadingSkeleton() {
  return (
    <div className="text-foreground min-h-screen font-body selection:bg-primary/20 relative bg-[#e2f0e7]">
       {/* Header Skeleton */}
       <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex justify-between items-center px-10 py-4 w-[95%] max-w-[1440px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[32px] border border-outline-variant/10">
          <div className="w-48 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          <div className="w-80 h-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse hidden xl:block" />
          <div className="w-40 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
       </header>

      <div className="w-full pt-24 pb-20 flex flex-col lg:flex-row items-start gap-10 px-6 md:px-10 max-w-[1600px] mx-auto">
        <aside className="hidden lg:block w-80 p-8 glass rounded-3xl h-fit space-y-6">
            <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full animate-pulse" />
            <div className="space-y-3 pt-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-full animate-pulse" />
              ))}
            </div>
        </aside>
        
        <main className="flex-1 space-y-12">
          <div className="h-48 w-full bg-slate-100 dark:bg-slate-800/50 rounded-3xl animate-pulse" />
          <div className="h-14 w-64 bg-slate-100 dark:bg-slate-800/50 rounded-full animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-1/2" />
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Centered Loading Spinner Overlay */}
      <div className="fixed inset-0 flex items-center justify-center z-[110] pointer-events-none">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-3xl shadow-2xl flex flex-col items-center justify-center border border-slate-200/50 dark:border-slate-800/50 pointer-events-auto">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
