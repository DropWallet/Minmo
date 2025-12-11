import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/SettingsScreen';
import SandboxScreen from '../screens/SandboxScreen';
import Sandbox2Screen from '../screens/Sandbox2Screen';
import { useTheme } from '../hooks/useTheme';

const Stack = createNativeStackNavigator();

export default function SettingsStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="SettingsMain"
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <Stack.Screen 
        name="SettingsMain" 
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Sandbox" 
        component={SandboxScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Sandbox2" 
        component={Sandbox2Screen}
        options={({ route }) => ({
          headerShown: true,
          headerTransparent: true,
          headerTitle: 'Toolbar',
          headerStyle: {
            backgroundColor: colors.surfaceTransFull,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerBlurEffect: 'light', // iOS blur effect
        })}
      />
    </Stack.Navigator>
  );
}

