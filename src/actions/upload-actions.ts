"use server"

import { auth } from '@/auth';
import { createClient } from '@supabase/supabase-js';

export async function uploadMedia(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const file = formData.get('file') as File;
  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are missing');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Generate a unique filename using userId and timestamp to prevent collisions
  const fileExt = file.name.split('.').pop();
  const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  // Upload to the 'engmaster-media' bucket
  const { data, error } = await supabase.storage
    .from('engmaster-media')
    .upload(filePath, file);

  if (error) {
    return { success: false, error: 'Upload failed: ' + error.message };
  }

  // Retrieve the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('engmaster-media')
    .getPublicUrl(filePath);

  return { success: true, url: publicUrl };
}

export async function uploadUrlMedia(imageUrl: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!imageUrl) {
    return { success: false, error: 'No URL provided' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are missing');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return { success: false, error: 'Failed to fetch external image' };
    }
    const blob = await response.blob();
    const mimeType = blob.type || 'image/jpeg';
    let ext = mimeType.split('/')[1] || 'jpg';
    if (ext === 'jpeg') ext = 'jpg';
    
    const fileName = `${session.user.id}-${Date.now()}.${ext}`;
    const filePath = `uploads/${fileName}`;

    const { data, error } = await supabase.storage
      .from('engmaster-media')
      .upload(filePath, blob, { contentType: mimeType });

    if (error) {
      return { success: false, error: 'Upload failed: ' + error.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('engmaster-media')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error processing image URL' };
  }
}
