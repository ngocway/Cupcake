import { PrismaClient } from '@prisma/client';
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const map = {
  "animals and plants": "animals_plants_1781063615376.png",
  "colors and shapes": "colors_shapes_1781063625586.png",
  "school, home, city...": "school_home_city_1781063636663.png",
  "body parts": "body_parts_1781063646583.png",
  "nature": "nature_1781063656070.png",
  "human": "human_1781063667752.png",
  "activities": "activities_1781063677981.png",
  "science": "science_1781063690705.png",
  "level 3 (hard)": "level_3_hard_1781063700647.png"
};

async function run() {
  const sourceDir = "C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\ad849cca-6ec0-4736-b885-cb3805e2ab00";
  const targetDir = path.join(process.cwd(), "public", "games", "thumbnails");
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Copy images
  for (const [key, filename] of Object.entries(map)) {
    const src = path.join(sourceDir, filename);
    const niceName = filename.replace(/_\d+\.png$/, ".png");
    const dest = path.join(targetDir, niceName);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }

  // Update Match Word
  const mw = await prisma.matchWordGame.findMany();
  for (const game of mw) {
    const key = game.name.toLowerCase();
    const filename = map[key as keyof typeof map];
    if (filename) {
      const niceName = filename.replace(/_\d+\.png$/, ".png");
      await prisma.matchWordGame.update({
        where: { id: game.id },
        data: { thumbnailUrl: `/games/thumbnails/${niceName}` }
      });
      console.log(`Updated Match Word: ${game.name}`);
    }
  }

  // Update Sentence Builder
  const sb = await prisma.sentenceBuilderGame.findMany();
  for (const game of sb) {
    const key = game.name.toLowerCase();
    const filename = map[key as keyof typeof map];
    if (filename) {
      const niceName = filename.replace(/_\d+\.png$/, ".png");
      await prisma.sentenceBuilderGame.update({
        where: { id: game.id },
        data: { thumbnailUrl: `/games/thumbnails/${niceName}` }
      });
      console.log(`Updated Sentence Builder: ${game.name}`);
    }
  }

  console.log("Done mapping thumbnails!");
}

run().finally(() => prisma.$disconnect());
