import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TimelineScreen from '../screens/TimelineScreen';
import EntryDetailScreen from '../screens/EntryDetailScreen';

const Stack = createNativeStackNavigator();

export default function TimelineStack() {
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
        name="EntryDetail" 
        component={EntryDetailScreen}
        options={{ 
          headerShown: false,
          presentation: 'card',
          animation: 'default',
        }}
      />
    </Stack.Navigator>
  );
}

