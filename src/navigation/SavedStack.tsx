import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SavedScreen from '../screens/SavedScreen';
import EntryDetailScreen from '../screens/EntryDetailScreen';

const Stack = createNativeStackNavigator();

export default function SavedStack() {
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




