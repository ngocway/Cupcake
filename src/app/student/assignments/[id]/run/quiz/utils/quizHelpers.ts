export function seedShuffle<T>(array: T[], seed: string): T[] {
  if (!array || array.length === 0) return [];
  const shuffled = [...array];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  
  const random = () => {
    let x = Math.sin(h++) * 10000;
    return x - Math.floor(x);
  };

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}

export const getQuestionStatus = (q: any, answer: any) => {
  if (answer === undefined || answer === null) return "pending";
  let questionData: any;
  try {
    questionData = typeof q.content === "string" ? JSON.parse(q.content) : q.content;
  } catch {
    questionData = {};
  }
  const qType = questionData.type || q.type;

  if (qType === "MULTIPLE_CHOICE" || qType === "MULTIPLE_SELECT") {
    const options = questionData.options || [];
    if (qType === "MULTIPLE_SELECT") {
      const answersArray = Array.isArray(answer) ? answer : [];
      const correctIndices = options
        .map((opt: any, i: number) => opt.isCorrect ? (opt.originalIndex !== undefined ? opt.originalIndex : i) : -1)
        .filter((i: number) => i !== -1);
      if (answersArray.length === 0) return "pending";
      if (answersArray.length !== correctIndices.length) return "incorrect";
      return answersArray.every((v: number) => correctIndices.includes(v)) ? "correct" : "incorrect";
    } else {
      const selectedOption = options.find((opt: any, idx: number) => {
        const origIdx = opt.originalIndex !== undefined ? opt.originalIndex : idx;
        return origIdx === answer;
      });
      return selectedOption?.isCorrect ? "correct" : "incorrect";
    }
  }
  if (qType === "TRUE_FALSE") {
    if (typeof questionData.isTrue === "boolean") {
      return answer === questionData.isTrue ? "correct" : "incorrect";
    }
    if (Array.isArray(questionData.options)) {
      const selectedOpt = questionData.options.find((o: any) => {
        const normText = (o.text || "").toLowerCase().trim();
        return answer ? (normText === "true" || normText === "đúng" || normText === "yes") : (normText === "false" || normText === "sai" || normText === "no");
      });
      return selectedOpt?.isCorrect ? "correct" : "incorrect";
    }
    return "incorrect";
  }
  if (qType === "CLOZE_TEST") {
    const textWithBlanks = questionData.textWithBlanks || questionData.questionText || "";
    const blanks = Array.from(textWithBlanks.matchAll(/\{\{(.*?)\}\}/g)).map((m: any) => m[1]);
    const userAnswer = answer || {};
    if (Object.keys(userAnswer).length === 0) return "pending";
    const isAllCorrect = blanks.every((expectedWord: string, idx: number) => {
      const userWord = (userAnswer[idx] || "").trim();
      return questionData.caseSensitive
        ? expectedWord === userWord
        : expectedWord.toLowerCase() === userWord.toLowerCase();
    });
    return isAllCorrect ? "correct" : "incorrect";
  }
  if (qType === "MATCHING") {
    const pairs = questionData.pairs || [];
    const userAnswer = answer || {};
    if (Object.keys(userAnswer).length === 0) return "pending";
    const isAllCorrect = pairs.every((p: any) => userAnswer[p.id] === p.rightText);
    return isAllCorrect ? "correct" : "incorrect";
  }
  return "pending";
};

export const getYoutubeVideoId = (url: string | null) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export const getScoreEmoji = (c: number, t2: number) => {
  const p = t2 > 0 ? c / t2 : 0;
  if (p >= 0.8) return "🌟";
  if (p >= 0.5) return "👏";
  return "💪";
};

export const getScoreMsg = (c: number, t2: number) => {
  const p = t2 > 0 ? c / t2 : 0;
  if (p >= 0.8) return "Excellent!";
  if (p >= 0.5) return "Not bad!";
  return "Keep trying!";
};

export const getStars = (c: number, t2: number) => {
  const p = t2 > 0 ? c / t2 : 0;
  if (p >= 0.8) return 3;
  if (p >= 0.5) return 2;
  return 1;
};
