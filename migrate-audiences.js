// Migration script: Convert targetAudience (String) to targetAudiences (String[])
// Uses Prisma's $executeRawUnsafe for raw SQL

const { PrismaClient } = require('./node_modules/.prisma/client');

async function migrate() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Step 1: Check for duplicate slugs...');
    const dupes = await prisma.$queryRaw`
      SELECT slug, COUNT(*)::int as cnt 
      FROM "FlashcardTopic" 
      GROUP BY slug 
      HAVING COUNT(*) > 1
    `;
    
    if (dupes.length > 0) {
      console.log('Found duplicate slugs, merging them...');
      for (const dupe of dupes) {
        console.log(`  Slug "${dupe.slug}" has ${dupe.cnt} entries`);
        
        const topics = await prisma.$queryRaw`
          SELECT id, "targetAudience", name FROM "FlashcardTopic" 
          WHERE slug = ${dupe.slug} ORDER BY "createdAt" ASC
        `;
        
        const keepId = topics[0].id;
        console.log(`  Keeping id=${keepId}`);
        
        for (let i = 1; i < topics.length; i++) {
          const removeId = topics[i].id;
          await prisma.$executeRaw`
            UPDATE "GlobalFlashcard" SET "topicId" = ${keepId} WHERE "topicId" = ${removeId}
          `;
          await prisma.$executeRaw`
            DELETE FROM "FlashcardTopic" WHERE id = ${removeId}
          `;
          console.log(`  Merged and deleted duplicate id=${removeId}`);
        }
      }
    } else {
      console.log('No duplicate slugs found.');
    }

    console.log('\nStep 2: Add targetAudiences column...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "FlashcardTopic" 
      ADD COLUMN IF NOT EXISTS "targetAudiences" TEXT[] DEFAULT ARRAY['kid']::TEXT[]
    `);

    console.log('Step 3: Copy data from targetAudience to targetAudiences...');
    await prisma.$executeRawUnsafe(`
      UPDATE "FlashcardTopic" 
      SET "targetAudiences" = ARRAY[LOWER("targetAudience")]
      WHERE "targetAudience" IS NOT NULL
    `);

    console.log('Step 4: Drop old column and constraints...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "FlashcardTopic" 
      DROP CONSTRAINT IF EXISTS "FlashcardTopic_targetAudience_slug_key"
    `);
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "FlashcardTopic" 
      DROP COLUMN IF EXISTS "targetAudience"
    `);

    // Add unique constraint on slug (ignore if already exists)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "FlashcardTopic" 
        ADD CONSTRAINT "FlashcardTopic_slug_key" UNIQUE (slug)
      `);
    } catch (e) {
      console.log('  Unique constraint on slug already exists, skipping.');
    }

    console.log('\nMigration complete! ✅');
    
    const result = await prisma.$queryRawUnsafe(`SELECT id, name, slug, "targetAudiences" FROM "FlashcardTopic" LIMIT 5`);
    console.log('\nSample data:');
    result.forEach(r => console.log(`  ${r.name}: ${JSON.stringify(r.targetAudiences)}`));
    
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
