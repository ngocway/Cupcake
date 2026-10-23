/**
 * readingHintExtractor.ts
 *
 * Automatic extraction of reading passage clue sentences for Audio Hints.
 * Extracts the single evidence sentence from the reading passage or the explanation
 * to synthesize via Deepgram TTS.
 */

export function cleanTextForTTS(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\bvolume_up\b/gi, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export interface ExtractClueParams {
  explanation?: string | null;
  readingText?: string | null;
  questionText?: string;
  correctAnswerText?: string;
  hintText?: string;
}

/**
 * Extracts the clue/evidence sentence that contains the answer from the passage or explanation.
 */
export function extractClueSentence(params: ExtractClueParams): string {
  const {
    explanation = '',
    readingText = '',
    questionText = '',
    correctAnswerText = '',
    hintText = '',
  } = params;

  // 1. First Priority: Check if English explanation contains a quoted sentence from the passage
  if (explanation) {
    const enPart = explanation.split(/\[VI\]/i)[0];
    const quoteMatch = enPart.match(/["“]([^"”]{8,200})["”]/);
    if (quoteMatch && quoteMatch[1]) {
      const cleanQuote = cleanTextForTTS(quoteMatch[1]).replace(/^"/, '').replace(/"$/, '').trim();
      // Ensure no Vietnamese diacritics in the quote
      if (
        cleanQuote.length >= 8 &&
        !/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(cleanQuote)
      ) {
        return cleanQuote;
      }
    }
  }

  // 2. Second Priority: Search reading text passage for the sentence containing the answer keywords
  if (readingText) {
    const cleanReading = cleanTextForTTS(readingText);

    // Split passage into individual sentences
    const rawSentences = cleanReading.split(/(?<=[.!?]["']?)\s+/);
    const sentences = rawSentences
      .map((s) => s.trim().replace(/^["']/, '').replace(/["']$/, '').trim())
      .filter((s) => {
        if (s.length < 12) return false;
        const low = s.toLowerCase();
        if (low.startsWith('part 2') || low.includes('key vocabulary') || low.includes('10 key')) return false;
        if (low.includes('plural noun') || low.includes('singular noun') || low.includes('adjective')) return false;
        return true;
      });

    if (sentences.length > 0) {
      const normalize = (str: string) =>
        str
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .split(/\s+/)
          .filter(
            (w) =>
              w.length > 2 &&
              !['the', 'and', 'that', 'this', 'with', 'from', 'what', 'which', 'who', 'does', 'how', 'are', 'was', 'were', 'for'].includes(w)
          );

      const ansWords = normalize(correctAnswerText || '');
      const qWords = normalize(questionText || '');

      let bestSentence = '';
      let maxScore = -1;

      for (const sent of sentences) {
        const sentLower = sent.toLowerCase();
        let score = 0;

        // Exact match with answer text
        if (correctAnswerText && correctAnswerText.length > 3 && sentLower.includes(correctAnswerText.toLowerCase())) {
          score += 14;
        }

        // Answer keywords overlap
        for (const w of ansWords) {
          if (sentLower.includes(w)) score += 6;
        }

        // Question keywords overlap
        for (const w of qWords) {
          if (sentLower.includes(w)) score += 1.5;
        }

        if (score > maxScore) {
          maxScore = score;
          bestSentence = sent;
        }
      }

      if (maxScore > 0 && bestSentence) {
        return bestSentence;
      }
    }
  }

  // 3. Third Priority: First English sentence from explanation
  if (explanation) {
    let enPart = explanation.split(/\[VI\]/i)[0];
    enPart = enPart.replace(/^\[EN\]/i, '').replace(/^Explanation:\s*/i, '').trim();
    const firstSentence = enPart.split(/(?<=[.!?])\s+/)[0];
    if (firstSentence && firstSentence.length > 10) {
      return cleanTextForTTS(firstSentence);
    }
  }

  // 4. Fallback: Clean hintText or questionText
  return cleanTextForTTS(hintText || questionText || '');
}

export interface ParsedExplanation {
  en: string;
  vi?: string;
}

/**
 * Parses raw explanation string or translations object into separated { en, vi }
 */
export function parseBilingualExplanation(
  rawExplanation?: string | null,
  translations?: any
): ParsedExplanation {
  let en = '';
  let vi = '';

  // 1. Check explanationTranslations object if available
  if (translations && typeof translations === 'object') {
    if (translations.en && typeof translations.en === 'string') {
      en = translations.en.trim();
    }
    if (translations.vi && typeof translations.vi === 'string') {
      vi = translations.vi.trim();
    }
  }

  // 2. If en or vi not yet extracted, parse from rawExplanation string
  if (!en && !vi && rawExplanation) {
    const raw = rawExplanation.trim();

    if (raw.includes('[VI]')) {
      const parts = raw.split(/\[VI\]/i);
      en = parts[0].replace(/^\[EN\]/i, '').trim();
      vi = parts[1] ? parts[1].trim() : '';
    } else if (raw.includes('[EN]')) {
      en = raw.replace(/^\[EN\]/i, '').trim();
    } else {
      en = raw;
    }
  }

  // Clean tag prefixes
  en = en.replace(/^\[EN\]\s*/i, '').replace(/^Explanation:\s*/i, '').trim();
  vi = vi.replace(/^\[VI\]\s*/i, '').trim();

  return { en, vi: vi || undefined };
}
