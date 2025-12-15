import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, Alert, Platform, Image, ScrollView, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { ReviewScreen } from './ReviewScreen';
import { ButtonSecondary } from '@components/ButtonSecondary';
import { ButtonStop } from '@components/ButtonStop';
import { ButtonPrimary } from '@components/ButtonPrimary';
import { ButtonIcon } from '@components/ButtonIcon';
import { ShadowBox } from '@components/ShadowBox';
import { EntryEditModal } from '@components/EntryEditModal';
import { EditTranscriptModal } from '@components/EditTranscriptModal';
import { Toast } from '@components/Toast';
import { getDailyPrompt } from '@utils/prompts';
import { getTodaysEntry, deleteEntry, updateEntry } from '@db/queries';
import { Entry } from '@db/types';
import { deleteFile, savePhotoFile } from '@utils/storage';
import { useTheme } from '@hooks/useTheme';
import { DB_DELAYS, IOS_DELAYS, ANIMATION } from '@utils/constants';
import { formatDateWithOrdinal } from '@utils/dateFormat';
import Gradient from '@components/Gradient';
import * as Haptics from 'expo-haptics';

export default function RecordScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const { colors } = useTheme();
  const [dailyPrompt, setDailyPrompt] = useState<string>('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [todaysEntry, setTodaysEntry] = useState<Entry | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const waveformIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveformAnims = useRef(
    Array.from({ length: 30 }, () => new Animated.Value(Math.random() * 50 + 10))
  ).current;

  // Audio playback state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [words, setWords] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  // Animation refs for transcript
  const wordAnimations = useRef<{ [key: number]: Animated.Value }>({});
  const wordPositions = useRef<{ [key: number]: number }>({});
  const captionScrollViewRef = useRef<ScrollView | null>(null);
  const promptHeightRef = useRef<number>(0);
  const dateDurationHeightRef = useRef<number>(0);
  const promptAndDateHeightRef = useRef<number>(0);
  const isFirstRender = useRef(true);

  // Screen dimensions
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Animation values
  const promptOpacityAnim = useRef(new Animated.Value(1)).current;
  const transcriptTranslateAnim = useRef(new Animated.Value(0)).current;
  const ANIMATION_DURATION = 300;
  const TRANSLATE_OFFSET = 20;


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

  // Initialize words from transcript
  useEffect(() => {
    if (todaysEntry?.transcript) {
      const transcriptWords = todaysEntry.transcript.split(/\s+/).filter(word => word.length > 0);
      setWords(transcriptWords);
      transcriptWords.forEach((_, index) => {
        if (!wordAnimations.current[index]) {
          wordAnimations.current[index] = new Animated.Value(1);
        }
      });
    }
  }, [todaysEntry?.transcript]);

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

  // Calculate caption height based on available space
  const calculateCaptionHeight = () => {
    if (!isPlaying) return 120;
    const imageHeight = todaysEntry?.photo_local_uri ? screenWidth : 0;
    const topPadding = 108;
    const buttonRowHeight = 60;
    const bottomPadding = 24;
    const promptHeight = promptHeightRef.current || 0;
    const availableHeight = screenHeight - imageHeight - topPadding - buttonRowHeight - bottomPadding - promptHeight;
    return Math.max(120, availableHeight - 20);
  };

  // Animate prompt fade and transcript translate when playing
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (isPlaying) {
      Animated.parallel([
        Animated.timing(promptOpacityAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(transcriptTranslateAnim, {
          toValue: -(promptAndDateHeightRef.current - TRANSLATE_OFFSET),
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(promptOpacityAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(transcriptTranslateAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
      setCurrentWordIndex(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);


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

  const handleSaveComplete = async (_entry: Entry) => {
    setShowReview(false);
    setAudioUri(null);
    setEditingEntry(null);
    await loadTodaysEntry(); // Reload to show the card
  };

  const handleEdit = () => {
    if (todaysEntry) {
      setShowEditModal(true);
    }
  };

  const handleDelete = () => {
    if (!todaysEntry) return;
    setShowEditModal(false);

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

  const handleRemoveReplaceImage = async () => {
    if (!todaysEntry) return;
    setShowEditModal(false);

    Alert.alert(
      'Image Options',
      'Choose an option',
      [
        {
          text: 'Remove Image',
          style: 'destructive',
          onPress: async () => {
            try {
              if (todaysEntry.photo_local_uri) {
                try {
                  await deleteFile(todaysEntry.photo_local_uri);
                } catch (error) {
                  console.error('Error deleting photo file:', error);
                }
              }
              const updated = await updateEntry(todaysEntry.id, {
                photo_local_uri: null,
              });
              if (updated) {
                setTodaysEntry(updated);
              }
            } catch (error) {
              console.error('Error removing image:', error);
              Alert.alert('Error', 'Failed to remove image. Please try again.');
            }
          },
        },
        {
          text: 'Replace Image',
          onPress: async () => {
            try {
              Alert.alert(
                'Choose Source',
                'Select image source',
                [
                  {
                    text: 'Camera',
                    onPress: async () => {
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
                          await handleImageSelected(result.assets[0].uri);
                        }
                      } catch (error) {
                        console.error('Error taking photo:', error);
                        Alert.alert(
                          'Camera Error',
                          'Unable to access camera. Please check app permissions and try again.',
                          [{ text: 'OK' }]
                        );
                      }
                    },
                  },
                  {
                    text: 'Photo Library',
                    onPress: async () => {
                      try {
                        const result = await ImagePicker.launchImageLibraryAsync({
                          mediaTypes: ImagePicker.MediaTypeOptions.Images,
                          allowsEditing: false,
                          quality: 0.8,
                        });

                        if (!result.canceled && result.assets[0]) {
                          await handleImageSelected(result.assets[0].uri);
                        }
                      } catch (error) {
                        console.error('Error picking image:', error);
                        Alert.alert(
                          'Photo Error',
                          'Unable to access your photo library. Please check app permissions and try again.',
                          [{ text: 'OK' }]
                        );
                      }
                    },
                  },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            } catch (error) {
              console.error('Error in replace image:', error);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleImageSelected = async (uri: string) => {
    if (!todaysEntry) return;

    try {
      // Delete old photo if it exists
      if (todaysEntry.photo_local_uri) {
        try {
          await deleteFile(todaysEntry.photo_local_uri);
        } catch (error) {
          console.error('Error deleting old photo file:', error);
        }
      }

      // Save new photo
      const photoFilename = `photo-${Date.now()}.jpg`;
      const savedPhotoUri = await savePhotoFile(uri, photoFilename);

      // Update entry
      const updated = await updateEntry(todaysEntry.id, {
        photo_local_uri: savedPhotoUri,
      });

      if (updated) {
        setTodaysEntry(updated);
      }
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image. Please try again.');
    }
  };

  const handleEditTranscript = () => {
    setShowEditModal(false);
    setShowTranscriptModal(true);
  };

  const handleSaveTranscript = async (text: string) => {
    if (!todaysEntry) return;

    try {
      const updated = await updateEntry(todaysEntry.id, {
        transcript: text || null,
      });
      if (updated) {
        setTodaysEntry(updated);
      }
    } catch (error) {
      console.error('Error updating transcript:', error);
      Alert.alert('Error', 'Failed to update transcription. Please try again.');
    }
  };

  const handleSaveToFavourites = async () => {
    if (!todaysEntry) return;

    try {
      const updated = await updateEntry(todaysEntry.id, {
        favourite: !todaysEntry.favourite,
      });
      if (updated) {
        setTodaysEntry(updated);
        // Only show toast when saving (not when unsaving)
        if (!todaysEntry.favourite) {
          setShowToast(true);
        }
      }
    } catch (error) {
      console.error('Error saving to favourites:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    }
  };

  const playEntry = async () => {
    if (!todaysEntry?.audio_local_uri) return;

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
      } else {
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
      console.error('Error playing audio:', error);
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

  // Show today's entry detail view if it exists
  if (todaysEntry && !isRecording) {
    return (
      <Gradient className="flex-1">
        {/* Tick Badge - Top Center */}
        <View className="flex-row justify-center items-start pt-16 pb-4">
          <View className="flex-col bg-border-button-primary dark:bg-border-button-primary-dark border-b-4 border-border-button-primary dark:border-border-button-primary-dark justify-start items-start rounded-xl">
            <View
              className=" rounded-xl border-2 border-border-button-primary dark:border-border-button-primary-dark flex-row bg-button-primary dark:bg-button-primary-dark justify-center items-center self-stretch gap-2 px-3 py-2"
              
            >
              <Svg
                width={20}
                height={20}
                viewBox="0 0 20 20"
                fill="none"
                preserveAspectRatio="none"
              >
                <Path
                  d="M20 9.50909L17.7818 6.98182L18.0909 3.63636L14.8091 2.89091L13.0909 0L10 1.32727L6.90909 0L5.19091 2.89091L1.90909 3.62727L2.21818 6.97273L0 9.50909L2.21818 12.0364L1.90909 15.3909L5.19091 16.1364L6.90909 19.0273L10 17.6909L13.0909 19.0182L14.8091 16.1273L18.0909 15.3818L17.7818 12.0364L20 9.50909ZM8.18182 14.0545L4.54545 10.4182L5.82727 9.13636L8.18182 11.4818L14.1727 5.49091L15.4545 6.78182L8.18182 14.0545Z"
                  fill={colors.textInverse}
                />
              </Svg>
              <Text className="flex-grow-0 text-text-primary dark:text-text-primary flex-shrink-0 text-sm font-sans-semibold text-left">
                {todaysEntry.created_at ? formatDateWithOrdinal(new Date(todaysEntry.created_at)) : formatDateWithOrdinal(new Date())}
              </Text>
            </View>
          </View>
        </View>

        {todaysEntry.photo_local_uri ? (
          <View className="relative px-3 pb-1">
            {/* Main Image on Top - Full Width */}
            <ShadowBox shadowSize="cardLarge" className="w-full relative rounded-xl overflow-hidden" style={{ aspectRatio: 1 }}>
              <Image
                source={{ uri: todaysEntry.photo_local_uri }}
                className="w-full h-full"
                style={{ resizeMode: 'cover' }}
              />
            </ShadowBox>
          </View>
        ) : null}

        <View className="flex-row items-center justify-between px-5 gap-5 mt-5">
          <ButtonPrimary
            onPress={playEntry}
            title={isPlaying ? "Pause" : "Listen"}
            iconLeft={isPlaying ? "ic-pause.svg" : "ic-play.svg"}
            size="medium"
          />

          <View className="flex-row gap-3">
            <ButtonIcon
              onPress={() => setShowEditModal(true)}
              icon="ic-edit"
              size="medium"
              variant="secondary"
            />
            <ButtonIcon
              onPress={handleSaveToFavourites}
              icon="ic-tab-saved"
              size="medium"
              variant={todaysEntry.favourite ? 'primary' : 'secondary'}
              iconColor={todaysEntry.favourite ? 'textButtonPrimary' : undefined}
            />
          </View>
        </View>

        <View className="flex-1 justify-top items-start w-full px-6 pt-4">
          {/* Prompt Text - Fades out when playing */}
          <Animated.View 
            className="flex-col items-left"
            style={{
              opacity: promptOpacityAnim,
            }}
            pointerEvents={isPlaying ? 'none' : 'auto'}
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              if (height > 0 && !isPlaying) {
                promptHeightRef.current = height;
                promptAndDateHeightRef.current = promptHeightRef.current + dateDurationHeightRef.current;
              }
            }}
          >
            {todaysEntry.prompt && (
              <Text className="font-sans-semibold text-lg text-text-brand dark:text-text-brand-dark mb-1">
                {todaysEntry.prompt}
              </Text>
            )}
          </Animated.View>

          {/* Transcript - Animates up and shows word-by-word when playing */}
          <Animated.View
            className="flex-col items-left"
            style={{
              transform: [
                {
                  translateY: transcriptTranslateAnim,
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
                            ? colors.accent
                            : 'transparent',
                          paddingHorizontal: 6,
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
              todaysEntry.transcript && (
                <Text className="font-serif-medium text-2xl text-text-primary dark:text-text-primary-dark mb-3">
                  {todaysEntry.transcript}
                </Text>
              )
            )}
          </Animated.View>

          {/* Date/Duration - Fades out when playing */}
          <Animated.View 
            className="flex-row items-center gap-2"
            style={{
              opacity: promptOpacityAnim,
            }}
            pointerEvents={isPlaying ? 'none' : 'auto'}
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              if (height > 0 && !isPlaying) {
                dateDurationHeightRef.current = height;
                promptAndDateHeightRef.current = promptHeightRef.current + dateDurationHeightRef.current;
              }
            }}
          >
            {todaysEntry.created_at && (
              <>
                <Text className="font-sans-medium text-text-muted dark:text-text-muted-dark">
                  {formatDateWithOrdinal(new Date(todaysEntry.created_at))}
                </Text>
                <View className="w-1 h-1 rounded-full bg-text-muted dark:text-text-muted-dark" />
              </>
            )}
            {todaysEntry.duration_seconds && (
              <Text className="font-sans-medium text-text-muted dark:text-text-muted-dark">
                {Math.round(todaysEntry.duration_seconds)}s
              </Text>
            )}
          </Animated.View>
        </View>

        <EntryEditModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          onRemoveReplaceImage={handleRemoveReplaceImage}
          onEditTranscript={handleEditTranscript}
          onDelete={handleDelete}
        />

        <EditTranscriptModal
          visible={showTranscriptModal}
          initialText={todaysEntry.transcript || ''}
          onClose={() => setShowTranscriptModal(false)}
          onSave={handleSaveTranscript}
        />

        <Toast
          visible={showToast}
          message="Moment saved!"
          duration={2000}
          onHide={() => setShowToast(false)}
        />
      </Gradient>
    );
  }

  return (
    <Gradient className="flex-1 p-6">
      {isRecording ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-text-button-primary dark:text-text-brand-dark bg-surface-brand-weak dark:bg-surface-brand-weak-dark font-semibold text-sm text-center py-2 px-4 rounded-full mt-16">
            {dailyPrompt || 'Loading...'}
          </Text>

          {/* Prompt Section with Timer and Waveform */}
          <View className="flex-1 w-full rounded-lg justify-center items-center mb-1 p-5">
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
                  className="bg-button-strong dark:bg-button-strong-dark rounded-full"
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
          <Text className="text-text-brand dark:text-text-brand-dark font-sans-semibold">
            {formatDateWithOrdinal(new Date())}
          </Text>
          <Text className="text-4xl text-text-primary dark:text-text-primary-dark font-serif-semibold text-center pt-3 mb-8">
            {dailyPrompt || 'Loading...'}
          </Text>

          {/* Record Button */}
            <View className="w-full flex-row items-center justify-center h-20 border-2 border-border-button-primary dark:border-border-button-primary-dark bg-button-strong dark:bg-button-strong-dark pb-1.5 rounded-full" >
              <TouchableOpacity
                onPress={startRecording}
                activeOpacity={0.9}
                className="flex-1 w-full h-full"
              >
                <View className="flex-1 flex-row items-center justify-center bg-button-primary dark:bg-button-primary-dark 
                border-b-2 border-x-2 border-border-button-primary dark:border-border-button-primary-dark w-full h-full rounded-full overflow-hidden">
                  <Text className="text-lg text-text-button-primary dark:text-text-button-primary-dark font-sans-semibold">
                    Record Moment
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
        </View>
      )}
    </Gradient>
  );
}

