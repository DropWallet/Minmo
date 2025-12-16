import React from 'react';
import { Text, TextProps } from 'react-native';
import { highlightSearchTerms } from '@utils/textHighlight';
import { useTheme } from '@hooks/useTheme';

interface HighlightedTextProps extends Omit<TextProps, 'children'> {
  text: string;
  searchQuery?: string;
  className?: string;
  highlightClassName?: string;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

/**
 * Component that renders text with highlighted search terms
 * Highlights are shown with bold text and a background color
 */
export function HighlightedText({
  text,
  searchQuery,
  className = '',
  highlightClassName = '',
  numberOfLines,
  ellipsizeMode,
  ...textProps
}: HighlightedTextProps) {
  const { colors } = useTheme();
  
  // If no search query or text is empty, render normally
  if (!searchQuery || searchQuery.trim().length === 0 || !text) {
    return (
      <Text
        className={className}
        numberOfLines={numberOfLines}
        ellipsizeMode={ellipsizeMode}
        {...textProps}
      >
        {text}
      </Text>
    );
  }

  // Get highlighted segments
  const segments = highlightSearchTerms(text, searchQuery);

  return (
    <Text
      className={className}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      {...textProps}
    >
      {segments.map((segment, index) => {
        if (segment.isHighlight) {
          // Use theme accent color with opacity for background
          const highlightBgColor = colors.accent + '33'; // 33 = ~20% opacity in hex
          return (
            <Text
              key={index}
              className={highlightClassName || 'font-sans-bold'}
              style={{
                backgroundColor: highlightBgColor,
              }}
            >
              {segment.text}
            </Text>
          );
        }
        return <Text key={index}>{segment.text}</Text>;
      })}
    </Text>
  );
}

