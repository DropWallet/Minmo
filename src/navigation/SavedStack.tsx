import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SavedScreen from '../screens/SavedScreen';
import EntryImageDetailScreen from '../screens/EntryImageDetailScreen';
import { useTheme } from '../hooks/useTheme';

const Stack = createNativeStackNavigator();

export default function SavedStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="SavedMain"
      screenOptions={{
        headerShown: false,
        animation: 'default',
      }}
    >
      <Stack.Screen 
        name="SavedMain" 
        component={SavedScreen}
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








