import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Icon } from '@components/Icon';

interface ButtonStopProps {
  onPress: () => void;
  title: string;
  size?: 'small' | 'medium' | 'large'; // For future use
  className?: string;
  activeOpacity?: number;
  iconLeft?: string; // e.g., 'ic-stop.svg'
}

export function ButtonStop({ 
  onPress, 
  title, 
  size = 'medium',
  className = '',
  activeOpacity = 0.9,
  iconLeft
}: ButtonStopProps) {
  // Size-based styles (matching ButtonSecondary)
  const sizeStyles = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      textSize: 'text-base',
      iconSize: 16,
    },
    medium: {
      paddingVertical: 12, // h-12 = 48px total
      paddingHorizontal: 16,
      textSize: 'text-base',
      iconSize: 18,
    },
    large: {
      paddingVertical: 20, // py-6 = 24px
      paddingHorizontal: 32, // px-8 = 32px
      textSize: 'text-lg',
      iconSize: 20,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={activeOpacity}
      className={className}
    >
      <View 
        className="flex-row w-full justify-center rounded-full bg-button-stop dark:bg-button-stop-dark items-center"
        style={{ 
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
        }}
      >
        {iconLeft && (
          <Icon 
            name={iconLeft} 
            size={currentSize.iconSize} 
            color="accentRed" 
            style={{ marginRight: 8 }} 
          />
        )}
        <Text className={`${currentSize.textSize} text-text-primary dark:text-text-primary-dark font-semibold`}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

