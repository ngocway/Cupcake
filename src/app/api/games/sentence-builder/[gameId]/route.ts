import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const gameId = (await params).gameId

    const game = await prisma.sentenceBuilderGame.findUnique({
      where: { id: gameId },
      include: {
        questions: {
          orderBy: {
            orderIndex: "asc"
          }
        }
      }
    })

    if (!game) {
      return NextResponse.json({ success: false, error: "Game not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, game })
  } catch (error: any) {
    console.error("API error getting sentence builder game:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
