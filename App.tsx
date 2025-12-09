import React, { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import './global.css';

// Screens
import TimelineScreen from './src/screens/TimelineScreen';
import RecordScreen from './src/screens/RecordScreen';
import SettingsStack from './src/navigation/SettingsStack';

// Storage initialization
import { ensureDirectories } from './src/utils/storage';
import { useAppStore } from './src/store/useAppStore';
import { ensureDeviceId } from './src/utils/deviceId';
import { useTheme } from './src/hooks/useTheme';
import { loadThemePreference } from './src/utils/themeStorage';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();

export default function App() {
  const { loadTranscriptionSetting } = useAppStore();
  const { colorScheme, setColorScheme, colors } = useTheme();

  // Load DM Sans and Fraunces font families
  const [fontsLoaded, fontError] = useFonts({
    'DMSans-Regular': require('@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf'),
    'DMSans-Medium': require('@expo-google-fonts/dm-sans/500Medium/DMSans_500Medium.ttf'),
    'DMSans-SemiBold': require('@expo-google-fonts/dm-sans/600SemiBold/DMSans_600SemiBold.ttf'),
    'DMSans-Bold': require('@expo-google-fonts/dm-sans/700Bold/DMSans_700Bold.ttf'),
    'Fraunces-Regular': require('@expo-google-fonts/fraunces/400Regular/Fraunces_400Regular.ttf'),
    'Fraunces-Medium': require('@expo-google-fonts/fraunces/500Medium/Fraunces_500Medium.ttf'),
    'Fraunces-SemiBold': require('@expo-google-fonts/fraunces/600SemiBold/Fraunces_600SemiBold.ttf'),
    'Fraunces-Bold': require('@expo-google-fonts/fraunces/700Bold/Fraunces_700Bold.ttf'),
    'Fraunces-Black': require('@expo-google-fonts/fraunces/900Black/Fraunces_900Black.ttf'),
  });

  // Debug font loading
  useEffect(() => {
    if (fontError) {
      console.error('❌ Font loading error:', fontError);
    }
    if (fontsLoaded) {
      console.log('✅ All fonts loaded successfully');
      // Log which fonts are available
      const fontKeys = [
        'DMSans-Regular',
        'DMSans-Medium',
        'DMSans-SemiBold',
        'DMSans-Bold',
        'Fraunces-Regular',
        'Fraunces-Medium',
        'Fraunces-SemiBold',
        'Fraunces-Bold',
        'Fraunces-Black',
      ];
      console.log('📝 Fonts registered:', fontKeys);
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Initialize file directories and app settings on app start
    // Database will be initialized on first use via queries.ts getDb()
    const initApp = async () => {
      try {
        await ensureDirectories();
        await ensureDeviceId(); // Initialize device ID
        await loadTranscriptionSetting();
        
        // Load saved theme preference
        const savedTheme = await loadThemePreference();
        if (savedTheme) {
          // savedTheme is 'light' | 'dark', which matches setColorScheme's expected type
          setColorScheme(savedTheme);
        }
        
        console.log('App initialized: directories ready, device ID set');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    if (fontsLoaded) {
      initApp();
    }
  }, [fontsLoaded, loadTranscriptionSetting, setColorScheme]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      // Hide splash screen once fonts are loaded (or if there's an error)
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Don't render until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View 
      className={colorScheme === 'dark' ? 'dark' : ''} 
      style={{ flex: 1 }}
      onLayout={onLayoutRootView}
    >
      <SafeAreaProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: colors.accent,
              tabBarInactiveTintColor: colors.textMuted,
              tabBarStyle: {
                backgroundColor: colors.surface,
                borderTopColor:colors.surface,
              },
            }}
          >
            <Tab.Screen
              name="Timeline"
              component={TimelineScreen}
              options={{
                tabBarLabel: 'Timeline',
              }}
            />
            <Tab.Screen
              name="Record"
              component={RecordScreen}
              options={{
                tabBarLabel: 'Record',
              }}
            />
            <Tab.Screen
              name="Settings"
              component={SettingsStack}
              options={{
                tabBarLabel: 'Settings',
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </View>
  );
}


