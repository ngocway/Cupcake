const { PrismaClient } = require('./src/generated/client');
const p = new PrismaClient();

async function run() {
  const title = 'My Lovely Family';
  
  // Find the homepage feed entry with the audioUrl
  const feeds = await p.homepageFeed.findMany({
    where: {
      title: {
        contains: title,
        mode: 'insensitive'
      }
    }
  });

  const feedWithAudio = feeds.find(f => f.audioUrl);
  if (!feedWithAudio) {
    console.log('No feed with audioUrl found.');
    return;
  }

  const audioUrl = feedWithAudio.audioUrl;
  console.log('Found audioUrl from feed:', audioUrl);

  // Find the lesson
  const lessons = await p.lesson.findMany({
    where: { 
      title: {
        contains: title,
        mode: 'insensitive'
      }
    }
  });

  for (const lesson of lessons) {
    console.log(`Updating lesson ${lesson.id} with audioUrl...`);
    await p.lesson.update({
      where: { id: lesson.id },
      data: { audioUrl }
    });

    if (lesson.assignmentId) {
      console.log(`Updating assignment ${lesson.assignmentId} with audioUrl...`);
      await p.assignment.update({
        where: { id: lesson.assignmentId },
        data: { audioUrl }
      });
    }
  }

  console.log('Successfully updated the lessons/assignments in database.');
}

run().catch(console.error).finally(() => p.$disconnect());
