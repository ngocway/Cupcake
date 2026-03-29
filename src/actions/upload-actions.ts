"use server"

import { auth } from '@/auth';
import { createClient } from '@supabase/supabase-js';

export async function uploadMedia(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file provided');
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
    throw new Error('Upload failed: ' + error.message);
  }

  // Retrieve the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('engmaster-media')
    .getPublicUrl(filePath);

  return { success: true, url: publicUrl };
}
