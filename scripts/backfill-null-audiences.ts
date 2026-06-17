import prisma from '../src/lib/prisma';
import { syncToHomepageFeed } from '../src/lib/feed-sync';

async function main() {
  console.log("Starting backfill for null/empty targetAudiences or audienceLevels...");

  // 1. Backfill Assignments
  const allAssignments = await prisma.assignment.findMany({
    where: { deletedAt: null }
  });

  const assignmentsToBackfill = allAssignments.filter(ass => 
    !ass.audienceLevels || 
    ass.audienceLevels === null || 
    !ass.targetAudiences || 
    ass.targetAudiences.length === 0
  );

  console.log(`Found ${assignmentsToBackfill.length} assignments to backfill.`);

  for (const ass of assignmentsToBackfill) {
    console.log(`Backfilling assignment ${ass.id}: ${ass.title}`);
    await prisma.assignment.update({
      where: { id: ass.id },
      data: {
        targetAudiences: ["learner"],
        audienceLevels: { "learner": "beginner" },
        level: "beginner"
      }
    });
  }

  // 2. Backfill Lessons
  const allLessons = await prisma.lesson.findMany({
    where: { deletedAt: null }
  });

  const lessonsToBackfill = allLessons.filter(lesson => 
    !lesson.audienceLevels || 
    lesson.audienceLevels === null || 
    !lesson.targetAudiences || 
    lesson.targetAudiences.length === 0
  );

  console.log(`Found ${lessonsToBackfill.length} lessons to backfill.`);

  for (const lesson of lessonsToBackfill) {
    console.log(`Backfilling lesson ${lesson.id}: ${lesson.title}`);
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        targetAudiences: ["learner"],
        audienceLevels: { "learner": "beginner" },
        level: "beginner"
      }
    });
  }

  // 3. Re-sync all public assignments & lessons to HomepageFeed
  console.log("Starting feed re-sync to HomepageFeed...");
  const publicFeeds = await prisma.homepageFeed.findMany();
  console.log(`Re-syncing ${publicFeeds.length} existing feed items...`);
  for (const feed of publicFeeds) {
    await syncToHomepageFeed(feed.sourceId, feed.contentType as any);
  }

  // Find PUBLIC lessons not in feed
  const activeLessons = await prisma.lesson.findMany({
    where: {
      deletedAt: null,
      isBlocked: false,
      assignment: { status: 'PUBLIC' }
    }
  });
  const existingSourceIds = new Set(publicFeeds.map(f => f.sourceId));
  for (const lesson of activeLessons) {
    if (!existingSourceIds.has(lesson.id)) {
      console.log(`Adding missing PUBLIC lesson ${lesson.id} to feed...`);
      await syncToHomepageFeed(lesson.id, 'LESSON');
    }
  }

  // Find PUBLIC assignments not in feed
  const activeExercises = await prisma.assignment.findMany({
    where: {
      deletedAt: null,
      status: 'PUBLIC',
      lesson: null
    }
  });
  for (const ex of activeExercises) {
    if (!existingSourceIds.has(ex.id)) {
      console.log(`Adding missing PUBLIC assignment ${ex.id} to feed...`);
      await syncToHomepageFeed(ex.id, 'EXERCISE');
    }
  }

  console.log("Backfill and feed sync completed!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
