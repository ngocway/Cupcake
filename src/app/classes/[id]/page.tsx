import React from 'react';
import type { Metadata } from 'next';
import { 
  PUBLIC_CLASSES_DATA, 
  resolveClassId, 
  getClassSlug, 
  getPublicClass,
  CourseUnit 
} from '@/lib/public-classes-data';
import { ClassDetailClient } from './ClassDetailClient';
import { GlobalSuccessPrimaryLandingClient } from './GlobalSuccessPrimaryLandingClient';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import {
  GLOBAL_SUCCESS_PRIMARY_CLASS_ID,
  GLOBAL_SUCCESS_GRADE_COOKIE,
  getUserGlobalSuccessProgress,
} from '@/lib/global-success-primary-class';
import prisma from '@/lib/prisma';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  const resolvedId = resolveClassId(id);
  const classData = getPublicClass(resolvedId);

  if (resolvedId === 'cmuvbigbg0001vta43ikcsjbk') {
    const title = 'Khóa Học 45 Ngày Làm Chủ Ngữ Pháp Tiếng Anh Từ Mất Gốc Đến B1 | Dolcake';
    const description = 'Lộ trình 45 ngày củng cố toàn diện ngữ pháp tiếng Anh từ căn bản đến B1. 268 bài tập tương tác, phương pháp lặp lại ngắt quãng Spaced Repetition, giải thích chi tiết có phát âm và chấm điểm tức thì.';
    const url = 'https://dolcake.com/classes/master-english-grammar-45-days';
    const imageUrl = 'https://dolcake.com/assests/Classes/thumbnails/class-thumb-grammar-45-days.png';

    return {
      title: {
        absolute: title,
      },
      description,
      keywords: [
        'ngữ pháp tiếng anh',
        'học ngữ pháp tiếng anh 45 ngày',
        'ngữ pháp tiếng anh mất gốc',
        'bài tập ngữ pháp tiếng anh',
        'ngữ pháp b1 tiếng anh',
        'luyện thi ngữ pháp',
        'dolcake grammar',
        'spaced repetition tiếng anh',
        'khóa học ngữ pháp miễn phí',
        'tự học tiếng anh giao tiếp',
      ],
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: 'Khóa Học 45 Ngày Làm Chủ Ngữ Pháp Tiếng Anh Từ Mất Gốc Đến B1',
        description,
        url,
        siteName: 'Dolcake',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: 'Lớp 45 Ngày Làm Chủ Ngữ Pháp Tiếng Anh Dolcake',
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  }

  if (resolvedId === 'phonics-45-days') {
    const title = 'Bé Giỏi Phonics 45 Ngày: Làm Chủ Đánh Vần Tiếng Anh (45-Day Phonics Master) | Dolcake';
    const description = 'Hành trình 45 ngày làm chủ 45 họ vần CVC cốt lõi tiếng Anh cho bé Mầm non & Lớp 1. Máy ghép vần tương tác, thẻ từ hoạt hình, game phản xạ và truyện đọc decodable.';
    const url = 'https://dolcake.com/classes/phonics-45-days';
    const imageUrl = 'https://dolcake.com/assests/Classes/thumbnails/class-thumb-vocab-45-days.png';

    return {
      title: {
        absolute: title,
      },
      description,
      keywords: [
        'học phonics cho bé',
        'đánh vần tiếng anh',
        'tiếng anh mầm non',
        'cvc word families',
        'phonics 45 ngày',
        'bé giỏi phonics',
        'dolcake',
        'học đánh vần tiếng anh lớp 1',
        'blending phonics',
      ],
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: 'Bé Giỏi Phonics 45 Ngày: Làm Chủ Đánh Vần Tiếng Anh',
        description,
        url,
        siteName: 'Dolcake',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: 'Bé Giỏi Phonics 45 Ngày - 45-Day Phonics Master',
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  }

  if (resolvedId === 'tiny-vocab-wonders') {
    const title = '45 Ngày Khám Phá Từ Vựng Tiếng Anh Đầu Đời Cho Bé (Tiny Vocab) | Dolcake';
    const description = 'Hành trình 45 ngày xây dựng 180+ từ vựng tiếng Anh đầu đời cho bé Mầm non & Lớp 1. Flashcard âm thanh chuẩn bản xứ, hình ảnh minh họa sinh động và trò chơi tương tác ghi nhớ sâu.';
    const url = 'https://dolcake.com/classes/tiny-vocab-45-days';
    const imageUrl = 'https://dolcake.com/assests/Classes/thumbnails/class-thumb-vocab-45-days.png';

    return {
      title: {
        absolute: title,
      },
      description,
      keywords: [
        'từ vựng tiếng anh cho bé',
        'tiếng anh mầm non',
        'học từ vựng tiếng anh lớp 1',
        'flashcard tiếng anh cho trẻ em',
        '45 ngày từ vựng cho bé',
        'tiny vocab wonders',
        'dolcake',
        'học tiếng anh qua trò chơi cho bé',
        'tiếng anh trẻ em tương tác',
      ],
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: '45 Ngày Khám Phá Từ Vựng Tiếng Anh Đầu Đời Cho Bé (Tiny Vocab)',
        description,
        url,
        siteName: 'Dolcake',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: 'Tiny Vocab Wonders - 45 Ngày Khám Phá Từ Vựng Cho Bé',
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  }

  if (classData) {
    const slug = getClassSlug(resolvedId);
    const url = `https://dolcake.com/classes/${slug}`;
    const imageUrl = classData.thumbnail?.startsWith('http')
      ? classData.thumbnail
      : `https://dolcake.com${classData.thumbnail}`;

    return {
      title: `${classData.title} – Lớp học Dolcake`,
      description: classData.heroDescription,
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: `${classData.title} – Dolcake`,
        description: classData.heroDescription,
        url,
        images: [imageUrl],
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
  const resolvedId = resolveClassId(id);

  // 1. Check in static public classes data
  let classData = getPublicClass(resolvedId);

  // 1b. If found, enrich dynamically with database data (thumbnail, live enrollments, lessons)
  if (classData) {
    try {
      const dbClass = await prisma.class.findUnique({
        where: { id: resolvedId },
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
        const liveStudentsVi = `${Math.max(dbClass._count?.enrollments || 0, 12)}+ học viên`;
        const liveStudentsEn = `${Math.max(dbClass._count?.enrollments || 0, 12)}+ students`;
        const liveLessons = dbClass._count?.assignments || classData.lessonsCount;
        classData = {
          ...classData,
          thumbnail: dbClass.thumbnail || classData.thumbnail,
          studentsCount: liveStudentsVi,
          lessonsCount: liveLessons,
          vi: {
            ...classData.vi,
            studentsCount: liveStudentsVi,
            lessonsCount: liveLessons,
          },
          en: {
            ...classData.en,
            studentsCount: liveStudentsEn,
            lessonsCount: liveLessons,
          }
        };
      }
    } catch (e) {
      console.error('Error enriching classData from DB:', e);
    }
  }

  // 2. If not found by direct ID, check database class or provide fallback
  if (!classData) {
    try {
      const dbClass = await prisma.class.findUnique({
        where: { id: resolvedId },
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
            avatar: dbClass.teacher?.image || 'https://media.dolcake.com/assests/Classes/avatars/teacher-avatar-ms-jessica.png',
            degree: 'Cử nhân Sư phạm Tiếng Anh',
            experience: 'Nhiều năm kinh nghiệm giảng dạy tiếng Anh',
            quote: '“Học tiếng Anh với niềm vui và sự chủ động là chìa khóa mở ra tương lai tươi sáng cho các con.”',
          },
          reviews: [
            {
              id: 'r1',
              author: 'Phụ huynh học viên',
              avatar: 'https://media.dolcake.com/images/avatars/adult.png',
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
            avatar: dbClass.teacher?.image || 'https://media.dolcake.com/assests/Classes/avatars/teacher-avatar-ms-jessica.png',
            degree: 'Bachelor of English Education',
            experience: 'Experienced in primary English education',
            quote: '“Learning English with joy and confidence unlocks a bright future for every child.”',
          },
          reviews: [
            {
              id: 'r1',
              author: 'Student Parent',
              avatar: 'https://media.dolcake.com/images/avatars/adult.png',
              stars: 5,
              timeAgo: 'Recently',
              content: '“The class structure is engaging and keeps my child excited to learn every single day.”',
            },
          ],
        };

        classData = {
          id: dbClass.id,
          thumbnail: dbClass.thumbnail || 'https://media.dolcake.com/assests/Classes/thumbnails/class-thumb-neutral-default.jpg',
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

  // Determine SEO metadata specifics
  const canonicalSlug = getClassSlug(resolvedId);
  const canonicalUrl = `https://dolcake.com/classes/${canonicalSlug}`;

  let seoHeading = classData.vi?.title || classData.title;
  let seoDescription = classData.vi?.heroDescription || classData.heroDescription;
  let educationalLevel = 'Beginner to Intermediate';
  let workload = '45 Days';

  const faqList: { q: string; a: string }[] = [];

  if (resolvedId === 'cmuvbigbg0001vta43ikcsjbk') {
    seoHeading = 'Khóa Học 45 Ngày Làm Chủ Ngữ Pháp Tiếng Anh Từ Mất Gốc Đến B1';
    seoDescription = 'Lộ trình 45 ngày củng cố toàn diện ngữ pháp tiếng Anh từ căn bản đến B1. 268 bài tập tương tác, phương pháp lặp lại ngắt quãng Spaced Repetition, giải thích chi tiết có phát âm và chấm điểm tức thì.';
    educationalLevel = 'Beginner to Intermediate (A1 - B1)';
    workload = 'PT45D (15-20 phút/ngày)';

    faqList.push(
      {
        q: 'Khóa học 45 Ngày Làm Chủ Ngữ Pháp Tiếng Anh trên Dolcake có mất phí không?',
        a: 'Khóa học hoàn toàn miễn phí. Người học được trải nghiệm đầy đủ 45 ngày lộ trình, lý thuyết song ngữ trực quan và 268 bài tập tương tác có chấm điểm tức thì trên Dolcake.'
      },
      {
        q: 'Người mất gốc tiếng Anh có theo học được khóa học này không?',
        a: 'Khóa học được thiết kế đặc biệt từ con số 0 đến B1. Từng ngày học đi từ cấu trúc căn bản nhất (thì hiện tại đơn, danh từ, đại từ) đến các chủ điểm nâng cao (câu bị động, câu điều kiện, mệnh đề quan hệ) kèm giải thích chi tiết bằng tiếng Việt.'
      },
      {
        q: 'Phương pháp Spaced Repetition (Lặp lại ngắt quãng) trong khóa học hoạt động như thế nào?',
        a: 'Hệ thống tự động ghi nhớ những câu ngữ pháp bạn làm chưa chuẩn và lên lịch ôn tập ngắt quãng theo chu kỳ khoa học, giúp bạn khắc sâu kiến thức vào trí nhớ dài hạn mà không cần học vẹt.'
      },
      {
        q: 'Mỗi ngày cần dành bao nhiêu thời gian để hoàn thành bài học?',
        a: 'Chỉ cần 15 đến 20 phút mỗi ngày để đọc hiểu tóm tắt lý thuyết và hoàn thành bộ câu hỏi thực hành trắc nghiệm, kéo thả và sắp xếp câu sinh động.'
      }
    );
  } else if (resolvedId === 'phonics-45-days') {
    seoHeading = 'Bé Giỏi Phonics 45 Ngày: Làm Chủ Đánh Vần Tiếng Anh (45-Day Phonics Master)';
    seoDescription = 'Hành trình 45 ngày làm chủ 45 họ vần CVC cốt lõi tiếng Anh cho bé Mầm non & Lớp 1. Máy ghép vần tương tác, thẻ từ hoạt hình, game phản xạ và truyện đọc decodable.';
    educationalLevel = 'Preschool & Primary (Mầm non - Lớp 1)';
    workload = 'PT45D (8-10 phút/ngày)';

    faqList.push(
      {
        q: 'Khóa học Bé Giỏi Phonics 45 Ngày phù hợp cho độ tuổi nào?',
        a: 'Khóa học được thiết kế tối ưu cho trẻ Mầm non (4-5 tuổi) và học sinh Lớp 1-2 cần xây dựng nền tảng đánh vần và đọc tiếng Anh lưu loát.'
      },
      {
        q: 'Mô hình 4 trạm học mỗi ngày gồm những gì?',
        a: 'Mỗi ngày bé sẽ trải qua 4 trạm: Trạm 1 Máy Ghép Vần Phonics (Blending Lab), Trạm 2 Thẻ Từ Vựng Hoạt Hình, Trạm 3 Trò Chơi Phản Xạ Nhanh và Trạm 4 Đọc Truyện Ghép Vần Decodable có loa bản xứ.'
      },
      {
        q: 'Khóa học có yêu cầu bé phải biết đọc trước không?',
        a: 'Không cần. Khóa học được thiết kế đa giác quan với âm thanh từng âm phoneme rõ ràng, tranh hoạt hình trực quan giúp bé vừa chơi vừa tự khám phá cách ghép vần tự nhiên.'
      },
      {
        q: 'Khóa học này có mất phí không?',
        a: 'Khóa học Bé Giỏi Phonics 45 Ngày hoàn toàn miễn phí trên nền tảng Dolcake.'
      }
    );
  } else if (resolvedId === 'tiny-vocab-wonders') {
    seoHeading = '45 Ngày Khám Phá Từ Vựng Tiếng Anh Đầu Đời Cho Bé (Tiny Vocab Wonders)';
    seoDescription = 'Hành trình 45 ngày xây dựng 180+ từ vựng tiếng Anh đầu đời cho bé Mầm non & Lớp 1. Flashcard âm thanh chuẩn bản xứ, hình ảnh minh họa sinh động và trò chơi tương tác ghi nhớ sâu.';
    educationalLevel = 'Preschool & Primary (Mầm non - Lớp 1)';
    workload = 'PT45D (5-10 phút/ngày)';

    faqList.push(
      {
        q: 'Khóa học Tiny Vocab Wonders (45 Ngày) phù hợp cho lứa tuổi nào?',
        a: 'Khóa học được thiết kế tối ưu cho trẻ Mầm non (3-5 tuổi) và học sinh Lớp 1-2 mới bắt đầu tiếp cận tiếng Anh.'
      },
      {
        q: 'Bé chưa biết đọc chữ có thể tham gia học được không?',
        a: 'Hoàn toàn được. Mỗi từ vựng đều đi kèm flashcard hình ảnh minh họa vẽ tay dễ thương, phát âm bản xứ chuẩn Mỹ rõ ràng và minigame kéo thả giúp bé nhận diện từ vựng qua thị giác và thính giác tự nhiên.'
      },
      {
        q: 'Khóa học từ vựng cho bé này có mất phí không?',
        a: 'Khóa học 45 ngày từ vựng cho bé hoàn toàn miễn phí trên nền tảng giáo dục Dolcake.'
      },
      {
        q: 'Sau 45 ngày bé sẽ đạt được kết quả gì?',
        a: 'Bé sẽ tích lũy vốn từ hơn 180 từ vựng cốt lõi theo 45 chủ đề quen thuộc (động vật, màu sắc, hoa quả, đồ chơi, gia đình...), hình thành phản xạ nghe nói tiếng Anh chuẩn và sự tự tin yêu thích ngôn ngữ.'
      }
    );
  } else {
    faqList.push(
      {
        q: `Lớp học ${classData.title} trên Dolcake học theo hình thức nào?`,
        a: 'Lớp học diễn ra trực tuyến 100% trên nền tảng Dolcake với các bài tập tương tác, flashcard âm thanh và minigame sinh động.'
      },
      {
        q: 'Lớp học có yêu cầu trả phí không?',
        a: 'Hiện tại các lớp học công khai trên Dolcake đều mở quyền truy cập miễn phí cho học viên tham gia học tập và trải nghiệm.'
      }
    );
  }

  // Prepare JSON-LD schemas
  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: seoHeading,
    description: seoDescription,
    provider: {
      '@type': 'Organization',
      name: 'Dolcake',
      sameAs: 'https://dolcake.com',
    },
    url: canonicalUrl,
    courseCode: classData.joinCode || resolvedId,
    educationalLevel,
    inLanguage: ['vi', 'en'],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
      category: 'Free',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: (classData.rating || 5.0).toFixed(1),
      bestRating: '5',
      ratingCount: classData.reviewsCount || 40,
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      courseWorkload: workload,
    },
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqList.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Trang chủ',
        item: 'https://dolcake.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Lớp học',
        item: 'https://dolcake.com#classes',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: seoHeading,
        item: canonicalUrl,
      },
    ],
  };

  const syllabusUnits: CourseUnit[] = classData.vi?.units || classData.units || [];

  return (
    <>
      {/* Schema.org Rich Snippets JSON-LD for Google Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Semantic SSR Content for Search Engine Crawlers */}
      <section className="sr-only" aria-label="Nội dung chương trình đào tạo">
        <h1>{seoHeading}</h1>
        <p>{seoDescription}</p>

        {classData.vi?.whatYouLearn && (
          <div>
            <h2>Bạn sẽ học được gì?</h2>
            <ul>
              {classData.vi.whatYouLearn.map((item, idx) => (
                <li key={idx}>
                  <strong>{item.title}</strong>: {item.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {syllabusUnits.length > 0 && (
          <div>
            <h2>Lộ trình khóa học chi tiết</h2>
            <ol>
              {syllabusUnits.map((u, uIdx) => (
                <li key={u.id || uIdx}>
                  <h3>{u.title}</h3>
                  {u.lessons && u.lessons.length > 0 && (
                    <ul>
                      {u.lessons.map((l, lIdx) => (
                        <li key={l.id || lIdx}>
                          {l.title} ({l.type})
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {faqList.length > 0 && (
          <div>
            <h2>Câu hỏi thường gặp</h2>
            {faqList.map((faq, fIdx) => (
              <article key={fIdx}>
                <h3>{faq.q}</h3>
                <p>{faq.a}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Interactive Client View */}
      {resolvedId === GLOBAL_SUCCESS_PRIMARY_CLASS_ID ? (
        await (async () => {
          const [session, cookieStore] = await Promise.all([auth(), cookies()]);
          const cookieGradeRaw = cookieStore.get(GLOBAL_SUCCESS_GRADE_COOKIE)?.value;
          const cookieGrade = cookieGradeRaw ? Number(cookieGradeRaw) : null;
          const validCookieGrade =
            cookieGrade && Number.isInteger(cookieGrade) && cookieGrade >= 1 && cookieGrade <= 5
              ? cookieGrade
              : null;
          let dbGrade: number | null = null;
          if (session?.user?.id) {
            const progress = await getUserGlobalSuccessProgress(session.user.id);
            dbGrade = progress.grade;
          }
          return (
            <GlobalSuccessPrimaryLandingClient
              isLoggedIn={Boolean(session?.user?.id)}
              currentGrade={dbGrade ?? validCookieGrade}
            />
          );
        })()
      ) : (
        <ClassDetailClient classData={classData} />
      )}
    </>
  );
}
