import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Entry } from '@db/types';
import { formatDateWithOrdinal } from '@utils/dateFormat';
import { ButtonIcon } from '@components/ButtonIcon';
import { HighlightedText } from '@components/HighlightedText';

interface ListEntryCardProps {
  entry: Entry;
  onPress: () => void;
  onPlay: () => void;
  isPlaying: boolean;
  onBookmark?: () => void;
  searchQuery?: string;
}

export function ListEntryCard({ entry, onPress, onPlay, isPlaying, onBookmark, searchQuery }: ListEntryCardProps) {
  const entryDate = new Date(entry.created_at);
  const formattedDate = formatDateWithOrdinal(entryDate);
  const durationText = entry.duration_seconds ? `${Math.round(entry.duration_seconds)}s` : '';
  
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className="mb-4"
    >
      <View className="border-2 border-border-default dark:border-border-default-dark bg-surface-trans dark:bg-surface-trans-dark rounded-2xl p-4">
        <View className="flex-col gap-4 self-stretch">
          {/* Image at top */}
          {entry.photo_local_uri && (
            <View className="w-[88px] h-[88px] rounded-[9.51px] overflow-hidden">
              <Image
                source={{ uri: entry.photo_local_uri }}
                className="w-full h-full"
                style={{ resizeMode: 'cover' }}
              />
            </View>
          )}

          {/* Prompt and Transcript */}
          <View className="flex-col gap-0.5 self-stretch">
            <HighlightedText
              text={entry.prompt || 'Untitled Moment'}
              searchQuery={searchQuery}
              className="text-base font-sans-semibold text-text-brand dark:text-text-brand-dark"
              highlightClassName="font-sans-bold"
              numberOfLines={1}
              ellipsizeMode="tail"
            />
            {entry.transcript && (
              <HighlightedText
                text={entry.transcript}
                searchQuery={searchQuery}
                className="text-xl font-serif-medium text-text-primary dark:text-text-secondary-dark"
                highlightClassName="font-serif-bold"
                numberOfLines={2}
                ellipsizeMode="tail"
              />
            )}
          </View>

          {/* Bottom Row: Date/Duration and Play Button */}
          <View className="flex-row justify-between items-center self-stretch">
            <View className="flex-row items-center gap-2">
              <Text className="text-sm font-sans-semibold text-text-muted dark:text-text-muted-dark">
                {formattedDate}
              </Text>
              <View className="w-1 h-1 rounded-full bg-text-muted dark:text-text-muted-dark" />
              {durationText && (
                <Text className="text-sm font-sans-semibold text-text-muted dark:text-text-muted-dark">
                  {durationText}
                </Text>
              )}
            </View>
            <View className="flex-row items-center gap-2">
              {onBookmark && (
                <ButtonIcon
                  onPress={(e) => {
                    e?.stopPropagation();
                    onBookmark();
                  }}
                  icon="ic-tab-saved"
                  size="small"
                  variant={entry.favourite ? 'primary' : 'secondary'}
                  iconColor={entry.favourite ? 'textButtonPrimary' : undefined}
                />
              )}
              <ButtonIcon
                onPress={(e) => {
                  e?.stopPropagation();
                  onPlay();
                }}
                icon={isPlaying ? "ic-pause" : "ic-play-slim"}
                size="small"
                variant="primary"
              />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

