import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import Animated from 'react-native-reanimated';
import { Entry } from '@db/types';
import { formatDateWithOrdinal } from '@utils/dateFormat';
import { ButtonIcon } from '@components/ButtonIcon';
import { ButtonPrimary } from '@components/ButtonPrimary';

interface TimelineEntryCardProps {
  entry: Entry;
  onPress?: () => void;
  onBookmark?: () => void;
}

export function TimelineEntryCard({ entry, onPress, onBookmark }: TimelineEntryCardProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const entryDate = new Date(entry.recorded_at);
  const formattedDate = formatDateWithOrdinal(entryDate);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(console.error);
      }
    };
  }, [sound]);

  const playEntry = async () => {
    if (!entry.audio_local_uri) return;

    try {
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          const actuallyPlaying = status.isLoaded && status.isPlaying;
          
          if (actuallyPlaying || isPlaying) {
            try {
              await sound.pauseAsync();
              setIsPlaying(false);
            } catch (pauseError) {
              setSound(null);
              setIsPlaying(false);
            }
          } else {
            try {
              if (status.isLoaded) {
                if (status.positionMillis !== undefined && 
                    status.durationMillis !== undefined &&
                    status.positionMillis >= status.durationMillis) {
                  await sound.setPositionAsync(0);
                }
              }
              await sound.playAsync();
              setIsPlaying(true);
              
              sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded) {
                  if (status.didJustFinish) {
                    setIsPlaying(false);
                  }
                }
              });
            } catch (playError) {
              setSound(null);
              setIsPlaying(false);
            }
          }
        } catch (statusError) {
          setSound(null);
          setIsPlaying(false);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: entry.audio_local_uri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              setIsPlaying(false);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      className="w-full mb-6"
    >
      <View className="border-b-4 bg-trans dark:bg-trans-dark border-surface-mid dark:border-surface-mid-dark rounded-3xl">
      <View className="w-full border-2 border-border-default dark:border-border-default-dark flex-col bg-surface-trans dark:bg-surface-trans-dark rounded-2xl">
        {/* Image Section */}
        {entry.photo_local_uri && (
          <View className="w-full px-4 pt-4 pb-2" style={{ aspectRatio: 1 }}>
            <Animated.Image 
              source={{ uri: entry.photo_local_uri }} 
              className="w-full h-full rounded-lg"
              style={{ resizeMode: 'cover' }}
              // @ts-expect-error - sharedTransitionTag is supported in Reanimated v4 but types may not be updated
              sharedTransitionTag={`image-${entry.id}`}
            />
          </View>
        )}

        {/* Content Section */}
        <View className="flex-col items-start self-stretch gap-2 px-4 py-4">
          {/* Button Row - Play and Bookmark */}
          <View className="flex-row items-center justify-between self-stretch mb-2">
            <View onStartShouldSetResponder={() => true}>
              <ButtonPrimary
                onPress={playEntry}
                title={isPlaying ? "Pause" : "Listen"}
                iconLeft={isPlaying ? "ic-pause.svg" : "ic-play.svg"}
                size="medium"
              />
            </View>
            {onBookmark && (
              <ButtonIcon
                onPress={(e) => {
                  e?.stopPropagation();
                  onBookmark();
                }}
                icon="ic-tab-saved"
                size="medium"
                variant={entry.favourite ? 'primary' : 'secondary'}
                iconColor={entry.favourite ? 'textButtonPrimary' : undefined}
              />
            )}
          </View>

          {/* Prompt */}
          {entry.prompt && (
            <Text className="font-sans-semibold text-lg text-text-brand dark:text-text-brand-dark">
              {entry.prompt}
            </Text>
          )}

          {/* Transcript Preview */}
          {entry.transcript && (
            <Text 
              className="text-2xl font-serif-medium text-text-primary dark:text-text-primary-dark mb-2"
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {entry.transcript}
            </Text>
          )}

          {/* Date and Duration Row - Below Transcript */}
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-sans-medium text-text-muted dark:text-text-muted-dark">
              {formattedDate}
            </Text>
            <View className="w-1 h-1 rounded-full bg-text-muted dark:text-text-muted-dark" />
            <Text className="text-sm font-sans-medium text-text-muted dark:text-text-muted-dark">
              {entry.duration_seconds ? Math.round(entry.duration_seconds) : 0}s
            </Text>
          </View>
        </View>
      </View>
      </View>
    </TouchableOpacity>
  );
}
