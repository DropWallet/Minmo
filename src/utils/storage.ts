import { File, Directory, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const audioDir = new Directory(Paths.document, 'audio');
const photoDir = new Directory(Paths.document, 'photos');

const APP_INSTALL_DATE_KEY = 'app_install_date';

export async function ensureDirectories() {
  try {
    if (!audioDir.exists) {
      audioDir.create({ intermediates: true, idempotent: true });
    }
  } catch (error) {
    console.error('Error creating audio directory:', error);
    throw error; // Re-throw so caller knows it failed
  }

  try {
    if (!photoDir.exists) {
      photoDir.create({ intermediates: true, idempotent: true });
    }
  } catch (error) {
    console.error('Error creating photo directory:', error);
    throw error;
  }
}

export async function saveAudioFile(uri: string, filename: string): Promise<string> {
  try {
    await ensureDirectories();
    const sourceFile = new File(uri);
    const destFile = new File(audioDir, filename);
    
    // copy() is synchronous, wrap in try-catch
    try {
      sourceFile.copy(destFile);
      return destFile.uri;
    } catch (error) {
      console.error('Error copying audio file:', error);
      throw new Error(`Failed to copy audio file: ${error}`);
    }
  } catch (error) {
    console.error('Error in saveAudioFile:', error);
    throw error;
  }
}

export async function savePhotoFile(uri: string, filename: string): Promise<string> {
  try {
    await ensureDirectories();
    const sourceFile = new File(uri);
    const destFile = new File(photoDir, filename);
    
    try {
      sourceFile.copy(destFile);
      return destFile.uri;
    } catch (error) {
      console.error('Error copying photo file:', error);
      throw new Error(`Failed to copy photo file: ${error}`);
    }
  } catch (error) {
    console.error('Error in savePhotoFile:', error);
    throw error;
  }
}

export async function deleteFile(uri: string): Promise<void> {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete(); // Synchronous
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Get or set the app install date
 * Returns the install date as a timestamp (number)
 * If not set, initializes it to the current date and returns it
 */
export async function getAppInstallDate(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(APP_INSTALL_DATE_KEY);
    if (stored) {
      return parseInt(stored, 10);
    }
    
    // First time - set install date to today (start of day)
    const now = new Date();
    const installDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    await AsyncStorage.setItem(APP_INSTALL_DATE_KEY, installDate.toString());
    return installDate;
  } catch (error) {
    console.error('Error getting app install date:', error);
    // Fallback to current date if storage fails
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }
}

