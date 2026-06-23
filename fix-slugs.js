const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

function toSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function ensureUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await p.assignment.findUnique({ where: { slug } });
    if (!existing) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
}

async function main() {
  // 1. Tìm tất cả assignments chưa có slug (null)
  const assignments = await p.assignment.findMany({
    where: { slug: null, status: 'PUBLIC' },
    select: { id: true, title: true, slug: true }
  });

  console.log(`Tìm thấy ${assignments.length} assignments chưa có slug:\n`);

  for (const a of assignments) {
    const baseSlug = toSlug(a.title);
    const slug = await ensureUniqueSlug(baseSlug);

    // Update assignment
    await p.assignment.update({
      where: { id: a.id },
      data: { slug }
    });

    // Update HomepageFeed
    await p.homepageFeed.updateMany({
      where: { sourceId: a.id },
      data: { slug }
    });

    console.log(`✅ "${a.title}"`);
    console.log(`   id:   ${a.id}`);
    console.log(`   slug: ${slug}\n`);
  }

  // 2. Cũng fix các bài trong HomepageFeed có slug rỗng (mà assignment đã có slug)
  const emptySlugFeeds = await p.homepageFeed.findMany({
    where: { slug: '', contentType: 'EXERCISE' },
    select: { id: true, sourceId: true, title: true }
  });

  if (emptySlugFeeds.length > 0) {
    console.log(`\nFix thêm ${emptySlugFeeds.length} HomepageFeed có slug rỗng...`);
    for (const feed of emptySlugFeeds) {
      const assignment = await p.assignment.findUnique({
        where: { id: feed.sourceId },
        select: { slug: true }
      });
      if (assignment?.slug) {
        await p.homepageFeed.update({
          where: { id: feed.id },
          data: { slug: assignment.slug }
        });
        console.log(`✅ Feed synced: ${feed.title} → ${assignment.slug}`);
      }
    }
  }

  console.log('\n🎉 Xong!');
}

main().finally(() => p.$disconnect());
