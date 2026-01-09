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

export interface SharedResource {
  id: string;
  tuteeId: string;
  resourceType: 'file' | 'link';
  
  // File-specific (required when resourceType='file')
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  fileType?: string;
  
  // Link-specific (required when resourceType='link')
  url?: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  
  // Common
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
): Promise<SharedResource> => {
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
      resourceType: 'file',
      fileName: data.file_name,
      filePath: data.file_path,
      fileSize: data.file_size,
      fileType: data.file_type,
      title: data.file_name,
      uploadedBy: data.uploaded_by,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Fetch all shared resources (files and links) for a tutee
 */
export const fetchSharedFiles = async (tuteeId: string): Promise<SharedResource[]> => {
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
      resourceType: item.resource_type || 'file', // Default to 'file' for backward compatibility
      // File fields
      fileName: item.file_name,
      filePath: item.file_path,
      fileSize: item.file_size,
      fileType: item.file_type,
      // Link fields
      url: item.url,
      title: item.title || item.file_name, // Use file_name as fallback title
      description: item.description,
      thumbnailUrl: item.thumbnail_url,
      // Common
      uploadedBy: item.uploaded_by,
      createdAt: item.created_at,
    }));
  } catch (error) {
    console.error('Error fetching shared resources:', error);
    throw error;
  }
};

/**
 * Delete a shared resource (file or link) from database and storage
 */
export const deleteSharedFile = async (resource: SharedResource): Promise<void> => {
  try {
    // 1. Remove from Storage (only for files)
    if (resource.resourceType === 'file' && resource.filePath) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([resource.filePath]);

      if (storageError) throw storageError;
    }

    // 2. Remove from Database
    const { error: dbError } = await supabase
      .from('shared_files')
      .delete()
      .eq('id', resource.id);

    if (dbError) throw dbError;
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
};

/**
 * Add a shared link
 */
export const addLink = async (
  url: string,
  title: string,
  tuteeId: string,
  uploadedBy: string,
  description?: string
): Promise<SharedResource> => {
  try {
    const { data, error } = await supabase
      .from('shared_files')
      .insert({
        tutee_id: tuteeId,
        resource_type: 'link',
        url: url,
        title: title,
        description: description,
        uploaded_by: uploadedBy,
      })
      .select()
      .single();

    if (error) throw error;

    // Notify Admin of new link (only if added by a student)
    if (uploadedBy !== 'Admin') {
      notificationService.notify({
        type: 'new_file',
        tuteeId: 'admin',
        title: 'New Link Shared! 🔗',
        message: `${uploadedBy} shared a new link: "${title}"`,
        url: '/tuition'
      });
    }

    return {
      id: data.id,
      tuteeId: data.tutee_id,
      resourceType: 'link',
      url: data.url,
      title: data.title,
      description: data.description,
      thumbnailUrl: data.thumbnail_url,
      uploadedBy: data.uploaded_by,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error adding link:', error);
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
