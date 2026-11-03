"use client";

import React, { useState, useEffect, useCallback } from "react";

export type TeacherLocale = "en" | "vi";

export const TEACHER_DICT = {
  en: {
    header: {
      teacherPortal: "Teacher Portal",
      studentPortal: "Student Portal",
      searchPlaceholder: "Search lessons, assignments...",
      dashboard: "Dashboard",
      classes: "Classes",
      lessons: "Lessons",
      portfolio: "Manage Portfolio",
      settings: "Settings",
      logout: "Sign Out",
      getStarted: "GET STARTED",
    },
    sidebar: {
      createNewTitle: "Create New",
      match: "Matching",
      math: "Math",
      fillInBlanks: "Fill in Blanks",
      flipCards: "Flip Cards",
      quiz: "Multiple Choice",
      comingSoonTooltip: "Feature coming soon",
      createdTitle: "Created Exercises",
      createdMatchTitle: "Created Matching",
      createdMatchSub: "Matching games list",
      createdMathTitle: "Created Math",
      createdMathSub: "Math games list",
      createdFillTitle: "Created Fill in Blanks",
      createdFillSub: "Fill-in-blanks list",
      createdFlipTitle: "Created Flip Cards",
      createdFlipSub: "Flip card games list",
      createdQuizTitle: "Created Quizzes",
      createdQuizSub: "Multiple choice games list",
    },
    common: {
      createExercise: "Create Exercise",
      createThisExercise: "Create This Exercise",
      loginToCreate: "Teacher Sign In to Create",
      guide: "Tutorial",
      guideSuffix: "Creation Tutorial",
      guideBadge: "TUTORIAL",
      watchDemoTooltip: "Watch game demo video",
      watchGuideTooltip: "Watch tutorial video",
      guideComingSoonTooltip: "Tutorial video coming soon",
      preview: "Preview",
      previewTooltip: "Play preview in new tab",
      edit: "Edit",
      editTooltip: "Edit exercise",
      delete: "Delete",
      deleteTooltip: "Delete this exercise",
      deletingTooltip: "Deleting exercise...",
      share: "Share",
      shareTooltip: "Share exercise & QR code with students",
      pairsCount: "pairs",
      questionsCount: "questions",
      copy: "Copy",
      copied: "Copied",
      close: "Close",
      downloadQr: "Download QR",
      openGame: "Open Game",
      backToHome: "Back to Portal",
      backToList: "Back to Exercises",
      saveExercise: "Save Exercise",
      updateExercise: "Update Exercise",
      saving: "Saving...",
    },
    videoModal: {
      closeTooltip: "Close video (ESC)",
      pause: "Pause",
      resume: "Play",
      replay: "Replay from start",
      unmute: "Unmute",
      mute: "Mute",
      playingGuide: "Playing creation tutorial (HD 1080p)",
      playingDemo: "Playing game preview (HD 1080p)",
      paused: "Paused",
      clickToToggle: "Click video to",
      clickPause: "pause",
      clickResume: "resume",
    },
    matchCards: {
      sectionTitle: "Create Matching Games",
      sectionSubtitle: "Choose a matching game format to create for your students",
      games: {
        "image-image": {
          title: "Match Image - Image",
          badge: "Image - Image",
          desc: "Students match 2 identical or visually related images together.",
        },
        "image-text": {
          title: "Match Image - Word",
          badge: "Image - Word",
          desc: "Students look at an illustration and match it with the corresponding word or sentence.",
        },
        "conveyor-drop": {
          title: "Conveyor Belt Drop",
          badge: "Conveyor",
          desc: "Students watch image crates move along a conveyor belt and drop them into the matching word tube.",
        },
        "line-image-image": {
          title: "Line Match Image - Image",
          badge: "Line Match",
          desc: "Students draw lines to connect 2 matching images between the top and bottom rows.",
        },
        "line-image-text": {
          title: "Line Match Image - Word",
          badge: "Line Match",
          desc: "Students draw lines to connect images with matching words or sentences between rows.",
        },
        "cut-rope-image-text": {
          title: "Cut the Rope Image - Word",
          badge: "Cut Rope",
          desc: "Students slice ropes to drop and match images with their corresponding words or sentences.",
        },
        "train-vocab": {
          title: "Vocabulary Train",
          badge: "Train",
          desc: "Students load vocabulary cards onto the matching illustrated train carriages.",
        },
      },
    },
    choiceCards: {
      sectionTitle: "Create Math Games",
      sectionSubtitle: "Choose a fast-paced math game format to create for your students",
      games: {
        shooter: {
          title: "Math Space Shooter",
          badge: "SHOOTER",
          desc: "Students aim and shoot energy orbs carrying the right math answers to score combos in a Neon Sci-Fi arena.",
        },
        "egg-crack": {
          title: "Math Egg Smash",
          badge: "EGG SMASH",
          desc: "Students crack open eggs showing the correct math answers to earn coins, stars, and climb the leaderboard.",
        },
      },
    },
    flipCards: {
      sectionTitle: "Create Memory Flip Games",
      sectionSubtitle: "Choose a memory card flip format to create for your students",
      games: {
        "flip-image-image": {
          title: "Flip Image - Image",
          badge: "Image - Image",
          desc: "Students flip cards to find and pair identical or visually related images.",
        },
        "flip-image-text": {
          title: "Flip Image - Word",
          badge: "Image - Word",
          desc: "Students flip cards to find and pair illustrations with their matching words or sentences.",
        },
      },
    },
    quizCards: {
      sectionTitle: "Create Multiple Choice Quizzes",
      sectionSubtitle: "Choose an interactive quiz adventure format to create for your students",
      games: {
        "candy-quiz": {
          title: "Candy World Quiz",
          badge: "CANDY WORLD",
          desc: "Students answer multiple-choice questions with 4 options in a colorful, lively Candy World adventure.",
        },
        "treasure-hunt": {
          title: "Mystery Treasure Hunt",
          badge: "TREASURE",
          desc: "Students answer multiple-choice questions to unlock mystery tiles on a pirate map and collect gold chests.",
        },
        "shooter-quiz": {
          title: "Space Shooter Quiz",
          badge: "SHOOTER",
          desc: "Students pilot a space cannon and fire neon lasers at energy orbs holding the correct quiz answer.",
        },
      },
    },
    myGames: {
      loadingMatch: "Loading your Matching exercises...",
      loadingChoice: "Loading your Math exercises...",
      loadingFlip: "Loading your Flip Card exercises...",
      loadingQuiz: "Loading your Quiz exercises...",
      emptyMatchTitle: "No Matching exercises created yet",
      emptyMatchDesc: "Create your first Image-Word or Image-Image matching set for students to practice!",
      emptyChoiceTitle: "No Math exercises created yet",
      emptyChoiceDesc: "Create your first Math Shooter or Egg Smash exercise for students to practice mental math!",
      emptyFlipTitle: "No Flip Card exercises created yet",
      emptyFlipDesc: "Create your first Flip Image-Image or Flip Image-Word card deck to train student memory!",
      emptyQuizTitle: "No Quiz exercises created yet",
      emptyQuizDesc: "Create your first Candy World, Treasure Hunt, or Space Shooter quiz for your students!",
      confirmDelete: 'Are you sure you want to delete "{name}"?',
      deletingToast: 'Deleting "{name}"...',
      deletedToast: 'Deleted "{name}" successfully!',
      deleteErrorToast: "Could not delete exercise!",
      badges: {
        train: "Train",
        cutRope: "Cut Rope",
        conveyor: "Conveyor",
        lineMatch: "Line Match",
        imageImage: "Image - Image",
        textText: "Text - Text",
        imageText: "Image - Word",
        eggSmash: "🥚 Egg Smash",
        shooter: "🎯 Shooter",
        flipImageImage: "Flip Image - Image",
        flipImageText: "Flip Image - Word",
        shooterQuiz: "Space Shooter Quiz",
        treasureHunt: "Mystery Treasure Hunt",
        candyQuiz: "Candy World Quiz",
      },
    },
    shareModal: {
      headerTag: "Share Exercise",
      qrScanTitle: "Scan QR code to play immediately",
      qrScanSubtitle: "Project this QR code on your classroom screen or TV for students to scan",
      linkCopiedToast: "Exercise link copied! You can paste and send it to your students now.",
      qrDownloadedToast: "QR code image downloaded!",
      studentCodeLabel: "Student Assignment Code",
      directLinkLabel: "Direct Exercise Link",
      shareShooterTitle: "Share Math Exercise",
    },
    saveSuccessModal: {
      savedBadge: "Exercise Saved Successfully!",
      untitled: "New Exercise",
      gameFormatLabel: "Game Format:",
      assignmentCodeLabel: "Assignment Code",
      qrInstantTitle: "Instant Play QR Code",
      qrInstantDesc: "Students can scan this QR code with their phone or tablet camera to start playing right away.",
      previewGame: "Preview Game",
      backToExercises: "Back to My Exercises",
    },
    studio: {
      backToPortal: "Back to Teacher Portal",
      exerciseTitleLabel: "Exercise Title",
      exerciseTitlePlaceholder: "E.g., Unit 1: Animals Vocabulary...",
      addCardPair: "Add Card Pair",
      addQuestion: "Add Question",
      selectFromLibrary: "Pick from Flashcard Library",
      aiGenerate: "AI Auto-Generate",
      saveAndPublish: "Save Exercise",
      updateAndPublish: "Update Exercise",
      saving: "Saving...",
      totalPairs: "Total Pairs",
      totalQuestions: "Total Questions",
      cardPairNumber: "Pair",
      questionNumber: "Question",
      uploadImage: "Upload Image",
      changeImage: "Change Image",
      wordOrSentencePlaceholder: "Enter word or sentence...",
      correctAnswer: "Correct Answer",
      wrongAnswer: "Distractor / Wrong Option",
      timeLimit: "Time Limit",
      seconds: "seconds",
    },
  },
  vi: {
    header: {
      teacherPortal: "Teacher Portal",
      studentPortal: "Student Portal",
      searchPlaceholder: "Tìm kiếm bài học, bài tập...",
      dashboard: "Dashboard",
      classes: "Lớp học",
      lessons: "Bài học",
      portfolio: "Quản lý Portfolio",
      settings: "Cài đặt",
      logout: "Đăng xuất",
      getStarted: "Đăng nhập",
    },
    sidebar: {
      createNewTitle: "Danh mục Tạo mới",
      match: "Nối cặp",
      math: "Toán học",
      fillInBlanks: "Điền ô trống",
      flipCards: "Lật ảnh",
      quiz: "Trắc nghiệm",
      comingSoonTooltip: "Tính năng đang hoàn thiện",
      createdTitle: "Bài tập đã tạo",
      createdMatchTitle: "Nối cặp đã tạo",
      createdMatchSub: "Danh sách game Nối Cặp",
      createdMathTitle: "Toán học đã tạo",
      createdMathSub: "Danh sách game Toán học",
      createdFillTitle: "Điền ô trống đã tạo",
      createdFillSub: "Danh sách game Điền ô",
      createdFlipTitle: "Lật ảnh đã tạo",
      createdFlipSub: "Danh sách game Lật ảnh",
      createdQuizTitle: "Trắc nghiệm đã tạo",
      createdQuizSub: "Danh sách game Trắc nghiệm",
    },
    common: {
      createExercise: "Tạo bài tập",
      createThisExercise: "Tạo bài tập này",
      loginToCreate: "Đăng nhập Giáo viên để tạo",
      guide: "Hướng dẫn",
      guideSuffix: "Hướng dẫn tạo bài",
      guideBadge: "HƯỚNG DẪN",
      watchDemoTooltip: "Xem video giới thiệu game",
      watchGuideTooltip: "Xem video hướng dẫn",
      guideComingSoonTooltip: "Chưa có video hướng dẫn (Sắp cập nhật)",
      preview: "Xem thử",
      previewTooltip: "Chơi thử game trong tab mới",
      edit: "Sửa",
      editTooltip: "Chỉnh sửa bài tập",
      delete: "Xóa",
      deleteTooltip: "Xóa bài tập này",
      deletingTooltip: "Đang xóa bài tập...",
      share: "Chia sẻ",
      shareTooltip: "Chia sẻ bài tập & mã QR cho học sinh",
      pairsCount: "cặp",
      questionsCount: "câu",
      copy: "Sao chép",
      copied: "Đã chép",
      close: "Đóng",
      downloadQr: "Tải ảnh QR",
      openGame: "Mở game",
      backToHome: "Quay lại",
      backToList: "Về danh sách bài tập",
      saveExercise: "Lưu bài tập",
      updateExercise: "Cập nhật bài tập",
      saving: "Đang lưu...",
    },
    videoModal: {
      closeTooltip: "Đóng video (Phím ESC)",
      pause: "Tạm dừng",
      resume: "Phát tiếp",
      replay: "Phát lại từ đầu",
      unmute: "Bật âm thanh",
      mute: "Tắt âm thanh",
      playingGuide: "Đang phát video hướng dẫn tạo bài (HD 1080p)",
      playingDemo: "Đang phát video giới thiệu game (HD 1080p)",
      paused: "Đã tạm dừng",
      clickToToggle: "Nhấp vào video để",
      clickPause: "tạm dừng",
      clickResume: "tiếp tục",
    },
    matchCards: {
      sectionTitle: "Tạo Game Nối Cặp",
      sectionSubtitle: "Chọn dạng game nối cặp bạn muốn tạo cho học sinh làm bài",
      games: {
        "image-image": {
          title: "Nối Cặp Ảnh - Ảnh",
          badge: "Ảnh - Ảnh",
          desc: "Học sinh ghép 2 hình ảnh tương đồng hoặc có mối liên quan trực quan với nhau.",
        },
        "image-text": {
          title: "Nối Cặp Ảnh - Chữ",
          badge: "Ảnh - Chữ",
          desc: "Học sinh nhìn hình ảnh minh họa và chọn từ vựng / câu bằng chữ tương ứng.",
        },
        "conveyor-drop": {
          title: "Băng Chuyền Thả Khối",
          badge: "Băng Chuyền",
          desc: "Học sinh nhìn khối hàng hình ảnh di chuyển trên băng chuyền và thả vào đúng ống hút từ vựng tương ứng.",
        },
        "line-image-image": {
          title: "Nối Dây Ảnh - Ảnh",
          badge: "Nối Dây",
          desc: "Học sinh kéo dây nối 2 hình ảnh tương ứng giữa hàng trên và hàng dưới.",
        },
        "line-image-text": {
          title: "Nối Dây Ảnh - Chữ",
          badge: "Nối Dây",
          desc: "Học sinh kéo dây nối hình ảnh với từ vựng / câu tương ứng giữa hàng trên và hàng dưới.",
        },
        "cut-rope-image-text": {
          title: "Cắt Dây Ảnh - Chữ",
          badge: "Cắt Dây",
          desc: "Học sinh dùng thao tác cắt dây để nối hình ảnh với từ vựng / câu tương ứng.",
        },
        "train-vocab": {
          title: "Nối Đoàn Tàu",
          badge: "Đoàn Tàu",
          desc: "Học sinh ghép thẻ từ vựng vào đúng toa tàu có hình ảnh tương ứng.",
        },
      },
    },
    choiceCards: {
      sectionTitle: "Tạo Game Chọn Đáp Án",
      sectionSubtitle: "Chọn dạng game chọn đáp án bạn muốn tạo cho học sinh làm bài",
      games: {
        shooter: {
          title: "Bắn Súng Toán Học",
          badge: "BẮN SÚNG",
          desc: "Học sinh điều khiển tháp pháo bắn phá các khối cầu mang đáp án đúng để ghi điểm và tích lũy combo trong không gian Neon Sci-Fi.",
        },
        "egg-crack": {
          title: "Đập Trứng Toán Học",
          badge: "ĐẬP TRỨNG",
          desc: "Học sinh đập vỡ các quả trứng mang đáp án đúng để tích lũy xu thưởng, nhân sao và chinh phục bảng xếp hạng.",
        },
      },
    },
    flipCards: {
      sectionTitle: "Tạo Game Lật Ảnh",
      sectionSubtitle: "Chọn dạng game lật ảnh bạn muốn tạo cho học sinh làm bài",
      games: {
        "flip-image-image": {
          title: "Lật Ảnh-Ảnh",
          badge: "Ảnh - Ảnh",
          desc: "Học sinh lật các thẻ bài để tìm và ghép các cặp hình ảnh tương đồng hoặc có mối liên quan trực quan với nhau.",
        },
        "flip-image-text": {
          title: "Lật Ảnh-Chữ",
          badge: "Ảnh - Chữ",
          desc: "Học sinh lật các thẻ bài để tìm và ghép cặp giữa hình ảnh minh họa với từ vựng / câu bằng chữ tương ứng.",
        },
      },
    },
    quizCards: {
      sectionTitle: "Tạo Game Trắc Nghiệm",
      sectionSubtitle: "Chọn dạng game trắc nghiệm bạn muốn tạo cho học sinh làm bài",
      games: {
        "candy-quiz": {
          title: "Trắc nghiệm Kẹo Ngọt",
          badge: "KẸO NGỌT",
          desc: "Học sinh tham gia trả lời các câu hỏi và 4 đáp án dạng câu văn dài trên giao diện Xứ sở Kẹo Ngọt (Candy World) đầy màu sắc và âm thanh vui nhộn.",
        },
        "treasure-hunt": {
          title: "Truy tìm Kho báu",
          badge: "KHO BÁU",
          desc: "Học sinh tham gia trả lời các câu hỏi trắc nghiệm để mở khóa các ô bí ẩn trên bản đồ hải tặc kỳ bí và thu thập các rương vàng quý giá.",
        },
        "shooter-quiz": {
          title: "Bắn súng Trắc nghiệm",
          badge: "BẮN SÚNG",
          desc: "Học sinh điều khiển nòng pháo không gian, bắn đạn laser neon vào các quả cầu năng lượng chứa đáp án đúng giữa vũ trụ huyền ảo.",
        },
      },
    },
    myGames: {
      loadingMatch: "Đang tải danh sách bài tập Nối Cặp...",
      loadingChoice: "Đang tải danh sách bài tập Chọn đáp án...",
      loadingFlip: "Đang tải danh sách bài tập Lật Ảnh...",
      loadingQuiz: "Đang tải danh sách bài tập Trắc nghiệm...",
      emptyMatchTitle: "Bạn chưa tạo bài tập Nối cặp nào",
      emptyMatchDesc: "Hãy tạo các bộ thẻ Nối Cặp Ảnh - Chữ hoặc Chữ - Chữ đầu tiên để học sinh thực hành!",
      emptyChoiceTitle: "Bạn chưa tạo bài tập Chọn đáp án nào",
      emptyChoiceDesc: "Hãy tạo các bài tập Chọn đáp án (Bắn súng, Đập trứng...) để học sinh rèn luyện tính nhẩm tốc độ!",
      emptyFlipTitle: "Bạn chưa tạo bài tập Lật ảnh nào",
      emptyFlipDesc: "Hãy tạo các bộ thẻ Lật Ảnh-Ảnh hoặc Lật Ảnh-Chữ đầu tiên để học sinh rèn luyện trí nhớ và phản xạ!",
      emptyQuizTitle: "Bạn chưa tạo bài tập Trắc nghiệm nào",
      emptyQuizDesc: "Hãy tạo bài tập Trắc nghiệm đầu tiên (Kẹo Ngọt hoặc Truy tìm Kho báu) để học sinh ôn luyện với giao diện hấp dẫn!",
      confirmDelete: 'Bạn có chắc chắn muốn xóa bài tập "{name}" không?',
      deletingToast: 'Đang xử lý xóa bài tập "{name}"...',
      deletedToast: 'Đã xóa bài tập "{name}" thành công!',
      deleteErrorToast: "Không thể xóa bài tập!",
      badges: {
        train: "Đoàn Tàu",
        cutRope: "Cắt Dây",
        conveyor: "Băng Chuyền",
        lineMatch: "Nối Dây",
        imageImage: "Ảnh - Ảnh",
        textText: "Chữ - Chữ",
        imageText: "Ảnh - Chữ",
        eggSmash: "🥚 Đập Trứng",
        shooter: "🎯 Bắn Súng",
        flipImageImage: "Lật Ảnh - Ảnh",
        flipImageText: "Lật Ảnh - Chữ",
        shooterQuiz: "Bắn súng Trắc nghiệm",
        treasureHunt: "Truy tìm Kho báu",
        candyQuiz: "Trắc nghiệm Kẹo Ngọt",
      },
    },
    shareModal: {
      headerTag: "Chia sẻ bài tập",
      qrScanTitle: "Quét mã QR để bắt đầu chơi ngay",
      qrScanSubtitle: "Giáo viên có thể chiếu lên máy chiếu/tivi cho học sinh quét camera điện thoại",
      linkCopiedToast: "Đã sao chép đường dẫn bài tập! Bạn có thể dán và gửi cho học sinh ngay.",
      qrDownloadedToast: "Đã tải xuống ảnh mã QR!",
      studentCodeLabel: "Mã Bài Tập Học Sinh",
      directLinkLabel: "Đường Link Trực Tiếp",
      shareShooterTitle: "Chia Sẻ Bài Tập",
    },
    saveSuccessModal: {
      savedBadge: "Lưu bài tập thành công!",
      untitled: "Bài tập mới",
      gameFormatLabel: "Dạng game:",
      assignmentCodeLabel: "Mã Bài Tập",
      qrInstantTitle: "Mã QR Chơi Ngay",
      qrInstantDesc: "Học sinh quét mã QR bằng điện thoại hoặc camera để vào làm bài ngay lập tức.",
      previewGame: "Xem trước game",
      backToExercises: "Về danh sách bài tập",
    },
    studio: {
      backToPortal: "Về trang Giáo viên",
      exerciseTitleLabel: "Tên bài tập",
      exerciseTitlePlaceholder: "VD: Unit 1: Động vật quanh em...",
      addCardPair: "Thêm cặp thẻ",
      addQuestion: "Thêm câu hỏi",
      selectFromLibrary: "Chọn từ thư viện Flashcard",
      aiGenerate: "Tạo tự động bằng AI",
      saveAndPublish: "Lưu bài tập",
      updateAndPublish: "Cập nhật bài tập",
      saving: "Đang lưu...",
      totalPairs: "Tổng số cặp",
      totalQuestions: "Tổng số câu",
      cardPairNumber: "Cặp thẻ",
      questionNumber: "Câu hỏi",
      uploadImage: "Tải ảnh lên",
      changeImage: "Đổi ảnh",
      wordOrSentencePlaceholder: "Nhập từ vựng hoặc câu...",
      correctAnswer: "Đáp án đúng",
      wrongAnswer: "Đáp án nhiễu",
      timeLimit: "Thời gian",
      seconds: "giây",
    },
  },
} as const;

