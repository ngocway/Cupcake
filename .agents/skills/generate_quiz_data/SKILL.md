---
name: generate_flashcard_quiz_data
description: Guidelines and procedure to automatically generate quiz questions and TTS audio files for flashcards across any age group (kindergarten, kid, teen, learner) using Gemini APIs.
---

# Skill: Generating Flashcard Quiz Questions & Audio

This skill instructs the agent on how to automatically generate quiz questions and synthesize voice audio (TTS) using Gemini APIs for flashcard topics of any age group in the Dolcake system.

## 1. When to Use This Skill
Trigger this skill whenever the user requests:
- To generate quiz questions, questions, or audio for flashcard topics.
- To seed/populate data to play the "Flashcard Quiz" game for specific topics or age groups (kindergarten, kid, teen, learner).

## 2. Core Technical Strategy

### Database Schema Context
The game fetches topics that have cards with populated `quizQuestion` and `quizAudioUrl`.
- **Target Table**: `GlobalFlashcard`
- **Required Fields**: 
  - `quizQuestion`: Text question (e.g. "Who says moo?")
  - `quizAudioUrl`: Public URL to the WAV audio file of the question.

### Step-by-Step Execution Workflow

1. **Prisma Connection**:
   - In scratch scripts, always use `const { PrismaClient } = require("@prisma/client")`. 
   - **DO NOT** require `../src/generated/client` as it causes lock issues (e.g. `EPERM` when Next.js dev server is running).

2. **Retrieve Cards**:
   - Query the `FlashcardTopic` by name/slug and `targetAudience` (e.g. `"kindergarten"`, `"kid"`, `"teen"`, `"learner"`).
   - Find all `GlobalFlashcard` records belonging to this topic.
   - Filter/skip cards that already have both `quizQuestion` and `quizAudioUrl` populated (unless the user explicitly requests a full regenerate).

3. **Generate Question Text (Gemini AI)**:
   - Call the `gemini-2.5-flash` model via HTTP API:
     `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`
   - Prompt the AI to output **ONLY** the plain question text, matching the child's age group. For kindergarten (age 2-5), keep the question simple and under 7 words (e.g., *"Who says meow?"*).

4. **Generate Question Audio (Gemini TTS API)**:
   - Call Gemini TTS models in rotation/fallback order:
     - `gemini-2.5-flash-preview-tts`
     - `gemini-3.1-flash-tts-preview`
     - `gemini-2.5-pro-preview-tts`
   - Use SSML `<speak><prosody rate="75%">${text}</prosody></speak>` for kindergarten to speak slowly. Use standard rates (`85%` to `100%`) for older groups.
   - **Fallback & Quota Policy**:
     - Handle `429` or `RESOURCE_EXHAUSTED` errors gracefully.
     - If a model is exhausted, add it to an `exhaustedModels` list, log a warning, and try the next available model in the fallback list immediately.
     - If **ALL** Gemini models are exhausted, **STOP the script and notify the user**. DO NOT use ElevenLabs or other paid TTS services unless explicitly requested.

5. **Upload & DB Update**:
   - Prepend the standard 44-byte WAV header to the raw PCM buffer returned by Gemini TTS.
   - Upload the WAV buffer to Cloudflare R2 bucket (`s3Client.send(new PutObjectCommand(...))`).
   - Update `GlobalFlashcard` in the database with the generated text and R2 URL.

6. **Rate Limiting**:
   - Implement a delay (e.g. 6.5 seconds) between card updates to respect Gemini API rate limits.

## 3. UI Flow Auto-Generation Integration
Both single-card AI creation and bulk topic AI creation flows in the Admin Panel automatically handle this:
- **Single Card Autofill**: Clicking "AI Tự Điền" (AI Auto Fill) generates definitions, translations, a quiz question suitable for the age group, and automatically sends calls to `/api/tts` to generate both the word pronunciation audio and the quiz question audio, storing them in the form.
- **Bulk Topic Generation**: Generating words for a new topic automatically specifies quiz questions for each word, generates their respective audios (word, split word, and quiz question audio), and saves them to the database.
