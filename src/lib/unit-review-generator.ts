import { LibrarySetItem } from "@/actions/teacher-library-actions";

export interface ReviewQuestionOption {
  text: string;
  imageUrl?: string;
  isCorrect: boolean;
  originalIndex?: number;
}

export interface ReviewQuestion {
  id: string;
  type: "MULTIPLE_CHOICE" | "MATCHING" | "CLOZE_TEST" | "TRUE_FALSE" | "SENTENCE_BUILDER";
  imageUrl?: string;
  audioUrl?: string;
  audioText?: string;
  content: string; // JSON string with questionText, options, type, etc.
  explanation?: string;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Validates whether a text pair is a legitimate human conversation
 * (Filters out phonics blending formulas like "p + izza", "+", math signs, etc.)
 */
function isValidDialogue(speakerA?: string | null, speakerB?: string | null): boolean {
  if (!speakerA || !speakerB) return false;
  const a = speakerA.trim();
  const b = speakerB.trim();

  // Reject phonics blending or formulaic signs (+, =, /, _, \)
  if (/[+=/\\_]/.test(a) || /[+=/\\_]/.test(b)) return false;

  // Must have realistic sentence length and words
  const aWords = a.split(/\s+/).filter(Boolean);
  const bWords = b.split(/\s+/).filter(Boolean);

  if (aWords.length < 2 || a.length < 8) return false;
  if (bWords.length < 1 || b.length < 2) return false;

  return true;
}

/**
 * Builds a clean, pedagogical, 100% English review test for a Global Success Unit.
 * Ensures:
 * 1. Look at picture, choose word
 * 2. Listen to audio, choose matching picture
 * 3. Authentic practice quiz questions from the textbook
 * 4. Genuine conversational exchanges (only if valid human dialogue)
 * Minimum 20 questions!
 */
export function generateUnitReviewQuestions(sets: LibrarySetItem[], grade: number = 5): ReviewQuestion[] {
  const vocabSet = sets.find((s) => s.subType === "image-text");
  const quizSet = sets.find((s) => s.subType === "quiz");
  const textSets = sets.filter((s) => s.subType === "text-text");

  const conversationSet = textSets.find((s) => {
    const lower = (s.name || "").toLowerCase();
    return (
      lower.includes("conversation") ||
      lower.includes("sentence") ||
      lower.includes("hội thoại") ||
      lower.includes("mẫu câu")
    );
  }) || textSets[0];

  const vocabItems = vocabSet?.items || [];
  const convItems = conversationSet?.items || [];
  const quizItems = quizSet?.items || [];

  const questions: ReviewQuestion[] = [];
  let qCounter = 1;

  // ──────────────────────────────────────────────────────────────────────────
  // 1. DẠNG 1: Nhìn hình chọn từ đúng (Look at picture, choose word)
  // ──────────────────────────────────────────────────────────────────────────
  const validVocabWithImg = vocabItems.filter(
    (it) => it.imageUrl && it.word && !/[+=/\\_]/.test(it.word)
  );

  validVocabWithImg.forEach((item) => {
    const otherWords = validVocabWithImg
      .filter((other) => other.id !== item.id && other.word && other.word !== item.word)
      .map((other) => other.word!);

    const shuffledOthers = shuffleArray(otherWords);
    const distractorWords = shuffledOthers.slice(0, 3);

    while (distractorWords.length < 3) {
      distractorWords.push(`Word ${distractorWords.length + 1}`);
    }

    const options: ReviewQuestionOption[] = shuffleArray([
      { text: item.word!, isCorrect: true },
      ...distractorWords.map((w) => ({ text: w, isCorrect: false })),
    ]);

    const qContent = {
      type: "MULTIPLE_CHOICE",
      questionText: "Look at the picture and choose the correct word:",
      imageUrl: item.imageUrl || undefined,
      options,
    };

    questions.push({
      id: `rev-vocab-look-${item.id || qCounter++}`,
      type: "MULTIPLE_CHOICE",
      imageUrl: item.imageUrl || undefined,
      audioUrl: item.audioUrl || undefined,
      content: JSON.stringify(qContent),
      explanation: `[EN] The picture shows "${item.word}".\n[VI] Bức tranh mô tả "${item.word}".`,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. DẠNG 2: Nghe audio chọn hình đúng (Listen to audio, choose matching picture)
  // ──────────────────────────────────────────────────────────────────────────
  validVocabWithImg.forEach((item) => {
    const otherItems = validVocabWithImg.filter(
      (other) => other.id !== item.id && other.imageUrl && other.word !== item.word
    );

    if (otherItems.length >= 3) {
      const distractors = shuffleArray(otherItems).slice(0, 3);
      const options: ReviewQuestionOption[] = shuffleArray([
        { text: item.word!, imageUrl: item.imageUrl || undefined, isCorrect: true },
        ...distractors.map((d) => ({
          text: d.word!,
          imageUrl: d.imageUrl || undefined,
          isCorrect: false,
        })),
      ]);

      const rawAudio = (item.audioUrl || "").trim();
      const validAudioUrl = rawAudio && rawAudio !== "null" && rawAudio.length > 5 ? rawAudio : undefined;

      const qContent = {
        type: "MULTIPLE_CHOICE",
        questionText: "Listen to the audio and choose the matching picture:",
        audioUrl: validAudioUrl,
        audioText: item.word!,
        isListeningQuestion: true,
        options,
      };

      questions.push({
        id: `rev-vocab-listen-${item.id || qCounter++}`,
        type: "MULTIPLE_CHOICE",
        audioUrl: validAudioUrl,
        audioText: item.word!,
        content: JSON.stringify(qContent),
        explanation: `[EN] You heard "${item.word}".\n[VI] Bạn vừa nghe từ "${item.word}".`,
      });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. DẠNG 3: Câu hỏi Trắc nghiệm chuẩn từ bộ Practice Quiz (SGK)
  // ──────────────────────────────────────────────────────────────────────────
  quizItems.forEach((qItem, idx) => {
    if (!qItem.word) return;

    let parsedOptions: any[] = [];
    if (qItem.labelB) {
      try {
        const parsed = JSON.parse(qItem.labelB);
        if (Array.isArray(parsed.options)) {
          parsedOptions = parsed.options;
        }
      } catch {}
    }

    if (parsedOptions.length >= 2) {
      const options: ReviewQuestionOption[] = parsedOptions.map((opt: any) => {
        let text = (opt.text || "").trim();
        // If single letter (e.g. "p", "m", "n", "t"), use pure uppercase ("P", "M", "N", "T")
        const singleLetterMatch = text.match(/^([a-zA-Z])[.)]?$/);
        if (singleLetterMatch) {
          text = singleLetterMatch[1].toUpperCase();
        }

        return {
          text,
          imageUrl: opt.imageUrl || undefined,
          isCorrect: Boolean(opt.isCorrect),
        };
      });

      const qContent = {
        type: "MULTIPLE_CHOICE",
        questionText: qItem.word,
        imageUrl: qItem.imageUrl || undefined,
        options,
      };

      const correctOptText = options.find((o) => o.isCorrect)?.text || "";

      questions.push({
        id: `rev-quiz-${qItem.id || idx}-${qCounter++}`,
        type: "MULTIPLE_CHOICE",
        imageUrl: qItem.imageUrl || undefined,
        content: JSON.stringify(qContent),
        explanation:
          (qItem as any).explanation ||
          `[EN] Correct answer: "${correctOptText}".\n[VI] Đáp án đúng: "${correctOptText}".`,
      });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. DẠNG 4: Hội thoại phản xạ (CHỈ KHI LÀ CÂU HỘI THOẠI THẬT SỰ HỢP LÝ)
  // ──────────────────────────────────────────────────────────────────────────
  const legitimateDialogues = convItems.filter((pair) =>
    isValidDialogue(pair.word, pair.labelB)
  );

  legitimateDialogues.forEach((pair, idx) => {
    const speakerA = pair.word!.trim();
    const speakerB = pair.labelB!.trim();

    const otherReplies = legitimateDialogues
      .filter((other) => other.id !== pair.id && other.labelB && other.labelB !== speakerB)
      .map((other) => other.labelB!)
      .filter(Boolean);

    if (otherReplies.length >= 2) {
      const distractorReplies = shuffleArray(otherReplies).slice(0, 3);
      while (distractorReplies.length < 3) {
        distractorReplies.push("Thank you very much.");
      }

      const options: ReviewQuestionOption[] = shuffleArray([
        { text: speakerB, isCorrect: true },
        ...distractorReplies.map((r) => ({ text: r, isCorrect: false })),
      ]);

      const cleanSpeakerA = speakerA.replace(/^["“]+|["”]+$/g, "").trim();

      const qContent = {
        type: "MULTIPLE_CHOICE",
        questionText: `💬 ${cleanSpeakerA}`,
        options,
      };

      questions.push({
        id: `rev-conv-reply-${pair.id || idx}-${qCounter++}`,
        type: "MULTIPLE_CHOICE",
        content: JSON.stringify(qContent),
        explanation: `[EN] The most natural response to "${speakerA}" is "${speakerB}".\n[VI] Câu trả lời phù hợp nhất là "${speakerB}".`,
      });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. DẠNG 5: Sắp xếp câu (Sentence Builder) từ các câu hội thoại chuẩn
  // ──────────────────────────────────────────────────────────────────────────
  const sbCandidates: Array<{ sentence: string; contextHint?: string }> = [];
  legitimateDialogues.forEach((pair) => {
    const cleanA = pair.word!.replace(/^["“]+|["”]+$/g, "").trim();
    const cleanB = pair.labelB!.replace(/^["“]+|["”]+$/g, "").trim();

    const bWords = cleanB.split(/\s+/).filter(Boolean);
    const aWords = cleanA.split(/\s+/).filter(Boolean);

    if (bWords.length >= 3 && bWords.length <= 10) {
      sbCandidates.push({
        sentence: cleanB,
        contextHint: grade <= 9 ? `💬 "${cleanA}"` : undefined,
      });
    } else if (aWords.length >= 3 && aWords.length <= 10) {
      sbCandidates.push({
        sentence: cleanA,
        contextHint: grade <= 9 ? `💬 "${cleanB}"` : undefined,
      });
    }
  });

  shuffleArray(sbCandidates)
    .forEach((cand, idx) => {
      const words = cand.sentence.split(/\s+/).filter(Boolean);
      let shuffledWords = shuffleArray(words);
      if (words.length > 1 && shuffledWords.join(" ") === words.join(" ")) {
        shuffledWords = [...words.slice(1), words[0]];
      }

      const qContent = {
        type: "SENTENCE_BUILDER",
        questionText: cand.contextHint || "Arrange the words to make a correct sentence:",
        targetSentence: words.join(" "),
        words,
        shuffledWords,
      };

      questions.push({
        id: `rev-sb-${idx}-${qCounter++}`,
        type: "SENTENCE_BUILDER",
        content: JSON.stringify(qContent),
        explanation: `[EN] Correct sentence: "${words.join(" ")}".\n[VI] Câu đúng là: "${words.join(" ")}".`,
      });
    });

  // ──────────────────────────────────────────────────────────────────────────
  // Đảm bảo tối thiểu 20 câu hỏi chất lượng cao (không cắt bớt nếu nhiều hơn)
  // ──────────────────────────────────────────────────────────────────────────
  const finalShuffled = shuffleArray(questions);

  if (finalShuffled.length >= 20) {
    return finalShuffled;
  }

  // Nếu chưa đủ 20 (ví dụ Unit lớp 1 quá ngắn), nhân bản xoay vòng từ các câu hỏi chuẩn trên
  const padded = [...finalShuffled];
  let loopIdx = 0;
  while (padded.length < 20 && finalShuffled.length > 0) {
    const clone = { ...finalShuffled[loopIdx % finalShuffled.length] };
    clone.id = `${clone.id}-pad-${padded.length}`;
    padded.push(clone);
    loopIdx++;
  }

  return padded;
}
