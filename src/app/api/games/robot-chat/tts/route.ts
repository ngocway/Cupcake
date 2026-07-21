import { NextResponse } from "next/server"

/**
 * Robot Chat TTS Route
 * Uses Deepgram Aura-2 as primary TTS provider.
 * Falls back to MsEdgeTTS if Deepgram is unavailable.
 */

import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts"

const EDGE_VOICE = "en-US-AnaNeural"

// Keep persistent MsEdgeTTS instance in memory to reuse WebSocket connections
let edgeTtsInstance: MsEdgeTTS | null = null

async function getEdgeTtsInstance() {
  if (!edgeTtsInstance) {
    const tts = new MsEdgeTTS()
    await tts.setMetadata(EDGE_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3)
    edgeTtsInstance = tts
  }
  return edgeTtsInstance
}

async function handleTtsRequest(text: string) {
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY

  // 1. Try Deepgram Aura-2 (primary)
  if (deepgramApiKey) {
    try {
      const model = process.env.DEEPGRAM_TTS_MODEL || "aura-2-thalia-en"
      const speed = process.env.DEEPGRAM_TTS_SPEED || "0.7"

      console.log(`[Robot Chat TTS -> Deepgram] model=${model} speed=${speed}: "${text.substring(0, 40)}..."`)

      const response = await fetch(
        `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}&speed=${speed}`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${deepgramApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Deepgram API returned status ${response.status}: ${errorText}`)
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer())

      return new Response(audioBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-TTS-Provider": "deepgram",
        },
      })
    } catch (error) {
      console.error("[Robot Chat TTS] Deepgram failed, falling back to MsEdgeTTS:", error)
    }
  }

  // 2. Fallback to MsEdgeTTS
  console.log(`[Robot Chat TTS -> MsEdgeTTS Fallback] "${text.substring(0, 40)}..."`)
  const tts = await getEdgeTtsInstance()
  const { audioStream } = tts.toStream(text)

  const chunks: Buffer[] = []
  for await (const chunk of audioStream) {
    chunks.push(chunk as Buffer)
  }
  const audioBuffer = Buffer.concat(chunks)

  return new Response(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-TTS-Provider": "msedge",
    },
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const text = searchParams.get("text") || ""

    if (!text) {
      return NextResponse.json({ error: "Text parameter is required" }, { status: 400 })
    }

    return await handleTtsRequest(text)
  } catch (error: any) {
    console.error("[Robot Chat TTS] GET error:", error)
    edgeTtsInstance = null
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text) {
      return NextResponse.json({ error: "Text parameter is required" }, { status: 400 })
    }

    return await handleTtsRequest(text)
  } catch (error: any) {
    console.error("[Robot Chat TTS] POST error:", error)
    edgeTtsInstance = null
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
