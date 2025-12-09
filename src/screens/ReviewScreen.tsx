import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { saveEntry, updateEntry, getEntry, deleteEntry, Entry } from '@db/queries';
import { saveAudioFile, savePhotoFile, deleteFile } from '@utils/storage';
import { IOS_DELAYS } from '@utils/constants';
import { formatDateWithOrdinal } from '@utils/dateFormat';
import { useAppStore } from '@store/useAppStore';
import { useTheme } from '@hooks/useTheme';
import { uploadTranscription } from '@api/transcription';
import { isApiConfigured } from '@config/api';
import { ButtonSecondary } from '@components/ButtonSecondary';
import { ButtonPrimary } from '@components/ButtonPrimary';
import Gradient from '@components/Gradient';
import { Icon } from '@components/Icon';
import { ShadowBox } from '@components/ShadowBox';

interface ReviewScreenProps {
  audioUri?: string;
  duration?: number;
  prompt?: string;
  existingEntry?: Entry; // For editing
  onCancel: () => void;
  onComplete: (entry: Entry) => void;
}

export function ReviewScreen({
  audioUri,
  duration,
  prompt,
  existingEntry,
  onCancel,
  onComplete,
}: ReviewScreenProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(existingEntry?.photo_local_uri || null);
  const [saving, setSaving] = useState(false);
  const [transcript, setTranscript] = useState<string>(existingEntry?.transcript || '');
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(existingEntry?.id || null);
  const entryIdRef = useRef<string | null>(existingEntry?.id || null);
  const hasAutoSavedRef = useRef<boolean>(false); // Track if auto-save has been triggered
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track timeout for cleanup
  const { colors } = useTheme();
  
  // Keep ref in sync with state when existingEntry changes
  useEffect(() => {
    if (existingEntry?.id) {
      entryIdRef.current = existingEntry.id;
      setCurrentEntryId(existingEntry.id);
    }
  }, [existingEntry?.id]);

  const { transcriptionEnabled, addTranscriptionJob, updateTranscriptionStatus, removeTranscriptionJob, activeTranscriptions } = useAppStore();
  
  // Get transcription status for this entry
  const transcriptionJob = currentEntryId ? activeTranscriptions.get(currentEntryId) : undefined;
  const isTranscribing = transcriptionJob && (transcriptionJob.status === 'uploading' || transcriptionJob.status === 'processing');

  const isEditing = !!existingEntry;
  const currentAudioUri = existingEntry?.audio_local_uri || audioUri || '';
  const currentDuration = existingEntry?.duration_seconds || duration || 0;
  const currentPrompt = existingEntry?.prompt || prompt || '';

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Update transcript when existingEntry changes (e.g., after transcription completes)
  useEffect(() => {
    if (existingEntry?.transcript && existingEntry.transcript !== transcript) {
      setTranscript(existingEntry.transcript);
    }
  }, [existingEntry?.transcript, existingEntry?.id, transcript]);

  // Auto-save entry when ReviewScreen opens (for new recordings only)
  // This effect handles iOS timing issues by using a small delay to ensure props are set
  useEffect(() => {
    // Clear any existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }

    // Only auto-save if it's a new recording (not editing) and not already saved
    if (!isEditing && !hasAutoSavedRef.current && !currentEntryId && audioUri && duration > 0) {
      const autoSave = async () => {
        try {
          setSaving(true);
          hasAutoSavedRef.current = true; // Mark as auto-saved to prevent duplicate saves
          
          // Save audio file to permanent location
          const audioFilename = `audio-${Date.now()}.m4a`;
          const savedAudioUri = await saveAudioFile(audioUri, audioFilename);

          // Create entry without photo (user can add photo later)
          const entry = await saveEntry({
            audio_local_uri: savedAudioUri,
            duration_seconds: duration,
            prompt: prompt || '',
            transcribed: false,
          });
          
          // Set current entry ID for transcription status tracking
          entryIdRef.current = entry.id;
          setCurrentEntryId(entry.id);
          
          // Start transcription immediately if enabled
          if (transcriptionEnabled && isApiConfigured() && duration > 0) {
            startTranscription(entry.id, savedAudioUri, duration, prompt);
          }
          
          setSaving(false);
        } catch (error) {
          console.error('Error auto-saving entry:', error);
          hasAutoSavedRef.current = false; // Reset on error so user can retry
          setSaving(false);
          Alert.alert(
            'Save Error',
            'Unable to save your moment. Please try again.',
            [{ text: 'OK' }]
          );
        }
      };
      
      // Use a small delay on iOS to ensure state updates have settled
      // This handles iOS-specific timing issues where props might not be immediately available
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave();
        autoSaveTimeoutRef.current = null;
      }, IOS_DELAYS.STATE_SETTLE);
    }

    // Cleanup function
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    };
  }, [isEditing, audioUri, duration, prompt, transcriptionEnabled]); // Removed currentEntryId to avoid blocking retries

  const playSound = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: currentAudioUri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (error) {
      console.error('Error playing sound:', error);
      Alert.alert(
        'Playback Error',
        'Unable to play audio. The file may be missing or corrupted.',
        [{ text: 'OK' }]
      );
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        'Photo Error',
        'Unable to access your photo library. Please check app permissions and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const takePhoto = async () => {
    try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(
                'Camera Permission Required',
                'MinMo needs camera access to take photos. Please enable it in your device settings.',
                [{ text: 'OK' }]
              );
              return;
            }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(
        'Camera Error',
        'Unable to access camera. Please check app permissions and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Start transcription upload for a new entry
   * This runs in the background and updates the entry when complete
   */
  const startTranscription = async (
    entryId: string,
    audioUri: string,
    durationSeconds: number,
    prompt?: string
  ) => {
    try {
      // Add job to store
      addTranscriptionJob(entryId);
      updateTranscriptionStatus(entryId, 'uploading');

      // Upload for transcription
      const response = await uploadTranscription(entryId, audioUri, durationSeconds, prompt);

      // Update status to processing
      updateTranscriptionStatus(entryId, 'processing');

      // Update entry with transcript
      const updated = await updateEntry(entryId, {
        transcript: response.transcript,
        transcribed: true,
      });

      if (updated) {
        // Update local transcript state if this is the current entry
        // For new entries (not editing), always update since we're on the ReviewScreen
        // For editing, only update if it matches the existing entry
        if (!isEditing || entryIdRef.current === entryId || existingEntry?.id === entryId) {
          setTranscript(response.transcript);
          // Ensure currentEntryId is set so transcriptionJob can be found
          if (entryIdRef.current === entryId) {
            setCurrentEntryId(entryId);
          }
        }
        updateTranscriptionStatus(entryId, 'completed');
        
        // Remove job after a short delay (so UI can show completion)
        setTimeout(() => {
          removeTranscriptionJob(entryId);
        }, 2000);
      } else {
        throw new Error('Failed to update entry with transcript');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to transcribe audio';
      updateTranscriptionStatus(entryId, 'failed', errorMessage);
      
      // Show error to user (non-blocking)
      Alert.alert(
        'Transcription Error',
        errorMessage,
        [{ text: 'OK' }]
      );
      
      // Remove job after showing error
      setTimeout(() => {
        removeTranscriptionJob(entryId);
      }, 5000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isEditing && existingEntry) {
        // Update existing entry
        let savedPhotoUri: string | null | undefined;
        
        // If photo changed, save new photo
        if (photoUri && photoUri !== existingEntry.photo_local_uri) {
          const photoFilename = `photo-${Date.now()}.jpg`;
          savedPhotoUri = await savePhotoFile(photoUri, photoFilename);
          
          // Delete old photo file if it exists and is different
          if (existingEntry.photo_local_uri && existingEntry.photo_local_uri !== photoUri) {
            try {
              await deleteFile(existingEntry.photo_local_uri);
            } catch (error) {
              console.error('Error deleting old photo file:', error);
              // Continue even if deletion fails
            }
          }
        } else if (!photoUri && existingEntry.photo_local_uri) {
          // User removed photo - delete the file and set to null
          try {
            await deleteFile(existingEntry.photo_local_uri);
          } catch (error) {
            console.error('Error deleting photo file:', error);
            // Continue even if deletion fails
          }
          savedPhotoUri = null; // Use null, not undefined, to clear the field
        } else {
          // No change to photo - don't update the field
          savedPhotoUri = undefined;
        }

        const updated = await updateEntry(existingEntry.id, {
          photo_local_uri: savedPhotoUri,
          transcript: transcript || null,
        });
        
        if (!updated) {
          throw new Error('Failed to update entry');
        }
        onComplete(updated);
      } else if (currentEntryId) {
        // Entry already auto-saved - just update photo if added
        let savedPhotoUri: string | null | undefined;
        
        if (photoUri) {
          // Save new photo
          const photoFilename = `photo-${Date.now()}.jpg`;
          savedPhotoUri = await savePhotoFile(photoUri, photoFilename);
        } else {
          // No photo - don't update the field
          savedPhotoUri = undefined;
        }

        const updated = await updateEntry(currentEntryId, {
          photo_local_uri: savedPhotoUri,
        });
        
        if (!updated) {
          throw new Error('Failed to update entry');
        }
        // Don't close - let user see transcript or add more details
        setSaving(false);
      } else {
        // Fallback: Create new entry (shouldn't happen if auto-save worked)
        const audioFilename = `audio-${Date.now()}.m4a`;
        const savedAudioUri = await saveAudioFile(currentAudioUri, audioFilename);

        let savedPhotoUri: string | undefined;
        if (photoUri) {
          const photoFilename = `photo-${Date.now()}.jpg`;
          savedPhotoUri = await savePhotoFile(photoUri, photoFilename);
        }

        const entry = await saveEntry({
          audio_local_uri: savedAudioUri,
          photo_local_uri: savedPhotoUri,
          duration_seconds: currentDuration,
          prompt: currentPrompt,
          transcribed: false,
        });
        
        entryIdRef.current = entry.id;
        setCurrentEntryId(entry.id);
        
        if (transcriptionEnabled && isApiConfigured() && currentDuration > 0) {
          startTranscription(entry.id, savedAudioUri, currentDuration, currentPrompt);
        }
        
        setSaving(false);
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Alert.alert(
        'Save Error',
        'Unable to save your moment. Please check your device storage and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: handleSave },
        ]
      );
      setSaving(false);
    }
  };

  const entryDate = existingEntry 
    ? new Date(existingEntry.recorded_at) 
    : new Date();
  const formattedDate = formatDateWithOrdinal(entryDate);
  const formattedTime = entryDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  return (
    <View className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark px-4 py-6">
      {/* Top: Date and Duration */}
    

      {/* Central Block */}
      <View className="flex-1 items-center justify-top mt-16 mb-6">
        {/* Photo Card */}
        <ShadowBox shadowSize="cardLarge" className="mb-6">
          <TouchableOpacity
            onPress={photoUri ? undefined : showPhotoOptions}
            activeOpacity={0.9}
          >
            <Gradient 
              name="surface-card"
              className="w-[192px] h-[192px]"
              style={{ paddingLeft: 12, paddingRight: 12, paddingTop: 12, paddingBottom: 48 }}
            >
              {/* Inner container with gradient effect */}
              <Gradient 
                name="surface-card-inner" 
                className="flex-1 self-stretch justify-center items-center overflow-hidden"
                style={{ gap: 8 }}
              >
                {photoUri ? (
                  // Show image when photo exists
                  <Image 
                    source={{ uri: photoUri }} 
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      resizeMode: 'cover'
                    }} 
                  />
                ) : (
                  // Show add photo UI when no photo
                  <View className="flex-row justify-center items-center" style={{ width: 79, gap: 6 }}>
                    <Icon 
                      name="ic-add" 
                      size={16} 
                      color="textMuted" 
                    />
                    <Text 
                      className="text-center text-text-muted dark:text-text-muted-dark"
                      style={{ 
                        width: 79, 
                        fontSize: 16
                      }}
                    >
                      Add photo
                    </Text>
                  </View>
                )}
              </Gradient>
            </Gradient>
          </TouchableOpacity>
        </ShadowBox>

        {/* Remove photo button - only show when photo exists */}
        {photoUri && (
          <TouchableOpacity
            onPress={() => setPhotoUri(null)}
            className="mb-6"
          >
            <Text className="text-center text-danger dark:text-danger-dark text-sm">
              Remove photo
            </Text>
          </TouchableOpacity>
        )}

        {/* Listen Button */}
        <View className="mt-8 mb-4">
          <ButtonSecondary 
            onPress={playSound} 
            title="Listen" 
            iconLeft="ic-play.svg"
            size="medium"
          />
        </View>

        {/*<View className="mb-6">
          <Text className="text-text-muted dark:text-text-muted-dark mt-1">
            {formatDuration(currentDuration)}
          </Text>
        </View>*/}

        {/* Prompt Text */}
        {currentPrompt && (
          <View className="mb-2 px-4">
            <Text className="text-text-secondary dark:text-text-secondary-dark font-sans-bold text-sm text-center py-2 px-4 rounded-full">
              {currentPrompt}
            </Text>
          </View>
        )}

        {/* Transcription Text */}
        <View className="px-4">
          {transcript ? (
            // Show transcript if it exists (highest priority)
            <View className="flex-col items-center">
              <Text 
                className="text-text-primary dark:text-text-primary-dark text-4xl font-serif-semibold leading-tight text-center"
                numberOfLines={4}
                ellipsizeMode="tail"
              >
                {transcript}
              </Text>
              {/*<Text className="text-text-muted dark:text-text-muted-dark text- text-center mt-2">
                ✓ Transcribed
              </Text>*/}
            </View>
          ) : isTranscribing ? (
            // Show loading state if transcribing and no transcript yet
            <View className="items-center">
              <View className="flex-row items-center justify-center mb-2">
                <ActivityIndicator size="small" color={colors.accent} className="mr-2" />
                <Text className="text-text-primary dark:text-text-primary-dark text-sm font-medium text-center">
                  {transcriptionJob?.status === 'uploading' 
                    ? 'Uploading audio...' 
                    : 'Transcribing your words...'}
                </Text>
              </View>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center">
                This usually takes just a few seconds
              </Text>
            </View>
          ) : transcriptionJob?.status === 'failed' ? (
            // Show error state
            <View className="items-center">
              <Text className="text-danger text-sm text-center mb-1 font-medium">
                Transcription failed
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center">
                {transcriptionJob.error || 'Unable to transcribe audio'}
              </Text>
            </View>
          ) : (
            // Show placeholder
            <View className="items-center">
              <Text className="text-text-secondary dark:text-text-secondary-dark text-sm text-center leading-5">
                {transcriptionEnabled && isApiConfigured() 
                  ? 'Transcription will appear here once processed...' 
                  : 'No transcription available'}
              </Text>
            </View>
          )}
        </View>

        
      </View>

      {/* Bottom Controls: Cancel and Done */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <ButtonSecondary
            onPress={async () => {
              // If entry was auto-saved (not editing), delete it before canceling
              if (currentEntryId && !isEditing) {
                try {
                  // Get entry to access file URIs
                  const entryToDelete = await getEntry(currentEntryId);
                  if (entryToDelete) {
                    // Delete audio file
                    if (entryToDelete.audio_local_uri) {
                      try {
                        await deleteFile(entryToDelete.audio_local_uri);
                      } catch (error) {
                        console.error('Error deleting audio file:', error);
                        // Continue even if file deletion fails
                      }
                    }
                    // Delete photo file
                    if (entryToDelete.photo_local_uri) {
                      try {
                        await deleteFile(entryToDelete.photo_local_uri);
                      } catch (error) {
                        console.error('Error deleting photo file:', error);
                        // Continue even if file deletion fails
                      }
                    }
                    // Delete from database
                    await deleteEntry(currentEntryId);
                  }
                } catch (error) {
                  console.error('Error deleting entry on cancel:', error);
                  // Continue with cancel even if deletion fails
                }
              }
              // Always call onCancel to close the screen
              onCancel();
            }}
            title="Cancel"
            iconLeft="ic-close.svg"
            size="large"
          />
        </View>
        <View className="flex-1">
          <ButtonPrimary
            size="large"
            onPress={async () => {
              // If entry is already saved (auto-saved or editing), close with latest data
              if (currentEntryId) {
                try {
                  // Update photo if it was added
                  if (photoUri && !existingEntry?.photo_local_uri) {
                    await handleSave();
                  }
                  const latestEntry = await getEntry(currentEntryId);
                  if (latestEntry) {
                    onComplete(latestEntry);
                  } else {
                    onCancel();
                  }
                } catch (error) {
                  console.error('Error loading entry for close:', error);
                  onCancel();
                }
              } else if (existingEntry) {
                // Editing existing entry - save changes first
                await handleSave();
              } else if (!saving) {
                // Fallback: save if not already saved
                await handleSave();
              }
            }}
            disabled={saving}
            iconLeft="ic-tick.svg"
            title={saving ? 'Saving...' : isTranscribing ? 'Transcribing...' : currentEntryId ? 'Done' : 'Save'}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
  },
});

