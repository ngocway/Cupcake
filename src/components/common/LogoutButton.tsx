"use client";
import { signOut } from "next-auth/react";

interface LogoutButtonProps {
  className?: string;
  variant?: "sidebar" | "header";
}

export function LogoutButton({ className, variant = "header" }: LogoutButtonProps) {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: "/" })}
      className={className}
    >
      <span className="material-symbols-outlined text-sm">logout</span>
      <span className="font-label text-sm font-bold">Đăng xuất</span>
    </button>
  );
}
