"use server";

import { GRAMMAR_TOPICS, CEFR_LEVELS, getTopicById, type CefrLevel } from "@/lib/grammar-taxonomy";

export interface GrammarDetectResult {
  level: CefrLevel;
  grammarTopic: string;
  grammarLesson: string;
  confidence: "exact" | "ai";
}

// Normalize string for comparison
function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

// --- String match ---
function stringMatch(title: string): GrammarDetectResult | null {
  const normTitle = normalize(title);

  // Try to match lesson label first (most specific)
  for (const topic of GRAMMAR_TOPICS) {
    for (const lesson of topic.lessons) {
      const normLesson = normalize(lesson.label);
      if (normTitle.includes(normLesson) || normLesson.includes(normTitle.split(" ").slice(0, 3).join(" "))) {
        return {
          level: lesson.level,
          grammarTopic: topic.id,
          grammarLesson: lesson.id,
          confidence: "exact",
        };
      }
    }
  }

  // Try topic label match
  for (const topic of GRAMMAR_TOPICS) {
    const normTopic = normalize(topic.label);
    const normTopicVi = normalize(topic.labelVi);
    if (normTitle.includes(normTopic) || normTitle.includes(normTopicVi)) {
      // Pick the first lesson with any level as hint
      const firstLesson = topic.lessons[0];
      return {
        level: firstLesson?.level ?? "a1",
        grammarTopic: topic.id,
        grammarLesson: firstLesson?.id ?? "",
        confidence: "exact",
      };
    }
  }

  return null;
}

// --- Gemini AI fallback ---
async function aiMatch(title: string): Promise<GrammarDetectResult | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  const baseEndpoint = process.env.GEMINI_API_ENDPOINT || "https://generativelanguage.googleapis.com";
  const model = "gemini-2.5-flash";

  // Build taxonomy summary for prompt
  const taxonomySummary = GRAMMAR_TOPICS.map((t) => {
    const lessons = t.lessons.map((l) => `    - id:"${l.id}" label:"${l.label}" level:"${l.level}"`).join("\n");
    return `topic id:"${t.id}" label:"${t.label}":\n${lessons}`;
  }).join("\n\n");

  const cefrIds = CEFR_LEVELS.map((l) => l.id).join(", ");

  const prompt = `You are a grammar taxonomy classifier for an English learning platform.

Given an exercise title, identify the best matching:
- level (one of: ${cefrIds})
- grammarTopic (topic id from taxonomy)
- grammarLesson (lesson id from taxonomy)

TAXONOMY:
${taxonomySummary}

EXERCISE TITLE: "${title}"

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{"level":"a1","grammarTopic":"tenses","grammarLesson":"present-simple"}

If you cannot determine a field, use empty string "".`;

  try {
    const res = await fetch(
      `${baseEndpoint}/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 128 },
        }),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Extract JSON from response
    const jsonMatch = rawText.match(/\{[^}]+\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate level
    const level = CEFR_LEVELS.find((l) => l.id === parsed.level)?.id;
    if (!level) return null;

    // Validate topic
    const topic = GRAMMAR_TOPICS.find((t) => t.id === parsed.grammarTopic);
    if (!topic) return null;

    // Validate lesson (optional)
    const lesson = topic.lessons.find((l) => l.id === parsed.grammarLesson);

    return {
      level,
      grammarTopic: topic.id,
      grammarLesson: lesson?.id ?? "",
      confidence: "ai",
    };
  } catch {
    return null;
  }
}

// --- Public server action ---
export async function detectGrammarFromTitle(
  title: string
): Promise<GrammarDetectResult | null> {
  if (!title.trim()) return null;

  // 1. Try string match first (free, instant)
  const stringResult = stringMatch(title);
  if (stringResult) return stringResult;

  // 2. Fallback to Gemini AI
  return aiMatch(title);
}

// --- Generate sub-exercise title from grammar context (uses OpenAI) ---
export async function generateTitleFromGrammar(params: {
  level: string;
  grammarTopic: string;
  grammarLesson: string;
  /** Pass previously generated titles to avoid repetition */
  exclude?: string[];
}): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const { level, grammarTopic, grammarLesson, exclude = [] } = params;

  const topic = getTopicById(grammarTopic);
  const lesson = topic?.lessons.find((l) => l.id === grammarLesson);
  const topicLabel = topic?.label ?? grammarTopic;
  const lessonLabel = lesson?.label ?? grammarLesson;
  const levelLabel = level.toUpperCase();

  const excludeNote = exclude.length > 0
    ? `\nDo NOT use any of these already-used titles: ${exclude.map(t => `"${t}"`).join(", ")}.`
    : "";

  try {
    const openai = (await import("@/lib/openai")).default;
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1.3,
      max_tokens: 24,
      messages: [
        {
          role: "system",
          content: `You are an English grammar exercise designer for a language learning platform (CEFR ${levelLabel}).

Your job: given a grammar lesson, name ONE specific sub-exercise within that lesson.

A lesson has multiple sub-exercises that each focus on a narrow aspect. For example:
- "Past Simple" lesson → sub-exercises: "Past Simple: To Be", "Past Simple: Regular Verbs", "Past Simple: Irregular Verbs", "Past Simple: Negatives & Questions", "Past Simple: Time Expressions"
- "Present Perfect" lesson → sub-exercises: "Present Perfect: Have/Has + V3", "Present Perfect: Ever & Never", "Present Perfect vs Past Simple"
- "Nouns" lesson → sub-exercises: "Singular & Plural Nouns", "Countable & Uncountable Nouns", "Common & Proper Nouns"

Rules:
- English ONLY
- Max 8 words
- Be specific to a sub-aspect of the lesson
- No quotes around the title
- Return ONLY the title, nothing else${excludeNote}`,
        },
        {
          role: "user",
          content: `Topic: ${topicLabel}\nLesson: ${lessonLabel}\nLevel: ${levelLabel}\n\nGenerate ONE sub-exercise title for this lesson.`,
        },
      ],
    });

    const raw = (res.choices[0]?.message?.content ?? "").trim();
    return raw.replace(/^["']|["']$/g, "").trim() || null;
  } catch (e) {
    console.error("[generateTitleFromGrammar] error:", e);
    return null;
  }
}