export function getStoredTeacherLocale(): TeacherLocale {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem("preferred-locale");
  if (saved === "vi" || saved === "en") return saved;
  const match = document.cookie.match(/(^| )NEXT_LOCALE=([^;]+)/);
  if (match && (match[2] === "vi" || match[2] === "en")) {
    return match[2] as TeacherLocale;
  }
  return "en";
}

export function setGlobalTeacherLocale(nextLocale: TeacherLocale) {
  if (typeof window === "undefined") return;
  document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=31536000;SameSite=Lax`;
  localStorage.setItem("preferred-locale", nextLocale);
  window.dispatchEvent(new CustomEvent("locale-change", { detail: nextLocale }));
  fetch("/api/locale", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale: nextLocale }),
  }).catch(() => {});
}

export function useTeacherLocale() {
  const [locale, setLocaleState] = useState<TeacherLocale>("en");

  useEffect(() => {
    setLocaleState(getStoredTeacherLocale());

    const handleLocaleChange = (e: any) => {
      if (e?.detail === "vi" || e?.detail === "en") {
        setLocaleState(e.detail);
      }
    };
    window.addEventListener("locale-change", handleLocaleChange);
    return () => window.removeEventListener("locale-change", handleLocaleChange);
  }, []);

  const setLocale = useCallback((nextLocale: TeacherLocale) => {
    setLocaleState(nextLocale);
    setGlobalTeacherLocale(nextLocale);
  }, []);

  return {
    locale,
    setLocale,
    isVi: locale === "vi",
    t: TEACHER_DICT[locale] || TEACHER_DICT.en,
  };
}

export function TeacherLocaleSwitch({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useTeacherLocale();

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-full bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-xs select-none shrink-0 ${className}`}
      title={locale === "en" ? "Switch language (EN / VI)" : "Chuyển ngôn ngữ (EN / VI)"}
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer ${
          locale === "en"
            ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
        }`}
      >
        <span className="text-[11px] leading-none">🇬🇧</span>
        <span>EN</span>
      </button>
      <button
        type="button"
        onClick={() => setLocale("vi")}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer ${
          locale === "vi"
            ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
        }`}
      >
        <span className="text-[11px] leading-none">🇻🇳</span>
        <span>VI</span>
      </button>
    </div>
  );
}

