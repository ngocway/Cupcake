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
  if (isStudentClassDetail) return null;
  return <>{children}</>;
}
