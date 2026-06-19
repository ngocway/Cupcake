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

    let buffer: Buffer;
    let mimeType = 'image/jpeg';
    let ext = 'jpg';

    if (imageUrl.startsWith('data:')) {
      const base64Content = imageUrl.includes('base64,') ? imageUrl.split('base64,')[1] : imageUrl;
      buffer = Buffer.from(base64Content, 'base64');
      const match = imageUrl.match(/^data:([^;]+);base64,/);
      if (match) {
        mimeType = match[1];
        ext = mimeType.split('/')[1] || 'png';
      }
    } else {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        }
      });
      if (!response.ok) {
        return { success: false, error: `Failed to fetch external image (Status: ${response.status})` };
      }
      
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      mimeType = response.headers.get('content-type') || 'image/jpeg';
      ext = mimeType.split('/')[1] || 'jpg';
      if (ext === 'jpeg') ext = 'jpg';
    }
    
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

export async function uploadBase64Image(base64Data: string, assignmentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrlBase = process.env.NEXT_PUBLIC_R2_URL;

  if (!bucketName || !publicUrlBase) {
    throw new Error('R2_BUCKET_NAME or NEXT_PUBLIC_R2_URL is not set');
  }

  try {
    const s3Client = getR2Client();
    const base64Content = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;
    const buffer = Buffer.from(base64Content, 'base64');
    
    // Determine file type from base64 if present, default to png
    let contentType = 'image/png';
    let ext = 'png';
    const match = base64Data.match(/^data:([^;]+);base64,/);
    if (match) {
      contentType = match[1];
      ext = contentType.split('/')[1] || 'png';
    }

    const fileName = `${session.user.id}-${assignmentId}-${Date.now()}.${ext}`;
    const filePath = `uploads/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    const publicUrl = `${publicUrlBase.replace(/\/$/, '')}/${filePath}`;
    return { success: true, url: publicUrl };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error uploading base64' };
  }
}
