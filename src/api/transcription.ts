import { getTranscriptionEndpoint, isApiConfigured, getSupabaseAnonKey } from '@config/api';
import { getDeviceId } from '@utils/deviceId';
import { File } from 'expo-file-system';

export interface TranscriptionResponse {
  entryId: string;
  transcript: string;
  segments?: {
    start: number;
    end: number;
    text: string;
  }[];
  audio_url?: string;
  jobId?: string; // For async jobs (not used in M2, but included for future)
}

export interface TranscriptionError {
  message: string;
  code?: string;
  statusCode?: number;
}

const MAX_DURATION_SECONDS = 120; // 2 minutes max

/**
 * Validate audio duration before upload
 */
export function validateAudioDuration(durationSeconds: number): { valid: boolean; error?: string } {
  if (durationSeconds > MAX_DURATION_SECONDS) {
    return {
      valid: false,
      error: `Audio is too long. Maximum duration is ${MAX_DURATION_SECONDS} seconds.`,
    };
  }
  return { valid: true };
}

/**
 * Upload audio file for transcription
 * 
 * Validates audio duration, uploads the file to the transcription API,
 * and returns the transcript. The audio must be 120 seconds or less.
 * 
 * @param entryId - The entry ID to associate with this transcription
 * @param audioUri - Local URI of the audio file
 * @param durationSeconds - Duration of the audio in seconds (max 120)
 * @param prompt - Optional prompt text to provide context
 * @returns Promise resolving to TranscriptionResponse containing the transcript
 * @throws {Error} If API is not configured, duration is invalid, file not found, or upload fails
 */
export async function uploadTranscription(
  entryId: string,
  audioUri: string,
  durationSeconds: number,
  prompt?: string
): Promise<TranscriptionResponse> {
  // Check if API is configured
  if (!isApiConfigured()) {
    console.error('Transcription API is not configured');
    throw new Error('Transcription API is not configured. Please set EXPO_PUBLIC_API_URL in your environment variables.');
  }

  // Validate duration
  const validation = validateAudioDuration(durationSeconds);
  if (!validation.valid) {
    console.error('Audio duration validation failed', validation);
    throw new Error(validation.error || 'Invalid audio duration');
  }

  try {
    // Get device ID for authentication
    const deviceId = await getDeviceId();

    // Read audio file
    const audioFile = new File(audioUri);
    if (!audioFile.exists) {
      console.error('Audio file not found', { audioUri });
      throw new Error('Audio file not found');
    }

    // Create FormData for multipart upload
    const formData = new FormData();
    
    // Append audio file (React Native FormData format)
    // React Native's FormData expects a specific format that doesn't match TypeScript's FormData types
    // @ts-expect-error - React Native FormData accepts { uri, type, name } objects, but TypeScript types don't reflect this
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a',
      name: `audio-${entryId}.m4a`,
    });

    // Append metadata
    formData.append('entryId', entryId);
    formData.append('duration_seconds', durationSeconds.toString());
    if (prompt) {
      formData.append('prompt', prompt);
    }

    // Make API request
    const endpoint = getTranscriptionEndpoint();
    const supabaseAnonKey = getSupabaseAnonKey();
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-Device-ID': deviceId,
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        // Note: Content-Type will be set automatically by FormData
      },
      body: formData,
    });

    // Handle response
    if (!response.ok) {
      console.error('Transcription API error', {
        status: response.status,
        statusText: response.statusText,
      });
      const errorText = await response.text();
      let errorMessage = 'Failed to transcribe audio';
      
      // Try to parse error response
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        // If not JSON, use status text or default message
        if (response.status === 400) {
          errorMessage = 'Invalid audio file. Please check the file format and try again.';
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = 'Authentication failed. Please try again.';
        } else if (response.status === 429) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = errorText || errorMessage;
        }
      }

      const error: TranscriptionError = {
        message: errorMessage,
        statusCode: response.status,
      };
      throw error;
    }

    // Parse successful response
    const data: TranscriptionResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Transcription error:', error);
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    // Re-throw if it's already a TranscriptionError
    if (error && typeof error === 'object' && 'message' in error) {
      throw error;
    }
    
    // Wrap other errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(errorMessage);
  }
}

/**
 * Get transcription status for an async job
 * 
 * Not currently used in Milestone 2, but included for future async transcription support.
 * 
 * @param jobId - The job ID returned from an async transcription request
 * @returns Promise resolving to TranscriptionResponse with transcript or status
 * @throws {Error} If API is not configured or request fails
 */
export async function getTranscriptionStatus(jobId: string): Promise<TranscriptionResponse> {
  if (!isApiConfigured()) {
    throw new Error('Transcription API is not configured.');
  }

  const deviceId = await getDeviceId();
  const supabaseAnonKey = getSupabaseAnonKey();
  const endpoint = `${getTranscriptionEndpoint()}/${jobId}`;
  
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'X-Device-ID': deviceId,
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to get transcription status');
  }

  return response.json();
}

