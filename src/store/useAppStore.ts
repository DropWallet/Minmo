import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSCRIPTION_ENABLED_KEY = 'transcription_enabled';

export interface TranscriptionJob {
  entryId: string;
  jobId?: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

interface AppState {
  // Transcription settings
  transcriptionEnabled: boolean;
  setTranscriptionEnabled: (enabled: boolean) => void;
  loadTranscriptionSetting: () => Promise<void>;
  
  // Active transcription jobs (for M2)
  activeTranscriptions: Map<string, TranscriptionJob>;
  addTranscriptionJob: (entryId: string, jobId?: string) => void;
  updateTranscriptionStatus: (entryId: string, status: TranscriptionJob['status'], error?: string) => void;
  removeTranscriptionJob: (entryId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  transcriptionEnabled: true,
  
  setTranscriptionEnabled: async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(TRANSCRIPTION_ENABLED_KEY, enabled.toString());
      set({ transcriptionEnabled: enabled });
    } catch (error) {
      console.error('Error saving transcription setting:', error);
    }
  },
  
  loadTranscriptionSetting: async () => {
    try {
      const value = await AsyncStorage.getItem(TRANSCRIPTION_ENABLED_KEY);
      if (value !== null) {
        set({ transcriptionEnabled: value === 'true' });
      }
    } catch (error) {
      console.error('Error loading transcription setting:', error);
    }
  },
  
  // Transcription job management (for M2)
  activeTranscriptions: new Map(),
  
  addTranscriptionJob: (entryId: string, jobId?: string) => {
    const newMap = new Map(get().activeTranscriptions);
    newMap.set(entryId, {
      entryId,
      jobId,
      status: 'pending',
    });
    set({ activeTranscriptions: newMap });
  },
  
  updateTranscriptionStatus: (entryId: string, status: TranscriptionJob['status'], error?: string) => {
    const newMap = new Map(get().activeTranscriptions);
    const existing = newMap.get(entryId);
    if (existing) {
      newMap.set(entryId, {
        ...existing,
        status,
        error,
      });
      set({ activeTranscriptions: newMap });
    }
  },
  
  removeTranscriptionJob: (entryId: string) => {
    const newMap = new Map(get().activeTranscriptions);
    newMap.delete(entryId);
    set({ activeTranscriptions: newMap });
  },
}));


