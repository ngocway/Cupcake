"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Toaster position="top-center" richColors />
      <ProgressBar
        height="3px"
        color="#3B82F6"
        options={{ showSpinner: false }}
        shallowRouting
      />
      {children}
    </SessionProvider>
  )
}
