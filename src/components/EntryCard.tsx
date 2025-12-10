import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, ScrollView, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { Entry } from '@db/types';
import { formatDateWithOrdinal } from '@utils/dateFormat';
import { ButtonPrimary } from '@components/ButtonPrimary';
import { ButtonIcon } from '@components/ButtonIcon';

interface EntryCardProps {
  entry: Entry;
  onEdit?: () => void;
  onDelete?: () => void;
  sharedElementId?: string; // For shared element transitions
}

export function EntryCard({ entry, onEdit, onDelete, sharedElementId }: EntryCardProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [words, setWords] = useState<string[]>([]);
  const wordAnimations = useRef<{ [key: number]: Animated.Value }>({});
  const wordPositions = useRef<{ [key: number]: number }>({});
  const captionScrollViewRef = useRef<ScrollView | null>(null);
  const isFirstRender = useRef(true);
  const insets = useSafeAreaInsets();

  // Screen dimensions for full-screen animation
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Animation values for card expansion
  const cardScaleAnim = useRef(new Animated.Value(1)).current;
  const borderRadiusAnim = useRef(new Animated.Value(1)).current;
  const promptOpacityAnim = useRef(new Animated.Value(1)).current;
  const paddingAnim = useRef(new Animated.Value(1)).current;

  // Animation constants
  const ANIMATION_DURATION = 300;

  const formatDurationShort = (seconds: number): string => {
    const secs = Math.floor(seconds);
    return `${secs}s`;
  };

  // Calculate caption height based on available space
  const calculateCaptionHeight = () => {
    if (!isPlaying) return 120;
    const bottomSectionPadding = 16 + 32;
    const buttonsRowHeight = 48;
    const sectionGap = 16;
    const imageHeight = entry.photo_local_uri ? screenWidth : 0;
    const tabBarHeight = 49 + insets.bottom;
    const extraPaddingAdjustment = !entry.photo_local_uri && isPlaying ? 16 : 0;
    const availableHeight = screenHeight - imageHeight - bottomSectionPadding - buttonsRowHeight - sectionGap - tabBarHeight - extraPaddingAdjustment;
    return Math.max(120, availableHeight - 20);
  };

  // Initialize words from transcript
  useEffect(() => {
    if (entry.transcript) {
      const transcriptWords = entry.transcript.split(/\s+/).filter(word => word.length > 0);
      setWords(transcriptWords);
      transcriptWords.forEach((_, index) => {
        if (!wordAnimations.current[index]) {
          wordAnimations.current[index] = new Animated.Value(1);
        }
      });
    }
  }, [entry.transcript]);

  // Animate word highlighting
  useEffect(() => {
    if (currentWordIndex >= 0 && currentWordIndex < words.length) {
      Animated.spring(wordAnimations.current[currentWordIndex] || new Animated.Value(1), {
        toValue: 1.05,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }).start();

      if (currentWordIndex > 0) {
        Animated.spring(wordAnimations.current[currentWordIndex - 1] || new Animated.Value(1), {
          toValue: 1,
          tension: 300,
          friction: 20,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [currentWordIndex, words.length]);

  // Scroll to current word
  useEffect(() => {
    if (isPlaying && currentWordIndex >= 0 && captionScrollViewRef.current) {
      const wordY = wordPositions.current[currentWordIndex];
      if (wordY !== undefined) {
        const scrollOffset = wordY - 60;
        captionScrollViewRef.current.scrollTo({
          y: Math.max(0, scrollOffset),
          animated: true,
        });
      }
    }
  }, [currentWordIndex, isPlaying]);

  // Animate card expansion when playing
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (isPlaying) {
      Animated.parallel([
        Animated.timing(cardScaleAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(borderRadiusAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(promptOpacityAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(paddingAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(cardScaleAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(borderRadiusAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(promptOpacityAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(paddingAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isPlaying]);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  const playSound = async () => {
    if (!entry.audio_local_uri) {
      return;
    }

    try {
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          const actuallyPlaying = status.isLoaded && status.isPlaying;
          
          if (actuallyPlaying || isPlaying) {
            try {
              await sound.pauseAsync();
              setIsPlaying(false);
              setCurrentWordIndex(-1);
            } catch (pauseError) {
              setSound(null);
              setIsPlaying(false);
              setCurrentWordIndex(-1);
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
                    setCurrentWordIndex(-1);
                  } else if (status.positionMillis !== undefined) {
                    setWords((currentWords) => {
                      if (currentWords.length > 0) {
                        const totalDuration = status.durationMillis || (entry.duration_seconds || 0) * 1000;
                        const progress = status.positionMillis / totalDuration;
                        const wordIndex = Math.floor(progress * currentWords.length);
                        const clampedIndex = Math.min(wordIndex, currentWords.length - 1);
                        
                        setCurrentWordIndex((prevIndex) => {
                          if (clampedIndex !== prevIndex) {
                            return clampedIndex;
                          }
                          return prevIndex;
                        });
                      }
                      return currentWords;
                    });
                  }
                }
              });
            } catch (playError) {
              setSound(null);
              setIsPlaying(false);
              setCurrentWordIndex(-1);
            }
          }
        } catch (statusError) {
          setSound(null);
          setIsPlaying(false);
          setCurrentWordIndex(-1);
        }
      }
      
      if (!sound) {
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
              setCurrentWordIndex(-1);
            } else if (status.positionMillis !== undefined) {
              setWords((currentWords) => {
                if (currentWords.length > 0) {
                  const totalDuration = status.durationMillis || (entry.duration_seconds || 0) * 1000;
                  const progress = status.positionMillis / totalDuration;
                  const wordIndex = Math.floor(progress * currentWords.length);
                  const clampedIndex = Math.min(wordIndex, currentWords.length - 1);
                  
                  setCurrentWordIndex((prevIndex) => {
                    if (clampedIndex !== prevIndex) {
                      return clampedIndex;
                    }
                    return prevIndex;
                  });
                }
                return currentWords;
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('[EntryCard] Error playing sound:', error);
    }
  };

  const entryDate = new Date(entry.recorded_at);
  const formattedDate = formatDateWithOrdinal(entryDate);

  return (
    <Animated.View 
      className="flex-1 flex-col justify-center bg-surface-strong dark:bg-surface-strong-dark"
      style={{
        paddingHorizontal: paddingAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 24],
        }),
      }}
    >
      <Animated.View
        style={{
          flex: 1,
          paddingTop: paddingAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 64],
          }),
          paddingBottom: paddingAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 64],
          }),
        }}
      >
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ 
            flexGrow: 1,
            justifyContent: 'center',
          }}
        >
          <Animated.View 
            className="flex-col bg-surface dark:bg-surface-dark items-start overflow-hidden"
            style={{
              width: cardScaleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [screenWidth, screenWidth - 48],
              }),
              marginHorizontal: cardScaleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0],
              }),
              ...(isPlaying ? {
                height: screenHeight,
              } : {}),
              borderRadius: borderRadiusAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 12],
              }),
            }}
          >
            {/* Image Section */}
            {entry.photo_local_uri && (
              <View className="w-full" style={{ aspectRatio: 1 }}>
                <Image 
                  source={{ uri: entry.photo_local_uri }} 
                  className="w-full h-full"
                  style={{ resizeMode: 'cover' }}
                />
              </View>
            )}

            {/* Bottom Section */}
            <View 
              className="flex-col items-start self-stretch gap-4 px-4 pb-8"
              style={{
                paddingTop: !entry.photo_local_uri && isPlaying ? 64 : 16,
              }}
            >
              {/* Date and Duration Row */}
              <Animated.View 
                className="flex-row items-center gap-2"
                style={{
                  opacity: promptOpacityAnim,
                  transform: [
                    {
                      scaleY: promptOpacityAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  ],
                  overflow: 'hidden',
                }}
              >
                <Text className="text-sm font-semibold text-text-muted dark:text-text-muted-dark">
                  {formattedDate}
                </Text>
                <View className="w-1 h-1 rounded-full bg-text-muted dark:text-text-muted-dark" />
                <Text className="text-sm font-semibold text-text-muted dark:text-text-muted-dark">
                  {formatDurationShort(entry.duration_seconds || 0)}
                </Text>
              </Animated.View>

              {/* Buttons Row */}
              <Animated.View 
                className="flex-row justify-between items-start self-stretch"
                style={{
                  transform: [
                    {
                      translateY: promptOpacityAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-24, 0],
                      }),
                    },
                  ],
                }}
              >
                <ButtonPrimary 
                  onPress={playSound} 
                  title={isPlaying ? "Pause" : "Listen"}
                  iconLeft={isPlaying ? "ic-pause.svg" : "ic-play.svg"}
                  size="medium"
                />
                {(onEdit || onDelete) && (
                  <Animated.View 
                    className="flex-row gap-4"
                    style={{
                      opacity: promptOpacityAnim,
                    }}
                  >
                    {onEdit && (
                      <ButtonIcon
                        onPress={onEdit}
                        icon="ic-edit.svg"
                        size="medium"
                      />
                    )}
                    {onDelete && (
                      <ButtonIcon
                        onPress={onDelete}
                        icon="ic-delete.svg"
                        size="medium"
                      />
                    )}
                  </Animated.View>
                )}
              </Animated.View>

              {/* Prompt and Transcript Section */}
              <View className="flex-col items-start self-stretch gap-3">
                {entry.prompt && (
                  <Animated.View
                    style={{
                      opacity: promptOpacityAnim,
                      transform: [
                        {
                          scaleY: promptOpacityAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1],
                          }),
                        },
                      ],
                      overflow: 'hidden',
                    }}
                  >
                    <Text className="font-bold text-center text-text-brand dark:text-text-brand-dark">
                      {entry.prompt}
                    </Text>
                  </Animated.View>
                )}
                <Animated.View
                  style={{
                    transform: [
                      {
                        translateY: promptOpacityAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-40, 0],
                        }),
                      },
                    ],
                  }}
                >
                  {isPlaying && words.length > 0 ? (
                    <ScrollView
                      ref={captionScrollViewRef}
                      className="w-full"
                      style={{ 
                        minHeight: calculateCaptionHeight(),
                        maxHeight: calculateCaptionHeight(),
                      }}
                      showsVerticalScrollIndicator={false}
                    >
                      <View className="flex-row flex-wrap items-start justify-start">
                        {words.map((word, index) => {
                          const isHighlighted = index === currentWordIndex;
                          const animValue = wordAnimations.current[index] || new Animated.Value(1);
                          
                          return (
                            <Animated.View
                              key={index}
                              onLayout={(event) => {
                                const { y } = event.nativeEvent.layout;
                                wordPositions.current[index] = y;
                              }}
                              style={{
                                backgroundColor: isHighlighted 
                                  ? '#bef264'
                                  : 'transparent',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 8,
                                transform: [{ scale: animValue }],
                              }}
                            >
                              <Text 
                                className="text-3xl font-serif-bold text-text-primary dark:text-text-primary-dark"
                              >
                                {word}
                              </Text>
                            </Animated.View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  ) : (
                    entry.transcript && (
                      <Text 
                        className="text-2xl font-serif-semibold text-text-primary dark:text-text-primary-dark"
                        numberOfLines={4}
                        ellipsizeMode="tail"
                      >
                        {entry.transcript}
                      </Text>
                    )
                  )}
                </Animated.View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}

