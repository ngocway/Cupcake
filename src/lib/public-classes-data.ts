export type CourseLesson = {
  id: string;
  lessonIndex: number;
  title: string;
  type: string;
  isTrial?: boolean;
};

export type CourseUnit = {
  id: string;
  unitIndex: number;
  title: string;
  lessonsCount: number;
  isFreeTrial?: boolean;
  lessons: CourseLesson[];
};

export type WhatYouLearnItem = {
  iconType: 'sparkles' | 'message' | 'game' | 'trophy' | 'book' | 'mic';
  title: string;
  description: string;
  colorScheme: 'amber' | 'sky' | 'purple' | 'yellow' | 'rose' | 'emerald';
};

export type ReviewItem = {
  id: string;
  author: string;
  avatar: string;
  stars: number;
  timeAgo: string;
  content: string;
};

export type ClassLangContent = {
  title: string;
  shortDescription: string;
  heroDescription: string;
  subjectBadge: string;
  typeBadge: string;
  studentsCount: string;
  lessonsCount: number;
  duration: string;
  language: string;
  whatYouLearn: WhatYouLearnItem[];
  units: CourseUnit[];
  teacher: {
    name: string;
    role: string;
    avatar: string;
    degree: string;
    experience: string;
    quote: string;
  };
  reviews: ReviewItem[];
};

export type PublicClassDetail = {
  id: string;
  thumbnail: string;
  subjectBadgeClass: string;
  typeBadgeClass: string;
  rating: number;
  reviewsCount: number;
  btnGradient: string;
  en: ClassLangContent;
  vi: ClassLangContent;

  // Backward compatibility fields (default to English)
  title: string;
  shortDescription: string;
  heroDescription: string;
  subjectBadge: string;
  typeBadge: string;
  studentsCount: string;
  lessonsCount: number;
  duration: string;
  language: string;
  whatYouLearn: WhatYouLearnItem[];
  units: CourseUnit[];
  teacher: {
    name: string;
    role: string;
    avatar: string;
    degree: string;
    experience: string;
    quote: string;
  };
  reviews: ReviewItem[];
};

export const CLASS_DETAIL_UI_LABELS = {
  en: {
    breadcrumbHome: 'Home',
    breadcrumbClasses: 'Public Classes',
    exploreMore: 'Explore more classes',
    whatYouLearnTitle: 'What will you learn?',
    curriculumTitle: 'Course Curriculum',
    totalUnits: 'units',
    totalLessons: 'lessons',
    freeTrialBadge: 'Free Trial Lesson',
    tryFreeBtn: 'Try free',
    teacherBadge: 'Lead Teacher',
    teacherRole: 'Head Homeroom Teacher',
    reviewsTitle: 'Reviews from Parents & Students',
    viewAllReviews: 'View all reviews',
    enrollBtn: 'Join Class',
    tryFirstLessonBtn: 'Try First Lesson',
    loginRequiredNote: 'Login required to enroll',
    trialModalTitle: 'Free Trial Experience',
    trialModalMsg: 'This classroom is currently in limited beta trial. Please contact our Facebook Group to request free trial access.',
    trialModalMsgEn: 'This classroom is currently in limited beta trial. Please contact our Facebook Group to request free trial access.',
    joinFacebookBtn: 'Join Facebook Group',
    dismissBtn: 'Maybe later',
    all5StarsAlert: 'Thank you! All reviews have earned 5 stars from parents and students.',
  },
  vi: {
    breadcrumbHome: 'Trang chủ',
    breadcrumbClasses: 'Lớp học công khai',
    exploreMore: 'Khám phá thêm lớp học',
    whatYouLearnTitle: 'Bạn sẽ học được gì?',
    curriculumTitle: 'Nội dung khóa học',
    totalUnits: 'unit',
    totalLessons: 'bài học',
    freeTrialBadge: 'Học thử miễn phí',
    tryFreeBtn: 'Học thử',
    teacherBadge: 'Giáo viên',
    teacherRole: 'Giáo viên chủ nhiệm lớp',
    reviewsTitle: 'Đánh giá từ phụ huynh và học viên',
    viewAllReviews: 'Xem tất cả đánh giá',
    enrollBtn: 'Tham gia lớp',
    tryFirstLessonBtn: 'Học thử bài đầu tiên',
    loginRequiredNote: 'Yêu cầu đăng nhập để tham gia lớp',
    trialModalTitle: 'Trải nghiệm lớp học miễn phí',
    trialModalMsg: 'Lớp học đang trong giai đoạn thử nghiệm cho 1 ít học viên. Vui lòng liên hệ Group để yêu cầu trải nghiệm lớp học miễn phí.',
    trialModalMsgEn: 'Lớp học đang trong giai đoạn thử nghiệm cho 1 ít học viên. Vui lòng liên hệ Group để yêu cầu trải nghiệm lớp học miễn phí.',
    joinFacebookBtn: 'Tham gia Group Facebook',
    dismissBtn: 'Để sau',
    all5StarsAlert: 'Cảm ơn bạn! Tất cả đánh giá đều đạt 5 sao từ phụ huynh học sinh.',
  },
};

