const { PrismaClient } = require('./src/generated/client');
const p = new PrismaClient();

async function main() {
  const sourceId = 'cmpcng1lm0028vt8sxq25zjc4';
  
  const feedItem = await p.homepageFeed.findUnique({
    where: { sourceId },
    select: { id: true, sourceId: true, slug: true, title: true }
  });
  
  console.log('HomepageFeed item:', JSON.stringify(feedItem, null, 2));
  
  // Cũng kiểm tra thêm: có bao nhiêu bài không có slug trong feed?
  const noSlug = await p.homepageFeed.count({
    where: { slug: '' }
  });
  console.log('\nSố bài trong HomepageFeed có slug rỗng:', noSlug);
}

main().finally(() => p.$disconnect());
