"use client";

import React, { useState } from "react";

interface TeacherAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Reusable Teacher Avatar Component
 * - Automatically handles Google CDN auth image issues via referrerPolicy="no-referrer"
 * - Handles empty string ("") and null gracefully
 * - Handles onError fallback to custom fallback node or a cheerful Dicebear avatar
 */
export function TeacherAvatar({
  src,
  name,
  className = "w-full h-full object-cover",
  fallback,
}: TeacherAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const cleanSrc = src && typeof src === "string" ? src.trim() : null;
  const dicebearUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || "Teacher")}`;

  if (!cleanSrc || hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <img
        src={dicebearUrl}
        alt={name || "Teacher"}
        className={className}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <img
      src={cleanSrc}
      alt={name || "Teacher"}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
}
