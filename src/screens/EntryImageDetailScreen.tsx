import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Alert, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { Animated as RNAnimated } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import Gradient from '@components/Gradient';
import { getEntry, updateEntry, deleteEntry } from '@db/queries';
import { Entry } from '@db/types';
import { ShadowBox } from '@/components/ShadowBox';
import { ButtonPrimary } from '@components/ButtonPrimary';
import { ButtonIcon } from '@components/ButtonIcon';
import { EntryEditModal } from '@components/EntryEditModal';
import { EditTranscriptModal } from '@components/EditTranscriptModal';
import { Toast } from '@components/Toast';
import { formatDateWithOrdinal } from '@utils/dateFormat';
import { DB_DELAYS } from '@utils/constants';
import { useTheme } from '@hooks/useTheme';
import { savePhotoFile, deleteFile } from '@utils/storage';

// Define route params type
type EntryImageDetailRouteParams = {
  EntryImageDetail: {
    entryId: string;
  };
};

export default function EntryImageDetailScreen() {
  const route = useRoute<RouteProp<EntryImageDetailRouteParams, 'EntryImageDetail'>>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const entryId = route.params?.entryId;
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [words, setWords] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const wordAnimations = useRef<{ [key: number]: RNAnimated.Value }>({});
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
  const promptOpacityAnim = useRef(new RNAnimated.Value(1)).current;
  const transcriptTranslateAnim = useRef(new RNAnimated.Value(0)).current;
  const ANIMATION_DURATION = 300;
  const TRANSLATE_OFFSET = 20; // Manual adjustment to prevent clipping

  const loadEntry = useCallback(async (retryCount = 0) => {
    if (!entryId) return;
    setLoading(true);
    
    try {
      if (retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, DB_DELAYS.INIT));
      }
      
      const data = await getEntry(entryId);
      if (data) {
        setEntry(data);
      } else {
        Alert.alert('Error', 'Entry not found', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Failed to load entry:', error);
      
      if (retryCount < 2 && error instanceof Error && 
          (error.message.includes('database') || error.message.includes('locked'))) {
        // Retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, DB_DELAYS.RETRY * (retryCount + 1)));
        return loadEntry(retryCount + 1);
      }
      
      Alert.alert('Error', 'Failed to load entry. Please try again.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  }, [entryId, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadEntry();
    }, [loadEntry])
  );

  // Initialize words from transcript
  useEffect(() => {
    if (entry?.transcript) {
      const transcriptWords = entry.transcript.split(/\s+/).filter(word => word.length > 0);
      setWords(transcriptWords);
      transcriptWords.forEach((_, index) => {
        if (!wordAnimations.current[index]) {
          wordAnimations.current[index] = new RNAnimated.Value(1);
        }
      });
    }
  }, [entry?.transcript]);

  // Animate word highlighting
  useEffect(() => {
    if (currentWordIndex >= 0 && currentWordIndex < words.length) {
      RNAnimated.spring(wordAnimations.current[currentWordIndex] || new RNAnimated.Value(1), {
        toValue: 1.05,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }).start();

      if (currentWordIndex > 0) {
        RNAnimated.spring(wordAnimations.current[currentWordIndex - 1] || new RNAnimated.Value(1), {
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
    const imageHeight = entry?.photo_local_uri ? screenWidth : 0; // aspectRatio: 1
    const topPadding = 108; // pt-[108px]
    const buttonRowHeight = 60; // Approximate button row height
    const bottomPadding = 24; // px-6 pt-4
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
      RNAnimated.parallel([
        RNAnimated.timing(promptOpacityAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        RNAnimated.timing(transcriptTranslateAnim, {
          toValue: -(promptAndDateHeightRef.current - TRANSLATE_OFFSET),
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      RNAnimated.parallel([
        RNAnimated.timing(promptOpacityAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        RNAnimated.timing(transcriptTranslateAnim, {
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

  const handleRemoveReplaceImage = async () => {
    if (!entry) return;
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
              if (entry.photo_local_uri) {
                try {
                  await deleteFile(entry.photo_local_uri);
                } catch (error) {
                  console.error('Error deleting photo file:', error);
                }
              }
              const updated = await updateEntry(entry.id, {
                photo_local_uri: null,
              });
              if (updated) {
                setEntry(updated);
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
    if (!entry) return;

    try {
      // Delete old photo if it exists
      if (entry.photo_local_uri) {
        try {
          await deleteFile(entry.photo_local_uri);
        } catch (error) {
          console.error('Error deleting old photo file:', error);
        }
      }

      // Save new photo
      const photoFilename = `photo-${Date.now()}.jpg`;
      const savedPhotoUri = await savePhotoFile(uri, photoFilename);

      // Update entry
      const updated = await updateEntry(entry.id, {
        photo_local_uri: savedPhotoUri,
      });

      if (updated) {
        setEntry(updated);
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
    if (!entry) return;

    try {
      const updated = await updateEntry(entry.id, {
        transcript: text || null,
      });
      if (updated) {
        setEntry(updated);
      }
    } catch (error) {
      console.error('Error updating transcript:', error);
      Alert.alert('Error', 'Failed to update transcription. Please try again.');
    }
  };

  const handleSaveToFavourites = async () => {
    if (!entry) return;

    try {
      const updated = await updateEntry(entry.id, {
        favourite: !entry.favourite,
      });
      if (updated) {
        setEntry(updated);
        // Only show toast when saving (not when unsaving)
        if (!entry.favourite) {
          setShowToast(true);
        }
      }
    } catch (error) {
      console.error('Error saving to favourites:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    }
  };

  const handleDelete = () => {
    if (!entry) return;
    setShowEditModal(false);

    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (entry.audio_local_uri) {
                try {
                  await deleteFile(entry.audio_local_uri);
                } catch (error) {
                  console.error('Error deleting audio file:', error);
                }
              }
              if (entry.photo_local_uri) {
                try {
                  await deleteFile(entry.photo_local_uri);
                } catch (error) {
                  console.error('Error deleting photo file:', error);
                }
              }
              await deleteEntry(entry.id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete entry. Please try again.');
            }
          },
        },
      ]
    );
  };

  const playEntry = async () => {
    if (!entry?.audio_local_uri) return;

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
      console.error('Error playing audio:', error);
    }
  };

  if (loading) {
    return (
      <Gradient className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </Gradient>
    );
  }

  if (!entry) {
    return (
      <Gradient className="flex-1 justify-center items-center">
        <Text className="text-text-muted dark:text-text-muted-dark">
          Entry not found
        </Text>
      </Gradient>
    );
  }

  return (
    <Gradient className="flex-1">
      {entry.photo_local_uri ? (
        <View className="relative px-3 pt-[108px] pb-1">
          {/* Main Image on Top - Full Width */}
          <ShadowBox shadowSize="cardLarge" className="w-full relative rounded-xl overflow-hidden" style={{ aspectRatio: 1 }}>
            <Animated.Image
              source={{ uri: entry.photo_local_uri }}
              className="w-full h-full "
              style={{ resizeMode: 'cover' }}
              // @ts-expect-error - sharedTransitionTag is supported in Reanimated v4 but types may not be updated
              sharedTransitionTag={`image-${entry.id}`}
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
            variant={entry.favourite ? 'primary' : 'secondary'}
            iconColor={entry.favourite ? 'textButtonPrimary' : undefined}
          />
        </View>
      </View>

      <View className="flex-1 justify-top items-start w-full px-6 pt-4">
        {/* Prompt Text - Fades out when playing */}
        <RNAnimated.View 
          className="flex-col items-left"
          style={{
            opacity: promptOpacityAnim,
          }}
          pointerEvents={isPlaying ? 'none' : 'auto'}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            if (height > 0 && !isPlaying) {
              promptHeightRef.current = height;
              // Update total height when prompt height changes
              promptAndDateHeightRef.current = promptHeightRef.current + dateDurationHeightRef.current;
            }
          }}
        >
          {entry.prompt && (
            <Text className="font-sans-semibold text-lg text-text-brand dark:text-text-brand-dark mb-1">
              {entry.prompt}
            </Text>
          )}
        </RNAnimated.View>

        {/* Transcript - Animates up and shows word-by-word when playing */}
        <RNAnimated.View
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
                    <RNAnimated.View
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
                    </RNAnimated.View>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            entry.transcript && (
              <Text className="font-serif-medium text-2xl text-text-primary dark:text-text-primary-dark mb-3">
                {entry.transcript}
              </Text>
            )
          )}
        </RNAnimated.View>

        {/* Date/Duration - Fades out when playing */}
        <RNAnimated.View 
          className="flex-row items-center gap-2"
          style={{
            opacity: promptOpacityAnim,
          }}
          pointerEvents={isPlaying ? 'none' : 'auto'}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            if (height > 0 && !isPlaying) {
              dateDurationHeightRef.current = height;
              // Update total height when date/duration height changes
              promptAndDateHeightRef.current = promptHeightRef.current + dateDurationHeightRef.current;
            }
          }}
        >
          {entry.created_at && (
            <>
              <Text className="font-sans-medium text-text-muted dark:text-text-muted-dark">
                {formatDateWithOrdinal(new Date(entry.created_at))}
              </Text>
              <View className="w-1 h-1 rounded-full bg-text-muted dark:text-text-muted-dark" />
            </>
          )}
          {entry.duration_seconds && (
            <Text className="font-sans-medium text-text-muted dark:text-text-muted-dark">
              {Math.round(entry.duration_seconds)}s
            </Text>
          )}
        </RNAnimated.View>
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
        initialText={entry.transcript || ''}
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

