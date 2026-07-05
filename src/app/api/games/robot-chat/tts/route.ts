import { NextResponse } from "next/server"
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts"

const VOICE_MAPPING: Record<string, string> = {
  // EXAVITQu4vr4xnSDxMaL (Bella, ElevenLabs) -> en-US-AnaNeural (Edge)
  "EXAVITQu4vr4xnSDxMaL": "en-US-AnaNeural",
  // pFZP5JQG7iQjIQuC4Bku (Lily, ElevenLabs) -> en-US-AnaNeural (Edge)
  "pFZP5JQG7iQjIQuC4Bku": "en-US-AnaNeural",
  "default": "en-US-AnaNeural"
}

// Keep persistent MsEdgeTTS instances in memory to reuse WebSocket connections
const ttsInstances: Record<string, MsEdgeTTS> = {}

async function getTtsInstance(voice: string) {
  if (!ttsInstances[voice]) {
    const tts = new MsEdgeTTS()
    // Pre-initialize and connect to the Microsoft Edge TTS WebSocket
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3)
    ttsInstances[voice] = tts
  }
  return ttsInstances[voice]
}

async function handleTtsRequest(text: string, voiceId: string) {
  const targetVoice = VOICE_MAPPING[voiceId] || VOICE_MAPPING["default"]
  const tts = await getTtsInstance(targetVoice)
  const { audioStream } = tts.toStream(text)

  const chunks: Buffer[] = []
  for await (const chunk of audioStream) {
    chunks.push(chunk as Buffer)
  }
  const audioBuffer = Buffer.concat(chunks)

  return new Response(audioBuffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const text = searchParams.get("text") || ""
    const voiceId = searchParams.get("voiceId") || ""

    if (!text) {
      return NextResponse.json({ error: "Text parameter is required" }, { status: 400 })
    }

    return await handleTtsRequest(text, voiceId)
  } catch (error: any) {
    console.error("Robot tts API error (Edge TTS GET):", error)
    Object.keys(ttsInstances).forEach(key => delete ttsInstances[key])
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { text, voiceId } = body

    if (!text) {
      return NextResponse.json({ error: "Text parameter is required" }, { status: 400 })
    }

    return await handleTtsRequest(text, voiceId)
  } catch (error: any) {
    console.error("Robot tts API error (Edge TTS POST):", error)
    Object.keys(ttsInstances).forEach(key => delete ttsInstances[key])
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
