const { PrismaClient } = require('./src/generated/client');
const p = new PrismaClient();

async function main() {
  console.log('Fetching assignments...');
  const assignments = await p.assignment.findMany();
  let updatedAssignments = 0;

  for (const a of assignments) {
    if (a.targetAudiences && a.targetAudiences.length > 0) {
      const lowercased = a.targetAudiences.map(t => t.toLowerCase());
      const unique = Array.from(new Set(lowercased));
      // check if it needs update
      const needsUpdate = a.targetAudiences.length !== unique.length || a.targetAudiences.some((t, i) => t !== unique[i]);
      
      if (needsUpdate) {
        await p.assignment.update({
          where: { id: a.id },
          data: { targetAudiences: unique }
        });
        updatedAssignments++;
      }
    }
  }

  console.log(`Updated ${updatedAssignments} assignments.`);

  console.log('Fetching lessons...');
  const lessons = await p.lesson.findMany();
  let updatedLessons = 0;

  for (const l of lessons) {
    if (l.targetAudiences && l.targetAudiences.length > 0) {
      const lowercased = l.targetAudiences.map(t => t.toLowerCase());
      const unique = Array.from(new Set(lowercased));
      const needsUpdate = l.targetAudiences.length !== unique.length || l.targetAudiences.some((t, i) => t !== unique[i]);

      if (needsUpdate) {
        await p.lesson.update({
          where: { id: l.id },
          data: { targetAudiences: unique }
        });
        updatedLessons++;
      }
    }
  }

  console.log(`Updated ${updatedLessons} lessons.`);

  console.log('Fetching homepageFeed...');
  const feeds = await p.homepageFeed.findMany();
  let updatedFeeds = 0;

  for (const f of feeds) {
    if (f.targetAudiences && f.targetAudiences.length > 0) {
      const lowercased = f.targetAudiences.map(t => t.toLowerCase());
      const unique = Array.from(new Set(lowercased));
      const needsUpdate = f.targetAudiences.length !== unique.length || f.targetAudiences.some((t, i) => t !== unique[i]);

      if (needsUpdate) {
        await p.homepageFeed.update({
          where: { sourceId: f.sourceId },
          data: { targetAudiences: unique }
        });
        updatedFeeds++;
      }
    }
  }

  console.log(`Updated ${updatedFeeds} homepage feeds.`);
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
