"use client"

import { useState } from "react"
import { LoginModal } from "@/components/LoginButton"

export function TeacherLoginModalAuto({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [isOpen, setIsOpen] = useState(!isAuthenticated)

  if (isAuthenticated) return null

  return (
    <LoginModal 
      isOpen={isOpen} 
      onClose={() => setIsOpen(false)} 
      defaultView="teacherLogin" 
    />
  )
}
