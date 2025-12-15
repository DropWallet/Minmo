import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Icon } from '@components/Icon';

type ViewMode = 'list' | 'card' | 'grid';

interface ViewModeButtonsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  includeGrid?: boolean;
}

export function ViewModeButtons({ viewMode, onViewModeChange, includeGrid = false }: ViewModeButtonsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
      <View className="flex-row gap-2">
        {includeGrid && (
          <TouchableOpacity
            onPress={() => onViewModeChange('grid')}
            className={`px-4 py-2 rounded-full ${
              viewMode === 'grid'
                ? 'border-2 border-border-default dark:border-border-default bg-button-primary dark:bg-button-primary-dark'
                : 'bg-surface-trans dark:bg-surface-trans-dark border border-border-subtle dark:border-border-default-dark'
            }`}
          >
            <View className="flex-row items-center">
              <Icon 
                name="ic-grid" 
                size={16} 
                color={viewMode === 'grid' ? 'textButtonPrimary' : 'textMuted'} 
                style={{ marginRight: 8 }}
              />
              <Text className={`${
                viewMode === 'grid' ? 'text-text-button-primary dark:text-text-button-primary-dark' : 'text-text-muted dark:text-text-muted-dark'
              } text-sm font-sans-medium`}>Calendar</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => onViewModeChange('list')}
          className={`px-4 py-2 rounded-full ${
            viewMode === 'list'
              ? 'border-2 border-border-default dark:border-border-default bg-button-primary dark:bg-button-primary-dark'
              : 'bg-surface-trans dark:bg-surface-trans-dark border border-border-subtle dark:border-border-default-dark'
          }`}
        >
          <View className="flex-row items-center">
            <Icon 
              name="ic-list" 
              size={16} 
              color={viewMode === 'list' ? 'textButtonPrimary' : 'textMuted'} 
              style={{ marginRight: 8 }}
            />
            <Text className={`${
              viewMode === 'list' ? 'text-text-button-primary dark:text-text-button-primary-dark' : 'text-text-muted dark:text-text-muted-dark'
            } text-sm font-sans-medium`}>List</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onViewModeChange('card')}
          className={`px-4 py-2 rounded-full ${
            viewMode === 'card'
              ? 'border-2 border-border-default dark:border-border-default bg-button-primary dark:bg-button-primary-dark'
              : 'bg-surface-trans dark:bg-surface-trans-dark border border-border-subtle dark:border-border-default-dark'
          }`}
        >
          <View className="flex-row items-center">
            <Icon 
              name="ic-card" 
              size={16} 
              color={viewMode === 'card' ? 'textButtonPrimary' : 'textMuted'} 
              style={{ marginRight: 8 }}
            />
            <Text className={`${
              viewMode === 'card' ? 'text-text-button-primary dark:text-text-button-primary-dark' : 'text-text-muted dark:text-text-muted-dark'
            } text-sm font-sans-medium`}>Card</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

