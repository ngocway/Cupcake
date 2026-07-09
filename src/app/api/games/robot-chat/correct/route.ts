import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { rawTranscript, robotQuestion, suggestedAnswers } = await request.json()

    // Nothing to correct
    if (!rawTranscript?.trim()) {
      return NextResponse.json({ corrected: rawTranscript ?? "" })
    }

    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return NextResponse.json({ corrected: rawTranscript })
    }

    const systemPrompt = `You are a minimal ASR (speech recognition) error corrector for a children's English learning app.

Your job is ONLY to fix words that the microphone clearly misheard due to phonetic similarity.

ABSOLUTE RULES — violating any of these is wrong:
1. NEVER add words that are not in the original transcript
2. NEVER remove words from the original transcript
3. NEVER change the sentence structure or meaning
4. NEVER reconstruct or rewrite the sentence
5. Output must have the SAME number of words as the input (±1 max)
6. If the transcript is a coherent English sentence (even if different from suggestions), return it UNCHANGED
7. Only fix a word if it is OBVIOUSLY a phonetic mishearing (sounds nearly identical when spoken aloud)

WHEN TO RETURN UNCHANGED (most cases):
- Student said a valid sentence → return it as-is
- Student said something different from the suggestions → that is FINE, return as-is
- You are unsure whether it is an error → return as-is

ONLY FIX when ALL of these are true:
- The word makes NO sense in context
- There is a word in the suggestions that sounds nearly identical when spoken
- Swapping that one word makes the sentence coherent

Example ALLOWED fix: "I love pool" → "I love blue" (pool≈blue phonetically, one word swap)
Example NOT ALLOWED: adding words, rewriting, or matching to suggested answer structure`

    const suggestions = (suggestedAnswers || []).map((s: string) => `"${s}"`).join(", ")

    const userPrompt = `Robot's question: "${robotQuestion}"
Suggested answers (context only — do NOT force student's answer to match): ${suggestions}
Speech recognition transcript: "${rawTranscript}"

Corrected transcript:`

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 120,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    })

    if (!res.ok) {
      console.warn("[ASR Correct] OpenAI failed, using raw transcript")
      return NextResponse.json({ corrected: rawTranscript })
    }

    const data = await res.json()
    const corrected = data.choices?.[0]?.message?.content?.trim() || rawTranscript

    if (corrected !== rawTranscript) {
      console.log(`[ASR Correct] "${rawTranscript}" → "${corrected}"`)
    }

    return NextResponse.json({ corrected })
  } catch (error: any) {
    console.error("[ASR Correct] Error:", error)
    // Always fall back gracefully — never break the chat flow
    return NextResponse.json({ corrected: "" })
  }
}
