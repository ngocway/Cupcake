---
name: create_flashcard
description: >
  Guidelines and complete procedure to create a single GlobalFlashcard record
  with full data: text content, image (FLUX), and 4 audio files (1 Gemini TTS
  call → silence detection → reconstruct). Use this every time the user asks
  to create a new flashcard card.
---

# Create a Complete GlobalFlashcard

## Overview

One card = **9 steps** using a single scratch TypeScript script.

```
Gemini 2.5 Flash  →  text content (definitions, translations, quiz)
DeepInfra FLUX    →  cartoon image  →  R2
Gemini TTS x-slow →  1 WAV (word. sentence. quiz.)
Windowed RMS      →  2 silence regions found  →  3 segments sliced
Reconstruct       →  audioUrl = word + word + sentence + word
Upload 4 audio    →  R2
Prisma            →  INSERT GlobalFlashcard + FlashcardTranslation[]
```

**Total TTS calls: exactly 1.**  
All 4 audio files (`audioUrl`, `audioWordUrl`, `audioSentenceUrl`, `quizAudioUrl`)
come from a single PCM buffer via buffer slicing and reconstruction.

---

## Step 0 — Pre-flight checks

Before writing the script, query the DB to get:
- `topicId` of the target topic
- List of **existing words** (to avoid duplicates)
- Current max `orderIndex`

```js
const topic = await prisma.flashcardTopic.findFirst({ where: { slug: 'in-playground' } });
const cards = await prisma.globalFlashcard.findMany({ where: { topicId: topic.id }, select: { word: true } });
```

Pick a word not already in the list. Choose simple, visual, kindergarten-appropriate vocabulary.

---

## Step 1 — Generate text content (Gemini 2.5 Flash)

Model: `gemini-2.5-flash`  
Temperature: `0.3`

Prompt must request **raw JSON** (no markdown fences). Fields required:

> [!IMPORTANT]
> **ALL native language fields** (`definitionVi`, `definitionTh`, `definitionId`, and all `translations.*`) must be SHORT 1–3 word direct names/translations. **NOT sentences or descriptions.**
> ❌ Bad: `"Một loài động vật rất to lớn có sừng trên mũi"` (13 words!)
> ✅ Good: `"Tê giác"` (2 words)

```json
{
  "phonetic": "/IPA notation/",
  "definition": "Simple English, max 10 words",
  "definitionVi": "SHORT direct Vietnamese name, 1-3 words max (e.g. 'Lạc đà', 'Con mèo') — NOT a sentence",
  "definitionTh": "SHORT direct Thai name, 1-3 words max — NOT a description",
  "definitionId": "SHORT direct Indonesian name, 1-3 words max — NOT a description",
  "exampleSentence": "Max 8 words, kindergarten level",
  "quizQuestion": "Max 7 words, very simple e.g. 'What do children climb on?'",
  "translations": {
    "zh": "SHORT direct Chinese name, 1-3 words",
    "ja": "SHORT direct Japanese name, 1-3 words",
    "ko": "SHORT direct Korean name, 1-3 words",
    "hi": "SHORT direct Hindi name, 1-3 words",
    "ar": "SHORT direct Arabic name, 1-3 words",
    "fr": "SHORT direct French name, 1-3 words",
    "de": "SHORT direct German name, 1-3 words",
    "es": "SHORT direct Spanish name, 1-3 words",
    "pt": "SHORT direct Portuguese name, 1-3 words",
    "ru": "SHORT direct Russian name, 1-3 words"
  }
}
```

Parse with `.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim()` before `JSON.parse`.


---

## Step 2 — Generate image (DeepInfra FLUX)

Model: `black-forest-labs/FLUX-1-dev`  
Size: `1024x1024`  
Response format: `b64_json`

**Image style prompt (always append to subject description):**
```
A simple 2D cartoon illustration of [WORD/SUBJECT]. 
Flat design, colorful, cute, child-friendly. No text. Clean white isolated background.
```

Upload to R2: `flashcards/global/[slug]-[timestamp].png`  
Content-Type: `image/png`

---

## Step 3 — Generate TTS audio (Gemini TTS, 1 call only)

### SSML structure

```xml
<speak><prosody rate="x-slow">[WORD]. [EXAMPLE_SENTENCE] [QUIZ_QUESTION]</prosody></speak>
```

- `rate="x-slow"` — slowest SSML keyword, clearly audible for kindergarten
- **No `<break>` tags** — they cause massive silence gaps (up to 52s) when combined with slow rate
- Natural period `.` and `?` punctuation creates detectable pause boundaries (~0.5–0.9s)
- Voice: `Aoede` (prebuiltVoiceConfig)

### Model rotation (try in order, fallback on 429)

```
1. gemini-2.5-flash-preview-tts
2. gemini-3.1-flash-tts-preview
3. gemini-2.5-pro-preview-tts
```

### PCM format (always fixed)

| Parameter | Value |
|-----------|-------|
| Sample rate | 24000 Hz |
| Bit depth | 16-bit |
| Channels | mono |
| WAV header | 44 bytes |

The API returns base64 raw PCM. Prepend a WAV header before saving or processing.

---

## Step 4 — Silence detection (Windowed RMS)

**Do NOT use Whisper** for this. Use PCM amplitude analysis.

### Algorithm

```typescript
const SILENCE_THRESHOLD = 100;                        // RMS below this = silent
const MIN_SILENCE_SAMPLES = Math.floor(24000 * 0.3);  // min 0.3s silence
const WINDOW_SAMPLES = Math.floor(24000 / 100);       // 10ms windows

for each 10ms window:
  rms = sqrt(mean(sample²))
  if rms < SILENCE_THRESHOLD → silent window
  consecutive silent windows >= MIN_SILENCE_SAMPLES → silence REGION
```

