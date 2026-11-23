"use client";

import React from "react";

/**
 * Matches Unicode Emoji sequences including standard pictographs,
 * emoji modifiers, variation selectors, and presentation symbols.
 */
export const EMOJI_SPLIT_REGEX =
  /([\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}][\u{FE0E}\u{FE0F}\u{1F3FB}-\u{1F3FF}\u{200D}]*)+/gu;

export const EMOJI_TEST_REGEX =
  /[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

/**
 * Checks if a string contains any emoji character.
 */
export function hasEmoji(text?: string | null): boolean {
  if (!text) return false;
  return EMOJI_TEST_REGEX.test(text);
}

/**
 * Checks if a string consists ONLY of emojis and whitespace.
 * Example: "👑", "🍎 🍌", "🐶"
 */
export function isPureEmoji(text?: string | null): boolean {
  if (!text) return false;
  const stripped = text.replace(EMOJI_SPLIT_REGEX, "").trim();
  return stripped.length === 0 && hasEmoji(text);
}

interface EnlargedEmojiTextProps {
  text: string;
  className?: string;
  emojiClassName?: string;
  isQuestionTitle?: boolean;
}

/**
 * Renders text while automatically detecting and enlarging emoji characters
 * so that young students can clearly see visual clues (e.g. "What is this? 👑").
 */
export function EnlargedEmojiText({
  text,
  className,
  emojiClassName,
  isQuestionTitle = false,
}: EnlargedEmojiTextProps) {
  if (!text) return null;
  if (!hasEmoji(text)) {
    return <span className={className}>{text}</span>;
  }

  // Pure emoji mode (e.g. Option with only an icon "👑" or "🍎")
  if (isPureEmoji(text)) {
    return (
      <span
        className={`inline-block select-none leading-none drop-shadow-sm ${
          isQuestionTitle
            ? "text-5xl sm:text-6xl md:text-7xl my-1"
            : "text-3xl sm:text-4xl my-0.5"
        } ${emojiClassName || ""} ${className || ""}`}
        role="img"
        aria-label="visual clue"
      >
        {text}
      </span>
    );
  }

  // Split text by emojis and render each piece appropriately
  const parts = text.split(EMOJI_SPLIT_REGEX);

  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (!part) return null;

        if (EMOJI_TEST_REGEX.test(part)) {
          return (
            <span
              key={idx}
              className={`inline-block select-none leading-none align-middle mx-1 drop-shadow-sm transition-transform duration-300 hover:scale-125 ${
                isQuestionTitle
                  ? "text-[1.8em] sm:text-[2.2em] px-1 py-0.5 rounded-xl bg-amber-100/60 border border-amber-300/60 shadow-2xs"
                  : "text-[1.5em] sm:text-[1.7em]"
              } ${emojiClassName || ""}`}
              role="img"
              aria-label="visual clue"
            >
              {part}
            </span>
          );
        }

        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
}

export default EnlargedEmojiText;
