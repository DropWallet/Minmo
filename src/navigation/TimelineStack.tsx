import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TimelineScreen from '../screens/TimelineScreen';
import EntryImageDetailScreen from '../screens/EntryImageDetailScreen';
import { useTheme } from '../hooks/useTheme';

const Stack = createNativeStackNavigator();

export default function TimelineStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="TimelineMain"
      screenOptions={{
        headerShown: false,
        animation: 'default',
      }}
    >
      <Stack.Screen 
        name="TimelineMain" 
        component={TimelineScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="EntryImageDetail" 
        component={EntryImageDetailScreen}
        options={({ route: _route }) => ({
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerStyle: {
            backgroundColor: colors.surfaceTransFull,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerBlurEffect: 'light', // iOS blur effect
          presentation: 'card',
          animation: 'default',
        })}
      />
    </Stack.Navigator>
  );
}

