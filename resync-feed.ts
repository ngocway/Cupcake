import prisma from './src/lib/prisma';
import { syncToHomepageFeed } from './src/lib/feed-sync';

async function main() {
  // 1. Re-sync existing feed items
  const feeds = await prisma.homepageFeed.findMany();
  for (const feed of feeds) {
    console.log(`Re-syncing existing ${feed.contentType} ${feed.sourceId}...`);
    await syncToHomepageFeed(feed.sourceId, feed.contentType as any);
  }

  // 2. Find PUBLIC lessons NOT yet in feed and sync them
  const lessons = await prisma.lesson.findMany({
    where: {
      deletedAt: null,
      isBlocked: false,
      assignment: { status: 'PUBLIC' }
    },
    include: { assignment: true }
  });

  const existingSourceIds = new Set(feeds.map(f => f.sourceId));

  for (const lesson of lessons) {
    if (!existingSourceIds.has(lesson.id)) {
      console.log(`Adding missing LESSON ${lesson.id} (${lesson.title}) to feed...`);
      await syncToHomepageFeed(lesson.id, 'LESSON');
    }
  }

  // 3. Find PUBLIC standalone exercises NOT yet in feed
  const exercises = await prisma.assignment.findMany({
    where: {
      deletedAt: null,
      status: 'PUBLIC',
      lesson: null // standalone, not linked to a lesson
    }
  });

  for (const ex of exercises) {
    if (!existingSourceIds.has(ex.id)) {
      console.log(`Adding missing EXERCISE ${ex.id} (${ex.title}) to feed...`);
      await syncToHomepageFeed(ex.id, 'EXERCISE');
    }
  }

  console.log('Done! All PUBLIC content synced to HomepageFeed.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
