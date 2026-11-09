"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

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
      libraryTitle: "Question Library",
      libraryGlobalTitle: "Global Success Books",
      libraryGlobalSub: "Grade 1–12 sets by Unit",
      myQuestionSetsTitle: "My Question Sets",
      myQuestionSetsSub: "Your saved question sets",
      libraryMatchTitle: "Matching & Flip",
      libraryMatchSub: "Your saved matching & flip sets",
      libraryMathTitle: "Math",
      libraryMathSub: "Your saved math sets",
      libraryFlipTitle: "Flip Cards",
      libraryFlipSub: "Your saved flip card sets",
      libraryQuizTitle: "Multiple Choice",
      libraryQuizSub: "Your saved multiple choice sets",
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
      openGame: "Preview Game",
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
      importFromMyLibrary: "Pick from My Library",
    },
    library: {
      loading: "Loading your question sets from My Library...",
      emptyTitle: "No saved question sets in this category yet",
      emptyDesc: "Every time you create and save a game, its question set is automatically saved here for instant reuse across compatible games!",
      createGameBtn: "Create Game",
      viewEditBtn: "Edit",
      duplicateBtn: "Duplicate",
      deleteBtn: "Delete",
      confirmDelete: 'Are you sure you want to remove "{name}" from My Library?',
      deletedToast: 'Removed "{name}" from My Library!',
      renamedToast: "Question set renamed successfully!",
      duplicatedToast: 'Duplicated "{name}"!',
      savedChangesToast: "Saved question set updates to My Library!",
      saveToLibraryBtn: "Save to My Library",
      copySuffix: "Copy",
      selectGameTitle: "Create a New Game from this Set",
      selectGameDesc: "Choose any compatible game format below. All cards/questions from this set will be pre-filled automatically!",
      viewSetTitle: "Question Set Details & Quick Edit",
      renameLabel: "Question Set Name",
      saveNameBtn: "Save Name",
      saveChangesBtn: "Save Changes",
      editItemHint: "You can edit words/questions directly or remove items below, then click Save Changes.",
      removeItemTooltip: "Remove this item",
      minOneItemWarning: "A question set must keep at least 1 item!",
      compatibleNote: "Compatible with both Matching & Flip Card games",
      importModalTitle: "Import from My Library",
      importModalSubtitle: "Select a saved question set to load into your current game",
      replaceBtn: "Replace Current",
      appendBtn: "Append to Current",
      importedToast: 'Imported "{name}" from My Library!',
      searchPlaceholder: "Search question sets...",
      allSubTypes: "All Formats",
      imageTextBadge: "Image - Word",
      imageImageBadge: "Image - Image",
      textTextBadge: "Word - Word",
      quizBadge: "Multiple Choice",
      choiceBadge: "Math / Fast Choice",
      viewBtn: "View",
      customizeBtn: "Clone to My Questions",
      customizeTooltip: "Clone a copy to My Question Sets and open editor",
      mySetsTab: "My Saved Sets",
      globalSuccessTab: "Global Success Books",
      gradeLabel: "Grade",
      allUnits: "All Units",
      comingSoonGradeTitle: "Global Success Grade {grade} is being updated",
      comingSoonGradeDesc: "Question sets for Grade {grade} units are being prepared. Select Grade 3 to explore ready-to-play units!",
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
      libraryTitle: "Thư viện Câu hỏi",
      libraryGlobalTitle: "Sách Global Success",
      libraryGlobalSub: "Bộ câu hỏi Lớp 1–12 theo Unit",
      myQuestionSetsTitle: "Bộ câu hỏi của tôi",
      myQuestionSetsSub: "Các bộ câu hỏi bạn đã tạo",
      libraryMatchTitle: "Ghép cặp & Lật thẻ",
      libraryMatchSub: "Bộ câu hỏi ghép cặp & lật thẻ của bạn",
      libraryMathTitle: "Toán học",
      libraryMathSub: "Bộ câu hỏi toán học của bạn",
      libraryFlipTitle: "Lật thẻ",
      libraryFlipSub: "Bộ câu hỏi lật thẻ của bạn",
      libraryQuizTitle: "Trắc nghiệm",
      libraryQuizSub: "Bộ câu hỏi trắc nghiệm của bạn",
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
      openGame: "Xem trước game",
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
      importFromMyLibrary: "Chọn từ My Library",
    },
    library: {
      loading: "Đang tải các bộ câu hỏi từ Thư viện của bạn...",
      emptyTitle: "Chưa có bộ câu hỏi nào trong danh mục này",
      emptyDesc: "Mỗi khi bạn tạo và lưu một trò chơi mới, bộ câu hỏi sẽ được tự động lưu vào đây để bạn tái sử dụng cho các trò chơi tương thích khác!",
      createGameBtn: "Tạo Game",
      viewEditBtn: "Sửa",
      duplicateBtn: "Nhân bản",
      deleteBtn: "Xóa",
      confirmDelete: 'Bạn có chắc muốn xóa bộ câu hỏi "{name}" khỏi Thư viện của tôi?',
      deletedToast: 'Đã xóa "{name}" khỏi Thư viện!',
      renamedToast: "Đã đổi tên bộ câu hỏi thành công!",
      duplicatedToast: 'Đã nhân bản "{name}"!',
      savedChangesToast: "Đã lưu cập nhật bộ câu hỏi vào My Library!",
      saveToLibraryBtn: "Lưu vào My Library",
      copySuffix: "Bản sao",
      selectGameTitle: "Tạo Trò chơi Mới từ Bộ câu hỏi này",
      selectGameDesc: "Chọn một dạng trò chơi tương thích bên dưới. Toàn bộ câu hỏi/cặp thẻ sẽ được tự động điền sẵn!",
      viewSetTitle: "Chi tiết & Chỉnh sửa Bộ câu hỏi",
      renameLabel: "Tên bộ câu hỏi",
      saveNameBtn: "Lưu tên mới",
      saveChangesBtn: "Lưu thay đổi",
      editItemHint: "Bạn có thể sửa chữ/câu hỏi trực tiếp hoặc xóa bớt các mục bên dưới, sau đó bấm Lưu thay đổi.",
      removeItemTooltip: "Xóa mục này",
      minOneItemWarning: "Bộ câu hỏi phải giữ lại ít nhất 1 mục!",
      compatibleNote: "Tương thích dùng chung cho cả game Nối cặp & Lật ảnh",
      importModalTitle: "Chọn bộ câu hỏi từ My Library",
      importModalSubtitle: "Chọn một bộ câu hỏi đã lưu để nạp nhanh vào trò chơi đang tạo",
      replaceBtn: "Thay thế hiện tại",
      appendBtn: "Cộng gộp thêm",
      importedToast: 'Đã nạp bộ câu hỏi "{name}" từ My Library!',
      searchPlaceholder: "Tìm tên bộ câu hỏi...",
      allSubTypes: "Tất cả định dạng",
      imageTextBadge: "Ảnh - Chữ",
      imageImageBadge: "Ảnh - Ảnh",
      textTextBadge: "Chữ - Chữ",
      quizBadge: "Trắc nghiệm 4 đáp án",
      choiceBadge: "Toán học / Chọn nhanh",
      viewBtn: "Xem",
      customizeBtn: "Sao chép về Bộ câu hỏi của tôi",
      customizeTooltip: "Tạo bản sao về Bộ câu hỏi của tôi và mở trang chỉnh sửa",
      mySetsTab: "Bộ của tôi",
      globalSuccessTab: "Sách Global Success",
      gradeLabel: "Lớp",
      allUnits: "Tất cả Unit",
      comingSoonGradeTitle: "Sách Global Success Lớp {grade} đang được cập nhật",
      comingSoonGradeDesc: "Các bộ câu hỏi theo từng Unit của Lớp {grade} đang được biên soạn. Bạn hãy chọn Lớp 3 để sử dụng ngay nhé!",
    },
  },
} as const;

export function getStoredTeacherLocale(): TeacherLocale {
  if (typeof window === "undefined") return "en";
  try {
    const urlLang = new URLSearchParams(window.location.search).get("lang")?.toLowerCase();
    if (urlLang === "vi" || urlLang === "en") {
      localStorage.setItem("preferred-locale", urlLang);
      document.cookie = `NEXT_LOCALE=${urlLang};path=/;max-age=31536000;SameSite=Lax`;
      return urlLang;
    }
  } catch {}
  const saved = localStorage.getItem("preferred-locale");
  if (saved === "vi" || saved === "en") return saved;
  const match = document.cookie.match(/(^| )NEXT_LOCALE=([^;]+)/);
  if (match && (match[2] === "vi" || match[2] === "en")) {
    return match[2] as TeacherLocale;
  }
  return "en";
}

