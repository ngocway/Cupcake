---
name: create_global_success_unit
description: >
  Guidelines, grade-level difficulty matrix, curriculum standards, and complete
  procedure to create or update the 4 Shared Textbook Library question sets
  (Vocabulary, English - Vietnamese, Conversations, Practice Quiz) for any
  Global Success Grade 1–12 Unit. Use this skill whenever the user asks to
  create, review, or update Global Success unit question sets.
---

# Create Global Success Unit Question Sets (Shared Textbook Library)

## Overview

Each **Global Success** unit consists of **4 standardized question sets** stored in `MatchWordTopic` (`teacherId: null`) and `MatchWordItem`:

| # | Set Type | Slug Pattern | Name Pattern | `gameMode` | Structure |
|---|----------|--------------|--------------|------------|-----------|
| 1 | **Vocabulary** | `shared-lib-g{G}-u{U}-vocab` | `Grade {G} - Unit {U}: {Unit Title} (Vocabulary)` | `library-image-text` | Flexible count (typically 1–2 rounds × 3–5 words covering all core unit vocabulary) |
| 2 | **English - Vietnamese** | `shared-lib-g{G}-u{U}-en-vi` | `Grade {G} - Unit {U}: {Unit Title} (English - Vietnamese)` | `library-text-text` | Flexible count (typically 1–2 rounds × 3–5 pairs covering core words & sentences) |
| 3 | **Conversations** | `shared-lib-g{G}-u{U}-conversations` | `Grade {G} - Unit {U}: {Unit Title} (Conversations)` | `library-text-text` | Flexible count (typically 1–2 rounds × 3–4 unambiguous pairs) |
| 4 | **Practice Quiz** | `shared-lib-g{G}-u{U}-quiz` | `Grade {G} - Unit {U}: {Unit Title} (Practice Quiz)` | `library-quiz` | Flexible count (typically 1–2 rounds × 4–5 questions covering the full unit) |

---

## Core Pedagogical & Formatting Rules

### 1. Exact Naming Convention (Required for UI Parser)
The `name` field of every `MatchWordTopic` record **MUST** follow:
```text
Grade <Grade> - Unit <Unit>: <Unit Title> (<Set Type>)
```
where `<Set Type>` is one of:
- `Vocabulary`
- `English - Vietnamese`
- `Conversations`
- `Practice Quiz`

