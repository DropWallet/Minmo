import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { seedTestData, clearAllEntries } from '@utils/seedTestData';
import { useAppStore } from '@store/useAppStore';
import { resetDatabase, nuclearReset } from '@db/queries';
import { useTheme } from '@hooks/useTheme';
import { saveThemePreference } from '@utils/themeStorage';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { transcriptionEnabled, setTranscriptionEnabled, loadTranscriptionSetting } = useAppStore();
  const [seeding, setSeeding] = useState(false);
  const { colorScheme, setColorScheme, colors } = useTheme();

  useEffect(() => {
    loadTranscriptionSetting();
  }, [loadTranscriptionSetting]);

  const handleTranscriptionToggle = (value: boolean) => {
    setTranscriptionEnabled(value);
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    // NativeWind's setColorScheme accepts 'light' | 'dark' | 'system'
    setColorScheme(theme);
    // Save null for system theme (for our storage utility)
    const themeValue: 'light' | 'dark' | null = theme === 'system' ? null : theme;
    await saveThemePreference(themeValue);
  };

  const handleSeedTestData = async () => {
    Alert.alert(
      'Seed Test Data',
      'This will create 60 days of test entries. This may take a moment. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Seed',
          onPress: async () => {
            setSeeding(true);
            try {
              await seedTestData(60);
              Alert.alert('Success', 'Test data created! Check the Timeline tab.');
            } catch (error) {
              console.error('Error seeding test data:', error);
              Alert.alert(
                'Error',
                'Unable to create test data. The database may be unavailable. Please try again later.',
                [{ text: 'OK' }]
              );
            } finally {
              setSeeding(false);
            }
          },
        },
      ]
    );
  };

  const handleClearAllEntries = async () => {
    Alert.alert(
      'Clear All Entries',
      'This will delete ALL entries from the database. This cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllEntries();
              Alert.alert('Success', 'All entries deleted!');
            } catch (error) {
              console.error('Error clearing entries:', error);
              Alert.alert(
                'Error',
                'Unable to clear entries. The database may be unavailable. Please try again later.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleResetDatabase = async () => {
    Alert.alert(
      'Reset Database',
      'This will delete the entire database and create a fresh one. ALL data will be lost. This cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Database',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetDatabase();
              Alert.alert('Success', 'Database reset successfully! The app will continue with a fresh database.');
            } catch (error) {
              console.error('Error resetting database:', error);
              Alert.alert(
                'Error',
                'Unable to reset database. Please restart the app and try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  // Handler for nuclear reset (delete everything)
  const handleNuclearReset = async () => {
    Alert.alert(
      '⚠️ Nuclear Reset',
      'This will DELETE EVERYTHING:\n\n• All recordings\n• All photos\n• All entries\n• Device ID\n\nThis cannot be undone. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await nuclearReset();
              Alert.alert(
                'Success',
                'All data has been deleted. The app will continue with a fresh start.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error during nuclear reset:', error);
              Alert.alert(
                'Error',
                'Failed to reset app. Please restart the app and try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-surface dark:bg-surface-dark">
      <View className="px-4 py-6">
        <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-semibold mb-8">Settings</Text>

        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text className="text-text-primary dark:text-text-primary-dark text-base font-medium">
                Transcription
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-sm mt-1">
                Audio is uploaded to MinMo&apos;s server for transcription. You can turn this off anytime.
              </Text>
            </View>
            <Switch
              value={transcriptionEnabled}
              onValueChange={handleTranscriptionToggle}
              trackColor={{ false: colors.borderSubtle, true: colors.accent }}
              thumbColor={transcriptionEnabled ? colors.accentStrong : colors.textMuted}
            />
          </View>
        </View>

        {/* Theme Selection */}
        <View className="mb-6 mt-6">
          <Text className="text-text-primary dark:text-text-primary-dark text-base font-medium mb-3">
            Theme
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-sm mb-3">
            Choose your preferred theme or follow your device settings
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleThemeChange('light')}
              className={`flex-1 rounded-lg p-3 border ${
                colorScheme === 'light'
                  ? 'bg-accent border-accent'
                  : 'bg-surface-strong dark:bg-surface-strong-dark border-border-subtle dark:border-border-subtle-dark'
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  colorScheme === 'light'
                    ? 'text-text-inverse dark:text-text-inverse-dark'
                    : 'text-text-primary dark:text-text-primary-dark'
                }`}
              >
                Light
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleThemeChange('dark')}
              className={`flex-1 rounded-lg p-3 border ${
                colorScheme === 'dark'
                  ? 'bg-accent border-accent'
                  : 'bg-surface-strong dark:bg-surface-strong-dark border-border-subtle dark:border-border-subtle-dark'
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  colorScheme === 'dark'
                    ? 'text-text-inverse dark:text-text-inverse-dark'
                    : 'text-text-primary dark:text-text-primary-dark'
                }`}
              >
                Dark
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleThemeChange('system')}
              className={`flex-1 rounded-lg p-3 border ${
                colorScheme === null
                  ? 'bg-accent border-accent'
                  : 'bg-surface-strong dark:bg-surface-strong-dark border-border-subtle dark:border-border-subtle-dark'
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  colorScheme === null
                    ? 'text-text-inverse dark:text-text-inverse-dark'
                    : 'text-text-primary dark:text-text-primary-dark'
                }`}
              >
                System
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-8 pt-8 border-t border-border-subtle">
          <Text className="text-text-muted dark:text-text-muted-dark text-sm">
            Account (coming soon)
          </Text>
        </View>

        <View className="mt-6 pt-6 border-t border-border-subtle">
          <Text className="text-text-muted dark:text-text-muted-dark text-sm">
            Export data (coming soon)
          </Text>
          <Text className="text-text-muted text-xs mt-2">
            Export functionality will be added in a future update to allow you to download all your moments.
          </Text>
        </View>

        {/* Dev Tools Section */}
        <View className="mt-8 pt-8 border-t border-border-subtle">
          <Text className="text-text-primary dark:text-text-primary-dark text-base font-semibold mb-4">
            Developer Tools
          </Text>
          
          <TouchableOpacity
            onPress={handleSeedTestData}
            disabled={seeding}
            className="bg-surface-strong dark:bg-surface-strong-dark rounded-lg p-4 mb-3 border border-border-subtle dark:border-border-subtle-dark"
            style={seeding && { opacity: 0.6 }}
          >
            <Text className="text-text-primary dark:text-text-primary-dark font-medium">
              {seeding ? 'Seeding test data...' : 'Seed Test Data (60 days)'}
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-1">
              Creates 60 days of sample entries for testing
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearAllEntries}
            className="bg-danger rounded-lg p-4 border border-border-subtle dark:border-border-subtle-dark mb-3"
          >
            <Text className="text-text-inverse dark:text-text-inverse-dark font-medium">Clear All Entries</Text>
            <Text className="text-text-inverse dark:text-text-inverse-dark text-xs mt-1 opacity-80">
              Delete all entries from the database
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResetDatabase}
            className="bg-danger rounded-lg p-4 border border-border-subtle dark:border-border-subtle-dark mb-3"
          >
            <Text className="text-text-inverse dark:text-text-inverse-dark font-medium">Reset Database</Text>
            <Text className="text-text-inverse dark:text-text-inverse-dark text-xs mt-1 opacity-80">
              Delete database and create a fresh one (fixes corruption)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNuclearReset}
            className="bg-danger rounded-lg p-4 border border-border-subtle dark:border-border-subtle-dark mb-3"
          >
            <Text className="text-text-inverse dark:text-text-inverse-dark font-medium">⚠️ Nuclear Reset</Text>
            <Text className="text-text-inverse dark:text-text-inverse-dark text-xs mt-1 opacity-80">
              Delete ALL data (database, files, device ID)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              try {
                // @ts-expect-error - navigation type doesn't include nested stack screens
                navigation.navigate('Sandbox');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
            className="bg-surface-strong dark:bg-surface-strong-dark rounded-lg p-4 border border-border-subtle dark:border-border-subtle-dark"
          >
            <Text className="text-text-primary dark:text-text-primary-dark font-medium">UI Sandbox</Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-1">
              Test UI components and layouts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              try {
                // @ts-expect-error - navigation type doesn't include nested stack screens
                navigation.navigate('Sandbox2');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
            className="bg-surface-strong dark:bg-surface-strong-dark rounded-lg p-4 border border-border-subtle dark:border-border-subtle-dark mt-3"
          >
            <Text className="text-text-primary dark:text-text-primary-dark font-medium">UI Sandbox 2</Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-1">
              Alternate sandbox for experiments
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-8 pt-8">
          <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center">
            MinMo v1.0.0
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

