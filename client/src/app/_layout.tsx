import { Stack, Tabs } from "expo-router";

import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { useEffect, useRef, useCallback } from "react";
import { ActivityIndicator, StyleSheet, View, Platform, Alert } from 'react-native';
import '@/global.css';
import React from "react";
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LocationProvider } from "../context/LocationContext";
import { ProfileProvider } from "../context/ProfileContext";
import { ReferralProvider } from "../context/ReferralContext";
import { LocalizationProvider, useLocalization } from "../context/LocalizationContext";
import { ThemeProvider } from "../context/ThemeContext";
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import { useRouter } from 'expo-router';
import { setupNotificationListener } from '../utils/notifications';
import { initializeNotificationChannels, setupNotifeeEventHandler } from '../services/notifeeService';
import MapboxGL from '@rnmapbox/maps';

import '../localization/i18n';

SplashScreen.preventAutoHideAsync();


/**
 * AppContent component
 * Handles loading states for fonts and i18n initialization
 * Wrapped by LocalizationProvider to access localization context
 */
export async function setupAndroidChannel() {
  if (Platform.OS === 'android') {
    // Initialize Expo notification channel
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    
    // Initialize Notifee channels for rich notifications
    await initializeNotificationChannels();
  }
}

function AppContent() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
  });

  const { isLoading: isLocalizationLoading } = useLocalization();
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();

  // Initialize Mapbox for Android - disable telemetry for new architecture
  useEffect(() => {
    if (Platform.OS === 'android') {
      MapboxGL.setTelemetryEnabled(false);
      console.log('Mapbox telemetry disabled for Android');
    }
  }, []);

  // OTA Updates check
  const checkForOTAUpdate = useCallback(async () => {
    // Only check in production builds (not in development/Expo Go)
    if (__DEV__) {
      console.log('Skipping OTA update check in development mode');
      return;
    }

    try {
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        // Fetch the update
        await Updates.fetchUpdateAsync();
        
        // Option 1: Silent reload (uncomment if you want instant update)
        await Updates.reloadAsync();
        
        // Option 2: Ask user before reloading (better UX)
        // Alert.alert(
        //   'Update Available',
        //   'A new version has been downloaded. Restart now to apply the update?',
        //   [
        //     { text: 'Later', style: 'cancel' },
        //     { 
        //       text: 'Restart', 
        //       onPress: async () => {
        //         await Updates.reloadAsync();
        //       }
        //     },
        //   ]
        // );
      }
    } catch (error) {
      // Fail silently - don't disrupt user experience
      console.log('OTA update check failed:', error);
    }
  }, []);
  useEffect(() => {
  if (__DEV__) return;

  console.log('EXPO UPDATES DEBUG', {
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    updateId: Updates.updateId,
    channel: Updates.channel,
    runtimeVersion: Updates.runtimeVersion,
    isEnabled: Updates.isEnabled,
  });
}, []);
  // Check for OTA updates on app start
  useEffect(() => {
    checkForOTAUpdate();
  }, [checkForOTAUpdate]);

  useEffect(() => {
    // Hide splash screen only when both fonts and i18n are ready
    if (fontsLoaded && !isLocalizationLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLocalizationLoading]);

  // Set up notification response listener
  useEffect(() => {
    // Set up listener for when user taps on a notification
    const initNotifications = async() =>{
      try{
        await setupAndroidChannel();
        console.log('Notification channels initialized successfully');
      }catch(error){
        console.error("Failed to set up notification channel:", error);
      }
    }
    initNotifications(); 
    
    // Set up Expo notification listener
    notificationListener.current = setupNotificationListener(router);
    
    // Set up Notifee event handler for rich notifications
    let notifeeUnsubscribe: (() => void) | null = null;
    if (Platform.OS === 'android') {
      notifeeUnsubscribe = setupNotifeeEventHandler(router);
    }

    // Cleanup on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (notifeeUnsubscribe) {
        notifeeUnsubscribe();
      }
    };
  }, [router]);

  // Show loading indicator while fonts or i18n are initializing
  if (!fontsLoaded || isLocalizationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27AE60" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <ReferralProvider>
          <ProfileProvider>
            <LocationProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="profile" options={{ headerShown: false }} />
                <Stack.Screen 
                  name="notification-permission" 
                  options={{ 
                    headerShown: false,
                    presentation: 'modal',
                    animation: 'slide_from_bottom'
                  }} 
                />
                <Stack.Screen name="+not-found" />
              </Stack>
              <Toast />
              <StatusBar style="auto" />
            </LocationProvider>
          </ProfileProvider>
        </ReferralProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

/**
 * RootLayout component
 * Root of the application with LocalizationProvider wrapping everything
 * Ensures i18n is initialized before the app renders
 */

export default function RootLayout() {
  return (
    <LocalizationProvider>
      <AppContent />
    </LocalizationProvider>
  );
}
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});