import { supabase } from '../config/supabase';
import { notificationService } from './notificationService';

export interface SharedFile {
  id: string;
  tuteeId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  createdAt: string;
}

const BUCKET_NAME = 'shared-files';

/**
 * Upload a file to Supabase Storage and track it in shared_files table
 */
export const uploadFile = async (
  file: File,
  tuteeId: string,
  uploadedBy: string
): Promise<SharedFile> => {
  try {
    // 1. Upload to Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${tuteeId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Insert metadata into database
    const { data, error: dbError } = await supabase
      .from('shared_files')
      .insert({
        tutee_id: tuteeId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: uploadedBy,
      })
      .select()
      .single();

    if (dbError) {
      // Cleanup storage if database insert fails
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      throw dbError;
    }

    // Notify Admin of new file upload (only if uploaded by a student)
    if (uploadedBy !== 'Admin') {
      notificationService.notify({
        type: 'new_file',
        tuteeId: 'admin',
        title: 'New File Uploaded! 📄',
        message: `${uploadedBy} uploaded a new file: "${file.name}"`,
        url: '/tuition'
      });
    }

    return {
      id: data.id,
      tuteeId: data.tutee_id,
      fileName: data.file_name,
      filePath: data.file_path,
      fileSize: data.file_size,
      fileType: data.file_type,
      uploadedBy: data.uploaded_by,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Fetch all shared files for a tutee
 */
export const fetchSharedFiles = async (tuteeId: string): Promise<SharedFile[]> => {
  try {
    const { data, error } = await supabase
      .from('shared_files')
      .select('*')
      .eq('tutee_id', tuteeId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      tuteeId: item.tutee_id,
      fileName: item.file_name,
      filePath: item.file_path,
      fileSize: item.file_size,
      fileType: item.file_type,
      uploadedBy: item.uploaded_by,
      createdAt: item.created_at,
    }));
  } catch (error) {
    console.error('Error fetching shared files:', error);
    throw error;
  }
};

/**
 * Delete a shared file from database and storage
 */
export const deleteSharedFile = async (file: SharedFile): Promise<void> => {
  try {
    // 1. Remove from Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([file.filePath]);

    if (storageError) throw storageError;

    // 2. Remove from Database
    const { error: dbError } = await supabase
      .from('shared_files')
      .delete()
      .eq('id', file.id);

    if (dbError) throw dbError;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Get public URL for a file
 */
export const getFileUrl = (filePath: string): string => {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
};
