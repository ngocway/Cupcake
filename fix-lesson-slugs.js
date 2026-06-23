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

async function ensureUniqueSlug(baseSlug, type) {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    let existing;
    if (type === 'lesson') existing = await p.lesson.findUnique({ where: { slug } });
    else existing = await p.assignment.findUnique({ where: { slug } });
    
    if (!existing) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
}

async function main() {
  const lessons = await p.lesson.findMany({
    where: { slug: null },
    select: { id: true, title: true }
  });

  console.log(`Tìm thấy ${lessons.length} lessons chưa có slug:\n`);

  for (const l of lessons) {
    const baseSlug = toSlug(l.title);
    const slug = await ensureUniqueSlug(baseSlug, 'lesson');

    await p.lesson.update({
      where: { id: l.id },
      data: { slug }
    });

    console.log(`✅ Lesson: "${l.title}"`);
    console.log(`   id:   ${l.id}`);
    console.log(`   slug: ${slug}\n`);
  }

  console.log('\n🎉 Xong!');
}

main().finally(() => p.$disconnect());
