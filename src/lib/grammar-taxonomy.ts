/**
 * Grammar Taxonomy
 * Single source of truth for topics, lessons, and CEFR levels.
 * Used by both teacher dropdowns and student exercise browser.
 */

export type CefrLevel = "a1" | "a2" | "b1" | "b2" | "c1";

export interface GrammarLesson {
  id: string;       // slug-style, e.g. "past-simple"
  label: string;    // display name, e.g. "Past Simple"
  level: CefrLevel;
}

export interface GrammarTopic {
  id: string;       // slug-style, e.g. "tenses"
  label: string;    // English name
  labelVi: string;  // Vietnamese name
  icon: string;     // emoji icon
  lessons: GrammarLesson[];
}

export const CEFR_LEVELS: { id: CefrLevel; label: string; color: string; bg: string; border: string; ring: string }[] = [
  { id: "a1", label: "A1", color: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-300", ring: "ring-emerald-200" },
  { id: "a2", label: "A2", color: "text-sky-700",     bg: "bg-sky-100",     border: "border-sky-300",     ring: "ring-sky-200" },
  { id: "b1", label: "B1", color: "text-amber-700",   bg: "bg-amber-100",   border: "border-amber-300",   ring: "ring-amber-200" },
  { id: "b2", label: "B2", color: "text-orange-700",  bg: "bg-orange-100",  border: "border-orange-300",  ring: "ring-orange-200" },
  { id: "c1", label: "C1", color: "text-rose-700",    bg: "bg-rose-100",    border: "border-rose-300",    ring: "ring-rose-200" },
];

export const GRAMMAR_TOPICS: GrammarTopic[] = [
  {
    id: "tenses",
    label: "Tenses",
    labelVi: "Các thì",
    icon: "⏰",
    lessons: [
      { id: "present-simple",              label: "Present Simple",              level: "a1" },
      { id: "present-continuous",          label: "Present Continuous",          level: "a1" },
      { id: "past-simple",                 label: "Past Simple",                 level: "a2" },
      { id: "future-simple-will",          label: "Future Simple (Will)",        level: "a2" },
      { id: "be-going-to",                 label: "Be Going To",                 level: "a2" },
      { id: "past-continuous",             label: "Past Continuous",             level: "b1" },
      { id: "present-perfect",             label: "Present Perfect",             level: "b1" },
      { id: "present-perfect-continuous",  label: "Present Perfect Continuous",  level: "b2" },
      { id: "past-perfect",                label: "Past Perfect",                level: "b2" },
      { id: "future-continuous",           label: "Future Continuous",           level: "b2" },
      { id: "past-perfect-continuous",     label: "Past Perfect Continuous",     level: "c1" },
      { id: "future-perfect",              label: "Future Perfect",              level: "c1" },
      { id: "future-perfect-continuous",   label: "Future Perfect Continuous",   level: "c1" },
      { id: "tenses-review",              label: "Tenses Review",               level: "a2" },
    ],
  },
  {
    id: "nouns",
    label: "Nouns",
    labelVi: "Danh từ",
    icon: "👤",
    lessons: [
      { id: "singular-plural-nouns",       label: "Singular & Plural Nouns",       level: "a1" },
      { id: "countable-uncountable-nouns", label: "Countable & Uncountable Nouns", level: "a1" },
      { id: "proper-common-nouns",         label: "Proper & Common Nouns",         level: "a1" },
      { id: "collective-nouns",            label: "Collective Nouns",              level: "a2" },
      { id: "possessive-nouns",            label: "Possessive Nouns",              level: "a2" },
    ],
  },
  {
    id: "pronouns",
    label: "Pronouns",
    labelVi: "Đại từ",
    icon: "👥",
    lessons: [
      { id: "personal-pronouns",      label: "Personal Pronouns",      level: "a1" },
      { id: "object-pronouns",        label: "Object Pronouns",        level: "a1" },
      { id: "possessive-pronouns",    label: "Possessive Pronouns",    level: "a1" },
      { id: "demonstrative-pronouns", label: "Demonstrative Pronouns", level: "a1" },
      { id: "reflexive-pronouns",     label: "Reflexive Pronouns",     level: "a2" },
      { id: "indefinite-pronouns",    label: "Indefinite Pronouns",    level: "b1" },
      { id: "relative-pronouns",      label: "Relative Pronouns",      level: "b1" },
    ],
  },
  {
    id: "articles-determiners",
    label: "Articles & Determiners",
    labelVi: "Mạo từ & Từ hạn định",
    icon: "📝",
    lessons: [
      { id: "a-an-the",           label: "A / An / The",           level: "a1" },
      { id: "zero-article",       label: "Zero Article",           level: "a2" },
      { id: "this-that-these-those", label: "This / That / These / Those", level: "a1" },
      { id: "each-every",         label: "Each / Every",           level: "a2" },
      { id: "either-neither",     label: "Either / Neither",       level: "b1" },
      { id: "both",               label: "Both",                   level: "a1" },
      { id: "another-other-others", label: "Another / Other / Others", level: "b1" },
    ],
  },
  {
    id: "quantifiers",
    label: "Quantifiers",
    labelVi: "Lượng từ",
    icon: "📏",
    lessons: [
      { id: "some-any",          label: "Some / Any",          level: "a1" },
      { id: "much-many",         label: "Much / Many",         level: "a1" },
      { id: "few-a-few",         label: "Few / A Few",         level: "a2" },
      { id: "little-a-little",   label: "Little / A Little",   level: "a2" },
      { id: "a-lot-of-plenty-of", label: "A Lot Of / Plenty Of", level: "a2" },
      { id: "enough",            label: "Enough",              level: "a2" },
      { id: "too-much-too-many", label: "Too Much / Too Many", level: "b1" },
    ],
  },
  {
    id: "adjectives",
    label: "Adjectives",
    labelVi: "Tính từ",
    icon: "🎨",
    lessons: [
      { id: "basic-adjectives",         label: "Basic Adjectives",         level: "a1" },
      { id: "position-of-adjectives",   label: "Position of Adjectives",   level: "a1" },
      { id: "order-of-adjectives",      label: "Order of Adjectives",      level: "a2" },
      { id: "participial-adjectives",   label: "Participial Adjectives",   level: "b2" },
    ],
  },
  {
    id: "adverbs",
    label: "Adverbs",
    labelVi: "Trạng từ",
    icon: "🚀",
    lessons: [
      { id: "adverbs-frequency", label: "Frequency",        level: "a1" },
      { id: "adverbs-time",      label: "Time",             level: "a1" },
      { id: "adverbs-place",     label: "Place",            level: "a1" },
      { id: "adverbs-manner",    label: "Manner",           level: "a2" },
      { id: "adverbs-degree",    label: "Degree",           level: "b1" },
      { id: "sentence-adverbs",  label: "Sentence Adverbs", level: "b2" },
    ],
  },
  {
    id: "comparison",
    label: "Comparison",
    labelVi: "So sánh",
    icon: "⚖️",
    lessons: [
      { id: "comparative",         label: "Comparative",         level: "a2" },
      { id: "superlative",         label: "Superlative",         level: "a2" },
      { id: "as-as",               label: "As...As",             level: "a2" },
      { id: "less-than",           label: "Less...Than",         level: "b1" },
      { id: "the-more-the-more",   label: "The More...The More", level: "b2" },
    ],
  },
  {
    id: "verbs",
    label: "Verbs",
    labelVi: "Động từ",
    icon: "🔤",
    lessons: [
      { id: "be-verb",              label: "Be Verb",                       level: "a1" },
      { id: "action-verbs",         label: "Action Verbs",                  level: "a1" },
      { id: "stative-verbs",        label: "Stative Verbs",                 level: "a2" },
      { id: "verb-forms",           label: "Verb Forms (V1, V2, V3, V-ing)", level: "a1" },
      { id: "gerunds",              label: "Gerunds",                       level: "a2" },
      { id: "infinitives",          label: "Infinitives",                   level: "a2" },
      { id: "gerunds-vs-infinitives", label: "Gerunds vs Infinitives",      level: "b1" },
      { id: "verb-patterns",        label: "Verb Patterns",                 level: "b2" },
    ],
  },
  {
    id: "modal-verbs",
    label: "Modal Verbs",
    labelVi: "Động từ khuyết thiếu",
    icon: "💡",
    lessons: [
      { id: "can-cant",      label: "Can / Can't",   level: "a1" },
      { id: "could",         label: "Could",         level: "a2" },
      { id: "should",        label: "Should",        level: "a2" },
      { id: "must",          label: "Must",          level: "a2" },
      { id: "have-to",       label: "Have To",       level: "a2" },
      { id: "may-might",     label: "May / Might",   level: "b1" },
      { id: "would",         label: "Would",         level: "b1" },
      { id: "need-neednt",   label: "Need / Needn't", level: "b1" },
      { id: "used-to",       label: "Used To",       level: "b1" },
      { id: "be-able-to",    label: "Be Able To",    level: "b1" },
      { id: "ought-to",      label: "Ought To",      level: "b2" },
      { id: "shall",         label: "Shall",         level: "b2" },
    ],
  },
  {
    id: "sentence-structure",
    label: "Sentence Structure",
    labelVi: "Cấu trúc câu",
    icon: "🏗️",
    lessons: [
      { id: "basic-sentence-structure", label: "Basic Sentence Structure", level: "a1" },
      { id: "there-is-there-are",       label: "There Is / There Are",     level: "a1" },
      { id: "word-order",               label: "Word Order",               level: "a2" },
      { id: "subject-object",           label: "Subject & Object",         level: "a2" },
      { id: "sentence-types",           label: "Sentence Types",           level: "a2" },
      { id: "dummy-subject",            label: "Dummy Subject (It / There)", level: "b1" },
    ],
  },
  {
    id: "questions",
    label: "Questions",
    labelVi: "Câu hỏi",
    icon: "❓",
    lessons: [
      { id: "yes-no-questions",  label: "Yes/No Questions",  level: "a1" },
      { id: "wh-questions",      label: "WH Questions",      level: "a1" },
      { id: "question-tags",     label: "Question Tags",     level: "b1" },
      { id: "indirect-questions", label: "Indirect Questions", level: "b2" },
      { id: "subject-questions",  label: "Subject Questions",  level: "a2" },
      { id: "questions-with-prepositions", label: "Questions with Prepositions", level: "a2" },
    ],
  },
  {
    id: "negatives",
    label: "Negatives",
    labelVi: "Câu phủ định",
    icon: "❌",
    lessons: [
      { id: "basic-negatives",  label: "Basic Negatives",  level: "a1" },
      { id: "double-negatives", label: "Double Negatives", level: "b2" },
    ],
  },
  {
    id: "passive-voice",
    label: "Passive Voice",
    labelVi: "Câu bị động",
    icon: "🔄",
    lessons: [
      { id: "passive-present-past", label: "Passive Voice (Present & Past)", level: "b1" },
      { id: "passive-all-tenses",   label: "Passive Voice (All Tenses)",     level: "b2" },
    ],
  },
  {
    id: "reported-speech",
    label: "Reported Speech",
    labelVi: "Câu tường thuật",
    icon: "📢",
    lessons: [
      { id: "reported-statements", label: "Reported Statements", level: "b1" },
      { id: "reported-questions",  label: "Reported Questions",  level: "b1" },
      { id: "reported-commands",   label: "Reported Commands",   level: "b1" },
      { id: "reporting-verbs",     label: "Reporting Verbs",     level: "b2" },
    ],
  },
  {
    id: "conditionals",
    label: "Conditionals",
    labelVi: "Câu điều kiện",
    icon: "🔀",
    lessons: [
      { id: "zero-conditional",  label: "Zero Conditional",  level: "b1" },
      { id: "first-conditional", label: "First Conditional", level: "b1" },
      { id: "second-conditional", label: "Second Conditional", level: "b1" },
      { id: "third-conditional", label: "Third Conditional", level: "b2" },
      { id: "mixed-conditionals", label: "Mixed Conditionals", level: "c1" },
    ],
  },
  {
    id: "wish-unreal",
    label: "Wish & Unreal Situations",
    labelVi: "Mong ước & Tình huống phi thực",
    icon: "🌟",
    lessons: [
      { id: "wish",          label: "Wish",          level: "b2" },
      { id: "if-only",       label: "If Only",       level: "b2" },
      { id: "would-rather",  label: "Would Rather",  level: "b2" },
      { id: "its-time",      label: "It's Time",     level: "c1" },
    ],
  },
  {
    id: "clauses",
    label: "Clauses",
    labelVi: "Mệnh đề",
    icon: "🔗",
    lessons: [
      { id: "relative-clauses",         label: "Relative Clauses",         level: "b1" },
      { id: "noun-clauses",             label: "Noun Clauses",             level: "b2" },
      { id: "adverb-clauses",           label: "Adverb Clauses",           level: "b2" },
      { id: "reduced-relative-clauses", label: "Reduced Relative Clauses", level: "c1" },
      { id: "participle-clauses",       label: "Participle Clauses",       level: "c1" },
    ],
  },
  {
    id: "prepositions",
    label: "Prepositions",
    labelVi: "Giới từ",
    icon: "📍",
    lessons: [
      { id: "prepositions-time",        label: "Time",                 level: "a1" },
      { id: "prepositions-place",       label: "Place",                level: "a1" },
      { id: "prepositions-movement",    label: "Movement",             level: "a2" },
      { id: "common-prepositions",      label: "Common Prepositions",  level: "a2" },
    ],
  },
  {
    id: "conjunctions",
    label: "Conjunctions & Linking Words",
    labelVi: "Liên từ & Từ nối",
    icon: "🤝",
    lessons: [
      { id: "and-but-or",                label: "And / But / Or",                       level: "a1" },
      { id: "because-so",                label: "Because / So",                         level: "a2" },
      { id: "although-since-while",      label: "Although / Since / While",             level: "b1" },
      { id: "therefore-however",         label: "Therefore / However",                  level: "b1" },
      { id: "moreover-in-addition",      label: "Moreover / In Addition / Consequently", level: "b2" },
    ],
  },
  {
    id: "subject-verb-agreement",
    label: "Subject–Verb Agreement",
    labelVi: "Hòa hợp chủ-động từ",
    icon: "✅",
    lessons: [
      { id: "basic-agreement",          label: "Basic Agreement",          level: "a2" },
      { id: "either-or-neither-nor",    label: "Either...Or / Neither...Nor", level: "b2" },
    ],
  },
  {
    id: "advanced-grammar",
    label: "Advanced Grammar",
    labelVi: "Ngữ pháp nâng cao",
    icon: "⭐",
    lessons: [
      { id: "inversion",      label: "Inversion",      level: "c1" },
      { id: "cleft-sentences", label: "Cleft Sentences", level: "c1" },
      { id: "ellipsis",       label: "Ellipsis",       level: "c1" },
      { id: "subjunctive",    label: "Subjunctive",    level: "c1" },
      { id: "nominalisation", label: "Nominalisation", level: "c1" },
    ],
  },
  {
    id: "writing-rules",
    label: "Writing Rules",
    labelVi: "Quy tắc viết",
    icon: "✍️",
    lessons: [
      { id: "capitalization",        label: "Capitalization",        level: "a1" },
      { id: "numbers-dates",         label: "Numbers & Dates",       level: "a1" },
      { id: "basic-punctuation",     label: "Basic Punctuation",     level: "a2" },
      { id: "advanced-punctuation",  label: "Advanced Punctuation",  level: "b2" },
    ],
  },
];

/** Flat list of all lessons with their topic info — useful for search */
export const ALL_LESSONS_FLAT = GRAMMAR_TOPICS.flatMap(topic =>
  topic.lessons.map(lesson => ({ ...lesson, topicId: topic.id, topicLabel: topic.label, topicIcon: topic.icon }))
);

/** Get level config by id */
export function getLevelConfig(level: string) {
  return CEFR_LEVELS.find(l => l.id === level.toLowerCase());
}

/** Get topic by id */
export function getTopicById(topicId: string) {
  return GRAMMAR_TOPICS.find(t => t.id === topicId);
}

/** Get lessons for a topic at a specific level */
export function getLessonsForTopicAndLevel(topicId: string, level: string) {
  const topic = getTopicById(topicId);
  if (!topic) return [];
  return topic.lessons.filter(l => l.level === level.toLowerCase());
}

/** Get topics that have lessons at a specific level */
export function getTopicsForLevel(level: string) {
  const lvl = level.toLowerCase();
  return GRAMMAR_TOPICS.filter(t => t.lessons.some(l => l.level === lvl));
}

/** Normalize a raw level string from DB to CEFR id */
export function normalizeLevelId(raw: string | null | undefined): CefrLevel | null {
  if (!raw) return null;
  // Take first token if comma-separated, lowercase
  const first = raw.split(",")[0].trim().toLowerCase();
  if (first === "pre-a1-a1" || first === "pre-a1" || first === "a1") return "a1";
  if (first === "a2" || first === "elementary") return "a2";
  if (first === "b1") return "b1";
  if (first === "b2") return "b2";
  if (first === "c1") return "c1";
  return null;
}

/**
 * Short grammar formula / pattern for each lesson.
 * Used in the ExerciseGrid grammar banner to give students a quick preview
 * of the key rule before they start practicing.
 */
export const LESSON_FORMULAS: Record<string, string> = {
  // ── Tenses ────────────────────────────────────────────────────────────────
  "present-simple":             "S + V / V-s/es",
  "present-continuous":         "S + am/is/are + V-ing",
  "past-simple":                "S + V2 (did)",
  "future-simple-will":         "S + will + V",
  "be-going-to":                "S + am/is/are going to + V",
  "past-continuous":            "S + was/were + V-ing",
  "present-perfect":            "S + have/has + V3",
  "present-perfect-continuous": "S + have/has been + V-ing",
  "past-perfect":               "S + had + V3",
  "future-continuous":          "S + will be + V-ing",
  "past-perfect-continuous":    "S + had been + V-ing",
  "future-perfect":             "S + will have + V3",
  "future-perfect-continuous":  "S + will have been + V-ing",
  "tenses-review":              "All tenses",

  // ── Nouns ─────────────────────────────────────────────────────────────────
  "singular-plural-nouns":      "cat → cats / box → boxes",
  "countable-uncountable-nouns":"a/an + countable noun",
  "proper-common-nouns":        "London (proper) / city (common)",
  "collective-nouns":           "a team of / a flock of",
  "possessive-nouns":           "John's book / the dog's tail",

  // ── Pronouns ──────────────────────────────────────────────────────────────
  "personal-pronouns":      "I, you, he, she, it, we, they",
  "object-pronouns":        "me, you, him, her, it, us, them",
  "possessive-pronouns":    "mine, yours, his, hers, ours",
  "demonstrative-pronouns": "this / that / these / those",
  "reflexive-pronouns":     "myself, yourself, himself...",
  "indefinite-pronouns":    "someone, nothing, everywhere...",
  "relative-pronouns":      "who, which, that, whose, whom",

  // ── Articles & Determiners ────────────────────────────────────────────────
  "a-an-the":                 "a cat / an apple / the sun",
  "zero-article":             "I like music (no article)",
  "this-that-these-those":    "this/that + singular noun",
  "each-every":               "each/every + singular noun",
  "either-neither":           "either...or / neither...nor",
  "both":                     "both + plural noun / both...and",
  "another-other-others":     "another / the other / others",

  // ── Quantifiers ───────────────────────────────────────────────────────────
  "some-any":           "some (affirmative) / any (negative/question)",
  "much-many":          "much + uncountable / many + countable",
  "few-a-few":          "few (almost none) / a few (some)",
  "little-a-little":    "little (almost none) / a little (some)",
  "a-lot-of-plenty-of": "a lot of / plenty of + noun",
  "enough":             "enough + noun / adj + enough",
  "too-much-too-many":  "too much + uncountable / too many + countable",

  // ── Adjectives ────────────────────────────────────────────────────────────
  "basic-adjectives":       "a big/small/happy... noun",
  "position-of-adjectives": "adj + noun / noun + be + adj",
  "order-of-adjectives":    "size → color → material → noun",
  "participial-adjectives": "-ing (boring) / -ed (bored)",

  // ── Adverbs ───────────────────────────────────────────────────────────────
  "adverbs-frequency": "always / usually / often / never",
  "adverbs-time":      "yesterday, now, soon, already",
  "adverbs-place":     "here, there, inside, outside",
  "adverbs-manner":    "adj + -ly → quickly, slowly",
  "adverbs-degree":    "very / quite / too / enough",
  "sentence-adverbs":  "Fortunately, / Clearly, ...",

  // ── Comparison ────────────────────────────────────────────────────────────
  "comparative":       "adj-er / more + adj + than",
  "superlative":       "the + adj-est / the most + adj",
  "as-as":             "as + adj + as",
  "less-than":         "less + adj + than",
  "the-more-the-more": "The more..., the more...",

  // ── Verbs ─────────────────────────────────────────────────────────────────
  "be-verb":              "am / is / are (+ complement)",
  "action-verbs":         "run, jump, eat, write...",
  "stative-verbs":        "know, like, believe (no -ing!)",
  "verb-forms":           "V1 / V2 / V3 / V-ing",
  "gerunds":              "V-ing as subject / object",
  "infinitives":          "to + V (purpose / after adj)",
  "gerunds-vs-infinitives":"enjoy + V-ing / want + to V",
  "verb-patterns":        "V + obj + to V / V + that...",

  // ── Modal Verbs ───────────────────────────────────────────────────────────
  "can-cant":   "S + can / can't + V",
  "could":      "S + could + V (past / polite)",
  "should":     "S + should + V (advice)",
  "must":       "S + must + V (obligation)",
  "have-to":    "S + have to / has to + V",
  "may-might":  "S + may / might + V (possibility)",
  "would":      "S + would + V (conditional / polite)",
  "need-neednt":"S + need / needn't + V",
  "used-to":    "S + used to + V (past habit)",
  "be-able-to": "S + am/is/are able to + V",
  "ought-to":   "S + ought to + V (moral duty)",
  "shall":      "S + shall + V (offer / suggestion)",

  // ── Sentence Structure ────────────────────────────────────────────────────
  "basic-sentence-structure": "S + V + O",
  "there-is-there-are":       "There is + singular / There are + plural",
  "word-order":               "S + V + O + Place + Time",
  "subject-object":           "S (does) → V → O (receives)",
  "sentence-types":           "declarative / interrogative / imperative",
  "dummy-subject":            "It is + adj / There is + N",

  // ── Questions ─────────────────────────────────────────────────────────────
  "yes-no-questions":           "Do/Does/Did + S + V?",
  "wh-questions":               "WH + aux + S + V?",
  "question-tags":              "S + V, don't/isn't it?",
  "indirect-questions":         "Can you tell me where S + V?",
  "subject-questions":          "Who/What + V? (no do/does)",
  "questions-with-prepositions":"Who with? / What for?",

  // ── Negatives ────────────────────────────────────────────────────────────
  "basic-negatives":  "S + don't/doesn't/didn't + V",
  "double-negatives": "NOT: I didn't do nothing",

  // ── Passive Voice ─────────────────────────────────────────────────────────
  "passive-present-past": "S + is/are/was/were + V3",
  "passive-all-tenses":   "S + be (any tense) + V3",

  // ── Reported Speech ───────────────────────────────────────────────────────
  "reported-statements": "He said (that) + S + V (backshift)",
  "reported-questions":  "She asked if/what + S + V",
  "reported-commands":   "He told me to + V",
  "reporting-verbs":     "say, tell, ask, warn, suggest...",

  // ── Conditionals ─────────────────────────────────────────────────────────
  "zero-conditional":   "If + V, ... V (general truth)",
  "first-conditional":  "If + V, ... will + V",
  "second-conditional": "If + V2, ... would + V",
  "third-conditional":  "If + had + V3, ... would have + V3",
  "mixed-conditionals": "If + had + V3, ... would + V",

  // ── Wish & Unreal ─────────────────────────────────────────────────────────
  "wish":        "I wish + S + V2 / had + V3",
  "if-only":     "If only + S + V2 (regret)",
  "would-rather":"S + would rather + V (than V)",
  "its-time":    "It's time + S + V2",

  // ── Clauses ───────────────────────────────────────────────────────────────
  "relative-clauses":         "N + who/which/that + V",
  "noun-clauses":             "...that + S + V",
  "adverb-clauses":           "when/because/if/although + S + V",
  "reduced-relative-clauses": "N + V-ing / N + V3",
  "participle-clauses":       "V-ing / V3, + main clause",

  // ── Prepositions ──────────────────────────────────────────────────────────
  "prepositions-time":     "at + time / on + day / in + month",
  "prepositions-place":    "in / on / at (location)",
  "prepositions-movement": "to, from, through, past, along",
  "common-prepositions":   "in, on, at, by, for, with, of",

  // ── Conjunctions ─────────────────────────────────────────────────────────
  "and-but-or":           "A and B / A but B / A or B",
  "because-so":           "because + reason / so + result",
  "although-since-while": "Although S + V, S + V",
  "therefore-however":    "...; however, / therefore, ...",
  "moreover-in-addition": "Moreover, / In addition, / Consequently,",

  // ── Subject–Verb Agreement ────────────────────────────────────────────────
  "basic-agreement":       "He work-s / They work",
  "either-or-neither-nor": "Either A or B + V (agree with B)",

  // ── Advanced Grammar ─────────────────────────────────────────────────────
  "inversion":       "Never had I seen...",
  "cleft-sentences": "It is X that / what...",
  "ellipsis":        "She can [do it], and he can too",
  "subjunctive":     "I suggest he be... / If I were...",
  "nominalisation":  "achieve → achievement",

  // ── Writing Rules ─────────────────────────────────────────────────────────
  "capitalization":     "London, Monday, English (proper nouns)",
  "numbers-dates":      "5th May 2024 / twenty-one",
  "basic-punctuation":  ". , ! ? : ; — (basic marks)",
  "advanced-punctuation":"— ; \" \" ' ' (advanced marks)",
};

