import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';

import GalleryScreen from '../screens/GalleryScreen';
import AlbumsScreen from '../screens/AlbumsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PhotoViewerScreen from '../screens/PhotoViewerScreen';
import SafeShowScreen from '../screens/SafeShowScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabBarStyle = {
  backgroundColor: Colors.surfaceElevated,
  borderTopColor: Colors.surfaceBorder,
  paddingBottom: 8,
  paddingTop: 8,
  height: 60,
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, marginTop: 2 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, string> = {
            Gallery: focused ? 'images' : 'images-outline',
            Albums: focused ? 'bookmark' : 'bookmark-outline',
            Settings: focused ? 'settings' : 'settings-outline',
          };
          return <Ionicons name={(icons[route.name] ?? 'ellipse') as any} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Gallery" component={GalleryScreen} />
      <Tab.Screen name="Albums" component={AlbumsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isOnboarded } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!isOnboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="PhotoViewer" component={PhotoViewerScreen} options={{ animation: 'fade' }} />
            <Stack.Screen
              name="SafeShow"
              component={SafeShowScreen}
              options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
