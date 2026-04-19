import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Переконайся, що ці файли дійсно існують за цим шляхом!
import HomeScreen from '../src/screens/HomeScreen';
import SettingsScreen from '../src/screens/SettingsScreen';
import WardrobeScreen from '../src/screens/WardrobeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Wardrobe" component={WardrobeScreen} />
      </Stack.Navigator>
    </SafeAreaProvider>
  );
}