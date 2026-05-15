"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

const PAGE_SIZE = 20;

// Types
export interface LessonItem {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  videoUrl: string | null;
  teacherName: string | null;
  teacherId: string;
  viewsCount: number;
  isPremium: boolean;
  price: number;
  createdAt: Date;
  className?: string;
  isFavorite: boolean;
  status: "PENDING" | "COMPLETED" | "IN_PROGRESS";
  type: "ASSIGNED" | "FREE";
}

export interface AssignmentItem {
  id: string;
  slug: string | null;
  title: string;
  thumbnail: string | null;
  className: string;
  classId: string;
  assignedAt: Date;
  dueDate: Date | null;
  status: "PENDING" | "COMPLETED" | "IN_PROGRESS";
  score?: number | null;
  correctAnswers?: number | null;
  totalQuestions?: number | null;
  teacherName?: string | null;
  type: "ASSIGNED" | "FREE";
}

interface UseLessonsOptions {
  source: "class" | "public";
  page?: number;
}

interface UseAssignmentsOptions {
  source: "class" | "public";
  page?: number;
  filter?: "pending" | "in-progress" | "completed";
}

// Fetch functions
async function fetchLessons({ source, page = 1 }: UseLessonsOptions): Promise<{
  lessons: LessonItem[];
  classes: { id: string; name: string }[];
  hasMore: boolean;
  total: number;
}> {
  const skip = (page - 1) * PAGE_SIZE;
  const res = await fetch(
    `/api/student/lessons?source=${source}&skip=${skip}&take=${PAGE_SIZE}`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error("Failed to fetch lessons");
  return res.json();
}

async function fetchAssignments({ source, page = 1, filter }: UseAssignmentsOptions): Promise<{
  assignments: AssignmentItem[];
  classes: { id: string; name: string }[];
  hasMore: boolean;
  total: number;
}> {
  const skip = (page - 1) * PAGE_SIZE;
  const params = new URLSearchParams({
    source,
    skip: String(skip),
    take: String(PAGE_SIZE),
  });
  if (filter) params.set("filter", filter);
  
  const res = await fetch(
    `/api/student/assignments?${params.toString()}`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error("Failed to fetch assignments");
  return res.json();
}

// Hooks
export function useLessons(options: UseLessonsOptions) {
  return useQuery({
    queryKey: ["lessons", options.source, options.page || 1],
    queryFn: () => fetchLessons(options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAssignments(options: UseAssignmentsOptions) {
  return useQuery({
    queryKey: ["assignments", options.source, options.page || 1, options.filter],
    queryFn: () => fetchAssignments(options),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Prefetch hooks
export function usePrefetchLessons() {
  const queryClient = useQueryClient();

  return {
    prefetchSource: (source: "class" | "public") => {
      // Prefetch first page for a source
      queryClient.prefetchQuery({
        queryKey: ["lessons", source, 1],
        queryFn: () => fetchLessons({ source, page: 1 }),
        staleTime: 2 * 60 * 1000,
      });
    },
    prefetchPage: (source: "class" | "public", page: number) => {
      queryClient.prefetchQuery({
        queryKey: ["lessons", source, page],
        queryFn: () => fetchLessons({ source, page }),
        staleTime: 2 * 60 * 1000,
      });
    },
  };
}

export function usePrefetchAssignments() {
  const queryClient = useQueryClient();

  return {
    prefetchSource: (source: "class" | "public", filter?: string) => {
      queryClient.prefetchQuery({
        queryKey: ["assignments", source, 1, filter],
        queryFn: () => fetchAssignments({ source, page: 1, filter: filter as any }),
        staleTime: 2 * 60 * 1000,
      });
    },
    prefetchPage: (source: "class" | "public", page: number, filter?: string) => {
      queryClient.prefetchQuery({
        queryKey: ["assignments", source, page, filter],
        queryFn: () => fetchAssignments({ source, page, filter: filter as any }),
        staleTime: 2 * 60 * 1000,
      });
    },
  };
}
