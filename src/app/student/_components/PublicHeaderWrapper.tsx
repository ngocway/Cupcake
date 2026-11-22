'use client';
import { usePathname } from 'next/navigation';

/**
 * Ẩn PublicHeader khi học sinh đang vào làm bài trong lớp học.
 * Giúp tiết kiệm không gian dọc tối đa cho màn hình học tập.
 */
export function PublicHeaderWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStudentClassDetail =
    pathname?.startsWith('/student/classes/') && pathname !== '/student/classes';
  const isUnitReview = pathname?.includes('/unit-review') || pathname?.includes('/unit-grammar');
  const isFullscreenRunner =
    pathname?.includes('/run') ||
    pathname?.includes('/quiz') ||
    pathname?.includes('/play');

  if (isStudentClassDetail || isUnitReview || isFullscreenRunner) return null;
  return <>{children}</>;
}