export function withLangParam(rawUrl: string, locale: TeacherLocale): string {
  if (!rawUrl) return rawUrl;
  try {
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      const u = new URL(rawUrl);
      u.searchParams.set("lang", locale);
      return u.toString();
    }
    const [pathAndQuery, hash] = rawUrl.split("#");
    const [pathname, query = ""] = pathAndQuery.split("?");
    const params = new URLSearchParams(query);
    params.set("lang", locale);
    const qs = params.toString();
    return `${pathname}${qs ? `?${qs}` : ""}${hash ? `#${hash}` : ""}`;
  } catch {
    const sep = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${sep}lang=${locale}`;
  }
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
  "Nối Cặp Chữ - Chữ": "Match Text - Text",
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
  "Bài tập Đập Trứng Toán học": "Math Egg Smash Exercise",
  "Bài tập Bắn súng Toán học": "Math Space Shooter Exercise",
  "Chơi thử Bài tập Bắn súng Toán học": "Test Play Math Space Shooter",
  "Ảnh - Chữ": "Image - Word",
  "Ảnh - Ảnh": "Image - Image",
  "Chữ - Chữ": "Text - Text",
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
  "Tạo mới Game Nối Cặp Chữ - Chữ": "Create Match Text - Text Game",
  "Chỉnh sửa Game Nối Cặp Chữ - Chữ": "Edit Match Text - Text Game",
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
  "• Tạo bài tập ghép 2 hình ảnh": "• Create a 2-image matching exercise",
  "• Tạo bài tập ghép 2 hình ảnh tương ứng": "• Create a matching image pairs exercise",
  "• Tạo bài tập ghép từ vựng, nghĩa & định nghĩa": "• Create a vocabulary & definition matching exercise",
  "• Tạo bài tập trắc nghiệm 4 đáp án Xứ sở Kẹo": "• Create a 4-option multiple choice quiz in Candy World",
  "• Tạo bài tập trắc nghiệm mở ô bản đồ Kho Báu": "• Create a pirate map treasure hunt multiple choice quiz",
  "• Tạo bài tập trắc nghiệm Bản đồ Kho báu": "• Create a pirate map treasure hunt multiple choice quiz",
  "• Tạo bài tập trắc nghiệm Bắn súng Neon không gian": "• Create a Neon Space Shooter multiple choice quiz",
  "Hệ thống tự động sinh câu hỏi theo các dạng toán được chọn": "Automatically generates math questions from selected math types",
  "Hệ thống tự động sinh câu hỏi đập trứng theo các dạng toán được chọn": "Automatically generates egg-smash math questions from selected math types",

  // Split JSX Text Fragments (around {expressions})
  "Cặp Ảnh #": "Image Pair #",
  "Cặp Chữ #": "Text Pair #",
  "Cặp thẻ #": "Card Pair #",
  "CÂU HỎI #": "QUESTION #",
  "Các đáp án (": "Options (",
  "/4) • Chọn đáp án ĐÚNG:": "/4) • Select the CORRECT answer:",
  "Danh Sách Câu Hỏi (": "Questions List (",
  "câu)": "questions)",
  "câu": "questions",
  "cặp": "pairs",
  "thẻ": "cards",
  "từ": "words",
  "/5 từ": "/5 words",
  "/12 từ": "/12 words",
  "Vượt quá 5 từ (": "Exceeds 5 words (",
  "/5 từ). Vui lòng rút gọn!": "/5 words). Please shorten!",
  "Vế A vượt quá 12 từ (Hiện tại:": "Side A exceeds 12 words (Current:",
  "Vế B vượt quá 12 từ (Hiện tại:": "Side B exceeds 12 words (Current:",
  "từ). Vui lòng rút gọn!": "words). Please shorten!",
  "Chuyển sang": "Move to",
  "Tìm kiếm hình ảnh cho Vế": "Search Image for Side",
  "Vế A": "Side A",
  "Vế B": "Side B",
  "Vòng": "Rounds",
  "Vòng)": "Rounds)",
  "Vòng chơi": "Rounds",
  "Chuyến tàu": "Trains",
  "Chuyến tàu)": "Trains)",
  "Tự động tạo": "Auto-create",
  "từ vựng vừa nhập.": "entered words.",
  "cặp chữ vừa nhập.": "entered text pairs.",
  "Tạo câu hỏi thứ": "Create question",
  "Đặt dấu": "Place",
  "trước đáp án đúng (ví dụ:": "before the correct answer (e.g.,",
  "Phát hiện": "Found",
  "lỗi cần sửa:": "errors to fix:",
  "Đã chọn:": "Selected:",
  "Ví dụ:": "Example:",
  "Dạng Toán Đã Chọn (": "Selected Math Types (",
  "Bảng Xem Trước": "Preview",
  "Câu Hỏi": "Questions",
  "Thêm câu thứ": "Add question #",
  "thủ công": "manually",

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
  "VD: Từ vựng Tiếng Anh ↔ Nghĩa tiếng Việt Bài 1...": "E.g., English Vocabulary ↔ Definitions Unit 1...",
  "VD: Con mèo / Quả táo / Xinh đẹp...": "E.g., Cat / Apple / Beautiful...",
  "2. Danh sách các cặp thẻ Nối (Ảnh - Chữ)": "2. Matching Card Pairs (Image - Word)",
  "2. Danh sách các cặp thẻ Băng Chuyền (Ảnh - Chữ)": "2. Conveyor Belt Card Pairs (Image - Word)",
  "2. Danh sách các cặp thẻ Lật (Ảnh - Chữ)": "2. Flip Card Pairs (Image - Word)",
  "2. Danh sách các cặp thẻ (Chữ - Chữ)": "2. Matching Card Pairs (Text - Text)",

  // Audio / Toolbar / Round Tabs / Card Controls
  "Hệ thống tự đọc": "Auto TTS Voice",
  "Tải lên Audio": "Upload Audio",
  "Không đọc": "No Audio",
  "Hệ thống tự phát âm (AI)": "AI Auto-Pronunciation",
  "Tự động đọc to từ/cụm từ tiếng Anh bằng giọng chuẩn khi học sinh lật hoặc ghép thẻ, không cần tải file âm thanh.": "Automatically reads the English word/phrase aloud when students flip or match a card. No audio file needed.",
  "Tự tải file âm thanh": "Custom Audio File",
  "Cho phép bạn tự tải lên file thu âm giọng đọc hoặc âm thanh riêng (MP3/WAV) cho từng thẻ.": "Upload your own MP3/WAV voice recording or sound effect for each card.",
  "Tắt giọng đọc thẻ": "Silent Card Mode",
  "Thẻ chỉ hiển thị hình ảnh và chữ, không phát giọng đọc từ vựng khi học sinh bấm vào.": "Cards will only display images and text without speaking the words aloud.",
  "Tạo bằng AI": "Create with AI",
  "Nhập nhanh nhiều từ": "Bulk Add Words",
  "Dán danh sách hàng loạt": "Bulk Paste List",
  "Dán danh sách cặp chữ hàng loạt": "Bulk Paste Text Pairs",
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
  "15 cặp thẻ": "15 card pairs",
  "để Học sinh nối trực quan không bị rối mắt. Khi Học sinh nối hết toàn bộ thẻ của Vòng 1, game sẽ tự động chuyển tiếp sang Vòng 2!": "for a clean visual layout. When students finish Round 1, the game automatically advances to Round 2!",
  "để Học sinh lật ghép không bị rối mắt. Khi Học sinh hoàn thành Vòng 1, game sẽ tự động chuyển tiếp sang Vòng 2!": "for a clean memory board. When students finish Round 1, the game automatically advances to Round 2!",
  "để Học sinh quan sát băng chuyền không bị rối mắt. Khi Học sinh thả hết toàn bộ khối của Vòng 1, game sẽ tự động chuyển tiếp sang Vòng 2!": "for a clear conveyor view. When students finish Round 1, the game automatically advances to Round 2!",
  "để Học sinh thả trực quan không bị rối mắt. Khi Học sinh hoàn thành hết toàn bộ thẻ của Vòng 1, game sẽ tự động chuyển tiếp sang Vòng 2!": "for a clear conveyor view. When students complete Round 1, the game automatically advances to Round 2!",
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
  "Đang tải dữ liệu bài tập Lật Ảnh-Ảnh...": "Loading Flip Image - Image exercise data...",
  "Đang tải dữ liệu bài tập Nối Cặp...": "Loading Matching exercise data...",
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
  "Ghi chú": "Note",
  ": Mỗi dòng là 1 cặp (ngăn cách bởi dấu": ": One pair per line (separated by",
  "hoặc phím": "or",
  "Số cặp nhận diện:": "Detected pairs:",
  "Vượt quá tối đa 70 cặp!": "Exceeds maximum of 70 pairs!",
  "Phân tích & Tự động tạo Vòng": "Parse & Auto-Create Rounds",
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
  "Nhập từ khóa tiếng Anh hoặc tiếng Việt (VD: ship, treasure, island...)": "Enter keyword in English (e.g., ship, treasure, island...)",
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
  "Nhập từ khóa tiếng Anh và nhấn": "Enter an English keyword and click",
  "để xem gợi ý ảnh đẹp!": "to see image suggestions!",
  "Tải Câu Hỏi Hàng Loạt": "Bulk Upload Questions",
  "Dán danh sách câu hỏi văn bản nhanh chóng": "Paste your list of questions in text format",
  "📋 Dán nội dung mẫu": "📋 Paste Sample Format",
  "Khung nhập văn bản:": "Text Input:",
  "Xóa trắng": "Clear all",
  'Sửa trực tiếp trong khung trên rồi bấm lại "Áp dụng"': 'Edit directly in the box above and click "Apply" again',
  "Áp dụng": "Apply",
  "Áp dụng vào bài tập": "Apply to Exercise",
  "Không tìm thấy nội dung câu hỏi nào trong văn bản! Vui lòng nhập theo định dạng mẫu.": "No questions found in text! Please follow the sample format.",
  "Thông báo": "Notice",
  "Cần hoàn thiện thông tin bài tập": "Incomplete Exercise Information",
  "Đã hiểu": "Got it",
  "Đồng ý, tôi sẽ kiểm tra": "OK, I'll check",
  "Đồng ý, tôi sẽ kiểm tra lại": "OK, I'll check again",
  "Cảnh báo rời khỏi trang": "Leave Page Warning",
  "Thay đổi chưa được lưu": "Unsaved changes",
  "Thoát khỏi trang tạo bài tập?": "Leave exercise creator?",
  "Bạn chưa lưu các thay đổi của bài tập này. Nếu rời khỏi trang bây giờ, toàn bộ thông tin vừa nhập sẽ bị mất.": "You have unsaved changes in this exercise. If you leave now, your changes will be lost.",
  "Bạn có dữ liệu chưa lưu. Nếu thoát bây giờ, các cặp ảnh vừa soạn sẽ bị mất.": "You have unsaved changes. If you leave now, your image pairs will be lost.",
  "Bạn có dữ liệu chưa lưu. Nếu thoát bây giờ, các cặp chữ vừa soạn sẽ bị mất.": "You have unsaved changes. If you leave now, your text pairs will be lost.",
  "Hủy, ở lại trang": "Stay on Page",
  "Ở lại tiếp tục": "Stay & Continue",
  "Rời khỏi trang": "Leave Page",
  "Thoát không lưu": "Leave Without Saving",

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
  "Đang xử lý và tạo âm thanh bài tập...": "Processing and generating exercise audio...",
  "Đang xử lý và tải lên file âm thanh...": "Processing and uploading audio files...",
  "Đang xử lý và lưu bài tập...": "Processing and saving exercise...",
  "Không thể lưu bài tập!": "Failed to save exercise!",
  "Đã xảy ra lỗi khi lưu bài tập!": "An error occurred while saving the exercise!",
  "Bài tập cần ít nhất 1 Vòng chơi!": "Exercise requires at least 1 Round!",
  "Bài tập cần ít nhất 1 cặp thẻ!": "Exercise requires at least 1 card pair!",
  "Apple - Quả táo\nBanana - Quả chuối\nCat - Con mèo\nDog - Con chó...": "Apple - Quả táo\nBanana - Quả chuối\nCat - Con mèo\nDog - Con chó...",

  // --- AutoGenerateTopicModal & AutoGenerateCandyQuizModal split fragments ---
  "Hỗ trợ chụp màn hình và nhấn": "Supports screenshots — press",
  "· Tối đa 10MB": "· Max 10MB",
  "1 Vòng chơi (tối đa": "1 Round (max",
  "từ/vòng)": "words/round)",
  "từ (": "words (",
  "vòng)": "rounds)",
  "(tương đương ~": "(approx. ~",
  "AI sẽ tự động gán": "AI automatically assigns",
  "Tranh vẽ hoạt hình (Cartoon) cho Vế A": "Cartoon Illustration to Side A",
  "và": "and",
  "Ảnh chụp thực tế (Realistic) cho Vế B": "Realistic Photo to Side B",
  "để học sinh tìm ghép cặp tương ứng.": "for students to match pairs.",
  "Đóng modal": "Close modal",
  "Nguồn tạo thẻ": "Card generation source",
  "Ảnh phân tích": "Analyzed image",
  "Vui lòng tải lên file định dạng hình ảnh hợp lệ!": "Please upload a valid image file!",
  "Dung lượng ảnh quá lớn (tối đa 10MB)!": "Image size is too large (max 10MB)!",
  "Đã nhận ảnh từ Clipboard! Đang phân tích...": "Image pasted from Clipboard! Analyzing...",
  "Lỗi khi gửi ảnh lên AI phân tích.": "Failed to send image for AI analysis.",
  "Không thể nhận diện chủ đề từ ảnh. Bạn có thể tự gõ chủ đề bên dưới.": "Could not detect a topic from the image. You can type the topic below.",
  "Vui lòng nhập chủ đề từ vựng hoặc tải ảnh để AI phân tích.": "Please enter a vocabulary topic or upload an image for AI analysis.",
  "Số lượng từ hợp lệ từ 1 đến 70 từ.": "Valid word count is between 1 and 70 words.",
  "AI không thể tạo từ vựng cho chủ đề này. Vui lòng thử lại!": "AI could not generate vocabulary for this topic. Please try again!",
  "Đã xảy ra lỗi trong quá trình tạo.": "An error occurred during generation.",
  "Thầy/cô có thể": "You can",
  "chỉnh sửa câu hỏi, đáp án hoặc click chọn lại đáp án đúng": "edit questions, options, or click to change the correct answer",
  "trước khi áp dụng vào game.": "before applying to the game.",
  "Áp Dụng Vào Game (": "Apply to Game (",

  // --- Preview Modals (MatchGamePreviewModal & MatchTextTextPreviewModal) ---
  "Xem trước bài tập Nối Cặp": "Preview Matching Exercise",
  "Xuất sắc! Đã nối thành công tất cả cặp thẻ": "Excellent! All card pairs matched!",
  "Học sinh sẽ nhận được điểm và phần thưởng sau khi hoàn tất các cặp nối này.": "Students will earn points and rewards upon completing these pairs.",
  "1. Từ vựng (Click chọn)": "1. Vocabulary (Click to select)",
  "2. Hình ảnh tương ứng (Click chọn)": "2. Matching Image (Click to select)",
  "Chế độ Chữ - Chữ (Nối Dây)": "Word - Word Mode (Line Match)",
  "Xuất Sắc! Đã Nối Hoàn Thành!": "Excellent! Matching Completed!",
  "Tất cả các vế A và B đã được nối chính xác.": "All Side A and Side B items have been matched accurately.",
  "Thử lại từ đầu": "Play Again",
  "Hàng A (Kéo hoặc Chạm ô để nối)": "Row A (Drag or tap to connect)",
  "Hoàn thành": "Completed",
  "Hàng B (Kết quả xáo trộn)": "Row B (Shuffled matches)",
  "Chính xác!": "Correct!",

  // --- ForcedLandscapeWrapper & GameStartOverlay ---
  "Thoát Game": "Exit Game",
  "Thoát game": "Exit Game",
  "Thoát": "Exit",
  "Quay về": "Back",
  "Quay về Trang chủ": "Back to Home",
  "Quay về bài tập": "Back to Exercises",
  "Danh sách bài tập": "Exercises List",
  "Đổi chiều xoay màn hình (90° / -90°)": "Flip screen rotation (90° / -90°)",
  "Đổi chiều (90°)": "Rotate (90°)",
  "Đổi chiều (-90°)": "Rotate (-90°)",
  "Đổi chiều (": "Rotate (",
  "Thu nhỏ": "Exit Fullscreen",
  "Toàn màn hình": "Fullscreen",
  "BẮT ĐẦU CHƠI": "START GAME",
  "Sẵn sàng rèn luyện phản xạ và tiếng Anh cùng Dolcake!": "Get ready to practice reflexes and English with Dolcake!",
  "Trắc Nghiệm Kẹo Ngọt": "Candy World Quiz",
  "Truy Tìm Kho Báu": "Mystery Treasure Hunt",
  "Đập Trứng Chọn Đáp Án": "Math Egg Smash",
  "Lật Thẻ Trí Nhớ Đại Dương": "Ocean Memory Flip",
  "Đoàn Tàu Từ Vựng": "Vocabulary Train",
  "Cây Phép Thuật Nối Từ": "Magic Tree Cut the Rope",
  "Cây Phép Thuật Cắt Dây Nối Từ": "Magic Tree Cut the Rope",
  "Nối Từ Vựng Tương Tác": "Interactive Vocabulary Match",
  "Nối Thẻ Bài Tương Tác": "Interactive Card Match",
  "Nối Chữ Thần Tốc": "Speed Word Match",
  "Game Nối Chữ - Chữ": "Word - Word Match Game",
  "Bé 2-5 tuổi": "Ages 2-5",
  "Lớp 1-5": "Grades 1-5",
  "câu hỏi": "questions",

  // --- Game Wrapper Loading & Error States ---
  "Đang tải trò chơi Nối Cặp...": "Loading Matching Game...",
  "Đang tải trò chơi Nối Chữ...": "Loading Word Match Game...",
  "Đang nạp bài tập...": "Loading Exercise...",
  "Đang nạp Game Cắt Dây...": "Loading Cut the Rope Game...",
  "Đang chuẩn bị chuyến tàu từ vựng...": "Preparing Vocabulary Train...",
  "Vui lòng đợi các toa tàu và hình ảnh nạp xong": "Please wait while carriages and images load",
  "ĐANG NẠP THẾ GIỚI KẸO...": "LOADING CANDY WORLD...",
  "Đang chuẩn bị...": "Preparing...",
  "Đang nạp Game Đập Trứng...": "Loading Egg Smash Game...",
  "Đang tải game Neon Math Shooter...": "Loading Neon Math Shooter...",
  "Đang nạp dữ liệu Bắn súng Trắc nghiệm...": "Loading Space Shooter Quiz...",
  "Đang khởi tạo...": "Initializing...",
  "Không tìm thấy bài tập!": "Exercise Not Found!",
  "Không thể tải bài tập!": "Could Not Load Exercise!",
  "Không tìm thấy bài tập Bắn súng Trắc nghiệm!": "Space Shooter Quiz Not Found!",
  "Lỗi hệ thống khi tải bài tập!": "System error while loading exercise!",
  "Dữ liệu bài tập không tồn tại hoặc đã bị xóa.": "Exercise data does not exist or has been deleted.",
  "Bài tập này chưa có câu hỏi nào hợp lệ để chơi!": "This exercise has no valid questions to play!",
  "Mã bài tập \"": "Exercise code \"",
  "\" không tồn tại hoặc đã bị xóa. Vui lòng kiểm tra lại đường link.": "\" does not exist or has been deleted. Please check the link.",
  "Bắn súng Trắc nghiệm (Bản Mẫu)": "Space Shooter Quiz (Demo)",
  "Chọn đáp án chính xác:": "Choose the correct answer:",

  // --- SciFiNeonShooterGame ---
  "Điểm Số": "Score",
  "Xoay ngang màn hình để chơi đã mắt nhất!": "Rotate your device to landscape for the best experience!",
  "HOÀN THÀNH!": "COMPLETED!",
  "TỔNG ĐIỂM ĐẠT ĐƯỢC": "TOTAL SCORE",
  "CHƠI LẠI": "PLAY AGAIN",
  "Chơi lại": "Play Again",
  "Chơi lại từ đầu": "Play Again",
  "Chơi lại từ đầu 🔄": "Play Again 🔄",
  "🔄 CHƠI LẠI TỪ ĐẦU": "🔄 PLAY AGAIN",
  "BỎ LỠ! -5": "MISS! -5",
  "LỖI! -5": "WRONG! -5",
  "Bật âm thanh": "Unmute",
  "Tắt âm thanh": "Mute",

  // --- Memory Flip Game (src/app/game/memory-flip/page.tsx) ---
  "Đang tải bài tập Lật Ảnh...": "Loading Flip Card Exercise...",
  "Ghép Hình Đại Dương": "Ocean Memory Flip",
  "Game Lật Ảnh": "Memory Flip Game",
  "Ghép Hình": "Ocean",
  "Đại Dương": "Memory Flip",
  "Thời gian": "Time",
  "Lượt lật": "Flips",
  "Lượt": "Flips",
  "Cặp thẻ": "Pairs",
  "Vòng chơi ": "Round ",
  "Âm thanh": "Sound",
  "XUẤT SẮC! 🎉": "EXCELLENT! 🎉",
  "Đã hoàn thành": "Completed",
  "Tự động chuyển sang Vòng tiếp theo sau": "Advancing to the next Round in",
  "Tiếp tục ngay": "Continue Now",
  "CHIẾN THẮNG! 🏆": "VICTORY! 🏆",
  "Chúc mừng bạn đã hoàn thành tất cả các Vòng của": "Congratulations on completing all Rounds of",
  "TỔNG THỜI GIAN": "TOTAL TIME",
  "TỔNG LƯỢT LẬT": "TOTAL FLIPS",
  "Ảnh lỗi - Hiển thị chữ": "Image fallback - Text shown",

  // --- Treasure Hunt Game (src/app/game/treasure-grid/page.tsx) ---
  "Đang nạp bản đồ kho báu...": "Loading Treasure Map...",
  "Vui lòng chờ trong giây lát": "Please wait a moment",
  "Vòng ": "Round ",
  "🔍 Phóng to": "🔍 Zoom In",
  "Phóng to": "Zoom In",
  "Phóng to ảnh": "Zoom Image",
  "Nhấn để phóng to ảnh": "Click to zoom image",
  "Bấm để phóng to ảnh": "Click to zoom image",
  "Đóng phóng to (ESC)": "Close zoom (ESC)",
  "Đóng phóng to": "Close zoom",
  "CHÍNH XÁC!": "CORRECT!",
  "Ô số": "Tile #",
  "đã được giải thoát thành công! 🌟": "has been rescued! 🌟",
  "Bấm vào ô trên bàn cờ để trả lời câu hỏi chính nhé!": "Click the tile on the board to answer the main question!",
  "Tiếc quá!": "Too Bad!",
  "Chưa giải cứu được ô số": "Could not rescue Tile #",
  "Ô tiếp tục bị khoá. Nhường cơ hội cho bạn khác ở lượt sau!": "The tile remains locked. Another student can try on the next turn!",
  "THỬ THÁCH GIẢI CỨU Ô SỐ": "RESCUE CHALLENGE — TILE #",
  "Trả lời": "Answer",
  "ĐÚNG": "CORRECTLY",
  "câu hỏi này để giải cứu ô số": "this question to rescue Tile #",
  "trở lại bàn cờ!": "back onto the board!",
  "VÀO GIẢI CỨU NGAY": "START RESCUE NOW",
  "🎉 MỞ KHÓA LINH VẬT VÒNG": "🎉 UNLOCKED ROUND MASCOT",
  "đã gia nhập bộ sưu tập của bạn! ⭐": "has joined your collection! ⭐",
  "🎉 HOÀN THÀNH": "🎉 COMPLETED",
  "✨ LINH VẬT VỪA MỞ KHÓA ✨": "✨ MASCOT UNLOCKED ✨",
  "SANG VÒNG": "NEXT ROUND",
  "CHIẾN THẮNG": "VICTORY",
  "Chúc mừng bạn đã chinh phục toàn bộ kho báu hải tặc!": "Congratulations! You conquered all the pirate treasures!",
  "🌟 BỘ SƯU TẬP LINH VẬT CỦA BẠN (": "🌟 YOUR MASCOT COLLECTION (",
  "BẢO VẬT) 🌟": "TREASURES) 🌟",
  "Thùng vàng kho báu (Bấm để nghe tiếng vàng)": "Gold Barrel (Click for coin sound)",
  "Thùng vàng": "Gold Barrel",
  "Đang chơi": "Playing",
  "Chưa mở khóa": "Locked",
  "Đang chinh phục": "In Progress",
  "Rương Kho Báu Thần Kỳ (Bấm để nghe âm thanh)": "Magic Treasure Chest (Click for sound)",
  "Rương kho báu": "Treasure Chest",
  "Bé Cua": "Baby Crab",
  "Bé Cua (Bấm để nghe tiếng kêu)": "Baby Crab (Click for sound)",
  "Đóng / Quay lại bàn cờ": "Close / Back to Board",
  "Đóng thông báo giải cứu": "Close rescue notice",
  // Treasure Hunt Mascots
  "Bé Rồng Giữ Vàng": "Gold Guardian Dragon",
  "Thần Hộ Mệnh Long Tộc": "Dragon Clan Guardian",
  "Dũng Cảm & Cao Quý": "Brave & Noble",
  "Chú Vẹt Hải Tặc": "Pirate Parrot",
  "Hoa Tiêu Biển Cả": "Ocean Navigator",
  "Thông Thái & Nhanh Nhẹn": "Wise & Agile",
  "Bé Rùa Biển Vàng": "Golden Sea Turtle",
  "Thần Hộ Mệnh Trầm Lặng": "Silent Guardian",
  "Bình An & Kiên Trì": "Peaceful & Steadfast",
  "Bé Cua Ngọc Bích": "Jade Baby Crab",
  "Chiến Binh Càng Vàng": "Golden Claw Warrior",
  "Khéo Léo & Tinh Anh": "Clever & Sharp",
  "Slime Hoàng Kim": "Golden Slime",
  "Tinh Linh Biển Sâu": "Deep Sea Spirit",
  "Đáng Yêu & Diệu Kỳ": "Lovely & Magical",
  "Rái Cá Thủy Thủ": "Sailor Otter",
  "Thợ Lặn Đại Dương": "Ocean Diver",
  "Chăm Chỉ & Tinh Nghịch": "Diligent & Playful",
  "Cá Heo Hoàng Gia": "Royal Dolphin",
  "Sứ Giả Biển Xanh": "Blue Sea Messenger",
  "Thân Thiện & Hòa Bình": "Friendly & Peaceful",
  "Cánh Cụt Thám Hiểm": "Explorer Penguin",
  "Nhà Thám Hiểm Băng Giá": "Ice Explorer",
  "Bền Bỉ & Quyết Đoán": "Persistent & Bold",
  "Thỏ Con Phiêu Lưu": "Adventure Bunny",
  "Sứ Giả Tốc Độ": "Speed Messenger",
  "Nhanh Nhẹn & Hoạt Bát": "Fast & Energetic",
  "Gấu Mèo Bản Đồ": "Map Raccoon",
  "Chuyên Gia Dẫn Đường": "Pathfinder Expert",
  "Sắc Sảo & Tỉ Mỉ": "Sharp & Careful",
  "Mèo Con Cướp Biển": "Pirate Kitty",
  "Thuyền Trưởng Tí Hon": "Tiny Captain",
  "Dũng Cảm & Đáng Yêu": "Brave & Cute",
  "Bạch Tuộc Xúc Tu Vàng": "Golden Tentacle Octopus",
  "Chúa Tể Vực Sâu": "Lord of the Deep",
  "Uy Quyền & Huyền Bí": "Mighty & Mysterious",
  "Cá Mập Đại Dương": "Ocean Shark",
  "Dũng Sĩ Biển Cả": "Sea Warrior",
  "Mạnh Mẽ & Kiên Cường": "Strong & Resilient",
  "Cừu Sừng Vàng": "Golden Horn Sheep",
  "Thần Hộ Mệnh Núi Đá": "Rock Mountain Guardian",
  "Vững Vàng & Trung Kiên": "Steady & Loyal",
  "Bé Khỉ Giữ Khóa": "Keykeeper Monkey",
  "Thần Hộ Vệ Kho Báu": "Treasure Protector",
  "Thông Minh & Hài Hước": "Smart & Funny",
  "Cú Mèo Thông Thái": "Wise Owl",
  "Bậc Thầy Chiến Thuật": "Tactical Master",
  "Tri Thức & Sáng Suốt": "Knowledgeable & Bright",
  "Cáo Đỏ Thám Hiểm": "Explorer Red Fox",
  "Trinh Sát Rừng Xanh": "Forest Scout",
  "Mưu Trí & Nhạy Bén": "Clever & Keen",
  "Hải Cẩu Ngọc Bích": "Jade Seal",
  "Thần Hộ Vệ Băng Tuyết": "Snow Guardian",
  "Hiền Hòa & May Mắn": "Gentle & Lucky",
  "Cá Ngựa Hoàng Triều": "Royal Seahorse",
  "Kỵ Sĩ San Hô": "Coral Knight",
  "Quý Phái & Trung Thành": "Noble & Faithful",
  "Bé Sao Biển Lấp Lánh": "Sparkling Starfish",
  "Ngôi Sao Diệu Kỳ": "Wonder Star",
  "Tỏa Sáng & Diệu Kỳ": "Shining & Magical",

  // --- HTML5 Iframe Games (public/games/*) ---
  // 1. candy-grammar-sugar-jelly
  "Câu": "Q",
  "Tự chuyển câu": "Auto Next",
  "Tự chuyển câu: BẬT": "Auto Next: ON",
  "Tự chuyển câu: TẮT": "Auto Next: OFF",
  "Chạm vào bảng đáp án đúng nhé!": "Tap the correct answer board!",
  "Sugar Burst! Chính xác! 🍬✨": "Sugar Burst! Correct! 🍬✨",
  "Jelly Wobble! Chưa đúng, thử lại nhé!": "Jelly Wobble! Not quite, try again!",
  "Vòng tiếp theo ➔": "Next Round ➔",
  "Câu tiếp ➔": "Next ➔",
  "Chiến Thắng!": "Victory!",
  "Tuyệt đỉnh! Bé đã xuất sắc hoàn thành tất cả các câu hỏi của bài tập!": "Awesome! You have completed all questions in this exercise!",
  "Thế giới kẹo ngọt đang chuẩn bị câu hỏi cho bé nhé!": "Candy World is preparing your questions!",
  "Tạm Dừng": "Paused",
  "Tạm dừng": "Paused",
  "TẠM DỪNG": "PAUSED",
  "Nhấn “Chơi tiếp” để quay lại Candy Land.": "Press “Resume” to return to Candy Land.",
  "Chơi tiếp ▶": "Resume ▶",
  "Chạm ra ngoài hoặc bấm dấu ✕ để đóng": "Tap outside or press ✕ to close",
  "Đã bật âm thanh 🔊": "Sound ON 🔊",
  "Đã tắt âm thanh 🔇": "Sound OFF 🔇",
  "Đã bật âm thanh": "Sound ON",
  "Đã tắt âm thanh": "Sound OFF",
  // 2. conveyor-drop
  "HOÀN THÀNH VÒNG": "ROUND COMPLETE",
  "HOÀN THÀNH TẤT CẢ VÒNG!": "ALL ROUNDS COMPLETED!",
  "Bạn đã thu thập xong đồ chơi!": "You collected all the toys!",
  "Chúc mừng bạn đã hoàn thành toàn bộ bài tập!": "Congratulations! You completed the entire exercise!",
  "TỔNG ĐIỂM": "TOTAL SCORE",
  "▶ VÒNG TIẾP THEO": "▶ NEXT ROUND",
  "▶ TIẾP TỤC": "▶ RESUME",
  "✖ THOÁT GAME": "✖ EXIT GAME",
  "⌛ ĐANG TẢI...": "⌛ LOADING...",
  // 3. Doan-tau-tu-vung
  "Ghép từ": "Match",
  "XUẤT SẮC QUÁ!": "AWESOME JOB!",
  "Bé đã hoàn thành tất cả các chặng tàu từ vựng! Đoàn tàu đã về đích an toàn!": "You completed all vocabulary train stages! The train reached the station safely!",
  // 4. egg-smash-quiz-premium-ambient
  "Chạm vào trứng để đập! ✨": "Tap an egg to smash! ✨",
  "Bé bấm tiếp tục để chơi nhé.": "Press Resume to keep playing.",
  "Tiếp tục": "Resume",
  "Hoàn thành rồi!": "Completed!",
  "Bé đã hoàn thành trò chơi.": "You completed the game!",
  "✓ Đúng rồi! ✨": "✓ Correct! ✨",
  "✕ Sai rồi, thử quả khác nhé!": "✕ Wrong, try another egg!",
  "Sẵn sàng cho câu mới!": "Get ready for the next question!",
  "Bắt đầu lại nhé! Chạm vào trứng để đập!": "Starting over! Tap an egg to smash!",
  "Nhấp vào đây để nghe đọc phép tính 🔊": "Click here to hear the math question 🔊",
  // 5. magic_tree_matching_game_v3
  "Đang nạp cành cây và thẻ bài...": "Loading tree branches and cards...",
  "Bấm để nghe phát âm": "Click to listen to pronunciation",
  "Nghe lại phát âm": "Replay pronunciation",
  "SẴN SÀNG NÀO!": "GET READY!",
  "Tuyệt vời!": "Awesome!",
  "Bạn đã hoàn thành bài tập.": "You have completed the exercise.",
  "Tổng điểm:": "Total Score:",
  // 6. match-text-text
  "Đang nạp thẻ bài nối từ...": "Loading word matching cards...",
  "Sẵn sàng để nối những cặp từ siêu vui nhé!": "Get ready to connect matching pairs!",
  "Không tìm thấy thẻ bài nào": "No cards found",
  "Vui lòng kiểm tra lại chủ đề": "Please check the exercise topic",
  "Lỗi tải dữ liệu bài học": "Failed to load exercise data",
  "Vui lòng thử tải lại trang": "Please try reloading the page",
  // My Library Studio Edit
  "Chỉnh sửa Bộ câu hỏi": "Edit Question Set",
  "Chỉnh sửa Bộ câu hỏi (My Library)": "Edit Question Set (My Library)",
  "• Chỉnh sửa Bộ câu hỏi Ảnh - Ảnh": "• Edit Image - Image Question Set",
  "• Chỉnh sửa Bộ câu hỏi Trắc nghiệm": "• Edit Multiple Choice Question Set",
  "Chỉnh sửa Bộ câu hỏi Toán Học (My Library)": "Edit Math Question Set (My Library)",
  "Chỉnh sửa tên bộ câu hỏi, phép tính và đáp án để lưu vào My Library": "Edit question set name, math expressions, and answers to save to My Library",
  "Tên bộ câu hỏi (My Library) *": "Question Set Name (My Library) *",
  "Lưu vào My Library": "Save to My Library",
  "LƯU VÀO MY LIBRARY": "SAVE TO MY LIBRARY",
  "Đã lưu cập nhật bộ câu hỏi vào My Library!": "Saved question set updates to My Library!",
};

const VI_TO_EN_PATTERNS: Array<[RegExp, string]> = [
  [/^Vòng\s+(\d+)$/i, "Round $1"],
  [/^Xóa (?:Vòng|Round)\s+(\d+)$/i, "Delete Round $1"],
  [/^Chuyển sang (?:Vòng|Round)\s+(\d+)$/i, "Move to Round $1"],
  [/^Cặp Ảnh #(\d+)$/i, "Image Pair #$1"],
  [/^Cặp Chữ #(\d+)$/i, "Text Pair #$1"],
  [/^Cặp thẻ #(\d+)$/i, "Card Pair #$1"],
  [/^CÂU HỎI #(\d+)$/, "QUESTION #$1"],
  [/^Câu hỏi #?(\d+)$/i, "Question #$1"],
  [/^Câu #(\d+)(.*)$/i, "Question #$1$2"],
  [/^(\d+)\s+cặp$/i, "$1 pairs"],
  [/^(\d+)\s+câu$/i, "$1 questions"],
  [/^(\d+)\s+thẻ$/i, "$1 cards"],
  [/^\((\d+)\s+Vòng\)$/i, "($1 Rounds)"],
  [/^\((\d+)\s+Chuyến tàu\)$/i, "($1 Trains)"],
  [/^(\d+)\s*\/\s*(\d+)\s+từ$/i, "$1/$2 words"],
  [/^(\d+)\s+từ\s+\((\d+)\s+vòng\)$/i, "$1 words ($2 rounds)"],
  [/^\(tương đương ~(\d+)\s+vòng\)$/i, "(approx. ~$1 rounds)"],
  [/^1 Vòng chơi \(tối đa (\d+) từ\/vòng\)$/i, "1 Round (max $1 words/round)"],
  [/^1 Vòng chơi \(tối đa (\d+) cặp\/vòng\)$/i, "1 Round (max $1 pairs/round)"],
  [/^Tạo cặp thứ (\d+) cho (?:Vòng|Round) (\d+)$/i, "Create pair #$1 for Round $2"],
  [/^Tạo toa thứ (\d+) cho (?:Vòng|Round) (\d+)$/i, "Create carriage #$1 for Round $2"],
  [/^Đã đủ (\d+)\/(\d+) cặp cho (?:Vòng|Round) (\d+)$/i, "Full $1/$2 pairs for Round $3"],
  [/^Đã đủ (\d+)\/(\d+) toa cho (?:Vòng|Round) (\d+)$/i, "Full $1/$2 carriages for Round $3"],
  [/^Tạo câu hỏi thứ (\d+) cho (?:Vòng|Round) (\d+)$/i, "Create question #$1 for Round $2"],
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
  [/^(?:Vòng|Round) (\d+) cần (?:tối thiểu|ít nhất) (\d+) cặp thẻ!$/i, "Round $1 requires at least $2 card pairs!"],
  [/^(?:Vòng|Round) (\d+) cần (?:tối thiểu|ít nhất) (\d+) câu hỏi!$/i, "Round $1 requires at least $2 questions!"],
  [/^(?:Vòng|Round) (\d+), Cặp (?:thẻ|ảnh|chữ) (?:thứ )?#(\d+) thiếu hình ảnh Vế ([AB])!$/i, "Round $1, Pair #$2 is missing Image $3!"],
  [/^(?:Vòng|Round) (\d+), Cặp (?:thẻ|ảnh|chữ) (?:thứ )?#(\d+) thiếu hình ảnh!$/i, "Round $1, Pair #$2 is missing an image!"],
  [/^(?:Vòng|Round) (\d+), Cặp (?:thẻ|ảnh|chữ) (?:thứ )?#(\d+) thiếu từ vựng \/ chữ!$/i, "Round $1, Pair #$2 is missing text/vocabulary!"],
  [/^(?:Vòng|Round) (\d+), Cặp (?:thẻ|ảnh|chữ) (?:thứ )?#(\d+) thiếu nội dung Vế ([AB])!$/i, "Round $1, Pair #$2 is missing Side $3 text!"],
  [/^Tại (?:Vòng|Round) (\d+), từ vựng "(.+)" đang bị trùng lặp! Trong cùng 1 vòng vui lòng nhập các từ khác nhau \(bạn có thể lặp lại từ ở các vòng khác\)\.$/i, 'In Round $1, the word "$2" is duplicated! Please use unique words within the same round (you can repeat words across different rounds).'],
  [/^Tại (?:Vòng|Round) (\d+), Vế ([AB]) "(.+)" đang bị trùng lặp! Trong cùng 1 vòng vui lòng nhập nội dung khác nhau \(bạn có thể lặp lại ở các vòng khác\)\.$/i, 'In Round $1, Side $2 "$3" is duplicated! Please use unique text within the same round (you can repeat across different rounds).'],
  [/^(\d+)\s+câu hỏi$/i, "$1 questions"],
  [/^Hoàn thành Vòng (\d+)!$/i, "Round $1 Complete!"],
  [/^Bé đã vượt qua (\d+) câu hỏi\. Sẵn sàng cho vòng tiếp theo nhé!$/i, "You answered $1 questions. Get ready for the next round!"],
  [/^HOÀN THÀNH VÒNG (\d+)\/(\d+)$/i, "ROUND $1/$2 COMPLETE"],
  [/^Bạn đã thu thập xong đồ chơi vòng (\d+)! Sẵn sàng sang vòng (\d+)!$/i, "You collected all toys in Round $1! Get ready for Round $2!"],
  [/^▶ TIẾP TỤC VÒNG (\d+)$/i, "▶ CONTINUE TO ROUND $1"],
  [/^Bé đã vượt qua (\d+)\/(\d+) câu\. Tổng xu: (\d+)\.$/i, "You completed $1/$2 questions. Total coins: $3."],
  [/^Chính xác:\s*(.+)$/i, "Correct: $1"],
  [/^🔥 SƯU TẦM COMBO x(\d+)! XUẤT SẮC!$/i, "🔥 COMBO x$1! EXCELLENT!"],
  [/^Ghép chữ vào toa (\d+)$/i, "Match word to carriage $1"],
  [/^Hình (\d+)$/i, "Image $1"],
  [/^Đáp án (\d+)$/i, "Option $1"],
];

const EN_TO_VI_EXACT: Record<string, string> = (() => {
  const rev: Record<string, string> = {};
  for (const [vi, en] of Object.entries(VI_TO_EN_EXACT)) {
    if (vi !== en && !(en in rev)) {
      rev[en] = vi;
    }
  }
  return rev;
})();

const EN_TO_VI_PATTERNS: Array<[RegExp, string]> = [
  [/^Round\s+(\d+)$/i, "Vòng $1"],
  [/^Delete Round\s+(\d+)$/i, "Xóa Vòng $1"],
  [/^Move to Round\s+(\d+)$/i, "Chuyển sang Vòng $1"],
  [/^Image Pair #(\d+)$/i, "Cặp Ảnh #$1"],
  [/^Text Pair #(\d+)$/i, "Cặp Chữ #$1"],
  [/^Card Pair #(\d+)$/i, "Cặp thẻ #$1"],
  [/^QUESTION #(\d+)$/, "CÂU HỎI #$1"],
  [/^Question #(\d+)$/i, "Câu hỏi #$1"],
  [/^(\d+)\s+pairs$/i, "$1 cặp"],
  [/^(\d+)\s+questions$/i, "$1 câu"],
  [/^(\d+)\s+cards$/i, "$1 thẻ"],
  [/^\((\d+)\s+Rounds\)$/i, "($1 Vòng)"],
  [/^\((\d+)\s+Trains\)$/i, "($1 Chuyến tàu)"],
  [/^(\d+)\s*\/\s*(\d+)\s+words$/i, "$1/$2 từ"],
  [/^(\d+)\s+words\s+\((\d+)\s+rounds\)$/i, "$1 từ ($2 vòng)"],
  [/^\(approx\.\s*~(\d+)\s+rounds\)$/i, "(tương đương ~$1 vòng)"],
  [/^1 Round \(max (\d+) words\/round\)$/i, "1 Vòng chơi (tối đa $1 từ/vòng)"],
  [/^1 Round \(max (\d+) pairs\/round\)$/i, "1 Vòng chơi (tối đa $1 cặp/vòng)"],
  [/^Create pair #(\d+) for Round (\d+)$/i, "Tạo cặp thứ $1 cho Vòng $2"],
  [/^Create carriage #(\d+) for Round (\d+)$/i, "Tạo toa thứ $1 cho Vòng $2"],
  [/^Full (\d+)\/(\d+) pairs for Round (\d+)$/i, "Đã đủ $1/$2 cặp cho Vòng $3"],
  [/^Full (\d+)\/(\d+) carriages for Round (\d+)$/i, "Đã đủ $1/$2 toa cho Vòng $3"],
  [/^Create question #(\d+) for Round (\d+)$/i, "Tạo câu hỏi thứ $1 cho Vòng $2"],
  [/^Add question #(\d+) manually$/i, "Thêm câu thứ $1 thủ công"],
  [/^Questions List \((\d+)\/(\d+) questions\)$/i, "Danh Sách Câu Hỏi ($1/$2 câu)"],
  [/^Options \((\d+)\/4\) • Select the CORRECT answer:$/i, "Các đáp án ($1/4) • Chọn đáp án ĐÚNG:"],
  [/^Enter option ([A-D])\.\.\.$/i, "Nhập đáp án $1 (hỗ trợ câu dài)..."],
  [/^Option ([A-D])\.\.\.$/i, "Đáp án $1..."],
  [/^Remove option ([A-D])$/i, "Bỏ đáp án $1"],
  [/^Preview (\d+) Questions$/i, "Bảng Xem Trước $1 Câu Hỏi"],
  [/^Selected:\s*(\d+)\/(\d+)$/i, "Đã chọn: $1/$2"],
  [/^Selected Math Types \((\d+)\)$/i, "Dạng Toán Đã Chọn ($1)"],
  [/^Example:\s*(.+)$/i, "Ví dụ: $1"],
  [/^Search Image for Side ([AB])$/i, "Tìm kiếm hình ảnh cho Vế $1"],
  [/^Apply to Game \((\d+) questions\)$/i, "Áp Dụng Vào Game ($1 câu)"],
  [/^Preview and edit (\d+) questions before inserting$/i, "Xem trước và chỉnh sửa $1 câu hỏi trước khi chèn"],
  [/^Max (\d+) words\. Automatically split into Rounds \((\d+) words per round\)\.$/i, "Tối đa $1 từ. Hệ thống tự động chia thành các Vòng chơi (Mỗi vòng $2 từ)."],
  [/^Max (\d+) words\. Automatically split into Trains \((\d+) carriages per round\)\.$/i, "Tối đa $1 từ. Hệ thống tự động chia thành các Chuyến tàu (Mỗi vòng $2 toa tàu)."],
  [/^Exceeds 5 words \((\d+)\/5 words\)\. Please shorten!$/i, "Vượt quá 5 từ ($1/5 từ). Vui lòng rút gọn!"],
  [/^Found (\d+) errors to fix:$/i, "Phát hiện $1 lỗi cần sửa:"],
  [/^In Round (\d+), the word "(.+)" is duplicated! Please use unique words within the same round \(you can repeat words across different rounds\)\.$/i, 'Tại Vòng $1, từ vựng "$2" đang bị trùng lặp! Trong cùng 1 vòng vui lòng nhập các từ khác nhau (bạn có thể lặp lại từ ở các vòng khác).'],
  [/^In Round (\d+), Side ([AB]) "(.+)" is duplicated! Please use unique text within the same round \(you can repeat across different rounds\)\.$/i, 'Tại Vòng $1, Vế $2 "$3" đang bị trùng lặp! Trong cùng 1 vòng vui lòng nhập nội dung khác nhau (bạn có thể lặp lại ở các vòng khác).'],
  [/^Round (\d+) Complete!$/i, "Hoàn thành Vòng $1!"],
  [/^You answered (\d+) questions\. Get ready for the next round!$/i, "Bé đã vượt qua $1 câu hỏi. Sẵn sàng cho vòng tiếp theo nhé!"],
  [/^ROUND (\d+)\/(\d+) COMPLETE$/i, "HOÀN THÀNH VÒNG $1/$2"],
  [/^You collected all toys in Round (\d+)! Get ready for Round (\d+)!$/i, "Bạn đã thu thập xong đồ chơi vòng $1! Sẵn sàng sang vòng $2!"],
  [/^▶ CONTINUE TO ROUND (\d+)$/i, "▶ TIẾP TỤC VÒNG $1"],
  [/^You completed (\d+)\/(\d+) questions\. Total coins: (\d+)\.$/i, "Bé đã vượt qua $1/$2 câu. Tổng xu: $3."],
  [/^Correct:\s*(.+)$/i, "Chính xác: $1"],
  [/^🔥 COMBO x(\d+)! EXCELLENT!$/i, "🔥 SƯU TẦM COMBO x$1! XUẤT SẮC!"],
  [/^Match word to carriage (\d+)$/i, "Ghép chữ vào toa $1"],
  [/^Image (\d+)$/i, "Hình $1"],
  [/^Option (\d+)$/i, "Đáp án $1"],
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

export function translateTeacherEnToViString(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const exact = EN_TO_VI_EXACT[trimmed];
  if (exact) {
    const leading = raw.match(/^\s*/)?.[0] || "";
    const trailing = raw.match(/\s*$/)?.[0] || "";
    return `${leading}${exact}${trailing}`;
  }

  for (const [regex, replacement] of EN_TO_VI_PATTERNS) {
    if (regex.test(trimmed)) {
      const leading = raw.match(/^\s*/)?.[0] || "";
      const trailing = raw.match(/\s*$/)?.[0] || "";
      return `${leading}${trimmed.replace(regex, replacement)}${trailing}`;
    }
  }

  return null;
}

type OrigElementAttrRecord = {
  placeholder?: { vi: string; en: string };
  title?: { vi: string; en: string };
  ariaLabel?: { vi: string; en: string };
  alt?: { vi: string; en: string };
};

const globalStore = globalThis as unknown as {
  __teacherOrigTextNodeMap?: WeakMap<Text, { vi: string; en: string }>;
  __teacherOrigElementAttrMap?: WeakMap<Element, OrigElementAttrRecord>;
};

const origTextNodeMap =
  globalStore.__teacherOrigTextNodeMap ||
  (globalStore.__teacherOrigTextNodeMap = new WeakMap<Text, { vi: string; en: string }>());

const origElementAttrMap =
  globalStore.__teacherOrigElementAttrMap ||
  (globalStore.__teacherOrigElementAttrMap = new WeakMap<Element, OrigElementAttrRecord>());

export function TeacherDomTranslator() {
  const { locale } = useTeacherLocale();
  const pathname = usePathname();
  const lastPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;

    let isApplying = false;
    let rafId: number | null = null;
    let initTimer: ReturnType<typeof setTimeout> | null = null;
    let hydrationRetryTimer: ReturnType<typeof setTimeout> | null = null;
    let observer: MutationObserver | null = null;
    const iframeObservers: MutationObserver[] = [];
    const iframeLoadHandlers: Array<{ iframe: HTMLIFrameElement; handler: () => void }> = [];
    const observedIframeDocs = new WeakSet<Document>();
    const pendingNodes = new Set<Node>();
    let reactKeyCache: string | null = null;

    const isElementHydrated = (el: Element | null): boolean => {
      if (!el) return false;
      if (el.ownerDocument !== document) return true;
      if (reactKeyCache && reactKeyCache in el) return true;
      const keys = Object.keys(el);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (k.startsWith("__reactProps$") || k.startsWith("__reactFiber$")) {
          reactKeyCache = k;
          return true;
        }
      }
      return false;
    };

    const scheduleHydrationRetry = () => {
      if (hydrationRetryTimer !== null) return;
      hydrationRetryTimer = setTimeout(() => {
        hydrationRetryTimer = null;
        processNode(document.body);
      }, 100);
    };

    const translateElementAttr = (
      el: Element,
      attrName: "placeholder" | "title" | "aria-label" | "alt",
      recordKey: keyof OrigElementAttrRecord
    ) => {
      if (!isElementHydrated(el)) {
        scheduleHydrationRetry();
        return;
      }
      const currentVal = el.getAttribute(attrName);
      if (currentVal === null) return;
      let attrRecord = origElementAttrMap.get(el);
      const saved = attrRecord?.[recordKey];

      if (locale === "en") {
        const sourceVi = saved && currentVal === saved.en ? saved.vi : currentVal;
        const translated = translateTeacherViString(sourceVi);
        if (translated && currentVal !== translated) {
          attrRecord = { ...attrRecord, [recordKey]: { vi: sourceVi, en: translated } };
          origElementAttrMap.set(el, attrRecord);
          el.setAttribute(attrName, translated);
        }
      } else if (locale === "vi") {
        if (saved && currentVal === saved.en && currentVal !== saved.vi) {
          el.setAttribute(attrName, saved.vi);
        } else {
          const restoredVi = translateTeacherEnToViString(currentVal);
          if (restoredVi && currentVal !== restoredVi) {
            attrRecord = { ...attrRecord, [recordKey]: { vi: restoredVi, en: currentVal } };
            origElementAttrMap.set(el, attrRecord);
            el.setAttribute(attrName, restoredVi);
          }
        }
      }
    };

    const processNode = (root: Node) => {
      if (isApplying) return;
      isApplying = true;

      try {
        const doc = root.ownerDocument || document;
        if (doc === document) {
          const mainEl = document.querySelector("main");
          if (mainEl) {
            const buttonsOrHeadings = mainEl.querySelectorAll("button, h1, h2, input");
            const lastInteractive = buttonsOrHeadings.length > 0 ? buttonsOrHeadings[buttonsOrHeadings.length - 1] : mainEl;
            if (!isElementHydrated(lastInteractive)) {
              scheduleHydrationRetry();
              return;
            }
          }
        }

        // 1. Process Element attributes (placeholder, title, aria-label, alt) using WeakMap
        const elements: Element[] = [];
        if (root.nodeType === Node.ELEMENT_NODE) {
          elements.push(root as Element);
          const descendants = (root as Element).querySelectorAll("[placeholder], [title], [aria-label], [alt]");
          descendants.forEach((el) => elements.push(el));
        }

        for (const el of elements) {
          translateElementAttr(el, "placeholder", "placeholder");
          translateElementAttr(el, "title", "title");
          translateElementAttr(el, "aria-label", "ariaLabel");
          translateElementAttr(el, "alt", "alt");
        }

        // 2. Process Text Nodes (using root.ownerDocument so same-origin iframes work too)
        const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName;
            if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || parent.isContentEditable) {
              return NodeFilter.FILTER_REJECT;
            }
            if (doc === document && !isElementHydrated(parent)) {
              scheduleHydrationRetry();
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
            const sourceVi = saved && val === saved.en ? saved.vi : val;
            const translated = translateTeacherViString(sourceVi);
            if (translated && val !== translated) {
              origTextNodeMap.set(textNode, { vi: sourceVi, en: translated });
              textNode.nodeValue = translated;
            }
          } else if (locale === "vi") {
            if (saved && val === saved.en && val !== saved.vi) {
              textNode.nodeValue = saved.vi;
            } else {
              const restoredVi = translateTeacherEnToViString(val);
              if (restoredVi && val !== restoredVi) {
                origTextNodeMap.set(textNode, { vi: restoredVi, en: val });
                textNode.nodeValue = restoredVi;
              }
            }
          }

          current = walker.nextNode();
        }
      } finally {
        isApplying = false;
      }
    };

    const flushPending = () => {
      rafId = null;
      if (pendingNodes.size === 0) return;
      const nodes = Array.from(pendingNodes);
      pendingNodes.clear();
      for (const n of nodes) {
        if (n.isConnected) {
          processNode(n);
        }
      }
    };

    const scheduleProcess = (node: Node) => {
      pendingNodes.add(node);
      if (rafId === null) {
        rafId = window.requestAnimationFrame(flushPending);
      }
    };

    const observeSameOriginIframe = (iframe: HTMLIFrameElement) => {
      const bindIframeDoc = () => {
        try {
          const iframeDoc = iframe.contentDocument;
          if (!iframeDoc || !iframeDoc.body) return;
          processNode(iframeDoc.body);

          if (observedIframeDocs.has(iframeDoc)) return;
          observedIframeDocs.add(iframeDoc);

          const iframeObs = new MutationObserver((mutations) => {
            if (isApplying) return;
            for (const m of mutations) {
              if (m.type === "characterData" && m.target) {
                const parent = m.target.parentElement;
                if (parent) scheduleProcess(parent);
              } else if (m.type === "childList") {
                m.addedNodes.forEach((n) => {
                  if (n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.TEXT_NODE) {
                    scheduleProcess(n.parentElement || n);
                  }
                });
              }
            }
          });

          iframeObs.observe(iframeDoc.body, {
            childList: true,
            subtree: true,
            characterData: true,
          });
          iframeObservers.push(iframeObs);
        } catch {
          // Cross-origin iframe: ignore safely
        }
      };

      bindIframeDoc();
      const onLoad = () => {
        bindIframeDoc();
        setTimeout(bindIframeDoc, 250);
      };
      iframe.addEventListener("load", onLoad);
      iframeLoadHandlers.push({ iframe, handler: onLoad });
    };

    const startObserving = () => {
      processNode(document.body);
      document.querySelectorAll("iframe").forEach((el) => observeSameOriginIframe(el as HTMLIFrameElement));

      observer = new MutationObserver((mutations) => {
        if (isApplying) return;
        for (const m of mutations) {
          if (m.type === "characterData" && m.target) {
            const parent = m.target.parentElement;
            if (parent) scheduleProcess(parent);
          } else if (m.type === "childList") {
            m.addedNodes.forEach((n) => {
              if (n.nodeType === Node.ELEMENT_NODE) {
                const el = n as Element;
                if (el.tagName === "IFRAME") {
                  observeSameOriginIframe(el as HTMLIFrameElement);
                } else {
                  el.querySelectorAll("iframe").forEach((ifr) => observeSameOriginIframe(ifr as HTMLIFrameElement));
                }
              }
              if (n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.TEXT_NODE) {
                scheduleProcess(n.parentElement || n);
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
    };

    // Wait briefly on initial hydration or route change so React finishes hydrating child trees before DOM translation runs
    const isRouteChangeOrInitial = lastPathnameRef.current !== pathname;
    lastPathnameRef.current = pathname;

    if (isRouteChangeOrInitial) {
      initTimer = setTimeout(startObserving, 120);
    } else {
      startObserving();
    }

    return () => {
      if (initTimer !== null) clearTimeout(initTimer);
      if (hydrationRetryTimer !== null) clearTimeout(hydrationRetryTimer);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
      iframeObservers.forEach((obs) => obs.disconnect());
      iframeLoadHandlers.forEach(({ iframe, handler }) => iframe.removeEventListener("load", handler));
    };
  }, [locale, pathname]);

  return null;
}
