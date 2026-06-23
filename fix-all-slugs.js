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

async function ensureUniqueSlug(model, baseSlug, excludeId) {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await model.findFirst({ where: { slug, id: { not: excludeId } } });
    if (!existing) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
}

async function main() {
  let totalFixed = 0;

  // ─── 1. ASSIGNMENTS ───────────────────────────────────────────────────────
  const assignments = await p.assignment.findMany({
    where: { slug: null },
    select: { id: true, title: true }
  });

  console.log(`\n📚 ASSIGNMENTS không có slug: ${assignments.length}`);

  for (const a of assignments) {
    const baseSlug = toSlug(a.title);
    if (!baseSlug) { console.log(`  ⚠️  Bỏ qua (title rỗng): ${a.id}`); continue; }
    const slug = await ensureUniqueSlug(p.assignment, baseSlug, a.id);

    await p.assignment.update({ where: { id: a.id }, data: { slug } });
    await p.homepageFeed.updateMany({ where: { sourceId: a.id }, data: { slug } });

    console.log(`  ✅ "${a.title}" → ${slug}`);
    totalFixed++;
  }

  // ─── 2. LESSONS ───────────────────────────────────────────────────────────
  const lessons = await p.lesson.findMany({
    where: { slug: null },
    select: { id: true, title: true }
  });

  console.log(`\n🎬 LESSONS không có slug: ${lessons.length}`);

  for (const l of lessons) {
    const baseSlug = toSlug(l.title);
    if (!baseSlug) { console.log(`  ⚠️  Bỏ qua (title rỗng): ${l.id}`); continue; }
    const slug = await ensureUniqueSlug(p.lesson, baseSlug, l.id);

    await p.lesson.update({ where: { id: l.id }, data: { slug } });
    await p.homepageFeed.updateMany({ where: { sourceId: l.id }, data: { slug } });

    console.log(`  ✅ "${l.title}" → ${slug}`);
    totalFixed++;
  }

  // ─── 3. HOMEPAGE FEED — sync slug rỗng còn sót ────────────────────────────
  const emptyFeeds = await p.homepageFeed.findMany({
    where: { slug: '' },
    select: { id: true, sourceId: true, contentType: true, title: true }
  });

  console.log(`\n🔄 HomepageFeed còn slug rỗng sau khi fix: ${emptyFeeds.length}`);

  for (const feed of emptyFeeds) {
    let slug = null;
    if (feed.contentType === 'EXERCISE') {
      const a = await p.assignment.findUnique({ where: { id: feed.sourceId }, select: { slug: true } });
      slug = a?.slug;
    } else if (feed.contentType === 'LESSON') {
      const l = await p.lesson.findUnique({ where: { id: feed.sourceId }, select: { slug: true } });
      slug = l?.slug;
    }

    if (slug) {
      await p.homepageFeed.update({ where: { id: feed.id }, data: { slug } });
      console.log(`  ✅ Feed synced: "${feed.title}" → ${slug}`);
      totalFixed++;
    } else {
      console.log(`  ⚠️  Không tìm thấy source: ${feed.sourceId} (${feed.contentType})`);
    }
  }

  // ─── 4. SUMMARY ───────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🎉 Tổng đã fix: ${totalFixed} items`);

  const remainAssign = await p.assignment.count({ where: { slug: null } });
  const remainLesson = await p.lesson.count({ where: { slug: null } });
  const remainFeed   = await p.homepageFeed.count({ where: { slug: '' } });

  console.log(`\n📊 Còn lại chưa có slug:`);
  console.log(`   Assignments: ${remainAssign}`);
  console.log(`   Lessons:     ${remainLesson}`);
  console.log(`   Feed (rỗng): ${remainFeed}`);
}

main().catch(console.error).finally(() => p.$disconnect());
