import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Alert, ScrollView, Platform, Image, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { ReviewScreen } from './ReviewScreen';
import { ButtonSecondary } from '@components/ButtonSecondary';
import { ButtonStop } from '@components/ButtonStop';
import { ButtonIcon } from '@components/ButtonIcon';
import { getDailyPrompt } from '@utils/prompts';
import { getTodaysEntry, deleteEntry } from '@db/queries';
import { Entry } from '@db/types';
import { deleteFile } from '@utils/storage';
import { useTheme } from '@hooks/useTheme';
import { DB_DELAYS, IOS_DELAYS, ANIMATION } from '@utils/constants';
import { formatDateWithOrdinal } from '@utils/dateFormat';
import Gradient from '@components/Gradient';
import * as Haptics from 'expo-haptics';
import { ButtonPrimary } from '@/components/ButtonPrimary';

export default function RecordScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [dailyPrompt, setDailyPrompt] = useState<string>('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [todaysEntry, setTodaysEntry] = useState<Entry | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [words, setWords] = useState<string[]>([]);
  const wordAnimations = useRef<{ [key: number]: Animated.Value }>({});
  const wordPositions = useRef<{ [key: number]: number }>({});
  const captionScrollViewRef = useRef<ScrollView | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const waveformIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveformAnims = useRef(
    Array.from({ length: 30 }, () => new Animated.Value(Math.random() * 50 + 10))
  ).current;

  // Screen dimensions for full-screen animation
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Animation values for card expansion
  const cardScaleAnim = useRef(new Animated.Value(1)).current; // 1 = normal, 0 = full screen
  const borderRadiusAnim = useRef(new Animated.Value(1)).current; // 1 = rounded-xl (12px), 0 = no radius
  const promptOpacityAnim = useRef(new Animated.Value(1)).current; // 1 = visible, 0 = hidden
  const paddingAnim = useRef(new Animated.Value(1)).current; // 1 = normal padding, 0 = no padding

  // Animation constants
  const ANIMATION_DURATION = 300;

  const formatDurationShort = (seconds: number): string => {
    const secs = Math.floor(seconds);
    return `${secs}s`;
  };

  const loadTodaysEntry = async () => {
    try {
      // Small delay to ensure database is ready
      await new Promise(resolve => setTimeout(resolve, DB_DELAYS.INIT));
      const entry = await getTodaysEntry();
      setTodaysEntry(entry);
    } catch (error) {
      console.error('Error loading today\'s entry:', error);
      // Don't set state on error, keep previous value
    }
  };

  // Load prompt and entry when screen comes into focus (handles both initial mount and tab switches)
  useFocusEffect(
    React.useCallback(() => {
      setDailyPrompt(getDailyPrompt());
      loadTodaysEntry();
    }, [])
  );

  // Clear sound when todaysEntry changes (new recording saved)
  useEffect(() => {
    if (sound) {
      // Unload old sound when entry changes
      sound.unloadAsync().catch(() => {
        // Silently handle unload errors
      });
      setSound(null);
      setIsPlaying(false);
      setCurrentWordIndex(-1);
      setWords([]);
    }
  }, [todaysEntry?.audio_local_uri]); // Only trigger when audio URI changes

  useEffect(() => {
    if (isRecording) {
      // Start pulsing animation for red dot
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: ANIMATION.PULSE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: ANIMATION.PULSE_DURATION,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start duration timer
      intervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 0.1);
      }, 100);

      // Start waveform animation with smooth transitions
      waveformIntervalRef.current = setInterval(() => {
        waveformAnims.forEach((anim) => {
          Animated.timing(anim, {
            toValue: Math.random() * 50 + 10,
            duration: 200 + Math.random() * 100, // 200-300ms for varied smoothness
            useNativeDriver: false, // height animations can't use native driver
          }).start();
        });
      }, 200);
    } else {
      // Stop animation and timer
      pulseAnim.setValue(1);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (waveformIntervalRef.current) {
        clearInterval(waveformIntervalRef.current);
        waveformIntervalRef.current = null;
      }
      // Reset waveform animations
      waveformAnims.forEach(anim => anim.setValue(10));
      setRecordingDuration(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (waveformIntervalRef.current) {
        clearInterval(waveformIntervalRef.current);
      }
    };
  }, [isRecording, pulseAnim, waveformAnims]);

  const startRecording = async () => {
    // Prevent recording if today's entry already exists
    if (todaysEntry) {
      Alert.alert(
        'Already recorded',
        'You\'ve already recorded your moment for today. You can edit or delete it to record again.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Haptic feedback for starting recording
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert(
        'Recording Error',
        'Unable to start recording. Please check that your device has microphone permissions enabled and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      // Haptic feedback for stopping recording
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      
      // Use recordingDuration state (tracked during recording) as fallback if status duration is 0
      // On iOS, status.durationMillis might not be available immediately
      const statusDuration = status.durationMillis ? status.durationMillis / 1000 : 0;
      const durationSeconds = statusDuration > 0 ? statusDuration : recordingDuration;
      
      // Set state values first
      setDuration(durationSeconds);
      setRecording(null);
      
      if (uri) {
        // Set audioUri first to ensure it's available when ReviewScreen renders
        setAudioUri(uri);
        
        // On iOS, use a small delay to ensure state updates are applied before rendering ReviewScreen
        // This prevents the component from rendering with undefined props
        if (Platform.OS === 'ios') {
          setTimeout(() => {
            setShowReview(true);
          }, IOS_DELAYS.STATE_SETTLE);
        } else {
          // On Android, state updates are synchronous, so we can show immediately
          setShowReview(true);
        }
      } else {
        console.error('No URI returned from recording');
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert(
        'Recording Error',
        'Unable to stop recording. Your audio may not have been saved. Please try recording again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancel = () => {
    // Haptic feedback for cancelling
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (recording) {
      recording.stopAndUnloadAsync();
      setRecording(null);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRecording(false);
    setShowReview(false);
    setAudioUri(null);
    setRecordingDuration(0);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}.${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const handleSaveComplete = async (entry: Entry) => {
    setShowReview(false);
    setAudioUri(null);
    setEditingEntry(null);
    await loadTodaysEntry(); // Reload to show the card
  };

  const handleEdit = () => {
    if (todaysEntry) {
      setEditingEntry(todaysEntry);
      setShowReview(true);
    }
  };

  const handleDelete = () => {
    if (!todaysEntry) return;

    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete today\'s moment? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete audio and photo files first
              if (todaysEntry.audio_local_uri) {
                try {
                  await deleteFile(todaysEntry.audio_local_uri);
                } catch (error) {
                  console.error('Error deleting audio file:', error);
                  // Continue even if file deletion fails
                }
              }
              if (todaysEntry.photo_local_uri) {
                try {
                  await deleteFile(todaysEntry.photo_local_uri);
                } catch (error) {
                  console.error('Error deleting photo file:', error);
                  // Continue even if file deletion fails
                }
              }
              
              // Delete from database
              await deleteEntry(todaysEntry.id);
              
              // Clear state immediately
              setTodaysEntry(null);
              
              // Small delay to let database finish processing
              await new Promise(resolve => setTimeout(resolve, DB_DELAYS.RETRY));
              
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete entry. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Audio playback for today's entry
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Split transcript into words when it changes
  useEffect(() => {
    if (todaysEntry?.transcript) {
      const transcriptWords = todaysEntry.transcript
        .split(/\s+/)
        .filter(word => word.length > 0);
      setWords(transcriptWords);
      // Initialize animations for each word
      transcriptWords.forEach((_, index) => {
        if (!wordAnimations.current[index]) {
          wordAnimations.current[index] = new Animated.Value(1);
        }
      });
    } else {
      setWords([]);
      wordAnimations.current = {};
    }
    setCurrentWordIndex(-1);
  }, [todaysEntry?.transcript]);

  // Auto-scroll to current word when it changes
  useEffect(() => {
    if (isPlaying && currentWordIndex >= 0 && captionScrollViewRef.current) {
      const wordY = wordPositions.current[currentWordIndex];
      if (wordY !== undefined) {
        // Scroll to keep the word visible, with some padding from top
        const scrollOffset = wordY - 60; // 60px padding from top
        captionScrollViewRef.current.scrollTo({
          y: Math.max(0, scrollOffset),
          animated: true,
        });
      }
    }
  }, [currentWordIndex, isPlaying]);

  // Animate card expansion when playing
  useEffect(() => {
    // Skip animation on initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (isPlaying) {
      // Expand to full screen
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
      // Contract back to normal
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

  // Animate word highlighting
  useEffect(() => {
    if (currentWordIndex >= 0 && currentWordIndex < words.length) {
      // Animate current word
      Animated.spring(wordAnimations.current[currentWordIndex] || new Animated.Value(1), {
        toValue: 1.05,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }).start();

      // Reset previous word
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

  // Calculate caption height based on available space
  const calculateCaptionHeight = () => {
    if (!isPlaying) return 120;
    const bottomSectionPadding = 16 + 32; // pt-4 (16px) + pb-8 (32px)
    const buttonsRowHeight = 48; // Medium button height
    const sectionGap = 16; // gap-4
    const imageHeight = todaysEntry?.photo_local_uri ? screenWidth : 0; // Square image or none
    const tabBarHeight = 49 + insets.bottom; // Tab bar (49px) + safe area bottom
    const extraPaddingAdjustment = !todaysEntry?.photo_local_uri && isPlaying ? 16 : 0; // Subtract 16px when no photo and playing
    const availableHeight = screenHeight - imageHeight - bottomSectionPadding - buttonsRowHeight - sectionGap - tabBarHeight - extraPaddingAdjustment;
    return Math.max(120, availableHeight - 20); // -20 for some buffer
  };

  const playSound = async () => {
    if (!todaysEntry?.audio_local_uri) {
      return;
    }

    try {
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          
          // Use actual status.isPlaying instead of state variable (they might be out of sync)
          const actuallyPlaying = status.isLoaded && status.isPlaying;
          
          if (actuallyPlaying || isPlaying) {
            try {
              await sound.pauseAsync();
              setIsPlaying(false);
              setCurrentWordIndex(-1);
            } catch (pauseError) {
              // If pause fails, sound is likely invalid - recreate it
              setSound(null);
              setIsPlaying(false);
              setCurrentWordIndex(-1);
              // Fall through to create new sound
            }
          } else {
            try {
              if (status.isLoaded) {
                // Reset position if at the end (positionMillis >= durationMillis)
                // didJustFinish is only true in the callback, not when checking status later
                if (status.positionMillis !== undefined && 
                    status.durationMillis !== undefined &&
                    status.positionMillis >= status.durationMillis) {
                  await sound.setPositionAsync(0);
                }
              }
              await sound.playAsync();
              setIsPlaying(true);
              
              // Re-set the status update callback for existing sound
              sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded) {
                  if (status.didJustFinish) {
                    setIsPlaying(false);
                    setCurrentWordIndex(-1);
                  } else if (status.positionMillis !== undefined) {
                    setWords((currentWords) => {
                      if (currentWords.length > 0) {
                        const totalDuration = status.durationMillis || (todaysEntry.duration_seconds || 0) * 1000;
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
              // If play fails, sound is likely invalid - recreate it
              setSound(null);
              setIsPlaying(false);
              setCurrentWordIndex(-1);
              // Fall through to create new sound
            }
          }
        } catch (statusError) {
          // Sound is invalid, clear it and create a new one
          setSound(null);
          setIsPlaying(false);
          setCurrentWordIndex(-1);
          // Fall through to create new sound
        }
      }
      
      // If sound is null (either didn't exist or was invalidated), create new one
      if (!sound) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: todaysEntry.audio_local_uri },
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
              // Calculate which word should be highlighted based on playback position
              // Access words from state using a function to get current value
              setWords((currentWords) => {
                if (currentWords.length > 0) {
                  const totalDuration = status.durationMillis || (todaysEntry.duration_seconds || 0) * 1000;
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
      console.error('[playSound] Error playing sound:', error);
      Alert.alert(
        'Playback Error',
        'Unable to play audio. The file may be missing or corrupted.',
        [{ text: 'OK' }]
      );
    }
  };

  if (showReview && (audioUri || editingEntry)) {
    return (
      <ReviewScreen
        audioUri={audioUri || undefined}
        duration={duration}
        prompt={dailyPrompt}
        existingEntry={editingEntry || undefined}
        onCancel={() => {
          setShowReview(false);
          setAudioUri(null);
          setEditingEntry(null);
        }}
        onComplete={handleSaveComplete}
      />
    );
  }

  // Show today's entry card if it exists
  if (todaysEntry && !isRecording) {
    const entryDate = new Date(todaysEntry.recorded_at);
    const formattedDate = formatDateWithOrdinal(entryDate);
    
    return (
      <Animated.View 
        className="flex-1 flex-col justify-center bg-surface-strong dark:bg-surface-strong-dark"
        style={{
          paddingHorizontal: paddingAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 24], // 0 = no padding, 1 = px-6 (24px)
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
                outputRange: [screenWidth, screenWidth - 48], // Full width when playing, normal when not
              }),
              marginHorizontal: cardScaleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0], // Negative margin to expand beyond padding when playing
              }),
              // Add height for full-screen expansion
              ...(isPlaying ? {
                height: screenHeight,
              } : {}),
              borderRadius: borderRadiusAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 12],
              }),
            }}
          >
              {/* Image Section - Only show if photo exists */}
              {todaysEntry.photo_local_uri && (
                <View className="w-full" style={{ aspectRatio: 1 }}>
                  <Image 
                    source={{ uri: todaysEntry.photo_local_uri }} 
                    className="w-full h-full"
                    style={{ resizeMode: 'cover' }}
                  />
                </View>
              )}

              {/* Bottom Section */}
              <View 
                className="flex-col items-start self-stretch gap-4 px-4 pb-8"
                style={{
                  paddingTop: !todaysEntry.photo_local_uri && isPlaying ? 64 : 16, // pt-16 (64px) when no photo and playing, pt-4 (16px) otherwise
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
          outputRange: [0, 1], // 0 = collapsed, 1 = normal
        }),
      },
    ],
    overflow: 'hidden',
  }}
>
                <Text className="text-sm font-semibold text-text-muted dark:text-text-muted-dark">
                  {formattedDate}
                </Text>
                <View className="w-1 h-1 rounded-full bg-text-muted dark:bg-text-muted-dark" />
                <Text className="text-sm font-semibold text-text-muted dark:text-text-muted-dark">
                  {formatDurationShort(todaysEntry.duration_seconds || 0)}
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
                        outputRange: [-24, 0], // Move up 24px when playing, 0 = normal
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
                <Animated.View 
                  className="flex-row gap-4"
                  style={{
                    opacity: promptOpacityAnim,
                  }}
                >
                  <ButtonIcon
                    onPress={handleEdit}
                    icon="ic-edit.svg"
                    size="medium"
                  />
                  <ButtonIcon
                    onPress={handleDelete}
                    icon="ic-delete.svg"
                    size="medium"
                  />
                </Animated.View>
              </Animated.View>

              {/* Prompt and Transcript Section */}
              <View className="flex-col items-start self-stretch gap-3">
                {todaysEntry.prompt && (
                  <Animated.View
                    style={{
                      opacity: promptOpacityAnim,
                      transform: [
                        {
                          scaleY: promptOpacityAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1], // 0 = collapsed, 1 = normal
                          }),
                        },
                      ],
                      overflow: 'hidden',
                    }}
                  >
                    <Text className="font-bold text-center text-text-brand dark:text-text-brand-dark">
                      {todaysEntry.prompt}
                    </Text>
                  </Animated.View>
                )}
                <Animated.View
                  style={{
                    transform: [
                      {
                        translateY: promptOpacityAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-40, 0], // Move up 40px when playing, 0 = normal (adjust based on prompt height)
                        }),
                      },
                    ],
                  }}
                >
                {isPlaying && words.length > 0 ? (
                  // Caption animation when playing
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
                                ? '#bef264' // lime-300
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
                  // Static transcript when not playing
                  todaysEntry.transcript && (
                    <Text 
                      className="text-2xl font-serif-semibold text-text-primary dark:text-text-primary-dark"
                      numberOfLines={4}
                      ellipsizeMode="tail"
                    >
                      {todaysEntry.transcript}
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

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark p-6">
      {isRecording ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-text-secondary dark:text-text-secondary-dark bg-surface-brand-weak dark:bg-surface-brand-weak-dark font-semibold text-sm text-center py-2 px-4 rounded-full mt-16">
            {dailyPrompt || 'Loading...'}
          </Text>

          {/* Prompt Section with Timer and Waveform */}
          <View className="flex-1 w-full rounded-lg bg-surface dark:bg-surface-dark justify-center items-center mb-1 p-5">
            {/* Timer */}
            <View className="flex-row items-center justify-center mb-12">
              <Animated.View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: colors.danger,
                  transform: [{ scale: pulseAnim }],
                  marginRight: 12,
                }}
              />
              <View className="w-[200px] items-left">
                <Text 
                  className="text-text-primary dark:text-text-primary-dark text-6xl font-sans-semibold py-2" 
                  style={{ textAlign: 'left', fontVariant: ['tabular-nums'] }}
                >
                  {formatDuration(recordingDuration)}
                </Text>
              </View>
            </View>

            {/* Waveform */}
            <View className="flex-row items-end justify-center gap-1" style={{ height: 60 }}>
              {waveformAnims.map((anim, i) => (
                <Animated.View
                  key={i}
                  className="bg-button-primary dark:bg-button-primary-dark rounded-full"
                  style={{
                    width: 3,
                    height: anim,
                  }}
                />
              ))}
            </View>
          </View>

          {/* Bottom: Cancel and Stop buttons */}
          <View className="flex-row gap-3 w-full">
            <View className="flex-1">
              <ButtonSecondary onPress={handleCancel} title="Cancel" iconLeft="ic-close.svg" size="large" />
            </View>
            <View className="flex-1">
              <ButtonStop onPress={stopRecording} title="Stop" iconLeft="ic-stop.svg" size="large" />
            </View>
          </View>
        </View>
      ) : (
        <View className="flex-1 justify-center items-center">
          {/* Prompt Section */}
          <Text className="text-sm text-text-muted dark:text-text-muted-dark font-semibold">
            {formatDateWithOrdinal(new Date())}
          </Text>
          <Text className="text-4xl text-text-primary dark:text-text-primary-dark font-serif-semibold text-center pt-3 mb-8">
            {dailyPrompt || 'Loading...'}
          </Text>

          {/* Record Button */}
          <View className="w-full flex-row items-center justify-center h-20 border-2 border-border-button-primary dark:border-border-button-primary-dark bg-transparent dark:bg-transparent p-1.5 rounded-full">
            <TouchableOpacity
              onPress={startRecording}
              activeOpacity={0.9}
              className="flex-1 w-full h-full"
            >
              <Gradient name="button-hero-fill" className="flex-1 flex-row items-center justify-center w-full h-full rounded-full overflow-hidden">
                <View className="w-6 h-6 mr-3 bg-accent-orange dark:bg-accent-orange-dark rounded-full" />
                <Text className="text-lg text-text-primary dark:text-text-primary font-semibold">
                  Record Moment
                </Text>
              </Gradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

