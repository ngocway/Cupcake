import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PUBLIC_CLASSES_DATA } from '@/lib/public-classes-data';
import { ClassDetailClient } from './ClassDetailClient';
import prisma from '@/lib/prisma';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  const classData = PUBLIC_CLASSES_DATA[id];

  if (classData) {
    return {
      title: `${classData.title} – Lớp học Dolcake`,
      description: classData.heroDescription,
      openGraph: {
        title: `${classData.title} – Dolcake`,
        description: classData.heroDescription,
        images: [classData.thumbnail],
      },
    };
  }

  return {
    title: 'Chi tiết lớp học – Dolcake',
    description: 'Khám phá các lớp học tiếng Anh tương tác sinh động cho trẻ em tại Dolcake.',
  };
}

export default async function ClassDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  // 1. Check in static public classes data
  let classData = PUBLIC_CLASSES_DATA[id];

  // 2. If not found by direct ID, check database class or provide fallback
  if (!classData) {
    try {
      const dbClass = await prisma.class.findUnique({
        where: { id },
        include: {
          teacher: {
            select: { name: true, image: true, email: true }
          },
          _count: {
            select: {
              assignments: true,
              enrollments: true,
            }
          }
        }
      });

      if (dbClass) {
        // Construct bilingual dynamic PublicClassDetail from database
        const viContent = {
          title: dbClass.name,
          shortDescription: `Lớp học tiếng Anh ${dbClass.gradeLevel || 'tiểu học'} tương tác sinh động cùng giáo viên.`,
          heroDescription: `Cùng ${dbClass.teacher?.name || 'giáo viên'} khám phá kho bài tập, flashcard và minigame tiếng Anh chất lượng cao mỗi ngày!`,
          subjectBadge: `Lớp ${dbClass.gradeLevel || 'Tiểu học'}`,
          typeBadge: '🔥 Miễn phí',
          studentsCount: `${dbClass._count.enrollments || 15}+ học viên`,
          lessonsCount: dbClass._count.assignments || 12,
          duration: '4 tuần',
          language: 'Tiếng Anh & Tiếng Việt (Song ngữ trợ giảng)',
          whatYouLearn: [
            {
              iconType: 'sparkles' as const,
              title: 'Từ vựng & Ngữ pháp trọng tâm',
              description: 'Nắm vững kiến thức cốt lõi theo từng chủ đề bài học của lớp.',
              colorScheme: 'amber' as const,
            },
            {
              iconType: 'message' as const,
              title: 'Giao tiếp phản xạ',
              description: 'Luyện tập hội thoại và phản xạ ngôn ngữ tự nhiên.',
              colorScheme: 'sky' as const,
            },
            {
              iconType: 'game' as const,
              title: 'Trò chơi tương tác',
              description: 'Củng cố kiến thức qua các mini games vui nhộn.',
              colorScheme: 'purple' as const,
            },
            {
              iconType: 'trophy' as const,
              title: 'Huy hiệu thành tích',
              description: 'Theo dõi tiến trình học tập và nhận sao thưởng mỗi ngày.',
              colorScheme: 'yellow' as const,
            },
          ],
          units: [
            {
              id: 'unit-1',
              unitIndex: 1,
              title: 'Unit 1: Khởi động & Làm quen',
              lessonsCount: 3,
              isFreeTrial: true,
              lessons: [
                {
                  id: 'u1-l1',
                  lessonIndex: 1,
                  title: 'Bài 1: Giới thiệu khóa học & Mục tiêu',
                  type: 'Video & Phonics',
                  isTrial: true,
                },
                {
                  id: 'u1-l2',
                  lessonIndex: 2,
                  title: 'Bài 2: Từ vựng nền tảng',
                  type: 'Flashcard Game',
                  isTrial: false,
                },
                {
                  id: 'u1-l3',
                  lessonIndex: 3,
                  title: 'Bài 3: Thử thách khởi động',
                  type: 'Quiz Arena',
                  isTrial: false,
                },
              ],
            },
          ],
          teacher: {
            name: dbClass.teacher?.name || 'Giáo viên phụ trách',
            role: 'Giáo viên chủ nhiệm lớp',
            avatar: dbClass.teacher?.image || '/assests/Classes/avatars/teacher-avatar-ms-jessica.png',
            degree: 'Cử nhân Sư phạm Tiếng Anh',
            experience: 'Nhiều năm kinh nghiệm giảng dạy tiếng Anh',
            quote: '“Học tiếng Anh với niềm vui và sự chủ động là chìa khóa mở ra tương lai tươi sáng cho các con.”',
          },
          reviews: [
            {
              id: 'r1',
              author: 'Phụ huynh học viên',
              avatar: '/images/avatars/adult.png',
              stars: 5,
              timeAgo: 'Gần đây',
              content: '“Lớp học tổ chức rất khoa học, bé nhà mình rất hào hứng học mỗi ngày.”',
            },
          ],
        };

        const enContent = {
          title: dbClass.name,
          shortDescription: `Interactive English class for grade ${dbClass.gradeLevel || 'Primary'} with teacher guidance.`,
          heroDescription: `Join ${dbClass.teacher?.name || 'teacher'} to explore high-quality English exercises, flashcards, and minigames every day!`,
          subjectBadge: `Grade ${dbClass.gradeLevel || 'Primary'}`,
          typeBadge: '🔥 Free',
          studentsCount: `${dbClass._count.enrollments || 15}+ students`,
          lessonsCount: dbClass._count.assignments || 12,
          duration: '4 weeks',
          language: 'English & Bilingual Support',
          whatYouLearn: [
            {
              iconType: 'sparkles' as const,
              title: 'Core Vocabulary & Grammar',
              description: 'Master core knowledge across all curriculum topics.',
              colorScheme: 'amber' as const,
            },
            {
              iconType: 'message' as const,
              title: 'Reflexive Communication',
              description: 'Practice interactive dialogues and natural language reflexes.',
              colorScheme: 'sky' as const,
            },
            {
              iconType: 'game' as const,
              title: 'Gamified Learning',
              description: 'Reinforce concepts with fun, engaging mini-games.',
              colorScheme: 'purple' as const,
            },
            {
              iconType: 'trophy' as const,
              title: 'Achievements & Badges',
              description: 'Track learning progress and earn reward stars daily.',
              colorScheme: 'yellow' as const,
            },
          ],
          units: [
            {
              id: 'unit-1',
              unitIndex: 1,
              title: 'Unit 1: Getting Started & Basics',
              lessonsCount: 3,
              isFreeTrial: true,
              lessons: [
                {
                  id: 'u1-l1',
                  lessonIndex: 1,
                  title: 'Lesson 1: Course Introduction & Goals',
                  type: 'Video & Phonics',
                  isTrial: true,
                },
                {
                  id: 'u1-l2',
                  lessonIndex: 2,
                  title: 'Lesson 2: Core Vocabulary',
                  type: 'Flashcard Game',
                  isTrial: false,
                },
                {
                  id: 'u1-l3',
                  lessonIndex: 3,
                  title: 'Lesson 3: Warmup Challenge',
                  type: 'Quiz Arena',
                  isTrial: false,
                },
              ],
            },
          ],
          teacher: {
            name: dbClass.teacher?.name || 'Lead Teacher',
            role: 'Homeroom English Teacher',
            avatar: dbClass.teacher?.image || '/assests/Classes/avatars/teacher-avatar-ms-jessica.png',
            degree: 'Bachelor of English Education',
            experience: 'Experienced in primary English education',
            quote: '“Learning English with joy and confidence unlocks a bright future for every child.”',
          },
          reviews: [
            {
              id: 'r1',
              author: 'Student Parent',
              avatar: '/images/avatars/adult.png',
              stars: 5,
              timeAgo: 'Recently',
              content: '“The class structure is engaging and keeps my child excited to learn every single day.”',
            },
          ],
        };

        classData = {
          id: dbClass.id,
          thumbnail: '/assests/Classes/thumbnails/class-thumb-english-adventure-club.png',
          subjectBadgeClass: 'bg-[#ede9fe] text-[#4338ca] border-[#c7d2fe]',
          typeBadgeClass: 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]',
          rating: 4.9,
          reviewsCount: 30,
          btnGradient: 'from-[#06b6d4] to-[#0ea5e9] hover:from-[#0891b2] hover:to-[#0284c7] shadow-cyan-500/25',
          en: enContent,
          vi: viContent,
          ...viContent,
        };
      }
    } catch (e) {
      console.error('Error fetching database class in class detail:', e);
    }
  }

  // If still not found, fallback to english-adventure-club as default demo
  if (!classData) {
    classData = PUBLIC_CLASSES_DATA['english-adventure-club'];
  }

  return <ClassDetailClient classData={classData} />;
}
