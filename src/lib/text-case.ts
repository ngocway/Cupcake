/**
 * Shared text casing utilities for games and question libraries.
 *
 * Rules:
 * 1. Sentence case: Capitalize the first alphabetical letter of a word, phrase, or sentence,
 *    preserving the rest of the string (e.g., "apple" -> "Apple", "apple tree" -> "Apple tree", "Bill" -> "Bill").
 * 2. Exception (Method B): If a quiz question contains a mid-word/letter blank (e.g., "b_ll", "c_ke", "_ook"),
 *    keep its option texts in their original case (e.g., "a", "i", "o", "u").
 */

export function isMidWordBlankQuestion(
  questionText: string | null | undefined
): boolean {
  if (!questionText) return false;
  return (
    /[a-zA-ZÀ-ỹ]_+|_+[a-zA-ZÀ-ỹ]/.test(questionText) ||
    /\b[A-Z]\s*(?:→|->)\s*_+/.test(questionText) ||
    /small letter/i.test(questionText)
  );
}

export function capitalizeFirstLetter(
  raw: string | null | undefined
): string {
  if (raw === null || raw === undefined) return "";
  const str = String(raw);
  const trimmed = str.trim();
  if (!trimmed) return str;

  // Do not alter URLs, file paths, or serialized JSON
  if (
    /^https?:\/\//i.test(trimmed) ||
    /^\/uploads\//i.test(trimmed) ||
    /^data:/i.test(trimmed) ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[")
  ) {
    return str;
  }

  // Do not capitalize if the very first word token itself is a fill-in-letter pattern like "b_ll" or "_ook"
  const firstToken = trimmed.split(/\s+/)[0] || "";
  if (/[a-zA-ZÀ-ỹ]_+|_+[a-zA-ZÀ-ỹ]/.test(firstToken)) {
    return str;
  }

  // Do not capitalize lowercase phonics blending formulas like "b + all" or "ch + ips"
  if (/^[a-z]{1,3}\s*\+\s*[a-z]+/.test(trimmed)) {
    return str;
  }

  return str.replace(
    /^(\s*["'“‘(\[]?)([a-zà-ỹ])/u,
    (_, prefix: string, firstChar: string) => prefix + firstChar.toUpperCase()
  );
}

export function formatLabelBOrQuizOptions(
  labelB: string | null | undefined,
  questionText?: string | null
): string | null {
  if (labelB === null || labelB === undefined) return null;
  const trimmed = labelB.trim();
  if (!trimmed) return labelB;

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && Array.isArray(parsed.options)) {
        const allSingleLowercase =
          parsed.options.length > 0 &&
          parsed.options.every(
            (opt: any) =>
              typeof opt?.text === "string" && /^[a-z]$/.test(opt.text.trim())
          );
        const keepLower =
          allSingleLowercase || isMidWordBlankQuestion(questionText);
        if (keepLower) {
          return labelB;
        }
        const formattedOptions = parsed.options.map((opt: any) => ({
          ...opt,
          text:
            typeof opt?.text === "string"
              ? capitalizeFirstLetter(opt.text)
              : opt?.text ?? "",
        }));
        return JSON.stringify({
          ...parsed,
          options: formattedOptions,
        });
      }
    } catch {
      return labelB;
    }
    return labelB;
  }

  return capitalizeFirstLetter(labelB);
}

export function formatLibraryItemCase<
  T extends { word: string; labelB?: string | null }
>(item: T): T {
  const formattedWord = capitalizeFirstLetter(item.word);
  const formattedLabelB =
    item.labelB !== undefined && item.labelB !== null
      ? formatLabelBOrQuizOptions(item.labelB, formattedWord)
      : item.labelB;

  return {
    ...item,
    word: formattedWord,
    ...(item.labelB !== undefined ? { labelB: formattedLabelB } : {}),
  };
}