This ensures `parseGlobalSuccessSet()` in [`src/app/teacher/_components/GlobalSuccessLibraryList.tsx`](file:///d:/Cupcakes/src/app/teacher/_components/GlobalSuccessLibraryList.tsx) groups the 4 sets under the right Grade and Unit card.

---

### 2. Sentence-Case Capitalization Rule (Phương án B)
- **Always capitalize the first letter** of every vocabulary word, phrase, sentence, and quiz option:
  - ✅ `"Pasta"`, `"Pizza"`, `"Apple tree"`, `"The pasta is yummy."`
  - ❌ `"pasta"`, `"pizza"`, `"apple tree"`
- **Exception (Lowercase Preserved)**:
  - **Fill-in-the-blank single-letter or mid-word options** (e.g. `"_asta 🍝"`, `"b_ll ⚽"`, `"B → ___"`) **MUST remain lowercase** (`"p"`, `"a"`, `"b"`, `"c"`).
  - **Phonics blending formulas** on the left side where a lowercase letter is explicitly blended (e.g. `"p + izza"` ↔ `"Pizza 🍕"`).

---

### 3. Grade-Level Difficulty Matrix (CRITICAL — Must Match Student Cognitive & Reading Level)

> [!IMPORTANT]
> Every question, prompt, distractor, and conversation response **MUST strictly match the reading level and textbook vocabulary of that specific Grade**. Never use meta-language instructions or out-of-level vocabulary that students at that grade have not learned.

#### A. Grade 1 & Grade 2 (Pre-A1 / Ages 6–7 — Early Phonics & 3–5 Word Sentences)
Students in Grades 1–2 are just learning letters A–Z, basic phonics words, and 1 short sentence pattern per unit. They **cannot** read long instructional meta-sentences.
1. **NO Meta-Language Instructions in Quiz Prompts**:
   - ❌ **FORBIDDEN in Grades 1–2**:
     - `"Fill in the missing letter: '_all'"` (students do not know *fill, missing, letter*)
     - `"Complete the sentence: 'I have a _______.'"` (students do not know *complete, sentence*)
     - `"Which word matches this picture?"` (students do not know *which, matches, picture*)
     - `"Which animal says 'Meow' and starts with C?"` (too long and complex)
     - `"What is the small letter for B?"`
     - IPA symbols like `"/ɪ/"`, `"/e/"`, `"/ɒ/"` (children do not know IPA notation)
   - ✅ **REQUIRED Ultra-Short Visual Prompts for Grades 1–2 (1–5 words max)**:
     - **Missing letter (Phonics)**: Show the gapped word + emoji directly:
       - `"_all ⚽"` (Options: `b`, `c`, `d`, `a`)
       - `"f_sh 🐟"` (Options: `i`, `a`, `o`, `e`)
     - **Uppercase ↔ Lowercase letter**: Use an arrow directly:
       - `"B → ___"` (Options: `b`, `d`, `p`, `q`)
       - `"a → ___"` (Options: `A`, `B`, `C`, `D`)
     - **Sentence completion**: Show the target textbook sentence with a blank + emoji directly (no prefix instruction):
       - `"I have a _______. 🚗"` (Options: `Car`, `Book`, `Ball`, `Bike`)
       - `"The _______ is yummy. 🍕"` (Options: `Pizza`, `Book`, `Bike`, `Ball`)
     - **Picture / Emoji word recognition**: Use simple 1–3 word prompts:
       - `"What is this? 🐱"` or `"Look: 🧢"` (Options: `Cat`, `Dog`, `Bird`, `Bee`)
     - **Dialogue response**:
       - `"Hi, I'm Bill." → "_________"` (Options: `Hi, Bill.`, `A ball.`, `A book.`, `A bike.`)
2. **Grade 1–2 Vocabulary Scope in `Conversations`**:
   - ❌ **FORBIDDEN**: Out-of-level adjectives like `crispy`, `crunchy`, `cheesy`, `fresh`, `delicious`, `round`.
   - ✅ **ALLOWED**: Only words from Grades 1–2 Global Success (`hi`, `hello`, `bye`, `goodbye`, `thank you`, `yes`, `no`, `look`, `nice`, `big`, `little`, `red`, `yummy`, `I have...`, `I like...`, `This is...`, `That is...`, `There is...`, `He/She is...`).

#### B. Grade 3 – Grade 5 (Primary A1 / Starters – Movers / Ages 8–10)
- Students can read short, direct questions (4–8 words) using structures taught in the textbook (`What's your name?`, `How old are you?`, `What colour is it?`, `Where is the...?`, `What is he doing?`, `Do you like...?`).
- Avoid complex academic wording in prompts; prefer direct Q&A, direct gap-fill sentences (`"She _______ listening to music."`), and natural 2-turn textbook dialogues.

#### C. Grade 6 – Grade 9 (Lower Secondary A2 – B1 / Ages 11–14)
- Focus on textbook topic vocabulary, pronunciation/stress patterns, grammar tenses, prepositions, conjunctions, and *Everyday English* communicative exchanges from each unit.

#### D. Grade 10 – Grade 12 (Upper Secondary B1 – B2 / Ages 15–17)
- Focus on unit theme vocabulary, collocations, phrasal verbs, synonyms/antonyms, relative clauses, cleft sentences, passive voice, conditionals, and realistic formal/informal dialogues.

---

### 4. Detailed Specification for Each of the 4 Sets

#### Part 1: Vocabulary (`library-image-text` — 8 items, 2 rounds × 4)
- **Round 0 (`roundIndex: 0`)**: 4 core vocabulary words directly from the Global Success textbook unit. For Phonics units in Grades 1–2, all 4 words in Round 0 must contain the target phonics letter/sound (do not insert a random verb from Lesson 3 that lacks the phonics letter).
- **Round 1 (`roundIndex: 1`)**: 4 extended age-appropriate words sharing the unit's target phonics letter/sound (Grades 1–2) or unit topic (Grades 3–12).
- **Images (`imageUrl`)**:
  - If `public/Global Success/grade{G}_unit{U}/<filename>.png` exists, use `"/Global Success/grade{G}_unit{U}/<filename>.png"`.
  - Otherwise set `imageUrl: null`.

#### Part 2: English - Vietnamese (`library-text-text` — 8 pairs, 2 rounds × 4)
- **Round 0 (`roundIndex: 0`)**: 3 core vocabulary words + 1 core textbook sentence paired with natural, concise Vietnamese translations (`word` = English, `labelB` = Vietnamese).
- **Round 1 (`roundIndex: 1`)**: 3 extended vocabulary words + 1 second textbook sentence paired with Vietnamese translations.

#### Part 3: Conversations (`library-text-text` — 8 pairs, 2 rounds × 4)
Must strictly obey **three rules**:
1. **No Duplicate Sentence Templates in the Same Round**:
   - ❌ **NEVER** put two sentences with the exact same grammatical template in the same round (e.g., do NOT put both `"I have a car."` and `"I have a cake."` in Round 0).
   - ✅ **ALWAYS** vary the sentence structures within each round:
     - **Pair 1**: Greeting, exclamation (`"Look! A cake! 🎂"`), or simple question/invitation using unit or cumulative prior-unit vocabulary.
     - **Pair 2**: Target textbook sentence pattern of the current unit.
     - **Pair 3 & Pair 4**: 2 Phonics blending pairs (`"c + at"` ↔ `"Cat 🐱"`, never math addition like `"10 + 3"`) for Grades 1–2, or 2 distinct dialogue Q&A pairs for Grades 3–12.
2. **100% Unambiguous 1-to-1 Matching**:
   - Every `labelB` in a round must clearly and uniquely match only one `word` in that round (never repeat the same target noun like `bike` across two pairs in the same round).
   - In Grades 3–12 where emojis are not used, never include two generic commands or questions in the same round whose responses (`"Yes, teacher!"`, `"Okay, Mum."`, `"It's blue."`) could be swapped. Each `labelB` must echo a specific keyword or semantic detail from its `word`.
3. **Strict Grade-Level Vocabulary**:
   - Every word in `word` and `labelB` must be readable by a student of that grade.

#### Part 4: Practice Quiz (`library-quiz` — 10 questions, 2 rounds × 5)
- **100% English Only**: All `question` prompts and `options` (`A`, `B`, `C`, `D`) **MUST be 100% in English**.
- **Grade-Appropriate Prompt Length & No Meta-Language**:
  - Grades 1–2: Direct gapped words (`"_all ⚽"`), letter arrows (`"B → ___"`), direct gapped sentences (`"I have a _______. 🚗"`), or `"What is this? 🐱"` (no meta-language instructions).
  - Grades 3–12: Direct questions or gap-fill sentences (`_______`) matching textbook vocabulary and grammar.
  - ❌ **NEVER** use `"Choose the odd one out:"` (since it provides no context on the question banner during interactive games) or academic meta-grammar prompts (`"Choose the correct position of the adverb of frequency:"`, `"Identify the subject in the sentence:"`, `"Which of the following is a simple sentence?"`). Convert all grammar checks into direct sentence gap-fills (`"She _______ late for school."`).
  - When testing the zero article in Grades 6–12, always format the option consistently as `"Ø (no article)"`.
- **Grammatically & Semantically Valid Distractors**:
  - All 4 options (`A`, `B`, `C`, `D`) must fit grammatically into the blank and belong to the same part of speech (e.g., after `"a _______"`, do not use plural nouns like `"Clocks"` or `"Locks"`; after `"He's _______. 🏃‍♂️"`, use action verbs `-ing` rather than nouns).
- **Varied Correct Option Positions**: Distribute `isCorrect: true` across `A`, `B`, `C`, and `D`.

---

## Step-by-Step Implementation Procedure

1. Create or update `scratch/seed-g<Grade>-unit<Unit>-library.ts` (or batch script) following all rules above.
2. Run `npx tsx scratch/seed-g<Grade>-unit<Unit>-library.ts` to upsert the 4 sets.
3. Increment `CACHE_KEY` in [`src/app/teacher/_components/GlobalSuccessLibraryList.tsx`](file:///d:/Cupcakes/src/app/teacher/_components/GlobalSuccessLibraryList.tsx#L281) so the client immediately loads the updated sets.
