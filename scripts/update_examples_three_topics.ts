import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const data = {
  'Literature & Art': [
    { word: 'Architecture', sentence: 'Look at the pretty architecture of the house.' },
    { word: 'Portrait', sentence: 'I draw a portrait of my mom.' },
    { word: 'Biography', sentence: 'A biography is a story book about a real person.' },
    { word: 'Philosophy', sentence: 'Philosophy is thinking about happy things.' },
    { word: 'Perspective', sentence: 'Perspective helps us see things in a new way.' },
    { word: 'Masterpiece', sentence: 'My drawing is a masterpiece!' },
    { word: 'Novelist', sentence: 'A novelist writes nice books.' },
    { word: 'Symphony', sentence: 'I listen to a beautiful symphony.' },
    { word: 'Metaphor', sentence: 'A metaphor is when we call someone a star.' },
    { word: 'Exhibition', sentence: 'We see many paintings at the art exhibition.' },
    { word: 'Sculpture', sentence: 'I make a pretty clay sculpture.' },
    { word: 'Canvas', sentence: 'I paint on a big white canvas.' },
    { word: 'Harmony', sentence: 'We sing a song together in harmony.' },
    { word: 'Abstract', sentence: 'This abstract painting has funny shapes.' },
    { word: 'Poetry', sentence: 'Poetry is writing short, sweet poems.' }
  ],
  'Hobbies & Sports': [
    { word: 'Photography', sentence: 'I love photography and taking photos.' },
    { word: 'Guitar', sentence: 'I play a song on my guitar.' },
    { word: 'Athletics', sentence: 'Athletics is about running and jumping.' },
    { word: 'Camping', sentence: 'Camping outside in a tent is fun.' },
    { word: 'Climbing', sentence: 'Climbing a tall tree is fun.' },
    { word: 'Baking', sentence: 'Baking cookies with mom is fun.' },
    { word: 'Painting', sentence: 'Painting a flower is fun.' },
    { word: 'Reading', sentence: 'Reading books before bed is nice.' },
    { word: 'Cycling', sentence: 'Cycling is riding my bike.' },
    { word: 'Gardening', sentence: 'Gardening is watering the plants.' },
    { word: 'Chess', sentence: 'I play chess with my brother.' },
    { word: 'Fishing', sentence: 'I go fishing at the lake.' },
    { word: 'Swimming', sentence: 'Swimming in the pool is fun.' },
    { word: 'Dancing', sentence: 'I like dancing to happy music.' },
    { word: 'Jogging', sentence: 'I go jogging in the park.' }
  ],
  'Space Exploration': [
    { word: 'Astronaut', sentence: 'The astronaut flies in space.' },
    { word: 'Rocket', sentence: 'The rocket zooms to the moon.' },
    { word: 'Galaxy', sentence: 'The galaxy has many bright stars.' },
    { word: 'Telescope', sentence: 'I look at the stars with a telescope.' },
    { word: 'Meteor', sentence: 'A meteor zooms across the sky.' },
    { word: 'Gravity', sentence: 'Gravity makes apples fall to the ground.' },
    { word: 'Planet', sentence: 'Earth is our beautiful planet.' },
    { word: 'Spaceship', sentence: 'I want to ride in a spaceship.' },
    { word: 'Comet', sentence: 'The comet has a long, bright tail.' },
    { word: 'Satellite', sentence: 'A satellite is high up in the sky.' },
    { word: 'Orbit', sentence: 'The Earth has an orbit around the sun.' },
    { word: 'Eclipse', sentence: 'An eclipse is when the moon covers the sun.' },
    { word: 'Alien', sentence: 'The green alien says hello.' },
    { word: 'Universe', sentence: 'The universe is very big and cool.' },
    { word: 'Asteroid', sentence: 'An asteroid is a big rock in space.' }
  ]
};

async function main() {
  for (const [topicName, updates] of Object.entries(data)) {
    console.log(`Updating topic: "${topicName}"`);
    for (const item of updates) {
      const result = await prisma.globalFlashcard.updateMany({
        where: {
          word: item.word,
          topic: {
            name: topicName
          }
        },
        data: {
          exampleSentence: item.sentence
        }
      });
      console.log(`  - Word: "${item.word}" -> "${item.sentence}" (updated ${result.count} records)`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
