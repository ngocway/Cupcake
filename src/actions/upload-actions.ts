"use server"

import { auth } from '@/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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

export async function uploadMedia(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const file = formData.get('file') as File;
  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrlBase = process.env.NEXT_PUBLIC_R2_URL;

  if (!bucketName || !publicUrlBase) {
    throw new Error('R2_BUCKET_NAME or NEXT_PUBLIC_R2_URL is not set');
  }

  try {
    const s3Client = getR2Client();
    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    const publicUrl = `${publicUrlBase.replace(/\/$/, '')}/${filePath}`;
    return { success: true, url: publicUrl };
  } catch (error: any) {
    return { success: false, error: 'Upload failed: ' + error.message };
  }
}

export async function uploadUrlMedia(imageUrl: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!imageUrl) {
    return { success: false, error: 'No URL provided' };
  }

  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrlBase = process.env.NEXT_PUBLIC_R2_URL;

  if (!bucketName || !publicUrlBase) {
    throw new Error('R2_BUCKET_NAME or NEXT_PUBLIC_R2_URL is not set');
  }

  try {
    const s3Client = getR2Client();
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return { success: false, error: 'Failed to fetch external image' };
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    let ext = mimeType.split('/')[1] || 'jpg';
    if (ext === 'jpeg') ext = 'jpg';
    
    const fileName = `${session.user.id}-${Date.now()}.${ext}`;
    const filePath = `uploads/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      Body: buffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    const publicUrl = `${publicUrlBase.replace(/\/$/, '')}/${filePath}`;
    return { success: true, url: publicUrl };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error processing image URL' };
  }
}
