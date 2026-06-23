import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const indoTranslations: Record<string, string> = {
  "Bed": "Kasur",
  "Table": "Meja",
  "Chair": "Kursi",
  "Sofa": "Sofa",
  "Television": "Televisi",
  "Lamp": "Lampu",
  "Window": "Jendela",
  "Door": "Pintu",
  "Clock": "Jam",
  "Carpet": "Karpet",
  "Pillow": "Bantal",
  "Blanket": "Selimut",
  "Cup": "Cangkir",
  "Spoon": "Sendok",
  "Fork": "Garpu",
  "Plate": "Piring",
  "Bowl": "Mangkuk",
  "Mirror": "Cermin",
  "Sink": "Wastafel",
  "Towel": "Handuk"
};

async function main() {
  try {
    console.log("Updating Indonesian translations...");
    
    // Find the topic first to ensure we only update cards for this topic
    const topic = await prisma.flashcardTopic.findUnique({
      where: {
        targetAudience_slug: {
          targetAudience: "kids-2-5",
          slug: "do-dung-trong-nha"
        }
      }
    });

    if (!topic) {
      console.log("Topic not found. Please ensure it exists.");
      return;
    }

    const cards = await prisma.globalFlashcard.findMany({
      where: { topicId: topic.id }
    });

    for (const card of cards) {
      if (indoTranslations[card.word]) {
        await prisma.globalFlashcard.update({
          where: { id: card.id },
          data: { definitionId: indoTranslations[card.word] }
        });
        console.log(`Updated ${card.word} -> ${indoTranslations[card.word]}`);
      }
    }
    console.log("Finished updating Indonesian translations.");
  } catch (error) {
    console.error("Error updating translations:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
