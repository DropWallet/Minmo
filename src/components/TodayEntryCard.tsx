import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Entry } from '@db/types';
import { formatDateWithOrdinal } from '@utils/dateFormat';
import { shadows } from '../../themeconfig';
import { useTheme } from '@hooks/useTheme';

interface TodayEntryCardProps {
  entry: Entry;
  onEdit: () => void;
  onDelete: () => void;
}

export function TodayEntryCard({ entry, onEdit, onDelete }: TodayEntryCardProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

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
      Alert.alert(
        'Playback Error',
        'Unable to play audio. The file may be missing or corrupted.',
        [{ text: 'OK' }]
      );
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const entryDate = new Date(entry.recorded_at);
  const formattedDate = formatDateWithOrdinal(entryDate);
  const formattedTime = entryDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  return (
    <View className="bg-surface-strong dark:bg-surface-strong-dark rounded-lg p-4 border border-border-subtle dark:border-border-subtle-dark">
      {/* Top: Date and Action Buttons */}
      <View className="flex-row items-start justify-between mb-4">
        <View>
          <Text className="text-text-primary dark:text-text-primary-dark text-lg font-medium">
            {formattedDate}
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-sm mt-1">
            {formattedTime} • {formatDuration(entry.duration_seconds || 0)}
          </Text>
        </View>
        <View className="flex-row gap-2">
          {/* Edit Button */}
          <TouchableOpacity
            onPress={onEdit}
            className="w-9 h-9 rounded-full bg-accent items-center justify-center"
          >
            <Text className="text-text-inverse dark:text-text-inverse-dark text-xs">✎</Text>
          </TouchableOpacity>
          {/* Delete Button */}
          <TouchableOpacity
            onPress={onDelete}
            className="w-9 h-9 rounded-full bg-accent items-center justify-center"
          >
            <Text className="text-text-inverse dark:text-text-inverse-dark text-xs">🗑</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Central Block */}
      <View className="items-center mb-4">
        {/* Large Circular Play Button */}
        <TouchableOpacity
          onPress={playSound}
          className="w-20 h-20 rounded-full bg-accent items-center justify-center mb-6"
          style={styles.playButton}
        >
          {isPlaying ? (
            <View className="flex-row items-center justify-center">
              <View className="w-1.5 h-5 bg-text-inverse rounded-sm mr-1" />
              <View className="w-1.5 h-5 bg-text-inverse rounded-sm" />
            </View>
          ) : (
            <View style={[styles.playTriangle, { borderLeftColor: colors.textInverse }]} />
          )}
        </TouchableOpacity>

        {/* Prompt Text */}
        {entry.prompt && (
          <View className="mb-4 px-4">
            <Text className="text-text-primary dark:text-text-primary-dark text-base font-semibold text-center">
              {entry.prompt}
            </Text>
          </View>
        )}

        {/* Transcription Text */}
        <View className="mb-6 px-4">
          <Text className="text-text-secondary dark:text-text-secondary-dark text-sm text-center leading-5">
            {entry.transcript || 'Transcription will appear here once processed...'}
          </Text>
        </View>

        {/* Photo if exists */}
        {entry.photo_local_uri && (
          <View className="items-center mb-4">
            <Image 
              source={{ uri: entry.photo_local_uri }} 
              style={styles.photoPreview} 
            />
          </View>
        )}
      </View>

      {/* Bottom: Today's Moment */}
      <View className="flex-row items-center justify-center pt-4 border-t border-border-subtle dark:border-border-subtle-dark">
        <Text className="text-text-muted dark:text-text-muted-dark text-sm mr-2">✓</Text>
        <Text className="text-text-primary dark:text-text-primary-dark text-sm font-medium">Today&apos;s moment</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  playButton: {
    shadowColor: shadows.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 16,
    borderRightWidth: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 4,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
  },
});

