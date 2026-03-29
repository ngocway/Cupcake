"use client"
import React, { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { startOrResumeAttempt } from './actions'
import { Play } from 'lucide-react'

export function StartButton({ assignmentId, label }: { assignmentId: string, label: string }) {
  const [isPending, startTransition] = useTransition()

  const handleStart = () => {
    startTransition(() => {
      startOrResumeAttempt(assignmentId)
    })
  }

  return (
    <Button 
      onClick={handleStart}
      disabled={isPending}
      className="bg-[#00adef] hover:bg-[#009bd6] text-white px-10 py-6 text-lg rounded-full font-bold uppercase shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
    >
      <Play className="w-5 h-5" fill="currentColor" />
      {isPending ? "ĐANG XỬ LÝ..." : label}
    </Button>
  )
}
