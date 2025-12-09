import { File, Directory, Paths } from 'expo-file-system';

const audioDir = new Directory(Paths.document, 'audio');
const photoDir = new Directory(Paths.document, 'photos');

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