export const PUBLIC_CLASSES_DATA: Record<string, PublicClassDetail> = {
  'english-adventure-club': {
    id: 'english-adventure-club',
    thumbnail: '/assests/Classes/thumbnails/class-thumb-english-adventure-club.png',
    subjectBadgeClass: 'bg-[#ede9fe] text-[#4338ca] border-[#c7d2fe]',
    typeBadgeClass: 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]',
    rating: 4.9,
    reviewsCount: 68,
    btnGradient: 'from-[#06b6d4] to-[#0ea5e9] hover:from-[#0891b2] hover:to-[#0284c7] shadow-cyan-500/25',

    // ENGLISH VERSION (DEFAULT)
    en: {
      title: 'English Adventure Club',
      shortDescription: 'Learn English through interactive storytelling, games, and joyful daily challenges.',
      heroDescription: 'Join Ms. Jessica into a vibrant English world filled with fun storytelling, interactive minigames, and cheerful daily challenges!',
      subjectBadge: 'English • Grade 2-3',
      typeBadge: '🔥 Free',
      studentsCount: '120 students',
      lessonsCount: 15,
      duration: '4 weeks (3 sessions/week)',
      language: 'English & Vietnamese (Bilingual Support)',
      whatYouLearn: [
        {
          iconType: 'sparkles',
          title: '120+ Topic Vocabulary',
          description: 'Master and accurately pronounce familiar words: Family, School, Animals, Toys.',
          colorScheme: 'amber',
        },
        {
          iconType: 'message',
          title: 'Confident Conversation',
          description: 'Confidently introduce yourself, greet, and share personal interests through short everyday dialogues.',
          colorScheme: 'sky',
        },
        {
          iconType: 'game',
          title: '15 Interactive Minigames',
          description: 'Play Flashcard Match, Picture Quiz, Sentence Builder to retain words deeply and joyfully.',
          colorScheme: 'purple',
        },
        {
          iconType: 'trophy',
          title: 'Earn Stars & Rewards',
          description: 'Rewarding star points ⭐ and achievement badges to inspire daily self-motivated learning.',
          colorScheme: 'yellow',
        },
      ],
      units: [
        {
          id: 'unit-1',
          unitIndex: 1,
          title: 'Unit 1: Hello Friends & Magic Colors',
          lessonsCount: 3,
          isFreeTrial: true,
          lessons: [
            {
              id: 'u1-l1',
              lessonIndex: 1,
              title: 'Lesson 1: Nice to meet you! (Greetings & Introduction)',
              type: 'Video & Phonics',
              isTrial: true,
            },
            {
              id: 'u1-l2',
              lessonIndex: 2,
              title: 'Lesson 2: Rainbow in the Sky (Magic Colors)',
              type: 'Flashcard Game',
              isTrial: false,
            },
            {
              id: 'u1-l3',
              lessonIndex: 3,
              title: 'Lesson 3: Fun Colors Quiz Challenge',
              type: 'Quiz Arena',
              isTrial: false,
            },
          ],
        },
        {
          id: 'unit-2',
          unitIndex: 2,
          title: 'Unit 2: My Lovely Family & Pets',
          lessonsCount: 3,
          lessons: [
            {
              id: 'u2-l1',
              lessonIndex: 4,
              title: 'Lesson 4: Meet My Sweet Family (Family Members)',
              type: 'Video & Phonics',
            },
            {
              id: 'u2-l2',
              lessonIndex: 5,
              title: 'Lesson 5: Cute Puppies & Kittens (Favorite Pets)',
              type: 'Flashcard Game',
            },
            {
              id: 'u2-l3',
              lessonIndex: 6,
              title: 'Lesson 6: Family Arena & Speed Sentence Builder',
              type: 'Quiz Arena',
            },
          ],
        },
        {
          id: 'unit-3',
          unitIndex: 3,
          title: 'Unit 3: Fun Toys & School Time',
          lessonsCount: 3,
          lessons: [
            {
              id: 'u3-l1',
              lessonIndex: 7,
              title: 'Lesson 7: In My Backpack (School Supplies)',
              type: 'Video & Phonics',
            },
            {
              id: 'u3-l2',
              lessonIndex: 8,
              title: 'Lesson 8: Let’s Play Together (Favorite Toys)',
              type: 'Flashcard Game',
            },
            {
              id: 'u3-l3',
              lessonIndex: 9,
              title: 'Lesson 9: School Time Fun - 3-Star Challenge',
              type: 'Quiz Arena',
            },
          ],
        },
        {
          id: 'unit-4',
          unitIndex: 4,
          title: 'Unit 4: Adventure Wrap-up & Grand Trophy 🏆',
          lessonsCount: 3,
          lessons: [
            {
              id: 'u4-l1',
              lessonIndex: 10,
              title: 'Lesson 10: Storytime: Coco the Brave Puppy',
              type: 'Read-along Story',
            },
            {
              id: 'u4-l2',
              lessonIndex: 11,
              title: 'Lesson 11: Mega Game: Conquering 4 Magic Islands',
              type: 'Interactive Minigame',
            },
            {
              id: 'u4-l3',
              lessonIndex: 12,
              title: 'Lesson 12: Grand Final Arena & Dolcake Cup Award 🏆',
              type: 'Grand Final Arena',
            },
          ],
        },
      ],
      teacher: {
        name: 'Ms. Jessica Nguyen',
        role: 'Head Homeroom Teacher',
        avatar: '/assests/Classes/avatars/teacher-avatar-ms-jessica.png',
        degree: 'Bachelor of English Pedagogy - International TESOL Certificate',
        experience: '6 years of primary English teaching experience',
        quote: '“Every lesson with Ms. Jessica is a wonderful adventure! When children feel happy and encouraged, learning English becomes as natural and effortless as their mother tongue.”',
      },
      reviews: [
        {
          id: 'r1',
          author: 'Mrs. Bao An’s Mom (Grade 2A)',
          avatar: '/images/avatars/adult.png',
          stars: 5,
          timeAgo: '3 days ago',
          content: '“My child absolutely loves Ms. Jessica! The gamified interface makes my little one self-motivated to study every evening without any reminders.”',
        },
        {
          id: 'r2',
          author: 'Student Minh Khang',
          avatar: '/images/avatars/kid.png',
          stars: 5,
          timeAgo: '1 week ago',
          content: '“My favorite game is the puppy flashcard match where I earned 3 golden stars! Ms. Jessica teaches pronunciation so clearly.”',
        },
      ],
    },

    // VIETNAMESE VERSION
    vi: {
      title: 'English Adventure Club',
      shortDescription: 'Học tiếng Anh qua truyện kể, trò chơi và các thử thách vui nhộn mỗi ngày.',
      heroDescription: 'Cùng cô Jessica bước vào thế giới tiếng Anh sinh động qua từng câu chuyện kể, minigame và thử thách vui nhộn mỗi ngày!',
      subjectBadge: 'English • Lớp 2-3',
      typeBadge: '🔥 Miễn phí',
      studentsCount: '120 học viên',
      lessonsCount: 15,
      duration: '4 tuần (3 buổi/tuần)',
      language: 'Tiếng Anh & Tiếng Việt (Song ngữ trợ giảng)',
      whatYouLearn: [
        {
          iconType: 'sparkles',
          title: '120+ Từ vựng chủ đề',
          description: 'Nắm vững và phát âm chuẩn các từ vựng thân quen: Gia đình, Trường lớp, Động vật, Đồ chơi.',
          colorScheme: 'amber',
        },
        {
          iconType: 'message',
          title: 'Giao tiếp tự tin',
          description: 'Tự tin giới thiệu bản thân, chào hỏi, bày tỏ sở thích qua các mẫu câu hội thoại ngắn.',
          colorScheme: 'sky',
        },
        {
          iconType: 'game',
          title: '15 Minigames tương tác',
          description: 'Chơi Flashcard Match, Đuổi hình bắt Quiz, Ghép câu giúp bé ghi nhớ từ vựng sâu sắc mà không nhàm chán.',
          colorScheme: 'purple',
        },
        {
          iconType: 'trophy',
          title: 'Tích sao đổi quà',
          description: 'Hệ thống điểm thưởng ⭐ và huy hiệu thành tích kích thích tinh thần tự giác học tập mỗi ngày.',
          colorScheme: 'yellow',
        },
      ],
      units: [
        {
          id: 'unit-1',
          unitIndex: 1,
          title: 'Unit 1: Hello Friends & Magic Colors',
          lessonsCount: 3,
          isFreeTrial: true,
          lessons: [
            {
              id: 'u1-l1',
              lessonIndex: 1,
              title: 'Bài 1: Nice to meet you! (Chào hỏi & Làm quen)',
              type: 'Video & Phonics',
              isTrial: true,
            },
            {
              id: 'u1-l2',
              lessonIndex: 2,
              title: 'Bài 2: Rainbow in the Sky (Màu sắc diệu kỳ)',
              type: 'Flashcard Game',
              isTrial: false,
            },
            {
              id: 'u1-l3',
              lessonIndex: 3,
              title: 'Bài 3: Thử thách đố vui màu sắc vui nhộn',
              type: 'Quiz Arena',
              isTrial: false,
            },
          ],
        },
        {
          id: 'unit-2',
          unitIndex: 2,
          title: 'Unit 2: My Lovely Family & Pets',
          lessonsCount: 3,
          lessons: [
            {
              id: 'u2-l1',
              lessonIndex: 4,
              title: 'Bài 4: Meet My Sweet Family (Gia đình thân yêu)',
              type: 'Video & Phonics',
            },
            {
              id: 'u2-l2',
              lessonIndex: 5,
              title: 'Bài 5: Cute Puppies & Kittens (Thú cưng quanh em)',
              type: 'Flashcard Game',
            },
            {
              id: 'u2-l3',
              lessonIndex: 6,
              title: 'Bài 6: Sàn đấu gia đình & Ghép câu siêu tốc',
              type: 'Quiz Arena',
            },
          ],
        },
        {
          id: 'unit-3',
          unitIndex: 3,
          title: 'Unit 3: Fun Toys & School Time',
          lessonsCount: 3,
          lessons: [
            {
              id: 'u3-l1',
              lessonIndex: 7,
              title: 'Bài 7: In My Backpack (Đồ dùng học tập)',
              type: 'Video & Phonics',
            },
            {
              id: 'u3-l2',
              lessonIndex: 8,
              title: 'Bài 8: Let’s Play Together (Đồ chơi yêu thích)',
              type: 'Flashcard Game',
            },
            {
              id: 'u3-l3',
              lessonIndex: 9,
              title: 'Bài 9: Đố vui trường lớp - Chinh phục 3 sao',
              type: 'Quiz Arena',
            },
          ],
        },
        {
          id: 'unit-4',
          unitIndex: 4,
          title: 'Unit 4: Adventure Wrap-up & Grand Trophy 🏆',
          lessonsCount: 3,
          lessons: [
            {
              id: 'u4-l1',
              lessonIndex: 10,
              title: 'Bài 10: Storytime: Chú cún Coco khám phá thế giới',
              type: 'Read-along Story',
            },
            {
              id: 'u4-l2',
              lessonIndex: 11,
              title: 'Bài 11: Đại hội trò chơi: Vượt 4 đảo kỳ thú',
              type: 'Interactive Minigame',
            },
            {
              id: 'u4-l3',
              lessonIndex: 12,
              title: 'Bài 12: Chung kết Đấu trường & Trao Cúp Dolcake 🏆',
              type: 'Grand Final Arena',
            },
          ],
        },
      ],
      teacher: {
        name: 'Ms. Jessica Nguyen',
        role: 'Giáo viên chủ nhiệm lớp',
        avatar: '/assests/Classes/avatars/teacher-avatar-ms-jessica.png',
        degree: 'Cử nhân Sư phạm Tiếng Anh - Chứng chỉ TESOL Quốc tế',
        experience: '6 năm kinh nghiệm giảng dạy tiếng Anh Tiểu học',
        quote: '“Mỗi ngày học cùng cô Jessica là một chuyến phiêu lưu kỳ thú! Cô tin rằng khi các con cảm thấy vui vẻ và được khích lệ, việc học tiếng Anh sẽ trở nên tự nhiên và dễ dàng như tiếng mẹ đẻ.”',
      },
      reviews: [
        {
          id: 'r1',
          author: 'Mẹ bé Bảo An (Lớp 2A)',
          avatar: '/images/avatars/adult.png',
          stars: 5,
          timeAgo: '3 ngày trước',
          content: '“Bé nhà mình thích mê cô Jessica! Giao diện học như chơi game nên bạn nhỏ tự giác mở máy học mỗi tối không cần mẹ nhắc.”',
        },
        {
          id: 'r2',
          author: 'Bé Minh Khang',
          avatar: '/images/avatars/kid.png',
          stars: 5,
          timeAgo: '1 tuần trước',
          content: '“Con thích nhất trò lật thẻ Flashcard tìm chú cún và được thưởng 3 sao vàng! Cô Jessica dạy phát âm rất dễ hiểu.”',
        },
      ],
    },

    // Backward compatibility direct getters mapped to English
    get title() { return this.en.title; },
    get shortDescription() { return this.en.shortDescription; },
    get heroDescription() { return this.en.heroDescription; },
    get subjectBadge() { return this.en.subjectBadge; },
    get typeBadge() { return this.en.typeBadge; },
    get studentsCount() { return this.en.studentsCount; },
    get lessonsCount() { return this.en.lessonsCount; },
    get duration() { return this.en.duration; },
    get language() { return this.en.language; },
    get whatYouLearn() { return this.en.whatYouLearn; },
    get units() { return this.en.units; },
    get teacher() { return this.en.teacher; },
    get reviews() { return this.en.reviews; },
  },

  'phonics-happy-reading': {
    id: 'phonics-happy-reading',
    thumbnail: '/assests/Classes/thumbnails/class-thumb-phonics-happy-reading.png',
    subjectBadgeClass: 'bg-[#ffedd5] text-[#9a3412] border-[#fed7aa]',
    typeBadgeClass: 'bg-[#ffe4e6] text-[#be123c] border-[#fecdd3]',
    rating: 5.0,
    reviewsCount: 92,
    btnGradient: 'from-[#f97316] to-[#f43f5e] hover:from-[#ea580c] hover:to-[#e11d48] shadow-rose-500/25',

    // ENGLISH VERSION (DEFAULT)
    en: {
      title: 'Phonics & Happy Reading',
      shortDescription: 'Master natural phonics, accurate pronunciation, and build confident English reading habits.',
      heroDescription: 'Help young learners master natural phonics, blend sounds effortlessly, and confidently read their first English storybooks!',
      subjectBadge: 'Phonics • Grade 1-2',
      typeBadge: '🔥 Hot',
      studentsCount: '85+ students',
      lessonsCount: 20,
      duration: '5 weeks (4 sessions/week)',
      language: 'English & Vietnamese (Visual Bilingual)',
      whatYouLearn: [
        {
          iconType: 'book',
          title: '26 Letters & 44 Phonics Sounds',
          description: 'Recognize letterforms and accurately pronounce consonants, short/long vowels by international standards.',
          colorScheme: 'rose',
        },
        {
          iconType: 'sparkles',
          title: 'Natural Sound Blending',
          description: 'Blending techniques that allow children to decode and read new words immediately without rote memorization.',
          colorScheme: 'amber',
        },
        {
          iconType: 'game',
          title: '12 Interactive Storybooks',
          description: 'Practice reading illustrated short stories, mastering natural rhythm and native-like intonation.',
          colorScheme: 'sky',
        },
        {
          iconType: 'trophy',
          title: 'Exclusive Phonics Stickers',
          description: 'Collect cheerful character badges after each completed storybook to inspire daily reading.',
          colorScheme: 'emerald',
        },
      ],
      units: [
        {
          id: 'unit-1',
          unitIndex: 1,
          title: 'Unit 1: The Magic Alphabet & Short Vowels',
          lessonsCount: 3,
          isFreeTrial: true,
          lessons: [
            {
              id: 'u1-l1',
              lessonIndex: 1,
              title: 'Lesson 1: Letter Sounds A, B, C & Story of Cat',
              type: 'Phonics Video',
              isTrial: true,
            },
            {
              id: 'u1-l2',
              lessonIndex: 2,
              title: 'Lesson 2: Short Vowel /æ/ & Interactive Letter Cards',
              type: 'Flashcard Game',
              isTrial: false,
            },
            {
              id: 'u1-l3',
              lessonIndex: 3,
              title: 'Lesson 3: Sound Hunter Quiz Challenge',
              type: 'Quiz Arena',
              isTrial: false,
            },
          ],
        },
        {
          id: 'unit-2',
          unitIndex: 2,
          title: 'Unit 2: Word Families -at, -an, -ap & Fun Rhymes',
          lessonsCount: 3,
          lessons: [
            {
              id: 'u2-l1',
              lessonIndex: 4,
              title: 'Lesson 4: The -at Family (Cat, Hat, Mat, Bat)',
              type: 'Phonics Video',
            },
            {
              id: 'u2-l2',
              lessonIndex: 5,
              title: 'Lesson 5: Fast Blending with Quack the Duck',
              type: 'Sentence Builder',
            },
            {
              id: 'u2-l3',
              lessonIndex: 6,
              title: 'Lesson 6: First Read: "The Fat Cat on a Mat"',
              type: 'Read-along Story',
            },
          ],
        },
        {
          id: 'unit-3',
          unitIndex: 3,
          title: 'Unit 3: Digraphs SH, CH, TH & Magic Blend',
          lessonsCount: 3,
          lessons: [
            {
              id: 'u3-l1',
              lessonIndex: 7,
              title: 'Lesson 7: Magic Digraphs Sh, Ch, Th with Examples',
              type: 'Video & Phonics',
            },
            {
              id: 'u3-l2',
              lessonIndex: 8,
              title: 'Lesson 8: Phonics Master Arena - Word Matching',
              type: 'Quiz Arena',
            },
            {
              id: 'u3-l3',
              lessonIndex: 9,
              title: 'Lesson 9: Read-along: "A Fresh Fish on a Dish"',
              type: 'Read-along Story',
            },
          ],
        },
        {
          id: 'unit-4',
          unitIndex: 4,
          title: 'Unit 4: Happy Reader & Graduation Medal 🏅',
          lessonsCount: 3,
          lessons: [
            {
              id: 'u4-l1',
              lessonIndex: 10,
              title: 'Lesson 10: 20 Essential Sight Words for Grade 1',
              type: 'Interactive Words',
            },
            {
              id: 'u4-l2',
              lessonIndex: 11,
              title: 'Lesson 11: Expressive Short Paragraph Shadowing',
              type: 'Shadowing Audio',
            },
            {
              id: 'u4-l3',
              lessonIndex: 12,
              title: 'Lesson 12: Graduation & Phonics Champion Medal 🏅',
              type: 'Graduation Ceremony',
            },
          ],
        },
      ],
      teacher: {
        name: 'Ms. Anna Pham',
        role: 'Head Homeroom Teacher',
        avatar: '/assests/Classes/avatars/teacher-avatar-ms-anna.png',
        degree: 'Master of Applied Linguistics & TESOL - University of Melbourne',
        experience: '8 years specializing in Early Phonics & Early Reading Skills',
        quote: '“Phonics is the golden key that unlocks independent reading. When children can read their very first books by themselves, the love of learning stays with them for a lifetime.”',
      },
      reviews: [
        {
          id: 'r1',
          author: 'Tue Lam’s Parent (6 years old)',
          avatar: '/images/avatars/adult.png',
          stars: 5,
          timeAgo: '2 days ago',
          content: '“My daughter used to be afraid of reading English, but after just 3 weeks with Ms. Anna, she was reading the cat story fluently! Thank you so much.”',
        },
        {
          id: 'r2',
          author: 'Nhat Nam’s Mom (Grade 1)',
          avatar: '/images/avatars/grade_1.png',
          stars: 5,
          timeAgo: '5 days ago',
          content: '“Ms. Anna’s teaching method is so visual with adorable graphics and crystal-clear audio. My son feels like he is watching cartoons while learning.”',
        },
      ],
    },

    // VIETNAMESE VERSION
    vi: {
      title: 'Phonics & Happy Reading',
      shortDescription: 'Làm quen phonics, phát âm chuẩn và xây dựng thói quen đọc tiếng Anh tự tin.',
      heroDescription: 'Giúp bé nắm vững ngữ âm tự nhiên, ghép vần chuẩn bản xứ và tự tin đọc trôi chảy những cuốn sách tiếng Anh đầu đời!',
      subjectBadge: 'Phonics • Lớp 1-2',
      typeBadge: '🔥 Hot',
      studentsCount: '85+ học viên',
      lessonsCount: 20,
      duration: '5 tuần (4 buổi/tuần)',
      language: 'Tiếng Anh & Tiếng Việt (Song ngữ trực quan)',
      whatYouLearn: [
        {
          iconType: 'book',
          title: '26 Chữ cái & 44 Âm Phonics',
          description: 'Nhận diện mặt chữ và phát âm chuẩn xác từng phụ âm, nguyên âm đơn và nguyên âm đôi theo chuẩn quốc tế.',
          colorScheme: 'rose',
        },
        {
          iconType: 'sparkles',
          title: 'Bí quyết Ghép vần Blending',
          description: 'Kỹ thuật ráp âm tự nhiên giúp bé nhìn chữ là đọc được ngay mà không cần học vẹt phiên âm.',
          colorScheme: 'amber',
        },
        {
          iconType: 'game',
          title: '12 Truyện tranh tương tác',
          description: 'Thực hành đọc truyện ngắn minh họa sinh động, luyện ngắt nghỉ và ngữ điệu tự nhiên như người bản xứ.',
          colorScheme: 'sky',
        },
        {
          iconType: 'trophy',
          title: 'Bộ Sticker Phonics độc quyền',
          description: 'Tích lũy huy hiệu linh vật sau mỗi trang truyện hoàn thành, truyền cảm hứng đọc sách mỗi ngày.',
          colorScheme: 'emerald',
        },
      ],
      units: [
        {
          id: 'unit-1',
          unitIndex: 1,
          title: 'Unit 1: The Magic Alphabet & Short Vowels',
          lessonsCount: 3,
          isFreeTrial: true,
          lessons: [
            {
              id: 'u1-l1',
              lessonIndex: 1,
              title: 'Bài 1: Letter Sounds A, B, C & Story of Cat',
              type: 'Phonics Video',
              isTrial: true,
            },
            {
              id: 'u1-l2',
              lessonIndex: 2,
              title: 'Bài 2: Vần ngắn /æ/ & Flashcard chữ cái tương tác',
              type: 'Flashcard Game',
              isTrial: false,
            },
            {
              id: 'u1-l3',
              lessonIndex: 3,
              title: 'Bài 3: Thử thách tìm âm đúng - Sound Hunter',
              type: 'Quiz Arena',
              isTrial: false,
            },
          ],
        },
        {
          id: 'unit-2',
          unitIndex: 2,
          title: 'Unit 2: Word Families -at, -an, -ap & Fun Rhymes',
          lessonsCount: 3,
          lessons: [
            {
              id: 'u2-l1',
              lessonIndex: 4,
              title: 'Bài 4: Gia đình vần -at (Cat, Hat, Mat, Bat)',
              type: 'Phonics Video',
            },
            {
              id: 'u2-l2',
              lessonIndex: 5,
              title: 'Bài 5: Ghép vần nhanh cùng Chú Vịt Quack',
              type: 'Sentence Builder',
            },
            {
              id: 'u2-l3',
              lessonIndex: 6,
              title: 'Bài 6: Truyện đọc đầu tiên: "The Fat Cat on a Mat"',
              type: 'Read-along Story',
            },
          ],
        },
        {
          id: 'unit-3',
          unitIndex: 3,
          title: 'Unit 3: Digraphs SH, CH, TH & Magic Blend',
          lessonsCount: 3,
          lessons: [
            {
              id: 'u3-l1',
              lessonIndex: 7,
              title: 'Bài 7: Âm ghép kỳ diệu Sh, Ch, Th và ví dụ',
              type: 'Video & Phonics',
            },
            {
              id: 'u3-l2',
              lessonIndex: 8,
              title: 'Bài 8: Đấu trường Phonics Master - Ghép từ chuẩn',
              type: 'Quiz Arena',
            },
            {
              id: 'u3-l3',
              lessonIndex: 9,
              title: 'Bài 9: Truyện đọc: "A Fresh Fish on a Dish"',
              type: 'Read-along Story',
            },
          ],
        },
        {
          id: 'unit-4',
          unitIndex: 4,
          title: 'Unit 4: Happy Reader & Graduation Medal 🏅',
          lessonsCount: 3,
          lessons: [
            {
              id: 'u4-l1',
              lessonIndex: 10,
              title: 'Bài 10: 20 Sight Words cơ bản cho bé lớp 1',
              type: 'Interactive Words',
            },
            {
              id: 'u4-l2',
              lessonIndex: 11,
              title: 'Bài 11: Luyện đọc đoạn văn ngắn diễn cảm',
              type: 'Shadowing Audio',
            },
            {
              id: 'u4-l3',
              lessonIndex: 12,
              title: 'Bài 12: Tốt nghiệp & Trao huy chương Phonics Champion 🏅',
              type: 'Graduation Ceremony',
            },
          ],
        },
      ],
      teacher: {
        name: 'Ms. Anna Pham',
        role: 'Giáo viên chủ nhiệm lớp',
        avatar: '/assests/Classes/avatars/teacher-avatar-ms-anna.png',
        degree: 'Thạc sĩ Giảng dạy Tiếng Anh (MA TESOL) - Đại học Melbourne',
        experience: '8 năm chuyên sâu luyện Phonics & Kỹ năng Đọc sớm cho trẻ nhỏ',
        quote: '“Phonics là chìa khóa vàng mở cánh cửa đọc sách độc lập. Khi các con tự tin đọc được từng trang sách đầu tiên, niềm yêu thích học tập sẽ theo con suốt cả cuộc đời.”',
      },
      reviews: [
        {
          id: 'r1',
          author: 'Phụ huynh bé Tuệ Lâm (6 tuổi)',
          avatar: '/images/avatars/adult.png',
          stars: 5,
          timeAgo: '2 ngày trước',
          content: '“Bé nhà mình trước đây rất sợ đọc tiếng Anh, nhưng từ khi học cô Anna chỉ 3 tuần đã tự đánh vần đọc vanh vách truyện chú mèo! Cảm ơn cô rất nhiều.”',
        },
        {
          id: 'r2',
          author: 'Mẹ bé Nhật Nam (Lớp 1)',
          avatar: '/images/avatars/grade_1.png',
          stars: 5,
          timeAgo: '5 ngày trước',
          content: '“Phương pháp của cô Anna cực kỳ trực quan, hình vẽ dễ thương và âm thanh to rõ. Con học mà cứ ngỡ đang xem hoạt hình vậy.”',
        },
      ],
    },

    // Backward compatibility direct getters mapped to English
    get title() { return this.en.title; },
    get shortDescription() { return this.en.shortDescription; },
    get heroDescription() { return this.en.heroDescription; },
    get subjectBadge() { return this.en.subjectBadge; },
    get typeBadge() { return this.en.typeBadge; },
    get studentsCount() { return this.en.studentsCount; },
    get lessonsCount() { return this.en.lessonsCount; },
    get duration() { return this.en.duration; },
    get language() { return this.en.language; },
    get whatYouLearn() { return this.en.whatYouLearn; },
    get units() { return this.en.units; },
    get teacher() { return this.en.teacher; },
    get reviews() { return this.en.reviews; },
  },

  'little-speaking-stars': {
    id: 'little-speaking-stars',
    thumbnail: '/assests/Classes/thumbnails/class-thumb-little-speaking-stars.png',
    subjectBadgeClass: 'bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff]',
    typeBadgeClass: 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]',
    rating: 4.9,
    reviewsCount: 115,
    btnGradient: 'from-[#8b5cf6] to-[#6366f1] hover:from-[#7c3aed] hover:to-[#4f46e5] shadow-indigo-500/25',

    // ENGLISH VERSION (DEFAULT)
    en: {
      title: 'Little Speaking Stars',
      shortDescription: 'Practice conversational reflexes through roleplay dialogues and everyday familiar themes.',
      heroDescription: 'Build natural English speaking reflexes, expand everyday conversational patterns, and confidently present real-life topics in front of an audience!',
      subjectBadge: 'Speaking • Grade 3-5',
      typeBadge: '🔥 Free',
      studentsCount: '200+ students',
      lessonsCount: 18,
      duration: '6 weeks (3 sessions/week)',
      language: '100% International Standard English (Bilingual subtitles)',
      whatYouLearn: [
        {
          iconType: 'mic',
          title: '3-Second Speaking Reflex',
          description: 'Continuous Q&A method that helps children respond instantly without mental translation.',
          colorScheme: 'purple',
        },
        {
          iconType: 'message',
          title: '30+ Real-Life Conversational Phrases',
          description: 'Master practical situations: Ordering food, Asking directions, Hobbies, Shopping, and Global friends.',
          colorScheme: 'sky',
        },
        {
          iconType: 'sparkles',
          title: 'Mini Presentation Skills',
          description: 'Guide children to structure confident short speeches: Impressive opening, key points, and engaging wrap-up.',
          colorScheme: 'amber',
        },
        {
          iconType: 'trophy',
          title: 'AI Shadowing Pronunciation Scoring',
          description: 'Smart voice analysis technology providing real-time feedback on intonation, stress, and linking sounds.',
          colorScheme: 'yellow',
        },
      ],
      units: [
        {
          id: 'unit-1',
          unitIndex: 1,
          title: 'Unit 1: All About Awesome Me!',
          lessonsCount: 3,
          isFreeTrial: true,
          lessons: [
            {
              id: 'u1-l1',
              lessonIndex: 1,
              title: 'Lesson 1: Introduce Yourself Like a Pro',
              type: 'Video & Speaking',
              isTrial: true,
            },
            {
              id: 'u1-l2',
              lessonIndex: 2,
              title: 'Lesson 2: My Favorite Hobbies & Super Talents',
              type: 'Sentence Builder',
              isTrial: false,
            },
            {
              id: 'u1-l3',
              lessonIndex: 3,
              title: 'Lesson 3: 60-Second Challenge: "Who am I?"',
              type: 'Speaking Arena',
              isTrial: false,
            },
          ],
        },
        {
          id: 'unit-2',
          unitIndex: 2,
          title: 'Unit 2: Daily Life & Cool Friends',
          lessonsCount: 3,
          lessons: [
            {
              id: 'u2-l1',
              lessonIndex: 4,
              title: 'Lesson 4: A Day in My Life (From Dawn to Dusk)',
              type: 'Video & Roleplay',
            },
            {
              id: 'u2-l2',
              lessonIndex: 5,
              title: 'Lesson 5: At the Food Court - Ordering Pizza!',
              type: 'Interactive Dialogue',
            },
            {
              id: 'u2-l3',
              lessonIndex: 6,
              title: 'Lesson 6: Lightning Reflex Game with Mr. David',
              type: 'Quiz Challenge',
            },
          ],
        },
        {
          id: 'unit-3',
          unitIndex: 3,
          title: 'Unit 3: Exploring the Wonderful World',
          lessonsCount: 3,
          lessons: [
            {
              id: 'u3-l1',
              lessonIndex: 7,
              title: 'Lesson 7: Welcome to the Zoo (Wild Animals)',
              type: 'Virtual Tour & Talk',
            },
            {
              id: 'u3-l2',
              lessonIndex: 8,
              title: 'Lesson 8: Weather & Seasons Around the Globe',
              type: 'Flashcard & Debate',
            },
            {
              id: 'u3-l3',
              lessonIndex: 9,
              title: 'Lesson 9: Junior Weather Reporter Roleplay',
              type: 'Speaking Project',
            },
          ],
        },
        {
          id: 'unit-4',
          unitIndex: 4,
          title: 'Unit 4: Young TED Talkers & Super Trophy 🏆',
          lessonsCount: 3,
          lessons: [
            {
              id: 'u4-l1',
              lessonIndex: 10,
              title: 'Lesson 10: Secrets to Confident Public Speaking',
              type: 'Masterclass Video',
            },
            {
              id: 'u4-l2',
              lessonIndex: 11,
              title: 'Lesson 11: Speech Project: "My Dream for the Future"',
              type: 'Speech Workshop',
            },
            {
              id: 'u4-l3',
              lessonIndex: 12,
              title: 'Lesson 12: Gala Presentation Night & Top Stars Award 🌟',
              type: 'Gala Ceremony',
            },
          ],
        },
      ],
      teacher: {
        name: 'Mr. David Wilson',
        role: 'Head Homeroom Teacher',
        avatar: '/assests/Classes/avatars/teacher-avatar-mr-david.png',
        degree: 'Bachelor of Linguistics - Cambridge CELTA International Teaching Certificate',
        experience: '7 years coaching Presentation & Communication for international students',
        quote: '“Never be afraid of making mistakes! Every time you speak English out loud is a giant leap forward. My classroom is always a welcoming space for you to shine and be proud.”',
      },
      reviews: [
        {
          id: 'r1',
          author: 'Hoang Nam’s Parent (Grade 4)',
          avatar: '/images/avatars/adult.png',
          stars: 5,
          timeAgo: '4 days ago',
          content: '“Mr. David is so funny and energetic! Nam was shy before, but after 2 weeks he was standing in front of the mirror recording his own self-introduction video with great confidence.”',
        },
        {
          id: 'r2',
          author: 'Student Thao Chi (Grade 5)',
          avatar: '/images/avatars/grade_3.png',
          stars: 5,
          timeAgo: '1 week ago',
          content: '“My favorite activity is roleplaying ordering food at the supermarket! Mr. David has perfect pronunciation and teaches phrasing pauses so well.”',
        },
      ],
    },

    // VIETNAMESE VERSION
    vi: {
      title: 'Little Speaking Stars',
      shortDescription: 'Luyện phản xạ giao tiếp qua hội thoại, đóng vai và các chủ đề gần gũi với bé.',
      heroDescription: 'Rèn luyện phản xạ nghe nói tự nhiên, mở rộng vốn câu đàm thoại và tự tin thuyết trình các chủ đề đời sống trước đám đông!',
      subjectBadge: 'Speaking • Lớp 3-5',
      typeBadge: '🔥 Miễn phí',
      studentsCount: '200+ học viên',
      lessonsCount: 18,
      duration: '6 tuần (3 buổi/tuần)',
      language: '100% Tiếng Anh chuẩn Quốc tế (Kèm phụ đề song ngữ)',
      whatYouLearn: [
        {
          iconType: 'mic',
          title: 'Phản xạ hội thoại 3 giây',
          description: 'Phương pháp Hỏi - Đáp liên tục giúp bé phản xạ ngay lập tức mà không phải dịch ngầm sang tiếng Việt.',
          colorScheme: 'purple',
        },
        {
          iconType: 'message',
          title: '30+ Mẫu câu giao tiếp đắt giá',
          description: 'Làm chủ các tình huống thực tế: Gọi món, Hỏi đường, Bày tỏ sở thích, Mua sắm và Kết bạn quốc tế.',
          colorScheme: 'sky',
        },
        {
          iconType: 'sparkles',
          title: 'Kỹ năng Thuyết trình mini',
          description: 'Hướng dẫn bé cấu trúc một bài nói ngắn tự tin: Mở đầu ấn tượng, phát triển ý chính và kết luận cuốn hút.',
          colorScheme: 'amber',
        },
        {
          iconType: 'trophy',
          title: 'AI Shadowing chấm phát âm',
          description: 'Công nghệ luyện nói thông minh chấm điểm độ chuẩn ngữ điệu, trọng âm và nối âm từng câu.',
          colorScheme: 'yellow',
        },
      ],
      units: [
        {
          id: 'unit-1',
          unitIndex: 1,
          title: 'Unit 1: All About Awesome Me!',
          lessonsCount: 3,
          isFreeTrial: true,
          lessons: [
            {
              id: 'u1-l1',
              lessonIndex: 1,
              title: 'Bài 1: Introduce Yourself Like a Pro',
              type: 'Video & Speaking',
              isTrial: true,
            },
            {
              id: 'u1-l2',
              lessonIndex: 2,
              title: 'Bài 2: My Favorite Hobbies & Super Talents',
              type: 'Sentence Builder',
              isTrial: false,
            },
            {
              id: 'u1-l3',
              lessonIndex: 3,
              title: 'Bài 3: Thử thách nói 60s: "Who am I?"',
              type: 'Speaking Arena',
              isTrial: false,
            },
          ],
        },
        {
          id: 'unit-2',
          unitIndex: 2,
          title: 'Unit 2: Daily Life & Cool Friends',
          lessonsCount: 3,
          lessons: [
            {
              id: 'u2-l1',
              lessonIndex: 4,
              title: 'Bài 4: A Day in My Life (Từ sáng tới tối)',
              type: 'Video & Roleplay',
            },
            {
              id: 'u2-l2',
              lessonIndex: 5,
              title: 'Bài 5: At the Food Court - Calling Pizza!',
              type: 'Interactive Dialogue',
            },
            {
              id: 'u2-l3',
              lessonIndex: 6,
              title: 'Bài 6: Minigame: Nhanh như chớp cùng Mr. David',
              type: 'Quiz Challenge',
            },
          ],
        },
        {
          id: 'unit-3',
          unitIndex: 3,
          title: 'Unit 3: Exploring the Wonderful World',
          lessonsCount: 3,
          lessons: [
            {
              id: 'u3-l1',
              lessonIndex: 7,
              title: 'Bài 7: Welcome to the Zoo (Động vật hoang dã)',
              type: 'Virtual Tour & Talk',
            },
            {
              id: 'u3-l2',
              lessonIndex: 8,
              title: 'Bài 8: Weather & Seasons Around the Globe',
              type: 'Flashcard & Debate',
            },
            {
              id: 'u3-l3',
              lessonIndex: 9,
              title: 'Bài 9: Đóng vai phóng viên nhí thời tiết',
              type: 'Speaking Project',
            },
          ],
        },
        {
          id: 'unit-4',
          unitIndex: 4,
          title: 'Unit 4: Young TED Talkers & Super Trophy 🏆',
          lessonsCount: 3,
          lessons: [
            {
              id: 'u4-l1',
              lessonIndex: 10,
              title: 'Bài 10: Bí quyết tự tin nói trước đám đông',
              type: 'Masterclass Video',
            },
            {
              id: 'u4-l2',
              lessonIndex: 11,
              title: 'Bài 11: Dự án nói: "My Dream for the Future"',
              type: 'Speech Workshop',
            },
            {
              id: 'u4-l3',
              lessonIndex: 12,
              title: 'Bài 12: Đêm Gala Thuyết trình & Vinh danh Top Stars 🌟',
              type: 'Gala Ceremony',
            },
          ],
        },
      ],
      teacher: {
        name: 'Mr. David Wilson',
        role: 'Giáo viên chủ nhiệm lớp',
        avatar: '/assests/Classes/avatars/teacher-avatar-mr-david.png',
        degree: 'Cử nhân Ngôn ngữ học - Chứng chỉ Giảng dạy Quốc tế CELTA Cambridge',
        experience: '7 năm chuyên huấn luyện kỹ năng Thuyết trình & Giao tiếp cho học sinh quốc tế',
        quote: '“Đừng ngại nói sai! Mỗi lần con cất tiếng nói tiếng Anh là một bước tiến vượt bậc. Lớp học của thầy David luôn là nơi con được tự do tỏa sáng và tự hào về chính mình.”',
      },
      reviews: [
        {
          id: 'r1',
          author: 'Phụ huynh bé Hoàng Nam (Lớp 4)',
          avatar: '/images/avatars/adult.png',
          stars: 5,
          timeAgo: '4 ngày trước',
          content: '“Thầy David rất vui tính và năng lượng! Bạn Nam vốn nhút nhát nhưng sau 2 tuần học đã dám đứng trước gương tự quay video giới thiệu bản thân bằng tiếng Anh rất tự tin.”',
        },
        {
          id: 'r2',
          author: 'Bé Thảo Chi (Lớp 5)',
          avatar: '/images/avatars/grade_3.png',
          stars: 5,
          timeAgo: '1 tuần trước',
          content: '“Con thích nhất phần đóng vai đi siêu thị và gọi món ăn! Thầy David phát âm cực chuẩn và hướng dẫn cách ngắt nghỉ câu rất hay ạ.”',
        },
      ],
    },

    // Backward compatibility direct getters mapped to English
    get title() { return this.en.title; },
    get shortDescription() { return this.en.shortDescription; },
    get heroDescription() { return this.en.heroDescription; },
    get subjectBadge() { return this.en.subjectBadge; },
    get typeBadge() { return this.en.typeBadge; },
    get studentsCount() { return this.en.studentsCount; },
    get lessonsCount() { return this.en.lessonsCount; },
    get duration() { return this.en.duration; },
    get language() { return this.en.language; },
    get whatYouLearn() { return this.en.whatYouLearn; },
    get units() { return this.en.units; },
    get teacher() { return this.en.teacher; },
    get reviews() { return this.en.reviews; },
  },
};

export const PUBLIC_CLASSES_LIST: PublicClassDetail[] = Object.values(PUBLIC_CLASSES_DATA);
