import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { ReviewScreen } from './ReviewScreen';
import { ButtonSecondary } from '@components/ButtonSecondary';
import { ButtonStop } from '@components/ButtonStop';
import { getDailyPrompt } from '@utils/prompts';
import { getTodaysEntry, deleteEntry } from '@db/queries';
import { Entry } from '@db/types';
import { deleteFile } from '@utils/storage';
import { useTheme } from '@hooks/useTheme';
import { DB_DELAYS, IOS_DELAYS, ANIMATION } from '@utils/constants';
import { formatDateWithOrdinal } from '@utils/dateFormat';
import Gradient from '@components/Gradient';
import * as Haptics from 'expo-haptics';
import { EntryCard } from '@components/EntryCard';

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
    return (
      <Gradient className="flex-1">
        <EntryCard
          entry={todaysEntry}
          onEdit={handleEdit}
          onDelete={handleDelete}
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

