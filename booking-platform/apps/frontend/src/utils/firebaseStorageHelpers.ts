import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  UploadResult,
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

/**
 * Upload a file to Firebase Storage
 */
export const uploadFile = async (
  file: File,
  path: string,
  fileName?: string
): Promise<{ url: string; metadata: any }> => {
  try {
    // Generate a unique file name if not provided
    const uniqueFileName = fileName || `${Date.now()}-${file.name}`;
    
    // Create a reference to the file location
    const storageRef = ref(storage, `${path}/${uniqueFileName}`);
    
    // Upload the file
    const uploadResult: UploadResult = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    return {
      url: downloadURL,
      metadata: uploadResult.metadata,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Delete a file from Firebase Storage
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    // Create a reference to the file
    const fileRef = ref(storage, fileUrl);
    
    // Delete the file
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Upload multiple files to Firebase Storage
 */
export const uploadMultipleFiles = async (
  files: File[],
  path: string
): Promise<Array<{ url: string; metadata: any }>> => {
  try {
    const uploadPromises = files.map((file) => uploadFile(file, path));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    throw error;
  }
};