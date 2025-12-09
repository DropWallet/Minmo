import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@hooks/useTheme';
import { gradients } from '../../themeconfig';
import type { ViewStyle, StyleProp } from 'react-native';

interface GradientProps {
  name: keyof typeof gradients;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export default function Gradient({ name, className, style, children }: GradientProps) {
  const { gradients: themeGradients } = useTheme();
  const gradient = themeGradients[name];
  
  if (!gradient) {
    console.warn(`Gradient "${name}" not found in themeconfig`);
    return null;
  }

  return (
    <View className={className} style={style}>
      <LinearGradient
        colors={gradient.colors as [string, string, ...string[]]}
        start={gradient.start}
        end={gradient.end}
        locations={gradient.locations as [number, number, ...number[]]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {children}
    </View>
  );
}
