<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ElevenLabs TTS Voice Configuration
When generating audio using ElevenLabs (e.g. for flashcards, quiz questions, or lessons):
- **Voice**: Alice (`Xb7hH8MSUJpSbSDYk0k2`)
- **Speed**: `0.7`
- **Stability**: `0.80`
- **Use Speaker Boost**: `true`
- **Workaround (Padding)**: Prepend `"... "` to the text to generate natural silence at the beginning.
- **Processing**: Keep the silence in the output file (**do NOT trim the silence**), as this gives browser/hardware audio output time to initialize and prevents clipping the first word.

