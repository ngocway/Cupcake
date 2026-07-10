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
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (apiKey) {
    try {
      const selectedVoiceId = voiceId && voiceId !== "default"
        ? voiceId
        : (process.env.ELEVENLABS_VOICE_ID || "Xb7hH8MSUJpSbSDYk0k2")

      const stability = parseFloat(process.env.ELEVENLABS_STABILITY || "0.80")
      const speed = parseFloat(process.env.ELEVENLABS_SPEED || "0.7")
      const useSpeakerBoost = process.env.ELEVENLABS_USE_SPEAKER_BOOST !== "false"
      const padding = process.env.ELEVENLABS_PADDING || "... "

      const speechText = padding + text

      const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_flash_v2"

      console.log(`Attempting ElevenLabs TTS: Voice=${selectedVoiceId}, Model=${modelId}, Speed=${speed}`)

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: speechText,
          model_id: modelId,
          voice_settings: {
            stability,
            similarity_boost: 0.75,
            use_speaker_boost: useSpeakerBoost,
            speed
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`ElevenLabs API returned status ${response.status}: ${errorText}`)
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer())

      return new Response(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      })
    } catch (error) {
      console.error("ElevenLabs TTS failed, falling back to MsEdgeTTS. Error:", error)
    }
  }

  // Fallback to MsEdgeTTS
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
