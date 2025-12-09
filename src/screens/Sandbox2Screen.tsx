import React from 'react';
import { View, Text } from 'react-native';
import Gradient from '../components/Gradient';
import { useTheme } from '@hooks/useTheme';

export default function Sandbox2Screen() {
  const { shadows } = useTheme();

  return (
    <View className="flex-1 justify-top items-center bg-surface dark:bg-surface-dark px-6 pt-16">
      <View className="bg-surface-brand-weak dark:bg-surface-brand-weak-dark py-2.5 px-4 rounded-full">
      <Text className="flex-1flex-row items-center justify-center text-text-secondary dark:text-text-secondary-dark font-medium text-center">
      Tell me one thing that made you laugh?
        </Text>
      </View>
      <View className="flex-1 justify-center items-center w-full rounded-2xl bg-surface dark:bg-surface-dark p-6">
        {/* Timer */}
        <View className="flex-1 flex-row items-center justify-center mb-12">
            <View className="w-6 h-6 mr-3 bg-accent-red dark:bg-accent-red-dark rounded-full"></View>
                <View>
                  <Text className="text-text-primary dark:text-text-primary-dark text-6xl font-sans">
                    00:00:00
                  </Text>
            </View>
        </View>
        {/* Timer */}
        <View className="w-full flex-row items-center justify-center gap-3">
            <View className="flex-1 flex-row items-center justify-center bg-button-secondary h-16 dark:bg-button-secondary-dark rounded-full">
            <Text className="text-text-secondary dark:text-text-secondary-dark text-lg font-sans-semibold">
                    Cancel
                  </Text>
            </View>
            <View className="flex-1 flex-row items-center justify-center bg-button-stop h-16 dark:bg-button-stop-dark rounded-full">
            <Text className="text-text-button-stop dark:text-text-button-stop-dark text-lg font-sans-semibold">
                    Done
                  </Text>
            </View>
            
            </View>
        
      </View>
    </View>
  );
}

