
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
  const [headerVisible, setHeaderVisible] = useState(true);

  const studyAgeGroup = useContentStore(s => (s as any).studyAgeGroup);
  const isKindergarten = 
    studyAgeGroup?.toLowerCase().includes("kindergarten") || 
    studyAgeGroup?.toLowerCase().includes("kindergarden") || 
    studyAgeGroup === "KINDERGARTEN (< 6 YEARS)" ||
    studyAgeGroup === "kids-2-5";

  useEffect(() => {
    const onScroll = () => setHeaderVisible(window.scrollY < 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <div className="text-foreground min-h-screen font-body selection:bg-primary/20 relative bg-background z-0">
      {isKindergarten && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 animate-in fade-in duration-1000">
          <div className="absolute top-10 left-[-15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-amber-300/12 to-transparent blur-[150px] md:blur-[220px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[10%] right-[-15%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-pink-300/10 to-transparent blur-[160px] md:blur-[240px] animate-pulse" style={{ animationDuration: '10s' }} />
          <div className="absolute top-[30%] right-[5%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-sky-200/12 to-transparent blur-[150px] md:blur-[200px] animate-pulse" style={{ animationDuration: '12s' }} />
        </div>
      )}
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
      <div className={`relative transition-all duration-500 ease-in-out ${isPending ? "opacity-60 pointer-events-none" : ""} ${
        headerVisible ? "pt-44" : "pt-8"
      }`}>
        {isPending && (
          <div className="fixed top-32 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full shadow-2xl border border-primary/20 animate-in fade-in slide-in-from-top-4 duration-300">
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
    <div className="text-foreground min-h-screen font-body selection:bg-primary/20 relative bg-background">
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
      <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-3xl shadow-2xl flex flex-col items-center justify-center border border-slate-200/50 dark:border-slate-800/50 pointer-events-auto">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
