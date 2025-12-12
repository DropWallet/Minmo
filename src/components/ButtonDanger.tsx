import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Icon } from '@components/Icon';

interface ButtonDangerProps {
  onPress: () => void;
  title: string;
  size?: 'small' | 'medium' | 'large'; // For future use
  className?: string;
  activeOpacity?: number;
  iconLeft?: string; // e.g., 'ic-close.svg'
  disabled?: boolean;
}

export function ButtonDanger({ 
  onPress, 
  title, 
  size = 'medium',
  className = '',
  activeOpacity = 0.9,
  iconLeft,
  disabled = false
}: ButtonDangerProps) {
  // Size-based styles (matching ButtonPrimary and ButtonSecondary)
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
      iconSize: 20,
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
      disabled={disabled}
    >
      <View 
        className={`bg-button-stop dark:bg-button-stop-dark flex-row justify-center rounded-full overflow-hidden items-center ${disabled ? 'opacity-60' : ''}`}
        style={{ 
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
        }}
      >
        {iconLeft && (
          <Icon 
            name={iconLeft} 
            size={currentSize.iconSize} 
            color="textButtonStop" 
            style={{ marginRight: 8 }} 
          />
        )}
        <Text className={`${currentSize.textSize} font-sans-semibold text-text-button-stop dark:text-text-button-stop-dark font-semibold`}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
