import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@hooks/useTheme';
import { getGradients } from '../../themeconfig';
import type { ViewStyle, StyleProp } from 'react-native';

type GradientName = 'surface-metal' | 'button-border' | 'button-primary-fill' | 'button-hero-fill' | 'surface-card' | 'surface-card-inner';

interface GradientProps {
  name?: GradientName; // Optional: specify which gradient from themeconfig to use
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export default function Gradient({
  name,
  className,
  style,
  children,
}: GradientProps) {
  const { isDark } = useTheme();
  const gradients = getGradients(isDark);

  let activeColors: string[];
  let locations: number[];
  let start: { x: number; y: number };
  let end: { x: number; y: number };

  if (name && gradients[name]) {
    // Use gradient from themeconfig
    const gradient = gradients[name];
    activeColors = gradient.colors;
    locations = gradient.locations;
    start = gradient.start;
    end = gradient.end;
  } else {
    // Default to screen background gradient if no name provided
    // Light mode colors (same as AnimatedGradient starting colors)
    const lightColors = [
      '#FFFEF5', // purple-50
      '#DFFBF4', // yellow-50
      '#F2E5FF', // purple-50
      '#F0FDFA', // indigo-50
    ];

    // Dark mode colors (same as AnimatedGradient defaultDarkColors)
    const darkColors = [
      '#011D1D', // purple-900 (was purple-50)
      '#06282D', // yellow-900 (was yellow-50)
      '#00241B', // purple-900 (was purple-50)
      '#011D1D', // indigo-900 (was indigo-50)
    ];

    activeColors = isDark ? darkColors : lightColors;

    // Same locations as AnimatedGradient starting positions
    locations = [0.0125, 0.3022, 0.7123, 0.9287];

    // Same angle as AnimatedGradient (167 degrees)
    const angle = 167;
    const radians = (angle * Math.PI) / 200;
    start = {
      x: 0.5 - Math.sin(radians) * 0.5,
      y: 0.5 + Math.cos(radians) * 0.5,
    };
    end = {
      x: 0.5 + Math.sin(radians) * 0.5,
      y: 0.5 - Math.cos(radians) * 0.5,
    };
  }

  return (
    <View className={className} style={style}>
      <LinearGradient
        colors={activeColors as [string, string, ...string[]]}
        start={start}
        end={end}
        locations={locations as [number, number, ...number[]]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {children}
    </View>
  );
}
