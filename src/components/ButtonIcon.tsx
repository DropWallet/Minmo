import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Icon } from '@components/Icon';

interface ButtonIconProps {
  onPress: (e?: any) => void;
  icon: string; // e.g., 'ic-edit.svg'
  size?: 'small' | 'medium' | 'large';
  variant?: 'secondary' | 'primary';
  className?: string;
  activeOpacity?: number;
}

export function ButtonIcon({ 
  onPress, 
  icon,
  size = 'medium',
  variant = 'secondary',
  className = '',
  activeOpacity = 0.9
}: ButtonIconProps) {
  // Size-based styles - width and height must match
  const sizeStyles = {
    small: {
      width: 36,
      height: 36,
      padding: 9, // 36px / 4 = 9px padding
      iconSize: 14,
    },
    medium: {
      width: 48,
      height: 48,
      padding: 12, // 48px / 4 = 12px padding
      iconSize: 18,
    },
    large: {
      width: 64,
      height: 64,
      padding: 16, // 64px / 4 = 16px padding
      iconSize: 24,
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
        className={`rounded-full items-center justify-center ${
          variant === 'primary' 
            ? 'bg-button-primary dark:bg-button-primary-dark' 
            : 'bg-button-secondary border-2 border-border-subtle dark:bg-button-secondary-dark'
        }`}
        style={{ 
          width: currentSize.width,
          height: currentSize.height,
          padding: currentSize.padding,
        }}
      >
        <Icon 
          name={icon} 
          size={currentSize.iconSize} 
          color={variant === 'primary' ? 'textButtonPrimary' : 'textMuted'} 
        />
      </View>
    </TouchableOpacity>
  );
}