const VI_TO_EN_EXACT: Record<string, string> = {
  // Headers & Game Titles / Subtitles
  "Thiết kế bài tập": "Exercise Designer",
  "Chỉnh sửa bài tập": "Edit Exercise",
  "Quay lại": "Back",
  "Nối Cặp Ảnh - Chữ": "Match Image - Word",
  "Nối Dây Ảnh - Chữ": "Line Match Image - Word",
  "Cắt Dây Ảnh - Chữ": "Cut the Rope Image - Word",
  "Nối Đoàn Tàu": "Vocabulary Train",
  "Nối Cặp Ảnh - Ảnh": "Match Image - Image",
  "Nối Dây Ảnh - Ảnh": "Line Match Image - Image",
  "Băng Chuyền Thả Khối": "Conveyor Belt Drop",
  "Lật Ảnh-Ảnh": "Flip Image - Image",
  "Lật Ảnh - Ảnh": "Flip Image - Image",
  "Lật Ảnh-Chữ": "Flip Image - Word",
  "Lật Ảnh - Chữ": "Flip Image - Word",
  "Trắc nghiệm Kẹo Ngọt": "Candy World Quiz",
  "TRẮC NGHIỆM KẸO NGỌT": "CANDY WORLD QUIZ",
  "Truy tìm Kho báu": "Mystery Treasure Hunt",
  "TRUY TÌM KHO BÁU": "MYSTERY TREASURE HUNT",
  "Bắn súng Trắc nghiệm": "Space Shooter Quiz",
  "BẮN SÚNG TRẮC NGHIỆM": "SPACE SHOOTER QUIZ",
  "Bắn Súng Toán Học": "Math Space Shooter",
  "Đập Trứng Toán Học": "Math Egg Smash",
  "Ảnh - Chữ": "Image - Word",
  "Ảnh - Ảnh": "Image - Image",
  "Nối Dây": "Line Match",
  "Cắt Dây": "Cut Rope",
  "Đoàn Tàu": "Train",
  "Băng Chuyền": "Conveyor",
  "KẸO NGỌT": "CANDY WORLD",
  "KHO BÁU": "TREASURE",
  "BẮN SÚNG": "SHOOTER",
  "ĐẬP TRỨNG": "EGG SMASH",
  "Tạo Game Nối Cặp Ảnh - Chữ": "Create Match Image - Word Game",
  "Chỉnh sửa Game Nối Cặp Ảnh - Chữ": "Edit Match Image - Word Game",
  "Tạo mới Game Nối Dây Ảnh - Chữ": "Create Line Match Image - Word Game",
  "Chỉnh sửa Game Nối Dây Ảnh - Chữ": "Edit Line Match Image - Word Game",
  "Tạo game cắt Ảnh-chữ": "Create Cut the Rope Image - Word Game",
  "Chỉnh sửa Game Cắt Ảnh - Chữ": "Edit Cut the Rope Image - Word Game",
  "Tạo mới Game Nối Đoàn Tàu": "Create Vocabulary Train Game",
  "Chỉnh sửa Game Nối Đoàn Tàu": "Edit Vocabulary Train Game",
  "Tạo Game Nối Cặp Ảnh - Ảnh": "Create Match Image - Image Game",
  "Tạo mới Game Nối Cặp Ảnh - Ảnh": "Create Match Image - Image Game",
  "Chỉnh sửa Game Nối Cặp Ảnh - Ảnh": "Edit Match Image - Image Game",
  "Tạo mới Game Nối Dây Ảnh - Ảnh": "Create Line Match Image - Image Game",
  "Chỉnh sửa Game Nối Dây Ảnh - Ảnh": "Edit Line Match Image - Image Game",
  "Tạo Game Băng Chuyền Thả Khối": "Create Conveyor Belt Drop Game",
  "Chỉnh sửa Game Băng Chuyền Thả Khối": "Edit Conveyor Belt Drop Game",
  "Tạo mới Game Lật Ảnh-Ảnh": "Create Flip Image - Image Game",
  "Chỉnh sửa Game Lật Ảnh-Ảnh": "Edit Flip Image - Image Game",
  "Tạo Mới Game Lật Ảnh-Chữ": "Create Flip Image - Word Game",
  "Tạo mới Game Lật Ảnh-Chữ": "Create Flip Image - Word Game",
  "Chỉnh sửa Game Lật Ảnh-Chữ": "Edit Flip Image - Word Game",
  "Tạo mới Game Trắc nghiệm Kẹo Ngọt": "Create Candy World Quiz Game",
  "Chỉnh sửa Game Trắc nghiệm Kẹo Ngọt": "Edit Candy World Quiz Game",
  "Tạo mới Game Truy tìm Kho báu": "Create Mystery Treasure Hunt Game",
  "Chỉnh sửa Game Truy tìm Kho báu": "Edit Mystery Treasure Hunt Game",
  "Tạo mới Game Bắn súng Trắc nghiệm": "Create Space Shooter Quiz Game",
  "Chỉnh sửa Game Bắn súng Trắc nghiệm": "Edit Space Shooter Quiz Game",
  "Tạo Game Bắn Súng Toán Học": "Create Math Space Shooter Game",
  "Tạo Game Đập Trứng Toán Học": "Create Math Egg Smash Game",
  "• Tạo bài tập lật ghép 2 hình ảnh": "• Create a 2-image memory flip exercise",
  "• Tạo bài tập ghép 2 hình ảnh tương ứng": "• Create a matching image pairs exercise",
  "• Tạo bài tập trắc nghiệm 4 đáp án Xứ sở Kẹo": "• Create a 4-option multiple choice quiz in Candy World",
  "• Tạo bài tập trắc nghiệm mở ô bản đồ Kho Báu": "• Create a pirate map treasure hunt multiple choice quiz",
  "• Tạo bài tập trắc nghiệm Bắn súng Neon không gian": "• Create a Neon Space Shooter multiple choice quiz",
  "Hệ thống tự động sinh câu hỏi theo các dạng toán được chọn": "Automatically generates math questions from selected math types",

  // Section Headers, Labels & Placeholders
  "1. Thông tin bài tập": "1. Exercise Information",
  "Tên bài tập / Game": "Exercise / Game Title",
  "Tên bài tập / Game *": "Exercise / Game Title *",
  "Tên bài tập / Tiêu đề game": "Exercise / Game Title",
  "Tên bài tập / Tiêu đề game *": "Exercise / Game Title *",
  "TÊN BÀI TẬP / TIÊU ĐỀ GAME": "EXERCISE / GAME TITLE",
  "TÊN BÀI TẬP / TIÊU ĐỀ GAME *": "EXERCISE / GAME TITLE *",
  "Tên Bài Tập": "Exercise Title",
  "Bắt buộc nhập tên bài tập": "Exercise title is required",
  "Vui lòng nhập tên bài tập": "Please enter an exercise title",
  "Vui lòng nhập tên bài tập!": "Please enter an exercise title!",
  "Vui lòng nhập Tên bài tập / Game trước khi lưu!": "Please enter an Exercise / Game Title before saving!",
  "Vui lòng nhập Tên bài tập / Game!": "Please enter an Exercise / Game Title!",
  "Nhập tên bài tập...": "Enter exercise title...",
  "Nhập tên bài tập (VD: Bài tập Cắt Ảnh - Chữ)...": "Enter exercise title (e.g., Cut the Rope Vocabulary)...",
  "Nhập tên bài tập (VD: Bài tập Nối Dây Ảnh - Chữ)...": "Enter exercise title (e.g., Line Match Vocabulary)...",
  "Nhập tên bài tập (VD: Bài tập Nối Cặp Ảnh - Chữ)...": "Enter exercise title (e.g., Match Image - Word)...",
  "Nhập tên bài tập (VD: Bài tập Băng Chuyền Thả Khối)...": "Enter exercise title (e.g., Conveyor Belt Vocabulary)...",
  "Nhập tên bài tập (VD: Bài tập Lật Ảnh-Chữ vựng tiếng Anh)...": "Enter exercise title (e.g., Flip Image - Word Vocabulary)...",
  "VD: Nhận biết động vật & bóng tương ứng...": "E.g., Match Animals & Their Shadows...",
  "VD: Thì Hiện Tại Đơn & Tiếp Diễn, Câu hỏi giao tiếp...": "E.g., Present Simple & Continuous, Daily Conversation...",
  "VD: English 2D Shapes, Animals Vocabulary...": "E.g., English 2D Shapes, Animals Vocabulary...",
  "2. Danh sách các cặp thẻ Nối (Ảnh - Chữ)": "2. Matching Card Pairs (Image - Word)",
  "2. Danh sách các cặp thẻ Băng Chuyền (Ảnh - Chữ)": "2. Conveyor Belt Card Pairs (Image - Word)",
  "2. Danh sách các cặp thẻ Lật (Ảnh - Chữ)": "2. Flip Card Pairs (Image - Word)",
  "2. Danh sách các cặp thẻ (Chữ - Chữ)": "2. Matching Card Pairs (Text - Text)",

  // Audio / Toolbar / Round Tabs / Card Controls
  "Hệ thống tự đọc": "Auto TTS Voice",
  "Tải lên Audio": "Upload Audio",
  "Không đọc": "No Audio",
  "Tạo bằng AI": "Create with AI",
  "Nhập nhanh nhiều từ": "Bulk Add Words",
  "Tải bộ ảnh hàng loạt": "Bulk Upload Images",
  "Tải câu hỏi hàng loạt": "Bulk Upload Questions",
  "Thêm Vòng Mới": "Add New Round",
  "Thêm Chuyến Tàu Mới": "Add New Train",
  "Tổng cộng:": "Total:",
  "Hướng dẫn phân bổ Chuyến tàu:": "Train carriage guide:",
  "Mỗi Vòng tương ứng với": "Each Round corresponds to",
  "1 Chuyến tàu gồm tối đa 4 toa": "1 Train with up to 4 carriages",
  "để hình ảnh và chữ hiển thị to rõ nhất cho bé. Khi Học sinh nối xong 4 toa của Vòng 1, đoàn tàu sẽ hú còi và tự động đón tiếp Vòng 2!": "so images and words stay large and clear. Once students complete Round 1, the train whistles and moves to Round 2!",
  "Hướng dẫn phân bổ Vòng chơi:": "Round allocation guide:",
  "Mỗi Vòng chứa tối đa": "Each Round holds up to",
  "7 cặp thẻ": "7 card pairs",
  "8 cặp thẻ": "8 card pairs",
  "để Học sinh nối trực quan không bị rối mắt. Khi Học sinh nối hết toàn bộ thẻ của Vòng 1, game sẽ tự động chuyển tiếp sang Vòng 2!": "for a clean visual layout. When students finish Round 1, the game automatically advances to Round 2!",
  "để Học sinh lật ghép không bị rối mắt. Khi Học sinh hoàn thành Vòng 1, game sẽ tự động chuyển tiếp sang Vòng 2!": "for a clean memory board. When students finish Round 1, the game automatically advances to Round 2!",
  "để Học sinh quan sát băng chuyền không bị rối mắt. Khi Học sinh thả hết toàn bộ khối của Vòng 1, game sẽ tự động chuyển tiếp sang Vòng 2!": "for a clear conveyor view. When students finish Round 1, the game automatically advances to Round 2!",
  "Chưa chọn ảnh": "No image selected",
  "Chọn ảnh Vế A": "Select Image A",
  "Chọn ảnh Vế B": "Select Image B",
  "Tìm ảnh": "Search",
  "Tải ảnh": "Upload",
  "Tải file": "Upload",
  "Tải file mới": "Upload new",
  "Đổi ảnh": "Change",
  "Đổi ảnh khác": "Change image",
  "Tải ảnh khác từ máy": "Upload another image from device",
  "Xóa ảnh": "Remove image",
  "Gỡ ảnh": "Remove image",
  "Xóa": "Delete",
  "Xóa cặp thẻ": "Delete card pair",
  "Xóa cặp thẻ này": "Delete this card pair",
  "Xóa vòng này": "Delete this round",
  "Xóa câu hỏi này": "Delete this question",
  "Ảnh lỗi tải / Chặn link": "Image load error / Blocked link",
  "Ảnh lỗi tải": "Image load error",
  "Vui lòng chọn ảnh khác": "Please choose another image",
  "Đang nén & tải lên...": "Compressing & uploading...",
  "Từ vựng / Câu": "Word / Phrase",
  "Nhập Chữ/Từ...": "Enter word/phrase...",
  "Audio đã có": "Audio ready",
  "Chưa có audio": "No audio",
  "Đổi": "Change",
  "Tải MP3": "Upload MP3",
  "Nghe thử đọc": "Listen preview",
  "Thêm 1 cặp": "Add 1 Pair",
  "Thêm 1 toa": "Add 1 Carriage",
  "+ Thêm 1 câu hỏi": "+ Add 1 Question",
  "Thêm đáp án": "Add option",
  "+ Thêm ảnh": "+ Add image",
  "Nội dung câu hỏi": "Question text",
  "Nội dung câu hỏi *": "Question text *",
  "Ảnh": "Image",
  "(tùy chọn)": "(optional)",
  "Ảnh (tùy chọn)": "Image (optional)",
  "Tối thiểu 2 câu • Click vào ký hiệu A/B/C/D để chọn đáp án ĐÚNG": "Min 2 questions • Click A/B/C/D badge to mark the CORRECT answer",
  "Kéo thả để đổi vị trí câu hỏi": "Drag to reorder question",
  "Kéo thả để đổi vị trí đáp án": "Drag to reorder option",
  "Kéo thả ảnh sang thẻ khác để di chuyển hoặc tráo đổi vị trí": "Drag image to another card to move or swap",
  "Kéo thả sang ô khác để di chuyển hoặc tráo đổi vị trí ảnh": "Drag to another slot to move or swap image",
  "Đáp án ĐÚNG": "CORRECT Answer",
  "Click để chọn làm đáp án ĐÚNG": "Click to mark as CORRECT answer",
  "Bấm để chọn làm đáp án ĐÚNG": "Click to mark as CORRECT answer",
  "Lưu bài tập": "Save Exercise",
  "LƯU BÀI TẬP": "SAVE EXERCISE",
  "Đang lưu...": "Saving...",
  "Đang tải dữ liệu bài tập...": "Loading exercise data...",
  "Đang tải chi tiết bài tập...": "Loading exercise details...",
  "Đang tải trình tạo bài tập...": "Loading exercise studio...",
  "Hệ thống đang đồng bộ toàn bộ nội dung và danh sách các cặp thẻ từ CSDL": "Syncing exercise content and card pairs from database",

  // Math Games (choice-shooter & choice-egg)
  "Cấu hình": "Configure",
  "Xem trước & Lưu": "Preview & Save",
  "Vui lòng chọn ít nhất 1 dạng toán": "Please select at least 1 math type",
  "Sang bước xem trước & lưu bài tập": "Go to preview & save",
  "Chọn các Dạng Toán tự động sinh câu hỏi": "Select Math Types to Auto-Generate",
  "Cộng 2 số 1 chữ số": "1-Digit Addition",
  "Cộng 2 số 2 chữ số": "2-Digit Addition",
  "Trừ 2 số 1 chữ số": "1-Digit Subtraction",
  "Trừ 2 số 2 chữ số (không âm)": "2-Digit Subtraction (Non-negative)",
  "Nhân 2 số 1 chữ số": "1-Digit Multiplication",
  "Chia 2 số cơ bản (chia hết)": "Basic Division (Exact)",
  "Tìm X (Ẩn số)": "Find X (Unknown)",
  "So sánh biểu thức (>, <, =)": "Compare Expressions (>, <, =)",
  "Phép cộng": "Addition",
  "Phép trừ": "Subtraction",
  "Phép nhân": "Multiplication",
  "Phép chia": "Division",
  "Tìm X": "Find X",
  "So sánh": "Compare",
  "Thủ công": "Manual",
  "+ Tự nhập câu hỏi thủ công": "+ Add Custom Question Manually",
  "Tạo câu hỏi & 4 đáp án tùy chỉnh từ đầu": "Create custom questions & 4 options from scratch",
  "+ Tự nhập câu hỏi": "+ Add Custom Question",
  "Số Lượng Câu Hỏi": "Number of Questions",
  "Luật Kết Thúc": "End Condition",
  "Hết câu hỏi": "Finish all questions",
  "🏁 Hết câu hỏi": "🏁 Finish all questions",
  "Vòng lặp vô tận": "Endless loop",
  "🔄 Vòng lặp vô tận": "🔄 Endless loop",
  "Tóm Tắt Bài Tập": "Exercise Summary",
  "Xem trước cấu hình trước khi sinh câu hỏi": "Review configuration before generating questions",
  "Tổng Số Câu Hỏi": "Total Questions",
  "⚠️ Chưa chọn dạng toán nào. Vui lòng tích chọn ở bên trái!": "⚠️ No math type selected. Please select at least one on the left!",
  "Tạo câu hỏi tự động ➔": "Generate Questions ➔",
  "Đã sinh tự động": "Auto-generated",
  "Bạn có thể bấm icon 🔄 để đổi câu khác hoặc chỉnh sửa trực tiếp chữ/số trước khi hoàn tất": "Click 🔄 to reroll a question or edit numbers/text directly before saving",
  "✓ Đúng": "✓ Correct",
  "✕ Sai 1": "✕ Wrong 1",
  "✕ Sai 2": "✕ Wrong 2",
  "✕ Sai 3": "✕ Wrong 3",
  "Đáp án đúng": "Correct answer",
  "Đáp án sai 1": "Wrong answer 1",
  "Đáp án sai 2": "Wrong answer 2",
  "Đáp án sai 3": "Wrong answer 3",
  "Nhập câu hỏi...": "Enter question...",
  "Đổi câu hỏi khác": "Reroll question",

  // Modals (Bulk Paste, Bulk Questions, Image Search, AI Modals, Exit & Validation)
  "Nhập nhanh nhiều từ vựng": "Bulk Add Vocabulary Words",
  "Nhập/dán danh sách từ vựng vào đây (ngăn cách bởi dấu phẩy hoặc xuống dòng):": "Enter or paste vocabulary words here (separated by commas or new lines):",
  "Số từ nhận diện:": "Detected words:",
  "Vượt quá tối đa 50 từ!": "Exceeds maximum of 50 words!",
  "Hủy bỏ": "Cancel",
  "Hủy": "Cancel",
  "Tạo danh sách các Vòng chơi": "Create Game Rounds",
  "Tìm kiếm ảnh minh họa": "Search Illustrations",
  "Tìm Ảnh Minh Họa Online": "Search Online Illustrations",
  "Kho hình ảnh chuẩn từ vựng Tiếng Anh cho Học sinh": "Curated English vocabulary illustration library for students",
  "Tìm kiếm kho ảnh Unsplash & Pixabay chất lượng cao": "Search high-quality illustrations and photos",
  "Hoạt hình Cartoon": "Cartoon",
  "Hoạt hình (Cartoon)": "Cartoon",
  "🎨 Hoạt hình": "🎨 Cartoon",
  "Chân thực": "Realistic",
  "Chân thực (Realistic)": "Realistic",
  "📸 Thực tế": "📸 Realistic",
  "Phong cách ảnh:": "Image style:",
  "Nhập từ khóa tiếng Anh (VD: Dog, Apple, Teacher)...": "Enter English keyword (e.g., Dog, Apple, Teacher)...",
  "Nhập từ khóa tìm kiếm tiếng Anh (VD: cat, dog, apple)...": "Enter English search keyword (e.g., cat, dog, apple)...",
  "Nhập từ khóa tiếng Anh hoặc tiếng Việt (VD: door, cat, school...)": "Enter keyword in English (e.g., door, cat, school...)",
  "Gõ từ khóa tìm ảnh (tiếng Anh)...": "Enter English keyword to search images...",
  "Tìm kiếm": "Search",
  "Tìm": "Search",
  "Đang tìm kiếm ảnh...": "Searching images...",
  "Đang tìm ảnh...": "Searching images...",
  "Đang tìm kiếm hình ảnh phù hợp...": "Searching for matching images...",
  "Chọn ảnh": "Select",
  "Chọn": "Select",
  "Chọn hình ảnh minh họa": "Select Illustration",
  "Nhập từ khóa và bấm Tìm kiếm để xem kết quả hình ảnh": "Enter a keyword and click Search to view image results",
  "Nhập từ khóa và nhấn Tìm kiếm để xem kết quả.": "Enter a keyword and click Search to view results.",
  'Nhập từ khóa tiếng Anh và nhấn "Tìm" để xem gợi ý ảnh đẹp!': 'Enter an English keyword and click "Search" to see image suggestions!',
  "Tải Câu Hỏi Hàng Loạt": "Bulk Upload Questions",
  "Dán danh sách câu hỏi văn bản nhanh chóng": "Paste your list of questions in text format",
  "📋 Dán nội dung mẫu": "📋 Paste Sample Format",
  "Khung nhập văn bản:": "Text Input:",
  "Xóa trắng": "Clear all",
  'Sửa trực tiếp trong khung trên rồi bấm lại "Áp dụng"': 'Edit directly in the box above and click "Apply" again',
  "Áp dụng vào bài tập": "Apply to Exercise",
  "Thông báo": "Notice",
  "Cần hoàn thiện thông tin bài tập": "Incomplete Exercise Information",
  "Đã hiểu": "Got it",
  "Cảnh báo rời khỏi trang": "Leave Page Warning",
  "Thay đổi chưa được lưu": "Unsaved changes",
  "Bạn chưa lưu các thay đổi của bài tập này. Nếu rời khỏi trang bây giờ, toàn bộ thông tin vừa nhập sẽ bị mất.": "You have unsaved changes in this exercise. If you leave now, your changes will be lost.",
  "Hủy, ở lại trang": "Stay on Page",
  "Rời khỏi trang": "Leave Page",

  // AI Modals
  "Tạo Cặp Thẻ Tự Động Bằng AI": "AI Auto-Generate Card Pairs",
  "Nhập chủ đề hoặc tải ảnh lên để AI phân tích & tạo trọn bộ cặp thẻ": "Enter a topic or upload an image for AI to analyze & generate card pairs",
  "Gõ chủ đề": "Enter Topic",
  "Tải / Dán ảnh (AI nhận diện)": "Upload / Paste Image (AI Vision)",
  "CHỦ ĐỀ TỪ VỰNG": "VOCABULARY TOPIC",
  "Gợi ý: Nhập tiếng Anh hoặc tiếng Việt. Hoặc chuyển sang tab Tải ảnh / dán Ctrl+V để AI tự tìm chủ đề.": "Tip: Enter in English or Vietnamese, or switch to Upload Image / press Ctrl+V for AI topic detection.",
  "HÌNH ẢNH ĐẦU VÀO": "INPUT IMAGE",
  "Kéo thả hoặc dán ảnh vào đây": "Drag & drop or paste an image here",
  "Chọn ảnh từ thiết bị": "Choose Image from Device",
  "Ảnh nguồn phân tích": "Analyzed Source Image",
  "AI đang quan sát ảnh & trích xuất chủ đề...": "AI is analyzing the image & extracting topic...",
  "✓ Đã nhận diện:": "✓ Detected:",
  "Tên chủ đề trích xuất (có thể sửa lại nếu muốn):": "Extracted topic (you can edit if needed):",
  "Chủ đề từ vựng...": "Vocabulary topic...",
  "CẤP ĐỘ TỪ VỰNG": "VOCABULARY LEVEL",
  "Căn bản": "Basic",
  "Trung bình": "Intermediate",
  "Tương đối cao": "Upper-Intermediate",
  "Cao": "Advanced",
  "SỐ LƯỢNG TỪ VỰNG": "WORD COUNT",
  "Hoặc tự nhập số lượng:": "Or enter custom count:",
  "PHONG CÁCH HÌNH ẢNH": "IMAGE STYLE",
  "Cơ chế ghép cặp: Hình vẽ & Ảnh thật": "Pairing Mode: Cartoon & Realistic Photo",
  "Hoạt hình / Tranh vẽ": "Cartoon / Illustration",
  "Clipart, Vector (phù hợp cho trẻ nhỏ)": "Clipart, Vector (great for young learners)",
  "Ảnh chụp thực tế": "Realistic Photo",
  "Hình ảnh chân thực, khoa học": "Real-world, scientific photography",
  "Bắt đầu tạo tự động": "Start AI Generation",
  "Đang tạo...": "Generating...",
  "Tạo Câu Hỏi Bằng AI": "AI Question Generator",
  "Game Kẹo Ngọt": "Candy World",
  "Tạo tự động câu hỏi trắc nghiệm từ chủ đề hoặc ảnh chụp bài tập": "Auto-generate multiple-choice questions from a topic, passage, or worksheet photo",
  "Đang xử lý tạo câu hỏi và tìm hình ảnh minh họa...": "Generating questions and searching for illustrations...",
  "Chủ đề / Bài đọc": "Topic / Reading Passage",
  "Quét ảnh bài tập / SGK": "Scan Worksheet / Textbook",
  "Chủ đề hoặc Đoạn văn bài học:": "Topic or Reading Passage:",
  "Có thể gõ tiếng Việt hoặc tiếng Anh": "Enter in English or Vietnamese",
  "Ảnh chụp trang sách / bài tập:": "Textbook / Worksheet Photo:",
  "Gemini Vision đang phân tích ảnh...": "Gemini Vision is analyzing the image...",
  "Đã phân tích nội dung ảnh thành công!": "Image content analyzed successfully!",
  "Nhấp vào đây để đổi ảnh khác hoặc nhấn Ctrl + V": "Click here to change image or press Ctrl + V",
  "Kéo thả ảnh vào đây, hoặc click để chọn ảnh": "Drag & drop an image here, or click to browse",
  "Nội dung AI đã trích xuất từ ảnh (có thể chỉnh sửa thêm):": "Content extracted by AI from image (editable):",
  "Trình độ câu hỏi:": "Difficulty Level:",
  "Dễ": "Easy",
  "Từ vựng & câu ngắn cơ bản": "Basic words & short sentences",
  "Ngữ pháp thông dụng": "Common grammar & structures",
  "Khó": "Hard",
  "Cấu trúc nâng cao & tư duy": "Advanced structures & critical thinking",
  "Dạng câu hỏi:": "Question Type:",
  "🌟 Đa dạng (Kết hợp)": "🌟 Mixed (All Types)",
  "📖 Từ vựng & Định nghĩa": "📖 Vocabulary & Definitions",
  "✏️ Điền vào chỗ trống": "✏️ Fill in the Blanks",
  "💬 Hội thoại & Ngữ cảnh": "💬 Dialogue & Context",
  "Số lượng câu hỏi:": "Number of Questions:",
  "Hình ảnh minh họa:": "Illustrations:",
  "🎨 Hoạt hình / Tranh vẽ (Đẹp cho bé)": "🎨 Cartoon / Illustration (Kid-friendly)",
  "📸 Ảnh chụp thực tế (Sắc nét)": "📸 Realistic Photo (HD)",
  "🚫 Không dùng ảnh (Chỉ chữ)": "🚫 No Images (Text Only)",
  "Tạo Ngay Bằng AI": "Generate with AI",
  "AI đang làm việc...": "AI is working...",
  "AI đang thiết kế câu hỏi trắc nghiệm tiếng Anh...": "AI is designing English multiple-choice questions...",
  "Đang tự động tìm kiếm hình ảnh minh họa cho câu hỏi...": "Automatically searching illustrations for questions...",
  "Hệ thống đang kết nối Gemini AI để tạo câu hỏi chuẩn sư phạm và tìm kiếm hình ảnh minh họa phù hợp...": "Connecting to Gemini AI to craft pedagogical questions and matching illustrations...",
  "Cấu hình lại": "Reconfigure",
  "Quay lại cấu hình": "Back to Configuration",
  "Nội dung câu hỏi (100% tiếng Anh)...": "Question text (100% in English)...",
  "Tự động tạo câu hỏi trắc nghiệm bằng Trí tuệ nhân tạo (AI)": "Auto-generate multiple-choice questions with AI",
  "Tải câu hỏi hàng loạt cho bài tập này": "Bulk upload questions for this exercise",
  "Tải lên nhiều hình ảnh để tự động tạo nhanh các cặp ảnh cho vòng này": "Bulk upload images to quickly create image pairs for this round",
  "Sử dụng AI để tự động tạo toàn bộ các cặp ảnh theo chủ đề": "Use AI to auto-generate image pairs by topic",
  "Thêm ảnh minh họa cho câu hỏi": "Add illustration for question",

  // Teacher Layout & Subpages
  "Bảng điều khiển": "Dashboard",
  "Lớp học": "Classes",
  "Hồ sơ năng lực": "Portfolio",
  "Điều hướng": "Navigation",
  "Thư viện của tôi": "My Library",
  "Tất cả bài học": "All Lessons",
  "Tất cả bài tập": "All Exercises",
  "Ngân hàng câu hỏi": "Question Bank",
  "Gần đây": "Recent",
  "Đã chia sẻ": "Shared",
  "Thùng rác": "Trash",
  "Tìm kiếm bài tập, tài liệu...": "Search exercises, materials...",
  "Trang học tập": "Student Portal",
  "Chuyển sang giao diện học tập của học sinh": "Switch to Student Learning Portal",
  "Đọc tất cả": "Mark all read",
  "Không có thông báo mới": "No new notifications",
  "Xem tất cả": "View all",
  "Giao diện học tập (Học sinh)": "Student Learning View",
  "Cổng Game & Bài tập": "Game & Exercise Studio",
  "Quản lý Portfolio": "Manage Portfolio",
  "Xem Portfolio thực tế": "View Live Portfolio",
  "Cài đặt hệ thống": "System Settings",
  "Trợ giúp & Hướng dẫn": "Help & Tutorials",
  "Đăng xuất": "Sign Out",
};

