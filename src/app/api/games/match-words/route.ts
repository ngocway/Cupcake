import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

const COLORS = [
  { color: '#ff6b6b', border: '#ee5253' },
  { color: '#0abde3', border: '#01a3a4' },
  { color: '#1dd1a1', border: '#10ac84' },
  { color: '#feca57', border: '#ff9f43' },
  { color: '#ff9ff3', border: '#f368e0' },
  { color: '#ff7f50', border: '#e15f41' },
  { color: '#1e90ff', border: '#5352ed' },
  { color: '#f1c40f', border: '#f39c12' },
  { color: '#1abc9c', border: '#16a085' },
  { color: '#e84393', border: '#d63031' }
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ageGroup = searchParams.get("age") || "2-5"
    const gameId = searchParams.get("gameId")

    let game;
    if (gameId) {
      game = await prisma.matchWordGame.findUnique({
        where: { id: gameId },
        include: {
          topics: {
            include: { items: true },
            orderBy: { createdAt: "asc" }
          }
        }
      })
    } else {
      game = await prisma.matchWordGame.findFirst({
        where: { ageGroup },
        orderBy: { order: "asc" },
        include: {
          topics: {
            include: { items: true },
            orderBy: { createdAt: "asc" }
          }
        }
      })
    }

    if (!game || !game.topics || game.topics.length === 0) {
      return NextResponse.json({
        topicsData: {},
        defaultTopic: ""
      })
    }

    const topicsData: Record<string, any> = {}
    let defaultTopic = ""

    game.topics.forEach((topic, idx) => {
      if (idx === 0) defaultTopic = topic.slug

      const items = topic.items.map(item => {
        // Randomly pick a color
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)]
        
        return {
          id: item.id,
          word: item.word,
          emoji: item.emoji || "✨",
          image: item.imageUrl,
          color: randomColor.color,
          border: randomColor.border
        }
      })

      topicsData[topic.slug] = {
        title: `${topic.name}! ${topic.icon}`,
        icon: `${topic.icon} ${topic.name}`,
        items: items
      }
    })

    return NextResponse.json({
      topicsData,
      defaultTopic
    })
  } catch (error: any) {
    console.error("API error getting match word data:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
