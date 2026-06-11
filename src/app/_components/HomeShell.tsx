
"use client"
import React from 'react';
import { useSession } from 'next-auth/react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

function HomeShellContent({ children }: { children?: React.ReactNode }) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isPending, startTransition] = useTransition();

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
    <div className="text-foreground min-h-screen font-body selection:bg-primary/20 relative bg-background">
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
      <div className={`relative transition-all duration-300 ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
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
    </div>
  );
}