const VI_TO_EN_PATTERNS: Array<[RegExp, string]> = [
  [/^Vòng\s+(\d+)$/i, "Round $1"],
  [/^Xóa Vòng\s+(\d+)$/i, "Delete Round $1"],
  [/^Chuyển sang Vòng\s+(\d+)$/i, "Move to Round $1"],
  [/^Cặp Ảnh #(\d+)$/i, "Image Pair #$1"],
  [/^Cặp thẻ #(\d+)$/i, "Card Pair #$1"],
  [/^CÂU HỎI #(\d+)$/, "QUESTION #$1"],
  [/^Câu hỏi #?(\d+)$/i, "Question #$1"],
  [/^(\d+)\s+cặp$/i, "$1 pairs"],
  [/^(\d+)\s+câu$/i, "$1 questions"],
  [/^(\d+)\s+thẻ$/i, "$1 cards"],
  [/^\((\d+)\s+Vòng\)$/i, "($1 Rounds)"],
  [/^\((\d+)\s+Chuyến tàu\)$/i, "($1 Trains)"],
  [/^(\d+)\s*\/\s*(\d+)\s+từ$/i, "$1/$2 words"],
  [/^(\d+)\s+từ\s+\((\d+)\s+vòng\)$/i, "$1 words ($2 rounds)"],
  [/^\(tương đương ~(\d+)\s+vòng\)$/i, "(approx. ~$1 rounds)"],
  [/^1 Vòng chơi \(tối đa (\d+) từ\/vòng\)$/i, "1 Round (max $1 words/round)"],
  [/^Tạo cặp thứ (\d+) cho Vòng (\d+)$/i, "Create pair #$1 for Round $2"],
  [/^Tạo toa thứ (\d+) cho Vòng (\d+)$/i, "Create carriage #$1 for Round $2"],
  [/^Đã đủ (\d+)\/(\d+) cặp cho Vòng (\d+)$/i, "Full $1/$2 pairs for Round $3"],
  [/^Đã đủ (\d+)\/(\d+) toa cho Vòng (\d+)$/i, "Full $1/$2 carriages for Round $3"],
  [/^Tạo câu hỏi thứ (\d+) cho Vòng (\d+)$/i, "Create question #$1 for Round $2"],
  [/^Thêm câu thứ (\d+) thủ công$/i, "Add question #$1 manually"],
  [/^Danh Sách Câu Hỏi \((\d+)\/(\d+) câu\)$/i, "Questions List ($1/$2 questions)"],
  [/^Các đáp án \((\d+)\/4\) • Chọn đáp án ĐÚNG:$/i, "Options ($1/4) • Select the CORRECT answer:"],
  [/^Nhập đáp án ([A-D]) \(hỗ trợ câu dài\)\.\.\.$/i, "Enter option $1..."],
  [/^Đáp án ([A-D])\.\.\.$/i, "Option $1..."],
  [/^Bỏ đáp án ([A-D])$/i, "Remove option $1"],
  [/^Bảng Xem Trước (\d+) Câu Hỏi$/i, "Preview $1 Questions"],
  [/^Đã chọn:\s*(\d+)\/(\d+)$/i, "Selected: $1/$2"],
  [/^Dạng Toán Đã Chọn \((\d+)\)$/i, "Selected Math Types ($1)"],
  [/^Ví dụ:\s*(.+)$/i, "Example: $1"],
  [/^Tìm kiếm hình ảnh cho Vế ([AB])$/i, "Search Image for Side $1"],
  [/^Áp Dụng Vào Game \((\d+) câu\)$/i, "Apply to Game ($1 questions)"],
  [/^Xem trước và chỉnh sửa (\d+) câu hỏi trước khi chèn$/i, "Preview and edit $1 questions before inserting"],
  [/^Tối đa (\d+) từ\. Hệ thống tự động chia thành các Vòng chơi \(Mỗi vòng (\d+) từ\)\.$/i, "Max $1 words. Automatically split into Rounds ($2 words per round)."],
  [/^Tối đa (\d+) từ\. Hệ thống tự động chia thành các Chuyến tàu \(Mỗi vòng (\d+) toa tàu\)\.$/i, "Max $1 words. Automatically split into Trains ($2 carriages per round)."],
  [/^Vượt quá 5 từ \((\d+)\/5 từ\)\. Vui lòng rút gọn!$/i, "Exceeds 5 words ($1/5 words). Please shorten!"],
  [/^Phát hiện (\d+) lỗi cần sửa:$/i, "Found $1 errors to fix:"],
];

export function translateTeacherViString(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const exact = VI_TO_EN_EXACT[trimmed];
  if (exact) {
    const leading = raw.match(/^\s*/)?.[0] || "";
    const trailing = raw.match(/\s*$/)?.[0] || "";
    return `${leading}${exact}${trailing}`;
  }

  for (const [regex, replacement] of VI_TO_EN_PATTERNS) {
    if (regex.test(trimmed)) {
      const leading = raw.match(/^\s*/)?.[0] || "";
      const trailing = raw.match(/\s*$/)?.[0] || "";
      return `${leading}${trimmed.replace(regex, replacement)}${trailing}`;
    }
  }

  return null;
}

const origTextNodeMap = new WeakMap<Text, { vi: string; en: string }>();

export function TeacherDomTranslator() {
  const { locale } = useTeacherLocale();

  useEffect(() => {
    if (typeof document === "undefined") return;

    let isApplying = false;

    const processNode = (root: Node) => {
      if (isApplying) return;
      isApplying = true;

      try {
        // 1. Process Element attributes (placeholder, title)
        const elements: Element[] = [];
        if (root.nodeType === Node.ELEMENT_NODE) {
          elements.push(root as Element);
          const descendants = (root as Element).querySelectorAll("[placeholder], [title], input[value]");
          descendants.forEach((el) => elements.push(el));
        }

        for (const el of elements) {
          // Placeholder
          const currentPlaceholder = el.getAttribute("placeholder");
          const origPlaceholder = el.getAttribute("data-vi-placeholder");
          if (locale === "en") {
            const sourceVi = origPlaceholder || currentPlaceholder;
            if (sourceVi) {
              const translated = translateTeacherViString(sourceVi);
              if (translated && currentPlaceholder !== translated) {
                if (!origPlaceholder) el.setAttribute("data-vi-placeholder", sourceVi);
                el.setAttribute("placeholder", translated);
              }
            }
          } else if (locale === "vi" && origPlaceholder) {
            if (currentPlaceholder !== origPlaceholder) {
              el.setAttribute("placeholder", origPlaceholder);
            }
          }

          // Title tooltip
          const currentTitle = el.getAttribute("title");
          const origTitle = el.getAttribute("data-vi-title");
          if (locale === "en") {
            const sourceVi = origTitle || currentTitle;
            if (sourceVi) {
              const translated = translateTeacherViString(sourceVi);
              if (translated && currentTitle !== translated) {
                if (!origTitle) el.setAttribute("data-vi-title", sourceVi);
                el.setAttribute("title", translated);
              }
            }
          } else if (locale === "vi" && origTitle) {
            if (currentTitle !== origTitle) {
              el.setAttribute("title", origTitle);
            }
          }
        }

        // 2. Process Text Nodes
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName;
            if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || parent.isContentEditable) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        });

        let current: Node | null = walker.nextNode();
        while (current) {
          const textNode = current as Text;
          const val = textNode.nodeValue || "";
          const saved = origTextNodeMap.get(textNode);

          if (locale === "en") {
            // If React updated the textNode to a new Vietnamese string, re-translate it
            const sourceVi = saved && val === saved.en ? saved.vi : val;
            const translated = translateTeacherViString(sourceVi);
            if (translated && val !== translated) {
              origTextNodeMap.set(textNode, { vi: sourceVi, en: translated });
              textNode.nodeValue = translated;
            }
          } else if (locale === "vi" && saved) {
            if (val === saved.en && val !== saved.vi) {
              textNode.nodeValue = saved.vi;
            }
          }

          current = walker.nextNode();
        }
      } finally {
        isApplying = false;
      }
    };

    processNode(document.body);

    const observer = new MutationObserver((mutations) => {
      if (isApplying) return;
      for (const m of mutations) {
        if (m.type === "characterData" && m.target) {
          const parent = m.target.parentElement;
          if (parent) processNode(parent);
        } else if (m.type === "childList") {
          m.addedNodes.forEach((n) => {
            if (n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.TEXT_NODE) {
              processNode(n.parentElement || n);
            }
          });
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [locale]);

  return null;
}
