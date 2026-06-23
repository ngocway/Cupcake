const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const htmlPath = path.join(__dirname, '../public/games/sentence-builder/index.html')
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8')

  // We will manually extract the arrays from the HTML using regex
  // Level 1: 
  const extractLevel = (levelStr) => {
    const questions = []
    const regex = /{\s*image:\s*"([^"]+)",\s*expected:\s*\[([^\]]+)\],\s*pool:\s*\[([^\]]+)\],\s*audio:\s*"([^"]+)"\s*}/g
    let match
    while ((match = regex.exec(levelStr)) !== null) {
      questions.push({
        image: match[1],
        expected: match[2].replace(/"/g, '').split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')),
        pool: match[3].replace(/"/g, '').split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')),
        audio: match[4]
      })
    }
    return questions
  }

  // Extract sections
  const gameDataMatch = htmlContent.match(/const gameData = {([\s\S]*?)level1: \[([\s\S]*?)\],\s*level2: \[([\s\S]*?)\],\s*level3: \[([\s\S]*?)\]\s*};/);
  if (!gameDataMatch) {
    console.error("Could not find gameData in index.html")
    return
  }

  const level1Str = gameDataMatch[2]
  const level2Str = gameDataMatch[3]
  const level3Str = gameDataMatch[4]

  const level1Q = extractLevel(level1Str)
  const level2Q = extractLevel(level2Str)
  const level3Q = extractLevel(level3Str)

  console.log(`Found ${level1Q.length} Qs in Level 1`)
  console.log(`Found ${level2Q.length} Qs in Level 2`)
  console.log(`Found ${level3Q.length} Qs in Level 3`)

  // Clear existing games if any
  await prisma.sentenceBuilderGame.deleteMany({})

  // Create Games and Questions
  const insertGame = async (name, questions) => {
    const game = await prisma.sentenceBuilderGame.create({
      data: { name }
    })
    
    let index = 0;
    for (const q of questions) {
      await prisma.sentenceBuilderQuestion.create({
        data: {
          gameId: game.id,
          image: q.image,
          expected: q.expected,
          pool: q.pool,
          audio: q.audio,
          orderIndex: index++
        }
      })
    }
    console.log(`Migrated ${name} with ${questions.length} questions.`)
  }

  await insertGame("Level 1 (Easy)", level1Q)
  await insertGame("Level 2 (Medium)", level2Q)
  await insertGame("Level 3 (Hard)", level3Q)

  console.log("Migration complete!")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
