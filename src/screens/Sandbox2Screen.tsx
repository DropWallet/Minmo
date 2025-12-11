import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Audio } from 'expo-av';
import Gradient from '@components/Gradient';
import { getEntries } from '@db/queries';
import { Entry } from '@db/types';
import { ShadowBox } from '@/components/ShadowBox';
import { ButtonPrimary } from '@components/ButtonPrimary';
import { ButtonIcon } from '@components/ButtonIcon';
import { formatDateWithOrdinal } from '@utils/dateFormat';

export default function Sandbox2Screen() {
  const [latestEntry, setLatestEntry] = useState<Entry | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadLatestEntry = async () => {
        try {
          const entries = await getEntries(100); // Get entries to find one with photo
          const entryWithPhoto = entries.find(entry => entry.photo_local_uri);
          setLatestEntry(entryWithPhoto || null);
        } catch (error) {
          console.error('Error loading latest entry:', error);
        }
      };
      loadLatestEntry();
    }, [])
  );

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playEntry = async () => {
    if (!latestEntry?.audio_local_uri) return;

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
          { uri: latestEntry.audio_local_uri },
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
      console.error('Error playing audio:', error);
    }
  };

  return (
    <Gradient className="flex-1">
      {latestEntry?.photo_local_uri ? (
        <View className="relative px-5 pt-[108px] pb-5">
          {/* Background Layer - Image with Blur and Overlay */}
          <View className="absolute left-0 top-0 right-0 bottom-0">
            {/* Base Image - fills full height */}
            <Image
              source={{ uri: latestEntry.photo_local_uri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            
            {/* BlurView - blurs the image below */}
            <BlurView 
              intensity={50}
              tint="default"
              experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
              style={StyleSheet.absoluteFill}
            />
            
            {/* Teal Overlay - separate layer on top of blur */}
            <View 
              className="absolute left-0 top-0 right-0 bottom-0"
              style={{ backgroundColor: 'rgba(0, 213, 192, 0.3)' }}
            />
          </View>

          {/* Main Image on Top - Full Width */}
          <ShadowBox shadowSize="cardLarge" className="w-full relative rounded-xl overflow-hidden" style={{ aspectRatio: 1 }}>
            <Image
              source={{ uri: latestEntry.photo_local_uri }}
              className="w-full h-full "
              style={{ resizeMode: 'cover' }}
            />
          </ShadowBox>

          {/* Play Button and Date/Duration Row */}
          
        </View>
      ) : (
        <View className="flex-1 justify-center items-center px-6 pt-4">
          <Text className="text-text-muted dark:text-text-muted-dark">
            No image available
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between px-5 gap-5 mt-5">
            <ButtonPrimary
              onPress={playEntry}
              title={isPlaying ? "Pause" : "Listen"}
              iconLeft={isPlaying ? "ic-pause.svg" : "ic-play.svg"}
              size="medium"
            />

<ButtonIcon
                onPress={() => {}}
                icon="ic-tab-saved"
                size="medium"
                variant="secondary"
              />
            
          </View>

      <View className="flex-1 justify-top items-start w-full px-6 pt-4">
        <View className="flex-col items-left">
        {latestEntry?.prompt && (
          <Text className="font-sans-semibold text-xl text-text-brand dark:text-text-brand-dark mb-1">
            {latestEntry.prompt}
          </Text>
        )}
        </View>
        <View className="flex-col items-left">
        {latestEntry?.prompt && (
          <Text className="font-serif-medium text-2xl text-text-primary dark:text-text-primary-dark mb-3">
            {latestEntry.transcript}
          </Text>
        )}
        </View>
        <View className="flex-row items-center gap-2">
              {latestEntry?.created_at && (
                <>
                  <Text className="text-base text-text-muted dark:text-text-muted-dark">
                    {formatDateWithOrdinal(new Date(latestEntry.created_at))}
                  </Text>
                  <View className="w-1 h-1 rounded-full bg-text-muted dark:bg-text-muted-dark" />
                </>
              )}
              {latestEntry?.duration_seconds && (
                <Text className="text-base text-text-muted dark:text-text-muted-dark">
                  {Math.round(latestEntry.duration_seconds)}s
                </Text>
              )}
            </View>
      </View>
    </Gradient>
  );
}

