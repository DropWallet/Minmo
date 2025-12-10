import React from 'react';
import { View, Platform } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import type { ViewStyle, StyleProp } from 'react-native';

interface ShadowBoxProps {
  shadowSize?: 'soft' | 'hard' | 'neumorphic' | 'metalInner' | 'buttonPrimary' | 'cardLarge' | 'cardSmall';
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  // Buffer space for shadow to render (default based on shadow size)
  buffer?: number;
}

export function ShadowBox({ 
  shadowSize = 'cardLarge', 
  className = '', 
  style,
  children,
  buffer 
}: ShadowBoxProps) {
  const { shadows, colors } = useTheme();
  
  // Calculate buffer based on shadow size if not provided
  const shadowBuffer = buffer ?? (shadowSize === 'cardLarge' ? 12 : shadowSize === 'cardSmall' ? 8 : 8);
  
  // Get shadow style
  const shadowStyleString = shadows[shadowSize as keyof typeof shadows] || shadows.soft;
  
  // Android needs elevation and a solid background color for elevation to work
  const androidShadowStyle = Platform.select({
    android: {
      elevation: shadowSize === 'cardLarge' ? 12 : shadowSize === 'cardSmall' ? 6 : shadowSize === 'buttonPrimary' ? 8 : 6,
      backgroundColor: colors.surface, // Solid background needed for elevation (Gradient will cover it)
      borderRadius: 8, // Match card radius
    },
    default: {},
  });
  
  // iOS uses boxShadow
  const iosShadowStyle = Platform.select({
    ios: {
      boxShadow: shadowStyleString,
    },
    default: {},
  });

  return (
    <View style={{ margin: shadowBuffer }}>
      <View 
        style={[
          iosShadowStyle,
          androidShadowStyle,
          style,
        ]}
        className={className}
      >
        {children}
      </View>
    </View>
  );
}

