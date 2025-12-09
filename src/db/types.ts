export interface Entry {
  id: string;
  created_at: number;
  recorded_at: number;
  prompt: string | null;
  duration_seconds: number | null;
  audio_local_uri: string;
  audio_remote_uri: string | null;
  photo_local_uri: string | null;
  photo_remote_uri: string | null;
  transcript: string | null;
  transcript_segments: string | null; // JSON string
  transcribed: boolean;
  tags: string | null; // JSON string
  favourite: boolean;
  updated_at: number;
}

export interface CreateEntryInput {
  prompt?: string;
  duration_seconds?: number;
  audio_local_uri: string;
  photo_local_uri?: string;
  recorded_at?: number;
  transcript?: string;
  created_at?: number;
}

