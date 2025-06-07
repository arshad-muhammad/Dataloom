import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET_NAME = 'data-uploads';

export const uploadFile = async (file: File, path: string) => {
  try {
    console.log('Attempting to upload file:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      path: `${path}/${file.name}`
    });

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`${path}/${file.name}`, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    console.log('File uploaded successfully:', data);
    return data;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

export const getFileUrl = async (path: string) => {
  try {
    const { data } = await supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return data.publicUrl;
  } catch (error) {
    console.error('Failed to get file URL:', error);
    throw error;
  }
}; 