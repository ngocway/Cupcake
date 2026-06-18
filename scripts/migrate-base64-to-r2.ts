import { PrismaClient } from '../src/generated/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

const getR2Client = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 environment variables are missing');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
};

const bucketName = process.env.R2_BUCKET_NAME;
const publicUrlBase = process.env.NEXT_PUBLIC_R2_URL;

async function uploadBase64ToR2(base64Data: string, prefix: string): Promise<string | null> {
  if (!bucketName || !publicUrlBase) return null;
  try {
    const s3Client = getR2Client();
    const base64Content = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;
    const buffer = Buffer.from(base64Content, 'base64');
    
    let contentType = 'image/png';
    let ext = 'png';
    const match = base64Data.match(/^data:([^;]+);base64,/);
    if (match) {
      contentType = match[1];
      ext = contentType.split('/')[1] || 'png';
      if (ext === 'jpeg') ext = 'jpg';
    }

    const fileName = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
    const filePath = `uploads/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    return `${publicUrlBase.replace(/\/$/, '')}/${filePath}`;
  } catch (error) {
    console.error('Upload Error:', error);
    return null;
  }
}

async function run() {
  console.log('Starting Base64 to R2 Migration...');
  let totalMigrated = 0;

  // 1. Migrate Assignments
  const assignments = await prisma.assignment.findMany({
    where: { thumbnail: { startsWith: 'data:image' } },
    select: { id: true, title: true, thumbnail: true }
  });
  console.log(`Found ${assignments.length} assignments with base64 thumbnail.`);
  for (const item of assignments) {
    if (item.thumbnail) {
      const url = await uploadBase64ToR2(item.thumbnail, `assignment-${item.id}`);
      if (url) {
        await prisma.assignment.update({ where: { id: item.id }, data: { thumbnail: url } });
        console.log(`Migrated Assignment ${item.id}`);
        totalMigrated++;
      }
    }
  }

  // 2. Migrate Lessons
  const lessons = await prisma.lesson.findMany({
    where: { thumbnail: { startsWith: 'data:image' } },
    select: { id: true, title: true, thumbnail: true }
  });
  console.log(`Found ${lessons.length} lessons with base64 thumbnail.`);
  for (const item of lessons) {
    if (item.thumbnail) {
      const url = await uploadBase64ToR2(item.thumbnail, `lesson-${item.id}`);
      if (url) {
        await prisma.lesson.update({ where: { id: item.id }, data: { thumbnail: url } });
        console.log(`Migrated Lesson ${item.id}`);
        totalMigrated++;
      }
    }
  }

  // 3. Migrate HomepageFeed
  const feedThumbs = await prisma.homepageFeed.findMany({
    where: { thumbnail: { startsWith: 'data:image' } },
    select: { id: true, sourceId: true, thumbnail: true }
  });
  console.log(`Found ${feedThumbs.length} HomepageFeed records with base64 thumbnail.`);
  for (const item of feedThumbs) {
    if (item.thumbnail) {
      const url = await uploadBase64ToR2(item.thumbnail, `feed-${item.id}`);
      if (url) {
        await prisma.homepageFeed.update({ where: { id: item.id }, data: { thumbnail: url } });
        console.log(`Migrated Feed Thumbnail ${item.id}`);
        totalMigrated++;
      }
    }
  }

  const feedTeachers = await prisma.homepageFeed.findMany({
    where: { teacherImage: { startsWith: 'data:image' } },
    select: { id: true, sourceId: true, teacherImage: true }
  });
  console.log(`Found ${feedTeachers.length} HomepageFeed records with base64 teacherImage.`);
  for (const item of feedTeachers) {
    if (item.teacherImage) {
      const url = await uploadBase64ToR2(item.teacherImage, `feedTeacher-${item.id}`);
      if (url) {
        await prisma.homepageFeed.update({ where: { id: item.id }, data: { teacherImage: url } });
        console.log(`Migrated Feed TeacherImage ${item.id}`);
        totalMigrated++;
      }
    }
  }

  // 4. Migrate Users
  const users = await prisma.user.findMany({
    where: { image: { startsWith: 'data:image' } },
    select: { id: true, image: true }
  });
  console.log(`Found ${users.length} Users with base64 image.`);
  for (const item of users) {
    if (item.image) {
      const url = await uploadBase64ToR2(item.image, `user-${item.id}`);
      if (url) {
        await prisma.user.update({ where: { id: item.id }, data: { image: url } });
        console.log(`Migrated User ${item.id}`);
        totalMigrated++;
      }
    }
  }

  console.log(`Migration complete! Total items migrated: ${totalMigrated}`);
  await prisma.$disconnect();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
