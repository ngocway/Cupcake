import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { text, voiceId, speed } = body

    const elevenKey = process.env.ELEVENLABS_API_KEY
    if (!elevenKey) {
      return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 })
    }

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.85,
          speed: speed
        }
      })
    })

    if (!res.ok) {
      const errorText = await res.text()
      return NextResponse.json({ error: errorText }, { status: res.status })
    }

    const arrayBuffer = await res.arrayBuffer()
    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg'
      }
    })
  } catch (error: any) {
    console.error("Robot tts API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
