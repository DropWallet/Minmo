import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { Entry } from '@db/types';
import { getEntry, updateEntry, deleteEntry } from '@db/queries';
import { deleteFile } from '@utils/storage';
import { Button } from '@components/Button';
import { useAppStore } from '@store/useAppStore';
import { useTheme } from '@hooks/useTheme';

interface EntryDetailScreenProps {
  visible: boolean;
  entryId: string | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function EntryDetailScreen({
  visible,
  entryId,
  onClose,
  onDeleted,
}: EntryDetailScreenProps) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [favourite, setFavourite] = useState(false);
  const [saving, setSaving] = useState(false);
  const { activeTranscriptions } = useAppStore();
  const { colors } = useTheme();
  
  // Get transcription status for this entry
  const transcriptionJob = entryId ? activeTranscriptions.get(entryId) : undefined;
  const isTranscribing = transcriptionJob && (transcriptionJob.status === 'uploading' || transcriptionJob.status === 'processing');

  useEffect(() => {
    if (visible && entryId) {
      loadEntry();
    }
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [visible, entryId]);

  const loadEntry = async (retryCount = 0) => {
    if (!entryId) return;
    setLoading(true);
    
    try {
      // Small delay to ensure database is ready
      if (retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const data = await getEntry(entryId);
      if (data) {
        setEntry(data);
        setTranscript(data.transcript || '');
        setFavourite(data.favourite || false);
      } else {
        // Entry not found
        Alert.alert('Error', 'Entry not found');
        onClose();
      }
    } catch (error) {
      console.error('Failed to load entry:', error);
      
      // Retry up to 2 times if it's a database error
      if (retryCount < 2 && error instanceof Error && 
          (error.message.includes('NullPointerException') || 
           error.message.includes('prepareAsync'))) {
        console.log(`Retrying loadEntry (attempt ${retryCount + 1})...`);
        // Wait a bit longer before retry
        await new Promise(resolve => setTimeout(resolve, 300));
        return loadEntry(retryCount + 1);
      }
      
      Alert.alert(
        'Error', 
        'Failed to load entry. Please try again.',
        [
          { text: 'Close', onPress: onClose },
          { text: 'Retry', onPress: () => loadEntry(0) },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const playSound = async () => {
    if (!entry?.audio_local_uri) return;

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
          { uri: entry.audio_local_uri },
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
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const handleSave = async () => {
    if (!entry) return;
    setSaving(true);
    try {
      const updated = await updateEntry(entry.id, {
        transcript: transcript,
        favourite: favourite,
      });
      
      if (updated) {
        // Update local state with the updated entry
        setEntry(updated);
        Alert.alert('Success', 'Entry updated');
        onClose();
      } else {
        throw new Error('Failed to retrieve updated entry');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert(
        'Error', 
        'Failed to save changes. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: handleSave },
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!entry) return;

    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this moment? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete audio file
              if (entry.audio_local_uri) {
                await deleteFile(entry.audio_local_uri);
              }
              // Delete photo file
              if (entry.photo_local_uri) {
                await deleteFile(entry.photo_local_uri);
              }
              // Delete from database
              await deleteEntry(entry.id);
              onDeleted();
              onClose();
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  if (!visible) {
    return null;
  }

  // Show loading state while entry is being loaded
  if (loading && !entry) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-surface dark:bg-surface-dark">
          <View className="px-4 py-4 border-b border-border-subtle dark:border-border-subtle-dark flex-row items-center justify-between">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-accent text-base">Close</Text>
            </TouchableOpacity>
            <Text className="text-text-primary dark:text-text-primary-dark text-lg font-semibold">Entry Detail</Text>
            <View style={{ width: 60 }} />
          </View>
          <View className="flex-1 items-center justify-center">
            <Text className="text-text-secondary dark:text-text-secondary-dark">Loading entry...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (!entry) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-surface dark:bg-surface-dark">
        {/* Header */}
        <View className="px-4 py-4 border-b border-border-subtle dark:border-border-subtle-dark flex-row items-center justify-between">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-accent text-base">Close</Text>
          </TouchableOpacity>
          <Text className="text-text-primary dark:text-text-primary-dark text-lg font-semibold">Entry Detail</Text>
          <View style={{ width: 60 }} />
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-text-secondary dark:text-text-secondary-dark">Loading...</Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-4 py-6">
            {/* Photo */}
            {entry.photo_local_uri && (
              <View className="mb-6">
                <Image
                  source={{ uri: entry.photo_local_uri }}
                  style={styles.photo}
                />
              </View>
            )}

            {/* Audio Player */}
            <View className="mb-6">
              <TouchableOpacity
                onPress={playSound}
                className="bg-surface-strong dark:bg-surface-strong-dark rounded-lg p-4 items-center border border-border-subtle dark:border-border-subtle-dark"
              >
                <Text className="text-accent text-lg font-medium">
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </Text>
                {entry.duration_seconds && (
                  <Text className="text-text-muted dark:text-text-muted-dark text-sm mt-2">
                    {Math.round(entry.duration_seconds)}s
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Prompt */}
            <View className="mb-4">
              <Text className="text-text-secondary dark:text-text-secondary-dark text-sm mb-2">Prompt</Text>
              <Text className="text-text-primary dark:text-text-primary-dark text-base">
                {entry.prompt || 'Daily moment'}
              </Text>
            </View>

            {/* Transcript */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-text-secondary dark:text-text-secondary-dark text-sm">Transcript</Text>
                {isTranscribing && (
                  <View className="flex-row items-center">
                    <Text className="text-text-muted dark:text-text-muted-dark text-xs mr-2">
                      {transcriptionJob?.status === 'uploading' 
                        ? 'Uploading...' 
                        : 'Processing...'}
                    </Text>
                    <ActivityIndicator size="small" color={colors.accent} />
                  </View>
                )}
                {transcriptionJob?.status === 'failed' && (
                  <Text className="text-danger text-xs">
                    Transcription failed
                  </Text>
                )}
              </View>
              <TextInput
                value={transcript}
                onChangeText={setTranscript}
                placeholder={isTranscribing 
                  ? 'Transcription in progress...' 
                  : 'Add or edit transcript...'}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                className="bg-surface-strong dark:bg-surface-strong-dark rounded-lg p-4 text-text-primary dark:text-text-primary-dark border border-border-subtle dark:border-border-subtle-dark"
                style={[styles.textInput, { color: colors.textPrimary }]}
                editable={!isTranscribing}
              />
            </View>

            {/* Favourite Toggle */}
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="text-text-primary dark:text-text-primary-dark text-base">Favourite</Text>
              <TouchableOpacity
                onPress={() => setFavourite(!favourite)}
                style={[
                  styles.toggle,
                  { backgroundColor: favourite ? colors.accent : colors.borderSubtle },
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    { 
                      marginLeft: favourite ? 22 : 2,
                      backgroundColor: colors.textInverse,
                    },
                  ]}
                />
              </TouchableOpacity>
            </View>

            {/* Date Info */}
            <View className="mb-6">
              <Text className="text-text-muted dark:text-text-muted-dark text-sm">
                Created: {new Date(entry.created_at).toLocaleString()}
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="mb-6 gap-3">
              <Button
                title={saving ? 'Saving...' : 'Save Changes'}
                onPress={handleSave}
                disabled={saving}
              />
              <TouchableOpacity
                onPress={handleDelete}
                className="bg-surface-strong dark:bg-surface-strong-dark border border-danger rounded-lg p-3 items-center"
              >
                <Text className="text-danger font-semibold">Delete Entry</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    resizeMode: 'contain',
  },
  textInput: {
    textAlignVertical: 'top',
  },
  toggle: {
    width: 48,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});