### Expected regions from `x-slow` TTS

With the structure `word. sentence. quiz.`:
- **Region 1** (after word): ~0.6–0.9s silence → sep1
- **Region 2** (after sentence): ~0.6–0.9s silence → sep2
- Optional leading/trailing regions (shorter, not used as separators)

If fewer than 2 regions found → error. Never retry with lower threshold without investigation.

### Separator selection

Always pick the **2 longest** silence regions, then sort by `start` position ascending.

```typescript
const [sep1, sep2] = [...silenceRegions]
  .sort((a, b) => (b.end - b.start) - (a.end - a.start))
  .slice(0, 2)
  .sort((a, b) => a.start - b.start);
```

---

## Step 5 — Slice 3 audio segments

```typescript
const seg1 = sliceWav(0,        sep1.start);   // word pronunciation
const seg2 = sliceWav(sep1.end, sep2.start);   // example sentence
const seg3 = sliceWav(sep2.end, totalSamples); // quiz question
```

Each slice gets a fresh WAV header (44 bytes + PCM data).

---

## Step 6 — Reconstruct audioUrl

`audioUrl` must follow the standard flashcard pattern: **word → word → sentence → word**

```typescript
const PAUSE_SAMPLES = Math.floor(24000 * 0.4);  // 0.4s digital silence between parts
const silencePcm = Buffer.alloc(PAUSE_SAMPLES * 2, 0);

audioUrl = wrapWav(Buffer.concat([
  getPcm(seg1), silencePcm,   // word.
  getPcm(seg1), silencePcm,   // word.
  getPcm(seg2), silencePcm,   // sentence.
  getPcm(seg1),               // word.
]));
```

This file is uploaded separately. It is **reconstructed from slices**, not the raw TTS output.

---

## Step 7 — Upload to R2

R2 key pattern: `flashcards/global/[slug]-[suffix]-[timestamp].wav`

| DB field | File suffix | Description |
|----------|-------------|-------------|
| `audioUrl` | `-full-` | word + word + sentence + word |
| `audioWordUrl` | `-word-` | word only |
| `audioSentenceUrl` | `-sentence-` | sentence only |
| `quizAudioUrl` | `-quiz-` | quiz question only |

Content-Type: `audio/wav`  
Public URL: `${NEXT_PUBLIC_R2_URL}/flashcards/global/[filename]`

---

## Step 8 — Determine orderIndex

```typescript
const maxCard = await prisma.globalFlashcard.findFirst({
  where: { topicId: TOPIC_ID },
  orderBy: { orderIndex: "desc" },
  select: { orderIndex: true },
});
const orderIndex = (maxCard?.orderIndex ?? -1) + 1;
```

---

## Step 9 — Insert into database

```typescript
await prisma.globalFlashcard.create({
  data: {
    topicId,
    word,
    phonetic,
    definition,
    definitionVi,
    definitionTh,
    definitionId,
    exampleSentence,
    imageUrl,
    audioUrl,           // word+word+sentence+word (reconstructed)
    audioWordUrl,       // word only
    audioSentenceUrl,   // sentence only
    quizQuestion,
    quizAudioUrl,       // quiz only
    orderIndex,
    translations: {
      createMany: {
        data: [
          { locale: "zh", definition: "..." },
          { locale: "ja", definition: "..." },
          { locale: "ko", definition: "..." },
          { locale: "hi", definition: "..." },
          { locale: "ar", definition: "..." },
          { locale: "fr", definition: "..." },
          { locale: "de", definition: "..." },
          { locale: "es", definition: "..." },
          { locale: "pt", definition: "..." },
          { locale: "ru", definition: "..." },
        ],
      },
    },
  },
});
```

Always include all 10 translation locales.

---

## Reference script

The canonical implementation is:

```
d:\Cupcakes\scratch\create-playground-card-v3.ts
```

When creating a card for a **different topic**, copy this script, update:
- `TOPIC_ID` — query from DB first
- `WORD` — chosen word (not a duplicate)
- `generateFluxImage()` prompt — describe the word visually
- All DB `data` fields — same structure

---

## Validation checklist

After running the script, verify in logs:

- [ ] `phonetic` is valid IPA
- [ ] `exampleSentence` ≤ 8 words, kindergarten level
- [ ] `quizQuestion` ≤ 7 words
- [ ] `translations` has exactly 10 locales
- [ ] All 4 audio URLs uploaded to R2 successfully
- [ ] `seg1` (word) duration: 0.5s – 3s
- [ ] `seg2` (sentence) duration: 1s – 6s
- [ ] `seg3` (quiz) duration: 1s – 5s
- [ ] Silence regions found: exactly ≥ 2
- [ ] Card visible in admin panel with correct topic

---

## Known issues & mitigations

| Issue | Cause | Fix |
|-------|-------|-----|
| 62s WAV generated | `rate="x-slow"` + `<break>` tags combined | **Never use `<break>` tags.** Use natural punctuation only. |
| 0 silence regions | TTS noise floor too high or no natural pauses | Check amplitude per 0.1s window; lower `SILENCE_THRESHOLD` to 60 |
| Whisper splits separator | Used NEXTSECTION technique | **Abandoned.** Use silence detection only. |
| Quiz audio distorted | Raw end-of-buffer PCM artifacts | Silence detection boundary avoids this |
| TTS 429 quota error | Single model rate limit | Model rotation handles automatically — no action needed |
| `rate=75%` ignored | Gemini TTS ignores percentage values | Use keyword `x-slow` or `slow` only |
