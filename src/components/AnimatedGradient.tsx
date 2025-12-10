import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@hooks/useTheme';
import type { ViewStyle, StyleProp } from 'react-native';

interface AnimatedGradientProps {
  colors: string[]; // Light mode colors
  darkColors?: string[]; // Optional dark mode colors (defaults to dark equivalents)
  locations: number[]; // Initial locations (0-1 range)
  angle?: number; // Gradient angle in degrees (default: 167deg)
  duration?: number; // Animation duration in ms (default: 5000ms)
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export default function AnimatedGradient({
  colors,
  darkColors,
  locations,
  angle = 167,
  duration = 5000,
  className,
  style,
  children,
}: AnimatedGradientProps) {
  const { isDark } = useTheme();
  const animValue = useRef(new Animated.Value(0)).current;

  // Dark mode color equivalents
  const defaultDarkColors = [
    '#150422', // purple-900 (was purple-50)
    '#1C0946', // yellow-900 (was yellow-50)
    '#1F0D30', // purple-900 (was purple-50)
    '#12031E', // indigo-900 (was indigo-50)
  ];

  // Use dark mode colors if provided, otherwise use defaults
  const activeColors = isDark ? (darkColors || defaultDarkColors) : colors;

  // Convert angle to start/end coordinates
  const radians = (angle * Math.PI) / 200;
  const start = {
    x: 0.5 - Math.sin(radians) * 0.5,
    y: 0.5 + Math.cos(radians) * 0.5,
  };
  const end = {
    x: 0.5 + Math.sin(radians) * 0.5,
    y: 0.5 - Math.cos(radians) * 0.5,
  };

  // Use state to update locations (workaround since LinearGradient doesn't support animated values directly)
  const [currentLocations, setCurrentLocations] = React.useState(locations);

  useEffect(() => {
    // Create looping animation
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration,
          useNativeDriver: false, // locations can't use native driver
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    // Listen to animation value changes and update locations
    const listenerId = animValue.addListener(({ value }) => {
      const newLocations = locations.map((location, index) => {
        // Only animate middle colors (indices 1, 2, 3), keep first (0) and last (4) fixed
        if (index === 0 || index === locations.length - 1) {
          return location; // Keep outer positions fixed
        }
        // Cycle the location forward and wrap around for inner colors
        const shift = value * 0.15; // Adjust 0.3 to control shift amount
        return (location + shift) % 1;
      });
      setCurrentLocations(newLocations);
    });

    return () => {
      animation.stop();
      animValue.removeListener(listenerId);
    };
  }, [animValue, duration, locations]);

  return (
    <View className={className} style={style}>
      <LinearGradient
        colors={activeColors as [string, string, ...string[]]}
        start={start}
        end={end}
        locations={currentLocations as [number, number, ...number[]]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {children}
    </View>
  );
}

