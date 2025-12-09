import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '@hooks/useTheme';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const tailwindColors = require('../../tailwind.config.js').tailwindColors;

interface RecorderButtonProps {
  isRecording: boolean;
  onPress: () => void;
}

export function RecorderButton({ isRecording, onPress }: RecorderButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { colors } = useTheme();

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.button,
          {
            transform: [{ scale: pulseAnim }],
            backgroundColor: isRecording ? colors.danger : colors.accent,
          },
        ]}
      >
        <View style={styles.innerCircle}>
          {isRecording && <View style={styles.recordingDot} />}
        </View>
      </Animated.View>
      <Text className="text-text-primary dark:text-text-primary-dark text-center mt-4 font-medium">
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white overlay
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: tailwindColors.white, // White dot for recording indicator
  },
});


