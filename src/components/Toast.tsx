import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Icon } from '@components/Icon';
import { useTheme } from '@hooks/useTheme';

interface ToastProps {
  visible: boolean;
  message: string;
  duration?: number;
  onHide?: () => void;
}

export function Toast({ visible, message, duration = 2000, onHide }: ToastProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Reset when hidden
      opacity.setValue(0);
      translateY.setValue(-20);
    }
  }, [visible, duration, onHide, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
        opacity,
        transform: [{ translateY }],
      }}
      pointerEvents="none"
    >
      <View
        className="bg-surface-strong dark:bg-surface-strong-dark rounded-full px-4 py-3 flex-row items-center gap-2 shadow-lg"
        style={{
          backgroundColor: colors.surfaceStrong,
        }}
      >
        <Icon name="ic-tick" size={18} color="textSecondary" />
        <Text className="font-sans-medium text-base text-text-secondary dark:text-text-secondary-dark">
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
