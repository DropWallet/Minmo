import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '@hooks/useTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className,
}: ButtonProps) {
  const { colors } = useTheme();
  const baseStyle = 'px-6 py-3 rounded-lg items-center justify-center';
  const variantStyles = {
    primary: 'bg-accent',
    secondary: 'bg-surface-strong border border-border-default',
    ghost: 'bg-transparent',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseStyle} ${variantStyles[variant]} ${className || ''}`}
      style={[disabled && { opacity: 0.5 }]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.textInverse : colors.textPrimary} />
      ) : (
        <Text
          className={
            variant === 'primary'
              ? 'text-text-inverse font-semibold'
              : 'text-text-primary font-medium'
          }
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}


